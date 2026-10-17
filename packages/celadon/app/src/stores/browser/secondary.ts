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
	moveIn,
	navigateIn,
	nextKey,
	rememberIn,
	type GroupState,
	type OpenMeta,
	type RecentEntry,
	type TabEntry
} from './tab-group'

/** 第二栏自己的一组标签：与主栏完全独立，各有活动页与「打开过」。
    分栏未开时这一组为空；开分栏时 `seed()` 放一张首页进来，保证新栏永远有内容。
    与主栏的差别只有一条：这里首页**可关**，关空就是空，由分栏层决定关掉分栏。 */

type SecondaryState = GroupState & {
	open: (target: TabTarget, meta?: OpenMeta) => void
	openBlank: () => void
	navigate: (key: string, target: TabTarget, meta?: OpenMeta) => void
	close: (key: string) => void
	closeOthers: (key: string) => void
	closeAll: () => void
	move: (key: string, index: number) => void
	activate: (key: string) => void
	/** 开分栏时放一张首页进来；已经非空时不动 */
	seed: () => void
	/** 清空这一组（合并进主栏之后）；「打开过」保留 */
	clear: () => void
}

const pick = (state: SecondaryState): GroupState => ({
	tabs: state.tabs,
	activeKey: state.activeKey,
	recent: state.recent
})

export const useSecondaryTabsStore = create<SecondaryState>()(
	devtools(
		persist(
			(set, get) => {
				const apply = (next: GroupState, action: string) =>
					set({ tabs: next.tabs, activeKey: next.activeKey, recent: next.recent }, false, action)
				return {
					tabs: [],
					activeKey: '',
					recent: [],
					seed: () => {
						if (get().tabs.length > 0) return
						apply({ tabs: [HOME_TAB], activeKey: HOME_TAB.key, recent: get().recent }, 'secondary/seed')
					},
					clear: () => set({ tabs: [], activeKey: '', recent: get().recent }, false, 'secondary/clear'),
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
								'secondary/open'
							)
							return
						}
						const opened = appendIn(pick(state), { key: nextKey(state.tabs), target, ...meta })
						apply({ ...opened, recent: rememberIn(state.recent, target) }, 'secondary/open')
					},
					openBlank: () => {
						const state = get()
						const current = state.tabs.find((tab) => tab.key === state.activeKey)
						if (current?.target.kind === 'blank') return
						apply(appendIn(pick(state), { key: nextKey(state.tabs), target: { kind: 'blank' } }), 'secondary/openBlank')
					},
					navigate: (key, target, meta) =>
						apply(navigateIn(pick(get()), key, target, meta), 'secondary/navigate'),
					close: (key) => apply(closeIn(pick(get()), key, { keepHome: false }), 'secondary/close'),
					closeOthers: (key) =>
						apply(closeOthersIn(pick(get()), key, { keepHome: false }), 'secondary/closeOthers'),
					closeAll: () => apply(closeAllIn(pick(get()), { keepHome: false }), 'secondary/closeAll'),
					move: (key, index) => apply(moveIn(pick(get()), key, index), 'secondary/move'),
					activate: (key) => apply(activateIn(pick(get()), key), 'secondary/activate')
				}
			},
			{
				name: 'cui.browser.secondary',
				/* 第二版：回退前那一版用过同一个键（首页不可关、key 带 secondary- 前缀），
				   升级时只认活动页仍存在的数据，其余一律按空组处理，不让标签条停在无选中态 */
				version: 2,
				partialize: (state) => ({
					tabs: state.tabs,
					activeKey: state.activeKey,
					recent: state.recent
				}),
				migrate: (persisted) => {
					const state = persisted as { tabs?: unknown[]; activeKey?: string; recent?: unknown }
					const recent = Array.isArray(state.recent) ? (state.recent as RecentEntry[]) : []
					const tabs = Array.isArray(state.tabs) ? (state.tabs as TabEntry[]) : []
					const activeKey =
						state.activeKey && tabs.some((tab) => tab.key === state.activeKey)
							? state.activeKey
							: (tabs[0]?.key ?? '')
					return { tabs, activeKey, recent } as never
				}
			}
		),
		{ name: 'secondary' }
	)
)

/** 这一组是不是空的（分栏层据此关分栏）。种子放进来的首页算有内容，
    只有真的关到一个不剩才算空 */
export const isEmpty = (state: { tabs: TabEntry[] }): boolean => state.tabs.length === 0
