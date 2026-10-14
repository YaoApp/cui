import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { IconId } from '@/platform/icons'
import { sameTarget, type TabTarget } from './targets'

/** 一页：`key` 在页的生命周期里不变，装什么由 `target` 决定（在页里打开什么就换成什么）。
    标签条上「先出现一项、随后内容变成目标」靠的就是这一条：页本身就是那一项，换的是内容。 */
export type TabEntry = {
	key: string
	target: TabTarget
	/** 标签上的名字与图形，由打开方给；不给时按目标推（见目标模块）。首页恒用 i-home。 */
	title?: string
	icon?: IconId
}

/** 首页：恒在第一位、不可关，也是所有可关闭的页都关掉之后落回的那一页。 */
export const HOME_TAB: TabEntry = { key: 'home', target: { kind: 'home' } }

export const tabKey = (tab: TabEntry): string => tab.key

export const isHome = (tab: TabEntry): boolean => tab.target.kind === 'home'

type OpenMeta = { title?: string; icon?: IconId }

type TabsState = {
	/** 打开的页，首页恒在第一位 */
	tabs: TabEntry[]
	activeKey: string
	/** 开一页：同一目标已在则切到它；不在则追加并停到它 */
	open: (target: TabTarget, meta?: OpenMeta) => void
	/** 新建一个空页并停到它；当前页已经是空页时只切回它，不再叠一个 */
	openBlank: () => void
	/** 在这一页里打开：页的 key 与位置都不变，只换装的内容 */
	navigate: (key: string, target: TabTarget, meta?: OpenMeta) => void
	/** 关一页：首页不可关；关的是当前页时按右邻优先、没有右邻取左邻、都没有落回首页 */
	close: (key: string) => void
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
				open: (target, meta) => {
					if (target.kind === 'blank') {
						get().openBlank()
						return
					}
					const { tabs } = get()
					const existing = tabs.find((tab) => sameTarget(tab.target, target))
					if (existing) {
						set({ activeKey: existing.key }, false, 'browser/open')
						return
					}
					const tab: TabEntry = { key: nextKey(tabs), target, ...meta }
					set({ tabs: [...tabs, tab], activeKey: tab.key }, false, 'browser/open')
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
					const page = tabs.find((tab) => tab.key === key)
					/* 首页不装别的内容：从首页打开的东西另开一页，首页始终是那一步的落点 */
					if (!page || page.target.kind === 'home') {
						get().open(target, meta)
						return
					}
					set(
						{
							tabs: tabs.map((tab) =>
								tab.key === key ? { key: tab.key, target, title: meta?.title, icon: meta?.icon } : tab
							)
						},
						false,
						'browser/navigate'
					)
				},
				close: (key) => {
					const { tabs, activeKey } = get()
					const index = tabs.findIndex((tab) => tab.key === key)
					if (index < 0) return
					const closing = tabs[index]
					if (isHome(closing)) return
					const next = tabs.filter((tab) => tab.key !== key)
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
				activate: (key) => set({ activeKey: key }, false, 'browser/activate')
			}),
			{
				name: 'cui.browser',
				version: 2,
				/* 只留数据，不收动作：打开的页与当前页记本机，换会话不清空 */
				partialize: (state) => ({ tabs: state.tabs, activeKey: state.activeKey }),
				/* 第一版记的是 `{ kind, id }`：首页照旧，外部页把地址搬进 target */
				migrate: (persisted, version) => {
					const state = persisted as { tabs?: unknown[]; activeKey?: string }
					if (version >= 2 || !Array.isArray(state.tabs)) return state as never
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
					return { tabs: withHome, activeKey } as never
				}
			}
		),
		{ name: 'browser' }
	)
)
