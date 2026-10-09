/* 服务端数据的提升共享（入口配置与验签公钥）与成功之后的收尾（采纳会话与跳转）。
   接口走假出口，判定的是可见结果、传给 `signIn` 的响应体与写进域状态的用户信息。 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/transport/fetch', () => ({ transportFetch: vi.fn() }))
/* 只换掉基址这一处，`serviceUrl` 等仍用真实现：入口配置的地址要照常拼得出来 */
vi.mock('@/platform/service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/platform/service')>()
  return { ...actual, serviceBase: vi.fn(() => '') }
})
const signIn = vi.hoisted(() =>
  vi.fn(
    async (
      _payload: unknown,
    ): Promise<{ ok: true; value: boolean } | { ok: false; code: string; params: Record<string, unknown>; message: string }> => ({
      ok: true,
      value: true,
    }),
  ),
)
vi.mock('@/platform/credential', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/platform/credential')>()
  return { ...actual, signIn }
})
const verifyIdToken = vi.hoisted(() =>
  vi.fn(
    async (
      _token?: string,
      _keys?: unknown,
    ): Promise<{ ok: true; payload: Record<string, unknown> } | { ok: false; reason: string }> => ({
      ok: false,
      reason: 'malformed',
    }),
  ),
)
vi.mock('@/features/auth/id-token', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth/id-token')>()
  return { ...actual, verifyIdToken }
})

import { transportFetch } from '@/platform/transport/fetch'
import { serviceBase } from '@/platform/service'
import { i18n } from '@/platform/i18n'
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { useAuthStore } from '@/features/auth/auth.store'
import { useAuth } from '@/features/auth/use-auth'
import { useCompleteSignIn } from '@/features/auth/use-complete-sign-in'
import { stashNext } from '@/features/auth/next'
import { readServers } from '@/features/auth/server-history'
import type { EntryAuthResponse } from '@/data/user'

const SERVICE = { name: 'Yao Dev', version: '1.0.0', openapi: '/v1' }
const CONFIG = {
  title: '欢迎',
  description: '请输入邮箱',
  success_url: '/done',
  form: { username: { placeholder: '邮箱' }, password: { placeholder: '密码' }, captcha: { type: 'none' } },
  secure_cookie: false,
}
const SIGNED_IN: EntryAuthResponse = { user_id: 'u1', access_token: 'access', status: 'ok' }

/** 把提升共享的配置与收尾动作画成可点的探针。 */
function Probe({ response = SIGNED_IN }: { response?: EntryAuthResponse }) {
  const auth = useAuth()
  const complete = useCompleteSignIn()
  return (
    <div>
      <p data-testid="title">{auth.config?.title ?? '取回中'}</p>
      <button type="button" onClick={() => void complete(response)}>
        complete
      </button>
    </div>
  )
}

function renderProbe(response?: EntryAuthResponse, entry = '/login') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Probe response={response} />} />
          {/* 登录成功的第一站是欢迎页；成功地址由欢迎页自己接着走 */}
          <Route path="/welcome" element={<p>欢迎页</p>} />
          <Route path="/done" element={<p>已到达成功地址</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('the auth provider', () => {
  beforeEach(() => {
    vi.mocked(transportFetch).mockReset()
    signIn.mockReset()
    signIn.mockResolvedValue({ ok: true, value: true })
    verifyIdToken.mockReset()
    useAuthStore.getState().reset()
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      const body = target.includes('/.well-known/yao') ? SERVICE : target.includes('/oauth/jwks') ? { keys: [] } : CONFIG
      return { ok: true as const, value: new Response(JSON.stringify(body), { status: 200 }) }
    })
  })

  it('shares the entry configuration it fetched through the data layer', async () => {
    renderProbe()
    expect(await screen.findByTestId('title')).toHaveProperty('textContent', '欢迎')
  })

  it('adopts the session and lands on the welcome page', async () => {
    const user = userEvent.setup()
    renderProbe()
    await user.click(screen.getByRole('button', { name: 'complete' }))
    await waitFor(() => expect(signIn).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'u1' })))
    expect(await screen.findByText('欢迎页')).toBeTruthy()
  })

  it('goes to the address the link asked for when the URL names one', async () => {
    const user = userEvent.setup()
    renderProbe(undefined, '/login?next=%2Fdone')
    await user.click(screen.getByRole('button', { name: 'complete' }))
    expect(await screen.findByText('已到达成功地址')).toBeTruthy()
  })

  it('goes to the stashed address after a third-party round trip', async () => {
    stashNext('/done')
    const user = userEvent.setup()
    renderProbe()
    await user.click(screen.getByRole('button', { name: 'complete' }))
    expect(await screen.findByText('已到达成功地址')).toBeTruthy()
  })

  it('remembers the server it signed in to when the platform has a base', async () => {
    vi.mocked(serviceBase).mockReturnValue('http://one.example:15099')
    const user = userEvent.setup()
    renderProbe()
    await user.click(screen.getByRole('button', { name: 'complete' }))
    await waitFor(() => expect(readServers().map((entry) => entry.url)).toContain('http://one.example:15099'))
    vi.mocked(serviceBase).mockReturnValue('')
  })

  it('keeps the claims of a verified id token as the user to show', async () => {
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      const body = target.includes('/.well-known/yao')
        ? SERVICE
        : target.includes('/oauth/jwks')
          ? { keys: [{ kty: 'RSA', kid: 'k1' }] }
          : { ...CONFIG, secure_cookie: true }
      return { ok: true as const, value: new Response(JSON.stringify(body), { status: 200 }) }
    })
    verifyIdToken.mockResolvedValue({ ok: true, payload: { name: 'Wren', email: 'max@example.com' } })

    const user = userEvent.setup()
    renderProbe({ user_id: 'u9', id_token: 'signed-token', access_token: 'access', status: 'ok' })
    await user.click(screen.getByRole('button', { name: 'complete' }))

    await waitFor(() => expect(verifyIdToken).toHaveBeenCalled())
    expect(useAuthStore.getState().user).toMatchObject({ userId: 'u9', name: 'Wren', email: 'max@example.com' })
  })

  it('keeps the user on the page and says why when the id token does not verify', async () => {
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      const body = target.includes('/.well-known/yao')
        ? SERVICE
        : target.includes('/oauth/jwks')
          ? { keys: [{ kty: 'RSA', kid: 'k1' }] }
          : { ...CONFIG, secure_cookie: true }
      return { ok: true as const, value: new Response(JSON.stringify(body), { status: 200 }) }
    })
    verifyIdToken.mockResolvedValue({ ok: false, reason: 'bad_signature' })

    const user = userEvent.setup()
    renderProbe({ user_id: 'u9', id_token: 'signed-token', access_token: 'access', status: 'ok' })
    await user.click(screen.getByRole('button', { name: 'complete' }))

    await waitFor(() => expect(useAuthStore.getState().notice?.text).toBe(i18n.t('auth.error.idToken' as never)))
    expect(screen.queryByText('欢迎页')).toBeNull()
    expect(useAuthStore.getState().user).toBeUndefined()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('keeps the user on the page and says why when the session cannot be adopted', async () => {
    signIn.mockResolvedValueOnce({ ok: false, code: 'session', params: {}, message: 'nope' })

    const user = userEvent.setup()
    renderProbe()
    await user.click(screen.getByRole('button', { name: 'complete' }))

    await waitFor(() => expect(useAuthStore.getState().notice?.text).toBe(i18n.t('auth.error.session' as never)))
    expect(screen.queryByText('欢迎页')).toBeNull()
    expect(useAuthStore.getState().user).toBeUndefined()
  })

  it('refuses to be used outside the provider', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => render(<Probe />)).toThrow('useAuthConfig must be called inside AuthProvider')
    consoleError.mockRestore()
  })
})
