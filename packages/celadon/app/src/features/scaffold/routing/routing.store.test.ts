import { describe, expect, it } from 'vitest'
import { useRoutingStore } from './routing.store'

/* world 的**私有** store：只剩过滤。
   "侧边面板里开的是谁"随侧边面一起撤了：现在这条私有 store 自己收着"开着谁"。 */
describe('useRoutingStore', () => {
  it('starts with no filter', () => {
    expect(useRoutingStore.getState().query).toBe('')
  })

  it('sets the filter', () => {
    useRoutingStore.getState().setQuery('alpha')
    expect(useRoutingStore.getState().query).toBe('alpha')
  })

  it('is reset between cases without anyone asking (test-support discovers it)', () => {
    expect(useRoutingStore.getState().query).toBe('')
  })
})
