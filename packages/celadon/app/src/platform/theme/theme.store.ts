import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'
/** 用户的**偏好**：可以交给系统，也可以明确指定。 */
export type ThemePreference = 'system' | Theme

export const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)'

/** 系统是否偏暗。非浏览器 / 不支持 matchMedia 时按不偏暗处理。 */
export const systemPrefersDark = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(SYSTEM_DARK_QUERY).matches
    : false

/** **纯函数**：偏好 → 实际主题（可测，无副作用）。 */
export const resolveTheme = (preference: ThemePreference, prefersDark: boolean): Theme =>
  preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference

type ThemeState = {
  /** 用户的选择（持久化这一项） */
  preference: ThemePreference
  /** 解析后的实际主题 —— 组件读它，不用自己判断系统 */
  theme: Theme
  setPreference: (preference: ThemePreference) => void
  /** 切换控件用：切的是解析后的主题，等于写下一条显式偏好 */
  setTheme: (theme: Theme) => void
}

/* 主题是运行时的事，归平台层。它只做一件事：把**解析后的**主题写到根元素的 data-theme 上 ——
   tokens.css 里 [data-theme='dark'] .celadon 会切掉整套值，**组件不需要知道当前深浅**。
   偏好存 localStorage（键 `cui.theme`）；首帧由 `index.html` 的 inline 脚本先写一次，避免闪浅色。 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: 'system',
      theme: resolveTheme('system', systemPrefersDark()),
      setPreference: (preference) =>
        set({ preference, theme: resolveTheme(preference, systemPrefersDark()) }),
      setTheme: (theme) => get().setPreference(theme),
    }),
    {
      name: 'cui.theme',
      version: 1,
      /* 老版本只存了 `theme`（light / dark）—— 当成一条显式偏好，别让选择丢掉。 */
      migrate: (persisted) => {
        const old = (persisted as { theme?: Theme } | undefined)?.theme
        return old === 'light' || old === 'dark' ? { preference: old } : (persisted as object)
      },
      partialize: (state) => ({ preference: state.preference }),
      /* 水合只带回来 `preference`；`theme` 是解析结果，必须**重新算一次** ——
         否则刷新后偏好是 dark、DOM 却还是创建时的 light（浏览器用例抓到过）。 */
      onRehydrateStorage: () => (state) => {
        if (state) state.theme = resolveTheme(state.preference, systemPrefersDark())
      },
    },
  ),
)

/* 唯一的副作用：初始值写一次，之后订阅变化。
   写在订阅里（而不是塞进动作）是为了让**任何**改到主题的路径 —— 持久化水合、系统切换、
   测试里整体复位 —— 都同步 DOM；但订阅只在变化时触发，所以初始值必须单独写一次，
   否则"从没变过主题"的时候 DOM 上根本没有 data-theme。 */
const apply = (theme: Theme) => {
  document.documentElement.dataset.theme = theme
}

apply(useThemeStore.getState().theme)
useThemeStore.subscribe((state) => apply(state.theme))

/* `system` 态下**实时跟随**系统：系统换了深浅，解析结果跟着换。 */
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  window.matchMedia(SYSTEM_DARK_QUERY).addEventListener('change', () => {
    if (useThemeStore.getState().preference !== 'system') return
    useThemeStore.setState({ theme: resolveTheme('system', systemPrefersDark()) })
  })
}
