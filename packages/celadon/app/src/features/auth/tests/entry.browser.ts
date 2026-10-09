import { expect, test } from '@playwright/test'

/* 入口判定的浏览器用例（`plan/06-login.md` §5 · §7）：跑的是真开发服务上的真应用，
   本机信号（登录标记与落点）按存储的真实格式预置，所以核的是"接到路由上"这件事。
   401 的两面在同一页上配对核：需要身份的接口被接走，入口类接口不接（见文件末尾两条）。 */

/** 预置本机登录标记（按当前来源分账）。 */
async function markSignedIn(page: import('@playwright/test').Page, landing?: string) {
  await page.addInitScript(
    ({ path }) => {
      localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() }))
      if (path) localStorage.setItem('celadon.landing', JSON.stringify({ [location.origin]: { path, at: Date.now() } }))
    },
    { path: landing ?? '' },
  )
}

test('sends a machine with no mark from the root to the sign-in page', async ({ page }) => {
  await page.goto('/app/')
  await expect(page).toHaveURL(/\/app\/login$/)
  await expect(page.locator('.auth__card')).toBeVisible()
})

test('carries no destination for the default entries', async ({ page }) => {
  /* 根地址、以及不带命名空间的站点根：默认进入不该带 `next`（它就是"没有明确意图"那一档） */
  await page.goto('/app/')
  await expect(page).toHaveURL(/\/app\/login$/)

  await page.goto('/')
  await expect(page).toHaveURL(/\/app\/login$/)
})

test('remembers the unknown address it was opened at', async ({ page }) => {
  await page.goto('/app/bogus')
  await expect(page).toHaveURL(/\/app\/login\?next=%2Fbogus$/)
})

test('sends a marked machine to its last landing', async ({ page }) => {
  await markSignedIn(page, '/scaffold/base')
  await page.goto('/app/')
  await expect(page).toHaveURL(/\/app\/scaffold\/base$/)
})

test('sends a marked machine with no landing to the welcome page', async ({ page }) => {
  await markSignedIn(page)
  await page.goto('/app/')
  await expect(page).toHaveURL(/\/app\/welcome$/)
})

test('takes a product call answered with 401 back to sign-in', async ({ page }) => {
  /* 与上一条配对：同一个页面、同样的 401，只把接口换成需要身份的那条 —— 这一条必须被接走。
     两条一起才说明「入口类排除」这件事真的在起作用，而不是守卫根本没挂上。 */
  await markSignedIn(page)
  await page.route('**/.well-known/yao', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'development', version: '0.0.0', openapi: '/v1' }),
    }),
  )
  await page.route('**/user/profile', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"token_missing"}' }),
  )
  await page.goto('/app/welcome')

  /* 欢迎页自己是流程页，所以不带 `next`（流程页不算去向）；标记要清掉 */
  await expect(page).toHaveURL(/\/app\/login$/)
  const marks = await page.evaluate(
    () => Object.keys(JSON.parse(localStorage.getItem('celadon.session') ?? '{}')).length,
  )
  expect(marks).toBe(0)
})

test('stays put when an entry call answers 401: that is not an expiry', async ({ page }) => {
  /* 在**会跳转的页面**上触发入口类 401：欢迎页一进来取入口配置。若入口类没被排除，
     守卫会清标记并把人踢到登录页，所以这里同时断言地址不变与标记还在（挑得出差别）。 */
  await markSignedIn(page)
  await page.route('**/.well-known/yao', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'development', version: '0.0.0', openapi: '/v1' }),
    }),
  )
  await page.route('**/v1/user/entry**', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"token_missing"}' }),
  )
  await page.route('**/user/profile', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ 'yao:user_id': '853296684128', name: 'Wren' }),
    }),
  )
  await page.goto('/app/welcome')

  await expect(page).toHaveURL(/\/app\/welcome$/)
  const marks = await page.evaluate(
    () => Object.keys(JSON.parse(localStorage.getItem('celadon.session') ?? '{}')).length,
  )
  expect(marks).toBeGreaterThan(0)
})
