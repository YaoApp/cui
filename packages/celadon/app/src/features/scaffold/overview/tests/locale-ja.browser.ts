import { expect, test } from '@playwright/test'

/* 场景：切换到日文 —— 导航与界面文案变日文，刷新后仍是日文（选择留在 localStorage）。 */
test('switching to Japanese localizes the navigation and survives a reload', async ({ page }) => {
  await page.goto('/app/scaffold')
  await expect(page.getByRole('link', { name: '总览' })).toBeVisible()

  await page.getByRole('combobox', { name: '语言' }).click()
  await page.getByRole('option', { name: '日本語' }).click()

  await expect(page.getByRole('link', { name: 'ルーティング' })).toBeVisible()
  await expect(page.getByRole('button', { name: '更新' })).toBeVisible()
  await expect(page.getByRole('link', { name: '总览' })).toHaveCount(0)

  await page.reload()

  await expect(page.getByRole('link', { name: 'ルーティング' })).toBeVisible()
  await expect(page.getByRole('button', { name: '更新' })).toBeVisible()
  await expect(page.getByRole('link', { name: '总览' })).toHaveCount(0)
})
