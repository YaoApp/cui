import { afterEach, describe, expect, it, vi } from 'vitest'
import { credentialKey, serviceOrigin } from './scope'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('the credential key', () => {
  it('takes the origin, so a path does not make another account', () => {
    expect(serviceOrigin('http://a.example.com:5099/base')).toBe('http://a.example.com:5099')
  })

  it('adds a scheme to what a user types, and lowercases the host', () => {
    expect(serviceOrigin('A.Example.com:5099')).toBe('http://a.example.com:5099')
  })

  it('writes no default port', () => {
    expect(serviceOrigin('https://a.example.com')).toBe('https://a.example.com')
    expect(serviceOrigin('https://a.example.com:443')).toBe('https://a.example.com')
  })

  it('keeps the scheme, so https and http are two accounts', () => {
    expect(serviceOrigin('http://a.example.com:5099')).not.toBe(serviceOrigin('https://a.example.com:5099'))
  })

  it('keeps an IPv6 host in brackets', () => {
    expect(serviceOrigin('http://[::1]:5099')).toBe('http://[::1]:5099')
  })

  it('has no origin when there is no address, and no key without an origin', () => {
    expect(serviceOrigin('   ')).toBeUndefined()
    expect(serviceOrigin('not a url at all')).toBeUndefined()
    expect(credentialKey('session')).toBeUndefined()
  })

  it('composes the key from the address the app holds', () => {
    vi.stubEnv('VITE_SERVICE_BASE', 'http://a.example.com:5099/')
    expect(credentialKey('session')).toBe('http://a.example.com:5099#session')
  })
})
