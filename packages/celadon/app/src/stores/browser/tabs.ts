import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { sameTarget, type TabTarget } from './targets'
import {
	HOME_TAB,
	activateIn,
	appendIn,
	closeAllIn,
	closeIn,
	closeOthersIn,
	isHome,
	moveIn,
	navigateIn,
	nextKey,
	rememberIn,
	type GroupState,
	type OpenMeta,
	type RecentEntry,
	type TabEntry
} from './tab-group'

/* 类型与首页常量原先定义在本文件，现在与分组动作一起住在 tab-group.ts；
   这里原样再导出，引用它们的地方不用改。 */
export { HOME_TAB, isHome, tabKey, type RecentEntry, type TabEntry } from './tab-group'

type TabsState = {
	/** 打开的页；首页也是普通一页，次序可自由调整，只在列表中一个都不剩时重新出现 */
	tabs: TabEntry[]
	activeKey: string
	/** 打开过的页，按使用顺序、最近的在前；首页那一页的下半部分列它 */
	recent: RecentEntry[]
	/** 开一页：同一目标已在则切到它；不在则追加并停到它 */
	open: (target: TabTarget, meta?: OpenMeta) => void
	/** 新建一个空页并停到它；当前页已经是空页时只切回它，不再叠一个 */
	openBlank: () => void
	/** 在这一页里打开：页的 key 与位置都不变，只换装的内容 */
	navigate: (key: string, target: TabTarget, meta?: OpenMeta) => void
	/** 关一页：首页那一格不可关；关的是当前页时按右邻优先、没有右邻取左邻；一个都不剩时首页重新出现 */
	close: (key: string) => void
	/** 只留这一页：能关的都关掉，这一页成为当前页；首页没被留下时补回首位 */
	closeOthers: (key: string) => void
	/** 关掉所有能关的页：一个都不剩时首页重新出现 */
	closeAll: () => void
	/** 把一页移到目标位置：索引按**移除该项之后**的数组算；越界夹取，找不到该项不动作 */
	move: (key: string, index: number) => void
	activate: (key: string) => void
}

const pick = (state: TabsState): GroupState => ({
	tabs: state.tabs,
	activeKey: state.activeKey,
	recent: state.recent
})

export const useTabsStore = create<TabsState>()(
	devtools(
		persist(
			(set, get) => {
				const apply = (next: GroupState, action: string) =>
					set({ tabs: next.tabs, activeKey: next.activeKey, recent: next.recent }, false, action)
				return {
					tabs: [HOME_TAB],
					activeKey: HOME_TAB.key,
					recent: [],
					open: (target, meta) => {
						if (target.kind === 'blank') {
							get().openBlank()
							return
						}
						const state = get()
						const existing = state.tabs.find((tab) => sameTarget(tab.target, target))
						if (existing) {
							apply(
								{ ...pick(state), activeKey: existing.key, recent: rememberIn(state.recent, target) },
								'browser/open'
							)
							return
						}
						const opened = appendIn(pick(state), { key: nextKey(state.tabs), target, ...meta })
						apply({ ...opened, recent: rememberIn(state.recent, target) }, 'browser/open')
					},
					openBlank: () => {
						const state = get()
						const current = state.tabs.find((tab) => tab.key === state.activeKey)
						if (current?.target.kind === 'blank') return
						apply(appendIn(pick(state), { key: nextKey(state.tabs), target: { kind: 'blank' } }), 'browser/openBlank')
					},
					navigate: (key, target, meta) => apply(navigateIn(pick(get()), key, target, meta), 'browser/navigate'),
					close: (key) => apply(closeIn(pick(get()), key), 'browser/close'),
					closeOthers: (key) => apply(closeOthersIn(pick(get()), key), 'browser/closeOthers'),
					closeAll: () => apply(closeAllIn(pick(get())), 'browser/closeAll'),
					move: (key, index) => apply(moveIn(pick(get()), key, index), 'browser/move'),
					activate: (key) => apply(activateIn(pick(get()), key), 'browser/activate')
				}
			},
			{
				name: 'cui.browser',
				version: 3,
				/* 只留数据，不收动作：打开的页、当前页与打开过的页都记本机，换会话不清空 */
				partialize: (state) => ({
					tabs: state.tabs,
					activeKey: state.activeKey,
					recent: state.recent
				}),
				/* 第一版记的是 `{ kind, id }`：首页照旧，外部页把地址搬进 target；
				   第二版之前没有「打开过的页」，补一个空表 */
				migrate: (persisted, version) => {
					const state = persisted as { tabs?: unknown[]; activeKey?: string; recent?: unknown }
					const recent = Array.isArray(state.recent) ? state.recent : []
					if (version >= 2 || !Array.isArray(state.tabs)) {
						return { ...state, recent } as never
					}
					const tabs: TabEntry[] = state.tabs.map((raw, index) => {
						const item = raw as { kind?: string; id?: string }
						if (item.kind === 'browser-home') return HOME_TAB
						const url = String(item.id ?? '')
						return { key: `${url || 'page'}-${index}`, target: { kind: 'external', url } }
					})
					const withHome = tabs.some((tab) => isHome(tab)) ? tabs : [HOME_TAB, ...tabs]
					const activeKey = withHome.some((tab) => tab.key === state.activeKey)
						? (state.activeKey as string)
						: HOME_TAB.key
					return { tabs: withHome, activeKey, recent } as never
				}
			}
		),
		{ name: 'browser' }
	)
)
