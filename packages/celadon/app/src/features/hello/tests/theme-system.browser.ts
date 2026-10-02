import { expect, test } from '@playwright/test'

/* 主题的 `system` 态要**实时跟随**系统；显式偏好不许被系统带走。
   一个场景一个文件（见 architecture/14-testing.md §1）。 */
test('theme follows the system while on system, and stops once chosen', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  // 系统切换到浅色 → 没有显式偏好时应当跟着走
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

  // 写下显式偏好后，系统再变也不跟随
  await page.getByRole('button', { name: /切换到深色|Switch to dark|暗|Dark/i }).first().click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})
