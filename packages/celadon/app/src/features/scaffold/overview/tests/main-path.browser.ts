import { expect, test } from '@playwright/test'

/* 场景：主路径 —— 打开脚手架索引页，页头与导航在位。刷新是**路由重载**（`navigate(0)`）。 */
test('main path: the scaffold index has its header, nav and refresh', async ({ page }) => {
  await page.goto('/app/scaffold')
  // 标签页标题跟路由走
  await expect(page).toHaveTitle('总览 · CUI 2.0')
  await expect(page.getByText(/结构试跑/)).toBeVisible()

  await page.getByRole('button', { name: '刷新' }).click()

  // 重载这条路由：页面还在、页头还在
  await expect(page.getByText(/结构试跑/)).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新' })).toBeVisible()
})

test('a modified click opens the destination in a new tab instead of navigating in place', async ({ page, context }) => {
  await page.goto('/app/scaffold')
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'

  const [opened] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: '路由' }).click({ modifiers: [modifier] }),
  ])
  await opened.waitForLoadState('domcontentloaded')

  // 当前页不动，新标签落在目的地 —— 拦掉就等于把"真链接"变成假链接
  await expect(page).toHaveURL(/\/app\/scaffold$/)
  expect(opened.url()).toContain('/app/scaffold/routing')
})
