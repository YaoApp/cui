/* 本机登录标记：分账、清理与坏数据的处理。判定本身在 `entry.test.ts`。 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/service', () => ({ serviceBase: vi.fn(() => '') }))

import { serviceBase } from '@/platform/service'
import { forgetSession, rememberSession, sessionScope, signedIn } from './session-marker'

describe('the local sign-in mark', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
    vi.mocked(serviceBase).mockReturnValue('')
  })

  it('is empty until something is remembered', () => {
    expect(signedIn()).toBe(false)
  })

  it('remembers this service and keeps other services apart', () => {
    vi.mocked(serviceBase).mockReturnValue('http://one.example:15099/')
    rememberSession()
    expect(signedIn()).toBe(true)

    vi.mocked(serviceBase).mockReturnValue('http://two.example:15099')
    expect(signedIn()).toBe(false)
    rememberSession()

    /* 两个服务各记各的：回到第一台仍然算登录过 */
    vi.mocked(serviceBase).mockReturnValue('http://one.example:15099')
    expect(signedIn()).toBe(true)
  })

  it('forgets only the service it is called on', () => {
    vi.mocked(serviceBase).mockReturnValue('http://one.example:15099')
    rememberSession()
    vi.mocked(serviceBase).mockReturnValue('http://two.example:15099')
    rememberSession()

    forgetSession()
    expect(signedIn()).toBe(false)
    vi.mocked(serviceBase).mockReturnValue('http://one.example:15099')
    expect(signedIn()).toBe(true)
  })

  it('treats broken storage as "not signed in"', () => {
    globalThis.localStorage.setItem('celadon.session', '{not json')
    expect(signedIn()).toBe(false)
    globalThis.localStorage.setItem('celadon.session', '["array"]')
    expect(signedIn()).toBe(false)
    globalThis.localStorage.setItem('celadon.session', '{"http://x": "nope"}')
    expect(signedIn()).toBe(false)
  })

  it('survives a missing storage', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(signedIn()).toBe(false)
    expect(() => rememberSession()).not.toThrow()
    expect(() => forgetSession()).not.toThrow()
    vi.unstubAllGlobals()
  })

  it('keeps this tab signed in when the storage cannot be written', () => {
    /* 存储不可用时，登录成功那一刻不能把自己的页面弹回登录页：这一次打开内按已登录走 */
    vi.stubGlobal('localStorage', undefined)
    rememberSession()
    expect(signedIn()).toBe(true)

    forgetSession()
    expect(signedIn()).toBe(false)
    vi.unstubAllGlobals()
    /* 刷新之后没有持久标记，按未登录处理 */
    expect(signedIn()).toBe(false)
  })

  it('survives a storage that refuses to be read', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('denied')
      },
    })
    try {
      expect(signedIn()).toBe(false)
      expect(() => rememberSession()).not.toThrow()
      expect(() => forgetSession()).not.toThrow()
    } finally {
      if (original) Object.defineProperty(globalThis, 'localStorage', original)
    }
  })

  it('has no scope at all when there is neither a base nor a location', () => {
    vi.stubGlobal('location', undefined)
    expect(sessionScope()).toBe('')
    expect(signedIn()).toBe(false)
    expect(() => rememberSession()).not.toThrow()
    expect(() => forgetSession()).not.toThrow()
    vi.unstubAllGlobals()
  })

  it('drops entries without a scope and values that are not finite numbers', () => {
    globalThis.localStorage.setItem('celadon.session', JSON.stringify({ '': 1, 'http://x': 1e999 }))
    expect(signedIn()).toBe(false)
  })

  it('takes the origin of the service base, and the raw value when it is not a URL', () => {
    vi.mocked(serviceBase).mockReturnValue('http://one.example:15099/deep')
    expect(sessionScope()).toBe('http://one.example:15099')
    vi.mocked(serviceBase).mockReturnValue('not-a-url')
    expect(sessionScope()).toBe('not-a-url')
  })
})
