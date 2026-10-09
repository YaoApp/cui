/* 入口的两个守卫：根地址的判定（EntryGate）与桌面首次的选服务器（ServerGuard）。
   判定表的每一行在 `features/auth/entry.test.ts` 已经是纯函数用例，这里只核"接到路由上"这件事。 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/service', () => ({ needsServerChoice: vi.fn(() => false), serviceBase: vi.fn(() => '') }))

import { needsServerChoice } from '@/platform/service'
import { rememberLanding } from '@/features/auth/landing-record'
import { rememberSession } from '@/features/auth/session-marker'
import { EntryGate, ServerGuard } from './entry-gate'

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route element={<ServerGuard />}>
          <Route path="/servers" element={<p>服务器选择页</p>} />
          <Route path="/login" element={<p>登录页</p>} />
          <Route path="/welcome" element={<p>欢迎页</p>} />
          <Route path="/scaffold/base" element={<p>基础件清单</p>} />
          <Route path="/" element={<EntryGate />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('the entry decision on the route table', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
    vi.mocked(needsServerChoice).mockReturnValue(false)
  })

  it('sends a machine with no mark to the sign-in page', async () => {
    renderAt('/')
    expect(await screen.findByText('登录页')).toBeTruthy()
  })

  it('sends a signed-in machine with no landing to the welcome page', async () => {
    rememberSession()
    renderAt('/')
    expect(await screen.findByText('欢迎页')).toBeTruthy()
  })

  it('sends a signed-in machine to its last landing', async () => {
    rememberSession()
    rememberLanding('/scaffold/base?q=alpha')
    renderAt('/')
    expect(await screen.findByText('基础件清单')).toBeTruthy()
  })
})

describe('the server picker on the desktop', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
    rememberSession()
    vi.mocked(needsServerChoice).mockReturnValue(true)
  })

  it('takes any address to the server picker until one is chosen', async () => {
    renderAt('/scaffold/base')
    expect(await screen.findByText('服务器选择页')).toBeTruthy()
  })

  it('does not bounce when the picker itself is open', async () => {
    renderAt('/servers')
    expect(await screen.findByText('服务器选择页')).toBeTruthy()
  })
})
