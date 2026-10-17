import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { IconId } from '@/platform/icons'
import { sameTarget, targetKey, targetLabel, type TabTarget } from './targets'
import { HOME_TAB, type TabEntry, type RecentEntry } from './tabs'

/** 第二栏自己的一组标签：与主栏完全独立，各有活动页与「打开过」。
    分栏未开时这一组为空；开分栏时装配层放一张首页进来，保证第二栏永远有内容。 */

type OpenMeta = { title?: string; icon?: IconId }

const RECENT_LIMIT = 8

const remember = (recent: RecentEntry[], target: TabTarget): RecentEntry[] => {
	if (target.kind === 'home' || target.kind === 'blank') return recent
	const entry: RecentEntry = { key: targetKey(target), target, label: targetLabel(target) }
	return [entry, ...recent.filter((item) => !sameTarget(item.target, target))].slice(0, RECENT_LIMIT)
}

type SecondaryState = {
	tabs: TabEntry[]
	activeKey: string
	recent: RecentEntry[]
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
	/** 清空这一组（关分栏、合并之后） */
	clear: () => void
}

let serial = 0
const nextKey = (tabs: TabEntry[]): string => {
	let key = ''
	do {
		serial += 1
		key = `secondary-${serial}`
	} while (tabs.some((tab) => tab.key === key))
	return key
}

/** 关一页：关的是活动页时取剩余最后一项；关空时返回空组，由装配层决定关分栏 */
const without = (tabs: TabEntry[], activeKey: string, key: string) => {
	const kept = tabs.filter((tab) => tab.key !== key)
	if (kept.length === 0) return { tabs: kept, activeKey: '' }
	return { tabs: kept, activeKey: kept.some((tab) => tab.key === activeKey) ? activeKey : kept[kept.length - 1].key }
}

export const useSecondaryTabsStore = create<SecondaryState>()(
	devtools(
		persist(
			(set, get) => ({
				tabs: [],
				activeKey: '',
				recent: [],
				seed: () => {
					if (get().tabs.length > 0) return
					set({ tabs: [HOME_TAB], activeKey: HOME_TAB.key }, false, 'secondary/seed')
				},
				clear: () => set({ tabs: [], activeKey: '', recent: [] }, false, 'secondary/clear'),
				open: (target, meta) => {
					if (target.kind === 'blank') {
						get().openBlank()
						return
					}
					const { tabs } = get()
					const existing = tabs.find((tab) => sameTarget(tab.target, target))
					if (existing) {
						set({ activeKey: existing.key, recent: remember(get().recent, target) }, false, 'secondary/open')
						return
					}
					const tab: TabEntry = { key: nextKey(tabs), target, ...meta }
					set(
						{ tabs: [...tabs, tab], activeKey: tab.key, recent: remember(get().recent, target) },
						false,
						'secondary/open'
					)
				},
				openBlank: () => {
					const { tabs, activeKey } = get()
					const current = tabs.find((tab) => tab.key === activeKey)
					if (current?.target.kind === 'blank') return
					const tab: TabEntry = { key: nextKey(tabs), target: { kind: 'blank' } }
					set({ tabs: [...tabs, tab], activeKey: tab.key }, false, 'secondary/openBlank')
				},
				navigate: (key, target, meta) => {
					if (target.kind === 'blank') return
					const { tabs } = get()
					if (!tabs.some((tab) => tab.key === key)) return
					const existing = tabs.find((tab) => tab.key !== key && sameTarget(tab.target, target))
					if (existing) {
						set(without(tabs, key, key), false, 'secondary/navigate')
						set({ activeKey: existing.key }, false, 'secondary/navigate')
						return
					}
					set(
						{
							tabs: tabs.map((tab) => (tab.key === key ? { ...tab, target, ...meta } : tab)),
							recent: remember(get().recent, target)
						},
						false,
						'secondary/navigate'
					)
				},
				close: (key) => set(without(get().tabs, get().activeKey, key), false, 'secondary/close'),
				closeOthers: (key) => {
					const { tabs } = get()
					const kept = tabs.filter((tab) => tab.key === key)
					if (kept.length === 0) return
					set({ tabs: kept, activeKey: kept[0].key }, false, 'secondary/closeOthers')
				},
				closeAll: () => set({ tabs: [], activeKey: '' }, false, 'secondary/closeAll'),
				move: (key, index) => {
					const { tabs } = get()
					const from = tabs.findIndex((tab) => tab.key === key)
					if (from < 0) return
					const rest = tabs.filter((tab) => tab.key !== key)
					const next = Math.max(0, Math.min(rest.length, index))
					rest.splice(next, 0, tabs[from])
					set({ tabs: rest }, false, 'secondary/move')
				},
				activate: (key) => {
					if (!get().tabs.some((tab) => tab.key === key)) return
					set({ activeKey: key }, false, 'secondary/activate')
				}
			}),
			{
				name: 'cui.browser.secondary',
				version: 1,
				partialize: (state) => ({ tabs: state.tabs, activeKey: state.activeKey, recent: state.recent })
			}
		),
		{ name: 'secondary' }
	)
)
