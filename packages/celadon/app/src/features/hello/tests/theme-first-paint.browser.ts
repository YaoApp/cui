import { expect, test } from '@playwright/test'

/* **首帧前定主题**：主包还没跑，`data-theme` 就该已经是对的 —— 否则会闪一下浅色。
   做法：把主包延迟住，看这期间根元素上写的是什么（见 architecture/09-theme.md §1）。 */
test('the theme is on the root element before the app bundle runs', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'cui.theme',
      JSON.stringify({ state: { preference: 'dark' }, version: 1 }),
    )
  })
  await page.route('**/src/main.tsx*', async (route) => {
    await new Promise((r) => setTimeout(r, 1500))
    await route.continue()
  })
  await page.goto('/app/', { waitUntil: 'commit' })
  // 主包仍在路上，这时读到的必须已经是深色
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark', { timeout: 1000 })
})
