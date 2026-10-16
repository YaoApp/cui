import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { IconId } from '@/platform/icons'
import { sameTarget, targetKey, targetLabel, type TabTarget } from './targets'

/** 一页：`key` 在页的生命周期里不变，装什么由 `target` 决定（在页里打开什么就换成什么）。
    标签条上「先出现一项、随后内容变成目标」靠的就是这一条：页本身就是那一项，换的是内容。 */
export type TabEntry = {
	key: string
	target: TabTarget
	/** 标签上的名字与图形，由打开方给；不给时按目标推（见目标模块）。首页恒用 i-home。 */
	title?: string
	icon?: IconId
}

/** 首页：空状态的落点。还是首页那一页时不可关；它换上目标成了普通一页之后就能关，
    关到一个都不剩时首页重新出现。 */
export const HOME_TAB: TabEntry = { key: 'home', target: { kind: 'home' } }

export const tabKey = (tab: TabEntry): string => tab.key

export const isHome = (tab: TabEntry): boolean => tab.target.kind === 'home'

type OpenMeta = { title?: string; icon?: IconId }

/** 打开过的一页：首页那一页的下半部分按使用顺序列出它们，点一条就重新打开、复用同一页 */
export type RecentEntry = { key: string; target: TabTarget; label: string }

/** 最近打开保留的条数 */
const RECENT_LIMIT = 8

/** 记一条「打开过」：同一目标已经在就提到最前，超出上限的从末尾去掉 */
const remember = (recent: RecentEntry[], target: TabTarget): RecentEntry[] => {
	if (target.kind === 'home' || target.kind === 'blank') return recent
	const entry: RecentEntry = { key: targetKey(target), target, label: targetLabel(target) }
	return [entry, ...recent.filter((item) => !sameTarget(item.target, target))].slice(0, RECENT_LIMIT)
}

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
	/** 关一页：每一页都能关；关的是当前页时按右邻优先、没有右邻取左邻；一个都不剩时首页重新出现 */
	close: (key: string) => void
	/** 只留这一页：能关的都关掉，这一页成为当前页；首页没被留下时补回首位，一个都不剩时首页重新出现 */
	closeOthers: (key: string) => void
	/** 关掉所有能关的页：一个都不剩时首页重新出现 */
	closeAll: () => void
	/** 把一页移到目标位置：索引按**移除该项之后**的数组算，与拖放落点的语义一致；
	    越界夹到 0 与长度之间，找不到该项不动作，当前页不变 */
	move: (key: string, index: number) => void
	activate: (key: string) => void
}

let serial = 0
const nextKey = (tabs: TabEntry[]): string => {
	let key = ''
	do {
		serial += 1
		key = `page-${serial}`
	} while (tabs.some((tab) => tab.key === key))
	return key
}

export const useTabsStore = create<TabsState>()(
	devtools(
		persist(
			(set, get) => ({
				tabs: [HOME_TAB],
				activeKey: HOME_TAB.key,
				recent: [],
				open: (target, meta) => {
					if (target.kind === 'blank') {
						get().openBlank()
						return
					}
					const { tabs } = get()
					const existing = tabs.find((tab) => sameTarget(tab.target, target))
					if (existing) {
						set(
							{ activeKey: existing.key, recent: remember(get().recent, target) },
							false,
							'browser/open'
						)
						return
					}
					const tab: TabEntry = { key: nextKey(tabs), target, ...meta }
					set(
						{ tabs: [...tabs, tab], activeKey: tab.key, recent: remember(get().recent, target) },
						false,
						'browser/open'
					)
				},
				openBlank: () => {
					const { tabs, activeKey } = get()
					const current = tabs.find((tab) => tab.key === activeKey)
					if (current?.target.kind === 'blank') return
					const tab: TabEntry = { key: nextKey(tabs), target: { kind: 'blank' } }
					set({ tabs: [...tabs, tab], activeKey: tab.key }, false, 'browser/openBlank')
				},
				navigate: (key, target, meta) => {
					if (target.kind === 'blank') return
					const { tabs } = get()
					if (!tabs.some((tab) => tab.key === key)) return
					/* 每一页都在自己的窗口里换内容，首页也是这样：首页被填上目标之后就是那一页，
					   再想回到新标签页，靠关掉所有页之后重新出现的首页 */
					set(
						{
							tabs: tabs.map((tab) =>
								tab.key === key ? { key: tab.key, target, title: meta?.title, icon: meta?.icon } : tab
							),
							recent: remember(get().recent, target)
						},
						false,
						'browser/navigate'
					)
				},
				close: (key) => {
					const { tabs, activeKey } = get()
					const index = tabs.findIndex((tab) => tab.key === key)
					if (index < 0) return
					/* 还是首页那一页时不可关：它换上了目标（成了普通一页）之后才能关 */
					if (tabs[index].target.kind === 'home') return
					const next = tabs.filter((tab) => tab.key !== key)
					/* 一个都不剩时首页重新出现：首页是空状态的落点 */
					if (next.length === 0) {
						set({ tabs: [HOME_TAB], activeKey: HOME_TAB.key }, false, 'browser/close')
						return
					}
					if (key !== activeKey) {
						set({ tabs: next }, false, 'browser/close')
						return
					}
					const fallback = next[index] ?? next[index - 1] ?? HOME_TAB
					set({ tabs: next, activeKey: fallback.key }, false, 'browser/close')
				},
				closeOthers: (key) => {
					const { tabs } = get()
					const kept = tabs.find((tab) => tab.key === key)
					if (!kept) return
					/* 留下的这一页若是首页那一格（key 为 home，目标可能已经换成别的），就是「关掉其余」；
					   否则首页也一并关掉，但空状态要有落点，所以把首页补回首位 */
					const next = kept.key === HOME_TAB.key ? [kept] : [HOME_TAB, kept]
					set({ tabs: next, activeKey: key }, false, 'browser/closeOthers')
				},
				closeAll: () => {
					const { tabs } = get()
					/* 只关得动普通页；首页那一格若已换上目标，就按空态的门重新放一个回去 */
					const next = tabs.filter((tab) => tab.target.kind === 'home')
					if (next.length === tabs.length) return
					const kept = next.length > 0 ? next : [HOME_TAB]
					set({ tabs: kept, activeKey: kept[0].key }, false, 'browser/closeAll')
				},
				move: (key, index) => {
					const { tabs } = get()
					const from = tabs.findIndex((tab) => tab.key === key)
					if (from < 0) return
					/* 落点必须是有限数：拿它去夹取会静默变成 0，等于把这一页挪到最前 */
					if (!Number.isFinite(index)) return
					const rest = tabs.filter((tab) => tab.key !== key)
					const to = Math.max(0, Math.min(rest.length, Math.trunc(index)))
					if (to === from) return
					const next = [...rest.slice(0, to), tabs[from], ...rest.slice(to)]
					set({ tabs: next }, false, 'browser/move')
				},
				activate: (key) => set({ activeKey: key }, false, 'browser/activate')
			}),
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
