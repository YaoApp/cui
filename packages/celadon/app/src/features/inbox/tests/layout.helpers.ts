import { expect, type Locator, type Page } from '@playwright/test'

/* 三栏布局的浏览器用例共用这几件：跑真开发服务上的真应用，
   本机登录标记按存储的真实格式预置，因此不用走登录一线。 */

/* 分栏与换边都收进顶栏的下拉菜单：先开菜单，再点菜单项 */
export async function openTabMenu(page: Page, browser: Locator) {
	await browser.locator('.browser__more').click()
	await expect(page.getByRole('menuitem').first()).toBeVisible()
}

/** 预置本机登录标记与落点（口径同 `features/auth/tests/entry.browser.ts`）。 */
export async function markSignedIn(page: Page, landing?: string) {
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

export const columns = (page: Page) => ({
	nav: page.locator('.nav'),
	content: page.locator('.content'),
	browser: page.locator('.browser')
})

/** 一次量三栏的位置与宽，用来比互换前后的读数。 */
export async function metrics(page: Page) {
	const { nav, content, browser } = columns(page)
	const read = async (locator: Locator) =>
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
export async function widenBrowser(page: Page, delta = 320) {
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
