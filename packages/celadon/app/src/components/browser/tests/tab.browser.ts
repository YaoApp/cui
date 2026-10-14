import { expect, test, type Page } from '@playwright/test'

/* 标签项的细节用例：字号与导航列同档、块内对齐、关闭键的显隐与位置。
   第二个标签沿应用自身的入口开：在首页的「外部地址」里填地址并回车。 */
async function markSignedIn(page: Page) {
	await page.addInitScript(() =>
		localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() })),
	)
}

async function openSecondTab(page: Page) {
	await page.goto('/app/inbox')
	const browser = page.locator('.browser')
	await browser.getByLabel('外部地址').fill('example.com')
	await browser.getByLabel('外部地址').press('Enter')
	await expect(browser.getByRole('tab', { name: 'example.com' })).toBeVisible()
	return browser
}

test('the tab label reads at the body size and the close key sits inside the block', async ({
	page,
}) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	const browser = await openSecondTab(page)

	const tab = browser.getByRole('tab', { name: 'example.com' }).locator('..')
	const label = tab.locator('.browser__tab-label')
	await expect(label).toHaveCSS('font-size', '12px')

	/* 整块可点：指针是手型 */
	await expect(tab.locator('.browser__tab-main')).toHaveCSS('cursor', 'pointer')

	/* 最窄 48：短标题不占一大片空底 */
	const minWidth = await tab.evaluate((el) => getComputedStyle(el).minInlineSize)
	expect(minWidth).toBe('48px')

	/* 关闭键在块内，贴块的右缘：它的右边缘与块的右边缘相差不超过块的内距 8 */
	const block = (await tab.boundingBox())!
	const close = (await tab.locator('.browser__tab-close').boundingBox())!
	expect(close.x + close.width).toBeGreaterThan(block.x + block.width - 8)
	expect(close.x + close.width).toBeLessThanOrEqual(block.x + block.width)
	expect(close.y).toBeGreaterThanOrEqual(block.y)
	expect(close.y + close.height).toBeLessThanOrEqual(block.y + block.height)

	/* 关闭键图标是图标梯最小档 14，悬停时给自己一档底 */
	const glyph = (await tab.locator('.browser__tab-close svg').boundingBox())!
	expect(Math.round(glyph.width)).toBeLessThanOrEqual(14)
	const closeBox = tab.locator('.browser__tab-close')
	await closeBox.hover()
	await expect(closeBox).toHaveCSS('background-color', 'rgb(232, 232, 235)')

	/* 图标与文字之间留 8：图标的右缘到文字的起点不小于 8 */
	const iconBox = (await tab.locator('.browser__tab-main svg').boundingBox())!
	const labelBox = (await label.boundingBox())!
	expect(labelBox.x - (iconBox.x + iconBox.width)).toBeGreaterThanOrEqual(8)
})

test('the close key only shows when the pointer or the keyboard is on the tab', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	const browser = await openSecondTab(page)

	const tab = browser.getByRole('tab', { name: 'example.com' }).locator('..')
	const close = tab.locator('.browser__tab-close')
	await expect(close).toHaveCSS('opacity', '0')

	await tab.hover()
	await expect(close).toHaveCSS('opacity', '1')

	// 指针移开又收回
	await browser.getByRole('tab', { name: '首页' }).hover()
	await expect(close).toHaveCSS('opacity', '0')
})
