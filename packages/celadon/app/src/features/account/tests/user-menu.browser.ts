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

test('opens the settings window from the identity row and switches sections', async ({ page }) => {
  await page.locator(TRIGGER).click()
  await page.locator(POPUP).getByText('Mock OAuth User').click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: '个人资料' })).toBeVisible()
  await page.waitForTimeout(300)

  /* full 档：四周留 24，面板吃满窗口其余空间 */
  const viewport = page.viewportSize()!
  const dialogBox = await dialog.boundingBox()
  expect(dialogBox?.x).toBeCloseTo(24, 0)
  expect(dialogBox?.y).toBeCloseTo(24, 0)
  expect(dialogBox?.width).toBeCloseTo(viewport.width - 48, 0)
  expect(dialogBox?.height).toBeCloseTo(viewport.height - 48, 0)

  await dialog.getByRole('button', { name: '团队管理' }).click()
  await expect(dialog.getByRole('heading', { name: '团队管理' })).toBeVisible()
  await expect(dialog.getByText('内容随后接入。')).toBeVisible()

  await dialog.getByRole('button', { name: '关闭设置' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.locator(POPUP)).toBeHidden()
})

test('opens the settings window with the platform shortcut', async ({ page }) => {
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
  await page.keyboard.press(`${modifier}+,`)
  await expect(page.getByRole('dialog')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
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
