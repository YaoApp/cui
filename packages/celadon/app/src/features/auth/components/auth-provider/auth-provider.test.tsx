/* 服务端数据的提升共享（入口配置与验签公钥）与成功之后的收尾（采纳会话与跳转）。
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
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { useAuth } from '@/features/auth/use-auth'
import { useCompleteSignIn } from '@/features/auth/use-complete-sign-in'

const SERVICE = { name: 'Yao Dev', version: '1.0.0', openapi: '/v1' }
const CONFIG = {
  title: '欢迎',
  description: '请输入邮箱',
  success_url: '/done',
  form: { username: { placeholder: '邮箱' }, password: { placeholder: '密码' }, captcha: { type: 'none' } },
  secure_cookie: false,
}

/** 把提升共享的配置与收尾动作画成可点的探针。 */
function Probe() {
  const auth = useAuth()
  const complete = useCompleteSignIn()
  return (
    <div>
      <p data-testid="title">{auth.config?.title ?? '取回中'}</p>
      <button type="button" onClick={() => void complete({ user_id: 'u1', access_token: 'access', status: 'ok' })}>
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

  it('shares the entry configuration it fetched through the data layer', async () => {
    renderProbe()
    expect(await screen.findByTestId('title')).toHaveProperty('textContent', '欢迎')
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
    expect(() => render(<Probe />)).toThrow('useAuthConfig must be called inside AuthProvider')
    consoleError.mockRestore()
  })
})
