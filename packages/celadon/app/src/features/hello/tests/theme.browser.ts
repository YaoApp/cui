import { expect, test } from '@playwright/test'

/* 场景：切深色 —— 页面底色必须跟着主题走，不能只剩 app 自己那条带变深。 */
test('the page itself follows the theme, not only the app band', async ({ page }) => {
  await page.goto('/app/')
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark'
  })
  const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)

  expect(dark).not.toBe(light)
  expect(dark).not.toBe('rgb(255, 255, 255)')
  expect(dark).not.toBe('rgba(0, 0, 0, 0)')
})
