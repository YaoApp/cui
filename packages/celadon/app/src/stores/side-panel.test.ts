import { beforeEach, describe, expect, it } from 'vitest'
import { useSidePanelStore } from '@/stores/side-panel'

/* 公共 store 与功能私有 store 用同一套复位机制（test-support 自动发现 *.store.ts），
   所以这里不用手动清理 —— 下面第一条就是在验证这件事。 */
describe('useSidePanelStore', () => {
  beforeEach(() => {
    expect(useSidePanelStore.getState().entityId).toBeUndefined()
  })

  it('starts closed, and the shared reset keeps it that way between cases', () => {
    useSidePanelStore.getState().open('e1')
    expect(useSidePanelStore.getState().entityId).toBe('e1')
  })

  it('opens an object', () => {
    useSidePanelStore.getState().open('e2')
    expect(useSidePanelStore.getState().entityId).toBe('e2')
  })

  it('closes when opened with nothing', () => {
    useSidePanelStore.getState().open('e3')
    useSidePanelStore.getState().open(undefined)
    expect(useSidePanelStore.getState().entityId).toBeUndefined()
  })
})
