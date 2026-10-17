import type { CSSProperties, ReactNode } from 'react'
import { ScrollArea } from '@/components/base/scroll-area'
import { useTabOverflow } from '../../hooks/use-tab-overflow'
import { BrowserTabs } from '../tabs'
import type { BrowserTab } from '../../types'
import './secondary-pane.less'

export type SecondaryPaneProps = {
	/** 这一栏自己的标签与活动页 */
	tabs: BrowserTab[]
	activeKey: string
	onActivate: (key: string) => void
	onClose: (key: string) => void
	onNew: () => void
	onReorder: (key: string, index: number) => void
	/** 指针在本栏按下：把焦点栏切到这一栏 */
	onFocus: () => void
	focused: boolean
	/** 本栏的尺寸：左右分栏给宽度、上下分栏给高度，取补出来的那一份 */
	size?: CSSProperties
	children: ReactNode
}

/** 第二栏：自己的标签条（画在栏内、紧贴分隔条那一侧）加自己的页面。
    标签条与主栏共用同一个组件，差别只在本栏顶部且不带分栏键与收起键，那两颗固定在顶栏。 */
export function SecondaryPane({
	tabs,
	activeKey,
	onActivate,
	onClose,
	onNew,
	onReorder,
	onFocus,
	focused,
	size,
	children
}: SecondaryPaneProps) {
	const { containerRef, overflow } = useTabOverflow(tabs, activeKey)
	return (
		<div
			className="browser__pane browser__pane--secondary"
			data-focused={focused || undefined}
			style={size}
			onPointerDown={onFocus}
		>
			<div className="browser__pane-strip">
				<BrowserTabs
					tabs={tabs}
					activeKey={activeKey}
					containerRef={containerRef}
					visibleKeys={overflow.visibleKeys}
					onActivate={onActivate}
					onClose={onClose}
					onNew={onNew}
					onReorder={onReorder}
				/>
			</div>
			<ScrollArea className="browser__page" size="medium" persistent>
				{children}
			</ScrollArea>
		</div>
	)
}
