import { afterEach, describe, expect, it, vi } from 'vitest'
import { serviceBase, serviceUrl } from './base'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('serviceBase', () => {
  it('has no base by default, so paths stay relative', () => {
    expect(serviceBase()).toBe('')
    expect(serviceUrl('/api/things')).toBe('/api/things')
    expect(serviceUrl('api/things')).toBe('/api/things')
  })

  it('takes the base from the build, and trims the trailing slash', () => {
    vi.stubEnv('VITE_SERVICE_BASE', 'https://service.example.com/')
    expect(serviceBase()).toBe('https://service.example.com')
    expect(serviceUrl('/api/things')).toBe('https://service.example.com/api/things')
  })
})
