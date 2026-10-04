import { afterEach, describe, expect, it, vi } from 'vitest'

let address: string | undefined = '/v1'
vi.mock('@/platform/service', () => ({
  serviceBase: () => '',
  apiUrl: (path: string) => (address === undefined ? undefined : `${address}${path}`),
}))

import { send, type Request } from './send'

const outbound = { locale: 'en-US', theme: 'light' as const }
const request: Request<void, { MESSAGE?: string; id?: string; data?: string; ok?: boolean }> = {
  method: 'GET',
  path: '/helloworld/public',
}

function answer(body: unknown, status = 200) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
  address = '/v1'
})

describe('send', () => {
  it('composes the url from the well-known prefix, the context and the domain query', async () => {
    const fetchMock = answer({ MESSAGE: 'HELLO, WORLD' })
    const result = await send(request, { outbound, query: { page: 1 } })
    expect(result).toMatchObject({ ok: true, value: { MESSAGE: 'HELLO, WORLD' } })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/v1/helloworld/public?locale=en-US&accept=cui-web&page=1')
    expect(init?.method).toBe('GET')
    expect(init?.headers).toMatchObject({ 'X-Yao-Accept': 'cui-web' })
  })

  it('unwraps an envelope, and leaves a bare entity alone', async () => {
    answer({ data: { id: 'a' }, status: 200 })
    expect(await send(request, { outbound })).toMatchObject({ ok: true, value: { id: 'a' } })
    answer({ id: 'b' })
    expect(await send(request, { outbound })).toMatchObject({ ok: true, value: { id: 'b' } })
  })

  it('turns the engine body into the failure shape, keeping its words raw', async () => {
    answer({ error: 'invalid_token', error_description: 'token expired' }, 401)
    const result = await send(request, { outbound })
    expect(result).toMatchObject({ ok: false, code: 'invalid_token', rawMessage: 'token expired' })
  })

  it('refuses to guess the address when the service information has not been read', async () => {
    address = undefined
    const result = await send(request, { outbound })
    expect(result).toMatchObject({ ok: false, code: 'service.not_ready' })
  })

  it('lets the caller set a header explicitly, which the sign-in step needs', async () => {
    const fetchMock = answer({ ok: true })
    await send(request, { outbound, headers: { Authorization: 'Bearer temp-one-shot' } })
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer temp-one-shot',
      'X-Yao-Accept': 'cui-web',
    })
  })

  it('carries a header the interface declares, under the one the caller gives', async () => {
    const fetchMock = answer({ ok: true })
    const chatty: Request<{ text: string }> = { method: 'POST', path: '/chat', headers: { 'X-Yao-Accept': 'cui-web' } }
    await send(chatty, { outbound, body: { text: 'hi' }, headers: { Authorization: 'Bearer one-shot' } })
    const init = fetchMock.mock.calls[0][1]
    expect(init?.headers).toMatchObject({ 'X-Yao-Accept': 'cui-web', Authorization: 'Bearer one-shot' })
    expect(init?.body).toBe(JSON.stringify({ text: 'hi' }))
  })

  it('passes a network failure straight through', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline')
    }))
    const result = await send(request, { outbound })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toMatch(/^transport\./)
  })
})
