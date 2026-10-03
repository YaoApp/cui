import { afterEach, describe, expect, it, vi } from 'vitest'
import { probe, transportFetch, transportFetchOk } from './fetch'
import { parseFailure } from './errors'

const pluginFetch = vi.fn()
vi.mock('@tauri-apps/plugin-http', () => ({ fetch: (...args: unknown[]) => pluginFetch(...args) }))

function asHost() {
  vi.stubGlobal('__TAURI_INTERNALS__', {})
  vi.stubGlobal('__TAURI__', {})
}

afterEach(() => {
  vi.unstubAllGlobals()
  pluginFetch.mockReset()
})

describe('transportFetch', () => {
  it('uses the browser fetch when there is no host', async () => {
    const browser = vi.fn(async () => new Response('hi', { status: 200 }))
    vi.stubGlobal('fetch', browser)
    const result = await transportFetch('/api/things')
    expect(browser).toHaveBeenCalledOnce()
    expect(result.ok).toBe(true)
    expect(pluginFetch).not.toHaveBeenCalled()
  })

  it('uses the host plugin when there is one, with the same signature', async () => {
    asHost()
    pluginFetch.mockResolvedValue(new Response('hi', { status: 200 }))
    const result = await transportFetch('https://example.com', { method: 'GET' })
    expect(pluginFetch).toHaveBeenCalledOnce()
    expect(pluginFetch.mock.calls[0][0]).toBe('https://example.com')
    expect(result.ok).toBe(true)
  })

  it('keeps the failure as a value, with the url for the packs to interpolate', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('no route') }))
    const result = await transportFetch('/api/things')
    expect(result).toMatchObject({ ok: false, code: 'transport.network', params: { url: '/api/things' } })
  })

  it('turns a non-2xx into transport.status only when the caller asked for ok', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 503 })))
    expect((await transportFetch('/api/things')).ok).toBe(true)
    const strict = await transportFetchOk('/api/things')
    expect(strict).toMatchObject({ ok: false, code: 'transport.status', params: { status: 503 } })
  })

  it('reports a timeout rather than hanging', async () => {
    vi.stubGlobal('fetch', vi.fn((_input: unknown, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
    })))
    const result = await transportFetch('/api/things', { timeoutMs: 10 })
    expect(result).toMatchObject({ ok: false, code: 'transport.timeout' })
  })

  it('probes an address without reading the body', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    })))
    const result = await probe('/api/things')
    expect(result).toMatchObject({ ok: true, value: { status: 200, ok: true, contentType: 'text/html' } })
  })

  it('refuses a call to another origin in the browser, and says why', async () => {
    const browser = vi.fn()
    vi.stubGlobal('fetch', browser)
    const result = await transportFetch('https://example.com')
    expect(result).toMatchObject({ ok: false, code: 'transport.cross_origin', params: { url: 'https://example.com' } })
    // **没有发出去**：与其让它撞 CORS 拿一句说不清的话，不如先说清
    expect(browser).not.toHaveBeenCalled()
  })

  it('names a body it cannot read', () => {
    expect(parseFailure(new Error('bad json'), 'https://x'))
      .toMatchObject({ code: 'transport.parse', params: { url: 'https://x' } })
  })
})
