/* **这一页的页面级用例**：钉住**调用点**的接线（不只是那些纯函数）。
 *
 * 为什么要有它们：复核者用变异证明过——把 `verify.tsx` 里的接线改回 `false`、或整节删掉，
 * 三条命令全绿。判定层有测试不够，**调用点**也得钉住。 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const SECRET = 's3cr3t-value-must-not-be-printed'
/* `vi.hoisted`：`vi.mock` 的工厂会被提到最上面，里面不能引用模块级常量（会撞 TDZ）。 */
const mocks = vi.hoisted(() => ({
  read: vi.fn(async (_service?: string) => ({ ok: true as const, value: 's3cr3t-value-must-not-be-printed' })),
  credentialKey: vi.fn((purpose: string): string | undefined => `http://localhost:5099#${purpose}`),
  write: vi.fn(async (_service?: string, _secret?: string) => ({ ok: true as const, value: true })),
  serviceGet: vi.fn(async () => ({ ok: true as const, value: { url: 'http://localhost:5099' } })),
  serviceSet: vi.fn(async (_url?: string) => ({ ok: true as const, value: { url: 'http://localhost:5099' } })),
}))

vi.mock('@/platform/credential', () => ({
  credentialKey: (purpose: string) => mocks.credentialKey(purpose),
  credential: {
    carrier: () => 'os-store',
    managedByApp: () => true,
    read: (service: string) => mocks.read(service),
    write: (service: string, secret: string) => mocks.write(service, secret),
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
      service: { get: mocks.serviceGet, set: mocks.serviceSet },
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

import { BridgePage } from './bridge'

describe('the verification page', () => {
  beforeEach(() => {
    mocks.read.mockClear()
    mocks.credentialKey.mockClear()
    mocks.credentialKey.mockImplementation((purpose: string) => `http://localhost:5099#${purpose}`)
  })

  it('never prints the secret it just read', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <BridgePage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /^(读|讀|Read|読み込み)$/ }))

    // 结果里出现"读到了"的占位，**而秘密一个字都不在页面上**
    await screen.findByText(/•••/)
    expect(document.body.textContent).not.toContain(SECRET)
    expect(mocks.read).toHaveBeenCalledOnce()
  })

  it('reads the service information when asked, and shows what it got', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <BridgePage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /^(读一次|讀一次|Read once|一度読む)$/ }))

    // 接线的证据：点了才读（一次），而且读回来的东西真上了屏
    await screen.findByText(/Yao Agents/)
    expect(loadServiceInfo).toHaveBeenCalledOnce()
    expect(loadServiceInfo).toHaveBeenCalledWith(10_000)
  })
  it('reads the held address, and hands a new one to the host for checking', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <BridgePage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /^(读当前地址|讀目前位址|Read the current address|現在のアドレスを読む)$/ }))
    await screen.findByText(/\{"url":"http:\/\/localhost:5099"\}/) // 读回来的地址（键那一行也含同样的字，所以指 JSON）

    await user.type(screen.getByRole('textbox', { name: /^(服务地址|服務位址|Service address|サービスアドレス)$/ }), 'localhost:5099')
    await user.click(screen.getByRole('button', { name: /^(校验并写入|驗證並寫入|Check and save|検証して保存)$/ }))
    await waitFor(() => expect(mocks.serviceSet).toHaveBeenCalledWith('localhost:5099'))
  })
  it('says why a credential cannot be written when there is no service address', async () => {
    mocks.credentialKey.mockReturnValue(undefined) // 还没选服务：没有键
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <BridgePage />
      </MemoryRouter>,
    )

    // 反馈：把原因说出来，而且写入按钮按不动 —— 空键不该发出去
    expect(await screen.findByText(/no key to store under|没有可存的键/)).toBeInTheDocument()
    const write = screen.getByRole('button', { name: /^(写|寫|Write|書き込み)$/ })
    expect(write).toBeDisabled()
    await user.click(write)
    expect(document.body.textContent).not.toContain('credential.write →')
  })
  it('writes a credential under the key the service address gives', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <BridgePage />
      </MemoryRouter>,
    )

    // 键就是 `<origin>#<用途>` —— 不是随手起的名字
    expect(screen.getByText('http://localhost:5099#session')).toBeInTheDocument()
    await user.type(screen.getByLabelText(/秘密|Secret|機密|シークレット/), 's3cret')
    await user.click(screen.getByRole('button', { name: /^(写|寫|Write|書き込み)$/ }))
    await waitFor(() => expect(mocks.write).toHaveBeenCalledWith('http://localhost:5099#session', 's3cret'))
  })
})