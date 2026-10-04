import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let address: string | undefined = '/v1'
let serviceReadable = true
vi.mock('@/platform/service', () => ({
  serviceBase: () => '',
  loadServiceInfo: async () => (serviceReadable ? { ok: true, value: { name: 't', version: '1', openapi: '/v1' } } : { ok: false, code: 'service.unavailable', params: {}, rawMessage: 'offline', message: 'service: unavailable' }),
  apiUrl: (path: string) => (address === undefined ? undefined : `${address}${path}`),
  endpoint: (path: string) => (address === undefined ? undefined : `${address}${path}`),
}))

import { send, type Request } from './send'
import { useLocaleStore } from '@/platform/i18n/locale.store'
import { useThemeStore } from '@/platform/theme/theme.store'

const request: Request<void, { MESSAGE?: string; id?: string; data?: string; ok?: boolean }> = {
  method: 'GET',
  path: '/helloworld/public',
}

function answer(body: unknown, status = 200) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/* 固定平台 store 的当前值 —— 用例不依赖运行环境默认语言/主题（test-support 也会先复位）。 */
beforeEach(() => {
  useLocaleStore.getState().setLocale('en-US')
  useThemeStore.getState().setPreference('light')
})

afterEach(() => {
  vi.unstubAllGlobals()
  address = '/v1'
  serviceReadable = true
})

describe('send', () => {
  it('composes the url from the well-known prefix, the context and the domain query', async () => {
    const fetchMock = answer({ MESSAGE: 'HELLO, WORLD' })
    const result = await send(request, { query: { page: 1 } })
    expect(result).toMatchObject({ ok: true, value: { MESSAGE: 'HELLO, WORLD' } })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/v1/helloworld/public?locale=en-US&accept=cui-web&page=1')
    expect(init?.method).toBe('GET')
    expect(new Headers(init?.headers).get('x-yao-accept')).toBe('cui-web')   // 大小写不敏感
  })

  it('takes the request metadata from the platform when the caller passes none', async () => {
    const fetchMock = answer({ ok: true })
    await send(request)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('locale=en-US')
    expect(new Headers(init?.headers).get('Accept-Language')).toBe('en-US')
  })

  it('lets the caller override one part of the preferences', async () => {
    const fetchMock = answer({ ok: true })
    await send(request, { preferences: { locale: 'ja' } })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('locale=ja')
    expect(new Headers(init?.headers).get('Accept-Language')).toBe('ja')
  })

  it('unwraps an envelope, and leaves a bare entity alone', async () => {
    answer({ data: { id: 'a' }, status: 200 })
    expect(await send(request)).toMatchObject({ ok: true, value: { id: 'a' } })
    answer({ id: 'b' })
    expect(await send(request)).toMatchObject({ ok: true, value: { id: 'b' } })
  })

  it('turns the engine body into the failure shape, keeping its words raw', async () => {
    answer({ error: 'invalid_token', error_description: 'token expired' }, 401)
    const result = await send(request)
    expect(result).toMatchObject({ ok: false, code: 'invalid_token', rawMessage: 'token expired' })
  })

  it('refuses to guess the address when the service information has not been read', async () => {
    address = undefined
    const result = await send(request)
    expect(result).toMatchObject({ ok: false, code: 'service.not_ready' })
  })

  it('lets the caller set a header explicitly, which the sign-in step needs', async () => {
    const fetchMock = answer({ ok: true })
    await send(request, { headers: { Authorization: 'Bearer temp-one-shot' } })
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers)
    expect(headers.get('Authorization')).toBe('Bearer temp-one-shot')
    expect(headers.get('X-Yao-Accept')).toBe('cui-web')
  })

  it('carries a header the interface declares, under the one the caller gives', async () => {
    const fetchMock = answer({ ok: true })
    const chatty: Request<{ text: string }> = { method: 'POST', path: '/chat', headers: { 'X-Yao-Accept': 'cui-web' } }
    await send(chatty, { body: { text: 'hi' }, headers: { Authorization: 'Bearer one-shot' } })
    const init = fetchMock.mock.calls[0][1]
    const headers = new Headers(init?.headers)
    expect(headers.get('X-Yao-Accept')).toBe('cui-web')
    expect(headers.get('authorization')).toBe('Bearer one-shot')   // 本次调用覆盖声明的同名头
    expect(init?.body).toBe(JSON.stringify({ text: 'hi' }))
  })

  it('keeps two values under one name, which a plain object cannot', async () => {
    const fetchMock = answer({ ok: true })
    await send(request, { headers: [['X-Trace', 'a'], ['X-Trace', 'b']] })
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers)
    expect(headers.get('x-trace')).toBe('a, b')   // 两个值都在
  })

  it('reports the failure of the service read itself, which is more precise', async () => {
    serviceReadable = false
    const result = await send(request)
    expect(result).toMatchObject({ ok: false, code: 'service.unavailable' })
  })

  it('passes a network failure straight through', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline')
    }))
    const result = await send(request)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toMatch(/^transport\./)
  })
})

/* 凭据的**自动装填**：声明上标 `session`，出口负责收下令牌 / 丢掉凭据 —— 业务层不碰字段 */
const sessionSignIn = vi.hoisted(() => vi.fn(async () => ({ ok: true as const, value: true })))
const sessionSignOut = vi.hoisted(() => vi.fn(async () => ({ ok: true as const, value: true })))
vi.mock('@/platform/credential', () => ({ signIn: sessionSignIn, signOut: sessionSignOut }))

describe('the egress adopts the session credential', () => {
  it('hands a successful sign-in response to the platform', async () => {
    answer({ access_token: 'tok-1' })
    const login: Request<void, { access_token?: string }> = { method: 'POST', path: '/test/login/token', session: 'adopt' }

    const result = await send(login, { body: undefined })

    expect(result.ok).toBe(true)
    expect(sessionSignIn).toHaveBeenCalledWith({ access_token: 'tok-1' })
  })

  it('drops the local credential after a successful sign-out', async () => {
    answer({ status: 'ok' })
    const logout: Request<void, { status?: string }> = { method: 'POST', path: '/user/logout', session: 'drop' }

    await send(logout)

    expect(sessionSignOut).toHaveBeenCalledTimes(1)
    expect(sessionSignIn).not.toHaveBeenCalled()
  })

  it('leaves the session alone for a plain request, and does not adopt a failure', async () => {
    answer({ MESSAGE: 'hi' })
    await send(request)
    expect(sessionSignIn).not.toHaveBeenCalled()
    expect(sessionSignOut).not.toHaveBeenCalled()

    answer({ error: 'unauthorized' }, 401)
    const login: Request<void, unknown> = { method: 'POST', path: '/test/login/token', session: 'adopt' }
    await send(login)
    expect(sessionSignIn).not.toHaveBeenCalled()
  })
})
