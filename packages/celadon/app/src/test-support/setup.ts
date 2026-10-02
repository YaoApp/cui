import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/* 每个用例后：卸载 DOM + 把所有 store 复位。
   ------------------------------------------------------------------
   **不手写清单。** store 是模块级单例（zustand 的 create 在模块加载时执行一次），
   状态会跨用例留着，所以要复位；但"新增 store 记得来加一行"是靠人记住的约定，迟早会漏。
   这里改成自动发现：每个 store 在测试开始前把初始状态登记一次，之后每个用例后整体复位。
   于是新增 store 不用改这个文件，store 住哪一层也不影响。 */
type Store = {
  getState: () => unknown
  setState: (state: unknown, replace?: boolean) => void
  subscribe: (listener: unknown) => unknown
}

const isStore = (value: unknown): value is Store =>
  typeof value === 'function' &&
  typeof (value as unknown as Store).getState === 'function' &&
  typeof (value as unknown as Store).setState === 'function' &&
  typeof (value as unknown as Store).subscribe === 'function'

const modules = import.meta.glob('../**/*.store.ts', { eager: true }) as Record<string, Record<string, unknown>>

const initial = new Map<Store, unknown>()
for (const mod of Object.values(modules)) {
  for (const value of Object.values(mod)) {
    if (isStore(value) && !initial.has(value)) initial.set(value, value.getState())
  }
}

afterEach(() => {
  cleanup()
  for (const [store, state] of initial) store.setState(state, true)
  window.localStorage.clear()
})
