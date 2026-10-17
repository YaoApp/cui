import { useState, type CSSProperties, type ReactNode } from 'react'
import { ScrollArea } from '@/components/base/scroll-area'
import { useTabOverflow } from '../../hooks/use-tab-overflow'
import { BrowserTabs } from '../tabs'
import { TabContextMenu, TabOverflowMenu, type TabMenuActions } from '../tab-menu'
import type { BrowserTab } from '../../types'
import './secondary-pane.less'

export type SecondaryPaneProps = {
	/** 这一栏自己的标签与活动页 */
	tabs: BrowserTab[]
	activeKey: string
	/** 本组标识前缀：标签 id 与面板 id 由它派生，与主栏不撞 */
	idPrefix: string
	onActivate: (key: string) => void
	onClose: (key: string) => void
	onNew: () => void
	onReorder: (key: string, index: number) => void
	/** 本栏标签的刷新、关闭其它、关闭全部，只作用于本栏 */
	menuActions: Omit<TabMenuActions, 'onActivate' | 'onClose'>
	/** 上下分栏时标签条画在栏顶；左右分栏时标签条在顶栏，这里只画页面 */
	showStrip: boolean
	/** 本栏的尺寸：左右分栏给宽度、上下分栏给高度，取补出来的那一份 */
	size?: CSSProperties
	children: ReactNode
}

/** 第二栏的页面区域。左右分栏时它只有页面、标签条在顶栏左段（菜单也在那里）；
    上下分栏时它自己画标签条与两套菜单，只服务本栏这一组标签。 */
export function SecondaryPane({
	tabs,
	activeKey,
	idPrefix,
	onActivate,
	onClose,
	onNew,
	onReorder,
	menuActions,
	showStrip,
	size,
	children
}: SecondaryPaneProps) {
	const { containerRef, overflow } = useTabOverflow(tabs, activeKey)
	const [tabMenu, setTabMenu] = useState<{ key: string; point: { x: number; y: number } } | null>(null)
	const actions: TabMenuActions = { onActivate, onClose, ...menuActions }
	const contextTab = tabMenu ? (tabs.find((tab) => tab.key === tabMenu.key) ?? null) : null
	return (
		<div className="browser__pane browser__pane--secondary" style={size}>
			{showStrip ? (
				<div className="browser__pane-strip">
					<BrowserTabs
						group="secondary"
						idPrefix={idPrefix}
						tabs={tabs}
						activeKey={activeKey}
						containerRef={containerRef}
						visibleKeys={overflow.visibleKeys}
						onActivate={onActivate}
						onClose={onClose}
						onNew={onNew}
						onReorder={onReorder}
						onTabContextMenu={(key, point) => setTabMenu({ key, point })}
					/>
					<TabOverflowMenu hiddenTabs={overflow.hiddenTabs} actions={actions} label={activeKey} />
				</div>
			) : null}
			<ScrollArea
				className="browser__page"
				size="medium"
				persistent
				/* 新栏这一块也是被控面板：id 用新栏前缀，标签的 aria-controls 指到这里 */
				id={`${idPrefix}-panel`}
				role="tabpanel"
				aria-labelledby={`${idPrefix}-tab-${activeKey}`}
			>
				{children}
			</ScrollArea>
			{contextTab ? (
				<TabContextMenu
					tab={contextTab}
					point={tabMenu?.point ?? null}
					actions={actions}
					onOpenChange={(open) => {
						if (!open) setTabMenu(null)
					}}
				/>
			) : null}
		</div>
	)
}
