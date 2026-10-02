import { describe, expect, it } from 'vitest'
import { useWorldStore } from '@/features/world/world.store'

describe('world store', () => {
  it('starts empty', () => {
    expect(useWorldStore.getState().query).toBe('')
    expect(useWorldStore.getState().selectedEntityId).toBeUndefined()
  })

  it('keeps the filter and the panel selection', () => {
    useWorldStore.getState().setQuery('alpha')
    useWorldStore.getState().selectEntity('e2')
    expect(useWorldStore.getState().query).toBe('alpha')
    expect(useWorldStore.getState().selectedEntityId).toBe('e2')
  })

  it('closes the panel when nothing is selected', () => {
    useWorldStore.getState().selectEntity('e2')
    useWorldStore.getState().selectEntity(undefined)
    expect(useWorldStore.getState().selectedEntityId).toBeUndefined()
  })
})
