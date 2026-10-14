import { expect, test, type Page } from '@playwright/test'

/* 标签项的细节用例：字号与导航列同档、块内对齐、关闭键的显隐与位置。
   第二个标签沿应用自身的入口开：在首页的「外部地址」里填地址并回车。 */
async function markSignedIn(page: Page) {
	await page.addInitScript(() =>
		localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() })),
	)
}

test('the home tab is a normal page: icon, title and its own close key', async ({ page }) => {
	await page.setViewportSize({ width: 1100, height: 800 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const home = page.locator('.browser__tab').first()
	const block = (await home.boundingBox())!
	const icon = (await home.locator('.browser__tab-main svg').boundingBox())!
	const close = (await home.locator('.browser__tab-close').boundingBox())!

	/* 左侧内距是 8；关闭键贴块右缘（上下与右侧的视觉间距一致由第 7 条的用例量） */
	expect(Math.abs(icon.x - block.x - 8)).toBeLessThanOrEqual(1)
	expect(Math.abs(close.x + close.width - (block.x + block.width))).toBeLessThanOrEqual(1)
	/* 首页的图形由模型给：i-home */
	expect(await home.locator('.browser__tab-main svg use').getAttribute('href')).toBe('#i-home')
})

async function openSecondTab(page: Page) {
	await page.goto('/app/inbox')
	const browser = page.locator('.browser')
	/* 新建键恒在：点它开一个空页，再在空页里填地址 */
	await browser.getByRole('button', { name: '新建标签' }).click()
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
	/* 块宽由内容算出，可能是小数；关闭键的盒取整，所以允许 1 像素的亚像素差 */
	expect(close.x + close.width).toBeLessThanOrEqual(block.x + block.width + 1)
	expect(close.y).toBeGreaterThanOrEqual(block.y)
	expect(close.y + close.height).toBeLessThanOrEqual(block.y + block.height + 1)

	/* 关闭键图标是图标梯最小档 14，悬停时给自己一档底 */
	const glyph = (await tab.locator('.browser__tab-close svg').boundingBox())!
	expect(Math.round(glyph.width)).toBeLessThanOrEqual(14)
	const closeBox = tab.locator('.browser__tab-close')
	/* 关闭键只在指针进到标签块时可见：先悬停块，再悬停它 */
	await tab.hover()
	await closeBox.hover()
	/* 纯图标：悬停不给底色，改为放大 1.2 并把颜色提到主级 */
	await expect(closeBox).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
	await expect(closeBox).toHaveCSS('transform', 'matrix(1.2, 0, 0, 1.2, 0, 0)')
	await expect(closeBox).toHaveCSS('color', 'rgb(20, 18, 14)')

	/* 叉号到块右缘的视觉间距与上下留白一致：24 的块高、14 的图形，上下各 5 */
	const glyphBox = (await tab.locator('.browser__tab-close svg').boundingBox())!
	const rightGap = block.x + block.width - (glyphBox.x + glyphBox.width)
	const topGap = glyphBox.y - block.y
	expect(Math.abs(rightGap - topGap)).toBeLessThanOrEqual(1)

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
	const newKey = browser.locator('.browser__new')

	/* 先把指针移开：开页那一下的落点可能正好留在标签上 */
	await page.mouse.move(10, 10)
	const tabAtRest = (await tab.boundingBox())!
	const newAtRest = (await newKey.boundingBox())!
	await expect(close).toHaveCSS('visibility', 'hidden')

	await tab.hover()
	await expect(close).toHaveCSS('visibility', 'visible')

	/* 悬停不许让标签或条里后面的键移动：宽、高、位置都要与静止时一致 */
	const tabOnHover = (await tab.boundingBox())!
	const newOnHover = (await newKey.boundingBox())!
	expect(Math.abs(tabOnHover.width - tabAtRest.width)).toBeLessThanOrEqual(1)
	expect(Math.abs(tabOnHover.height - tabAtRest.height)).toBeLessThanOrEqual(1)
	expect(Math.abs(tabOnHover.x - tabAtRest.x)).toBeLessThanOrEqual(1)
	expect(Math.abs(newOnHover.x - newAtRest.x)).toBeLessThanOrEqual(1)

	// 指针移开又收回
	await browser.getByRole('tab', { name: '首页' }).hover()
	await expect(close).toHaveCSS('visibility', 'hidden')
	const newBack = (await newKey.boundingBox())!
	expect(Math.abs(newBack.x - newAtRest.x)).toBeLessThanOrEqual(1)
})

test('the new key opens a blank page first and fills it in place', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	const browser = await openSecondTab(page)
	const tabs = browser.getByRole('tab')
	await expect(tabs).toHaveCount(2)

	await browser.getByRole('button', { name: '新建标签' }).click()

	/* 先出现一项并激活，内容与首页相同：地址入口就在这一页里 */
	const blank = browser.getByRole('tab', { name: '新标签页' })
	await expect(blank).toBeVisible()
	await expect(blank).toHaveAttribute('aria-selected', 'true')
	await expect(tabs).toHaveCount(3)
	await expect(browser.getByLabel('外部地址')).toBeVisible()

	/* 在空页里填地址：页本身与位置都不换，换的是内容与标签名 */
	await browser.getByLabel('外部地址').fill('help')
	await browser.getByLabel('外部地址').press('Enter')

	const filled = browser.getByRole('tab', { name: '/help' })
	await expect(filled).toBeVisible()
	await expect(filled).toHaveAttribute('aria-selected', 'true')
	await expect(tabs).toHaveCount(3)
	/* 原位换内容：第三个还是第三个，前两页的名字不动 */
	await expect(tabs.nth(0)).toHaveAccessibleName('首页')
	await expect(tabs.nth(1)).toHaveAccessibleName('example.com')
	await expect(tabs.nth(2)).toHaveAccessibleName('/help')
	await expect(browser.getByText('内部路由的页先占位，稍后接真实内容')).toBeVisible()
})
