import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

type ThemeState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

/* 主题是运行时的事，归平台层。它只做一件事：把当前主题写到根元素的 data-theme 上 ——
   tokens.css 里 [data-theme='dark'] .celadon 会切掉整套值，**组件不需要知道当前深浅**。
   选中的主题存 localStorage，刷新后还在。 */
function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        apply(theme)
        set({ theme })
      },
      toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
    }),
    {
      name: 'cui.theme',
      // 重新水合之后再把持久化的值写回根元素（否则刷新后 DOM 与 store 不一致）
      onRehydrateStorage: () => (state) => { if (state) apply(state.theme) },
    },
  ),
)
