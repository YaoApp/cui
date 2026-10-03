import { expect, test } from '@playwright/test'

/* 场景：主路径 —— 打开页面，点刷新，计数增长。 */
test('main path: open, click refresh, the counter grows', async ({ page }) => {
  await page.goto('/app/')
  // 标签页标题跟路由走
  await expect(page).toHaveTitle('Hello · CUI 2.0')
  await expect(page.getByText('已刷新 0 次')).toBeVisible()

  await page.getByRole('button', { name: '刷新' }).click()
  await page.getByRole('button', { name: '刷新' }).click()

  await expect(page.getByText('已刷新 2 次')).toBeVisible()
})

test('a modified click opens the destination in a new tab instead of navigating in place', async ({ page, context }) => {
  await page.goto('/app/hello')
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'

  const [opened] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: '世界' }).click({ modifiers: [modifier] }),
  ])
  await opened.waitForLoadState('domcontentloaded')

  // 当前页不动，新标签落在目的地 —— 拦掉就等于把"真链接"变成假链接
  await expect(page).toHaveURL(/\/app\/hello$/)
  expect(opened.url()).toContain('/app/world')
})
