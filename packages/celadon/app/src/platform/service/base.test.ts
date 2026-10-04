import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadServiceBase, resetServiceBase, serviceBase, serviceUrl } from './base'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('serviceBase', () => {
  it('has no base by default, so paths stay relative', () => {
    expect(serviceBase()).toBe('')
    expect(serviceUrl('/api/things')).toBe('/api/things')   // 根相对：引擎的根是站点根
    expect(serviceUrl('api/things')).toBe('/api/things')
  })

  it('takes the base from the build, and trims the trailing slash', () => {
    vi.stubEnv('VITE_SERVICE_BASE', 'https://service.example.com/')
    expect(serviceBase()).toBe('https://service.example.com')
    expect(serviceUrl('/api/things')).toBe('https://service.example.com/api/things')
  })
  it('asks the host for the address on the desktop, once, and keeps it', async () => {
    const invoke = vi.fn(async () => ({ url: 'http://localhost:5099/' }))
    vi.stubGlobal('__TAURI_INTERNALS__', {})
    vi.stubGlobal('__TAURI__', { core: { invoke } })
    try {
      expect(serviceBase()).toBe('')
      expect(await loadServiceBase()).toBe('http://localhost:5099')
      expect(serviceUrl('/v1/thing')).toBe('http://localhost:5099/v1/thing')
      await loadServiceBase()
      expect(invoke).toHaveBeenCalledTimes(1)
    } finally {
      resetServiceBase()
      vi.unstubAllGlobals()
    }
  })

  it('stays relative in a browser, with no host to ask', async () => {
    expect(await loadServiceBase()).toBe('')
    expect(serviceBase()).toBe('')
  })
})