import { afterEach, describe, expect, it, vi } from 'vitest'
import { carrierIsReadableByApp, credentialCarrier } from './carrier'
import { credential } from './index'

function asHost(invoke: (command: string, args?: Record<string, unknown>) => Promise<unknown>) {
  vi.stubGlobal('__TAURI_INTERNALS__', {})
  vi.stubGlobal('__TAURI__', { core: { invoke } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('credentialCarrier', () => {
  it('is chosen by the client, never by the caller', () => {
    expect(credentialCarrier()).toBe('web' === 'web' ? 'cookie' : 'cookie') // 浏览器里就是 cookie
    expect(carrierIsReadableByApp('cookie')).toBe(false)   // HttpOnly：JS 碰不到，这正是它的意义
    expect(carrierIsReadableByApp('os-store')).toBe(true)
  })
})

describe('credential', () => {
  it('says plainly that the browser carrier is not the application’s to manage', async () => {
    const results = await Promise.all([
      credential.read('srv-a'),
      credential.write('srv-a', 'x'),
      credential.remove('srv-a'),
      credential.list(),
    ])
    for (const result of results) {
      expect(result).toMatchObject({ ok: false, code: 'credential.no_store_here', params: { carrier: 'cookie' } })
    }
    expect(credential.managedByApp()).toBe(false)
  })

  it('on the desktop it is the same interface, backed by the host store', async () => {
    // **真换宿主**：不 mock 的话 clientKind() 恒为 web，这一段就是空跑（复核者点出来的假绿）
    vi.resetModules()
    vi.doMock('../client', () => ({ client: { kind: 'desktop' } }))
    const calls: string[] = []
    asHost(async (command) => {
      calls.push(command)
      return command === 'celadon_credential_list' ? [{ service: 'srv-a', account: '' }] : true
    })
    const { credential: desktopCredential } = await import('./index')
    expect(desktopCredential.carrier()).toBe('os-store')
    const listed = await desktopCredential.list()
    expect(listed).toMatchObject({ ok: true, value: [{ service: 'srv-a', account: '' }] })
    expect(calls).toContain('celadon_credential_list')   // 真走到了宿主
    vi.doUnmock('../client/manifest')
    vi.resetModules()
  })
})
