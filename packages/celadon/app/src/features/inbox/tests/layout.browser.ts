import { expect, test } from '@playwright/test'

/* 三栏骨架的浏览器用例（`plan/08-layout-base.md` 第一阶段）：跑真开发服务上的真应用，
   本机登录标记按存储的真实格式预置，因此不用走登录一线。核的是三条链路：
   收起与展开、打开、窗口动作（Web 下不出现）。 */

/** 预置本机登录标记与落点（口径同 `features/auth/tests/entry.browser.ts`）。 */
async function markSignedIn(page: import('@playwright/test').Page, landing?: string) {
  await page.addInitScript(
    ({ path }) => {
      localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() }))
      if (path)
        localStorage.setItem(
          'celadon.landing',
          JSON.stringify({ [location.origin]: { path, at: Date.now() } }),
        )
    },
    { path: landing ?? '' },
  )
}

const columns = (page: import('@playwright/test').Page) => ({
  nav: page.locator('.nav'),
  content: page.locator('.content'),
  browser: page.locator('.browser'),
})

test('lands on the inbox with the three columns in place', async ({ page }) => {
  await markSignedIn(page)
  await page.goto('/app/')
  await expect(page).toHaveURL(/\/app\/inbox$/)

  const { nav, content, browser } = columns(page)
  await expect(nav).toBeVisible()
  await expect(content).toBeVisible()
  await expect(browser).toBeVisible()

  /* 栏宽按 F6：导航默认 280，内容区至少 400 */
  expect(await nav.evaluate((el) => el.getBoundingClientRect().width)).toBeCloseTo(280, 0)
  expect(await content.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(
    400,
  )
})

test('opens a page from the main navigation', async ({ page }) => {
  await markSignedIn(page)
  await page.goto('/app/inbox')
  await page.getByRole('link', { name: '看板' }).click()
  await expect(page).toHaveURL(/\/app\/board$/)
  await expect(page.locator('.content')).toContainText('看板')
  await expect(page.getByRole('link', { name: '看板' })).toHaveAttribute('aria-current', 'page')
})

test('collapses the navigation column and remembers it after a reload', async ({ page }) => {
  await markSignedIn(page)
  await page.goto('/app/inbox')
  const nav = columns(page).nav
  expect(await nav.evaluate((el) => el.getBoundingClientRect().width)).toBeCloseTo(280, 0)

  await page.getByRole('button', { name: '收起导航' }).click()
  await expect
    .poll(async () => nav.evaluate((el) => el.getBoundingClientRect().width))
    .toBeLessThan(100)
  /* 图标轨里只留图标：文字收起来（不然 56 像素宽的列里文字会溢出来） */
  await expect(page.getByRole('link', { name: '看板' }).locator('.nav__label')).toBeHidden()

  await page.reload()
  await expect
    .poll(async () => nav.evaluate((el) => el.getBoundingClientRect().width))
    .toBeLessThan(100)
  await expect(page.getByRole('link', { name: '看板' }).locator('.nav__label')).toBeHidden()
})

test('folds the main navigation and finds it again from the current row', async ({ page }) => {
  await markSignedIn(page)
  await page.goto('/app/inbox')

  /* 展开时：收起键在上区（main）里，「当前」那一行不出现，两区之间有分割线 */
  const main = page.locator('.nav__main')
  await expect(main).toHaveCSS('border-block-end-style', 'solid')
  await expect(page.getByRole('button', { name: '收件箱' })).toHaveCount(0)

  await page.getByRole('button', { name: '折叠主导航' }).click()
  await expect(main).toHaveClass(/nav__main--folded/)
  /* 折叠后：展开键在下方「当前」那一行里，收起键同时消失 */
  await expect(page.getByRole('button', { name: '收件箱' })).toBeVisible()
  await expect(page.getByRole('button', { name: '折叠主导航' })).toHaveCount(0)

  /* 悬停这一行才弹出主导航菜单（指针只是路过这一区不算），`Esc` 关闭（悬停不动焦点） */
  const current = page.getByRole('button', { name: '收件箱' })
  await expect(page.getByRole('menuitem', { name: '收件箱' })).toHaveCount(0)
  await current.hover()
  await expect(page.getByRole('menuitem', { name: '收件箱' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menuitem', { name: '收件箱' })).toHaveCount(0)

  /* 键盘也能弹出，`Esc` 关闭并把焦点交回「当前」那一行 */
  await current.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: '收件箱' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menuitem', { name: '收件箱' })).toHaveCount(0)
  await expect(current).toBeFocused()
})

test('opens an external address in a tab and closes it again', async ({ page }) => {
  await markSignedIn(page)
  await page.goto('/app/inbox')
  const browser = columns(page).browser

  await browser.getByLabel('外部地址').fill('example.com')
  await browser.getByLabel('外部地址').press('Enter')
  await expect(browser.getByRole('tab', { name: 'example.com' })).toBeVisible()
  await expect(browser.getByRole('tab', { name: 'example.com' })).toHaveAttribute(
    'aria-selected',
    'true',
  )

  /* 首页那个标签不可关：它没有关闭键 */
  await expect(browser.locator('.browser__tab', { hasText: '首页' }).locator('button')).toHaveCount(1)

  await browser.getByRole('button', { name: '关闭这个标签' }).click()
  await expect(browser.getByRole('tab', { name: 'example.com' })).toHaveCount(0)
  await expect(browser.getByRole('tab', { name: '首页' })).toHaveAttribute('aria-selected', 'true')
})

test('collapses the browser column and gives the space to the content', async ({ page }) => {
  await markSignedIn(page)
  await page.goto('/app/inbox')
  const { content, browser } = columns(page)
  const wide = await content.evaluate((el) => el.getBoundingClientRect().width)

  await browser.getByRole('button', { name: '收掉这一栏' }).click()
  await expect(browser).toHaveCount(0)
  expect(await content.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(wide)
})

test('moves the browser column to the other side', async ({ page }) => {
  await markSignedIn(page)
  await page.goto('/app/inbox')
  const browser = columns(page).browser
  await expect(browser).toHaveAttribute('data-side', 'right')

  await browser.getByRole('button', { name: '换到另一侧' }).click()
  await expect(browser).toHaveAttribute('data-side', 'left')
  const box = await browser.evaluate((el) => el.getBoundingClientRect().left)
  expect(box).toBeLessThan(200)
})

test('shows no window buttons on the web client', async ({ page }) => {
  await markSignedIn(page)
  await page.goto('/app/inbox')
  await expect(page.getByRole('button', { name: '最小化' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '关闭' })).toHaveCount(0)
})

test('fits the smallest window without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 600 })
  await markSignedIn(page)
  await page.goto('/app/inbox')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
  await expect(columns(page).content).toBeVisible()
})
