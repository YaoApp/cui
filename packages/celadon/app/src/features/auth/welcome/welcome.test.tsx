/* 欢迎页的用例：用户信息来自登录那一刻的响应或一次资料取数，成功地址来自入口配置；
   只断言页面上看得见的东西。 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/transport/fetch', () => ({ transportFetch: vi.fn() }))

import { transportFetch } from '@/platform/transport/fetch'
import { i18n } from '@/platform/i18n'
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { useAuthStore } from '../auth.store'
import { rememberSession, signedIn } from '../session-marker'
import { WelcomePage } from './welcome'

const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key as never, options as unknown as never) as unknown as string

const SERVICE = { name: 'Yao Dev', version: '1.0.0', openapi: '/v1' }

const ENTRY_CONFIG = {
  title: '欢迎使用 Yao Agents',
  description: '请输入邮箱以继续',
  success_url: '/done',
  form: { captcha: { type: 'none' } },
  verification_code_required: false,
  third_party: { providers: [] },
  secure_cookie: false,
}

/** `GET /user/profile` 的实测形状（1 号实例）。 */
const PROFILE = {
  'yao:user_id': '853296684128',
  sub: '3694776944429602',
  name: 'Wren',
  email: 'max@example.com',
}

function json(value: unknown, status = 200) {
  return { ok: true as const, value: new Response(JSON.stringify(value), { status }) }
}

function stubTransport(config: Record<string, unknown> = ENTRY_CONFIG) {
  vi.mocked(transportFetch).mockImplementation(async (url) => {
    const target = String(url)
    if (target.includes('/.well-known/yao')) return json(SERVICE)
    if (target.includes('/oauth/jwks')) return json({ keys: [] })
    if (target.includes('/user/entry')) return json(config)
    if (target.includes('/user/profile')) return json(PROFILE)
    if (target.includes('/user/logout')) return json({ message: 'Logout successful' })
    return json({})
  })
}

function renderWelcome(entry = '/welcome') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<p>登录页</p>} />
          <Route path="/servers" element={<p>服务器选择页</p>} />
          <Route path="/done" element={<p>已到达成功地址</p>} />
          <Route path="/" element={<p>应用首页</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('the welcome page', () => {
  beforeEach(() => {
    vi.mocked(transportFetch).mockReset()
    /* 域状态在 store 里，模块级单例，用例之间要复位；本机标记同理（守卫看它） */
    useAuthStore.getState().reset()
    globalThis.localStorage.clear()
    rememberSession()
    stubTransport()
  })

  it('shows the user information the session carries', async () => {
    useAuthStore.getState().setUser({
      userId: 'u-1',
      account: 'max@example.com',
      name: 'Wren',
      email: 'max@example.com',
    })
    renderWelcome()

    expect(await screen.findByText('u-1')).toBeTruthy()
    expect(screen.getByText(t('auth.welcome.userId'))).toBeTruthy()
    expect(screen.getByText('Wren')).toBeTruthy()
    expect(screen.getByText(t('auth.welcome.email'))).toBeTruthy()
  })

  it('leaves out the rows the session does not carry', async () => {
    useAuthStore.getState().setUser({ userId: 'u-2' })
    renderWelcome()

    expect(await screen.findByText('u-2')).toBeTruthy()
    expect(screen.queryByText(t('auth.welcome.email'))).toBeNull()
    expect(screen.queryByText(t('auth.welcome.name'))).toBeNull()
  })

  it('returns to the sign-in page when this machine has no sign-in mark', async () => {
    globalThis.localStorage.clear()
    renderWelcome()

    expect(await screen.findByText('登录页')).toBeTruthy()
  })

  it('stays usable after a reload: no in-memory user, but the mark is there', async () => {
    renderWelcome()

    expect(await screen.findByText(t('auth.welcome.lead'))).toBeTruthy()
    expect(await screen.findByRole('button', { name: t('auth.welcome.continue') })).toBeTruthy()
  })

  it('fills the empty table from the profile fetch, showing the identity first', async () => {
    renderWelcome()

    expect(await screen.findByText('853296684128')).toBeTruthy()
    expect(screen.getByText('Wren')).toBeTruthy()
    expect(screen.getByText('max@example.com')).toBeTruthy()
    expect(screen.getByText(t('auth.welcome.userId'))).toBeTruthy()
  })

  it('does not draw an empty table when nothing is displayable', async () => {
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      if (target.includes('/oauth/jwks')) return json({ keys: [] })
      if (target.includes('/user/entry')) return json(ENTRY_CONFIG)
      if (target.includes('/user/profile')) return json({})
      return json({})
    })
    renderWelcome()

    expect(await screen.findByText(t('auth.welcome.lead'))).toBeTruthy()
    await waitFor(() => expect(screen.queryByText(t('auth.welcome.userId'))).toBeNull())
    expect(document.querySelector('.welcome__info')).toBeNull()
  })

  it('says why it could not fetch the profile, and lets the fetch be retried', async () => {
    let attempts = 0
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      if (target.includes('/oauth/jwks')) return json({ keys: [] })
      if (target.includes('/user/entry')) return json(ENTRY_CONFIG)
      if (target.includes('/user/profile')) {
        attempts += 1
        if (attempts === 1) return { ok: false as const, code: 'transport.network', params: {}, message: 'down' }
        return json(PROFILE)
      }
      return json({})
    })
    const user = userEvent.setup()
    renderWelcome()

    /* 失败按码翻译后上屏，文案由语言包给；这里只核"有提示、能重试、重试真的再取一次" */
    const alert = await screen.findByRole('alert')
    expect((alert.textContent ?? '').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: t('auth.action.retry') }))
    expect(await screen.findByText('853296684128')).toBeTruthy()
  })

  it('follows the success address when the user continues', async () => {
    useAuthStore.getState().setUser({ userId: 'u-3' })
    const user = userEvent.setup()
    renderWelcome()

    const button = await screen.findByRole('button', { name: t('auth.welcome.continue') })
    /* 成功地址来自入口配置：配置到位之前按钮不可点，避免走进空地址 */
    await waitFor(() => expect(button).toBeEnabled())
    await user.click(button)

    expect(await screen.findByText('已到达成功地址')).toBeTruthy()
  })

  it('goes to the app home when the configuration names no success address', async () => {
    stubTransport({ ...ENTRY_CONFIG, success_url: undefined })
    useAuthStore.getState().setUser({ userId: 'u-4' })
    const user = userEvent.setup()
    renderWelcome()

    const button = await screen.findByRole('button', { name: t('auth.welcome.continue') })
    await waitFor(() => expect(button).toBeEnabled())
    await user.click(button)

    expect(await screen.findByText('应用首页')).toBeTruthy()
  })

  it('keeps a way back to the server picker in the client', async () => {
    useAuthStore.getState().setUser({ userId: 'u-6' })
    const user = userEvent.setup()
    /* 客户端内形态才有那条返回服务器列表的入口（`from` 是原型的预览标记） */
    renderWelcome('/welcome?from=connect')

    await user.click(await screen.findByRole('button', { name: t('auth.action.backToServers') }))
    expect(await screen.findByText('服务器选择页')).toBeTruthy()
  })

  it('keeps a way out when the configuration cannot be fetched', async () => {
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      return { ok: false as const, code: 'transport.http', params: {}, message: 'boom' }
    })
    useAuthStore.getState().setUser({ userId: 'u-5' })
    const user = userEvent.setup()
    renderWelcome()

    const button = await screen.findByRole('button', { name: t('auth.welcome.continue') })
    await waitFor(() => expect(button).toBeEnabled())
    await user.click(button)

    expect(await screen.findByText('应用首页')).toBeTruthy()
  })
})

describe('signing out from the welcome page', () => {
  beforeEach(() => {
    vi.mocked(transportFetch).mockReset()
    useAuthStore.getState().reset()
    globalThis.localStorage.clear()
    rememberSession()
    stubTransport()
  })

  it('revokes on the server, forgets this machine and goes to the sign-in page', async () => {
    useAuthStore.getState().setUser({ userId: 'u-7' })
    const user = userEvent.setup()
    renderWelcome()

    await user.click(await screen.findByRole('button', { name: t('auth.action.signOut') }))

    expect(await screen.findByText('登录页')).toBeTruthy()
    expect(signedIn()).toBe(false)
    expect(useAuthStore.getState().user).toBeUndefined()
    const called = vi.mocked(transportFetch).mock.calls.map((call) => String(call[0]))
    expect(called.some((url) => url.includes('/user/logout'))).toBe(true)
  })

  it('stays signed in and says why when the server refuses to revoke', async () => {
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/.well-known/yao')) return json(SERVICE)
      if (target.includes('/oauth/jwks')) return json({ keys: [] })
      if (target.includes('/user/entry')) return json(ENTRY_CONFIG)
      if (target.includes('/user/logout')) {
        return { ok: false as const, code: 'transport.status', params: { status: 500 }, message: 'boom' }
      }
      return json({})
    })
    useAuthStore.getState().setUser({ userId: 'u-8' })
    const user = userEvent.setup()
    renderWelcome()

    await user.click(await screen.findByRole('button', { name: t('auth.action.signOut') }))

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(signedIn()).toBe(true)
    expect(screen.queryByText('登录页')).toBeNull()
  })
})
