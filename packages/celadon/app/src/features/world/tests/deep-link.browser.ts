import { expect, test } from '@playwright/test'

/* 场景：直达。地址决定"看哪个对象、开在哪一屏、侧边开着什么"。 */
test('an object in the path opens its detail', async ({ page }) => {
  await page.goto('/app/world/w1')
  await expect(page.getByRole('heading', { name: 'Alpha 世界' })).toBeVisible()
  // 详情页的标题用对象名 —— 用户才知道自己开的是哪一个世界
  await expect(page).toHaveTitle('Alpha 世界 · CUI 2.0')
})

test('a surface in the path mounts the same feature in the side panel', async ({ page }) => {
  await page.goto('/side/world/w1')
  const side = page.getByRole('complementary', { name: '侧边' })
  await expect(side).toBeVisible()
  await expect(side.getByRole('heading', { name: 'Alpha 世界' })).toBeVisible()
})

test('a named panel parameter opens the panel, and Back closes it', async ({ page }) => {
  await page.goto('/app/world/w1')
  await expect(page.getByRole('region', { name: '条目面板' })).toHaveCount(0)

  await page.getByRole('button', { name: '守门人' }).click()
  await expect(page.getByRole('region', { name: '条目面板' })).toBeVisible()
  await expect(page).toHaveURL(/\?sideEntity=e2$/)

  await page.goBack()
  await expect(page.getByRole('region', { name: '条目面板' })).toHaveCount(0)
})

test('typing in the filter replaces the entry instead of stacking history', async ({ page }) => {
  await page.goto('/app/world')
  const before = await page.evaluate(() => history.length)

  await page.getByLabel('过滤').fill('gamma')
  await expect(page).toHaveURL(/\?q=gamma$/)
  await expect(page.getByRole('link', { name: 'Gamma 世界' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Alpha 世界' })).toHaveCount(0)

  // replace 的正确断言：历史**没变长**（打字不该把后退栈塞满）
  expect(await page.evaluate(() => history.length)).toBe(before)
})
