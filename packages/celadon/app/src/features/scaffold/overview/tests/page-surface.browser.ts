import { expect, test } from '@playwright/test'

/* 场景：页面底色 —— 内容面要盖住整个视口，底部不该露出另一层的分界。 */
test('the page surface covers the viewport, so no seam shows at the bottom', async ({ page }) => {
  await page.goto('/app/scaffold')

  // 先等表面真的挂上来再量：从 / 进来会先走一次客户端重定向，
  // 抢在它之前 evaluate 会拿到 null（这条竞态曾表现为"偶尔 1 failed"）。
  await expect(page.locator('#app > *')).toHaveCount(1)

  const { surface, viewport } = await page.evaluate(() => ({
    surface: document.querySelector('#app > *')!.getBoundingClientRect().height,
    viewport: window.innerHeight,
  }))

  expect(Math.round(surface)).toBeGreaterThanOrEqual(viewport)
})

/* 窄窗口的回归：页头不换行时，「刷新」会被导航挤出可视区（2026-10-04 用户截图抓到）。 */
test('the refresh button stays inside a narrow window', async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 700 })
  await page.goto('/app/scaffold')

  const refresh = page.getByRole('button', { name: '刷新' })
  await expect(refresh).toBeVisible()
  const box = await refresh.boundingBox()
  expect(box).not.toBeNull()
  expect((box as { x: number; width: number }).x + (box as { x: number; width: number }).width).toBeLessThanOrEqual(1080)
})

/* 页头属于外壳，必须横跨整宽：页面自己的根不许再加内边距（2026-10-04 截图抓到 routing 缩进了一层）。 */
for (const path of ['/app/scaffold', '/app/scaffold/routing', '/app/scaffold/bridge', '/app/scaffold/requests']) {
  test(`the header spans the full width on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1080, height: 700 })
    await page.goto(path)

    const header = await page.locator('header.header').boundingBox()
    expect(header).not.toBeNull()
    expect(Math.round((header as { x: number }).x)).toBe(0)
    expect(Math.round((header as { width: number }).width)).toBe(1080)
  })
}
