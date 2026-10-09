import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { capturePage, shotDir } from '../../../../../scripts/shots.mjs'

/* 欢迎页：登录一线全部打桩，页面走真路由、真取数层与真语言切换，不依赖活体服务。 */
const SHOTS = shotDir('welcome-page')
const shot = (page: Page, name: string) => capturePage(page, join(SHOTS, `${name}.png`))

const ENTRY_CONFIG = {
  title: '欢迎使用 Yao Agents',
  description: '请输入邮箱以继续',
  success_url: '/dashboard/inbox',
  form: {
    username: { placeholder: '邮箱或手机号', fields: ['email'] },
    password: { placeholder: '登录密码' },
    captcha: { type: 'none' },
  },
  verification_code_required: false,
  third_party: { providers: [] },
  secure_cookie: false,
}

const VERIFIED_LOGIN = {
  status: 'login',
  access_token: 'temp-login',
  expires_in: 900,
  token_type: 'Bearer',
  scope: 'entry',
  user_exists: true,
  verification_sent: false,
}

const SIGNED_IN = { user_id: 'u-1', access_token: 'access-1', status: 'ok' }

/** `GET /user/profile` 的实测形状（1 号实例）。 */
const PROFILE = {
  'yao:user_id': '853296684128',
  sub: '3694776944429602',
  name: 'Wren',
  email: 'max@example.com',
}

/** 入口一线全部打桩：判定走登录、登录成功发会话。 */
async function stubSignIn(page: Page) {
  await page.route('**/.well-known/yao', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'development', version: '0.0.0', openapi: '/v1' }),
    }),
  )
  await page.route('**/v1/user/entry**', (route) => {
    const path = new URL(route.request().url()).pathname
    const body = path.endsWith('/entry')
      ? ENTRY_CONFIG
      : path.endsWith('/entry/verify')
        ? VERIFIED_LOGIN
        : path.endsWith('/entry/login')
          ? SIGNED_IN
          : {}
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

/** 从登录页走到欢迎页。 */
async function signIn(page: Page) {
  await page.goto('/app/login')
  await page.getByLabel('邮箱或手机号').fill('max@example.com')
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByPlaceholder('登录密码')).toBeVisible()
  await page.getByPlaceholder('登录密码').fill('secret-1')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/app\/welcome$/)
}

test('shows the user of this session after signing in, and follows the success address', async ({ page }) => {
  await stubSignIn(page)
  await signIn(page)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('欢迎回来')
  await expect(page.getByText('用户标识')).toBeVisible()
  await expect(page.getByText('u-1')).toBeVisible()
  await expect(page.getByText('max@example.com')).toBeVisible()
  await shot(page, 'welcome')

  await page.getByRole('button', { name: '继续' }).click()
  await page.waitForURL((url) => url.pathname === '/dashboard/inbox', { timeout: 15_000 })
})

test('switches the wording with the language and takes the dark theme', async ({ page }) => {
  await stubSignIn(page)
  await signIn(page)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('欢迎回来')
  await page.locator('.select-trigger.locale-switch').first().click()
  await page.getByRole('option', { name: 'English' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome')
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()

  await page.locator('.select-trigger.locale-switch').first().click()
  await page.getByRole('option', { name: '日本語' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ようこそ')
  await expect(page.getByRole('button', { name: '続ける' })).toBeVisible()

  await page.locator('.theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await shot(page, 'dark-ja')
})

test('fills the table from the profile when the page is opened on a machine that is already signed in', async ({
  page,
}) => {
  /* 这一条不依赖活体：服务信息与入口一线都打桩，后端不可达时也要跑 */
  await stubSignIn(page)
  /* 直接开这一页（刷新之后）：内存里没有登录那一刻的用户信息，补一次资料取数 */
  await page.addInitScript(() => {
    localStorage.setItem('celadon.session', JSON.stringify({ [location.origin]: Date.now() }))
  })
  await page.route('**/user/profile', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PROFILE) }),
  )

  await page.goto('/app/welcome')

  await expect(page.getByText('用户标识')).toBeVisible()
  await expect(page.getByText('853296684128')).toBeVisible()
  await expect(page.getByText('Wren')).toBeVisible()
  await expect(page.getByText('max@example.com')).toBeVisible()
  await shot(page, 'welcome-after-reload')
})

test('signs out: revokes on the server, forgets this machine and returns to the sign-in page', async ({ page }) => {
  await stubSignIn(page)
  await page.route('**/user/logout', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Logout successful' }) }),
  )
  await signIn(page)

  await page.getByRole('button', { name: '退出登录' }).click()

  await expect(page).toHaveURL(/\/app\/login$/)
  const marks = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('celadon.session') ?? '{}')).length)
  expect(marks).toBe(0)
  await shot(page, 'signed-out')
})
