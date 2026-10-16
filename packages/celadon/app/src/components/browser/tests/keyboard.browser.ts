import { expect, test, type Page } from '@playwright/test'

/* 标签条的键盘路径：roving tabindex（只有一个标签可 Tab 到，落点是当前页）·
   左右箭头只挪焦点不换页 · Enter 与 Space 激活 · Delete 关闭 · Alt 加左右箭头挪一位。 */

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

/** 当前获得焦点的标签的可访问名 */
const focusedTab = (page: Page) =>
	page.evaluate(() => {
		const element = document.activeElement as HTMLElement | null
		return element?.closest('.browser__tab')?.querySelector('.browser__tab-label')?.textContent ?? null
	})

async function prepare(page: Page) {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')
	await openTab(page, 'b.com')
}

test('tabs are one Tab stop and the landing tab is the current page', async ({ page }) => {
	await prepare(page)
	const stops = page.locator('.browser__tabs .browser__tab-main[tabindex="0"]')
	await expect(stops).toHaveCount(1)
	await expect(stops).toHaveAttribute('aria-selected', 'true')
})

test('arrow keys move the focus without switching pages', async ({ page }) => {
	await prepare(page)
	await page.locator('.browser__tab-main[tabindex="0"]').focus()
	expect(await focusedTab(page)).toBe('b.com')

	await page.keyboard.press('ArrowLeft')
	expect(await focusedTab(page)).toBe('a.com')
	/* 只挪焦点：当前页仍是 b.com，roving 的落点跟着焦点走 */
	await expect(page.locator('.browser__tabs .browser__tab[data-active] .browser__tab-label')).toHaveText(
		'b.com'
	)
	await expect(page.locator('.browser__tab-main[tabindex="0"]')).toHaveAttribute(
		'aria-selected',
		'false'
	)

	await page.keyboard.press('Enter')
	await expect(page.locator('.browser__tabs .browser__tab[data-active] .browser__tab-label')).toHaveText(
		'a.com'
	)
})

test('space activates and Delete closes the focused tab', async ({ page }) => {
	await prepare(page)
	await page.locator('.browser__tab-main[tabindex="0"]').focus()
	await page.keyboard.press('ArrowLeft')
	await page.keyboard.press('Space')
	await expect(page.locator('.browser__tabs .browser__tab[data-active] .browser__tab-label')).toHaveText(
		'a.com'
	)

	await page.keyboard.press('Delete')
	expect(await labels(page)).toEqual(['首页', 'b.com'])
})

test('Alt with an arrow moves the focused tab one place and the focus follows', async ({ page }) => {
	await prepare(page)
	await page.locator('.browser__tab-main[tabindex="0"]').focus()
	expect(await focusedTab(page)).toBe('b.com')

	await page.keyboard.press('Alt+ArrowLeft')
	await expect.poll(() => labels(page)).toEqual(['首页', 'b.com', 'a.com'])
	await expect
		.poll(() => focusedTab(page))
		.toBe('b.com')
})
