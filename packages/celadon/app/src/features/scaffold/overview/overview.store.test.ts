import { describe, expect, it } from 'vitest'
import { useOverviewStore } from '@/features/scaffold/overview/overview.store'

describe('hello store', () => {
  it('starts at zero', () => {
    expect(useOverviewStore.getState().count).toBe(0)
  })

  it('increments on every refresh', () => {
    const { refresh } = useOverviewStore.getState()
    refresh()
    refresh()
    expect(useOverviewStore.getState().count).toBe(2)
  })
})
