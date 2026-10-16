import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import type { BrowserTab } from '../../types'
import { useTabDrag } from '../../hooks/use-tab-drag'
import { BrowserTabItem } from '../item'

export type BrowserTabsProps = {
	tabs: BrowserTab[]
	activeKey: string
	/** 裁切容器：溢出测量挂在这一层，由装配层创建并传下来 */
	containerRef: RefObject<HTMLDivElement | null>
	/** 从头开始能放下的那些页；其余由装配层放进下拉菜单 */
	visibleKeys: string[]
	onActivate: (key: string) => void
	onClose: (key: string) => void
	onNew: () => void
	/** 拖动换序提交：索引按移除该项之后的数组算 */
	onReorder?: (key: string, index: number) => void
	/** 在标签上点右键：把点的是哪一页与指针位置交给装配层去开菜单 */
	onTabContextMenu?: (key: string, point: { x: number; y: number }) => void
}

/* 标签条：一行标签项加末尾的新建键，外面套一层裁切容器。
   放不下的标签由 data-hidden 收成不可见并脱离排布（仍然渲染，宽度量得到），
   它们由装配层放进下拉菜单；新建键在预算里被预留，因此永远留得住。
   拖动换序在行上接指针事件，落点由插入指示线表达（见 hooks/use-tab-drag）。 */
export function BrowserTabs({
	tabs,
	activeKey,
	containerRef,
	visibleKeys,
	onActivate,
	onClose,
	onNew,
	onReorder,
	onTabContextMenu
}: BrowserTabsProps) {
	const { t } = useTranslation()
	const rowRef = useRef<HTMLDivElement>(null)
	const drag = useTabDrag({ rowRef, tabs, onReorder })
	/* roving tabindex：整条只有一个标签可 Tab 到，落点是当前页 */
	const [focusKey, setFocusKey] = useState(activeKey)
	const visibleTabs = tabs.filter((tab) => visibleKeys.includes(tab.key))

	const focusTab = (key: string) => {
		setFocusKey(key)
		rowRef.current
			?.querySelector<HTMLElement>(`[data-tab-key="${key}"] .browser__tab-main`)
			?.focus()
	}

	/* 当前页一变（点选、关闭、新开、换序）落点就跟着它；行里本来有焦点时把焦点也带过去 */
	useEffect(() => {
		setFocusKey(activeKey)
		const row = rowRef.current
		if (row?.contains(document.activeElement)) {
			row.querySelector<HTMLElement>(`[data-tab-key="${activeKey}"] .browser__tab-main`)?.focus()
		}
	}, [activeKey])

	/* 键盘路径：左右箭头挪落点，Enter 与 Space 激活，Delete 关闭，Alt 加左右箭头在整表里挪一位。
	   激活与换焦点分开：箭头只挪焦点，不换页。 */
	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		const index = visibleTabs.findIndex((tab) => tab.key === focusKey)
		if (index < 0) return
		const current = visibleTabs[index]
		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			const step = event.key === 'ArrowRight' ? 1 : -1
			if (event.altKey) {
				if (!onReorder) return
				event.preventDefault()
				const from = tabs.findIndex((tab) => tab.key === focusKey)
				if (from < 0) return
				onReorder(focusKey, from + step)
				/* 换序会把节点重新插入，焦点会掉，下一帧挪回来 */
				requestAnimationFrame(() => focusTab(focusKey))
				return
			}
			const next = visibleTabs[index + step]
			if (!next) return
			event.preventDefault()
			focusTab(next.key)
			return
		}
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			onActivate(current.key)
			return
		}
		if (event.key === 'Delete' && current.closable) {
			event.preventDefault()
			onClose(current.key)
		}
	}

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
				onKeyDown={onKeyDown}
				onContextMenu={(event) => {
					const key = (event.target as HTMLElement).closest<HTMLElement>('.browser__tab')?.dataset
						.tabKey
					if (!key || !onTabContextMenu) return
					event.preventDefault()
					onTabContextMenu(key, { x: event.clientX, y: event.clientY })
				}}
			>
				{tabs.map((tab) => (
					<BrowserTabItem
						key={tab.key}
						tab={tab}
						active={tab.key === activeKey}
						hidden={!visibleKeys.includes(tab.key)}
						tabIndex={tab.key === focusKey ? 0 : -1}
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
