import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

type ThemeState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

/* 主题是运行时的事，归平台层。它只做一件事：把当前主题写到根元素的 data-theme 上 ——
   tokens.css 里 [data-theme='dark'] .celadon 会切掉整套值，**组件不需要知道当前深浅**。
   选中的主题存 localStorage，刷新后还在。 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'cui.theme' },
  ),
)

/* 唯一的副作用：初始值写一次，之后订阅变化。
   写在订阅里（而不是塞进 setTheme）是为了让**任何**改到主题的路径 —— 持久化水合、
   测试里整体复位 —— 都同步 DOM；但订阅只在变化时触发，所以初始值必须单独写一次，
   否则"从没变过主题"的时候 DOM 上根本没有 data-theme。 */
const apply = (theme: Theme) => {
  document.documentElement.dataset.theme = theme
}

apply(useThemeStore.getState().theme)
useThemeStore.subscribe((state) => apply(state.theme))
