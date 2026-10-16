import { expect, test } from '@playwright/test'
import { columns, markSignedIn, metrics } from './layout.helpers'

/* 三栏骨架这一层：列在不在、宽度按不按 F6、导航列的收起与折起、
   本栏收放与列头找回键、换边、Web 端不出现窗口键、最小窗口、让位顺序。 */

test('eases the navigation row background on hover', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const row = page.locator('.nav__link').nth(1)
	const timing = await row.evaluate((el) => {
		const style = getComputedStyle(el)
		return {
			property: style.transitionProperty,
			duration: style.transitionDuration,
			easing: style.transitionTimingFunction
		}
	})
	/* F4 的 hover 场景：120 毫秒、标准缓动，只过渡底色与文字色 */
	expect(timing.property).toContain('background-color')
	expect(timing.property).toContain('color')
	expect(timing.duration).toContain('0.12s')
	expect(timing.easing).toContain('cubic-bezier(0.4, 0, 0.2, 1)')

	await row.hover()
	await expect(row).toHaveCSS('background-color', 'rgb(237, 237, 240)')
})

test('keeps the head key away while a panel slides and fades it back after closing', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	const wrap = page.locator('.content__head-slot--browser .content__head-key-wrap')

	/* 两个方向的缓动不同：隐藏（点开面板）120ms 淡出，无延迟；显示（面板合上）用带 320ms 延迟的关键帧 */
	await page.locator('.browser__close').click()
	await expect(browser).toHaveCSS('inline-size', '0px')
	await page.waitForTimeout(300)
	await expect(wrap).toHaveCSS('opacity', '1')
	const shown = await wrap.evaluate((el) => {
		const style = getComputedStyle(el)
		return { name: style.animationName, duration: style.animationDuration, delay: style.animationDelay }
	})
	expect(shown.name).toBe('celadon-head-key-in')
	expect(shown.duration).toContain('0.12s')
	expect(shown.delay).toContain('0.32s')

	/* 点开：面板起来之后列头那颗键已经不画，隐藏方向是 120ms 的过渡 */
	await page.locator('.content__head-key--browser').click()
	await expect.poll(async () => Math.round((await browser.boundingBox())!.width)).toBeGreaterThan(380)
	await expect(wrap).toHaveCSS('opacity', '0')
	const hidden = await wrap.evaluate((el) => getComputedStyle(el).transitionDuration)
	expect(hidden).toContain('0.12s')

	/* 收起：面板滑动全程键不画，收完之后才淡入 */
	const rows = await page.evaluate(async () => {
		const target = document.querySelector('.content__head-slot--browser .content__head-key-wrap')!
		const out: Array<[number, number]> = []
		const tick = () => {
			out.push([
				Math.round(document.querySelector('.browser')!.getBoundingClientRect().width),
				Number(getComputedStyle(target).opacity)
			])
			if (out.length < 60) requestAnimationFrame(tick)
		}
		requestAnimationFrame(tick)
		await new Promise((resolve) => setTimeout(resolve, 80))
		;(document.querySelector('.browser__close') as HTMLElement).click()
		await new Promise((resolve) => setTimeout(resolve, 900))
		return out
	})
	const moving = rows.filter(([width]) => width > 20)
	expect(moving.length).toBeGreaterThan(3)
	expect(moving.every(([, opacity]) => opacity === 0)).toBe(true)
	expect(rows[rows.length - 1][1]).toBe(1)
})


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
	/* 布局投影要走完才算落定，落定后内容列从窗口最左铺满 */
	await page.waitForTimeout(500)
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

test('opens an external address in the home page and closes it again', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser

	/* 首页也在自己的窗口里换内容：填上地址之后它就是那一页，不另开一项 */
	await browser.getByLabel('外部地址').fill('example.com')
	await browser.getByLabel('外部地址').press('Enter')
	await expect(browser.getByRole('tab')).toHaveCount(1)
	const pageTab = browser.locator('.browser__tab').first()
	await expect(pageTab.getByRole('tab', { name: 'example.com' })).toHaveAttribute('aria-selected', 'true')

	/* 这一页也有关闭键；关掉之后一个都不剩，首页重新出现 */
	await pageTab.hover()
	await expect(pageTab.locator('.browser__tab-close')).toHaveCount(1)
	await pageTab.locator('.browser__tab-close').click()
	await expect(browser.getByRole('tab')).toHaveCount(1)
	await expect(browser.getByRole('tab', { name: '首页' })).toHaveAttribute('aria-selected', 'true')
})

test('collapses the browser column and gives the space to the content', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const { content, browser } = columns(page)
	const wide = await content.evaluate((el) => el.getBoundingClientRect().width)

	// 本栏打开时列头不留键，收起键在顶栏；收起后列头才出现找回键
	const key = page.locator('.content__head-key--browser')
	await expect(key).toBeHidden()

	await page.locator('.browser__close').click()
	await expect(browser).toHaveAttribute('data-collapsed', 'true')
	await expect(browser).toHaveCSS('inline-size', '0px')
	await page.waitForTimeout(500)
	expect(await content.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(wide)

	// 收起后列头那颗键出现，按回去恢复原状，不必去菜单里找
	await expect(key).toBeVisible()
	await expect(key).toHaveAttribute('aria-expanded', 'false')
	await key.click()
	await expect(browser).not.toHaveAttribute('data-collapsed', 'true')
	await page.waitForTimeout(500)
	expect(await browser.evaluate((el) => Math.round(el.getBoundingClientRect().width))).toBeGreaterThan(300)
})

test('disables the head key when the window cannot fit the browser column', async ({ page }) => {
	/* 520 是设计里的最小窗口：内容区最小 400 加这一栏最小 300 放不下，这一栏由视口收起 */
	await page.setViewportSize({ width: 520, height: 700 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const { browser } = columns(page)
	const key = page.locator('.content__head-key--browser')

	await expect(browser).toHaveAttribute('data-collapsed', 'true')
	await expect(key).toBeVisible()
	await expect(key).toBeDisabled()
	await expect(key).toHaveAttribute('aria-expanded', 'false')
	await expect(key).toHaveAccessibleName('窗口太窄，放不下这一栏')

	/* 键在，但按不动：栏的状态与视口给出的结果一致，不会出现「按了没反应」 */
	await key.click({ force: true })
	await page.waitForTimeout(300)
	await expect(browser).toHaveAttribute('data-collapsed', 'true')
	await expect(page.locator('.layout')).toHaveAttribute('data-browser', 'collapsed')
})

test('disables the head key when the window forces the navigation column shut', async ({ page }) => {
	/* 971 及以下由视口收起导航，列头那颗展开键此时按不动，置灰并给出原因 */
	await page.setViewportSize({ width: 900, height: 700 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const root = page.locator('.layout')
	const key = page.locator('.content__head-slot:not(.content__head-slot--browser) .content__head-key')

	await expect(root).toHaveAttribute('data-width', 'zero')
	await expect(key).toHaveCount(1)
	await expect(key).toBeVisible()
	await expect(key).toBeDisabled()
	await expect(key).toHaveAttribute('aria-expanded', 'false')
	await expect(key).toHaveAccessibleName('窗口太窄，导航暂不能展开')

	/* 按不动：导航仍是视口给出的收起态，不会出现按了没反应 */
	await key.click({ force: true })
	await page.waitForTimeout(300)
	await expect(root).toHaveAttribute('data-width', 'zero')
	await expect(root).toHaveAttribute('data-nav', 'collapsed')
})

test('moves the browser column to the other side and keeps the navigation column still', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	await expect(browser).toHaveAttribute('data-side', 'right')

	const before = await metrics(page)
	await browser.getByRole('button', { name: '更多' }).click()
	await page.getByRole('menuitem', { name: '换到另一侧' }).click()
	await expect(browser).toHaveAttribute('data-side', 'left')
	// 换边是布局动画，等投影落定再量三栏位置
	await page.waitForTimeout(500)
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
