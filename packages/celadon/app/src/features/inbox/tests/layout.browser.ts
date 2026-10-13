import { expect, test } from '@playwright/test'

/* 三栏骨架的浏览器用例（`plan/08-layout-base.md` 第一阶段）：跑真开发服务上的真应用，
   本机登录标记按存储的真实格式预置，因此不用走登录一线。核的是三条链路：
   收起与展开、打开、窗口动作（Web 下不出现）。 */

/** 预置本机登录标记与落点（口径同 `features/auth/tests/entry.browser.ts`）。 */
async function markSignedIn(page: import('@playwright/test').Page, landing?: string) {
	await page.addInitScript(
		({ path }) => {
			localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() }))
			if (path)
				localStorage.setItem(
					'celadon.landing',
					JSON.stringify({ [location.origin]: { path, at: Date.now() } })
				)
		},
		{ path: landing ?? '' }
	)
}

const columns = (page: import('@playwright/test').Page) => ({
	nav: page.locator('.nav'),
	content: page.locator('.content'),
	browser: page.locator('.browser')
})

/** 一次量三栏的位置与宽，用来比互换前后的读数。 */
async function metrics(page: import('@playwright/test').Page) {
	const { nav, content, browser } = columns(page)
	const read = async (locator: import('@playwright/test').Locator) =>
		locator.evaluate((el) => {
			const box = el.getBoundingClientRect()
			return { x: box.x, width: box.width }
		})
	return {
		nav: await read(nav),
		content: await read(content),
		browser: await read(browser)
	}
}

/** 把标签浏览器拖宽到放得下两个面板：分栏键按本栏实宽判，默认 400 时是禁用的。 */
async function widenBrowser(page: import('@playwright/test').Page, delta = 320) {
	const browser = columns(page).browser
	const edge = browser.locator('.browser__edge')
	const grip = (await edge.boundingBox())!
	const y = grip.y + 300
	await page.mouse.move(grip.x + grip.width / 2, y)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 - delta, y, { steps: 8 })
	await page.mouse.up()
	return browser
}

test('lands on the inbox with the three columns in place', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/')
	await expect(page).toHaveURL(/\/app\/inbox$/)

	const { nav, content, browser } = columns(page)
	await expect(nav).toBeVisible()
	await expect(content).toBeVisible()
	await expect(browser).toBeVisible()

	/* 栏宽按 F6：导航默认 280，内容区至少 400 */
	expect(await nav.evaluate((el) => el.getBoundingClientRect().width)).toBeCloseTo(280, 0)
	expect(await content.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(400)
})

test('opens a page from the main navigation', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await page.getByRole('link', { name: '看板' }).click()
	await expect(page).toHaveURL(/\/app\/board$/)
	await expect(page.locator('.content')).toContainText('看板')
	await expect(page.getByRole('link', { name: '看板' })).toHaveAttribute('aria-current', 'page')
})

test('collapses the navigation column to zero and remembers it after a reload', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const nav = columns(page).nav
	expect(await nav.evaluate((el) => el.getBoundingClientRect().width)).toBeCloseTo(280, 0)

	/* 整列收起键默认隐藏，指针先进导航区 */
	await page.mouse.move(140, 20)
	await page.locator('.nav__header .nav__toggle').click()
	await expect.poll(async () => nav.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThan(1)
	/* 零宽后内容列从窗口最左铺满，重新展开的入口在内容列头 */
	const contentBox = await page.locator('.content').boundingBox()
	expect(Math.round(contentBox?.x ?? -1)).toBe(0)
	await expect(page.getByRole('button', { name: '展开导航' })).toBeVisible()

	await page.reload()
	await expect.poll(async () => nav.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThan(1)
})

test('folds the main navigation and finds it again from the current row', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/inbox')

	const main = page.locator('.nav__main')
	await expect(main).toBeVisible()
	/* 一级菜单的收放键在列头里，未悬停时不可见 */
	await page.mouse.move(140, 20)
	await page.locator('.nav__header .nav__fold').click()
	await expect.poll(async () => main.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(1)

	/* 折起后出口是下区那一行的展开键 */
	await expect(page.locator('.nav__scene-head')).toBeVisible()
	await page.locator('.nav__unfold').click()
	await expect.poll(async () => main.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(1)
})

test('opens an external address in a tab and closes it again', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser

	await browser.getByLabel('外部地址').fill('example.com')
	await browser.getByLabel('外部地址').press('Enter')
	await expect(browser.getByRole('tab', { name: 'example.com' })).toBeVisible()
	await expect(browser.getByRole('tab', { name: 'example.com' })).toHaveAttribute('aria-selected', 'true')

	/* 首页那个标签不可关：它没有关闭键 */
	await expect(browser.locator('.browser__tab', { hasText: '首页' }).locator('button')).toHaveCount(1)

	await browser.getByRole('button', { name: '关闭这个标签' }).click()
	await expect(browser.getByRole('tab', { name: 'example.com' })).toHaveCount(0)
	await expect(browser.getByRole('tab', { name: '首页' })).toHaveAttribute('aria-selected', 'true')
})

test('collapses the browser column and gives the space to the content', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const { content, browser } = columns(page)
	const wide = await content.evaluate((el) => el.getBoundingClientRect().width)

	await browser.getByRole('button', { name: '收掉这一栏' }).click()
	await expect(browser).toHaveAttribute('data-collapsed', 'true')
	await expect(browser).toHaveCSS('inline-size', '0px')
	expect(await content.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(wide)
})

test('moves the browser column to the other side and keeps the navigation column still', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	await expect(browser).toHaveAttribute('data-side', 'right')

	const before = await metrics(page)
	await browser.getByRole('button', { name: '换到另一侧' }).click()
	await expect(browser).toHaveAttribute('data-side', 'left')
	const after = await metrics(page)

	// 导航列位置与宽度不动
	expect(after.nav.x).toBeCloseTo(before.nav.x, 0)
	expect(after.nav.width).toBeCloseTo(before.nav.width, 0)
	// 两栏各自保留原宽，只是换了位置
	expect(after.content.width).toBeCloseTo(before.content.width, 0)
	expect(after.browser.width).toBeCloseTo(before.browser.width, 0)
	// 分界线按两者宽度之和移位：内容区跑到右边
	expect(after.browser.x).toBeLessThan(after.content.x)
	expect(Math.round(after.browser.x)).toBe(Math.round(after.nav.x + after.nav.width))
	// 三栏总宽不变，等于窗口宽
	const total = (m: typeof before) => Math.round(m.nav.width + m.content.width + m.browser.width)
	expect(total(after)).toBe(total(before))
})

test('shows no window buttons on the web client', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await expect(page.getByRole('button', { name: '最小化' })).toHaveCount(0)
	await expect(page.getByRole('button', { name: '关闭' })).toHaveCount(0)
})

test('fits the smallest window without horizontal scrolling', async ({ page }) => {
	await page.setViewportSize({ width: 520, height: 600 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - document.documentElement.clientWidth
	)
	expect(overflow).toBeLessThanOrEqual(0)
	await expect(columns(page).content).toBeVisible()
})

test('yields in order: content first, then the browser, then the navigation column', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/inbox')

	// 1000：内容区已到最小，标签浏览器还在缩，导航列还没收
	await page.setViewportSize({ width: 1000, height: 700 })
	await expect(page.locator('.content')).toHaveCSS('inline-size', '400px')
	const mid = await metrics(page)
	expect(mid.browser.width).toBeGreaterThanOrEqual(300)
	expect(mid.browser.width).toBeLessThan(400)
	await expect(page.locator('.layout')).toHaveAttribute('data-width', 'panel')

	// 900：内容区与标签浏览器都到最小，导航列收起零宽，腾出的宽度还给标签浏览器
	await page.setViewportSize({ width: 900, height: 700 })
	await expect(page.locator('.layout')).toHaveAttribute('data-width', 'zero')
	await expect(page.locator('.nav')).toHaveCSS('inline-size', '0px')
	const narrow = await metrics(page)
	expect(narrow.content.width).toBeGreaterThanOrEqual(400)
	expect(narrow.browser.width).toBeGreaterThanOrEqual(300)
	expect(narrow.browser.width).toBeLessThanOrEqual(400)

	// 700：标签浏览器也让不动，整条收起为零宽
	await page.setViewportSize({ width: 700, height: 700 })
	await expect(page.locator('.layout')).toHaveAttribute('data-browser', 'collapsed')
	await expect(columns(page).browser).toHaveCSS('inline-size', '0px')
})

test('splits the browser into two panes and back', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	await expect(browser).toHaveAttribute('data-split', 'none')
	await expect(browser.locator('.browser__pane')).toHaveCount(1)

	await widenBrowser(page)
	await browser.getByRole('button', { name: '左右分栏' }).click()
	await expect(browser).toHaveAttribute('data-split', 'columns')
	await expect(browser.locator('.browser__pane')).toHaveCount(2)
	// 分屏不改栏宽：栏宽仍由分界线决定
	const panes = await browser
		.locator('.browser__pane')
		.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)))
	// 平分时两个面板宽度差只来自中间那根抓手（--side-resize-handle 6px）
	expect(Math.abs(panes[0] - panes[1])).toBeLessThanOrEqual(8)

	// 换方向：直接改朝向，不回到单面板
	await browser.getByRole('button', { name: '上下分栏' }).click()
	await expect(browser).toHaveAttribute('data-split', 'rows')
	await expect(browser.locator('.browser__pane')).toHaveCount(2)

	// 再点同一颗回到单面板
	await browser.getByRole('button', { name: '上下分栏' }).click()
	await expect(browser).toHaveAttribute('data-split', 'none')
	await expect(browser.locator('.browser__pane')).toHaveCount(1)
})

test('disables the split keys when the window cannot fit two panes', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	await expect(browser.getByRole('button', { name: '左右分栏' })).toBeDisabled()
	await expect(browser.getByRole('button', { name: '上下分栏' })).toBeDisabled()
})

test('drags the divider and resets it by double click', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	await widenBrowser(page)
	await browser.getByRole('button', { name: '左右分栏' }).click()

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
	expect(dragged[0]).toBeLessThan(dragged[1])

	// 双击回平分
	await divider.dblclick()
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
	await page.mouse.up()
	const wider = (await box()).width
	expect(wider).toBeGreaterThan(before + 80)
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
	await browser.getByRole('button', { name: '左右分栏' }).click()
	const divider = browser.locator('.browser__divider')
	const dbox = (await divider.boundingBox())!
	await page.mouse.move(dbox.x + dbox.width / 2, dbox.y + 200)
	await page.mouse.down()
	await page.mouse.move(dbox.x + dbox.width / 2 - 40, dbox.y + 200, { steps: 4 })
	await expect(body).toHaveCSS('user-select', 'none')
	await page.mouse.up()
	await expect(body).not.toHaveCSS('user-select', 'none')
})

/* 双击分界线回默认宽（见 plan/08-layout-content-browser.md §3.1 第 9 处） */
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

	await browser.getByRole('button', { name: '左右分栏' }).click()
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
	await browser.getByRole('button', { name: '左右分栏' }).click()
	await browser.getByRole('button', { name: '换到另一侧' }).click()

	await expect(browser).toHaveAttribute('data-side', 'left')
	await expect(browser).toHaveAttribute('data-split', 'columns')
	await expect(browser.locator('.browser__pane')).toHaveCount(2)

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

	// 先开第二页：首页的地址栏里回车开一个外部地址
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
	await browser.getByRole('button', { name: '左右分栏' }).click()

	// 第一个面板是当前页（example.com），第二个面板绑另一页（首页），两页不重样
	const panes = browser.locator('.browser__pane')
	await expect(panes).toHaveCount(2)
	await expect(panes.nth(0).getByText('example.com')).toHaveCount(1)
	await expect(browser.locator('.browser__pane-head')).toHaveText('首页')
})

test('switches the pane that has focus when a tab is clicked', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	const panes = browser.locator('.browser__pane')

	await browser.getByLabel('外部地址').fill('example.com')
	await browser.getByLabel('外部地址').press('Enter')
	const edge = browser.locator('.browser__edge')
	const grip = (await edge.boundingBox())!
	await page.mouse.move(grip.x + grip.width / 2, grip.y + 300)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 - 300, grip.y + 300, { steps: 8 })
	await page.mouse.up()
	await browser.getByRole('button', { name: '左右分栏' }).click()
	// 起始：第一个面板 example.com，第二个面板首页
	await expect(browser.locator('.browser__pane-head')).toHaveText('首页')

	// 聚焦第二个面板后点「首页」标签：只换第二个面板，第一个面板不动
	await panes.nth(1).click()
	await browser.getByRole('tab', { name: '首页' }).click()
	await expect(browser.locator('.browser__pane-head')).toHaveText('首页')
	await expect(panes.nth(0).getByText('example.com')).toHaveCount(1)

	// 聚焦第一个面板后点「首页」标签：换的是第一个面板，第二个面板的小条跟着变它自己那一页
	await panes.nth(0).click()
	await browser.getByRole('tab', { name: '首页' }).click()
	await expect(panes.nth(0).getByLabel('外部地址')).toHaveCount(1)
})

test('drags the stacked divider and resets it by double click', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser

	// 先拖宽本栏（分栏键按本栏实宽判，400 时是禁用的）
	const edge = browser.locator('.browser__edge')
	const grip = (await edge.boundingBox())!
	await page.mouse.move(grip.x + grip.width / 2, grip.y + 300)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 - 300, grip.y + 300, { steps: 8 })
	await page.mouse.up()
	await browser.getByRole('button', { name: '上下分栏' }).click()

	const divider = browser.locator('.browser__divider')
	const panes = browser.locator('.browser__pane')
	const heights = async () =>
		panes.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)))

	// 往下拖到容器的四分之一：第一个面板变矮
	const box = (await browser.locator('.browser__body').boundingBox())!
	const handle = (await divider.boundingBox())!
	await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
	await page.mouse.down()
	await page.mouse.move(handle.x + handle.width / 2, box.y + box.height * 0.25, { steps: 8 })
	await page.mouse.up()
	const dragged = await heights()
	expect(dragged[0]).toBeLessThan(dragged[1])

	// 双击回平分：高度差只来自中间那根抓手
	await divider.dblclick()
	const even = await heights()
	expect(Math.abs(even[0] - even[1])).toBeLessThanOrEqual(10)
})

test('disables the split keys when the column itself is too narrow', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser

	// 宽窗口下先把本栏拖到最小（300），此时两颗分栏键应按**本栏实宽**禁用
	const edge = browser.locator('.browser__edge')
	const grip = (await edge.boundingBox())!
	const y = grip.y + 300
	await page.mouse.move(grip.x + grip.width / 2, y)
	await page.mouse.down()
	await page.mouse.move(grip.x + 600, y, { steps: 12 })
	await page.mouse.up()
	expect(await browser.evaluate((el) => Math.round(el.getBoundingClientRect().width))).toBeLessThanOrEqual(302)
	await expect(browser.getByRole('button', { name: '左右分栏' })).toBeDisabled()

	// 再拖宽到 700，两颗键恢复可用
	const grip2 = (await edge.boundingBox())!
	await page.mouse.move(grip2.x + grip2.width / 2, y)
	await page.mouse.down()
	await page.mouse.move(grip2.x + grip2.width / 2 - 400, y, { steps: 12 })
	await page.mouse.up()
	await expect(browser.getByRole('button', { name: '左右分栏' })).toBeEnabled()
})
