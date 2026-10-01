import { expect, test } from '@playwright/test'

/* 场景：切换主题 —— 设计里的分段控件（浅色 / 暗色），选中项自己标出来。 */
test('the segmented switch picks a theme and the whole page follows', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('button', { name: '浅色' })).toHaveAttribute('aria-pressed', 'true')
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)

  await page.getByRole('button', { name: '暗色' }).click()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: '暗色' })).toHaveAttribute('aria-pressed', 'true')

  const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(dark).not.toBe(light)
  expect(dark).not.toBe('rgb(255, 255, 255)')
})

test('the choice survives a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '暗色' }).click()
  await page.reload()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: '暗色' })).toHaveAttribute('aria-pressed', 'true')
})
