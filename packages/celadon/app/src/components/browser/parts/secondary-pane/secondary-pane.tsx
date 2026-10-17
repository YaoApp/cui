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
	/** 上下分栏时标签条画在栏顶；左右分栏时标签条在顶栏，这里只画页面 */
	showStrip: boolean
	/** 本栏的尺寸：左右分栏给宽度、上下分栏给高度，取补出来的那一份 */
	size?: CSSProperties
	children: ReactNode
}

/** 第二栏的页面区域。左右分栏时它只有页面，标签条在顶栏左段；
    上下分栏时它自己画标签条（与主栏同一条组件，只属于本栏）。 */
export function SecondaryPane({
	tabs,
	activeKey,
	onActivate,
	onClose,
	onNew,
	onReorder,
	onFocus,
	focused,
	showStrip,
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
			{showStrip ? (
				<div className="browser__pane-strip">
					<BrowserTabs
						group="secondary"
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
			) : null}
			<ScrollArea className="browser__page" size="medium" persistent>
				{children}
			</ScrollArea>
		</div>
	)
}
