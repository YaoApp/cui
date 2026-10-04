import { expect, test } from '@playwright/test'

/* 场景：直达。地址决定"看哪个对象、开在哪一屏、侧边开着什么"。 */
test('an object in the path opens its detail', async ({ page }) => {
  await page.goto('/app/scaffold/routing/w1')
  await expect(page.getByRole('heading', { name: 'Alpha 世界' })).toBeVisible()
  // 详情页的标题用对象名 —— 用户才知道自己开的是哪一个世界
  await expect(page).toHaveTitle('Alpha 世界 · CUI 2.0')
  /* 页头标题是**页面名**（与导航一致），不是对象名 —— 对象名只进页签 */
  await expect(page.getByRole('heading', { level: 1, name: '路由' })).toBeVisible()
})


test('a link carries the namespace exactly once', async ({ page }) => {
  await page.goto('/app/scaffold/routing')
  // 真链接带命名空间；路由内的跳转不带（由 react-router 加）。混了就会出现 /app/app/...
  await expect(page.getByRole('link', { name: 'Alpha 世界' })).toHaveAttribute('href', '/app/scaffold/routing/w1')
})



test('typing in the filter replaces the entry instead of stacking history', async ({ page }) => {
  await page.goto('/app/scaffold/routing')
  const before = await page.evaluate(() => history.length)

  await page.getByLabel('过滤').fill('gamma')
  await expect(page).toHaveURL(/\?q=gamma$/)
  await expect(page.getByRole('link', { name: 'Gamma 世界' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Alpha 世界' })).toHaveCount(0)

  // replace 的正确断言：历史**没变长**（打字不该把后退栈塞满）
  expect(await page.evaluate(() => history.length)).toBe(before)
})

