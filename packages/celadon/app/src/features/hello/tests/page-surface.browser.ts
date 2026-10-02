import { expect, test } from '@playwright/test'

/* 场景：页面底色 —— 内容面要盖住整个视口，底部不该露出另一层的分界。 */
test('the page surface covers the viewport, so no seam shows at the bottom', async ({ page }) => {
  await page.goto('/main/hello')

  // 先等表面真的挂上来再量：从 / 进来会先走一次客户端重定向，
  // 抢在它之前 evaluate 会拿到 null（这条竞态曾表现为"偶尔 1 failed"）。
  await expect(page.locator('#app > *')).toHaveCount(1)

  const { surface, viewport } = await page.evaluate(() => ({
    surface: document.querySelector('#app > *')!.getBoundingClientRect().height,
    viewport: window.innerHeight,
  }))

  expect(Math.round(surface)).toBeGreaterThanOrEqual(viewport)
})
