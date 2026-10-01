import { expect, test } from '@playwright/test'

/* 场景：切主题 —— 点按钮，整页跟着换，按钮自己说明下一步。 */
test('the toggle switches the whole page and says what comes next', async ({ page }) => {
  await page.goto('/')

  const toggle = page.getByRole('button', { name: '切到深色' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)

  await toggle.click()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: '切到浅色' })).toHaveAttribute('aria-pressed', 'true')

  const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(dark).not.toBe(light)
  expect(dark).not.toBe('rgb(255, 255, 255)')
})

test('the choice survives a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '切到深色' }).click()
  await page.reload()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: '切到浅色' })).toBeVisible()
})
