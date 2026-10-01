import { create } from 'zustand'

type HelloState = {
  count: number
  refresh: () => void
}

/* feature 私有状态：只服务 hello。跨 feature 才需要另找落位（见 architecture/06）。 */
export const useHelloStore = create<HelloState>((set) => ({
  count: 0,
  refresh: () => set((state) => ({ count: state.count + 1 })),
}))
