/* 自动发现应用里的所有 zustand store —— **不手写清单**。
   store 是模块级单例（create 在模块加载时执行一次），状态会跨用例留着，所以要复位；
   但"新增 store 记得去测试支持里加一行"是靠人记住的约定，迟早会漏。
   这里用 Vite 的 import.meta.glob 按**文件名**发现，与它住在哪一层无关：
   两种命名都要认：**功能/组件里的私有 store** 带 `.store` 后缀（`inbox.store.ts` —— 同目录还有别的角色，
   所以要区分）；**公共的 `stores/` 目录**里每个文件都是 store，**不加后缀**（`side-panel.ts` —— 目录已经说明了角色）。 */

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

/* 两种命名：私有带 `.store` 后缀（同目录还有别的角色）；公共的 `stores/` 不带（目录即角色）。
   stores/ 里的测试文件也一起被 glob 到 —— 但它们不导出 store，下面的 isStore 会滤掉。 */
const modules = import.meta.glob(['../**/*.store.ts', '../stores/*.ts'], {
  eager: true,
}) as Record<string, Record<string, unknown>>

/** 发现到的 store，带它在源码里的路径（路径用于断言覆盖到了哪些层）。 */
export const discoveredStores: { path: string; store: Store }[] = []

for (const [path, mod] of Object.entries(modules)) {
  for (const value of Object.values(mod)) {
    if (isStore(value) && !discoveredStores.some((entry) => entry.store === value)) {
      discoveredStores.push({ path, store: value })
    }
  }
}
