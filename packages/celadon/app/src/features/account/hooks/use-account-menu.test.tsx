import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RequestState } from '@/data/hooks'
import type { AccountProfile, AccountUsage } from '@/data/user'

const state = vi.hoisted(() => ({
  profile: { status: 'loading' } as RequestState<AccountProfile>,
  usage: { status: 'idle' } as RequestState<AccountUsage>,
  signedIn: true,
  run: vi.fn(),
}))

vi.mock('@/data/hooks', () => ({
  useRequest: (query: { key: readonly unknown[] }) => ({
    state: String(query.key).includes('usage') ? state.usage : state.profile,
    run: state.run,
  }),
}))

vi.mock('@/data/user', () => ({
  accountProfileQuery: () => ({ key: ['profile-account'] }),
  accountUsageQuery: () => ({ key: ['usage-account'] }),
}))

import { useAccountMenu } from './use-account-menu'

beforeEach(() => {
  state.profile = { status: 'loading' }
  state.usage = { status: 'idle' }
  state.signedIn = true
  state.run.mockReset()
})

describe('useAccountMenu', () => {
  it('reports signed out when the machine has no session marker', () => {
    state.signedIn = false
    const { result } = renderHook(() => useAccountMenu(state.signedIn))
    expect(result.current.status).toBe('signedOut')
  })

  it('is loading until the profile arrives', () => {
    const { result } = renderHook(() => useAccountMenu(state.signedIn))
    expect(result.current.status).toBe('loading')
  })

  it('becomes unavailable when the profile fails', () => {
    state.profile = {
      status: 'error',
      failure: { code: 'transport.network', params: {}, message: 'x', text: 'x' },
    }
    const { result } = renderHook(() => useAccountMenu(state.signedIn))
    expect(result.current.status).toBe('unavailable')
  })

  it('merges the profile and the usage into the view model', () => {
    state.profile = {
      status: 'ok',
      value: {
        user_id: 'u1',
        name: 'Mock OAuth User',
        avatar: 'https://example.com/a.png',
        team: { name: 'Administrator Team', plan: 'Team' },
      },
    }
    state.usage = {
      status: 'ok',
      value: { plan: '体验版', remaining: 902467, upgradeUrl: 'https://yaoagents.com/pricing' },
    }
    const { result } = renderHook(() => useAccountMenu(state.signedIn))

    expect(result.current).toMatchObject({
      status: 'ready',
      name: 'Mock OAuth User',
      plan: '体验版',
      avatar: 'https://example.com/a.png',
      teamName: 'Administrator Team',
      usage: { remaining: 902467, upgradeUrl: 'https://yaoagents.com/pricing' },
    })
  })

  it('retries both queries', () => {
    const { result } = renderHook(() => useAccountMenu(state.signedIn))
    result.current.retry()
    expect(state.run).toHaveBeenCalledTimes(2)
  })
})
