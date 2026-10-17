import { expect, test, type Page } from '@playwright/test'

/* 两组标签的无障碍接线：标签与被控面板用 id 与 aria-controls 对上，
   新建键不在 tablist 里，分隔条能读出当前比例。 */

async function markSignedIn(page: Page) {
	await page.addInitScript(() =>
		localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() })),
	)
}

async function widenBrowser(page: Page) {
	const browser = page.locator('.browser')
	const edge = browser.locator('.browser__edge')
	const box = (await edge.boundingBox())!
	await page.mouse.move(box.x + box.width / 2, box.y + 200)
	await page.mouse.down()
	await page.mouse.move(box.x + box.width / 2 - 340, box.y + 200, { steps: 8 })
	await page.mouse.up()
	await page.waitForTimeout(300)
}

test('wires the single-pane tabs to their panel', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = page.locator('.browser')

	const tablist = browser.getByRole('tablist', { name: '主栏标签' })
	await expect(tablist).toHaveCount(1)
	await expect(tablist.getByRole('button', { name: '新建标签' })).toHaveCount(0)

	const tab = tablist.getByRole('tab', { name: '首页' })
	await expect(tab).toHaveAttribute('id', 'browser-primary-tab-home')
	await expect(tab).toHaveAttribute('aria-controls', 'browser-primary-panel')

	const panel = browser.locator('#browser-primary-panel')
	await expect(panel).toHaveAttribute('role', 'tabpanel')
	await expect(panel).toHaveAttribute('aria-labelledby', 'browser-primary-tab-home')
})

test('keeps the two groups on separate ids and names after the split', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = page.locator('.browser')
	await widenBrowser(page)
	await browser.locator('.browser__bar > .browser__more').click()
	await page.getByRole('menuitem', { name: '左右分栏' }).click()
	await expect(browser.locator('.browser__pane')).toHaveCount(2)

	/* 两条标签条各有自己的名字，读屏能分清读的是哪一组 */
	const primary = browser.getByRole('tablist', { name: '主栏标签' })
	const secondary = browser.getByRole('tablist', { name: '新栏标签' })
	await expect(primary).toHaveCount(1)
	await expect(secondary).toHaveCount(1)
	await expect(primary.getByRole('button', { name: '新建标签' })).toHaveCount(0)
	await expect(secondary.getByRole('button', { name: '新建标签' })).toHaveCount(0)

	/* 两组的 id 不撞：标签与面板各自成对 */
	const primaryTab = primary.getByRole('tab', { name: '首页' })
	await expect(primaryTab).toHaveAttribute('id', 'browser-primary-tab-home')
	await expect(primaryTab).toHaveAttribute('aria-controls', 'browser-primary-panel')
	await expect(browser.locator('#browser-primary-panel')).toHaveAttribute('role', 'tabpanel')
	await expect(browser.locator('#browser-primary-panel')).toHaveAttribute(
		'aria-labelledby',
		'browser-primary-tab-home'
	)

	const secondaryTab = secondary.getByRole('tab', { name: '首页' })
	await expect(secondaryTab).toHaveAttribute('id', 'browser-secondary-tab-home')
	await expect(secondaryTab).toHaveAttribute('aria-controls', 'browser-secondary-panel')
	await expect(browser.locator('#browser-secondary-panel')).toHaveAttribute('role', 'tabpanel')
	await expect(browser.locator('#browser-secondary-panel')).toHaveAttribute(
		'aria-labelledby',
		'browser-secondary-tab-home'
	)

	/* 新栏里开一页：面板的 aria-labelledby 跟着活动页换 */
	const strip = browser.locator('.browser__bar-secondary')
	await strip.getByRole('button', { name: '新建标签' }).click()
	await browser.locator('.browser__pane--secondary').getByLabel('外部地址').fill('a11y.example.com')
	await browser.locator('.browser__pane--secondary').getByLabel('外部地址').press('Enter')
	await expect(strip.getByRole('tab', { name: 'a11y.example.com' })).toHaveCount(1)
	const active = strip.getByRole('tab', { name: 'a11y.example.com' })
	await expect(active).toHaveAttribute('aria-selected', 'true')
	const activeId = await active.getAttribute('id')
	expect(activeId).toMatch(/^browser-secondary-tab-/)
	await expect(browser.locator('#browser-secondary-panel')).toHaveAttribute(
		'aria-labelledby',
		activeId as string
	)
	/* 主栏那一块不受影响 */
	await expect(browser.locator('#browser-primary-panel')).toHaveAttribute(
		'aria-labelledby',
		'browser-primary-tab-home'
	)
})

test('lets the divider report and change its value from the keyboard', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 })
	await markSignedIn(page)
	await page.goto('/app/inbox')
	const browser = page.locator('.browser')
	await widenBrowser(page)
	await browser.locator('.browser__bar > .browser__more').click()
	await page.getByRole('menuitem', { name: '左右分栏' }).click()

	const divider = browser.getByRole('separator', { name: '调整分栏比例' })
	await expect(divider).toHaveAttribute('aria-orientation', 'vertical')
	await expect(divider).toHaveAttribute('aria-valuemin', '20')
	await expect(divider).toHaveAttribute('aria-valuemax', '80')
	await expect(divider).toHaveAttribute('aria-valuenow', '50')

	/* 方向键微调：左右分栏新栏在左，右方向键让主栏那一份变小 */
	await divider.focus()
	await page.keyboard.press('ArrowRight')
	await expect(divider).toHaveAttribute('aria-valuenow', '48')
	await page.keyboard.press('ArrowLeft')
	await expect(divider).toHaveAttribute('aria-valuenow', '50')

	/* 双击回平分，回车也回平分 */
	await page.keyboard.press('ArrowRight')
	await expect(divider).toHaveAttribute('aria-valuenow', '48')
	await page.keyboard.press('Enter')
	await expect(divider).toHaveAttribute('aria-valuenow', '50')
})
