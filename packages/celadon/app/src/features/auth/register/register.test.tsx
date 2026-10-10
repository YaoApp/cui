/* 注册页的行为用例：接口走假出口（`transportFetch`），因此走的是真的取数层与真的语言包。
   判定页面上看得见的东西：字段显隐、错误文案、请求体与跳转结果，不直接读组件内部状态。 */
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
import { useAuthStore } from '../auth.store'
import { i18n } from '@/platform/i18n'
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { RegisterPage } from './register'

const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key as never, options as never) as unknown as string

const SERVICE = { name: 'Yao Dev', version: '1.0.0', openapi: '/v1' }

function entryConfig(overrides: Record<string, unknown> = {}) {
  return {
    title: '欢迎使用 Yao Agents',
    description: '请输入邮箱以继续',
    success_url: '/done',
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
    ...overrides,
  }
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

const VERIFIED_LOGIN = {
  status: 'login',
  access_token: 'temp-login',
  expires_in: 900,
  token_type: 'Bearer',
  scope: 'entry',
  user_exists: true,
}

function json(value: unknown, status = 200) {
  return { ok: true as const, value: new Response(JSON.stringify(value), { status }) }
}

function stubTransport(overrides: Record<string, { body: unknown; status?: number }> = {}, config: Record<string, unknown> = entryConfig()) {
  vi.mocked(transportFetch).mockImplementation(async (url) => {
    const target = String(url)
    for (const [fragment, value] of Object.entries(overrides)) {
      if (target.includes(fragment)) return json(value.body, value.status ?? 200)
    }
    if (target.includes('/.well-known/yao')) return json(SERVICE)
    if (target.includes('/user/entry/verify')) return json(VERIFIED_REGISTER)
    if (target.includes('/user/entry/register')) return json({})
    if (target.includes('/user/entry/otp')) return json({ otp_id: 'otp-2', expires_in: 300 })
    if (target.includes('/user/entry/captcha')) return json({ captcha_id: 'captcha-1', captcha_image: 'data:image/gif;base64,R0lGOD' })
    if (target.includes('/oauth/jwks')) return json({ keys: [] })
    if (target.includes('/user/entry')) return json(config)
    return json({})
  })
}

function renderRegister(url = '/register?username=max%40example.com') {
  window.history.pushState({}, '', url)
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<p>登录页</p>} />
          {/* 登录成功的第一站是收件箱；成功地址随后再接 */}
          <Route path="/inbox" element={<p>收件箱</p>} />
          <Route path="/done" element={<p>已到达成功地址</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

/** 从账号步走到密码步：入口配置不要求验证码，点「下一步」即判定。 */
async function reachRegisterForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: t('auth.action.continue') }))
  await screen.findByPlaceholderText('新密码')
}

/** 填好密码、确认密码与条款。 */
async function fillForm(user: ReturnType<typeof userEvent.setup>, password = 'secret-1', confirm = password) {
  await user.type(screen.getByPlaceholderText('新密码'), password)
  await user.type(screen.getByPlaceholderText('确认密码'), confirm)
  await user.click(screen.getByRole('checkbox'))
}

async function registerBodies() {
  const calls = vi.mocked(transportFetch).mock.calls.filter(([url]) => String(url).includes('/user/entry/register'))
  return calls.map(([, init]) => JSON.parse(String((init as RequestInit | undefined)?.body ?? '{}')) as Record<string, unknown>)
}

async function verifyBodies() {
  const calls = vi.mocked(transportFetch).mock.calls.filter(([url]) => String(url).includes('/user/entry/verify'))
  return calls.map(([, init]) => JSON.parse(String((init as RequestInit | undefined)?.body ?? '{}')) as Record<string, unknown>)
}

describe('the register page', () => {
  beforeEach(() => {
    vi.mocked(transportFetch).mockReset()
    signIn.mockClear()
    /* 域状态在 store 里，模块级单例，用例之间要复位 */
    useAuthStore.getState().reset()
    stubTransport()
  })

  it('prefills the account carried over in the address', async () => {
    renderRegister()
    const account = await screen.findByLabelText(t('auth.field.account'))
    expect((account as HTMLInputElement).value).toBe('max@example.com')
    expect(screen.queryByPlaceholderText('新密码')).toBeNull()
  })

  it('walks the account judgement and opens the password form', async () => {
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)

    expect(screen.getByPlaceholderText('确认密码')).toBeTruthy()
    expect(screen.getByRole('checkbox')).toBeTruthy()
    expect(screen.getByRole('button', { name: t('auth.action.register') })).toBeTruthy()
    /* 判定过的账号锁定展示，要改走「修改」 */
    expect((screen.getByLabelText(t('auth.field.account')) as HTMLInputElement).value).toBe('max@example.com')
    expect(screen.getByRole('button', { name: t('auth.action.change') })).toBeTruthy()
  })

  it('keeps the user on the account step when the account already exists', async () => {
    stubTransport({ '/user/entry/verify': { body: VERIFIED_LOGIN } })
    const user = userEvent.setup()
    renderRegister()
    await user.click(await screen.findByRole('button', { name: t('auth.action.continue') }))

    expect(await screen.findByText(t('auth.register.exists'))).toBeTruthy()
    expect(screen.queryByPlaceholderText('新密码')).toBeNull()
  })

  it('uses a text account field, so a phone number passes the browser constraint check', async () => {
    renderRegister()
    const account = (await screen.findByLabelText(t('auth.field.account'))) as HTMLInputElement
    expect(account.type).toBe('text')
  })

  it('drops the already-registered note when the account changes and a new judgement runs', async () => {
    stubTransport({ '/user/entry/verify': { body: VERIFIED_LOGIN } })
    const user = userEvent.setup()
    renderRegister()
    await user.click(await screen.findByRole('button', { name: t('auth.action.continue') }))
    expect(await screen.findByText(t('auth.register.exists'))).toBeTruthy()

    /* 换一个账号再判定：这一轮可以注册，旧提示要撤掉并进密码步 */
    stubTransport()
    const account = screen.getByLabelText(t('auth.field.account'))
    await user.clear(account)
    await user.type(account, 'new-user@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))

    expect(await screen.findByPlaceholderText('新密码')).toBeTruthy()
    expect(screen.queryByText(t('auth.register.exists'))).toBeNull()
  })

  it('resets the sign-in flow when the footnote returns to the sign-in page', async () => {
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    expect(useAuthStore.getState().phase).toBe('password')

    await user.click(screen.getByRole('link', { name: t('auth.register.backToLogin') }))

    expect(useAuthStore.getState().phase).toBe('account')
    expect(useAuthStore.getState().tempToken).toBe('')
  })

  it('reports a password mismatch on the field and does not call the endpoint', async () => {
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await fillForm(user, 'secret-1', 'secret-2')
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    expect(await screen.findByText(t('auth.error.passwordMismatch'))).toBeTruthy()
    expect(await registerBodies()).toHaveLength(0)
  })

  it('requires the terms before it calls the endpoint', async () => {
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await user.type(screen.getByPlaceholderText('新密码'), 'secret-1')
    await user.type(screen.getByPlaceholderText('确认密码'), 'secret-1')
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    expect(await screen.findByText(t('auth.error.termsRequired'))).toBeTruthy()
    expect(await registerBodies()).toHaveLength(0)
  })

  it('sends the password and its confirmation to the endpoint', async () => {
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    await waitFor(async () => expect(await registerBodies()).toHaveLength(1))
    const [body] = await registerBodies()
    expect(body.password).toBe('secret-1')
    expect(body.confirm_password).toBe('secret-1')
    expect(body.verification_code).toBeUndefined()
  })

  it('asks for the one-time code, cannot resend during the cooldown and sends the otp id', async () => {
    stubTransport({}, entryConfig({ verification_code_required: true }))
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)

    /* 判定已经发过一次口令，因此先看到冷却中的重发按钮；口令输入在页面上 */
    expect(screen.getAllByLabelText(t('auth.field.code')).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: t('auth.action.resendIn', { seconds: 60 }) })).toBeDisabled()

    await fillForm(user)
    const firstCell = screen.getByLabelText(t('auth.field.codeCell', { index: 1 }))
    await user.click(firstCell)
    await user.paste('123456')
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    await waitFor(async () => expect(await registerBodies()).toHaveLength(1))
    const [body] = await registerBodies()
    expect(body.verification_code).toBe('123456')
    expect(body.otp_id).toBe('otp-1')
  })

  it('treats a missing verification_code_required as needing the code, like the engine does', async () => {
    stubTransport({}, entryConfig({ verification_code_required: undefined }))
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)

    /* 字段缺省时引擎按「需要」处理（isVerificationCodeRequired 为空即真），页面同样要出口令输入 */
    expect(screen.getAllByLabelText(t('auth.field.code')).length).toBeGreaterThan(0)

    await fillForm(user)
    const firstCell = screen.getByLabelText(t('auth.field.codeCell', { index: 1 }))
    await user.click(firstCell)
    await user.paste('654321')
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    await waitFor(async () => expect(await registerBodies()).toHaveLength(1))
    const [body] = await registerBodies()
    expect(body.verification_code).toBe('654321')
  })

  it('returns to the sign-in page with the success note when no session comes back', async () => {
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    expect(await screen.findByText('登录页')).toBeTruthy()
    expect(useAuthStore.getState().notice?.text).toBe(t('auth.notice.registered'))
  })

  it('adopts the session and lands on the inbox when the response carries an id token', async () => {
    stubTransport({
      '/user/entry/register': {
        body: { user_id: 'u1', id_token: 'id-token-value', access_token: 'access', refresh_token: 'refresh', status: 'ok' },
      },
    })
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    expect(await screen.findByText('收件箱')).toBeTruthy()
    expect(signIn).toHaveBeenCalledTimes(1)
  })

  it('opens the invite step when registration asks for an invite', async () => {
    stubTransport({
      '/user/entry/register': { body: { status: 'invite_required', access_token: 'invite-token' } },
    })
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    expect(await screen.findByLabelText(t('auth.field.invite'))).toBeTruthy()
    expect(screen.getByRole('button', { name: t('auth.action.redeem') })).toBeTruthy()
  })

  it('reports an invalid account on the field and does not judge', async () => {
    const user = userEvent.setup()
    renderRegister('/register')
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'not-an-account')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))

    expect(await screen.findByText(t('auth.error.accountInvalid'))).toBeTruthy()
    expect(vi.mocked(transportFetch).mock.calls.some(([url]) => String(url).includes('/user/entry/verify'))).toBe(false)
  })

  it('asks for the captcha in the dialog and judges with it', async () => {
    stubTransport({}, entryConfig({ form: { ...entryConfig().form, captcha: { type: 'image' } } }))
    const user = userEvent.setup()
    renderRegister('/register')
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'new@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))

    /* 空着确定：错误落在验证码字段上 */
    await screen.findByPlaceholderText(t('auth.captcha.placeholder'))
    await user.click(screen.getByRole('button', { name: t('auth.action.confirm') }))
    expect(await screen.findByText(t('auth.error.captchaRequired'))).toBeTruthy()

    await user.type(screen.getByPlaceholderText(t('auth.captcha.placeholder')), 'a1b2')
    await user.click(screen.getByRole('button', { name: t('auth.action.confirm') }))
    await screen.findByPlaceholderText('新密码')

    const [body] = await verifyBodies()
    expect(body.captcha).toBe('a1b2')
    expect(body.captcha_id).toBe('captcha-1')
  })

  it('shows the translated failure when the judgement fails', async () => {
    stubTransport({
      '/user/entry/verify': { body: { error: 'invalid_request', error_description: 'the request body is not acceptable' }, status: 400 },
    })
    const user = userEvent.setup()
    renderRegister()
    await user.click(await screen.findByRole('button', { name: t('auth.action.continue') }))

    expect(await screen.findByText(t('data.error.invalidRequest'))).toBeTruthy()
    expect(screen.queryByPlaceholderText('新密码')).toBeNull()
  })

  it('shows the register failure at the page level', async () => {
    stubTransport({
      '/user/entry/register': { body: { error: 'invalid_request', error_description: 'the request body is not acceptable' }, status: 400 },
    })
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    expect(await screen.findByText(t('data.error.invalidRequest'))).toBeTruthy()
  })

  it('returns to the account step through the change button', async () => {
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await user.click(screen.getByRole('button', { name: t('auth.action.change') }))

    expect((screen.getByLabelText(t('auth.field.account')) as HTMLInputElement).value).toBe('max@example.com')
    expect(screen.queryByPlaceholderText('新密码')).toBeNull()
  })

  it('shows the notice for a joint state instead of leaving the page', async () => {
    stubTransport({ '/user/entry/register': { body: { status: 'mfa_required' } } })
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    expect(await screen.findByText(t('auth.notice.mfa'))).toBeTruthy()
    expect(screen.getByPlaceholderText('新密码')).toBeTruthy()
  })

  it('redeems the invite and lands on the inbox', async () => {
    stubTransport({ '/user/entry/register': { body: { status: 'invite_required', access_token: 'invite-token' } } })
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    await user.type(await screen.findByLabelText(t('auth.field.invite')), 'INVITE-1')
    await user.click(screen.getByRole('button', { name: t('auth.action.redeem') }))
    expect(await screen.findByText('收件箱')).toBeTruthy()
    expect(signIn).toHaveBeenCalledTimes(1)
  })

  it('shows the loading state while the entry configuration is on its way', async () => {
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      if (String(url).includes('/.well-known/yao')) return json(SERVICE)
      if (String(url).includes('/user/entry')) return new Promise(() => undefined)
      return json({})
    })
    renderRegister()
    expect(await screen.findByRole('status')).toBeTruthy()
  })

  it('falls back to the language pack for the field placeholders', async () => {
    stubTransport({}, { title: '欢迎', description: '', success_url: '/done', form: { captcha: { type: 'none' } }, verification_code_required: false, third_party: { providers: [] }, secure_cookie: false })
    const user = userEvent.setup()
    renderRegister('/register')

    expect(await screen.findByPlaceholderText(t('auth.field.account'))).toBeTruthy()
    await user.type(screen.getByPlaceholderText(t('auth.field.account')), 'new@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))

    expect(await screen.findByPlaceholderText(t('auth.field.password'))).toBeTruthy()
    expect(screen.getByPlaceholderText(t('auth.field.confirmPassword'))).toBeTruthy()
  })

  it('closes the captcha dialog through cancel and stays on the account step', async () => {
    stubTransport({}, entryConfig({ form: { ...entryConfig().form, captcha: { type: 'image' } } }))
    const user = userEvent.setup()
    renderRegister('/register')
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'new@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))

    await screen.findByPlaceholderText(t('auth.captcha.placeholder'))
    await user.click(screen.getByRole('button', { name: t('auth.action.cancel') }))
    expect(screen.queryByText(t('auth.dialog.captchaTitle'))).toBeNull()
    expect(screen.getByLabelText(t('auth.field.account'))).toBeTruthy()
  })

  it('requires the password before it calls the endpoint', async () => {
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    expect(await screen.findByText(t('auth.error.passwordRequired'))).toBeTruthy()
    expect(await registerBodies()).toHaveLength(0)
  })

  it('requires the one-time code when the configuration asks for it', async () => {
    stubTransport({}, entryConfig({ verification_code_required: true }))
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    expect(await screen.findByText(t('auth.error.codeRequired'))).toBeTruthy()
    expect(await registerBodies()).toHaveLength(0)
  })

  it('asks for the turnstile widget and reports it when it is empty', async () => {
    ;(window as unknown as { turnstile?: unknown }).turnstile = {
      render: () => 'widget-1',
      remove: () => undefined,
    }
    stubTransport({}, entryConfig({ form: { ...entryConfig().form, captcha: { type: 'turnstile', options: { sitekey: 'site-key' } } } }))
    const user = userEvent.setup()
    renderRegister('/register')
    try {
      await user.type(await screen.findByLabelText(t('auth.field.account')), 'new@example.com')
      await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
      await user.click(await screen.findByRole('button', { name: t('auth.action.confirm') }))

      expect(await screen.findByText(t('auth.error.turnstileRequired'))).toBeTruthy()
    } finally {
      delete (window as unknown as { turnstile?: unknown }).turnstile
    }
  })

  it('judges with the turnstile token when the widget hands one over', async () => {
    ;(window as unknown as { turnstile?: unknown }).turnstile = {
      render: (_element: HTMLElement, options: { callback?: (token: string) => void }) => {
        options.callback?.('turnstile-token')
        return 'widget-1'
      },
      remove: () => undefined,
    }
    stubTransport({}, entryConfig({ form: { ...entryConfig().form, captcha: { type: 'turnstile', options: { sitekey: 'site-key' } } } }))
    const user = userEvent.setup()
    renderRegister('/register')
    try {
      await user.type(await screen.findByLabelText(t('auth.field.account')), 'new@example.com')
      await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
      await user.click(await screen.findByRole('button', { name: t('auth.action.confirm') }))
      await screen.findByPlaceholderText('新密码')

      const [body] = await verifyBodies()
      expect(body.captcha).toBe('turnstile-token')
      expect(body.captcha_id).toBeUndefined()
    } finally {
      delete (window as unknown as { turnstile?: unknown }).turnstile
    }
  })

  it('shows the judgement failure inside the captcha dialog', async () => {
    stubTransport(
      { '/user/entry/verify': { body: { error: 'invalid_request', error_description: 'the request body is not acceptable' }, status: 400 } },
      entryConfig({ form: { ...entryConfig().form, captcha: { type: 'image' } } }),
    )
    const user = userEvent.setup()
    renderRegister('/register')
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'new@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
    await user.type(await screen.findByPlaceholderText(t('auth.captcha.placeholder')), 'a1b2')
    await user.click(screen.getByRole('button', { name: t('auth.action.confirm') }))

    expect(await screen.findByText(t('data.error.invalidRequest'))).toBeTruthy()
  })

  it('shows the invite failure on the invite field', async () => {
    stubTransport({
      '/user/entry/register': { body: { status: 'invite_required' } },
      '/user/entry/invite': { body: { error: 'invalid_request', error_description: 'the request body is not acceptable' }, status: 400 },
    })
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    await user.type(await screen.findByLabelText(t('auth.field.invite')), 'INVITE-1')
    await user.click(screen.getByRole('button', { name: t('auth.action.redeem') }))
    expect(await screen.findByText(t('data.error.invalidRequest'))).toBeTruthy()
  })

  it('opens the invite step when the registration response asks for invite verification', async () => {
    stubTransport({ '/user/entry/register': { body: { status: 'invite_verification_required', access_token: 'invite-token' } } })
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    expect(await screen.findByLabelText(t('auth.field.invite'))).toBeTruthy()
  })

  it('shows the notice for a team selection instead of leaving the page', async () => {
    stubTransport({ '/user/entry/register': { body: { status: 'team_selection_required' } } })
    const user = userEvent.setup()
    renderRegister()
    await reachRegisterForm(user)
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: t('auth.action.register') }))

    expect(await screen.findByText(t('auth.notice.team'))).toBeTruthy()
    expect(screen.getByPlaceholderText('新密码')).toBeTruthy()
  })

  it('says the entry configuration failed and reads it again on retry', async () => {
    let failing = true
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      if (target.includes('/oauth/jwks')) return json({ keys: [] })
      if (failing) return { ok: false as const, code: 'transport.network', params: {}, message: 'boom' }
      return json(entryConfig())
    })
    const user = userEvent.setup()
    renderRegister()

    /* 取失败要给失败态与重试，不能一直停在加载态 */
    expect(await screen.findByText(t('auth.configFailed'))).toBeTruthy()

    failing = false
    await user.click(screen.getByRole('button', { name: t('auth.retry') }))
    expect(await screen.findByLabelText(t('auth.field.account'))).toBeTruthy()
    expect(screen.queryByText(t('auth.configFailed'))).toBeNull()
  })

  it('keeps the client marker on the way back to sign-in', async () => {
    stubTransport()
    renderRegister('/register?from=connect')

    const link = await screen.findByRole('link', { name: t('auth.register.backToLogin') })
    expect(link.getAttribute('href')).toContain('from=connect')
  })
})
