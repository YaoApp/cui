import { useEffect, useRef } from 'react'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import type { BrowserTab } from '../../types'
import { useTabDrag } from '../../hooks/use-tab-drag'
import { useTabOverflow } from '../../hooks/use-tab-overflow'
import { BrowserTabItem } from '../item'

export type BrowserTabsProps = {
	tabs: BrowserTab[]
	activeKey: string
	onActivate: (key: string) => void
	onClose: (key: string) => void
	onNew: () => void
	/** 拖动换序提交：索引按移除该项之后的数组算 */
	onReorder?: (key: string, index: number) => void
	/** 放不下、进下拉菜单的那些页，交给装配层渲染菜单上段；没有隐藏项时收到空数组 */
	onOverflowChange?: (hidden: BrowserTab[]) => void
}

/* 标签条：一行标签项加末尾的新建键，外面套一层裁切容器。
   放不下的标签由 data-hidden 收成不可见并脱离排布（仍然渲染，宽度量得到），
   它们进下拉菜单；新建键在预算里被预留，因此永远留得住。
   拖动换序在行上接指针事件，落点由插入指示线表达（见 hooks/use-tab-drag）。 */
export function BrowserTabs({
	tabs,
	activeKey,
	onActivate,
	onClose,
	onNew,
	onReorder,
	onOverflowChange
}: BrowserTabsProps) {
	const { t } = useTranslation()
	const { containerRef, overflow } = useTabOverflow(tabs, activeKey)
	const rowRef = useRef<HTMLDivElement>(null)
	const drag = useTabDrag({ rowRef, tabs, onReorder })
	const hiddenRef = useRef(overflow.hiddenTabs)
	hiddenRef.current = overflow.hiddenTabs
	const hiddenSignature = overflow.hiddenTabs.map((tab) => tab.key).join('|')

	useEffect(() => {
		onOverflowChange?.(hiddenRef.current)
	}, [hiddenSignature, onOverflowChange])

	return (
		<div className="browser__tabs" ref={containerRef}>
			<div
				className="browser__tabs-row"
				role="tablist"
				aria-label={t('shell.browser.label')}
				ref={rowRef}
				data-dragging={drag.dragging || undefined}
				onPointerDown={drag.onPointerDown}
				onPointerMove={drag.onPointerMove}
				onPointerUp={drag.onPointerUp}
				onPointerCancel={drag.onPointerCancel}
				onClickCapture={drag.onClickCapture}
			>
				{tabs.map((tab) => (
					<BrowserTabItem
						key={tab.key}
						tab={tab}
						active={tab.key === activeKey}
						hidden={!overflow.visibleKeys.includes(tab.key)}
						onActivate={onActivate}
						onClose={onClose}
					/>
				))}
				{/* 新建键恒在，紧跟最后一个可见标签：它在预算里被预留，因此不会被裁掉 */}
				<Tooltip label={t('shell.browser.tab.new')} side="bottom">
					<Button
						className="browser__new"
						iconOnly
						variant="plain"
						size="small"
						aria-label={t('shell.browser.tab.new')}
						onClick={onNew}
					>
						<Icon name="i-plus" size={16} />
					</Button>
				</Tooltip>
				{/* 插入指示线：拖动期间才在，位置由落点下标算出 */}
				{drag.indicator !== null ? (
					<span
						className="browser__tabs-indicator"
						aria-hidden="true"
						style={{ insetInlineStart: `${drag.indicator}px` }}
					/>
				) : null}
			</div>
		</div>
	)
}
