import { expect, test, type Page } from '@playwright/test'

/* 镜像态（标签浏览器换到左侧）：键位按主栏 / 次栏给。
   主栏是中间那一栏，镜像态是标签浏览器：它顶栏前段装导航找回键、后段装次栏找回键，不画收起键；
   次栏是内容区：它列头右端装自己的收起键。正常态的键位由既有用例守着，这里只测镜像态。 */

async function markSignedIn(page: Page) {
	await page.addInitScript(() =>
		localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() }))
	)
}

async function swapSide(page: Page) {
	await page.locator('.browser__more').click()
	await page.getByRole('menuitem', { name: '换到另一侧' }).click()
	await expect(page.locator('.layout')).toHaveAttribute('data-mirror', 'true')
}

const widths = (page: Page) =>
	page.evaluate(() => {
		const box = (selector: string) => {
			const el = document.querySelector(selector)
			return el ? Math.round(el.getBoundingClientRect().width) : null
		}
		const strip = document.querySelector('.browser__tabs')!.getBoundingClientRect()
		const column = document.querySelector('.layout > .browser')!.getBoundingClientRect()
		return {
			content: box('.layout > .content'),
			browser: box('.layout > .browser'),
			/* 标签条起点相对本栏左缘：导航列收起后整片布局左移，这个差值才是键位带来的位移 */
			stripOffset: Math.round(strip.x - column.x)
		}
	})

test('mirror keeps the keys by role: front nav key, no collapse key, content head key', async ({ page }) => {
	await page.setViewportSize({ width: 1500, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await swapSide(page)

	/* 主栏不画收起键；次栏（内容区）的收起键在它自己列头右端 */
	await expect(page.locator('.browser__close')).toHaveCount(0)
	await expect(page.locator('.content__head-key--browser')).toBeVisible()
	await expect(page.locator('.content__head-key--browser')).toHaveAttribute('aria-label', '收掉这一栏')

	/* 导航展开时前段槽位空着，收起后导航找回键出现，标签条随之右移它那一格 */
	const before = await widths(page)
	await page.locator('.nav__header .nav__toggle').click()
	await expect(page.locator('.browser__slot--nav')).toHaveAttribute('data-hidden', 'false')
	await expect(page.locator('.browser__nav')).toBeVisible()
	/* 槽位宽度带过渡，等它走完再量 */
	await expect(page.locator('.browser__slot--nav')).toHaveCSS('inline-size', '32px')
	const after = await widths(page)
	expect(after.stripOffset - before.stripOffset).toBeGreaterThanOrEqual(30)

	/* 点它把导航找回来 */
	await page.locator('.browser__nav').click()
	await expect(page.locator('.browser__slot--nav')).toHaveAttribute('data-hidden', 'true')
})

test('mirror collapses the content from its own head and brings it back from the main bar', async ({ page }) => {
	await page.setViewportSize({ width: 1500, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await swapSide(page)

	const open = await widths(page)
	expect(open.content).toBeGreaterThan(600)
	expect(open.browser).toBeGreaterThan(300)

	await page.locator('.content__head-key--browser').click()
	await expect(page.locator('.layout')).toHaveAttribute('data-browser', 'collapsed')
	await expect(page.locator('.layout > .content')).toHaveCSS('inline-size', '0px')
	/* 主栏铺满其余空间，找回键出现在顶栏后段 */
	await expect(page.locator('.browser__slot--trail')).toHaveAttribute('data-hidden', 'false')
	const collapsed = await widths(page)
	expect(collapsed.browser).toBeGreaterThan(1000)

	await page.locator('.browser__secondary-key').click()
	await expect(page.locator('.layout')).not.toHaveAttribute('data-browser', 'collapsed')
	await expect(page.locator('.browser__slot--trail')).toHaveAttribute('data-hidden', 'true')
	/* 展开是一条过渡，等宽度回到展开前那一档再比 */
	await expect.poll(async () => (await widths(page)).content).toBe(open.content)
	const restored = await widths(page)
	expect(restored.browser).toBe(open.browser)
})

test('mirror is remembered across reloads', async ({ page }) => {
	await page.setViewportSize({ width: 1500, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await swapSide(page)
	await page.reload()
	await expect(page.locator('.layout')).toHaveAttribute('data-mirror', 'true')
	await expect(page.locator('.browser__close')).toHaveCount(0)
})

test('narrow window takes away the secondary: content in mirror, browser in normal', async ({ page }) => {
	await page.setViewportSize({ width: 1500, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await swapSide(page)
	await page.setViewportSize({ width: 680, height: 900 })
	await page.waitForTimeout(400)

	/* 镜像态次栏是内容区：收掉的是它，主栏（标签浏览器）留着。
	   收放是一段过渡，属性翻转时宽度还没到零，所以等宽度落定再比 */
	await expect(page.locator('.layout')).toHaveAttribute('data-browser', 'collapsed')
	await expect.poll(async () => (await widths(page)).content).toBeLessThan(1)
	const mirrored = await widths(page)
	expect(mirrored.browser).toBeGreaterThan(300)

	/* 换回正常态：收掉的是标签浏览器（既有口径不变）。本栏收掉后它的菜单点不到，
	   因此先把窗口放回去再换边，量完再压窄。 */
	await page.setViewportSize({ width: 1500, height: 900 })
	await page.waitForTimeout(300)
	await page.locator('.browser__more').click()
	await page.getByRole('menuitem', { name: '换到另一侧' }).click()
	await expect(page.locator('.layout')).not.toHaveAttribute('data-mirror', 'true')
	await page.setViewportSize({ width: 680, height: 900 })
	await page.waitForTimeout(500)
	await expect(page.locator('.layout')).toHaveAttribute('data-browser', 'collapsed')
	const normal = await widths(page)
	expect(normal.browser).toBe(0)
	expect(normal.content).toBeGreaterThan(300)
})

test('keeps the column order while the secondary collapses in mirror mode', async ({ page }) => {
	await page.setViewportSize({ width: 1200, height: 800 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await swapSide(page)

	/* 收起过程逐帧采样：内容区始终在主栏右侧（次序中途不能翻转），宽度单调收窄。
	   点击放在页面里做，否则往返一趟会错过前几帧 */
	const frames = await page.evaluate(
		() =>
			new Promise<{ width: number; rightOfMain: boolean }[]>((done) => {
				const out: { width: number; rightOfMain: boolean }[] = []
				document.querySelector<HTMLElement>('.content__head-key--browser')!.click()
				const tick = () => {
					const content = document.querySelector('.layout > .content')!.getBoundingClientRect()
					const main = document.querySelector('.layout > .browser')!.getBoundingClientRect()
					out.push({ width: Math.round(content.width), rightOfMain: content.left >= main.right - 1 })
					if (out.length < 13) requestAnimationFrame(tick)
					else done(out)
				}
				requestAnimationFrame(tick)
			})
	)
	expect(frames.every((frame) => frame.rightOfMain)).toBe(true)
	const seen = [...new Set(frames.map((frame) => frame.width).filter((width) => width > 0))]
	expect(seen.length).toBeGreaterThanOrEqual(3)
	expect(seen[0]).toBeGreaterThan(seen[seen.length - 1] + 150)
})

test('exclusive fills the window when the mirrored secondary is collapsed', async ({ page }) => {
	await page.setViewportSize({ width: 1500, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await swapSide(page)
	await page.locator('.content__head-key--browser').click()
	await expect(page.locator('.layout')).toHaveAttribute('data-browser', 'collapsed')
	await page.locator('.browser__maximize').click()
	await expect(page.locator('.layout')).toHaveAttribute('data-exclusive', 'true')

	const sizes = await page.evaluate(() => ({
		window: Math.round(document.querySelector('.layout')!.getBoundingClientRect().width),
		main: Math.round(document.querySelector('.layout > .browser')!.getBoundingClientRect().width)
	}))
	/* 独占会让导航区与内容区收到零，那两条带过渡，等它走完再比 */
	await expect
		.poll(() =>
			page.evaluate(() =>
				Math.round(document.querySelector('.layout > .browser')!.getBoundingClientRect().width)
			)
		)
		.toBe(sizes.window)
})

test('expands the mirrored secondary continuously and drops it from the a11y tree when collapsed', async ({
	page
}) => {
	await page.setViewportSize({ width: 1500, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await swapSide(page)

	await page.locator('.content__head-key--browser').click()
	await expect(page.locator('.layout > .content')).toHaveAttribute('inert', '')
	await expect(page.locator('.layout > .content')).toHaveAttribute('aria-hidden', 'true')
	/* 收起是 200 毫秒的过渡：等它落定再采样展开，否则量到的是两段动画的叠加，结果随机。
	   落定判据取内容区宽度到零、主栏右缘不出窗口（后者同时钉住收起态的目标值：
	   目标若取 100%，导航区还在，整行会溢出窗口） */
	await expect
		.poll(() =>
			page.evaluate(() => {
				const layout = document.querySelector('.layout')!
				const content = document.querySelector('.layout > .content')!.getBoundingClientRect()
				const main = document.querySelector('.layout > .browser')!.getBoundingClientRect()
				return {
					content: Math.round(content.width),
					overflow: Math.round(main.right - layout.getBoundingClientRect().right)
				}
			})
		)
		.toEqual({ content: 0, overflow: 0 })

	/* 展开逐帧采样：主栏宽度连续收回、内容区宽度连续长出。
	   判据放在内容区：下限若一步跳回 400，第一帧就是 400、整段也只剩一个值，这里会红；
	   主栏首帧的绝对值会随采样时机浮动，不作为判据 */
	const frames = await page.evaluate(
		() =>
			new Promise<{ main: number; content: number }[]>((done) => {
				const out: { main: number; content: number }[] = []
				document.querySelector<HTMLElement>('.browser__secondary-key')!.click()
				const tick = () => {
					out.push({
						main: Math.round(document.querySelector('.layout > .browser')!.getBoundingClientRect().width),
						content: Math.round(document.querySelector('.layout > .content')!.getBoundingClientRect().width)
					})
					if (out.length < 15) requestAnimationFrame(tick)
					else done(out)
				}
				requestAnimationFrame(tick)
			})
	)
	const seenMain = [...new Set(frames.map((frame) => frame.main))]
	const seenContent = [...new Set(frames.map((frame) => frame.content))]
	expect(seenMain.length).toBeGreaterThanOrEqual(4)
	expect(seenContent.length).toBeGreaterThanOrEqual(4)
	expect(seenContent[0]).toBeLessThan(200)
})

test('fills the shell when the mirrored secondary is collapsed while split', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await swapSide(page)

	/* 分栏要求本栏够宽：先拖分界线把这一栏拉宽 */
	const edge = await page.locator('.browser__edge').boundingBox()
	const before = await page.evaluate(() => Math.round(document.querySelector('.layout > .browser')!.getBoundingClientRect().width))
	await page.mouse.move(edge!.x + edge!.width / 2, edge!.y + edge!.height / 2)
	await page.mouse.down()
	await page.mouse.move(edge!.x + edge!.width / 2 + (650 - before), edge!.y + edge!.height / 2, { steps: 8 })
	await page.mouse.up()

	await page.locator('.browser__more').click()
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	await expect(page.locator('.browser[data-split="columns"]')).toHaveCount(1)

	await page.locator('.content__head-key--browser').click()
	await expect(page.locator('.layout')).toHaveAttribute('data-browser', 'collapsed')
	/* 分屏时外壳不得停在定宽档：外壳与顶栏都要跟着本栏铺满 */
	await expect
		.poll(() =>
			page.evaluate(() => Math.round(document.querySelector('.browser__shell')!.getBoundingClientRect().width))
		)
		.toBeGreaterThan(1200)
	const bar = await page.evaluate(() => ({
		shell: Math.round(document.querySelector('.browser__shell')!.getBoundingClientRect().width),
		bar: Math.round(document.querySelector('.browser__bar')!.getBoundingClientRect().width)
	}))
	expect(bar.bar).toBe(bar.shell)
})

test('names the reason on the disabled keys in mirror mode', async ({ page }) => {
	/* 900 宽：导航区被视口收起，镜像态前段那颗导航找回键可见但按不动 */
	await page.setViewportSize({ width: 900, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await swapSide(page)

	const navKey = page.locator('.browser__nav')
	await expect(navKey).toBeVisible()
	await expect(navKey).toBeDisabled()
	await expect(navKey).toHaveAttribute('aria-label', '窗口太窄，导航暂不能展开')
	await expect(page.locator('.browser__slot--nav .browser__slot-key-wrap')).toHaveAttribute(
		'title',
		'窗口太窄，导航暂不能展开'
	)
})
