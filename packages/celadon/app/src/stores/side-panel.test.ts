import { beforeEach, describe, expect, it } from 'vitest'
import { useSidePanelStore } from '@/stores/side-panel'

/* 公共 store 与私有 store 共用同一套自动复位（test-support 按文件名发现），第一条就在验证它。 */
describe('useSidePanelStore', () => {
  beforeEach(() => {
    expect(useSidePanelStore.getState().entry).toBeUndefined()
  })

  it('starts empty, and the shared reset keeps it that way between cases', () => {
    useSidePanelStore.getState().open({ kind: 'world-entity', id: 'e1' })
    expect(useSidePanelStore.getState().entry).toEqual({ kind: 'world-entity', id: 'e1' })
  })

  it('takes any kind without knowing what it means', () => {
    useSidePanelStore.getState().open({ kind: 'thread', id: 't9' })
    expect(useSidePanelStore.getState().entry).toEqual({ kind: 'thread', id: 't9' })
  })

  it('closes when opened with nothing', () => {
    useSidePanelStore.getState().open({ kind: 'world-entity', id: 'e3' })
    useSidePanelStore.getState().open(undefined)
    expect(useSidePanelStore.getState().entry).toBeUndefined()
  })
})
