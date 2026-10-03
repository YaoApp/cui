/* **这一页的页面级用例**：钉住**调用点**的接线（不只是那些纯函数）。
 *
 * 为什么要有它们：复核者用变异证明过——把 `verify.tsx` 里的接线改回 `false`、或整节删掉，
 * 三条命令全绿。判定层有测试不够，**调用点**也得钉住。 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const SECRET = 's3cr3t-value-must-not-be-printed'
const read = vi.fn(async (_service?: string) => ({ ok: true as const, value: SECRET }))

vi.mock('@/platform/credential', () => ({
  credential: {
    carrier: () => 'os-store',
    managedByApp: () => true,
    read: (service: string) => read(service),
    write: vi.fn(async () => ({ ok: true, value: true })),
    remove: vi.fn(async () => ({ ok: true, value: true })),
    list: vi.fn(async () => ({ ok: true, value: [] })),
  },
}))

vi.mock('@/platform/bridge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/platform/bridge')>()
  return {
    ...actual,
    bridge: {
      ping: vi.fn(async () => ({ ok: false, code: 'bridge.unavailable', params: {}, message: 'no host' })),
      credential: actual.bridge.credential,
      system: { machineId: vi.fn(async () => ({ ok: false, code: 'bridge.unavailable', params: {}, message: 'no host' })) },
    },
  }
})

const SERVICE = { name: 'Yao Agents', version: '1.0.0', openapi: '/v1' }
const loadServiceInfo = vi.fn(async (_timeoutMs?: number) => ({ ok: true as const, value: SERVICE }))

vi.mock('@/platform/service', () => ({
  loadServiceInfo: (timeoutMs?: number) => loadServiceInfo(timeoutMs),
  serviceBase: () => '',
}))

import { VerifyPage } from './verify'

describe('the verification page', () => {
  beforeEach(() => read.mockClear())

  it('never prints the secret it just read', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <VerifyPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /^(读|讀|Read|読み込み)$/ }))

    // 结果里出现"读到了"的占位，**而秘密一个字都不在页面上**
    await screen.findByText(/•••/)
    expect(document.body.textContent).not.toContain(SECRET)
    expect(read).toHaveBeenCalledOnce()
  })

  it('reads the service information when asked, and shows what it got', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <VerifyPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /^(读一次|讀一次|Read once|一度読む)$/ }))

    // 接线的证据：点了才读（一次），而且读回来的东西真上了屏
    await screen.findByText(/Yao Agents/)
    expect(loadServiceInfo).toHaveBeenCalledOnce()
    expect(loadServiceInfo).toHaveBeenCalledWith(10_000)
  })
})
