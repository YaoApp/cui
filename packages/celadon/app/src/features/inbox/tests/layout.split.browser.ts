import { expect, test } from '@playwright/test'
import { columns, markSignedIn, openTabMenu, widenBrowser } from './layout.helpers'

/* 分屏这一层：进分屏与换方向、两颗键的可用性、分隔条的拖动与复位、
   分界线拖动时的跟手与选择锁、收起后宽度不被改掉、换边后仍可用、
   两栏各有一组标签与自己的页、点哪一条标签条只换那一栏。 */

test('splits the browser into two panes and back', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	await expect(browser).toHaveAttribute('data-split', 'none')
	await expect(browser.locator('.browser__pane')).toHaveCount(1)

	await widenBrowser(page)
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	await expect(browser).toHaveAttribute('data-split', 'columns')
	await expect(browser.locator('.browser__pane')).toHaveCount(2)
	// 分屏不改栏宽：栏宽仍由分界线决定
	const panes = await browser
		.locator('.browser__pane')
		.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)))
	// 平分时两个面板宽度差只来自中间那根抓手（--side-resize-handle 8px）
	expect(Math.abs(panes[0] - panes[1])).toBeLessThanOrEqual(8)

	// 换方向：直接改朝向，不回到单面板
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '上下分栏' }).click()
	await expect(browser).toHaveAttribute('data-split', 'rows')
	await expect(browser.locator('.browser__pane')).toHaveCount(2)

	// 再点同一颗回到单面板
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '上下分栏' }).click()
	await expect(browser).toHaveAttribute('data-split', 'none')
	await expect(browser.locator('.browser__pane')).toHaveCount(1)
})

test('gates each split direction by its own room', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser

	/* 1280 宽：侧栏只有 400，放不下两块并排，左右分栏置灰；高度还有七百多，上下分栏可用 */
	await openTabMenu(page, browser)
	await expect(page.getByRole('menuitem', { name: '左右分栏' })).toBeDisabled()
	await expect(page.getByRole('menuitem', { name: '上下分栏' })).toBeEnabled()
	await page.keyboard.press('Escape')

	/* 窗口压矮到 520：栏高放不下两块，上下分栏也置灰 */
	await page.setViewportSize({ width: 1280, height: 520 })
	await page.waitForTimeout(400)
	await openTabMenu(page, browser)
	await expect(page.getByRole('menuitem', { name: '上下分栏' })).toBeDisabled()
})

test('drags the divider and resets it by double click', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	await widenBrowser(page)
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()

	const body = browser.locator('.browser__body')
	const divider = browser.locator('.browser__divider')
	const panes = browser.locator('.browser__pane')
	const widths = async () =>
		panes.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)))

	const box = (await body.boundingBox())!
	const handle = (await divider.boundingBox())!
	await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
	await page.mouse.down()
	await page.mouse.move(box.x + box.width * 0.25, handle.y + handle.height / 2, { steps: 6 })
	await page.mouse.up()
	const dragged = await widths()
	/* 分隔条拖到整条宽度的 25%：新栏在左因此变窄，主栏（DOM 里的第一个面板）在右变宽 */
	expect(dragged[1]).toBeLessThan(dragged[0])

	// 双击回平分
	await divider.dblclick()
	await page.waitForTimeout(400)
	const even = await widths()
	// 双击回平分：宽度差只来自中间那根抓手
	expect(Math.abs(even[0] - even[1])).toBeLessThanOrEqual(8)
})

test('drags the boundary between the content and the browser', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	const box = async () => (await browser.boundingBox())!
	const before = (await box()).width

	const handle = browser.locator('.browser__edge')
	await expect(handle).toBeVisible()
	await expect(handle).toHaveCSS('cursor', 'col-resize')

	const grip = (await handle.boundingBox())!
	const y = grip.y + 200
	await page.mouse.move(grip.x + grip.width / 2, y)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 - 120, y, { steps: 6 })
	// 拖动整栏改宽时，栏内内容不做冗余动画：面板与分栏条都不带过渡，眼随指针
	if (await browser.locator('.browser__pane').count()) {
		await expect(browser.locator('.browser__pane').first()).toHaveCSS('transition-duration', '0s')
	}
	await expect(browser).toHaveCSS('transition-duration', '0s')
	await page.mouse.up()
	const wider = (await box()).width
	expect(wider).toBeGreaterThan(before + 80)
})

test('keeps the collapse working after the column width has been dragged', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	const box = async () => await browser.boundingBox()

	/* 先拖分界线把本栏拖宽，再进分屏并拖一次分隔条：这是「拖过之后再点就没反应」的现场 */
	const widened = await widenBrowser(page)
	expect(await widened.evaluate((el) => Math.round(el.getBoundingClientRect().width))).toBeGreaterThan(600)
	await openTabMenu(page, browser)
	const dividerSplit = page.getByRole('menuitem', { name: '左右分栏' })
	await dividerSplit.click()
	await expect(browser.locator('.browser__pane')).toHaveCount(2)
	const divider = browser.locator('.browser__divider')
	const dbox = (await divider.boundingBox())!
	await page.mouse.move(dbox.x + dbox.width / 2, dbox.y + 200)
	await page.mouse.down()
	await page.mouse.move(dbox.x + dbox.width / 2 - 100, dbox.y + 200, { steps: 6 })
	await page.mouse.up()
	await page.waitForTimeout(400)

	/* 宽度只写自定义属性，不写内联 inline-size：内联会压过样式表里的收起态 */
	const style = (await browser.getAttribute('style')) ?? ''
	expect(style).toContain('--side-width')
	expect(style).not.toContain('inline-size')

	const wide = (await box())!.width
	const key = page.locator('.content__head-key--browser')
	await expect(key).toBeHidden()
	await page.locator('.browser__close').click()
	await expect(browser).toHaveAttribute('data-collapsed', 'true')
	/* 等落定再量：收起是过渡，固定等待在机器忙的时候会量到中间帧 */
	await expect(browser).toHaveCSS('inline-size', '0px')

	/* 再展开回到拖出来的宽度，宽度偏好没有被收起动作改掉 */
	await expect(key).toBeVisible()
	await key.click()
	await expect(browser).not.toHaveAttribute('data-collapsed', 'true')
	await expect.poll(async () => Math.abs((await box())!.width - wide), { timeout: 5000 }).toBeLessThanOrEqual(2)
})

test('locks text selection while a divider is dragged', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	const body = page.locator('body')

	// 分界线：按下后锁住选择，松开交还
	const edge = browser.locator('.browser__edge')
	const grip = (await edge.boundingBox())!
	const y = grip.y + 300
	await page.mouse.move(grip.x + grip.width / 2, y)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 - 40, y, { steps: 4 })
	await expect(body).toHaveCSS('user-select', 'none')
	await page.mouse.up()
	await expect(body).not.toHaveCSS('user-select', 'none')

	// 分屏分隔条：同样
	await widenBrowser(page)
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	const divider = browser.locator('.browser__divider')
	const dbox = (await divider.boundingBox())!
	await page.mouse.move(dbox.x + dbox.width / 2, dbox.y + 200)
	await page.mouse.down()
	await page.mouse.move(dbox.x + dbox.width / 2 - 40, dbox.y + 200, { steps: 4 })
	await expect(body).toHaveCSS('user-select', 'none')
	await page.mouse.up()
	await expect(body).not.toHaveCSS('user-select', 'none')
})

/* 双击分界线回默认宽 */
test('resets the browser width by double clicking the boundary', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	const before = (await browser.boundingBox())!.width

	const handle = browser.locator('.browser__edge')
	const grip = (await handle.boundingBox())!
	const y = grip.y + 200
	await page.mouse.move(grip.x + grip.width / 2, y)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 - 120, y, { steps: 6 })
	await page.mouse.up()
	expect((await browser.boundingBox())!.width).toBeGreaterThan(before + 80)

	await handle.dblclick()
	expect(Math.abs((await browser.boundingBox())!.width - before)).toBeLessThanOrEqual(2)
})

test('keeps the column width when the split is switched on', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser

	// 先把分界线拖宽到能放下两个面板
	const handle = browser.locator('.browser__edge')
	const grip = (await handle.boundingBox())!
	const y = grip.y + 200
	await page.mouse.move(grip.x + grip.width / 2, y)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 - 260, y, { steps: 8 })
	await page.mouse.up()
	const wide = (await browser.boundingBox())!.width

	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	// 等分栏的过渡落定再量宽度：过渡期间量到的是中间态
	await expect(browser.locator('.browser__pane')).toHaveCount(2)
	await page.waitForTimeout(400)
	const after = (await browser.boundingBox())!.width
	// 分屏不改栏宽，点下去不跳
	expect(Math.abs(after - wide)).toBeLessThanOrEqual(2)
	await expect(browser.locator('.browser__pane')).toHaveCount(2)
})

test('keeps the split and the boundary working after the browser moves to the left', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	const edge = browser.locator('.browser__edge')

	// 先把分界线拖宽，再分屏，再换到左侧
	let grip = (await edge.boundingBox())!
	const y = grip.y + 300
	await page.mouse.move(grip.x + grip.width / 2, y)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 - 300, y, { steps: 8 })
	await page.mouse.up()
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	/* 分栏后新栏也有自己的「更多」，这里点主栏顶栏那一个 */
	await browser.locator('.browser__bar > .browser__more').click()
	await page.getByRole('menuitem', { name: '换到另一侧' }).click()

	await expect(browser).toHaveAttribute('data-side', 'left')
	await expect(browser).toHaveAttribute('data-split', 'columns')
	await expect(browser.locator('.browser__pane')).toHaveCount(2)
	// 换边是布局动画，等投影落定再量列序
	await page.waitForTimeout(500)

	// 列序：导航列最左，中间是标签浏览器，右边是内容区
	const navBox = (await columns(page).nav.boundingBox())!
	const browserBox = (await browser.boundingBox())!
	const contentBox = (await columns(page).content.boundingBox())!
	expect(navBox.x).toBeLessThan(browserBox.x)
	expect(browserBox.x).toBeLessThan(contentBox.x)

	// 换边后分界线在面向内容区的那一侧（右缘），仍可拖，方向反过来
	const width = async () => (await browser.boundingBox())!.width
	const before = await width()
	grip = (await edge.boundingBox())!
	await page.mouse.move(grip.x + grip.width / 2, grip.y + 300)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 + 100, grip.y + 300, { steps: 6 })
	await expect(page.locator('body')).toHaveCSS('user-select', 'none')
	await page.mouse.up()
	expect(await width()).toBeGreaterThan(before + 60)
	await expect(page.locator('body')).not.toHaveCSS('user-select', 'none')
})

test('shows another page in the second pane instead of the same page twice', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser

	// 先开第二页：点新建开一个空页，再在空页里填地址（首页因此留在第一位）
	await browser.getByRole('button', { name: '新建标签' }).click()
	await browser.getByLabel('外部地址').fill('example.com')
	await browser.getByLabel('外部地址').press('Enter')
	await expect(browser.getByRole('tab', { name: 'example.com' })).toHaveCount(1)

	// 拖宽本栏，再分屏
	const edge = browser.locator('.browser__edge')
	const grip = (await edge.boundingBox())!
	await page.mouse.move(grip.x + grip.width / 2, grip.y + 300)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 - 300, grip.y + 300, { steps: 8 })
	await page.mouse.up()
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()

	// 第一个面板是当前页（example.com），第二个面板自带一组标签、活动页是首页，两页不重样
	const panes = browser.locator('.browser__pane')
	await expect(panes).toHaveCount(2)
	await expect(panes.nth(0).getByText('example.com')).toHaveCount(1)
	/* 左右分栏时新栏的标签条在顶栏左段，按 data-group 限定它 */
	await expect(
		browser.locator('.browser__bar-secondary').getByRole('tab', { selected: true })
	).toHaveText('首页')
})

test('switches only the group whose strip was clicked', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	const panes = browser.locator('.browser__pane')

	await browser.getByRole('button', { name: '新建标签' }).click()
	await browser.getByLabel('外部地址').fill('example.com')
	await browser.getByLabel('外部地址').press('Enter')
	const edge = browser.locator('.browser__edge')
	const grip = (await edge.boundingBox())!
	await page.mouse.move(grip.x + grip.width / 2, grip.y + 300)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 - 300, grip.y + 300, { steps: 8 })
	await page.mouse.up()
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	const secondaryStrip = browser.locator('.browser__bar-secondary')
	// 起始：主栏是 example.com，新栏自带一组标签、活动页是首页
	await expect(secondaryStrip.getByRole('tab', { selected: true })).toHaveText('首页')

	// 新栏的标签条只作用于新栏：点它的新建键，新栏多一页，主栏不动
	await secondaryStrip.getByRole('button', { name: '新建标签' }).click()
	await expect(secondaryStrip.getByRole('tab')).toHaveCount(2)
	await expect(panes.nth(0).getByText('example.com')).toHaveCount(1)

	// 点新栏的「首页」那一页：只换新栏，主栏还是 example.com
	await secondaryStrip.getByRole('tab', { name: '首页' }).click()
	await expect(secondaryStrip.getByRole('tab', { selected: true })).toHaveText('首页')
	await expect(panes.nth(0).getByText('example.com')).toHaveCount(1)

	// 点主栏标签条上的「首页」：换的是主栏那一栏，新栏保持自己那一页
	await panes.nth(0).click()
	await browser.locator('.browser__tabs-row').last().getByRole('tab', { name: '首页' }).click()
	await expect(panes.nth(0).getByLabel('外部地址')).toHaveCount(1)
	await expect(secondaryStrip.getByRole('tab', { selected: true })).toHaveText('首页')
})

test('closes the split when the second pane runs out of tabs', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	await widenBrowser(page)
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	const strip = browser.locator('.browser__bar-secondary')
	await expect(strip.getByRole('tab')).toHaveCount(1)

	// 新栏只有首页那一页：关掉它，分栏自动关闭，主栏原样留着
	await strip.getByRole('tab', { name: '首页' }).hover()
	await strip.locator('.browser__tab-close').click()
	await expect(browser).toHaveAttribute('data-split', 'none')
	await expect(browser.locator('.browser__pane')).toHaveCount(1)
	await expect(browser.locator('.browser__bar-secondary')).toHaveCount(0)
})

test('merges the second pane into the main one when the split is switched off', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	await widenBrowser(page)
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	const strip = browser.locator('.browser__bar-secondary')

	// 新栏开一页外部地址（地址入口在新栏的页面里，不在顶栏那一段）
	await strip.getByRole('button', { name: '新建标签' }).click()
	const secondaryPane = browser.locator('.browser__pane--secondary')
	await secondaryPane.getByLabel('外部地址').fill('merge.example.com')
	await secondaryPane.getByLabel('外部地址').press('Enter')
	await expect(strip.getByRole('tab', { name: 'merge.example.com' })).toHaveCount(1)

	// 主动关分栏：新栏的页并进主栏并经主栏入口去重，只留一份
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	await expect(browser).toHaveAttribute('data-split', 'none')
	const names = await browser.locator('.browser__tab-label').allInnerTexts()
	expect(names.filter((name) => name === 'merge.example.com')).toHaveLength(1)
})

test('restores both tab groups after a reload and never leaves an empty pane', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	await widenBrowser(page)
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	const strip = browser.locator('.browser__bar-secondary')
	await strip.getByRole('button', { name: '新建标签' }).click()
	const secondaryPane = browser.locator('.browser__pane--secondary')
	await secondaryPane.getByLabel('外部地址').fill('keep.example.com')
	await secondaryPane.getByLabel('外部地址').press('Enter')
	await expect(strip.getByRole('tab', { name: 'keep.example.com' })).toHaveCount(1)

	await page.reload()
	await expect(browser).toHaveAttribute('data-split', 'columns')
	await expect(browser.locator('.browser__pane')).toHaveCount(2)
	const restored = browser.locator('.browser__bar-secondary')
	await expect(restored.getByRole('tab', { selected: true })).toHaveText('keep.example.com')
	/* 主栏的标签条在顶栏右段，两栏各自恢复，新栏不是空的 */
	await expect(browser.locator('.browser__tabs-row').last().getByRole('tab', { name: '首页' })).toHaveCount(1)
})

test('paints both panes with the same background', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	await widenBrowser(page)
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	await expect(browser.locator('.browser__pane')).toHaveCount(2)

	/* 两栏的页面底必须同色：新栏单独写底色会让一栏白、一栏灰 */
	const paints = await browser.locator('.browser__pane').evaluateAll((els) =>
		els.map((el) => {
			let node: HTMLElement | null = el as HTMLElement
			while (node) {
				const colour = getComputedStyle(node).backgroundColor
				if (colour && colour !== 'rgba(0, 0, 0, 0)') return colour
				node = node.parentElement
			}
			return 'none'
		})
	)
	expect(paints[0]).toBe(paints[1])
})

test('keeps the drag in step after the double click resets the ratio', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	await widenBrowser(page)
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	const divider = browser.locator('.browser__divider')
	const widths = async () =>
		browser
			.locator('.browser__pane')
			.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)))

	const drag = async (delta: number) => {
		const handle = (await divider.boundingBox())!
		await page.mouse.move(handle.x + handle.width / 2, handle.y + 200)
		await page.mouse.down()
		await page.mouse.move(handle.x + handle.width / 2 + delta, handle.y + 200, { steps: 6 })
		await page.mouse.up()
		await page.waitForTimeout(300)
	}

	await drag(60)
	const first = await widths()
	// 新栏在左：往右拖它变宽（DOM 里第二个面板），主栏在右变窄
	expect(first[1]).toBeGreaterThan(first[0])

	await divider.dblclick()
	await page.waitForTimeout(400)
	const even = await widths()
	expect(Math.abs(even[0] - even[1])).toBeLessThanOrEqual(8)

	/* 复位之后再拖同样的距离，位移应与第一次一致，不能跳一大块 */
	await drag(60)
	const second = await widths()
	expect(second[0]).toBe(first[0])
	expect(second[1]).toBe(first[1])

	/* 连续再拖一次同样距离：位移必须与上一次相同，且方向跟着指针（新栏继续变宽、主栏继续变窄） */
	await drag(60)
	const third = await widths()
	expect(third[1]).toBe(second[1] + 60)
	expect(third[0]).toBe(second[0] - 60)

	/* 反向拖同样的距离回到原位：方向也跟手，不跳 */
	await drag(-60)
	const back = await widths()
	expect(back[0]).toBe(second[0])
	expect(back[1]).toBe(second[1])
})

test('opens the tab menu and the overflow menu on the second pane', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	await widenBrowser(page)
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	const strip = browser.locator('.browser__bar-secondary')
	const pane = browser.locator('.browser__pane--secondary')

	// 新栏开一页外部地址
	await strip.getByRole('button', { name: '新建标签' }).click()
	await pane.getByLabel('外部地址').fill('menu.example.com')
	await pane.getByLabel('外部地址').press('Enter')
	await expect(strip.getByRole('tab', { name: 'menu.example.com' })).toHaveCount(1)

	// 右键新栏的标签：弹出的是新栏自己的菜单，四项都在
	await strip.getByRole('tab', { name: 'menu.example.com' }).click({ button: 'right' })
	const menu = page.locator('.browser__menu')
	await expect(menu).toHaveCount(1)
	await expect(menu.getByText('刷新')).toHaveCount(1)
	await expect(menu.getByText('关闭这个标签')).toHaveCount(1)
	await expect(menu.getByText('关闭其他标签')).toHaveCount(1)
	await expect(menu.getByText('关闭全部标签')).toHaveCount(1)
	await page.keyboard.press('Escape')
	await expect(page.locator('.browser__menu')).toHaveCount(0)

	// 溢出键也在新栏这一段里，并且有自己的菜单
	await strip.locator('.browser__more').click()
	await expect(page.locator('.browser__menu').getByText('关闭全部标签')).toHaveCount(1)
})
