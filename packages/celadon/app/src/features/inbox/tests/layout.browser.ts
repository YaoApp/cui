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
	await expect(browser).toHaveCount(0)
	expect(await content.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(wide)
})

test('moves the browser column to the other side', async ({ page }) => {
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	await expect(browser).toHaveAttribute('data-side', 'right')

	await browser.getByRole('button', { name: '换到另一侧' }).click()
	await expect(browser).toHaveAttribute('data-side', 'left')
	const box = await browser.evaluate((el) => el.getBoundingClientRect().left)
	expect(box).toBeLessThan(200)
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
