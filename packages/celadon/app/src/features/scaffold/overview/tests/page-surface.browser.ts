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
  const nav = page.getByRole('navigation').first()
  await expect(refresh).toBeVisible()
  const [box, navBox] = await Promise.all([refresh.boundingBox(), nav.boundingBox()])
  expect(box).not.toBeNull()
  expect(navBox).not.toBeNull()
  const [b, n] = [box!, navBox!]
  // 在窗口内
  expect(b.x + b.width).toBeLessThanOrEqual(1080)
  // 且与导航**同一行**：旧布局会把刷新换到下一行或推出窗口
  expect(Math.abs(b.y + b.height / 2 - (n.y + n.height / 2))).toBeLessThan(12)
  // 真正的判据在这里：右侧动作块**不缩**、且自己靠右 —— 去掉这两条，导航就会把它挤出去
  const [actionsBox, headerBox] = await Promise.all([
    page.locator('.header__actions').boundingBox(),
    page.locator('header.header').boundingBox(),
  ])
  expect(actionsBox).not.toBeNull()
  expect(headerBox).not.toBeNull()
  const [ab, hb] = [actionsBox!, headerBox!]
  // 右侧动作块**不缩**，且贴着页头右边缘（去掉这两条，导航会把它挤出去）
  const shrink = await page.locator('.header__actions').evaluate((el) => getComputedStyle(el).flexShrink)
  expect(shrink).toBe('0')
  expect(Math.abs(ab.x + ab.width - (hb.x + hb.width))).toBeLessThanOrEqual(24)
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

/* 页面根类名必须与它自己的样式同名 —— 改名时最容易漏（2026-10-04 复核抓到 bridge/requests 根丢样式）。 */
for (const [path, cls] of [
  ['/app/scaffold', 'overview'],
  ['/app/scaffold/routing', 'routing'],
  ['/app/scaffold/bridge', 'bridge'],
  ['/app/scaffold/requests', 'requests'],
] as const) {
  test(`the page root carries its own class on ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator(`.${cls}`)).toHaveCount(1)
    // 根必须铺满（`flex:1` + 底色），否则底部会露出外壳底色
    const { flex, background } = await page.locator(`.${cls}`).evaluate((el) => {
      const style = getComputedStyle(el)
      return { flex: style.flexGrow, background: style.backgroundColor }
    })
    expect(Number(flex)).toBeGreaterThan(0)
    expect(background).not.toBe('rgba(0, 0, 0, 0)')
  })
}

/* 内边距只准有一层（`Page`）：两层会把正文再缩进 24px（2026-10-04 复核抓到 bridge/requests 叠成 48）。 */
test('the page body is indented exactly once', async ({ page }) => {
  for (const path of ['/app/scaffold', '/app/scaffold/routing', '/app/scaffold/bridge', '/app/scaffold/requests']) {
    await page.goto(path)
    const box = await page.locator('main.surface > * > main, main.surface > * > div.page__body, main.surface .page__body').first().boundingBox()
    expect(box, `${path} 没有正文容器`).not.toBeNull()
    // 24 是 `Page` 的内边距；48 说明页面自己又叠了一层
    expect(Math.round((box as { x: number }).x), `${path} 正文缩进不对`).toBeLessThan(40)
  }
})
