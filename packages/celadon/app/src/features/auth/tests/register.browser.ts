import { join } from 'node:path'
import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { capturePage, shotDir } from '../../../../../scripts/shots.mjs'

/* 注册页的真实渲染：判定与注册两步都打桩，页面自己走真路由与真取数层。
   依赖活体服务的一条单独探入口配置，服务不在（CI 只起前端）就整条跳过。 */
const SHOTS = shotDir('register-page')
const shot = (page: Page, name: string) => capturePage(page, join(SHOTS, `${name}.png`))

async function hasLiveService(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get('/v1/user/entry?locale=zh-CN')
    return response.ok() && (response.headers()['content-type'] ?? '').includes('application/json')
  } catch {
    return false
  }
}

const ENTRY_CONFIG = {
  title: '欢迎使用 Yao Agents',
  description: '请输入邮箱以继续',
  success_url: '/app/done',
  form: {
    username: { placeholder: '请输入邮箱', fields: ['email'] },
    password: { placeholder: '新密码' },
    confirm_password: { placeholder: '确认密码' },
    captcha: { type: 'none' },
    terms_of_service_link: 'https://example.com/terms',
    privacy_policy_link: 'https://example.com/privacy',
  },
  verification_code_required: false,
  third_party: { providers: [] },
  secure_cookie: false,
}

const VERIFIED_REGISTER = {
  status: 'register',
  access_token: 'temp-register',
  expires_in: 900,
  token_type: 'Bearer',
  scope: 'entry',
  user_exists: false,
  verification_sent: true,
  otp_id: 'otp-1',
}

/** 把入口一线全部打桩：判定走 `register`，注册成功不发会话（回到登录页并提示）。 */
async function stubEntry(page: Page, registerBody: unknown = {}) {
  await page.route('**/v1/user/entry**', (route) => {
    const path = new URL(route.request().url()).pathname
    const body = path.endsWith('/entry')
      ? ENTRY_CONFIG
      : path.endsWith('/entry/verify')
        ? VERIFIED_REGISTER
        : path.endsWith('/entry/register')
          ? registerBody
          : path.endsWith('/entry/otp')
            ? { otp_id: 'otp-2', expires_in: 300 }
            : {}
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

test.beforeEach(async ({ page }) => {
  await page.route('**/.well-known/yao', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'development', version: '0.0.0', openapi: '/v1' }),
    }),
  )
})

test('opens the register form for an account that does not exist', async ({ page }) => {
  await stubEntry(page)
  await page.goto('/app/register?username=max%40example.com')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('创建你的 Yao Agents 账号')
  await page.getByRole('button', { name: '下一步' }).click()

  /* 判定过的账号锁定展示，密码与确认密码在同一张表单里 */
  await expect(page.getByLabel('邮箱或手机号')).toHaveValue('max@example.com')
  await expect(page.getByPlaceholder('新密码')).toBeVisible()
  await expect(page.getByPlaceholder('确认密码')).toBeVisible()
  await expect(page.getByRole('checkbox')).toBeVisible()
  await expect(page.getByRole('button', { name: '注册' })).toBeVisible()

  await shot(page, 'form')
})

test('keeps the passwords on the page when they do not match', async ({ page }) => {
  await stubEntry(page)
  await page.goto('/app/register?username=max%40example.com')
  await page.getByRole('button', { name: '下一步' }).click()

  await page.getByPlaceholder('新密码').fill('secret-1')
  await page.getByPlaceholder('确认密码').fill('secret-2')
  await page.getByRole('checkbox').click()
  await page.getByRole('button', { name: '注册' }).click()

  await expect(page.getByText('两次输入的密码不一致')).toBeVisible()
  expect(page.url()).toContain('/app/register')
  await shot(page, 'mismatch')
})

test('registers and returns to the sign-in page when no session comes back', async ({ page }) => {
  await stubEntry(page)
  await page.goto('/app/register?username=max%40example.com')
  await page.getByRole('button', { name: '下一步' }).click()

  await page.getByPlaceholder('新密码').fill('secret-1')
  await page.getByPlaceholder('确认密码').fill('secret-1')
  await page.getByRole('checkbox').click()
  await page.getByRole('button', { name: '注册' }).click()

  await page.waitForURL('**/app/login')
  await expect(page.getByText('注册成功，请登录')).toBeVisible()
  await shot(page, 'registered')
})

test('switches the form wording with the language and takes the dark theme', async ({ page }) => {
  await stubEntry(page)
  await page.goto('/app/register?username=max%40example.com')
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByRole('button', { name: '注册' })).toBeVisible()

  await page.locator('.select-trigger.locale-switch').first().click()
  await page.getByRole('option', { name: 'English' }).click()
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()

  await page.locator('.select-trigger.locale-switch').first().click()
  await page.getByRole('option', { name: '日本語' }).click()
  await expect(page.getByRole('button', { name: 'アカウント作成' })).toBeVisible()

  await page.locator('.theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await shot(page, 'dark-ja')
})

test('asks for the captcha in the dialog for an account that does not exist', async ({ page, request }) => {
  test.skip(!(await hasLiveService(request)), 'the development service is not reachable')
  await page.goto('/app/register')
  await page.getByLabel('邮箱或手机号').fill(`register-${Date.now()}@example.com`)
  await page.getByRole('button', { name: '下一步' }).click()

  await expect(page.getByText('输入图形验证码')).toBeVisible()
  await shot(page, 'captcha-dialog')
})
