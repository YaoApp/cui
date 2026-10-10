import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/** 标签浏览器在哪一侧。 */
export type BrowserSide = 'right' | 'left'

type ColumnsState = {
  /** 导航栏整列收起：收起后只留收起键与图标轨（见 design/foundations.md F6） */
  navCollapsed: boolean
  /** 主导航那一段折叠：只折上区，不是整列 */
  navMainCollapsed: boolean
  /** 标签浏览器收掉：整栏让给内容区 */
  browserCollapsed: boolean
  browserSide: BrowserSide
  setNavCollapsed: (collapsed: boolean) => void
  toggleNav: () => void
  toggleNavMain: () => void
  toggleBrowser: () => void
  setBrowserSide: (side: BrowserSide) => void
}

/* 三栏的布局事实：两处收起、标签浏览器所在的一侧。装配层、内容区与快捷键都读它，
   说不清归哪个功能（`architecture/06-state.md` §2.3），因此住 `stores/`。
   收起偏好记在本机，下次进入还按上次的样子（`design/main-shell.md` §三）。 */
export const useColumnsStore = create<ColumnsState>()(
  devtools(
    persist(
      (set, get) => ({
        navCollapsed: false,
        navMainCollapsed: false,
        browserCollapsed: false,
        browserSide: 'right',
        setNavCollapsed: (navCollapsed) =>
          set({ navCollapsed }, false, 'layout/setNavCollapsed'),
        toggleNav: () => get().setNavCollapsed(!get().navCollapsed),
        toggleNavMain: () =>
          set(
            { navMainCollapsed: !get().navMainCollapsed },
            false,
            'layout/toggleNavMain',
          ),
        toggleBrowser: () =>
          set({ browserCollapsed: !get().browserCollapsed }, false, 'layout/toggleBrowser'),
        setBrowserSide: (browserSide) =>
          set({ browserSide }, false, 'layout/setBrowserSide'),
      }),
      { name: 'cui.layout', version: 1 },
    ),
    { name: 'layout' },
  ),
)
