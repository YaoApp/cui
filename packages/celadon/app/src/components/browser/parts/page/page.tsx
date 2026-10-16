import type { TabEntry } from '@/stores/browser/tabs'
import { Internal } from '../internal'
import { NewTab, type NewTabRecent } from '../new-tab'
import { Web } from '../web'

export type TabPageProps = {
	/** 要渲染的那一页 */
	tab: TabEntry
	/** 新标签页上的"打开过的东西" */
	recent: NewTabRecent[]
	/** 这一页里的地址入口提交了一段输入 */
	onOpen: (input: string) => void
	/** 「打开过的东西」里点了一条：按键复用同一页打开 */
	onOpenRecent?: (key: string) => void
	/** 地址入口的校验：判据由装配层给 */
	validateAddress?: (input: string) => 'empty' | 'invalid' | null
}

/* 一页内容的派发：按页的目标选内容组件。首页与新标签页共用同一个组件，
   外部网址与内部路由（含快捷方式）各有自己的内容组件。
   内容组件只认自己的入参，标签模型与打开动作由装配层接（见 routes/layout.tsx）。 */
export function TabPage({ tab, recent, onOpen, onOpenRecent, validateAddress }: TabPageProps) {
	const target = tab.target
	if (target.kind === 'home' || target.kind === 'blank') {
		return (
			<NewTab
				recent={recent}
				onOpen={onOpen}
				onOpenRecent={onOpenRecent}
				validate={validateAddress}
			/>
		)
	}
	if (target.kind === 'external') return <Web address={target.url} />
	return <Internal path={target.path} />
}
