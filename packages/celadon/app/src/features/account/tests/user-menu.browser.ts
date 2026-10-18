import { expect, test, type Page } from '@playwright/test'

/* 账户菜单这一层：打开与关闭、进设置、快捷键、外链与退出确认。
   数据走 `VITE_ACCOUNT_MOCK=1` 的 fixture（见 `data/user/mock.ts`）。 */

const TRIGGER = '.user-menu__trigger'
const POPUP = '.user-menu__popup'

/** 本机登录标记：守卫只认这一笔，接口的真实会话由 mock 顶替。 */
async function markSignedIn(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() }))
  })
}

test.beforeEach(async ({ page }) => {
  await markSignedIn(page)
  await page.goto('/app/inbox')
  await expect(page.locator(TRIGGER)).toBeVisible()
})

test('opens from the footer, shows the mock account and closes on Escape', async ({ page }) => {
  const trigger = page.locator(TRIGGER)
  await expect(trigger).toContainText('Mock OAuth User')

  await trigger.click()
  const popup = page.locator(POPUP)
  await expect(popup).toBeVisible()
  await page.waitForTimeout(250)
  expect((await popup.boundingBox())?.width).toBeCloseTo(320, 0)
  await expect(popup).toContainText('Mock OAuth User')
  await expect(popup).toContainText('体验版')
  await expect(popup).toContainText('用量')
  await expect(popup).toContainText('积分')
  await expect(popup).toContainText("Administrator's Team")
  await expect(popup).toContainText('Ctrl+,')

  const upgrade = popup.getByRole('menuitem', { name: '升级' })
  await expect(upgrade).toHaveClass(/button--inverse/)
  await expect(upgrade).toHaveClass(/button--small/)
  const upgradeBox = await upgrade.boundingBox()
  const usageBox = await popup.locator('.user-menu__item').first().boundingBox()
  expect(upgradeBox?.height).toBeCloseTo(24, 0)
  /* 左右各让出行内距 12，与行首图标、行尾余量对齐 */
  expect(upgradeBox?.x).toBeCloseTo((usageBox?.x ?? 0) + 12, 0)
  expect((upgradeBox?.x ?? 0) + (upgradeBox?.width ?? 0)).toBeCloseTo((usageBox?.x ?? 0) + (usageBox?.width ?? 0) - 12, 0)

  await page.keyboard.press('Escape')
  await expect(popup).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('keeps a fixed width when the navigation column grows', async ({ page }) => {
  await page.locator(TRIGGER).click()
  await page.waitForTimeout(250)
  expect((await page.locator(POPUP).boundingBox())?.width).toBeCloseTo(320, 0)
  await page.keyboard.press('Escape')

  const grip = page.locator('.nav__resize')
  const box = await grip.boundingBox()
  await page.mouse.move((box?.x ?? 0) + (box?.width ?? 0) / 2, 300)
  await page.mouse.down()
  await page.mouse.move(420, 300, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(300)

  await page.locator(TRIGGER).click()
  await page.waitForTimeout(250)
  expect((await page.locator(POPUP).boundingBox())?.width).toBeCloseTo(320, 0)
})

test('keeps the footer name directly after the avatar', async ({ page }) => {
  const avatar = page.locator('.nav__footer .avatar')
  const name = page.locator('.nav__footer .user-menu__trigger-name')
  await expect(name).toContainText('Mock OAuth User')

  const avatarBox = (await avatar.boundingBox())!
  const text = await name.evaluate((el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    const box = range.getBoundingClientRect()
    return { x: box.x, width: box.width }
  })
  expect(text.x).toBeCloseTo(avatarBox.x + avatarBox.width + 8, 0)
})

test('keeps a long name inside the footer trigger', async ({ page }) => {
  const trigger = page.locator(TRIGGER).first()
  const name = page.locator('.user-menu__trigger-name').first()
  await expect(name).toContainText('Mock OAuth User')
  await name.evaluate((el) => {
    el.textContent = 'Alexandria-Cassandra Montgomery-Worthington the Third'
    el.setAttribute('title', el.textContent)
  })
  const avatar = page.locator(`${TRIGGER} .avatar`).first()
  const triggerBox = (await trigger.boundingBox())!
  const avatarBox = (await avatar.boundingBox())!
  const nameBox = (await name.boundingBox())!

  expect(avatarBox.x).toBeCloseTo(12, 0)
  expect(triggerBox.x + triggerBox.width - (nameBox.x + nameBox.width)).toBeCloseTo(4, 0)
  expect(await name.evaluate((el) => getComputedStyle(el).textOverflow)).toBe('ellipsis')
  expect(await name.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
  expect(await name.getAttribute('title')).toContain('Alexandria-Cassandra')
})

test('puts the collapsed navigation entry at the right edge of the content head', async ({ page }) => {
  await page.mouse.move(140, 20)
  await page.locator('.nav__toggle').first().click()
  await page.waitForTimeout(400)

  const head = page.locator('.content__head')
  const trigger = page.locator('.content__head-trailing .user-menu__trigger')
  const avatar = trigger.locator('.avatar')
  await expect(trigger).toBeVisible()
  await expect(trigger.locator('.user-menu__trigger-name')).toHaveText('Mock OAuth User')
  const headBox = (await head.boundingBox())!
  const triggerBox = (await trigger.boundingBox())!
  const avatarBox = (await avatar.boundingBox())!
  expect(headBox.x + headBox.width - (triggerBox.x + triggerBox.width)).toBeCloseTo(12, 0)
  expect(triggerBox.height).toBeCloseTo(24, 0)
  expect(avatarBox.width).toBeCloseTo(24, 0)
  expect(avatarBox.height).toBeCloseTo(24, 0)
})

test('keeps the settings sidebar at the normal window size', async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 664 })
  await page.keyboard.press(`${process.platform === 'darwin' ? 'Meta' : 'Control'}+,`)

  await expect(page.getByRole('dialog')).toBeVisible()
  await page.waitForTimeout(300)
  await expect(page.locator('.settings-shell__picker')).toBeHidden()
  const menu = page.locator('.settings-shell__menu')
  await expect(menu).toBeVisible()
  expect((await menu.boundingBox())?.width).toBeCloseTo(208, 0)
  expect((await page.locator('.settings-shell__content').boundingBox())?.width ?? 0).toBeGreaterThan(600)
})

test('switches the settings sections to a top picker on a narrow window', async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 600 })
  await page.waitForTimeout(300)
  await page.locator('.content__head-trailing .user-menu__trigger').click()
  await page.locator(POPUP).getByText('Mock OAuth User').click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.locator('.settings-shell__picker')).toBeVisible()
  await expect(page.locator('.settings-shell__menu')).toBeHidden()
  const contentBox = await page.locator('.settings-shell__content').boundingBox()
  expect(contentBox?.width ?? 0).toBeGreaterThan(300)
})

test('opens the settings window from the identity row and switches sections', async ({ page }) => {
  await page.locator(TRIGGER).click()
  await page.locator(POPUP).getByText('Mock OAuth User').click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: '个人资料' })).toBeVisible()
  await page.waitForTimeout(300)

  /* full 档：四周留 48，宽度在 720 与 1120 之间取视口可用宽 */
  const viewport = page.viewportSize()!
  const expectedWidth = Math.min(viewport.width - 96, 1120)
  const dialogBox = await dialog.boundingBox()
  expect(dialogBox?.x).toBeCloseTo((viewport.width - expectedWidth) / 2, 0)
  expect(dialogBox?.y).toBeCloseTo(48, 0)
  expect(dialogBox?.width).toBeCloseTo(expectedWidth, 0)
  expect(dialogBox?.height).toBeCloseTo(viewport.height - 96, 0)

  const blur = await page.locator('.dialog__scrim').evaluate((el) => getComputedStyle(el).backdropFilter)
  expect(blur).toContain('blur')

  await dialog.getByRole('button', { name: '团队管理' }).click()
  await expect(dialog.getByRole('heading', { name: '团队管理' })).toBeVisible()
  await expect(dialog.getByText('暂无设置项。')).toBeVisible()

  await dialog.getByRole('button', { name: '关闭设置' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.locator(POPUP)).toBeHidden()
})

test('closes the settings window on Escape and gives focus back to the account trigger', async ({ page }) => {
  await page.locator(TRIGGER).click()
  await page.locator(POPUP).getByText('Mock OAuth User').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  const trigger = page.locator(TRIGGER)
  await expect(trigger).toBeFocused()
  await page.waitForTimeout(300)
  expect(await trigger.evaluate((el) => getComputedStyle(el).boxShadow)).toBe('none')

  /* 下一次键盘操作撤掉静默：Tab 离开再回来，焦点环恢复 */
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(trigger).toBeFocused()
  await page.waitForTimeout(200)
  expect(await trigger.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none')
})

test('opens the settings window with the platform shortcut', async ({ page }) => {
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
  const trigger = page.locator('.nav__footer .user-menu__trigger')
  await page.keyboard.press(`${modifier}+,`)
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('.settings-shell__item[aria-current="page"]')).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(trigger).toBeFocused()
  await page.waitForTimeout(150)
  expect(await trigger.evaluate((el) => getComputedStyle(el).boxShadow)).toBe('none')
})

test('closes the account menu when the settings shortcut opens', async ({ page }) => {
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
  await page.locator(TRIGGER).click()
  await expect(page.locator(POPUP)).toBeVisible()

  await page.keyboard.press(`${modifier}+,`)
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator(POPUP)).toBeHidden()
  await page.keyboard.press('Escape')
})

test('opens external links in a new page', async ({ page, context }) => {
  await page.locator(TRIGGER).click()
  const opened = context.waitForEvent('page')
  await page.locator(POPUP).getByText('首页').click()
  const next = await opened

  expect(next.url()).toContain('yaoagents.com')
  await next.close()
})

test('asks before signing out and returns to the sign-in page', async ({ page }) => {
  await page.locator(TRIGGER).click()
  await page.locator(POPUP).getByText('退出登录').click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '取消' }).click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/app\/inbox$/)

  await page.locator(TRIGGER).click()
  await page.locator(POPUP).getByText('退出登录').click()
  await page.getByRole('alertdialog').getByRole('button', { name: '退出登录' }).click()
  await expect(page).toHaveURL(/\/app\/login/)
})
