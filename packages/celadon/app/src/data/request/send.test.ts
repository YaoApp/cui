import { afterEach, describe, expect, it, vi } from 'vitest'

let address: string | undefined = '/v1'
vi.mock('@/platform/service', () => ({
  serviceBase: () => '',
  apiUrl: (path: string) => (address === undefined ? undefined : `${address}${path}`),
}))

import { send } from './send'

const outbound = { locale: 'en-US', theme: 'light' as const }
const request = { method: 'GET' as const, path: '/helloworld/public' }

function answer(body: unknown, status = 200) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('send', () => {
  it('composes the url from the well-known prefix, the context and the domain query', async () => {
    const fetchMock = answer({ MESSAGE: 'HELLO, WORLD' })
    const result = await send<{ MESSAGE: string }>(request, { outbound, query: { page: 1 } })
    expect(result).toMatchObject({ ok: true, value: { MESSAGE: 'HELLO, WORLD' } })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/v1/helloworld/public?locale=en-US&accept=cui-web&page=1')
    expect(init?.method).toBe('GET')
    expect(init?.headers).toMatchObject({ 'X-Yao-Accept': 'cui-web' })
  })

  it('unwraps an envelope, and leaves a bare entity alone', async () => {
    answer({ data: { id: 'a' }, status: 200 })
    expect(await send<{ id: string }>(request, { outbound })).toMatchObject({ ok: true, value: { id: 'a' } })
    answer({ id: 'b' })
    expect(await send<{ id: string }>(request, { outbound })).toMatchObject({ ok: true, value: { id: 'b' } })
  })

  it('turns the engine body into the failure shape, keeping its words raw', async () => {
    answer({ error: 'invalid_token', error_description: 'token expired' }, 401)
    const result = await send(request, { outbound })
    expect(result).toMatchObject({ ok: false, code: 'invalid_token', rawMessage: 'token expired' })
  })

  it('refuses to guess the address when the service information has not been read', async () => {
    address = undefined                       // 模拟"还没读到 well-known"
    const result = await send(request, { outbound })
    expect(result).toMatchObject({ ok: false, code: 'service.not_ready' })
    address = '/v1'
  })

  it('lets the caller override a header, which the sign-in step needs', async () => {
    const fetchMock = answer({ ok: true })
    await send(request, { outbound, headers: { Authorization: 'Bearer temp-one-shot' } })
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer temp-one-shot', 'X-Yao-Accept': 'cui-web' })
  })

  it('does not carry credentials on a public interface', async () => {
    const fetchMock = answer({ ok: true })
    await send({ ...request, auth: 'none' }, { outbound })
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe('omit')
    const protectedCall = await send({ ...request, auth: 'required' }, { outbound })
    expect(protectedCall.ok).toBe(true)
    expect(fetchMock.mock.calls[1][1]?.credentials).toBeUndefined() // 受保护的：由浏览器/宿主自己带
  })

  it('passes a network failure straight through', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    const result = await send(request, { outbound })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toMatch(/^transport\./)
  })
})
