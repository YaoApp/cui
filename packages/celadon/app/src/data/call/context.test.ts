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

  it('carries the same thing on every kind of call', () => {
    const ctx = callContext({ locale: 'en-US', theme: 'light' })
    expect(contextHeaders(ctx)).toMatchObject({ 'Accept-Language': 'en-US', 'X-Yao-Client': 'desk-test-id', 'X-Yao-Theme': 'light' })
    expect(contextQuery(ctx)).toEqual({ locale: 'en-US' })
  })
})
