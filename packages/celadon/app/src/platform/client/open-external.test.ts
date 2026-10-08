import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/bridge', () => ({ system: { openBrowser: vi.fn() } }))
vi.mock('./capabilities', () => ({ capabilities: vi.fn() }))

import { system } from '@/platform/bridge'
import { capabilities, type Capabilities } from './capabilities'
import { openExternal } from './open-external'

const openBrowser = vi.mocked(system.openBrowser)
const caps = vi.mocked(capabilities)
/* 整页跳转在 jsdom 里不真的导航，因此按接缝换一个可观察的替身 */
const assign = vi.fn()

function shape(systemBrowser: boolean): Capabilities {
  return { clipboard: false, files: false, notifications: false, externalOpen: true, systemBrowser, serviceAddress: false }
}

describe('opening an external address', () => {
  beforeEach(() => {
    openBrowser.mockReset()
    caps.mockReset()
    assign.mockReset()
  })

  it('uses the host command when the client can hand the address to the system browser', async () => {
    caps.mockReturnValue(shape(true))
    openBrowser.mockResolvedValue({ ok: true, value: undefined })

    await openExternal('https://accounts.example.com/auth', assign)

    expect(openBrowser).toHaveBeenCalledWith('https://accounts.example.com/auth')
    expect(assign).not.toHaveBeenCalled()
  })

  it('falls back to a full page navigation when the host command fails', async () => {
    caps.mockReturnValue(shape(true))
    openBrowser.mockResolvedValue({ ok: false, code: 'bridge.rejected', params: {}, message: 'refused' })

    await openExternal('https://accounts.example.com/auth', assign)

    expect(assign).toHaveBeenCalledWith('https://accounts.example.com/auth')
  })

  it('navigates the page when the client cannot hand the address to the system browser', async () => {
    caps.mockReturnValue(shape(false))

    await openExternal('https://accounts.example.com/auth', assign)

    expect(openBrowser).not.toHaveBeenCalled()
    expect(assign).toHaveBeenCalledWith('https://accounts.example.com/auth')
  })
})
