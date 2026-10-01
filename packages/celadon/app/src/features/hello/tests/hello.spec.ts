import { expect, test } from '@playwright/test'

test('main path: open, click refresh, the counter grows', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('已刷新 0 次')).toBeVisible()

  await page.getByRole('button', { name: '刷新' }).click()
  await page.getByRole('button', { name: '刷新' }).click()

  await expect(page.getByText('已刷新 2 次')).toBeVisible()
})

test('the same path on the keyboard alone, with a visible focus ring', async ({ page }) => {
  await page.goto('/')

  await page.keyboard.press('Tab')
  const button = page.getByRole('button', { name: '刷新' })
  await expect(button).toBeFocused()

  const ring = await button.evaluate((el) => getComputedStyle(el).boxShadow)
  expect(ring).not.toBe('none')

  await page.keyboard.press('Enter')
  await expect(page.getByText('已刷新 1 次')).toBeVisible()

  await page.keyboard.press('Space')
  await expect(page.getByText('已刷新 2 次')).toBeVisible()
})

test('the page itself follows the theme, not only the app band', async ({ page }) => {
  await page.goto('/')
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark'
  })
  const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)

  expect(dark).not.toBe(light)
  expect(dark).not.toBe('rgb(255, 255, 255)')
  expect(dark).not.toBe('rgba(0, 0, 0, 0)')
})
