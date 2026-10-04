import { afterEach, describe, expect, it, vi } from 'vitest'
import { capabilities } from './capabilities'

/* 能力开关**是唯一的分支点**：Web 下靠特性探测，桌面下宿主提供。 */
afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('capabilities', () => {
  it('detects capabilities by feature in a browser', () => {
    vi.stubGlobal('isSecureContext', true)
    expect(capabilities()).toEqual({
      clipboard: 'clipboard' in navigator,
      files: false,
      notifications: false,
      externalOpen: true,
        serviceAddress: false,
    })
  })

  it('trusts the host on the desktop', async () => {
    vi.doMock('./manifest', () => ({ clientKind: () => 'desktop', buildManifest: () => ({}), targetOs: () => 'macos' }))
    const { capabilities: desktopCapabilities } = await import('./capabilities')
    expect(desktopCapabilities()).toEqual({ clipboard: true, files: true, notifications: true, externalOpen: true, serviceAddress: true })
    vi.doUnmock('./manifest')
  })
})
