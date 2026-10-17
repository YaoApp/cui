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

test('keeps the browser content still while the column opens and closes', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = columns(page).browser
	const sample = (selector: string) =>
		page.evaluate(async (sel) => {
			const hint = document.querySelector('.browser__hint')!
			const rows: Array<{ column: number; content: number }> = []
			;(document.querySelector(sel) as HTMLElement).click()
			await new Promise<void>((resolve) => {
				const start = performance.now()
				const tick = () => {
					rows.push({
						column: Math.round(document.querySelector('.browser')!.getBoundingClientRect().width),
						content: Math.round(hint.getBoundingClientRect().width)
					})
					if (performance.now() - start < 700) requestAnimationFrame(tick)
					else resolve()
				}
				requestAnimationFrame(tick)
			})
			return rows
		}, selector)

	await page.locator('.browser__close').click()
	await expect(browser).toHaveAttribute('data-collapsed', 'true')
	const opening = await sample('.content__head-key--browser')
	/* 本栏在长，而栏内文本块的宽度只有一个取值：窗口在变、内容不动 */
	expect(new Set(opening.map((row) => row.content)).size).toBe(1)
	expect(opening.some((row) => row.column < row.content)).toBe(true)

	const closing = await sample('.browser__close')
	expect(new Set(closing.map((row) => row.content)).size).toBe(1)
	await expect(browser).toHaveAttribute('data-collapsed', 'true')
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
	await page.mouse.move(grip.x + grip.width / 2 - 320, y, { steps: 6 })
	await expect(browser).toHaveAttribute('data-dragging', 'true')
	// 跟手：拖动中没有阻尼拖尾，栏宽与指针走过的距离一致（允许 2 像素误差）
	const moved = (await browser.boundingBox())!.width
	expect(Math.abs(moved - (before + 320))).toBeLessThanOrEqual(2)
	await page.mouse.up()

	// 松手后投影接手，宽度落定在拖动结束的位置
	await page.waitForTimeout(500)
	expect(Math.abs((await browser.boundingBox())!.width - moved)).toBeLessThanOrEqual(2)

	// 分栏与标签的入场仍在（进场已从关键帧改成内层元素上的过渡，见 browser.less）
	await openTabMenu(page, browser)
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	await expect(browser.locator('.browser__pane')).toHaveCount(2)
	await expect(browser.locator('.browser__tab-main').first()).toHaveCSS(
		'transition-property',
		'opacity, transform'
	)
})
