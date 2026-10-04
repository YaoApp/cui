import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/service', () => ({
  serviceBase: () => '',
  endpoint: (path: string) => `/v1${path}`,
  loadServiceInfo: async () => ({ ok: true, value: { name: 'y', version: '1', openapi: '/v1' } }),
}))

import { send } from '../request'
import { listTeams, listUsers, loginWeb, readOtp } from './api'
import { testKeys } from './keys'
import { listUsersQuery, loginWebQuery } from './queries'
import type { LoginResult } from './types'
import { useLocaleStore } from '@/platform/i18n/locale.store'
import { useThemeStore } from '@/platform/theme/theme.store'

/* 固定的**假值**（不是真凭据）：只用来验证"值不上屏、只上长度"与解包裹，不带任何真实格式。 */
const SESSION = 'fake-session-value'
const ACCESS = 'fake-access-value'
const REFRESH = 'fake-refresh-value'

const LOGIN: LoginResult = {
  session_id: SESSION,
  id_token: 'fake-id-value',
  access_token: ACCESS,
  refresh_token: REFRESH,
  expires_in: 3600,
  refresh_token_expires_in: 86400,
  status: 'active',
}

/* 固定平台 store 的当前值 —— 用例不依赖运行环境默认语言/主题。 */
beforeEach(() => {
  useLocaleStore.getState().setLocale('en-US')
  useThemeStore.getState().setPreference('light')
})

function answer(body: unknown, status = 200) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('the test-mode domain', () => {
  it('sends the login body as-is and unwraps the result', async () => {
    const fetchMock = answer(LOGIN)
    const result = await send(loginWeb, { body: { user: 'ada@example.com' } })
    expect(result).toMatchObject({
      ok: true,
      value: { session_id: SESSION, status: 'active', expires_in: 3600, refresh_token_expires_in: 86400 },
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/v1/test/login/web')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ user: 'ada@example.com' }))
  })

  it('unwraps the user page with its pagination fields', async () => {
    const fetchMock = answer({
      data: [{ id: 'u1', user_id: 'u1', email: 'ada@example.com' }],
      page: 2,
      pagesize: 10,
      pagecnt: 3,
      total: 21,
      next: null,
      prev: null,
    })
    const result = await send(listUsers({ page: 2, pagesize: 10 }))
    expect(result).toMatchObject({ ok: true, value: { page: 2, pagesize: 10, pagecnt: 3, total: 21 } })
    if (result.ok) expect(result.value.data.map((user) => user.email)).toEqual(['ada@example.com'])
    expect(String(fetchMock.mock.calls[0][0])).toContain('/v1/test/users?page=2&pagesize=10')
  })

  it('reports the engine 400 shape when the otp code is missing', async () => {
    const fetchMock = answer({ error: 'invalid_request', error_description: 'code is required' }, 400)
    const result = await send(readOtp({ code: '' }))
    expect(result).toMatchObject({
      ok: false,
      code: 'invalid_request',
      rawMessage: 'code is required',
      params: { status: 400 },
    })
    expect(String(fetchMock.mock.calls[0][0])).toContain('/v1/test/otp?code=')
  })

  it('strips the data envelope off the team list', async () => {
    answer({ data: [{ team_id: 't1', name: 'core' }] })
    const result = await send(listTeams())
    expect(result).toMatchObject({ ok: true, value: [{ team_id: 't1', name: 'core' }] })
  })
})

describe('the test key family', () => {
  it('derives every interface key from its declaration, under one family root', () => {
    expect(testKeys.all).toEqual(['test'])
    expect(testKeys.loginWeb()).toEqual(['test', 'login-web', 'POST', '/test/login/web'])
    expect(testKeys.listUsers({ page: 2, pagesize: 10 })).toEqual([
      'test',
      'users',
      'GET',
      '/test/users?page=2&pagesize=10',
    ])
  })

  it('pairs the key with the declaration the caller has to run', () => {
    expect(loginWebQuery()).toEqual({ key: testKeys.loginWeb(), request: loginWeb })
    const query = listUsersQuery({ page: 1 })
    expect(query.key).toEqual(testKeys.listUsers({ page: 1 }))
    expect(query.request).toEqual({ method: 'GET', path: '/test/users?page=1' })
  })
})
