import { expect, test } from '@playwright/test'

/* 场景：切换语言 —— 导航文字变英文，刷新后仍是英文（选择留在 localStorage）。 */
test('switching to English localizes the navigation and survives a reload', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: '你好' })).toBeVisible()

  await page.getByRole('button', { name: 'English' }).click()

  await expect(page.getByRole('link', { name: 'Hello' })).toBeVisible()
  await expect(page.getByRole('link', { name: '你好' })).toHaveCount(0)

  await page.reload()

  await expect(page.getByRole('link', { name: 'Hello' })).toBeVisible()
  await expect(page.getByRole('link', { name: '你好' })).toHaveCount(0)
})
