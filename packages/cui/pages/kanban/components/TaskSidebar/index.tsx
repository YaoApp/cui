import { useRef, useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import Icon from '@/widgets/Icon'
import TabContextMenu, { canOpenInNewWindow as baseCanOpen, getNewWindowUrl as baseGetUrl } from '@/widgets/TabContextMenu'
import type { SidebarTab } from '../../hooks/useSidebarTabs'
import styles from './index.less'

interface TaskSidebarProps {
	tabs: SidebarTab[]
	activeTabId: string | null
	activeTabUrl: string | null
	onTabChange: (tabId: string) => void
	onTabClose: (tabId: string) => void
	onCloseOtherTabs: () => void
	onCloseAllTabs: () => void
	onRefresh: () => void
	onClose: () => void
	children: React.ReactNode
}

const formatDisplayUrl = (url: string | null): string => {
	if (!url) return ''
	if (url.startsWith('__task/')) return url.replace('__task/', '')
	if (url.startsWith('$dashboard/')) return url.replace('$dashboard', '')
	return url
}

const canOpenInNewWindow = (url: string): boolean => {
	if (!url) return false
	if (url.startsWith('__task/') || url.startsWith('$dashboard/')) return false
	return baseCanOpen(url)
}

const TaskSidebar = ({
	tabs, activeTabId, activeTabUrl,
	onTabChange, onTabClose, onCloseOtherTabs, onCloseAllTabs, onRefresh, onClose,
	children
}: TaskSidebarProps) => {
	const tabBarRef = useRef<HTMLDivElement>(null)

	const [contextMenu, setContextMenu] = useState<{
		position: { x: number; y: number } | null
		tabId: string | null
	}>({ position: null, tabId: null })

	useEffect(() => {
		if (!activeTabId || !tabBarRef.current) return
		const el = tabBarRef.current.querySelector(`[data-tab-id="${activeTabId}"]`)
		el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
	}, [activeTabId])

	const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
		e.preventDefault()
		e.stopPropagation()
		setContextMenu({ position: { x: e.clientX, y: e.clientY }, tabId })
	}, [])

	const closeContextMenu = useCallback(() => {
		setContextMenu({ position: null, tabId: null })
	}, [])

	const handleCloseTab = useCallback(() => {
		if (contextMenu.tabId) onTabClose(contextMenu.tabId)
	}, [contextMenu.tabId, onTabClose])

	const handleRefresh = useCallback(() => {
		if (contextMenu.tabId) {
			if (contextMenu.tabId !== activeTabId) onTabChange(contextMenu.tabId)
			onRefresh()
		}
	}, [contextMenu.tabId, activeTabId, onTabChange, onRefresh])

	const handleOpenInNewWindow = useCallback(() => {
		if (contextMenu.tabId) {
			const tab = tabs.find((t) => t.id === contextMenu.tabId)
			if (tab && canOpenInNewWindow(tab.url)) {
				window.open(baseGetUrl(tab.url), '_blank')
			}
		}
	}, [contextMenu.tabId, tabs])

	const contextTab = contextMenu.tabId ? tabs.find((t) => t.id === contextMenu.tabId) : null
	const showOpenInNewWindow = contextTab ? canOpenInNewWindow(contextTab.url) : false

	return (
		<div className={styles.sidebar}>
			<div className={styles.tabBar}>
				<div ref={tabBarRef} className={styles.tabList}>
					{tabs.map((tab) => (
						<div
							key={tab.id}
							data-tab-id={tab.id}
							className={clsx(styles.tab, tab.id === activeTabId && styles.active)}
							onClick={() => onTabChange(tab.id)}
							onContextMenu={(e) => handleContextMenu(e, tab.id)}
							title={tab.title}
						>
							{tab.icon && <Icon name={tab.icon} size={14} />}
							<span className={styles.tabTitle}>{tab.title}</span>
							<span
								className={styles.tabClose}
								onClick={(e) => {
									e.stopPropagation()
									onTabClose(tab.id)
								}}
							>
								<Icon name='material-close' size={12} />
							</span>
						</div>
					))}
				</div>
				<div className={styles.closeBtnWrap}>
					<span className={styles.closeBtn} onClick={onClose}>
						<Icon name='material-close' size={16} />
					</span>
				</div>
			</div>
			<div className={styles.addressBar}>
				<Icon name='material-link' size={12} className={styles.addressIcon} />
				<input
					className={styles.addressInput}
					value={formatDisplayUrl(activeTabUrl)}
					readOnly
					title={activeTabUrl || ''}
				/>
			</div>
			<div className={styles.content}>{children}</div>
			{createPortal(
				<TabContextMenu
					position={contextMenu.position}
					onClose={closeContextMenu}
					onRefresh={handleRefresh}
					onCloseTab={handleCloseTab}
					onCloseOthers={onCloseOtherTabs}
					onCloseAll={onCloseAllTabs}
					onOpenInNewWindow={handleOpenInNewWindow}
					disableCloseTab={tabs.length === 0}
					disableCloseOthers={tabs.length <= 1}
					disableCloseAll={tabs.length === 0}
				showOpenInNewWindow={showOpenInNewWindow}
				/>,
				document.body
			)}
		</div>
	)
}

export default window.$app.memo(TaskSidebar)
