/* 入口类接口的识别：这些路径的 401 不算会话失效（未登录时本来就会遇到）。 */
import { describe, expect, it } from 'vitest'
import { emitUnauthorized, isEntryRequest, onUnauthorized } from './unauthorized'

describe('isEntryRequest', () => {
  it('names the entry endpoints, exactly and below them', () => {
    expect(isEntryRequest('/v1/user/entry')).toBe(true)
    expect(isEntryRequest('/v1/user/entry/login')).toBe(true)
    expect(isEntryRequest('/v1/user/oauth/google/authorize')).toBe(true)
    expect(isEntryRequest('/oauth/jwks')).toBe(true)
    expect(isEntryRequest('https://engine.example/v1/user/entry/verify')).toBe(true)
  })

  it('does not depend on the interface root: the well-known decides it', () => {
    expect(isEntryRequest('/api/user/entry/login')).toBe(true)
    expect(isEntryRequest('https://engine.example/user/oauth/google/callback')).toBe(true)
  })

  it('reads a target that is not a plain string', () => {
    expect(isEntryRequest(new URL('https://engine.example/v1/user/entry/login'))).toBe(true)
    expect(isEntryRequest(new URL('https://engine.example/v1/user/profile'))).toBe(false)
  })

  it('leaves everything else alone', () => {
    expect(isEntryRequest('/v1/user/profile')).toBe(false)
    expect(isEntryRequest('/v1/user/entryx')).toBe(false)
    expect(isEntryRequest('/v1/user/logout')).toBe(false)
    /* 设备授权页是已登录的人批准设备时调的，它的 401 照旧算失效 */
    expect(isEntryRequest('/v1/oauth/device/authorize')).toBe(false)
  })

  it('does not claim a target it cannot parse', () => {
    expect(isEntryRequest('http://[')).toBe(false)
  })
})

describe('the session-expiry event', () => {
  it('reaches every listener and stops after they unsubscribe', () => {
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
