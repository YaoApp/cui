/* 登录页的行为用例：接口走假出口（`transportFetch`），因此走的是真的取数层与真的语言包。
   判定的是页面上看得见的东西：按钮文案、字段显隐、错误文案与跳转结果，不直接读组件内部状态。 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
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
          {/* 注册表单尚未落地：这里只证明账号不存在时会走到这个地址，并把账号带在查询里 */}
          <Route path="/register" element={<RegisterProbe />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

function RegisterProbe() {
  const location = useLocation()
  return <p>注册表单 {location.search}</p>
}

/** 填好第一步并进入密码步：账号、继续。 */
/** 密码字段没有可见标签（与草稿一致，占位文字承担说明），因此按占位文字找。 */
const passwordBox = () => screen.getByPlaceholderText('登录密码')

async function reachPasswordStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText(t('auth.field.account')), 'max@example.com')
  await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
  await screen.findByPlaceholderText('登录密码')
}

describe('the sign-in page', () => {
  beforeEach(() => {
    vi.mocked(transportFetch).mockReset()
    signIn.mockClear()
    /* 域状态在 store 里，模块级单例，用例之间要复位，否则顺序会影响结果 */
    useAuthStore.getState().reset()
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

  it('keeps the terms row off the sign-in page', async () => {
    /* 同意条款属于注册行为：登录页不出现勾选框，判定也不以它为条件 */
    stubTransport()
    const user = userEvent.setup()
    renderLogin()
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'max@example.com')
    expect(screen.queryByRole('checkbox', { name: /使用协议/ })).toBeNull()

    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
    expect(await screen.findByPlaceholderText('登录密码')).toBeTruthy()
  })

  it('locks the account after the judgement, and the change action returns to the editable step', async () => {
    stubTransport()
    const user = userEvent.setup()
    renderLogin()
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'max@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))

    /* 判定通过后账号锁定：只读，与小档反色按钮同一行 */
    const locked = (await screen.findByLabelText(t('auth.field.account'))) as HTMLInputElement
    expect(locked.readOnly).toBe(true)
    expect(document.querySelector('.locked-account')).toBeTruthy()
    const change = screen.getByRole('button', { name: t('auth.action.change') })
    expect(change.classList.contains('button--small')).toBe(true)
    expect(change.classList.contains('button--inverse')).toBe(true)

    /* 点「修改」回到可编辑的账号步，密码表单收起 */
    await user.click(change)
    const editable = (await screen.findByLabelText(t('auth.field.account'))) as HTMLInputElement
    expect(editable.readOnly).toBe(false)
    expect(screen.queryByPlaceholderText('登录密码')).toBeNull()
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

  it('sends an account that does not exist to the register form with the account in the query', async () => {
    stubTransport({ '/user/entry/verify': { body: VERIFIED_REGISTER } })
    const user = userEvent.setup()
    renderLogin()
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'new@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))

    expect(await screen.findByText(/注册表单/)).toBeTruthy()
    expect(screen.getByText(/username=new%40example\.com/)).toBeTruthy()
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

    /* 失败落在密码字段上（表单的错误提示），不是页面顶端的通知 */
    const error = await screen.findByText(t('data.error.invalidRequest'))
    expect(error.textContent).toContain(t('data.error.invalidRequest'))
    expect(error.textContent).not.toContain('the request body is not acceptable')
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

  it('asks for the captcha in the dialog when the entry configuration asks for an image captcha', async () => {
    /* 图形验证码在点「下一步」之后由弹窗收；进入页面时账号步不占验证码的位置 */
    stubTransport({}, entryConfig({ form: { ...entryConfig().form, captcha: { type: 'image' } } }))
    const user = userEvent.setup()
    renderLogin()
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'max@example.com')
    expect(screen.queryByPlaceholderText(t('auth.captcha.placeholder'))).toBeNull()

    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
    /* 弹窗打开且落在验证码这一步：标题是弹窗的，字段与换图都在里面 */
    const dialog = await screen.findByRole('dialog')
    expect(dialog.textContent).toContain(t('auth.dialog.captchaTitle'))
    expect(await screen.findByPlaceholderText(t('auth.captcha.placeholder'))).toBeTruthy()
    expect(screen.getByRole('button', { name: t('auth.captcha.refresh') })).toBeTruthy()

    /* 填好验证码再「确定」：带 `captcha` 与 `captcha_id` 去判定，账号存在则回到页面的密码步 */
    await user.type(screen.getByPlaceholderText(t('auth.captcha.placeholder')), 'abcd')
    await user.click(screen.getByRole('button', { name: t('auth.action.confirm') }))
    expect(await screen.findByPlaceholderText('登录密码')).toBeTruthy()
    const verifyCall = vi
      .mocked(transportFetch)
      .mock.calls.find(([url]) => String(url).includes('/user/entry/verify'))
    expect(JSON.stringify(verifyCall?.[1]?.body)).toContain('abcd')
    expect(JSON.stringify(verifyCall?.[1]?.body)).toContain('captcha-1')
  })

  it('asks for the human verification when the configuration declares turnstile, and sends the token', async () => {
    /* 人机验证是独立控件：装一个假接口，核它把令牌交给判定请求，且不带图片验证码才有的 captcha_id */
    const renderWidget = vi.fn((_container: HTMLElement, options: { callback?: (token: string) => void }) => {
      options.callback?.('turnstile-token')
      return 'widget-1'
    })
    ;(window as unknown as { turnstile?: unknown }).turnstile = { render: renderWidget, remove: vi.fn() }
    stubTransport(
      { '/user/entry/verify': { body: VERIFIED_LOGIN } },
      entryConfig({ form: { ...entryConfig().form, captcha: { type: 'turnstile', options: { sitekey: 'site-1' } } } }),
    )
    const user = userEvent.setup()
    renderLogin()
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'max@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))

    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1))
    expect(renderWidget.mock.calls[0][1]).toMatchObject({ sitekey: 'site-1' })
    /* 图片验证码那套字段不该出现 */
    expect(dialog.querySelector('.captcha-field')).toBeNull()

    await user.click(screen.getByRole('button', { name: t('auth.action.confirm') }))
    expect(await screen.findByPlaceholderText('登录密码')).toBeTruthy()
    const verifyCall = vi
      .mocked(transportFetch)
      .mock.calls.find(([url]) => String(url).includes('/user/entry/verify'))
    const body = JSON.stringify(verifyCall?.[1]?.body)
    expect(body).toContain('turnstile-token')
    expect(body).not.toContain('captcha_id')
    delete (window as unknown as { turnstile?: unknown }).turnstile
  })

  it('asks for a fresh captcha after a judgement fails, because a token is only good once', async () => {
    stubTransport(
      {
        '/user/entry/verify': {
          body: { error: 'invalid_request', error_description: 'the request body is not acceptable' },
          status: 400,
        },
      },
      entryConfig({ form: { ...entryConfig().form, captcha: { type: 'image' } } }),
    )
    const user = userEvent.setup()
    renderLogin()
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'max@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
    await screen.findByPlaceholderText(t('auth.captcha.placeholder'))

    const captchaCalls = () =>
      vi.mocked(transportFetch).mock.calls.filter(([url]) => String(url).includes('/user/entry/captcha')).length
    await waitFor(() => expect(captchaCalls()).toBe(1))

    await user.type(screen.getByPlaceholderText(t('auth.captcha.placeholder')), 'abcd')
    await user.click(screen.getByRole('button', { name: t('auth.action.confirm') }))
    /* 判定失败的文案落在验证码字段上，不是页面顶端的通知 */
    await screen.findByText(t('data.error.invalidRequest'))
    /* 失败后控件换了一轮：重新取图，已填内容也清空 */
    await waitFor(() => expect(captchaCalls()).toBe(2))
    expect((screen.getByPlaceholderText(t('auth.captcha.placeholder')) as HTMLInputElement).value).toBe('')
  })

  it('says the captcha is wrong when the judgement rejects it, not the generic wording', async () => {
    /* 服务端把「某一项不合法」统一报成 `invalid_request`，真正原因在描述原文里；
       入口页要显示的是「验证码不正确」，不是「请求不合法」。 */
    stubTransport(
      {
        '/user/entry/verify': {
          body: { error: 'invalid_request', error_description: 'Captcha verification failed: invalid captcha' },
          status: 400,
        },
      },
      entryConfig({ form: { ...entryConfig().form, captcha: { type: 'image' } } }),
    )
    const user = userEvent.setup()
    renderLogin()
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'max@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
    await user.type(await screen.findByPlaceholderText(t('auth.captcha.placeholder')), 'abcd')
    await user.click(screen.getByRole('button', { name: t('auth.action.confirm') }))

    expect(await screen.findByText(t('data.error.user.invalidCaptcha'))).toBeTruthy()
    expect(screen.queryByText(t('data.error.invalidRequest'))).toBeNull()
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
