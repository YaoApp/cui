import { expect, test } from '@playwright/test'

/* 场景：切换到繁体中文 —— 界面文案用繁体（台湾用词），刷新后仍是繁体。 */
test('switching to Traditional Chinese localizes the copy and survives a reload', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: '刷新' })).toBeVisible()

  await page.getByRole('combobox', { name: '语言' }).click()
  await page.getByRole('option', { name: '繁體中文' }).click()

  await expect(page.getByRole('combobox', { name: '語言' })).toBeVisible()
  await expect(page.getByRole('button', { name: '重新整理' })).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新' })).toHaveCount(0)

  await page.reload()

  await expect(page.getByRole('button', { name: '重新整理' })).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新' })).toHaveCount(0)
})
