import { expect, test, type Page } from '@playwright/test'

/* 标签条溢出的组件用例：放不下的标签进下拉菜单上段，标签区不出现横向滚动，
   新建键与后段三颗键在任何栏宽下都完整可见。 */

const ADDRESSES = [
	'example.com/a-very-long-address-one',
	'example.com/a-very-long-address-two',
	'example.com/a-very-long-address-three'
]

async function markSignedIn(page: Page) {
	await page.addInitScript(() =>
		localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() }))
	)
}

/** 点新建再在空页里填地址回车：得到一页标题很长的标签 */
async function openLongTab(page: Page, address: string) {
	await page.locator('.browser__new').click()
	const field = page.locator('.browser').getByLabel('外部地址')
	await field.fill(address)
	await field.press('Enter')
	await expect(field).toHaveCount(0)
}

const visibleTabs = (page: Page) =>
	page.locator('.browser__tabs .browser__tab:not([data-hidden])')

test('keeps the strip free of horizontal scroll and lists the rest in the menu', async ({ page }) => {
	await page.setViewportSize({ width: 1100, height: 800 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = page.locator('.browser')

	for (const address of ADDRESSES) await openLongTab(page, address)
	/* 等溢出的重算落定：它在观察者回调里做，紧接着读会读到上一版 */
	await page.waitForTimeout(400)

	/* 标签区不横向滚动；放不下的不进可见排布（首页占一项，所以总共有四项） */
	const scroll = await browser.locator('.browser__tabs').evaluate((el) => el.scrollWidth - el.clientWidth)
	expect(scroll).toBeLessThanOrEqual(0)
	const visible = await visibleTabs(page).count()
	expect(visible).toBeGreaterThan(0)
	expect(visible).toBeLessThan(ADDRESSES.length + 1)

	/* 新建键与后段三颗键都在可视区内 */
	for (const key of ['.browser__new', '.browser__more', '.browser__maximize', '.browser__close']) {
		const box = (await browser.locator(key).boundingBox())!
		expect(box.width).toBeGreaterThan(0)
	}

	/* 菜单上段按原顺序列出放不下的那些：条数与内容都由可见的那一段反推 */
	await browser.locator('.browser__more').click()
	const labels = page.locator('.browser__menu-item .browser__menu-label')
	const visibleLabels = await visibleTabs(page).locator('.browser__tab-label').allInnerTexts()
	const expected = ['首页', ...ADDRESSES].filter((label) => !visibleLabels.includes(label))
	await expect(labels).toHaveCount(expected.length)
	expect(await labels.allInnerTexts()).toEqual(expected)
	await expect(page.locator('.browser__menu-separator')).toHaveCount(1)

	/* 点菜单里的第一项：这一页被激活，并且被换到条上（激活态看得见） */
	const target = expected[0]
	await labels.first().click()
	await expect(visibleTabs(page).getByRole('tab', { name: target })).toHaveAttribute(
		'aria-selected',
		'true'
	)
	expect(await page.locator('.browser__tabs .browser__tab[data-active]:not([data-hidden])').count()).toBe(1)
})

test('keeps the current page on the strip when it would not fit', async ({ page }) => {
	await page.setViewportSize({ width: 1100, height: 800 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = page.locator('.browser')
	for (const address of ADDRESSES) await openLongTab(page, address)
	await page.waitForTimeout(400)

	/* 当前页一定在条上，并且带激活态 */
	const active = page.locator('.browser__tabs .browser__tab[data-active]')
	await expect(active).toHaveCount(1)
	await expect(active).not.toHaveAttribute('data-hidden', 'true')
	await expect(active.getByRole('tab')).toHaveAttribute('aria-selected', 'true')

	/* 可见段是「从头放下的一段」，当前页替掉末尾那一项：除最后一项外，可见的就是列表的前面几项 */
	const all = ['首页', ...ADDRESSES]
	const visible = await visibleTabs(page).locator('.browser__tab-label').allInnerTexts()
	expect(visible.slice(0, -1)).toEqual(all.slice(0, visible.length - 1))
	expect(visible[visible.length - 1]).toBe(all[all.length - 1])

	/* 放不下的那些在菜单里，条上与菜单加起来正好是全部四页 */
	await browser.locator('.browser__more').click()
	const hiddenLabels = await page.locator('.browser__menu-item .browser__menu-label').allInnerTexts()
	expect(hiddenLabels).toHaveLength(4 - visible.length)
	expect(hiddenLabels.length).toBeGreaterThan(0)
})

test('brings the hidden tabs back when the column grows', async ({ page }) => {
	await page.setViewportSize({ width: 1100, height: 800 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = page.locator('.browser')
	for (const address of ADDRESSES) await openLongTab(page, address)

	const narrow = await visibleTabs(page).count()
	expect(narrow).toBeLessThan(ADDRESSES.length + 1)

	/* 拖宽本栏：放得下的标签变多；再拖回去：回到原来的数量 */
	const edge = browser.locator('.browser__edge')
	let grip = (await edge.boundingBox())!
	await page.mouse.move(grip.x + grip.width / 2, grip.y + 300)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 - 300, grip.y + 300, { steps: 8 })
	await page.mouse.up()
	await expect.poll(() => visibleTabs(page).count()).toBeGreaterThan(narrow)

	grip = (await edge.boundingBox())!
	await page.mouse.move(grip.x + grip.width / 2, grip.y + 300)
	await page.mouse.down()
	await page.mouse.move(grip.x + grip.width / 2 + 300, grip.y + 300, { steps: 8 })
	await page.mouse.up()
	await expect.poll(() => visibleTabs(page).count()).toBe(narrow)
})
