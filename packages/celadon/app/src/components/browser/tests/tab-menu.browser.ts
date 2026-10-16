import { expect, test, type Page } from '@playwright/test'

/* 标签右键菜单：刷新 · 关闭这个标签 · 分隔线 · 关闭其他标签 · 关闭全部标签。
   后两项按可用性置灰；点其他地方或被关掉之后菜单收掉。 */

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

async function openMenuOn(page: Page, label: string) {
	await page
		.locator('.browser__tabs .browser__tab:not([data-hidden])', { hasText: label })
		.first()
		.click({ button: 'right' })
	await expect(page.getByRole('menuitem', { name: '关闭这个标签' })).toBeVisible()
	/* 只开标签这一个菜单：顶栏那条「空白处右键开菜单」不该跟着弹出来 */
	await expect(page.locator('.browser__menu:visible')).toHaveCount(1)
}

test('keeps the menu on the floating layer, above the tab strip', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')
	await openMenuOn(page, '首页')

	const result = await page.evaluate(() => {
		const layer = document.querySelector('.browser__menu-layer')!
		const menu = document.querySelector('.browser__menu--tab')!
		const strip = document.querySelector('.browser__tabs')!
		const scope = document.querySelector('.celadon') ?? document.documentElement
		const token = getComputedStyle(scope).getPropertyValue('--z-overlay').trim()
		const m = menu.getBoundingClientRect()
		const t = strip.getBoundingClientRect()
		const overlap = m.left < t.right && m.right > t.left && m.top < t.bottom && m.bottom > t.top
		const x = (Math.max(m.left, t.left) + Math.min(m.right, t.right)) / 2
		const y = (Math.max(m.top, t.top) + Math.min(m.bottom, t.bottom)) / 2
		return {
			overlap,
			layerZ: getComputedStyle(layer).zIndex,
			stripZ: Number(getComputedStyle(strip).zIndex),
			token,
			/* 重叠处最上层是菜单：层级只有加在带 transform 的定位层上才成立 */
			onTop: Boolean(document.elementFromPoint(x, y)?.closest('.browser__menu--tab'))
		}
	})

	expect(result.overlap).toBe(true)
	expect(result.layerZ).toBe(result.token)
	expect(Number(result.layerZ)).toBeGreaterThan(result.stripZ)
	expect(result.onTop).toBe(true)
})

test('greys the close items on the home tab and ignores the click', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')

	await openMenuOn(page, '首页')
	/* 首页不可关、也没有别的可关页：三项都禁用，并且真的点不动 */
	for (const name of ['关闭这个标签', '关闭其他标签', '关闭全部标签']) {
		await expect(page.getByRole('menuitem', { name })).toHaveAttribute('aria-disabled', 'true')
	}
	await page.getByRole('menuitem', { name: '关闭全部标签' }).click({ force: true })
	expect(await labels(page)).toEqual(['首页'])

	/* 置灰要真的画出来：禁用项的文字色与可用项不同 */
	const colorOf = (name: string) =>
		page.getByRole('menuitem', { name }).evaluate((element) => getComputedStyle(element).color)
	expect(await colorOf('关闭全部标签')).not.toBe(await colorOf('刷新这个标签'))
	await expect(
		page.locator('.browser__tabs .browser__tab[data-active] .browser__tab-label')
	).toHaveText('首页')
})

test('lists the tab actions and greys the ones that cannot run', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')

	await openMenuOn(page, 'a.com')
	const menu = page.locator('.browser__menu--tab')
	await expect(menu.getByRole('menuitem')).toHaveCount(4)
	/* 关闭类三项一律同一个叉，刷新另用一个图形 */
	const icons = await menu
		.locator('svg use')
		.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href') ?? ''))
	expect(icons).toHaveLength(4)
	expect(icons[0]).not.toBe(icons[1])
	expect(icons.slice(1)).toEqual([icons[1], icons[1], icons[1]])
	await expect(menu.locator('.browser__menu-separator')).toHaveCount(1)
	await expect(page.getByRole('menuitem', { name: '刷新这个标签' })).toBeEnabled()
	await expect(page.getByRole('menuitem', { name: '关闭其他标签' })).toBeDisabled()
	await expect(page.getByRole('menuitem', { name: '关闭全部标签' })).toBeEnabled()
	await page.keyboard.press('Escape')
	await expect(page.getByRole('menuitem', { name: '关闭这个标签' })).toHaveCount(0)
})

test('close others keeps the clicked tab, close all falls back to the home page', async ({
	page
}) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')
	await openTab(page, 'b.com')

	await openMenuOn(page, 'a.com')
	await page.getByRole('menuitem', { name: '关闭其他标签' }).click()
	expect(await labels(page)).toEqual(['首页', 'a.com'])

	await openMenuOn(page, 'a.com')
	await page.getByRole('menuitem', { name: '关闭全部标签' }).click()
	expect(await labels(page)).toEqual(['首页'])
	await expect(page.locator('.browser__tabs .browser__tab[data-active] .browser__tab-label')).toHaveText(
		'首页'
	)
})

test('refresh is wired and leaves the page in place', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	await openTab(page, 'a.com')

	await openMenuOn(page, 'a.com')
	await page.getByRole('menuitem', { name: '刷新这个标签' }).click()
	expect(await labels(page)).toEqual(['首页', 'a.com'])
	await expect(page.locator('.browser__tabs .browser__tab[data-active] .browser__tab-label')).toHaveText(
		'a.com'
	)
})
