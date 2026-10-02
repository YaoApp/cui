import { describe, expect, it } from 'vitest'
import { discoveredStores } from '@/test-support/stores'

/* 这一组不是测业务，是**测那张网**：自动发现必须真的覆盖到每一层，
   否则"组件也可以有自己的 store"只是句口头保证。 */
describe('store discovery', () => {
  it('finds stores at all', () => {
    expect(discoveredStores.length).toBeGreaterThan(0)
  })

  it('is not scoped to one layer — it reaches features and the platform alike', () => {
    const layers = new Set(
      discoveredStores.map((entry) => entry.path.split('/').filter((p) => p !== '..')[0]),
    )
    expect(layers.size).toBeGreaterThan(1)
    expect([...layers]).toContain('features')
  })
})
