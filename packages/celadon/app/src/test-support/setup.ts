import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { discoveredStores } from './stores'

/* 每个用例后：卸载 DOM + 把所有 store 复位。
   store 的发现与初始状态登记在 ./stores.ts（自动、跨层，见那里的说明和 stores.test.ts 的断言）。 */
const initial = new Map(discoveredStores.map((entry) => [entry.store, entry.store.getState()] as const))

afterEach(() => {
  cleanup()
  for (const [store, state] of initial) store.setState(state, true)
  window.localStorage.clear()
})
