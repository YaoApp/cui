import { afterEach, describe, expect, it, vi } from 'vitest'
import { probe, transportFetch, transportFetchOk, crossOriginRefusal } from './fetch'
import { emitUnauthorized, onUnauthorized } from './unauthorized'
import { parseFailure } from './errors'

const sessionAuthorization = vi.hoisted(() => vi.fn<() => string | undefined>(() => undefined))
vi.mock('../credential/session', () => ({ sessionAuthorization }))

const pluginFetch = vi.fn()
vi.mock('@tauri-apps/plugin-http', () => ({ fetch: (...args: unknown[]) => pluginFetch(...args) }))

function asHost() {
  vi.stubGlobal('__TAURI_INTERNALS__', {})
  vi.stubGlobal('__TAURI__', {})
}

afterEach(() => {
  vi.unstubAllGlobals()
  pluginFetch.mockReset()
  sessionAuthorization.mockReset()
  sessionAuthorization.mockReturnValue(undefined)
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

  it('sets no limit of its own: without a timeout a slow answer still arrives', async () => {
    // **默认不限定**（17 §2.2）：出口不替业务方定数字
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => setTimeout(() => resolve(new Response('late')), 60))))
    const result = await transportFetch('/api/slow')
    expect(result.ok).toBe(true)
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

  it('lets a target it cannot even parse fall through to fetch', () => {
    expect(crossOriginRefusal('http://[', false)).toBeNull()
  })

  it('reads a target that is not a plain string, and gives up when there is no location', () => {
    expect(crossOriginRefusal(new URL('https://example.com/x'), false)).toMatchObject({
      code: 'transport.cross_origin',
    })
    vi.stubGlobal('location', undefined)
    expect(crossOriginRefusal('https://example.com/x', false)).toBeNull()
    vi.unstubAllGlobals()
    vi.stubGlobal('location', { origin: 'null', href: 'http://localhost/' })
    expect(crossOriginRefusal('https://example.com/x', false)).toBeNull()
    vi.unstubAllGlobals()
  })

  it('passes an ok answer through the strict form, and names the url when it is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('hi', { status: 200 })))
    expect((await transportFetchOk('/api/things')).ok).toBe(true)

    asHost()
    pluginFetch.mockResolvedValue(new Response('nope', { status: 500 }))
    expect(await transportFetchOk('https://example.com')).toMatchObject({
      ok: false,
      code: 'transport.status',
      params: { status: 500, url: 'https://example.com' },
    })
    expect(await transportFetchOk(new URL('https://example.com/x'))).toMatchObject({
      ok: false,
      code: 'transport.status',
      params: { status: 500, url: 'https://example.com/x' },
    })
    vi.unstubAllGlobals()
  })

  it('hands the transport failure back untouched from the strict form and from the probe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('no route') }))
    expect(await transportFetchOk('/api/things')).toMatchObject({ ok: false, code: 'transport.network' })
    expect(await probe('/api/things')).toMatchObject({ ok: false, code: 'transport.network' })
  })

  it('names a body it cannot read', () => {
    expect(parseFailure(new Error('bad json'), 'https://x'))
      .toMatchObject({ code: 'transport.parse', params: { url: 'https://x' } })
  })
})

describe('the egress carries the session, and reports an expiry', () => {
  it('adds the bearer when the platform has one, and never overrides an explicit one', async () => {
    const seen: (string | null)[] = []
    const browser = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      seen.push(new Headers(init?.headers).get('authorization'))
      return new Response('hi', { status: 200 })
    })
    vi.stubGlobal('fetch', browser)
    sessionAuthorization.mockReturnValue('Bearer stored')
    await transportFetch('/api/things')
    await transportFetch('/api/things', { headers: { Authorization: 'Bearer explicit' } })
    expect(seen).toEqual(['Bearer stored', 'Bearer explicit'])
  })

  it('sends no authorization when there is no session (a browser cookie needs none)', async () => {
    let seen: string | null = 'unset'
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        seen = new Headers(init?.headers).get('authorization')
        return new Response('hi', { status: 200 })
      }),
    )
    await transportFetch('/api/things')
    expect(seen).toBeNull()
  })

  it('reports a 401 on a product call, and does not replay it', async () => {
    const call = vi.fn(async () => new Response('nope', { status: 401 }))
    vi.stubGlobal('fetch', call)
    const heard: number[] = []
    const off = onUnauthorized(() => heard.push(1))
    const result = await transportFetch('/v1/user/profile')
    off()

    expect(call).toHaveBeenCalledOnce()
    expect(heard).toHaveLength(1)
    expect(result.ok && result.value.status).toBe(401)
  })

  it('stays quiet for the entry calls: their 401 is not an expiry', async () => {
    const call = vi.fn(async () => new Response('nope', { status: 401 }))
    vi.stubGlobal('fetch', call)
    const heard: number[] = []
    const off = onUnauthorized(() => heard.push(1))
    await transportFetch('/v1/user/entry/login')
    await transportFetch('/v1/user/oauth/google/authorize')
    await transportFetch('/oauth/jwks')
    off()

    expect(heard).toHaveLength(0)
    expect(call).toHaveBeenCalledTimes(3)
  })

  it('lets a non-401 answer through without an event', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 403 })))
    const heard: number[] = []
    const off = onUnauthorized(() => heard.push(1))
    await transportFetch('/v1/user/profile')
    off()
    expect(heard).toHaveLength(0)
  })

  it('carries the event to every listener, and stops after unsubscribing', () => {
    const heard: string[] = []
    const off = onUnauthorized(() => heard.push('first'))
    const off2 = onUnauthorized(() => heard.push('second'))
    emitUnauthorized()
    off()
    emitUnauthorized()
    off2()
    expect(heard).toEqual(['first', 'second', 'second'])
  })
})
