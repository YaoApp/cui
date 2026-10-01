import { describe, expect, it } from 'vitest'
import { useHelloStore } from '@/features/hello/hello-store'

describe('hello store', () => {
  it('starts at zero', () => {
    expect(useHelloStore.getState().count).toBe(0)
  })

  it('increments on every refresh', () => {
    const { refresh } = useHelloStore.getState()
    refresh()
    refresh()
    expect(useHelloStore.getState().count).toBe(2)
  })
})
