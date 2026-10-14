import { expect, test } from '@playwright/test'
import { columns, markSignedIn, openTabMenu } from './layout.helpers'

/* 动效这一层：布局动画期间导航行不许被压扁、减少动态偏好下退化为瞬时、
   拖动分界线期间必须跟手（不做阻尼拖尾）而分栏与标签的动画仍在。 */

test('keeps the navigation rows steady through the layout animation', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const nav = columns(page).nav
	const rows = page.locator('.nav__list > li')
	/* 每一条的纵坐标与高度：动画中段与落定后都应当与动画前一致，也就是没有被宽度压扁或重排 */
	const shape = async () =>
		rows.evaluateAll((els) =>
			els.map((el) => {
				const box = el.getBoundingClientRect()
				return [Math.round(box.height), Math.round(box.top)]
			})
		)
	const before = await shape()

	await page.mouse.move(140, 20)
	await page.locator('.nav__header .nav__toggle').click()
	await page.waitForTimeout(120) // 动画中段
	const mid = await shape()
	await page.waitForTimeout(500) // 落定
	const settled = await shape()

	expect(mid).toEqual(before)
	expect(settled).toEqual(before)
	// 列宽确实收到了零，说明动画真的走完
	expect(await nav.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThan(1)
})

test('turns the layout animation off under the reduced motion preference', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' })
	await page.setViewportSize({ width: 1280, height: 800 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const nav = columns(page).nav

	await page.mouse.move(140, 20)
	await page.locator('.nav__header .nav__toggle').click()
	// 该偏好下退化为瞬时：点完立刻就是零宽
	expect(await nav.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThan(1)
})

test('keeps the boundary drag instant while the layout animation is on', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	const edge = browser.locator('.browser__edge')
	const grip = (await edge.boundingBox())!
	const y = grip.y + 300
	const before = (await browser.boundingBox())!.width

	await page.mouse.move(grip.x + grip.width / 2, y)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 - 200, y, { steps: 6 })
	await expect(browser).toHaveAttribute('data-dragging', 'true')
	// 跟手：拖动中没有阻尼拖尾，栏宽与指针走过的距离一致（允许 2 像素误差）
	const moved = (await browser.boundingBox())!.width
	expect(Math.abs(moved - (before + 200))).toBeLessThanOrEqual(2)
	await page.mouse.up()

	// 松手后投影接手，宽度落定在拖动结束的位置
	await page.waitForTimeout(500)
	expect(Math.abs((await browser.boundingBox())!.width - moved)).toBeLessThanOrEqual(2)

	// 分栏与标签的动画仍在
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	await expect(browser.locator('.browser__pane')).toHaveCount(2)
	await expect(browser.locator('.browser__tab').first()).toHaveCSS('animation-name', 'browser-tab-in')
})
