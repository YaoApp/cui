import { expect, test } from '@playwright/test'
import { columns, markSignedIn, openTabMenu, widenBrowser } from './layout.helpers'

/* 上下分栏与面板独占：竖向分隔条的拖动与极值、按本栏实宽判的键可用性、
   面板独占整扇窗口与 Esc 退出、拖过宽度之后再进独占仍铺满、独占里收掉这一栏。 */

test('drags the stacked divider and resets it by double click', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser

	// 先拖宽本栏（分栏键按本栏实宽判，400 时是禁用的）
	const edge = browser.locator('.browser__edge')
	const grip = (await edge.boundingBox())!
	await page.mouse.move(grip.x + grip.width / 2, grip.y + 300)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 - 300, grip.y + 300, { steps: 8 })
	await page.mouse.up()
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '上下分栏' }).click()

	const divider = browser.locator('.browser__divider')
	const panes = browser.locator('.browser__pane')
	const heights = async () =>
		panes.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)))

	// 往下拖到容器的四分之一：第一个面板变矮
	const box = (await browser.locator('.browser__body').boundingBox())!
	const handle = (await divider.boundingBox())!
	await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
	await page.mouse.down()
	await page.mouse.move(handle.x + handle.width / 2, box.y + box.height * 0.25, { steps: 8 })
	await page.mouse.up()
	const dragged = await heights()
	expect(dragged[0]).toBeLessThan(dragged[1])

	// 双击回平分：高度差只来自中间那根抓手
	await divider.dblclick()
	await page.waitForTimeout(400)
	const even = await heights()
	expect(Math.abs(even[0] - even[1])).toBeLessThanOrEqual(10)

	// 拖到上端极值：两个面板都留得住自己那一份，比例夹在 0.2 与 0.8 之间
	const again = (await divider.boundingBox())!
	await page.mouse.move(again.x + again.width / 2, again.y + again.height / 2)
	await page.mouse.down()
	await page.mouse.move(again.x + again.width / 2, box.y - 200, { steps: 10 })
	await page.mouse.up()
	const top = await heights()
	const total = top[0] + top[1]
	expect(top[0] / total).toBeGreaterThanOrEqual(0.18)
	expect(top[1] / total).toBeGreaterThanOrEqual(0.18)
})

test('disables the split keys when the column itself is too narrow', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser

	// 宽窗口下先把本栏拖到最小（300），此时两颗分栏键应按**本栏实宽**禁用
	const edge = browser.locator('.browser__edge')
	const grip = (await edge.boundingBox())!
	const y = grip.y + 300
	await page.mouse.move(grip.x + grip.width / 2, y)
	await page.mouse.down()
	await page.mouse.move(grip.x + 600, y, { steps: 12 })
	await page.mouse.up()
	expect(await browser.evaluate((el) => Math.round(el.getBoundingClientRect().width))).toBeLessThanOrEqual(302)
	await openTabMenu(page, browser)
	await expect(page.getByRole('menuitem', { name: '左右分栏' })).toBeDisabled()

	// 再拖宽到 700，两颗键恢复可用
	const grip2 = (await edge.boundingBox())!
	await page.mouse.move(grip2.x + grip2.width / 2, y)
	await page.mouse.down()
	await page.mouse.move(grip2.x + grip2.width / 2 - 400, y, { steps: 12 })
	await page.mouse.up()
	await openTabMenu(page, browser)
	await expect(page.getByRole('menuitem', { name: '左右分栏' })).toBeEnabled()
})

test('takes the pane full window and comes back with Escape', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser

	await page.locator('.browser__maximize').click()
	await expect(page.locator('.layout')).toHaveAttribute('data-exclusive', 'true')
	// 导航区与内容区让位（收到零宽，不是 display: none，这样布局投影才动得起来）
	await page.waitForTimeout(500)
	await expect(columns(page).nav).toHaveCSS('inline-size', '0px')
	await expect(columns(page).content).toHaveCSS('inline-size', '0px')
	const box = (await browser.boundingBox())!
	expect(box.width).toBeGreaterThan(1500)
	expect(box.x).toBeLessThanOrEqual(1)

	// Esc 退出，回到原来的三栏
	await page.keyboard.press('Escape')
	await expect(page.locator('.layout')).not.toHaveAttribute('data-exclusive', 'true')
	await page.waitForTimeout(500)
	expect((await columns(page).nav.boundingBox())!.width).toBeGreaterThan(200)
	expect((await columns(page).content.boundingBox())!.width).toBeGreaterThan(400)
})

test('takes the whole window in exclusive mode after the width has been dragged', async ({ page }) => {
	/* 拖过分界线之后进独占：宽度只写在自定义属性上，整栏才铺得满整扇窗口 */
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = await widenBrowser(page)
	const dragged = (await browser.boundingBox())!.width
	expect(dragged).toBeGreaterThan(600)

	await page.locator('.browser__maximize').click()
	await expect(page.locator('.layout')).toHaveAttribute('data-exclusive', 'true')
	await page.waitForTimeout(500)

	const full = (await browser.boundingBox())!
	expect(Math.round(full.width)).toBeGreaterThanOrEqual(1598)
	expect(full.x).toBeLessThanOrEqual(1)
	const style = (await browser.getAttribute('style')) ?? ''
	expect(style).toContain('--side-width')
	expect(style).not.toContain('inline-size')

	/* 退出后回到拖出来的宽度 */
	await page.keyboard.press('Escape')
	await page.waitForTimeout(600)
	expect(Math.abs((await browser.boundingBox())!.width - dragged)).toBeLessThanOrEqual(2)
})

test('leaves the exclusive mode when the column is collapsed from the menu', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser

	// 进独占，再点顶栏常显的关闭键收掉这一栏
	await page.locator('.browser__maximize').click()
	await expect(page.locator('.layout')).toHaveAttribute('data-exclusive', 'true')

	await page.locator('.browser__close').click()

	// 独占已经退出，导航区与内容区回来，本栏收成零宽，重新展开的入口在内容列头里
	await expect(page.locator('.layout')).not.toHaveAttribute('data-exclusive', 'true')
	// 布局投影要走完才算落定
	await page.waitForTimeout(500)
	await expect(columns(page).nav).toBeVisible()
	await expect(columns(page).content).toBeVisible()
	await expect(browser).toHaveAttribute('data-collapsed', 'true')
	await expect(browser).toHaveCSS('inline-size', '0px')
	// 整扇窗口不留空白：内容区占住了并且宽度正常
	const contentBox = (await columns(page).content.boundingBox())!
	expect(contentBox.width).toBeGreaterThan(900)
})
