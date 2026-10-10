import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/** 一页的标识：`kind` 带域前缀，`id` 持久、不被解析（`architecture/06-state.md` §2.5）。 */
export type TabEntry = { kind: string; id: string }

/** 首页固定是第一个标签，不可关（`design/main-shell.md` §五）。 */
export const HOME_TAB: TabEntry = { kind: 'browser-home', id: 'home' }

export const tabKey = (tab: TabEntry): string => `${tab.kind}:${tab.id}`

export const sameTab = (a: TabEntry, b: TabEntry): boolean => tabKey(a) === tabKey(b)

type TabsState = {
  /** 打开的页，首页恒在第一位 */
  tabs: TabEntry[]
  activeKey: string
  /** 开一页：同名同 id 复用，不做并列的第二页；开完停到那一页 */
  open: (tab: TabEntry) => void
  /** 关一页：首页不可关；关掉当前页时停到左边一页 */
  close: (tab: TabEntry) => void
  activate: (tab: TabEntry) => void
}

/* 标签浏览器里打开的页：与会话相关但不是强关联，换会话不清空、不重排
   （`design/main-shell.md` §五）。说不清归哪个功能，住 `stores/`。 */
export const useTabsStore = create<TabsState>()(
  devtools(
    persist(
      (set, get) => ({
        tabs: [HOME_TAB],
        activeKey: tabKey(HOME_TAB),
        open: (tab) => {
          const { tabs } = get()
          if (tabs.some((item) => sameTab(item, tab))) {
            set({ activeKey: tabKey(tab) }, false, 'browser/open')
            return
          }
          set({ tabs: [...tabs, tab], activeKey: tabKey(tab) }, false, 'browser/open')
        },
        close: (tab) => {
          const { tabs, activeKey } = get()
          if (sameTab(tab, HOME_TAB)) return
          const index = tabs.findIndex((item) => sameTab(item, tab))
          if (index < 0) return
          const next = tabs.filter((item) => !sameTab(item, tab))
          if (tabKey(tab) !== activeKey) {
            set({ tabs: next }, false, 'browser/close')
            return
          }
          const fallback = next[Math.max(0, index - 1)] ?? HOME_TAB
          set({ tabs: next, activeKey: tabKey(fallback) }, false, 'browser/close')
        },
        activate: (tab) => set({ activeKey: tabKey(tab) }, false, 'browser/activate'),
      }),
      {
        name: 'cui.browser',
        version: 1,
        /* 只留数据，不收动作：打开的页与当前页记本机，换会话不清空 */
        partialize: (state) => ({ tabs: state.tabs, activeKey: state.activeKey }),
      },
    ),
    { name: 'browser' },
  ),
)
