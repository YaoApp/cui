import { create } from 'zustand'

type WorldState = {
  /** 列表过滤 —— 进 URL（`?q=`）*/
  query: string
  /** 侧边面板里打开哪一条 —— 进 URL（`?sideEntity=`）*/
  selectedEntityId?: string
  setQuery: (query: string) => void
  selectEntity: (id?: string) => void
}

/* **store 是真相，URL 只做书签**（见 architecture/07-routing.md）。
   过滤与"面板里开谁"都住这里；双向同步交给 use-world-url-sync。 */
export const useWorldStore = create<WorldState>()((set) => ({
  query: '',
  selectedEntityId: undefined,
  setQuery: (query) => set({ query }),
  selectEntity: (selectedEntityId) => set({ selectedEntityId }),
}))
