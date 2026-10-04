import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/service', () => ({
  serviceBase: () => '',
  serviceUrl: (path: string) => path,
  serviceInfo: () => ({ name: 't', version: '1', openapi: '/v1' }),
}))

import { send } from './send'

const outbound = { locale: 'en-US', theme: 'light' as const }
const call = { method: 'GET' as const, path: '/helloworld/public' }

function answer(body: unknown, status = 200) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('send', () => {
  it('composes the url from the well-known prefix, the context and the domain query', async () => {
    const fetchMock = answer({ MESSAGE: 'HELLO, WORLD' })
    const result = await send<{ MESSAGE: string }>(call, { outbound, query: { page: 1 } })
    expect(result).toMatchObject({ ok: true, value: { MESSAGE: 'HELLO, WORLD' } })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/v1/helloworld/public?locale=en-US&accept=cui-web&page=1')
    expect(init?.method).toBe('GET')
    expect(init?.headers).toMatchObject({ 'X-Yao-Accept': 'cui-web' })
  })

  it('unwraps an envelope, and leaves a bare entity alone', async () => {
    answer({ data: { id: 'a' }, status: 200 })
    expect(await send<{ id: string }>(call, { outbound })).toMatchObject({ ok: true, value: { id: 'a' } })
    answer({ id: 'b' })
    expect(await send<{ id: string }>(call, { outbound })).toMatchObject({ ok: true, value: { id: 'b' } })
  })

  it('turns the engine body into the failure shape, keeping its words raw', async () => {
    answer({ error: 'invalid_token', error_description: 'token expired' }, 401)
    const result = await send(call, { outbound })
    expect(result).toMatchObject({ ok: false, code: 'invalid_token', rawMessage: 'token expired' })
  })

  it('passes a network failure straight through', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    const result = await send(call, { outbound })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toMatch(/^transport\./)
  })
})
