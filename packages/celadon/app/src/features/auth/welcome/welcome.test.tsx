/* 欢迎页的用例：用户信息来自域状态，成功地址来自入口配置；只断言页面上看得见的东西。 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/transport/fetch', () => ({ transportFetch: vi.fn() }))

import { transportFetch } from '@/platform/transport/fetch'
import { i18n } from '@/platform/i18n'
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { useAuthStore } from '../auth.store'
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

function json(value: unknown, status = 200) {
  return { ok: true as const, value: new Response(JSON.stringify(value), { status }) }
}

function stubTransport(config: Record<string, unknown> = ENTRY_CONFIG) {
  vi.mocked(transportFetch).mockImplementation(async (url) => {
    const target = String(url)
    if (target.includes('/.well-known/yao')) return json(SERVICE)
    if (target.includes('/oauth/jwks')) return json({ keys: [] })
    if (target.includes('/user/entry')) return json(config)
    return json({})
  })
}

function renderWelcome() {
  return render(
    <MemoryRouter initialEntries={['/welcome']}>
      <AuthProvider>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<p>登录页</p>} />
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
    /* 域状态在 store 里，模块级单例，用例之间要复位 */
    useAuthStore.getState().reset()
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

  it('returns to the sign-in page when there is no session user', async () => {
    renderWelcome()

    expect(await screen.findByText('登录页')).toBeTruthy()
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
