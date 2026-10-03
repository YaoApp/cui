import { expect, test } from '@playwright/test'

/* 场景：语言跟随系统 —— 首次访问（全新上下文，没有持久化选择）用 navigator.languages 解析出的语言，
   并把 `<html lang>` 一起改掉；用户显式选过语言之后就不再跟随，刷新也保持那个选择。 */
test('follows the system language on first visit, then keeps an explicit choice', async ({ page }) => {
  // 覆盖浏览器语言：模拟一台日语系统。addInitScript 每次导航都会跑。
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'language', { value: 'ja-JP', configurable: true })
    Object.defineProperty(navigator, 'languages', { value: ['ja-JP', 'ja'], configurable: true })
  })

  await page.goto('/app/')

  // 没有持久化选择 → 跟随系统：界面日文，<html lang> 也是解析后的 ja
  await expect(page.getByRole('link', { name: 'ワールド' })).toBeVisible()
  await expect(page.getByRole('button', { name: '更新' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
  await expect(page.getByRole('combobox', { name: '言語' })).toContainText('システムに従う（日本語）')

  // 显式选择英文 → 不再跟随系统，<html lang> 跟着换
  await page.getByRole('combobox', { name: '言語' }).click()
  await page.getByRole('option', { name: 'English' }).click()
  await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')

  await page.reload()

  // 刷新后仍是显式选择的英文（系统语言还是 ja-JP，但没有再跟随）
  await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'ワールド' })).toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
  await expect(page.getByRole('combobox', { name: 'Language' })).toContainText('English')
})
