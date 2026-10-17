import type { IconId } from '@/platform/icons'
import { sameTarget, targetKey, targetLabel, type TabTarget } from './targets'

/** 一页：`key` 在页的生命周期里不变，装什么由 `target` 决定（在页里打开什么就换成什么）。 */
export type TabEntry = {
	key: string
	target: TabTarget
	/** 标签上的名字与图形，由打开方给；不给时按目标推（见目标模块）。首页恒用 i-home。 */
	title?: string
	icon?: IconId
}

/** 首页：空状态的落点。还是首页那一页时不可关；它换上目标成了普通一页之后就能关，
    关到一个都不剩时首页重新出现（主栏用；新栏的首页可关，见 secondary）。 */
export const HOME_TAB: TabEntry = { key: 'home', target: { kind: 'home' } }

export type RecentEntry = { key: string; target: TabTarget; label: string }

export type GroupState = {
	tabs: TabEntry[]
	activeKey: string
	recent: RecentEntry[]
}

export type OpenMeta = { title?: string; icon?: IconId }

/** 「打开过」保留的条数 */
const RECENT_LIMIT = 8

export const tabKey = (tab: TabEntry): string => tab.key

export const isHome = (tab: TabEntry): boolean => tab.target.kind === 'home'

/* key 的分配器两组共用：主栏与新栏同时存在时 key 不能撞，首页键也各自唯一。
   计数器是模块级的，但只经这一个函数改，测试里可以按前缀断言。 */
let serial = 0
export const nextKey = (tabs: TabEntry[], prefix = 'page'): string => {
	let key = ''
	do {
		serial += 1
		key = `${prefix}-${serial}`
	} while (tabs.some((tab) => tab.key === key))
	return key
}

/** 记一条「打开过」：同一目标已经在就提到最前，超出上限的从末尾去掉 */
export const rememberIn = (recent: RecentEntry[], target: TabTarget): RecentEntry[] => {
	if (target.kind === 'home' || target.kind === 'blank') return recent
	const entry: RecentEntry = { key: targetKey(target), target, label: targetLabel(target) }
	return [entry, ...recent.filter((item) => !sameTarget(item.target, target))].slice(0, RECENT_LIMIT)
}

/** 组为空时给出首页组，非空原样返回 */
export const homeIn = (group: GroupState, home: TabEntry = HOME_TAB): GroupState =>
	group.tabs.length > 0 ? group : { ...group, tabs: [home], activeKey: home.key }

/** 追加并激活一页；key 由调用方给（经 `nextKey` 或首页键） */
export const appendIn = (group: GroupState, tab: TabEntry): GroupState => ({
	...group,
	tabs: [...group.tabs, tab],
	activeKey: tab.key
})

/** 把某一页换成新目标；同目标已在别页则关掉本页并激活那一页 */
export const navigateIn = (
	group: GroupState,
	key: string,
	target: TabTarget,
	meta?: OpenMeta
): GroupState => {
	if (target.kind === 'blank') return group
	if (!group.tabs.some((tab) => tab.key === key)) return group
	const existing = group.tabs.find((tab) => tab.key !== key && sameTarget(tab.target, target))
	if (existing) {
		return {
			...group,
			tabs: group.tabs.filter((tab) => tab.key !== key),
			activeKey: existing.key,
			recent: rememberIn(group.recent, target)
		}
	}
	return {
		...group,
		tabs: group.tabs.map((tab) =>
			tab.key === key ? { key: tab.key, target, title: meta?.title, icon: meta?.icon } : tab
		),
		recent: rememberIn(group.recent, target)
	}
}

/** 关一页：活动页关掉时按右邻优先、没有右邻取左邻；`keepHome` 为真时首页那一格不可关 */
export const closeIn = (
	group: GroupState,
	key: string,
	options: { keepHome?: boolean; home?: TabEntry } = {}
): GroupState => {
	const home = options.home ?? HOME_TAB
	const index = group.tabs.findIndex((tab) => tab.key === key)
	if (index < 0) return group
	if (options.keepHome !== false && group.tabs[index].target.kind === 'home') return group
	const next = group.tabs.filter((tab) => tab.key !== key)
	if (next.length === 0) {
		/* 主栏关空后首页重新出现；新栏关空就是空，由分栏层决定关分栏 */
		return options.keepHome === false
			? { ...group, tabs: [], activeKey: '' }
			: { ...group, tabs: [home], activeKey: home.key }
	}
	if (key !== group.activeKey) return { ...group, tabs: next }
	const fallback = next[index] ?? next[index - 1] ?? home
	return { ...group, tabs: next, activeKey: fallback.key }
}

/** 只留这一页；主栏在留下的一页不是首页时把首页补回首位，新栏不补 */
export const closeOthersIn = (
	group: GroupState,
	key: string,
	options: { keepHome?: boolean; home?: TabEntry } = {}
): GroupState => {
	const home = options.home ?? HOME_TAB
	const kept = group.tabs.find((tab) => tab.key === key)
	if (!kept) return group
	const next = options.keepHome === false ? [kept] : kept.key === home.key ? [kept] : [home, kept]
	return { ...group, tabs: next, activeKey: key }
}

/** 关掉所有能关的页；主栏保留首页那一格并补回首位的首页，新栏关空就是空 */
export const closeAllIn = (
	group: GroupState,
	options: { keepHome?: boolean; home?: TabEntry } = {}
): GroupState => {
	const home = options.home ?? HOME_TAB
	if (options.keepHome === false) return { ...group, tabs: [], activeKey: '' }
	const next = group.tabs.filter((tab) => tab.target.kind === 'home')
	if (next.length === group.tabs.length) return group
	const kept = next.length > 0 ? next : [home]
	return { ...group, tabs: kept, activeKey: kept[0].key }
}

/** 组内排序：索引按**移除该项之后**的数组算，越界夹到 0 与长度之间 */
export const moveIn = (group: GroupState, key: string, index: number): GroupState => {
	const from = group.tabs.findIndex((tab) => tab.key === key)
	if (from < 0) return group
	if (!Number.isFinite(index)) return group
	const rest = group.tabs.filter((tab) => tab.key !== key)
	const to = Math.max(0, Math.min(rest.length, Math.trunc(index)))
	if (to === from) return group
	return { ...group, tabs: [...rest.slice(0, to), group.tabs[from], ...rest.slice(to)] }
}

/** 只改活动页；目标页不存在时不动作 */
export const activateIn = (group: GroupState, key: string): GroupState =>
	group.tabs.some((tab) => tab.key === key) ? { ...group, activeKey: key } : group
