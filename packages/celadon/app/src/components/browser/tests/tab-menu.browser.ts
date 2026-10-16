import { expect, test, type Page } from '@playwright/test'

/* 标签右键菜单：刷新 · 关闭这个标签 · 分隔线 · 关闭其他标签 · 关闭全部标签。
   后两项按可用性置灰；点其他地方或被关掉之后菜单收掉。 */

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

async function openMenuOn(page: Page, label: string) {
	await page
		.locator('.browser__tabs .browser__tab:not([data-hidden])', { hasText: label })
		.first()
		.click({ button: 'right' })
	await expect(page.getByRole('menuitem', { name: '关闭这个标签' })).toBeVisible()
	/* 只开标签这一个菜单：顶栏那条「空白处右键开菜单」不该跟着弹出来 */
	await expect(page.locator('.browser__menu:visible')).toHaveCount(1)
}

test('lists the tab actions and greys the ones that cannot run', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')

	await openMenuOn(page, 'a.com')
	const menu = page.locator('.browser__menu--tab')
	await expect(menu.getByRole('menuitem')).toHaveCount(4)
	await expect(menu.locator('.browser__menu-separator')).toHaveCount(1)
	await expect(page.getByRole('menuitem', { name: '刷新这个标签' })).toBeEnabled()
	await expect(page.getByRole('menuitem', { name: '关闭其他标签' })).toBeDisabled()
	await expect(page.getByRole('menuitem', { name: '关闭全部标签' })).toBeEnabled()
	await page.keyboard.press('Escape')
	await expect(page.getByRole('menuitem', { name: '关闭这个标签' })).toHaveCount(0)
})

test('close others keeps the clicked tab, close all falls back to the home page', async ({
	page
}) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')
	await openTab(page, 'b.com')

	await openMenuOn(page, 'a.com')
	await page.getByRole('menuitem', { name: '关闭其他标签' }).click()
	expect(await labels(page)).toEqual(['首页', 'a.com'])

	await openMenuOn(page, 'a.com')
	await page.getByRole('menuitem', { name: '关闭全部标签' }).click()
	expect(await labels(page)).toEqual(['首页'])
	await expect(page.locator('.browser__tabs .browser__tab[data-active] .browser__tab-label')).toHaveText(
		'首页'
	)
})

test('refresh is wired and leaves the page in place', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')

	await openMenuOn(page, 'a.com')
	await page.getByRole('menuitem', { name: '刷新这个标签' }).click()
	expect(await labels(page)).toEqual(['首页', 'a.com'])
	await expect(page.locator('.browser__tabs .browser__tab[data-active] .browser__tab-label')).toHaveText(
		'a.com'
	)
})
