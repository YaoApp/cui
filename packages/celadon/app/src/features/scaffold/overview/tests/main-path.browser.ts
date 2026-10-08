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
  /* 修饰键按**浏览器所在系统**取，不按跑测试的进程：浏览器可能跑在远程测试机上（见内部文档「浏览器测试服务」）。
     macOS 用 Meta，其余用 Control。 */
  const modifier = (await page.evaluate(() => (navigator.userAgent.includes('Mac') ? 'Meta' : 'Control'))) as
    | 'Meta'
    | 'Control'

  const [opened] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: '路由' }).click({ modifiers: [modifier] }),
  ])
  /* 等**地址**而不是等 load 状态：新标签先到 `about:blank`，`domcontentloaded` 立刻满足，
     在慢一点的链路上会读到 `about:blank`。远程浏览器下这条正是这么暴露的。 */
  await opened.waitForURL(/\/app\/scaffold\/routing/, { timeout: 15_000 })

  // 当前页不动，新标签落在目的地 —— 拦掉就等于把"真链接"变成假链接
  await expect(page).toHaveURL(/\/app\/scaffold$/)
  expect(opened.url()).toContain('/app/scaffold/routing')
})
