/* 域状态：三步之间的流转、临时令牌的收发，以及成功之后的收尾（采纳会话与跳转）。
   接口走假出口，判定的是可见结果与传给 `signIn` 的响应体。 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/transport/fetch', () => ({ transportFetch: vi.fn() }))
const signIn = vi.hoisted(() => vi.fn(async () => ({ ok: true as const, value: true })))
vi.mock('@/platform/credential', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/platform/credential')>()
  return { ...actual, signIn }
})

import { transportFetch } from '@/platform/transport/fetch'
import { AuthProvider, useAuth } from '@/features/auth/components/auth-provider'

const SERVICE = { name: 'Yao Dev', version: '1.0.0', openapi: '/v1' }
const CONFIG = {
  title: '欢迎',
  description: '请输入邮箱',
  success_url: '/done',
  form: { username: { placeholder: '邮箱' }, password: { placeholder: '密码' }, captcha: { type: 'none' } },
  secure_cookie: false,
}

/** 把域状态画成可点的探针，用例按可见文字判定流转。 */
function Probe() {
  const auth = useAuth()
  return (
    <div>
      <p data-testid="phase">{auth.phase}</p>
      <p data-testid="token">{auth.tempToken}</p>
      <p data-testid="status">{auth.verifyStatus ?? '-'}</p>
      <button type="button" onClick={() => auth.enterPassword({ tempToken: 'temp-1', status: 'register', otpId: 'otp-9', needsCode: true })}>
        enter
      </button>
      <button type="button" onClick={() => auth.enterInvite('temp-2')}>
        invite
      </button>
      <button type="button" onClick={() => auth.changeAccount()}>
        change
      </button>
      <button type="button" onClick={() => void auth.complete({ user_id: 'u1', access_token: 'access', status: 'ok' })}>
        complete
      </button>
    </div>
  )
}

function renderProbe() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Probe />} />
          <Route path="/done" element={<p>已到达成功地址</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('the auth provider', () => {
  beforeEach(() => {
    vi.mocked(transportFetch).mockReset()
    signIn.mockClear()
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      const target = String(url)
      const body = target.includes('/.well-known/yao') ? SERVICE : target.includes('/oauth/jwks') ? { keys: [] } : CONFIG
      return { ok: true as const, value: new Response(JSON.stringify(body), { status: 200 }) }
    })
  })

  it('starts on the account step with nothing carried over', async () => {
    renderProbe()
    expect(await screen.findByTestId('phase')).toHaveProperty('textContent', 'account')
    expect(screen.getByTestId('token').textContent).toBe('')
    expect(screen.getByTestId('status').textContent).toBe('-')
  })

  it('carries the temporary token, the verdict and the code id into the password step', async () => {
    const user = userEvent.setup()
    renderProbe()
    await user.click(screen.getByRole('button', { name: 'enter' }))
    expect(screen.getByTestId('phase').textContent).toBe('password')
    expect(screen.getByTestId('token').textContent).toBe('temp-1')
    expect(screen.getByTestId('status').textContent).toBe('register')
  })

  it('replaces the temporary token when the invitation step starts', async () => {
    const user = userEvent.setup()
    renderProbe()
    await user.click(screen.getByRole('button', { name: 'enter' }))
    await user.click(screen.getByRole('button', { name: 'invite' }))
    expect(screen.getByTestId('phase').textContent).toBe('invite')
    expect(screen.getByTestId('token').textContent).toBe('temp-2')
  })

  it('clears the verdict and the token when going back to the account step', async () => {
    const user = userEvent.setup()
    renderProbe()
    await user.click(screen.getByRole('button', { name: 'enter' }))
    await user.click(screen.getByRole('button', { name: 'change' }))
    expect(screen.getByTestId('phase').textContent).toBe('account')
    expect(screen.getByTestId('token').textContent).toBe('')
    expect(screen.getByTestId('status').textContent).toBe('-')
  })

  it('adopts the session and lands on the success address', async () => {
    const user = userEvent.setup()
    renderProbe()
    await user.click(screen.getByRole('button', { name: 'complete' }))
    await waitFor(() => expect(signIn).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'u1' })))
    expect(await screen.findByText('已到达成功地址')).toBeTruthy()
  })

  it('refuses to be used outside the provider', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => render(<Probe />)).toThrow('useAuth must be called inside AuthProvider')
    consoleError.mockRestore()
  })
})
