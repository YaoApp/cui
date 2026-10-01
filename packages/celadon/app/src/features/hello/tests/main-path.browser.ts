import { expect, test } from '@playwright/test'

/* 场景：主路径 —— 打开页面，点刷新，计数增长。 */
test('main path: open, click refresh, the counter grows', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('已刷新 0 次')).toBeVisible()

  await page.getByRole('button', { name: '刷新' }).click()
  await page.getByRole('button', { name: '刷新' }).click()

  await expect(page.getByText('已刷新 2 次')).toBeVisible()
})
