import { expect, test } from '@playwright/test'

/* 场景：切换到日文 —— 导航与界面文案变日文，刷新后仍是日文（选择留在 localStorage）。 */
test('switching to Japanese localizes the navigation and survives a reload', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: '你好' })).toBeVisible()

  await page.getByRole('combobox', { name: '语言' }).selectOption('ja')

  await expect(page.getByRole('link', { name: 'ワールド' })).toBeVisible()
  await expect(page.getByRole('button', { name: '更新' })).toBeVisible()
  await expect(page.getByRole('link', { name: '你好' })).toHaveCount(0)

  await page.reload()

  await expect(page.getByRole('link', { name: 'ワールド' })).toBeVisible()
  await expect(page.getByRole('button', { name: '更新' })).toBeVisible()
  await expect(page.getByRole('link', { name: '你好' })).toHaveCount(0)
})
