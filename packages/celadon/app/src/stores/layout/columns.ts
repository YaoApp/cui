import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/** 标签浏览器在哪一侧。 */
export type BrowserSide = 'right' | 'left'

/** 标签浏览器的分屏：不分屏 · 左右两个面板 · 上下两个面板（最多一层）。 */
export type BrowserSplit = 'none' | 'columns' | 'rows'

type ColumnsState = {
  /** 导航栏整列收起：收起后列宽为零，重新展开的入口在内容列头左端（见 design/foundations.md F6） */
  navCollapsed: boolean
  /** 主导航那一段折叠：只折上区，不是整列 */
  navMainCollapsed: boolean
  /** 标签浏览器收掉：整栏让给内容区 */
  browserCollapsed: boolean
  browserSide: BrowserSide
  /** 分屏方向；`none` 是单面板 */
  browserSplit: BrowserSplit
  /** 分屏比例：第一个面板占的比例，0.2 到 0.8 之间，0.5 是平分 */
  splitRatio: number
  /** 导航列宽度（像素）。null 表示跟随 `--nav-default`，用户拖过把手才有值 */
  navWidth: number | null
  /** 标签浏览器宽度（像素）。null 表示跟随 `--side-width-reading`，用户拖过分界线才有值 */
  browserWidth: number | null
  setNavCollapsed: (collapsed: boolean) => void
  toggleNav: () => void
  toggleNavMain: () => void
  toggleBrowser: () => void
  setBrowserSide: (side: BrowserSide) => void
  setBrowserSplit: (split: BrowserSplit) => void
  setSplitRatio: (ratio: number) => void
  setNavWidth: (width: number | null) => void
  setBrowserWidth: (width: number | null) => void
}

/* 三栏的布局事实：两处收起、标签浏览器所在的一侧与分屏。装配层、内容区与快捷键都读它，
   说不清归哪个功能（`architecture/06-state.md` §2.3），因此住 `stores/`。
   收起与分屏偏好记在本机，下次进入还按上次的样子（`design/main-shell.md` §三）。 */
export const useColumnsStore = create<ColumnsState>()(
  devtools(
    persist(
      (set, get) => ({
        navCollapsed: false,
        navMainCollapsed: false,
        browserCollapsed: false,
        browserSide: 'right',
        browserSplit: 'none',
        browserWidth: null,
        splitRatio: 0.5,
        navWidth: null,
        setNavCollapsed: (navCollapsed) =>
          set({ navCollapsed }, false, 'layout/setNavCollapsed'),
        toggleNav: () =>
          set({ navCollapsed: !get().navCollapsed }, false, 'layout/toggleNav'),
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
        setBrowserSplit: (browserSplit) =>
          set({ browserSplit }, false, 'layout/setBrowserSplit'),
        /* 比例夹在 0.2 与 0.8 之间：两边都要留得下一个面板头与一行内容 */
        setSplitRatio: (splitRatio) =>
          set(
            { splitRatio: Math.min(0.8, Math.max(0.2, splitRatio)) },
            false,
            'layout/setSplitRatio',
          ),
        setNavWidth: (navWidth) => set({ navWidth }, false, 'layout/setNavWidth'),
        setBrowserWidth: (browserWidth) =>
          set({ browserWidth }, false, 'layout/setBrowserWidth'),
      }),
      {
        name: 'cui.layout',
        version: 1,
        /* 只留数据，不收动作：偏好记本机，动作每次由代码带上 */
        partialize: (state) => ({
          navCollapsed: state.navCollapsed,
          navMainCollapsed: state.navMainCollapsed,
          browserCollapsed: state.browserCollapsed,
          browserSide: state.browserSide,
          browserSplit: state.browserSplit,
          splitRatio: state.splitRatio,
          navWidth: state.navWidth,
          browserWidth: state.browserWidth,
        }),
      },
    ),
    { name: 'layout' },
  ),
)
