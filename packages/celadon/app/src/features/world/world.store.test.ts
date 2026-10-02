import { describe, expect, it } from 'vitest'
import { useWorldStore } from './world.store'

/* world 的**私有** store：只剩过滤。
   "侧边面板里开的是谁"搬去公共的 stores/side-panel.ts，测试也跟着搬了。 */
describe('useWorldStore', () => {
  it('starts with no filter', () => {
    expect(useWorldStore.getState().query).toBe('')
  })

  it('sets the filter', () => {
    useWorldStore.getState().setQuery('alpha')
    expect(useWorldStore.getState().query).toBe('alpha')
  })

  it('is reset between cases without anyone asking (test-support discovers it)', () => {
    expect(useWorldStore.getState().query).toBe('')
  })
})
