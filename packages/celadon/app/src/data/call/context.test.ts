import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/client/client-id', () => ({ clientId: () => 'desk-test-id' }))
vi.mock('@/platform/service', () => ({ serviceBase: () => '' }))

import { callContext, contextHeaders, contextQuery } from './context'

afterEach(() => vi.unstubAllGlobals())

describe('callContext', () => {
  it('carries the platform facts plus the client and the service', () => {
    const ctx = callContext({ locale: 'zh-CN', theme: 'dark' })
    expect(ctx).toMatchObject({ locale: 'zh-CN', theme: 'dark', clientId: 'desk-test-id', service: '' })
    expect(typeof ctx.timezone).toBe('string')
  })

  it('sends the header the old client sent, and the language in the query', () => {
    const ctx = callContext({ locale: 'en-US', theme: 'light' })
    // 旧客户端用 X-Yao-Accept 告诉后端要 CUI 格式（chat/api.ts:170）
    expect(contextHeaders(ctx)).toEqual({ 'X-Yao-Accept': 'cui-web', 'Content-Type': 'application/json' })
    // 流式只能放 query（EventSource / WS 握手都不能设自定义头）
    expect(contextQuery(ctx)).toEqual({ locale: 'en-US' })
  })
})
