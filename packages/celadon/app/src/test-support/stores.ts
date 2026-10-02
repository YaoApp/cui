/* 自动发现应用里的所有 zustand store —— **不手写清单**。
   store 是模块级单例（create 在模块加载时执行一次），状态会跨用例留着，所以要复位；
   但"新增 store 记得去测试支持里加一行"是靠人记住的约定，迟早会漏。
   这里用 Vite 的 import.meta.glob 按**文件名**发现，与它住在哪一层无关：
   组件私有的 `theme-table.store.ts`、feature 的 `inbox.store.ts`、平台层的 `theme.store.ts` 一视同仁。 */

export type Store = {
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

/** 发现到的 store，带它在源码里的路径（路径用于断言覆盖到了哪些层）。 */
export const discoveredStores: { path: string; store: Store }[] = []

for (const [path, mod] of Object.entries(modules)) {
  for (const value of Object.values(mod)) {
    if (isStore(value) && !discoveredStores.some((entry) => entry.store === value)) {
      discoveredStores.push({ path, store: value })
    }
  }
}
