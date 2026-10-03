import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clientId, newClientId, primeClientId, randomId } from './client-id'

/* 关键回归：**非安全上下文**（局域网 http）里没有 `crypto.randomUUID` —— 实测整页白屏。 */

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

beforeEach(() => {
  localStorage.clear()
})

describe('clientId', () => {
  it('works without crypto.randomUUID, which a non-secure context does not have', () => {
    vi.stubGlobal('crypto', { getRandomValues: (array: Uint8Array) => array.fill(7) })
    expect(() => clientId()).not.toThrow()
  })

  it('still produces an id when there is no WebCrypto at all', () => {
    vi.stubGlobal('crypto', undefined)
    expect(randomId(8)).toHaveLength(8)
    expect(clientId()).toMatch(/^web-/)
  })

  it('carries the source as a prefix', () => {
    vi.stubGlobal('crypto', { getRandomValues: (array: Uint8Array) => array.fill(3) })
    expect(newClientId()).toMatch(/^web-/)
  })

  it('does not change within the same installation', () => {
    expect(clientId()).toBe(clientId())
    expect(localStorage.getItem('celadon.client_id')).toBe(clientId())
  })

  it('uses the host machine id on the desktop, and keeps it stable', async () => {
    vi.doMock('./manifest', () => ({ clientKind: () => 'desktop', buildManifest: () => ({}), targetOs: () => 'macos' }))
    vi.stubGlobal('__TAURI_INTERNALS__', {})
    vi.stubGlobal('__TAURI__', {
      core: { invoke: async () => 'C792DE59-B424-5857-8973-D627348ECCC0' },
    })
    const { primeClientId: prime } = await import('./client-id')
    await expect(prime()).resolves.toBe('desk-C792DE59-B424-5857-8973-D627348ECCC0')
    vi.doUnmock('./manifest')
  })

  it('keeps the random id when the host has no machine id to give', async () => {
    vi.doMock('./manifest', () => ({ clientKind: () => 'desktop', buildManifest: () => ({}), targetOs: () => 'macos' }))
    vi.stubGlobal('__TAURI_INTERNALS__', {})
    vi.stubGlobal('__TAURI__', { core: { invoke: async () => null } })
    const { primeClientId: prime } = await import('./client-id')
    await expect(prime()).resolves.toMatch(/^desk-/)
    vi.doUnmock('./manifest')
  })
})

describe('primeClientId', () => {
  it('does nothing in a browser', async () => {
    await expect(primeClientId()).resolves.toBe(clientId())
  })
})
