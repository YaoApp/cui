/* 退出的本机清理：一处实现，产品页与开发面共用。 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/service', () => ({ serviceBase: vi.fn(() => '') }))

import { serviceBase } from '@/platform/service'
import { useAuthStore } from './auth.store'
import { readLanding, rememberLanding } from './landing-record'
import { signedIn, rememberSession } from './session-marker'
import { takeNext, stashNext } from './next'
import { clearLocalSession } from './sign-out'

describe('the local cleanup of a sign-out', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
    globalThis.sessionStorage.clear()
    useAuthStore.getState().reset()
  })

  it('forgets the mark, the landing, the stashed address and the user in memory', () => {
    rememberSession()
    rememberLanding('/scaffold/base')
    stashNext('/scaffold/base')
    useAuthStore.getState().setUser({ userId: 'u-1', name: 'Wren' })

    clearLocalSession()

    expect(signedIn()).toBe(false)
    expect(readLanding()).toBeUndefined()
    expect(takeNext()).toBeUndefined()
    expect(useAuthStore.getState().user).toBeUndefined()
  })

  it('leaves the servers this machine has connected to alone', () => {
    globalThis.localStorage.setItem('celadon.servers', JSON.stringify([{ url: 'http://one.example:15099', lastConnected: 1 }]))
    clearLocalSession()
    expect(globalThis.localStorage.getItem('celadon.servers')).not.toBeNull()
  })

  it('is safe to run twice, and with nothing to clean', () => {
    clearLocalSession()
    expect(() => clearLocalSession()).not.toThrow()
    expect(signedIn()).toBe(false)
  })

  it('does not touch another service account', () => {
    vi.mocked(serviceBase).mockReturnValue('http://one.example:15099')
    rememberSession()
    rememberLanding('/one')

    vi.mocked(serviceBase).mockReturnValue('http://two.example:15099')
    clearLocalSession()

    vi.mocked(serviceBase).mockReturnValue('http://one.example:15099')
    expect(signedIn()).toBe(true)
    expect(readLanding()).toBe('/one')
  })
})
