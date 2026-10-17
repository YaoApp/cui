import { expect, test, type Page } from '@playwright/test'

/* 标签拖动换序的组件用例：位移不到 4 像素算点击，超过算拖动；
   落点画插入指示线；松手提交，顺序记本机；Escape 取消。 */

async function markSignedIn(page: Page) {
	await page.addInitScript(() =>
		localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() }))
	)
}

async function openTab(page: Page, address: string) {
	await page.locator('.browser__new').click()
	const field = page.locator('.browser').getByLabel('外部地址')
	await field.fill(address)
	await field.press('Enter')
	await expect(field).toHaveCount(0)
}

const labels = (page: Page) =>
	page.locator('.browser__tabs .browser__tab:not([data-hidden]) .browser__tab-label').allInnerTexts()

const boxOf = async (page: Page, label: string) => {
	const tab = page.locator('.browser__tabs .browser__tab:not([data-hidden])', { hasText: label }).first()
	return (await tab.boundingBox())!
}

test('reorders a tab by dragging and remembers the order after a reload', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')
	await openTab(page, 'b.com')
	expect(await labels(page)).toEqual(['首页', 'a.com', 'b.com'])

	/* 把 b.com 拖到最前：落点在首页标签中点的左侧 */
	const from = await boxOf(page, 'b.com')
	const home = await boxOf(page, '首页')
	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
	await page.mouse.down()
	await page.mouse.move(home.x + 4, from.y + from.height / 2, { steps: 8 })
	await expect(page.locator('.browser__tabs-indicator')).toHaveCount(1)
	await page.mouse.up()

	await expect.poll(() => labels(page)).toEqual(['b.com', '首页', 'a.com'])
	await page.reload()
	await expect.poll(() => labels(page)).toEqual(['b.com', '首页', 'a.com'])
})

test('a small move stays a click and Escape cancels a drag', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')
	await openTab(page, 'b.com')

	/* 位移 3 像素：不换序，仍然是一次激活 */
	const box = await boxOf(page, 'a.com')
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
	await page.mouse.down()
	await page.mouse.move(box.x + box.width / 2 + 3, box.y + box.height / 2, { steps: 2 })
	await page.mouse.up()
	expect(await labels(page)).toEqual(['首页', 'a.com', 'b.com'])
	await expect(
		page.locator('.browser__tabs .browser__tab:not([data-hidden])', { hasText: 'a.com' }).first().getByRole('tab')
	).toHaveAttribute('aria-selected', 'true')

	/* 拖到一半按 Escape：回到原位 */
	const from = await boxOf(page, 'b.com')
	const home = await boxOf(page, '首页')
	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
	await page.mouse.down()
	await page.mouse.move(home.x + 4, from.y + from.height / 2, { steps: 8 })
	await expect(page.locator('.browser__tabs-indicator')).toHaveCount(1)
	await page.keyboard.press('Escape')
	await page.mouse.up()
	await expect(page.locator('.browser__tabs-indicator')).toHaveCount(0)
	expect(await labels(page)).toEqual(['首页', 'a.com', 'b.com'])
})

test('a press on the close key does not start a drag', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')
	await openTab(page, 'b.com')

	const target = page.locator('.browser__tabs .browser__tab:not([data-hidden])', { hasText: 'b.com' }).first()
	const close = target.locator('.browser__tab-close')
	const closeBox = (await close.boundingBox())!
	await page.mouse.move(closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2)
	await page.mouse.down()
	await page.mouse.move(closeBox.x - 120, closeBox.y + closeBox.height / 2, { steps: 6 })
	await expect(page.locator('.browser__tabs-indicator')).toHaveCount(0)
	await page.mouse.up()
	/* 拖动没开始，b.com 仍在原位；这一次按下也没有关掉它，因为指针移出了关闭键 */
	expect(await labels(page)).toEqual(['首页', 'a.com', 'b.com'])
})

test('shows the new order while dragging and locks text selection', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')
	await openTab(page, 'b.com')

	const home = await boxOf(page, '首页')
	const from = await boxOf(page, 'b.com')
	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
	await page.mouse.down()
	await page.mouse.move(home.x + 4, from.y + from.height / 2, { steps: 8 })

	/* 拖动中：首页让位右移，换位后的次序先摆出来；文本选择被锁住 */
	await expect.poll(async () => (await boxOf(page, '首页')).x).toBeGreaterThan(home.x + 20)
	const locked = await page.evaluate(() => {
		const row = document.querySelector('.browser__tabs-row')!
		return { row: getComputedStyle(row).userSelect, body: document.body.style.userSelect }
	})
	expect(locked.row).toBe('none')
	expect(locked.body).toBe('none')

	/* 松手：顺序落在新位置上，让位留下的位移全部撤掉 */
	await page.mouse.up()
	await expect.poll(() => labels(page)).toEqual(['b.com', '首页', 'a.com'])
	const cleared = await page.evaluate(() =>
		Array.from(document.querySelectorAll('.browser__tab')).every(
			(element) => (element as HTMLElement).style.transform === ''
		)
	)
	expect(cleared).toBe(true)
})

test('lands the drop by the whole list when the strip holds a swapped segment', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	/* 三个中长标题：栏宽 400 下条上放得下首页与当前页两项，其余进菜单 */
	for (const address of ['alpha.example.com/one', 'beta.example.com/two', 'gamma.example.com/three']) {
		await openTab(page, address)
	}
	await page.waitForTimeout(400)

	const before = await labels(page)
	expect(before).toHaveLength(2)
	expect(before[0]).toBe('首页')

	/* 把首页拖到当前页之后：落点按整个数组算，首页应落到列表最末，而不是插到第二位 */
	const home = await boxOf(page, '首页')
	const active = await boxOf(page, before[1])
	await page.mouse.move(home.x + home.width / 2, home.y + home.height / 2)
	await page.mouse.down()
	await page.mouse.move(active.x + active.width + 30, home.y + home.height / 2, { steps: 10 })
	await page.mouse.up()

	/* 刷新后按整个数组重建：这一栏只放得下当前页，其余按数组次序列在菜单里。
	   首页落在最末，说明落点是按整个列表算的，没有只按可见那一段插 */
	await page.reload()
	await expect
		.poll(() => labels(page))
		.toEqual(['gamma.example.com/three'])
	await page.locator('.browser__bar > .browser__more').click()
	/* 菜单是弹层，挂载比点击晚一拍：先等条数到位再读文字，否则读到空数组（CI 机器慢时必现） */
	const menuLabels = page.locator('.browser__menu-item .browser__menu-label')
	await expect(menuLabels).toHaveCount(3)
	expect(await menuLabels.allInnerTexts()).toEqual([
		'alpha.example.com/one',
		'beta.example.com/two',
		'首页'
	])
})

test('keeps the strip when a tab already at the front is dropped at the front', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	for (const address of ['alpha.example.com/one', 'beta.example.com/two', 'gamma.example.com/three']) {
		await openTab(page, address)
	}
	await page.waitForTimeout(400)

	/* 条上是「首页 + 当前页」：把首页拖到最前面那一档等于原地不动，不该被推到隐藏项后面去 */
	const before = await labels(page)
	expect(before[0]).toBe('首页')
	const home = await boxOf(page, '首页')
	await page.mouse.move(home.x + home.width / 2, home.y + home.height / 2)
	await page.mouse.down()
	await page.mouse.move(home.x - 60, home.y + home.height / 2, { steps: 8 })
	await page.mouse.up()
	/* 落点等于原位：store 不写状态，那个「留到新次序进 DOM 再清」的时机也不会来，
	   位移与层级必须当场归零，否则被拖那一块会一直停在偏移位置上 */
	expect(
		await page.evaluate(
			() =>
				[...document.querySelectorAll('.browser__tab')].filter(
					(element) => (element as HTMLElement).style.transform !== '' || (element as HTMLElement).style.zIndex !== ''
				).length
		)
	).toBe(0)

	await page.reload()
	await expect.poll(() => labels(page)).toEqual(before)
	await page.locator('.browser__more').click()
	/* 同上：弹层挂载比点击晚一拍，先等条数到位 */
	const menuLabels = page.locator('.browser__menu-item .browser__menu-label')
	await expect(menuLabels).toHaveCount(2)
	expect(await menuLabels.allInnerTexts()).toEqual([
		'alpha.example.com/one',
		'beta.example.com/two'
	])
})

test('Escape cancels before the drop index changes', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')
	await openTab(page, 'b.com')
	const before = await labels(page)

	/* 越过 4 像素阈值但指针还没挪过任何中点：落点下标仍是原位，只有 Escape 能取消 */
	const from = await boxOf(page, 'b.com')
	await page.mouse.move(from.x + 10, from.y + from.height / 2)
	await page.mouse.down()
	await page.mouse.move(from.x + 40, from.y + from.height / 2, { steps: 5 })
	await expect(page.locator('.browser__tabs-indicator')).toHaveCount(1)
	await page.keyboard.press('Escape')
	await expect(page.locator('.browser__tabs-indicator')).toHaveCount(0)
	await page.mouse.up()

	expect(await labels(page)).toEqual(before)
	expect(
		await page.evaluate(
			() =>
				[...document.querySelectorAll('.browser__tab')].filter(
					(element) =>
						(element as HTMLElement).style.transform !== '' ||
						(element as HTMLElement).style.zIndex !== ''
				).length
		)
	).toBe(0)
})

test('does not flash the strip back to the old order while the drop lands', async ({ page }) => {	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')
	await openTab(page, 'b.com')

	const from = await boxOf(page, 'b.com')
	const home = await boxOf(page, '首页')
	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
	await page.mouse.down()
	await page.mouse.move(home.x + 4, from.y + from.height / 2, { steps: 8 })

	/* 拖动已起、松手之前起录：逐帧记下条上各块的次序、内联位移与最小不透明度，一直录到整理完 */
	await page.evaluate(() => {
		const samples: { order: string; cleared: boolean; minOpacity: number }[] = []
		;(window as unknown as { __frames: typeof samples }).__frames = samples
		const tick = () => {
			const row = document.querySelector('.browser__tabs-row')
			if (row) {
				const tabs = [...row.querySelectorAll<HTMLElement>('.browser__tab')]
				samples.push({
					order: tabs.map((element) => element.dataset.tabKey).join(','),
					cleared: tabs.every((element) => element.style.transform === ''),
					/* 进场的淡入在内层 `.browser__tab-main` 上，量它才看得出有没有重放 */
					minOpacity: Math.min(
						...tabs.map((element) =>
							Number(
								getComputedStyle(element.querySelector('.browser__tab-main') ?? element).opacity
							)
						)
					)
				})
			}
			if (samples.length < 120) requestAnimationFrame(tick)
		}
		requestAnimationFrame(tick)
	})

	await page.mouse.up()
	await page.waitForTimeout(600)
	const result = await page.evaluate(() => {
		const samples = (
			window as unknown as { __frames: { order: string; cleared: boolean; minOpacity: number }[] }
		).__frames
		const last = samples[samples.length - 1]
		return {
			/* 「旧次序 + 位移已清」的一帧：各块先跳回原位、再跳到新位置的一闪 */
			stale: samples.filter((sample) => sample.order !== last.order && sample.cleared).length,
			/* 某一帧里标签淡下去：入场的那一下在换序时被重新触发 */
			dipped: samples.filter((sample) => sample.minOpacity < 1).length
		}
	})
	expect(result.stale).toBe(0)
	expect(result.dipped).toBe(0)
})
