import { expect, test } from '@playwright/test'

/* 导航列的交互用例：模拟真实指针与键盘，覆盖两处收放、键的显隐、折叠行的找回菜单与滚动。
   与几何用例的分工是：这里只断言「点了以后会怎样」，不量尺寸；尺寸由 layout.browser.ts 负责。 */

const NAV = '.nav'
const TOGGLE = '.nav__toggle'
const FOLD = '.nav__fold'

test.describe('导航列的交互', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/app/inbox', { waitUntil: 'domcontentloaded' })
		await expect(page.locator(NAV)).toBeVisible()
		// 指针先停在内容区，避免初始位置压在导航列上影响显隐断言
		await page.mouse.move(900, 500)
	})

	test('一级菜单收放键与整列收起键默认都隐藏，指针进入导航区一起出现', async ({ page }) => {
		const fold = page.locator(FOLD).first()
		const toggle = page.locator(TOGGLE).first()
		await expect(fold).toHaveCSS('opacity', '0')
		await expect(toggle).toHaveCSS('opacity', '0')
		await page.mouse.move(140, 20)
		await expect(fold).toHaveCSS('opacity', '1')
		await expect(toggle).toHaveCSS('opacity', '1')
		await page.mouse.move(900, 500)
		await expect(fold).toHaveCSS('opacity', '0')
		await expect(toggle).toHaveCSS('opacity', '0')
	})

	test('点一级菜单键折起上区，折叠行出现且展开键可用，再点它恢复', async ({ page }) => {
		await page.mouse.move(140, 20)
		await expect(page.locator(FOLD).first()).toHaveCSS('opacity', '1')
		const main = page.locator(`${NAV} .nav__main`)
		await expect(main).toBeVisible()
		await page.locator(FOLD).first().click()
		// 上区收成零高
		await expect(main).toHaveCSS('height', '0px')
		// 折叠行与展开键出现
		const row = page.locator('.nav__scene-head')
		await expect(row).toBeVisible()
		const unfold = page.locator('.nav__unfold')
		await expect(unfold).toBeVisible()
		// 展开键把上区找回来
		await unfold.click()
		await expect(main).not.toHaveCSS('height', '0px')
	})

	test('折叠行的找回菜单：悬停可弹出，Esc 关闭；键盘进入时焦点交回触发元素', async ({ page }) => {
		await page.mouse.move(140, 20)
		await expect(page.locator(FOLD).first()).toHaveCSS('opacity', '1')
		await page.locator(FOLD).first().click()
		await expect(page.locator('.nav__scene-head')).toBeVisible()
		const trigger = page.locator('.nav__current').first()
		await expect(trigger).toBeVisible()

		/* 路径一：悬停弹出，Esc 关闭（这条路径下焦点从未进入菜单，不做焦点断言） */
		await trigger.hover({ force: true })
		const menu = page.locator('.nav__menu')
		await expect(menu).toBeVisible({ timeout: 15000 })
		await page.keyboard.press('Escape')
		await expect(menu).toBeHidden()

		/* 路径二：键盘把焦点放到触发元素后打开，Esc 关闭并交回焦点 */
		await trigger.focus()
		await expect(trigger).toBeFocused()
		await page.keyboard.press('Enter')
		await expect(menu).toBeVisible({ timeout: 15000 })
		await page.keyboard.press('Escape')
		await expect(menu).toBeHidden()
		await expect(trigger).toBeFocused()
	})

	test('点整列收起键：列宽为零、内容从最左铺满，出口在内容列头左端', async ({ page }) => {
		await page.mouse.move(140, 20)
		await page.locator(TOGGLE).first().click()
		const nav = page.locator(NAV)
		await expect(nav).toHaveCSS('inline-size', '0px')
		const key = page.getByRole('button', { name: '展开导航' })
		await expect(key).toBeVisible()
		// 布局投影要走完才算落定，落定后内容列从窗口最左起排
		await page.waitForTimeout(500)
		const navBox = await nav.boundingBox()
		const contentBox = await page.locator('.content').boundingBox()
		expect(navBox?.width ?? -1).toBeLessThan(1)
		expect(Math.round(contentBox?.x ?? -1)).toBe(0)
	})

	test('窄视口自动收起，导航自身状态与零宽一致', async ({ page }) => {
		await page.setViewportSize({ width: 900, height: 700 })
		await page.waitForTimeout(200)
		const root = page.locator('[data-width]')
		await expect(root).toHaveAttribute('data-width', 'zero')
		await expect(root).toHaveAttribute('data-nav', 'collapsed')
		const nav = page.locator(NAV)
		// 列宽走 --duration-base 过渡，先等它真的收到零再量，固定等待在负载下会读到中间值
		await expect(nav).toHaveCSS('inline-size', '0px')
		expect((await nav.boundingBox())?.width ?? -1).toBeLessThan(1)
	})

	test('内容超高时两块各自滚动，悬停出现滚动条且互不叠压', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 520 })
		await page.waitForTimeout(200)
		const main = page.locator(`${NAV} .nav__main`)
		const scene = page.locator(`${NAV} .nav__scene`)
		const mainBox = await main.boundingBox()
		const sceneBox = await scene.boundingBox()
		expect(mainBox && sceneBox).toBeTruthy()
		// 两块不重叠：上区底不越过场景区顶
		expect(Math.round((mainBox?.y ?? 0) + (mainBox?.height ?? 0))).toBeLessThanOrEqual(
			Math.round(sceneBox?.y ?? 0) + 1
		)
		// 悬停导航列后上区出现滚动条
		const bar = page.locator(`${NAV} .nav__main .scroll-area__bar`)
		await expect(bar).toHaveCount(1)
		await page.locator(`${NAV} .nav__main .nav__scroll`).hover()
		await expect(bar).toHaveCSS('opacity', '1')
	})

	test('顶带里的三块都不参与文本选择，指针是箭头', async ({ page }) => {
		// 顶带里的按下用来拖窗口与双击最大化，选中文字会跟着这两个动作一起出现
		// Windows 顶栏是第四块，Web 上不渲染，由桌面壳侧验
		for (const selector of [`${NAV} .nav__header`, '.content__head', '.browser__bar']) {
			const block = page.locator(selector)
			await expect(block).toHaveCSS('user-select', 'none')
			await expect(block).toHaveCSS('cursor', 'default')
		}
	})
})
