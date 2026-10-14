import { expect, test } from '@playwright/test'

/* 回归：导航区收起（`data-width=zero`）与面板独占同时成立时，本栏要占满整扇窗口。
   曾出过的问题：「导航区收起后把内容区那一份让出来」的上限压过了独占，本栏右侧空出一条。 */
test('exclusive fills the window when the navigation is collapsed', async ({ page }) => {
	await page.setViewportSize({ width: 1200, height: 800 })
	await page.addInitScript(() =>
		localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() })),
	)
	await page.goto('/app/inbox')
	const layout = page.locator('.layout')
	const browser = page.locator('.browser')

	// 先收起导航区（Web 下整列收起键默认隐藏，指针进导航区才出现），再进独占
	await page.locator('.nav').hover()
	await page.locator('.nav__toggle').click()
	await expect(layout).toHaveAttribute('data-width', 'zero')

	await page.locator('.browser__maximize').click()
	await expect(layout).toHaveAttribute('data-exclusive', 'true')

	await expect
		.poll(async () => Math.abs((await browser.boundingBox())!.width - 1200), { timeout: 5000 })
		.toBeLessThanOrEqual(2)
	const pane = (await page.locator('.browser__pane').boundingBox())!
	expect(Math.abs(pane.width - 1200)).toBeLessThanOrEqual(2)
})
