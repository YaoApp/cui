import { describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/client/client-id', () => ({ clientId: () => 'desk-test-id' }))
vi.mock('@/platform/service', () => ({ serviceBase: () => '' }))

import { context, headers, query } from './context'

describe('context', () => {
  it('carries the platform facts plus the client and the service', () => {
    const ctx = context({ locale: 'zh-CN', theme: 'dark' })
    expect(ctx).toMatchObject({ locale: 'zh-CN', theme: 'dark', clientId: 'desk-test-id', service: '' })
    expect(typeof ctx.timezone).toBe('string')
  })

  it('sends the accept the engine recognises, and the language where it looks for it', () => {
    const ctx = context({ locale: 'en-US', theme: 'light' })
    // 引擎 ValidAccepts：standard / cui-web / cui-native / cui-desktop
    expect(headers(ctx)).toMatchObject({
      'X-Yao-Accept': 'cui-web',
      'Accept-Language': 'en-US',
      'X-Locale': 'en-US',
    })
    // 流式只能放 query（EventSource 与 WS 握手都设不了自定义头）
    expect(query(ctx)).toEqual({})   // ctx 不再往 query 塞东西（2026-10-05）
  })
})
