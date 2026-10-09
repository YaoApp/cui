/* 最后落点：只收应用内路径，按服务分账，坏数据当没有。 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/service', () => ({ serviceBase: vi.fn(() => '') }))

import { serviceBase } from '@/platform/service'
import { readLanding, rememberLanding, forgetLanding, validLanding } from './landing-record'

describe('the landing record', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
    vi.mocked(serviceBase).mockReturnValue('')
  })

  it('is empty until something is remembered', () => {
    expect(readLanding()).toBeUndefined()
  })

  it('keeps the path with its query string', () => {
    rememberLanding('/scaffold/base?q=alpha')
    expect(readLanding()).toBe('/scaffold/base?q=alpha')
  })

  it('keeps the last one only', () => {
    rememberLanding('/one')
    rememberLanding('/two')
    expect(readLanding()).toBe('/two')
  })

  it('drops anything that is not an in-app path', () => {
    rememberLanding('https://evil.example/x')
    rememberLanding('//evil.example')
    rememberLanding('scaffold/base')
    rememberLanding('/a:b')
    expect(readLanding()).toBeUndefined()
    expect(validLanding('/a?q=1')).toBe(true)
    expect(validLanding('/a:b')).toBe(false)
  })

  it('refuses the root: that is the entry page itself, and recording it would loop', () => {
    expect(validLanding('/')).toBe(false)
    expect(validLanding('/?q=1')).toBe(false)
    rememberLanding('/')
    expect(readLanding()).toBeUndefined()
    expect(validLanding('/scaffold')).toBe(true)
  })

  it('keeps services apart', () => {
    vi.mocked(serviceBase).mockReturnValue('http://one.example:15099')
    rememberLanding('/one')
    vi.mocked(serviceBase).mockReturnValue('http://two.example:15099')
    expect(readLanding()).toBeUndefined()
    rememberLanding('/two')
    expect(readLanding()).toBe('/two')
    vi.mocked(serviceBase).mockReturnValue('http://one.example:15099')
    expect(readLanding()).toBe('/one')
  })

  it('forgets the landing of this service only', () => {
    vi.mocked(serviceBase).mockReturnValue('http://one.example:15099')
    rememberLanding('/one')
    vi.mocked(serviceBase).mockReturnValue('http://two.example:15099')
    rememberLanding('/two')

    forgetLanding()
    expect(readLanding()).toBeUndefined()
    vi.mocked(serviceBase).mockReturnValue('http://one.example:15099')
    expect(readLanding()).toBe('/one')
  })

  it('forgets without a landing, a scope or a storage', () => {
    expect(() => forgetLanding()).not.toThrow()
    vi.stubGlobal('location', undefined)
    expect(() => forgetLanding()).not.toThrow()
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', undefined)
    expect(() => forgetLanding()).not.toThrow()
    vi.unstubAllGlobals()
  })

  it('treats broken storage as "no landing"', () => {
    globalThis.localStorage.setItem('celadon.landing', '{not json')
    expect(readLanding()).toBeUndefined()
    globalThis.localStorage.setItem('celadon.landing', JSON.stringify({ scope: { path: '//evil', at: 1 } }))
    expect(readLanding()).toBeUndefined()
    globalThis.localStorage.setItem(
      'celadon.landing',
      JSON.stringify({ '': { path: '/x', at: 1 }, other: null, third: { path: '/y' }, fourth: 'nope' }),
    )
    expect(readLanding()).toBeUndefined()
  })

  it('survives a missing storage', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(readLanding()).toBeUndefined()
    expect(() => rememberLanding('/x')).not.toThrow()
    vi.unstubAllGlobals()
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
      expect(readLanding()).toBeUndefined()
      expect(() => rememberLanding('/x')).not.toThrow()
    } finally {
      if (original) Object.defineProperty(globalThis, 'localStorage', original)
    }
  })

  it('has no landing without a scope', () => {
    vi.stubGlobal('location', undefined)
    expect(readLanding()).toBeUndefined()
    expect(() => rememberLanding('/x')).not.toThrow()
    vi.unstubAllGlobals()
  })
})
