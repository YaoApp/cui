import { describe, expect, it } from 'vitest'
import { useHelloStore } from '@/features/hello/hello-store'

describe('hello store', () => {
  it('初始为 0', () => {
    expect(useHelloStore.getState().count).toBe(0)
  })

  it('每次 refresh 加一', () => {
    const { refresh } = useHelloStore.getState()
    refresh()
    refresh()
    expect(useHelloStore.getState().count).toBe(2)
  })
})
