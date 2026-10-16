import { expect, test, type Page } from '@playwright/test'

/* 「打开过的东西」与地址入口的错误态：打开过的页按使用顺序列在首页（最近在前），
   点一条复用同一页；地址入口对空输入与不像地址的输入各给一种错误态。 */

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

test('lists what was opened, newest first, and reuses the page when picked', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')
	await openTab(page, 'b.com')

	/* 回首页看清单：最近打开的在前 */
	await page.locator('.browser__tabs .browser__tab', { hasText: '首页' }).first().click()
	const items = page.locator('.browser__recent-item')
	await expect(items).toHaveCount(2)
	await expect(items.first()).toHaveText('b.com')
	await expect(items.nth(1)).toHaveText('a.com')

	/* 点一条：切到已有那一页，不新开 */
	const before = await page.locator('.browser__tabs .browser__tab').count()
	await items.nth(1).click()
	await expect(page.locator('.browser__tabs .browser__tab[data-active] .browser__tab-label')).toHaveText(
		'a.com'
	)
	expect(await page.locator('.browser__tabs .browser__tab').count()).toBe(before)

	/* 点过的那一条提到最前 */
	await page.locator('.browser__tabs .browser__tab', { hasText: '首页' }).first().click()
	await expect(page.locator('.browser__recent-item').first()).toHaveText('a.com')
})

test('asks for an address and rejects what does not look like one', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const field = page.locator('.browser').getByLabel('外部地址')

	await field.fill('')
	await field.press('Enter')
	await expect(page.getByText('请输入地址')).toBeVisible()

	await field.fill('abc')
	await field.press('Enter')
	await expect(page.getByText('这看起来不是一个地址，试试 example.com')).toBeVisible()

	/* 合法地址：错误态收起，首页这一页就地换成那一页（设计：首页也一样在本页里换内容） */
	await field.fill('abc.com')
	await field.press('Enter')
	await expect(page.getByText('这看起来不是一个地址，试试 example.com')).toHaveCount(0)
	await expect(page.locator('.browser__tabs .browser__tab[data-active] .browser__tab-label')).toHaveText(
		'abc.com'
	)
})
