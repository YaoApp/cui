/* 会话守卫与失效守卫：未登录带 `next` 去登录；401 事件清标记并送回登录页（不重放，只在渲染里跳）。 */
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/service', () => ({ serviceBase: vi.fn(() => '') }))
const signOut = vi.hoisted(() => vi.fn(async () => ({ ok: true as const, value: true })))
vi.mock('@/platform/credential', () => ({ signOut }))

import { emitUnauthorized } from '@/platform/transport/unauthorized'
import { readLanding, rememberLanding } from '@/features/auth/landing-record'
import { stashNext, takeNext } from '@/features/auth/next'
import { rememberSession, signedIn } from '@/features/auth/session-marker'
import { RequireSession, SessionExpiryGuard } from './session-guard'

function Product() {
  const location = useLocation()
  return <p>产品页 {location.pathname}</p>
}

function LoginProbe() {
  const location = useLocation()
  return <p>登录页 {location.search}</p>
}

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route element={<SessionExpiryGuard />}>
          <Route path="/login" element={<LoginProbe />} />
          <Route path="/welcome" element={<p>欢迎页</p>} />
          <Route element={<RequireSession />}>
            <Route path="/scaffold/base" element={<Product />} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('the session guard', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
    signOut.mockClear()
  })

  it('sends a machine with no mark to the sign-in page, carrying where it wanted to go', async () => {
    renderAt('/scaffold/base?q=alpha')
    expect((await screen.findByText(/登录页/)).textContent).toContain('next=%2Fscaffold%2Fbase%3Fq%3Dalpha')
  })

  it('lets a marked machine through', async () => {
    rememberSession()
    renderAt('/scaffold/base')
    expect(await screen.findByText('产品页 /scaffold/base')).toBeTruthy()
  })
})

describe('the expiry guard', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
    signOut.mockClear()
  })

  it('clears the mark and goes back to sign-in, remembering this address', async () => {
    rememberSession()
    rememberLanding('/scaffold/base')
    stashNext('/scaffold/base')
    renderAt('/scaffold/base?q=alpha')
    expect(await screen.findByText('产品页 /scaffold/base')).toBeTruthy()

    act(() => emitUnauthorized())

    await waitFor(() => {
      expect(screen.getByText(/登录页/).textContent).toContain('next=%2Fscaffold%2Fbase%3Fq%3Dalpha')
    })
    expect(signedIn()).toBe(false)
    expect(signOut).toHaveBeenCalled()
    /* 失效清掉的东西与退出登录同一处实现：落点与待去地址也不留 */
    expect(readLanding()).toBeUndefined()
    expect(takeNext()).toBeUndefined()
  })

  it('stays put when it is already on the sign-in page, and still clears the mark', async () => {
    rememberSession()
    renderAt('/login')
    expect(await screen.findByText(/登录页/)).toBeTruthy()

    act(() => emitUnauthorized())
    await waitFor(() => expect(signOut).toHaveBeenCalled())
    expect(screen.getByText(/登录页/).textContent).not.toContain('next=')
    expect(signedIn()).toBe(false)
  })

  it('takes a burst of failures as one trip', async () => {
    rememberSession()
    renderAt('/scaffold/base')
    expect(await screen.findByText('产品页 /scaffold/base')).toBeTruthy()

    act(() => {
      emitUnauthorized()
      emitUnauthorized()
      emitUnauthorized()
    })

    expect(await screen.findByText(/登录页/)).toBeTruthy()
    /* 闩锁：同一波只处置一次 */
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('goes back to sign-in without a destination when the address is a process page', async () => {
    rememberSession()
    renderAt('/welcome')
    expect(await screen.findByText('欢迎页')).toBeTruthy()

    act(() => emitUnauthorized())

    const line = await screen.findByText(/登录页/)
    expect(line.textContent).not.toContain('next=')
    expect(signedIn()).toBe(false)
  })
})
