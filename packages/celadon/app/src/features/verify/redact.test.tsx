/* **页面级用例**：钉住"读到的秘密不许上屏"这条**接线**（不只是那个纯函数）。
 *
 * 为什么要有它：复核者用变异证明过——把 `verify.tsx` 里 `shouldRedact(label)` 改成 `false`，
 * 三条命令全绿。判定层（`redact.ts`）有测试不够，**调用点**也得钉住。 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const SECRET = 's3cr3t-value-must-not-be-printed'
const read = vi.fn(async () => ({ ok: true as const, value: SECRET }))

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

    await user.click(screen.getByRole('button', { name: /^(读|Read|読む)$/ }))

    // 结果里出现"读到了"的占位，**而秘密一个字都不在页面上**
    await screen.findByText(/•••/)
    expect(document.body.textContent).not.toContain(SECRET)
    expect(read).toHaveBeenCalledOnce()
  })
})
