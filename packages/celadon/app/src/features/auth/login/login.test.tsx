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

/* 打开外部地址的平台面孔：页面只负责把授权地址交给它，跳转本身在平台层用例里核。 */
const openExternal = vi.hoisted(() => vi.fn((_url: string) => undefined))
vi.mock('@/platform/client/open-external', () => ({ openExternal }))

import { transportFetch } from '@/platform/transport/fetch'
import { client } from '@/platform/client'
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

function renderLogin(entry = '/login') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* 登录成功的第一站是收件箱；成功地址随后再接 */}
          <Route path="/inbox" element={<p>收件箱</p>} />
          <Route path="/done" element={<p>已到达成功地址</p>} />
          {/* 这里只证明账号不存在时会走到这个地址，并把账号带在查询里；注册页自己另有用例 */}
          <Route path="/register" element={<RegisterProbe />} />
          {/* 客户端栏的返回目标 */}
          <Route path="/servers" element={<p>服务器选择页</p>} />
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
    openExternal.mockClear()
    /* 页面会读自己的地址取客户端来源标记，用例之间复位 */
    window.history.pushState({}, '', '/')
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

  it('moves to the password step, signs in and lands on the inbox', async () => {
    stubTransport()
    const user = userEvent.setup()
    renderLogin()
    await reachPasswordStep(user)
    await user.type(passwordBox(), 'secret-1')
    await user.click(screen.getByRole('button', { name: t('auth.action.login') }))

    await waitFor(() => expect(signIn).toHaveBeenCalledTimes(1))
    expect(signIn.mock.calls[0][0]).toMatchObject({ user_id: 'u1', access_token: 'access' })
    expect(await screen.findByText('收件箱')).toBeTruthy()
  })

  it('treats a missing verification_code_required as needing the code, like the engine does', async () => {
    stubTransport({}, entryConfig({ verification_code_required: undefined }))
    const user = userEvent.setup()
    renderLogin()
    await reachPasswordStep(user)

    /* 字段缺省时引擎按「需要」处理，登录这条通道也要把状态带成「需要口令」 */
    expect(useAuthStore.getState().needsCode).toBe(true)
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

  it('carries the client mode to the register form when the account does not exist', async () => {
    stubTransport({ '/user/entry/verify': { body: VERIFIED_REGISTER } })
    const user = userEvent.setup()
    /* 客户端内的来源标记读的是路由地址（`useAuthMode`），因此写在初始地址上 */
    renderLogin('/login?from=connect')
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'new@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))

    /* 客户端内的边界档跟着账号一起带过去，注册页据此走达标边界 */
    expect(await screen.findByText(/注册表单/)).toBeTruthy()
    expect(screen.getByText(/from=connect/)).toBeTruthy()
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

  it('uses a text account field, so a phone number passes the browser constraint check', async () => {
    stubTransport()
    renderLogin()
    const account = (await screen.findByLabelText(t('auth.field.account'))) as HTMLInputElement
    expect(account.type).toBe('text')
  })

  it('hands the authorization address to the face that navigates the current window', async () => {
    stubTransport(
      { '/user/oauth/google/authorize': { body: { authorization_url: 'https://accounts.example.com/auth' } } },
      entryConfig({
        third_party: { providers: [{ id: 'google', label: '谷歌', title: '使用谷歌账号登录', logo: '/assets/brands/google.svg' }] },
      }),
    )
    const user = userEvent.setup()
    renderLogin()
    await user.click(await screen.findByRole('button', { name: t('auth.provider.continueWith', { provider: '谷歌' }) }))

    /* 页面不自己判宿主，交给平台层的开外部地址面孔；跳转发生在当前窗口 */
    await waitFor(() => expect(openExternal).toHaveBeenCalledWith('https://accounts.example.com/auth'))
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
    renderLogin()

    /* 取失败要给失败态与重试，不能一直停在加载态 */
    expect(await screen.findByText(t('auth.configFailed'))).toBeTruthy()
    expect(screen.getByRole('button', { name: t('auth.retry') })).toBeTruthy()

    failing = false
    await user.click(screen.getByRole('button', { name: t('auth.retry') }))
    expect(await screen.findByLabelText(t('auth.field.account'))).toBeTruthy()
    expect(screen.queryByText(t('auth.configFailed'))).toBeNull()
  })

  it('treats a missing key set as a configuration failure when verification is on, and retries both', async () => {
    let keysFail = true
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      if (target.includes('/oauth/jwks')) {
        if (keysFail) return { ok: false as const, code: 'transport.network', params: {}, message: 'boom' }
        return json({ keys: [] })
      }
      if (target.includes('/user/entry')) return json(entryConfig({ secure_cookie: true }))
      return json({})
    })
    const user = userEvent.setup()
    renderLogin()

    /* 要验签却没有公钥集：按配置失败处理，不放人进去在最后一步才失败 */
    expect(await screen.findByText(t('auth.configFailed'))).toBeTruthy()
    keysFail = false
    await user.click(screen.getByRole('button', { name: t('auth.retry') }))
    expect(await screen.findByLabelText(t('auth.field.account'))).toBeTruthy()
  })

  it('wears the client chrome in the desktop client even without the marker, and carries it to register', async () => {
    stubTransport()
    client.capabilities.serviceAddress = true
    const user = userEvent.setup()
    try {
      const { container } = renderLogin()
      await screen.findByLabelText(t('auth.field.account'))

      /* 桌面用户不该看到 Web 的品牌区与页脚：地址上没有 `from` 也是客户端内形态 */
      expect(container.querySelector('.auth--in-app')).toBeTruthy()
      expect(screen.getByRole('link', { name: t('auth.footnote.link') }).getAttribute('href')).toContain('from=connect')

      /* 返回入口指向服务器选择页：开在登录页的历史里没有上一条，`history.back()` 会点不动 */
      await user.click(screen.getByRole('button', { name: t('auth.action.backToServers') }))
      expect(await screen.findByText('服务器选择页')).toBeTruthy()
    } finally {
      client.capabilities.serviceAddress = false
    }
  })

  it('keeps the back entry working while the entry configuration is still on its way', async () => {
    /* 配置一直不返回时页面停在加载占位；加载占位同样带着客户端栏，返回入口要能点 */
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      if (target.includes('/oauth/jwks')) return json({ keys: [] })
      if (target.includes('/user/entry')) return new Promise<never>(() => undefined)
      return json({})
    })
    client.capabilities.serviceAddress = true
    const user = userEvent.setup()
    try {
      renderLogin()
      expect(await screen.findByText(t('auth.login.loading'))).toBeTruthy()

      await user.click(screen.getByRole('button', { name: t('auth.action.backToServers') }))
      expect(await screen.findByText('服务器选择页')).toBeTruthy()
    } finally {
      client.capabilities.serviceAddress = false
    }
  })

  it('keeps the back entry working when the entry configuration failed', async () => {
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      if (target.includes('/oauth/jwks')) return json({ keys: [] })
      return { ok: false as const, code: 'transport.network', params: {}, message: 'boom' }
    })
    client.capabilities.serviceAddress = true
    const user = userEvent.setup()
    try {
      renderLogin()
      expect(await screen.findByText(t('auth.configFailed'))).toBeTruthy()

      await user.click(screen.getByRole('button', { name: t('auth.action.backToServers') }))
      expect(await screen.findByText('服务器选择页')).toBeTruthy()
    } finally {
      client.capabilities.serviceAddress = false
    }
  })

  it('asks for the captcha value before it judges, and closes the dialog without judging', async () => {
    stubTransport({}, entryConfig({ form: { ...entryConfig().form, captcha: { type: 'image' } } }))
    const user = userEvent.setup()
    renderLogin()
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'max@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
    await screen.findByPlaceholderText(t('auth.captcha.placeholder'))

    /* 空值直接「确定」：出字段提示，不发判定 */
    await user.click(screen.getByRole('button', { name: t('auth.action.confirm') }))
    expect(screen.getByText(t('auth.error.captchaRequired'))).toBeTruthy()
    expect(vi.mocked(transportFetch).mock.calls.some(([url]) => String(url).includes('/user/entry/verify'))).toBe(false)

    /* 从弹窗本身关掉（Esc）：回账号步，不判定 */
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByLabelText(t('auth.field.account'))).toBeTruthy()
  })

  it('drops a judgement that comes back after the dialog was closed', async () => {
    let release: (() => void) | undefined
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      if (target.includes('/oauth/jwks')) return json({ keys: [] })
      if (target.includes('/user/entry/captcha')) {
        return json({ captcha_id: 'captcha-1', captcha_image: 'data:image/gif;base64,R0lGOD' })
      }
      if (target.includes('/user/entry/verify')) {
        return new Promise((resolve) => {
          release = () => resolve(json(VERIFIED_LOGIN))
        })
      }
      if (target.includes('/user/entry')) {
        return json(entryConfig({ form: { ...entryConfig().form, captcha: { type: 'image' } } }))
      }
      return json({})
    })
    const user = userEvent.setup()
    renderLogin()
    await user.type(await screen.findByLabelText(t('auth.field.account')), 'max@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
    await user.type(await screen.findByPlaceholderText(t('auth.captcha.placeholder')), 'abcd')
    await user.click(screen.getByRole('button', { name: t('auth.action.confirm') }))

    /* 判定还在飞的时候把弹窗关掉：结果回来当作没验证过，页面不切密码步 */
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    /* 先把「请求确实发出去了」钉住，否则下面那条断言会在什么都没发时也通过 */
    expect(release).toBeDefined()
    release?.()
    await waitFor(() => expect(screen.queryByPlaceholderText('登录密码')).toBeNull())
  })

  it('asks for the password before it signs in', async () => {
    stubTransport()
    const user = userEvent.setup()
    renderLogin()
    await reachPasswordStep(user)

    await user.click(screen.getByRole('button', { name: t('auth.action.login') }))
    expect(screen.getByText(t('auth.error.passwordRequired'))).toBeTruthy()
    expect(vi.mocked(transportFetch).mock.calls.some(([url]) => String(url).includes('/user/entry/login'))).toBe(false)
  })

  it('moves to the invite step when signing in asks for a code', async () => {
    stubTransport({
      '/user/entry/login': { body: { status: 'invite_verification_required' } },
    })
    const user = userEvent.setup()
    renderLogin()
    await reachPasswordStep(user)
    await user.type(passwordBox(), 'secret-value')
    await user.click(screen.getByRole('button', { name: t('auth.action.login') }))

    /* 邀请码步留在页面上：空码按回车不发起兑换，填码后请求体带上所填的码 */
    const invite = await screen.findByPlaceholderText(t('auth.field.invite'))
    await user.keyboard('{Enter}')
    expect(
      vi.mocked(transportFetch).mock.calls.some(([, init]) => JSON.stringify(init?.body ?? '').includes('"code":""')),
    ).toBe(false)

    await user.type(invite, 'ABC123')
    await user.click(screen.getByRole('button', { name: t('auth.action.redeem') }))
    await waitFor(() => {
      const redeeming = vi.mocked(transportFetch).mock.calls.some(([, init]) =>
        JSON.stringify(init?.body ?? '').includes('ABC123'),
      )
      expect(redeeming).toBe(true)
    })
  })

  it('shows the failure of the invite step when the code is refused', async () => {
    stubTransport({
      '/user/entry/login': { body: { status: 'invite_verification_required', access_token: 'invite-token' } },
      '/user/entry/invite': { body: { error: 'invalid_request', error_description: 'nope' }, status: 400 },
    })
    const user = userEvent.setup()
    renderLogin()
    await reachPasswordStep(user)
    await user.type(passwordBox(), 'secret-value')
    await user.click(screen.getByRole('button', { name: t('auth.action.login') }))
    await user.type(await screen.findByPlaceholderText(t('auth.field.invite')), 'BAD-CODE')
    await user.click(screen.getByRole('button', { name: t('auth.action.redeem') }))

    /* 失败落在邀请码字段上，文案来自语言包 */
    const failure = await screen.findByText(t('data.error.invalidRequest'))
    expect(failure.textContent).not.toContain('nope')
  })

  it('shows the notice for choosing a team instead of finishing', async () => {
    stubTransport({ '/user/entry/login': { body: { status: 'team_selection_required', access_token: 'team-token' } } })
    const user = userEvent.setup()
    renderLogin()
    await reachPasswordStep(user)
    await user.type(passwordBox(), 'secret-value')
    await user.click(screen.getByRole('button', { name: t('auth.action.login') }))

    expect(await screen.findByText(t('auth.notice.team'))).toBeTruthy()
  })

  it('falls back to the language pack placeholders when the configuration does not carry them', async () => {
    stubTransport(
      {},
      entryConfig({ form: { captcha: { type: 'none' }, remember_me: false } }),
    )
    const user = userEvent.setup()
    renderLogin()

    const account = (await screen.findByLabelText(t('auth.field.account'))) as HTMLInputElement
    expect(account.placeholder).toBe(t('auth.field.account'))

    await user.type(account, 'max@example.com')
    await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
    const password = (await screen.findByPlaceholderText(t('auth.field.password'))) as HTMLInputElement
    expect(password.placeholder).toBe(t('auth.field.password'))
    /* 配置没有声明记住我时不渲染它 */
    expect(screen.queryByLabelText(t('auth.remember'))).toBeNull()
  })

  it('asks for the human verification token when it is still empty', async () => {
    /* 控件不给令牌（真实情况是还没完成人机验证）：点确定要落到人机验证那一条提示上 */
    const renderWidget = vi.fn(() => 'widget-1')
    ;(window as unknown as { turnstile?: unknown }).turnstile = { render: renderWidget, remove: vi.fn() }
    stubTransport(
      {},
      entryConfig({ form: { ...entryConfig().form, captcha: { type: 'turnstile', options: { sitekey: 'site-1' } } } }),
    )
    const user = userEvent.setup()
    try {
      renderLogin()
      await user.type(await screen.findByLabelText(t('auth.field.account')), 'max@example.com')
      await user.click(screen.getByRole('button', { name: t('auth.action.continue') }))
      await screen.findByRole('dialog')

      await user.click(screen.getByRole('button', { name: t('auth.action.confirm') }))
      expect(screen.getByText(t('auth.error.turnstileRequired'))).toBeTruthy()
      expect(vi.mocked(transportFetch).mock.calls.some(([url]) => String(url).includes('/user/entry/verify'))).toBe(false)
    } finally {
      delete (window as unknown as { turnstile?: unknown }).turnstile
    }
  })

  it('shows the failure of a third party entry when its address cannot be read', async () => {
    stubTransport(
      { '/user/oauth/google/authorize': { body: { error: 'invalid_request', error_description: 'nope' }, status: 400 } },
      entryConfig({
        third_party: { providers: [{ id: 'google', label: '谷歌', title: '使用谷歌账号登录', logo: '' }] },
      }),
    )
    const user = userEvent.setup()
    renderLogin()
    await user.click(await screen.findByRole('button', { name: t('auth.provider.continueWith', { provider: '谷歌' }) }))

    /* 第三方入口没有对应字段，失败按页面级提示呈现，且不跳转 */
    const notice = await screen.findByRole('alert')
    expect(notice.textContent).toContain(t('data.error.invalidRequest'))
    expect(notice.textContent).not.toContain('nope')
    expect(openExternal).not.toHaveBeenCalled()
  })
})
