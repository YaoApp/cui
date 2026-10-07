/* 登录页的行为用例：接口走假出口（`transportFetch`），因此走的是真的取数层与真的语言包。
   判定的是页面上看得见的东西：按钮文案、字段显隐、错误文案与跳转结果，不直接读组件内部状态。 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/transport/fetch', () => ({ transportFetch: vi.fn() }))
const signIn = vi.hoisted(() => vi.fn(async (_payload: Record<string, unknown>) => ({ ok: true as const, value: true })))
vi.mock('@/platform/credential', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/platform/credential')>()
  return { ...actual, signIn }
})

import { transportFetch } from '@/platform/transport/fetch'
import { i18n } from '@/platform/i18n'
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { LoginPage } from './login'

const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key as never, options as never) as unknown as string

const SERVICE = { name: 'Yao Dev', version: '1.0.0', openapi: '/v1' }

/** 入口配置：与服务端同形，只留这一页用到的字段。 */
function entryConfig(overrides: Record<string, unknown> = {}) {
  return {
    title: '欢迎使用 Yao Agents',
    description: '请输入邮箱以继续',
    success_url: '/done',
    form: {
      username: { placeholder: '请输入邮箱', fields: ['email'] },
      password: { placeholder: '登录密码' },
      confirm_password: { placeholder: '确认密码' },
      captcha: { type: 'none' },
      remember_me: true,
      terms_of_service_link: 'https://example.com/terms',
      privacy_policy_link: 'https://example.com/privacy',
    },
    verification_code_required: false,
    third_party: { providers: [] },
    /* 服务端声明不用安全 Cookie 时不本地验签；要验签的那一条用例单独覆盖。 */
    secure_cookie: false,
    ...overrides,
  }
}

const VERIFIED_LOGIN = {
  status: 'login',
  access_token: 'temp-login',
  expires_in: 900,
  token_type: 'Bearer',
  scope: 'entry',
  user_exists: true,
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

function json(value: unknown, status = 200) {
  return { ok: true as const, value: new Response(JSON.stringify(value), { status }) }
}

/** 每条接口的默认回应，用例只覆盖自己关心的那一条。 */
function stubTransport(overrides: Record<string, { body: unknown; status?: number }> = {}, config = entryConfig()) {
  vi.mocked(transportFetch).mockImplementation(async (url) => {
    const target = String(url)
    for (const [fragment, value] of Object.entries(overrides)) {
      if (target.includes(fragment)) return json(value.body, value.status ?? 200)
    }
    if (target.includes('/.well-known/yao')) return json(SERVICE)
    if (target.includes('/user/entry/verify')) return json(VERIFIED_LOGIN)
    if (target.includes('/user/entry/login')) {
      return json({ user_id: 'u1', id_token: 'id-token-value', access_token: 'access', refresh_token: 'refresh', status: 'ok' })
    }
    if (target.includes('/user/entry/captcha')) {
      return json({ captcha_id: 'captcha-1', captcha_image: 'data:image/gif;base64,R0lGOD', expires_in: 300 })
    }
    if (target.includes('/oauth/jwks')) return json({ keys: [] })
    if (target.includes('/user/entry')) return json(config)
    return json({})
  })
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/done" element={<p>已到达成功地址</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

/** 填好第一步并进入密码步：账号、条款、继续。 */
/** 密码字段没有可见标签（与草稿一致，占位文字承担说明），因此按占位文字找。 */
const passwordBox = () => screen.getByPlaceholderText('登录密码')
const confirmBox = () => screen.getByPlaceholderText('确认密码')

async function reachPasswordStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText(t('auth.field.account')), 'max@example.com')
  await user.click(screen.getByRole('checkbox'))
  await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
  await screen.findByPlaceholderText('登录密码')
}

describe('the sign-in page', () => {
  beforeEach(() => {
    vi.mocked(transportFetch).mockReset()
    signIn.mockClear()
  })

  it('shows the fixed title copy of the design, not the wording from the entry configuration', async () => {
    stubTransport()
    renderLogin()
    /* 标题是设计稿的固定文案：第一行来自语言包，第二行为空由样式收起 */
    expect(await screen.findByRole('heading', { level: 1, name: '注册或登录你的 Yao Agents 账号' })).toBeTruthy()
    expect(screen.queryByText('欢迎使用 Yao Agents')).toBeNull()
  })

  it('rejects an invalid account without calling verify', async () => {
    stubTransport()
    const user = userEvent.setup()
    renderLogin()
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'not-an-account')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
    expect(await screen.findByText(t('auth.error.accountInvalid'))).toBeTruthy()
    expect(vi.mocked(transportFetch).mock.calls.filter(([url]) => String(url).includes('/user/entry/verify'))).toHaveLength(0)
  })

  it('asks for the terms before continuing', async () => {
    stubTransport()
    const user = userEvent.setup()
    renderLogin()
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'max@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
    expect(await screen.findByText(t('auth.error.termsRequired'))).toBeTruthy()
  })

  it('moves to the password step, signs in and lands on the success address', async () => {
    stubTransport()
    const user = userEvent.setup()
    renderLogin()
    await reachPasswordStep(user)
    await user.type(passwordBox(), 'secret-1')
    await user.click(screen.getByRole('button', { name: t('auth.action.login') }))

    await waitFor(() => expect(signIn).toHaveBeenCalledTimes(1))
    expect(signIn.mock.calls[0][0]).toMatchObject({ user_id: 'u1', access_token: 'access' })
    expect(await screen.findByText('已到达成功地址')).toBeTruthy()
  })

  it('asks for the confirmation and the one-time code when the account is new', async () => {
    stubTransport({ '/user/entry/verify': { body: VERIFIED_REGISTER } }, entryConfig({ verification_code_required: true }))
    const user = userEvent.setup()
    renderLogin()
    await reachPasswordStep(user)

    expect(await screen.findByPlaceholderText('确认密码')).toBeTruthy()
    expect(screen.getByRole('button', { name: t('auth.action.register') })).toBeTruthy()
    expect(screen.getByRole('button', { name: t('auth.action.resendIn', { seconds: 60 }) })).toBeTruthy()
  })

  it('refuses to submit when the two passwords differ', async () => {
    stubTransport({ '/user/entry/verify': { body: VERIFIED_REGISTER } }, entryConfig({ verification_code_required: true }))
    const user = userEvent.setup()
    renderLogin()
    await reachPasswordStep(user)
    await user.type(passwordBox(), 'one-two-three')
    await user.type(confirmBox(), 'three-two-one')
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    expect(await screen.findByText(t('auth.error.passwordMismatch'))).toBeTruthy()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('shows the wording of the language pack instead of the service text when sign-in fails', async () => {
    stubTransport({
      '/user/entry/login': {
        body: { error: 'invalid_request', error_description: 'the request body is not acceptable' },
        status: 400,
      },
    })
    const user = userEvent.setup()
    renderLogin()
    await reachPasswordStep(user)
    await user.type(passwordBox(), 'wrong')
    await user.click(screen.getByRole('button', { name: t('auth.action.login') }))

    const notice = await screen.findByRole('alert')
    expect(notice.textContent).toContain(t('data.error.invalidRequest'))
    expect(notice.textContent).not.toContain('the request body is not acceptable')
    expect(signIn).not.toHaveBeenCalled()
  })

  it('refuses to adopt a session whose ID token does not verify', async () => {
    stubTransport({}, entryConfig({ secure_cookie: true }))
    const user = userEvent.setup()
    renderLogin()
    await reachPasswordStep(user)
    await user.type(passwordBox(), 'secret-1')
    await user.click(screen.getByRole('button', { name: t('auth.action.login') }))

    const notice = await screen.findByRole('alert')
    expect(notice.textContent).toContain(t('auth.error.idToken'))
    expect(signIn).not.toHaveBeenCalled()
  })

  it('goes back to the account step and clears the password', async () => {
    stubTransport()
    const user = userEvent.setup()
    renderLogin()
    await reachPasswordStep(user)
    await user.type(passwordBox(), 'secret-1')
    await user.click(screen.getByRole('button', { name: t('auth.action.change') }))

    expect(await screen.findByLabelText(t('auth.field.account'))).toBeTruthy()
    expect(screen.queryByPlaceholderText('登录密码')).toBeNull()
  })

  it('keeps the captcha out of the account step even when the entry configuration asks for one', async () => {
    /* 人机验证在点「下一步」之后单独一步给出，进入页面时不占位（与设计稿的卡片内容一致） */
    stubTransport({}, entryConfig({ form: { ...entryConfig().form, captcha: { type: 'image' } } }))
    renderLogin()
    expect(await screen.findByLabelText(t('auth.field.account'))).toBeTruthy()
    expect(screen.queryByPlaceholderText('验证码')).toBeNull()
  })

  it('renders a third party provider row with the brand mark of that provider', async () => {
    stubTransport(
      {},
      entryConfig({ third_party: { providers: [{ id: 'google', label: '谷歌', title: '使用谷歌账号登录', logo: '/assets/brands/google.svg' }] } }),
    )
    renderLogin()
    const provider = await screen.findByRole('button', { name: t('auth.provider.continueWith', { provider: '谷歌' }) })
    /* 认得出来的提供方走产品品牌图标（标记本身就是 svg），不再用配置给的图片地址 */
    const mark = provider.querySelector('.provider-list__mark') as HTMLElement
    expect(mark.tagName.toLowerCase()).toBe('svg')
    expect(mark.querySelector('img')).toBeNull()
  })
})
