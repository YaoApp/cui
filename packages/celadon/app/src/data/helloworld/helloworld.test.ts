import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/service', () => ({
  serviceBase: () => '',
  endpoint: (path: string) => `/v1${path}`,
  loadServiceInfo: async () => ({ ok: true, value: { name: 'y', version: '1', openapi: '/v1' } }),
}))

import { send } from '../request'
import { protectedPost, publicGet } from './api'
import type { HelloWorld } from './types'
import { useLocaleStore } from '@/platform/i18n/locale.store'
import { useThemeStore } from '@/platform/theme/theme.store'

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

describe('the helloworld scaffold', () => {
  it('walks the whole path on the public one: address, egress, unwrapping', async () => {
    const fetchMock = answer({ MESSAGE: 'HELLO, WORLD', APP: 'yaobots' })
    const result = await send(publicGet)
    expect(result).toMatchObject({ ok: true, value: { MESSAGE: 'HELLO, WORLD' } })
    expect(fetchMock.mock.calls[0][0]).toBe('/v1/helloworld/public')
  })

  it('lets the credential be carried on the protected one, and the body go through', async () => {
    const fetchMock = answer({ MESSAGE: 'HELLO, WORLD', POST_PAYLOAD: { foo: 'bar' } })
    const result = await send<Record<string, unknown>, HelloWorld>(protectedPost, { body: { foo: 'bar' } })
    expect(result.ok).toBe(true)
    const init = fetchMock.mock.calls[0][1]
    expect(init?.credentials).toBeUndefined()                 // "有就带"由浏览器/宿主决定，这里不硬写
    expect(init?.body).toBe(JSON.stringify({ foo: 'bar' }))
    expect(fetchMock.mock.calls[0][0]).toContain('/v1/helloworld/protected')
  })
})
