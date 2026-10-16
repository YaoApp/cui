import { expect, test, type Page } from '@playwright/test'

/* 标签拖动换序的组件用例：位移不到 4 像素算点击，超过算拖动；
   落点画插入指示线；松手提交，顺序记本机；Escape 取消。 */

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

const boxOf = async (page: Page, label: string) => {
	const tab = page.locator('.browser__tabs .browser__tab:not([data-hidden])', { hasText: label }).first()
	return (await tab.boundingBox())!
}

test('reorders a tab by dragging and remembers the order after a reload', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')
	await openTab(page, 'b.com')
	expect(await labels(page)).toEqual(['首页', 'a.com', 'b.com'])

	/* 把 b.com 拖到最前：落点在首页标签中点的左侧 */
	const from = await boxOf(page, 'b.com')
	const home = await boxOf(page, '首页')
	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
	await page.mouse.down()
	await page.mouse.move(home.x + 4, from.y + from.height / 2, { steps: 8 })
	await expect(page.locator('.browser__tabs-indicator')).toHaveCount(1)
	await page.mouse.up()

	await expect.poll(() => labels(page)).toEqual(['b.com', '首页', 'a.com'])
	await page.reload()
	await expect.poll(() => labels(page)).toEqual(['b.com', '首页', 'a.com'])
})

test('a small move stays a click and Escape cancels a drag', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')
	await openTab(page, 'b.com')

	/* 位移 3 像素：不换序，仍然是一次激活 */
	const box = await boxOf(page, 'a.com')
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
	await page.mouse.down()
	await page.mouse.move(box.x + box.width / 2 + 3, box.y + box.height / 2, { steps: 2 })
	await page.mouse.up()
	expect(await labels(page)).toEqual(['首页', 'a.com', 'b.com'])
	await expect(
		page.locator('.browser__tabs .browser__tab:not([data-hidden])', { hasText: 'a.com' }).first().getByRole('tab')
	).toHaveAttribute('aria-selected', 'true')

	/* 拖到一半按 Escape：回到原位 */
	const from = await boxOf(page, 'b.com')
	const home = await boxOf(page, '首页')
	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
	await page.mouse.down()
	await page.mouse.move(home.x + 4, from.y + from.height / 2, { steps: 8 })
	await expect(page.locator('.browser__tabs-indicator')).toHaveCount(1)
	await page.keyboard.press('Escape')
	await page.mouse.up()
	await expect(page.locator('.browser__tabs-indicator')).toHaveCount(0)
	expect(await labels(page)).toEqual(['首页', 'a.com', 'b.com'])
})

test('a press on the close key does not start a drag', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')
	await openTab(page, 'b.com')

	const target = page.locator('.browser__tabs .browser__tab:not([data-hidden])', { hasText: 'b.com' }).first()
	const close = target.locator('.browser__tab-close')
	const closeBox = (await close.boundingBox())!
	await page.mouse.move(closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2)
	await page.mouse.down()
	await page.mouse.move(closeBox.x - 120, closeBox.y + closeBox.height / 2, { steps: 6 })
	await expect(page.locator('.browser__tabs-indicator')).toHaveCount(0)
	await page.mouse.up()
	/* 拖动没开始，b.com 仍在原位；这一次按下也没有关掉它，因为指针移出了关闭键 */
	expect(await labels(page)).toEqual(['首页', 'a.com', 'b.com'])
})
