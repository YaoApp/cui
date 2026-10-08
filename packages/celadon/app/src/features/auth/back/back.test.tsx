/* 第三方登录回跳页的用例：接口走假出口，判定页面上看得见的东西（状态文案、错误、跳转结果）。
   地址参数由路由带进来，请求只用一次，因此用例覆盖「参数不全」「提供方拒绝」「接口失败」与两条分支去向。 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/transport/fetch', () => ({ transportFetch: vi.fn() }))
const signIn = vi.hoisted(() =>
  vi.fn(
    async (
      _payload: Record<string, unknown>,
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

import { transportFetch } from '@/platform/transport/fetch'
import { i18n } from '@/platform/i18n'
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { useAuthStore } from '../auth.store'
import { BackPage } from './back'

const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key as never, options as unknown as never) as unknown as string

const SERVICE = { name: 'Yao Dev', version: '1.0.0', openapi: '/v1' }

function entryConfig(overrides: Record<string, unknown> = {}) {
  return {
    title: '欢迎使用 Yao Agents',
    description: '请输入邮箱以继续',
    success_url: '/done',
    form: { username: { placeholder: '请输入邮箱', fields: ['email'] }, captcha: { type: 'none' } },
    verification_code_required: false,
    third_party: { providers: [{ id: 'test', label: '测试登录', title: '测试登录' }] },
    secure_cookie: false,
    ...overrides,
  }
}

function json(value: unknown, status = 200) {
  return { ok: true as const, value: new Response(JSON.stringify(value), { status }) }
}

function stubTransport(overrides: Record<string, { body: unknown; status?: number }> = {}, config = entryConfig()) {
  vi.mocked(transportFetch).mockImplementation(async (url) => {
    const target = String(url)
    for (const [fragment, value] of Object.entries(overrides)) {
      if (target.includes(fragment)) return json(value.body, value.status ?? 200)
    }
    if (target.includes('/.well-known/yao')) return json(SERVICE)
    if (target.includes('/oauth/jwks')) return json({ keys: [] })
    if (target.includes('/user/oauth/test/callback')) {
      return json({ status: 'ok', user_id: 'u1', access_token: 'access', refresh_token: 'refresh' })
    }
    if (target.includes('/user/entry')) return json(config)
    return json({})
  })
}

function Probe({ label }: { label: string }) {
  const location = useLocation()
  return <p>{`${label} ${location.pathname}`}</p>
}

function renderBack(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <Routes>
          <Route path="/auth/back/:provider" element={<BackPage />} />
          <Route path="/login" element={<Probe label="到达登录页" />} />
          <Route path="/done" element={<Probe label="到达成功地址" />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

/** 回跳接口收到的请求体（只有一条这样的请求）。 */
function callbackBody(): Record<string, unknown> | undefined {
  const call = vi.mocked(transportFetch).mock.calls.find(([url]) => String(url).includes('/user/oauth/test/callback'))
  if (!call) return undefined
  return JSON.parse(String((call[1] as RequestInit | undefined)?.body ?? '{}')) as Record<string, unknown>
}

describe('the third-party sign-in callback page', () => {
  beforeEach(() => {
    vi.mocked(transportFetch).mockReset()
    signIn.mockClear()
    useAuthStore.getState().reset()
  })

  it('exchanges the code and state, adopts the session and goes to the success address', async () => {
    stubTransport()
    renderBack('/auth/back/test?code=code-1&state=state-1')
    expect(await screen.findByText(/到达成功地址/)).toBeTruthy()
    expect(callbackBody()).toMatchObject({ code: 'code-1', state: 'state-1' })
    expect(signIn).toHaveBeenCalledTimes(1)
  })

  it('sends the user back to the sign-in page when an invite code is still required', async () => {
    stubTransport({
      '/user/oauth/test/callback': { body: { status: 'invite_verification_required', access_token: 'temp-invite' } },
    })
    renderBack('/auth/back/test?code=code-2&state=state-2')
    expect(await screen.findByText(/到达登录页/)).toBeTruthy()
    expect(useAuthStore.getState().phase).toBe('invite')
    expect(useAuthStore.getState().tempToken).toBe('temp-invite')
    expect(signIn).not.toHaveBeenCalled()
  })

  it('keeps the token the flow already holds when the response brings none', async () => {
    /* 邀请码分支的令牌优先取回应里的；回应没带就退回流程里已有的那一枚 */
    useAuthStore.getState().enterInvite('temp-earlier')
    stubTransport({ '/user/oauth/test/callback': { body: { status: 'invite_required' } } })
    renderBack('/auth/back/test?code=code-21&state=state-21')
    expect(await screen.findByText(/到达登录页/)).toBeTruthy()
    expect(useAuthStore.getState().tempToken).toBe('temp-earlier')
  })

  it('carries the multi-factor note back to the sign-in page', async () => {
    stubTransport({ '/user/oauth/test/callback': { body: { status: 'mfa_required' } } })
    renderBack('/auth/back/test?code=code-22&state=state-22')
    expect(await screen.findByText(/到达登录页/)).toBeTruthy()
    expect(useAuthStore.getState().notice?.text).toBe(t('auth.notice.mfa'))
  })

  it('carries the team-selection note back to the sign-in page', async () => {
    stubTransport({ '/user/oauth/test/callback': { body: { status: 'team_selection_required' } } })
    renderBack('/auth/back/test?code=code-23&state=state-23')
    expect(await screen.findByText(/到达登录页/)).toBeTruthy()
    expect(useAuthStore.getState().notice?.text).toBe(t('auth.notice.team'))
  })

  it('shows the session note when adopting the session fails', async () => {
    signIn.mockResolvedValueOnce({ ok: false, code: 'session', params: {}, message: 'nope' })
    stubTransport()
    renderBack('/auth/back/test?code=code-24&state=state-24')
    expect(await screen.findByRole('alert')).toHaveTextContent(t('auth.error.session'))
  })

  it('stays on the page with the success line when the configuration names no success address', async () => {
    stubTransport({}, entryConfig({ success_url: '' }))
    renderBack('/auth/back/test?code=code-25&state=state-25')
    expect(await screen.findByText(t('auth.back.success'))).toBeTruthy()
    expect(signIn).toHaveBeenCalledTimes(1)
  })

  it('shows the reason given by the provider and does not call the callback', async () => {
    stubTransport()
    renderBack('/auth/back/test?error=access_denied&error_description=The%20user%20denied')
    expect(await screen.findByText('The user denied')).toBeTruthy()
    expect(callbackBody()).toBeUndefined()
  })

  it('names the missing parameters instead of calling the callback', async () => {
    stubTransport()
    renderBack('/auth/back/test?code=code-3')
    expect(await screen.findByText(t('auth.back.missing'))).toBeTruthy()
    expect(callbackBody()).toBeUndefined()
  })

  it('stops at the page with an alert when the callback fails', async () => {
    stubTransport({ '/user/oauth/test/callback': { body: { error: 'invalid_grant' }, status: 400 } })
    renderBack('/auth/back/test?code=code-4&state=state-4')
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(signIn).not.toHaveBeenCalled()
  })
})
