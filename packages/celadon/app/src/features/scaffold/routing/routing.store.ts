import { create } from 'zustand'

type WorldState = {
  /** 列表过滤 —— **私有**（world 一家的事），但它值得进地址栏，所以绑到 `?q=` */
  query: string
  setQuery: (query: string) => void
}

/* world 的**私有状态**（见 architecture/06-state.md）。

   "侧边面板里开的是谁"原本也在这里，但它**说不清归谁** —— 侧边是应用级挂载点，
   所以搬去了 `stores/side-panel.ts`（公共）。这条迁移正是"私有 vs 公共"的活例子。

   绑 URL 的机制见 use-routing-url-sync.ts（私有自己绑）。 */
export const useRoutingStore = create<WorldState>()((set) => ({
  query: '',
  setQuery: (query) => set({ query }),
}))
