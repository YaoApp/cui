import { describe, expect, it } from 'vitest'
import { useRoutingStore } from './routing.store'

/* world 的**私有** store：只剩过滤。
   "侧边面板里开的是谁"搬去公共的 stores/side-panel.ts，测试也跟着搬了。 */
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
