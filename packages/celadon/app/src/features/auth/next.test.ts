/* `next`：取值校验（防开放重定向）、带上它、第三方往返的暂存与取用。 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/service', () => ({ serviceBase: vi.fn(() => '') }))

import { serviceBase } from '@/platform/service'
import { forgetNext, readNext, stashNext, takeNext, validateNext, withNext } from './next'

describe('the after-sign-in destination', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
    globalThis.sessionStorage.clear()
    vi.mocked(serviceBase).mockReturnValue('')
  })

  it('takes an in-app path with its query string', () => {
    expect(validateNext('/scaffold/base?q=alpha')).toBe('/scaffold/base?q=alpha')
    expect(readNext('?next=%2Fscaffold%2Fbase')).toBe('/scaffold/base')
  })

  it('refuses anything that could leave the app or loop back', () => {
    expect(validateNext('https://evil.example/x')).toBeUndefined()
    expect(validateNext('//evil.example')).toBeUndefined()
    expect(validateNext('/a:b')).toBeUndefined()
    expect(validateNext('/a\\b')).toBeUndefined()
    expect(validateNext('scaffold/base')).toBeUndefined()
    expect(validateNext('')).toBeUndefined()
    expect(validateNext(undefined)).toBeUndefined()
    expect(validateNext(`/${'x'.repeat(600)}`)).toBeUndefined()
  })

  it('refuses the process pages themselves', () => {
    for (const path of ['/login', '/register', '/auth/back/google', '/servers', '/welcome']) {
      expect(validateNext(path)).toBeUndefined()
    }
    expect(validateNext('/loginx')).toBe('/loginx')
  })

  it('refuses the root: the default entry is not a destination', () => {
    expect(validateNext('/')).toBeUndefined()
    expect(validateNext('/?from=connect')).toBeUndefined()
    expect(readNext('?next=%2F')).toBeUndefined()
    /* 根下面的一层不是根，照收 */
    expect(validateNext('/scaffold')).toBe('/scaffold')
  })

  it('hangs the destination on a path, keeping any query it already has', () => {
    expect(withNext('/login', '/scaffold/base')).toBe('/login?next=%2Fscaffold%2Fbase')
    expect(withNext('/register?username=a', '/scaffold/base')).toBe(
      '/register?username=a&next=%2Fscaffold%2Fbase',
    )
    expect(withNext('/login', undefined)).toBe('/login')
    expect(withNext('/login', 'https://evil.example')).toBe('/login')
  })

  it('keeps a stashed destination per service, and takes it only once', () => {
    vi.mocked(serviceBase).mockReturnValue('http://one.example:15099')
    stashNext('/scaffold/base')
    vi.mocked(serviceBase).mockReturnValue('http://two.example:15099')
    expect(takeNext()).toBeUndefined()
    vi.mocked(serviceBase).mockReturnValue('http://one.example:15099')
    expect(takeNext()).toBe('/scaffold/base')
    expect(takeNext()).toBeUndefined()
  })

  it('drops a stashed destination on demand', () => {
    stashNext('/scaffold/base')
    forgetNext()
    expect(takeNext()).toBeUndefined()
  })

  it('clears the old destination when a new round trip has none', () => {
    stashNext('/scaffold/base')
    /* 又一次第三方往返没带去向：不能把上一次的去向留给它 */
    stashNext(undefined)
    expect(takeNext()).toBeUndefined()

    stashNext('/scaffold/base')
    stashNext('https://evil.example/x')
    expect(takeNext()).toBeUndefined()
  })

  it('survives missing or broken storage', () => {
    vi.stubGlobal('sessionStorage', undefined)
    expect(() => stashNext('/x')).not.toThrow()
    expect(takeNext()).toBeUndefined()
    expect(() => forgetNext()).not.toThrow()
    vi.unstubAllGlobals()

    globalThis.sessionStorage.setItem('celadon.next', '{not json')
    expect(takeNext()).toBeUndefined()
  })

  it('survives a storage that refuses to be read', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      get() {
        throw new Error('denied')
      },
    })
    try {
      expect(() => stashNext('/x')).not.toThrow()
      expect(takeNext()).toBeUndefined()
      expect(() => forgetNext()).not.toThrow()
    } finally {
      if (original) Object.defineProperty(globalThis, 'sessionStorage', original)
    }
  })

  it('has no place to stash without a scope', () => {
    vi.stubGlobal('location', undefined)
    expect(() => stashNext('/x')).not.toThrow()
    expect(takeNext()).toBeUndefined()
    expect(() => forgetNext()).not.toThrow()
    vi.unstubAllGlobals()
  })
})
