import React, { useRef, useEffect, useCallback, useState } from 'react'
import clsx from 'clsx'
import { getLocale } from '@umijs/max'
import Icon from '../../../widgets/Icon'
import TabMenu from '../TabMenu'
import TabContextMenu from '../../../widgets/TabContextMenu'
import type { IHeaderProps } from '../../types'
import styles from './index.less'

const Header = (props: IHeaderProps) => {
	const {
		mode,
		title,
		className,
		onNewChat,
		tabs,
		activeTabId,
		onTabChange,
		onTabClose,
		onCloseOthers,
		onCloseAll,
		historyOpen,
		onHistoryClick
	} = props

	const tabsRef = useRef<HTMLDivElement>(null)
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Context menu state
	const [contextMenu, setContextMenu] = useState<{
		position: { x: number; y: number } | null
		tabId: string | null
	}>({ position: null, tabId: null })

	// Helper to scroll active tab into view
	const scrollToActive = useCallback(() => {
		if (tabsRef.current) {
			const activeTab = tabsRef.current.querySelector(`.${styles.active}`) as HTMLElement
			if (activeTab) {
				activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
			}
		}
	}, [])

	// Scroll when activeTabId changes
	useEffect(() => {
		scrollToActive()
	}, [activeTabId, scrollToActive])

	// Observe container resize to keep active tab visible
	useEffect(() => {
		const container = tabsRef.current
		if (!container) return

		const observer = new ResizeObserver(() => {
			scrollToActive()
		})

		observer.observe(container)

		return () => observer.disconnect()
	}, [scrollToActive])

	const handleWheel = (e: React.WheelEvent) => {
		if (tabsRef.current) {
			tabsRef.current.scrollLeft += e.deltaY
		}
	}

	// Handle tab context menu (right click)
	const handleTabContextMenu = (e: React.MouseEvent, tabId: string) => {
		e.preventDefault()
		e.stopPropagation()
		setContextMenu({
			position: { x: e.clientX, y: e.clientY },
			tabId
		})
	}

	// Close context menu
	const closeContextMenu = useCallback(() => {
		setContextMenu({ position: null, tabId: null })
	}, [])

	// Context menu actions
	const handleContextCloseTab = useCallback(() => {
		if (contextMenu.tabId) {
			onTabClose?.(contextMenu.tabId)
		}
	}, [contextMenu.tabId, onTabClose])

	const handleContextCloseOthers = useCallback(() => {
		onCloseOthers?.()
	}, [onCloseOthers])

	const handleContextCloseAll = useCallback(() => {
		onCloseAll?.()
	}, [onCloseAll])

	return (
		<div className={clsx(styles.container, className)}>
			{mode === 'tabs' && (
				<div className={styles.leftSection}>
					{/* History button before tabs */}
					<div className={styles.historyBtn} onClick={onHistoryClick} title='History'>
						<Icon name={historyOpen ? 'material-menu_open' : 'material-menu'} size={18} />
					</div>

					<div className={styles.tabs} ref={tabsRef} onWheel={handleWheel}>
						{tabs?.map((tab) => (
							<div
								key={tab.chatId}
								className={clsx(
									styles.tab,
									tab.chatId === activeTabId && styles.active
								)}
								onClick={() => onTabChange?.(tab.chatId)}
								onContextMenu={(e) => handleTabContextMenu(e, tab.chatId)}
								title={tab.title}
							>
								{tab.streaming && <span className={styles.streamingIndicator} />}
								<span className={styles.tabTitle}>{tab.title}</span>
								<span
									className={styles.closeIcon}
									onClick={(e) => {
										e.stopPropagation()
										onTabClose?.(tab.chatId)
									}}
								>
									<Icon name='material-close' size={14} />
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{mode === 'single' && <div className={styles.singleTitle}>{title || 'Chat'}</div>}

			<div className={styles.actions}>
				<div className={styles.iconBtn} onClick={onNewChat} title='New Chat'>
					<Icon name='material-add' size={18} />
				</div>
				{mode === 'tabs' && (
					<TabMenu
						onCloseTab={() => activeTabId && onTabClose?.(activeTabId)}
						onCloseOthers={onCloseOthers}
						onCloseAll={onCloseAll}
						disableCloseTab={!activeTabId || (tabs?.length || 0) === 0}
						disableCloseOthers={(tabs?.length || 0) <= 1}
						disableCloseAll={(tabs?.length || 0) === 0}
					/>
				)}
			</div>

			{/* Tab Context Menu */}
			<TabContextMenu
				position={contextMenu.position}
				onClose={closeContextMenu}
				onCloseTab={handleContextCloseTab}
				onCloseOthers={handleContextCloseOthers}
				onCloseAll={handleContextCloseAll}
				disableCloseTab={(tabs?.length || 0) === 0}
				disableCloseOthers={(tabs?.length || 0) <= 1}
				disableCloseAll={(tabs?.length || 0) === 0}
				labels={{
					closeTab: is_cn ? '关闭当前会话' : 'Close Chat',
					closeOthers: is_cn ? '关闭其他会话' : 'Close Other Chats',
					closeAll: is_cn ? '关闭全部会话' : 'Close All Chats'
				}}
			/>
		</div>
	)
}

export default Header
