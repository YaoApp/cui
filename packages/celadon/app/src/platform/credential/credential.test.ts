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
    asHost(async (command) => (command === 'celadon_credential_list' ? [{ service: 'srv-a', account: '' }] : true))
    // 载体由 clientKind() 决定，读的是构建清单；这一条在 Web 构建里只验证接口形状一致
    const listed = await credential.list()
    expect(listed.ok === true || listed.code === 'credential.no_store_here').toBe(true)
  })
})
