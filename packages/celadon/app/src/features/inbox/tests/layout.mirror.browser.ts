import { expect, test, type Page } from '@playwright/test'

/* 镜像态（标签浏览器换到左侧）：键位按主栏 / 次栏给。
   主栏是中间那一栏，镜像态是标签浏览器：它顶栏前段装导航找回键、后段装次栏找回键，不画收起键；
   次栏是内容区：它列头右端装自己的收起键。正常态的键位由既有用例守着，这里只测镜像态。 */

async function markSignedIn(page: Page) {
	await page.addInitScript(() =>
		localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() }))
	)
}

async function swapSide(page: Page) {
	await page.locator('.browser__more').click()
	await page.getByRole('menuitem', { name: '换到另一侧' }).click()
	await expect(page.locator('.layout')).toHaveAttribute('data-mirror', 'true')
}

const widths = (page: Page) =>
	page.evaluate(() => {
		const box = (selector: string) => {
			const el = document.querySelector(selector)
			return el ? Math.round(el.getBoundingClientRect().width) : null
		}
		const strip = document.querySelector('.browser__tabs')!.getBoundingClientRect()
		const column = document.querySelector('.layout > .browser')!.getBoundingClientRect()
		return {
			content: box('.layout > .content'),
			browser: box('.layout > .browser'),
			/* 标签条起点相对本栏左缘：导航列收起后整片布局左移，这个差值才是键位带来的位移 */
			stripOffset: Math.round(strip.x - column.x)
		}
	})

test('mirror keeps the keys by role: front nav key, no collapse key, content head key', async ({ page }) => {
	await page.setViewportSize({ width: 1500, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await swapSide(page)

	/* 主栏不画收起键；次栏（内容区）的收起键在它自己列头右端 */
	await expect(page.locator('.browser__close')).toHaveCount(0)
	await expect(page.locator('.content__head-key--browser')).toBeVisible()
	await expect(page.locator('.content__head-key--browser')).toHaveAttribute('aria-label', '收掉这一栏')

	/* 导航展开时前段槽位空着，收起后导航找回键出现，标签条随之右移它那一格 */
	const before = await widths(page)
	await page.locator('.nav__header .nav__toggle').click()
	await expect(page.locator('.browser__slot--nav')).toHaveAttribute('data-hidden', 'false')
	await expect(page.locator('.browser__nav')).toBeVisible()
	/* 槽位宽度带过渡，等它走完再量 */
	await expect(page.locator('.browser__slot--nav')).toHaveCSS('inline-size', '32px')
	const after = await widths(page)
	expect(after.stripOffset - before.stripOffset).toBeGreaterThanOrEqual(30)

	/* 点它把导航找回来 */
	await page.locator('.browser__nav').click()
	await expect(page.locator('.browser__slot--nav')).toHaveAttribute('data-hidden', 'true')
})

test('mirror collapses the content from its own head and brings it back from the main bar', async ({ page }) => {
	await page.setViewportSize({ width: 1500, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await swapSide(page)

	const open = await widths(page)
	expect(open.content).toBeGreaterThan(600)
	expect(open.browser).toBeGreaterThan(300)

	await page.locator('.content__head-key--browser').click()
	await expect(page.locator('.layout')).toHaveAttribute('data-browser', 'collapsed')
	await expect(page.locator('.layout > .content')).toHaveCSS('inline-size', '0px')
	/* 主栏铺满其余空间，找回键出现在顶栏后段 */
	await expect(page.locator('.browser__slot--trail')).toHaveAttribute('data-hidden', 'false')
	const collapsed = await widths(page)
	expect(collapsed.browser).toBeGreaterThan(1000)

	await page.locator('.browser__secondary-key').click()
	await expect(page.locator('.layout')).not.toHaveAttribute('data-browser', 'collapsed')
	await expect(page.locator('.browser__slot--trail')).toHaveAttribute('data-hidden', 'true')
	const restored = await widths(page)
	expect(restored.content).toBe(open.content)
	expect(restored.browser).toBe(open.browser)
})

test('mirror is remembered across reloads', async ({ page }) => {
	await page.setViewportSize({ width: 1500, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await swapSide(page)
	await page.reload()
	await expect(page.locator('.layout')).toHaveAttribute('data-mirror', 'true')
	await expect(page.locator('.browser__close')).toHaveCount(0)
})

test('narrow window takes away the secondary: content in mirror, browser in normal', async ({ page }) => {
	await page.setViewportSize({ width: 1500, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await swapSide(page)
	await page.setViewportSize({ width: 680, height: 900 })
	await page.waitForTimeout(400)

	/* 镜像态次栏是内容区：收掉的是它，主栏（标签浏览器）留着 */
	await expect(page.locator('.layout')).toHaveAttribute('data-browser', 'collapsed')
	const mirrored = await widths(page)
	expect(mirrored.content).toBe(0)
	expect(mirrored.browser).toBeGreaterThan(300)

	/* 换回正常态：收掉的是标签浏览器（既有口径不变）。本栏收掉后它的菜单点不到，
	   因此先把窗口放回去再换边，量完再压窄。 */
	await page.setViewportSize({ width: 1500, height: 900 })
	await page.waitForTimeout(300)
	await page.locator('.browser__more').click()
	await page.getByRole('menuitem', { name: '换到另一侧' }).click()
	await expect(page.locator('.layout')).not.toHaveAttribute('data-mirror', 'true')
	await page.setViewportSize({ width: 680, height: 900 })
	await page.waitForTimeout(500)
	await expect(page.locator('.layout')).toHaveAttribute('data-browser', 'collapsed')
	const normal = await widths(page)
	expect(normal.browser).toBe(0)
	expect(normal.content).toBeGreaterThan(300)
})
