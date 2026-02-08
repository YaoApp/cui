import { Tooltip } from 'antd'
import { FC, useRef, useEffect, useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import Icon from '@/widgets/Icon'
import TabContextMenu, { canOpenInNewWindow, getNewWindowUrl } from '@/widgets/TabContextMenu'
import clsx from 'clsx'
import './header.less'
import { getLocale, useNavigate } from '@umijs/max'
import type { SidebarTab } from './types'

interface HeaderProps {
	openSidebar: (temporaryLink?: string, title?: string) => void
	closeSidebar: () => void
	/** @deprecated Use tabs instead */
	isTemporaryView?: boolean
	/** @deprecated Use tabs instead */
	currentPageName?: string
	/** @deprecated Use tabs instead */
	temporaryLink?: string
	/** @deprecated Use tabs instead */
	onBackToNormal?: () => void
	/** Hide chatbox-related UI (brand logo, sidebar controls) */
	noChatbox?: boolean
	// New Sidebar Tabs props
	tabs?: SidebarTab[]
	activeTabId?: string | null
	onTabChange?: (tabId: string) => void
	onTabClose?: (tabId: string) => void
	onCloseOtherTabs?: () => void
	onCloseAllTabs?: () => void
	historyOpen?: boolean
	onHistoryClick?: () => void
	onHistoryClose?: () => void
}

const Header: FC<HeaderProps> = ({
	closeSidebar,
	noChatbox = false,
	// New Sidebar Tabs props
	tabs = [],
	activeTabId,
	onTabChange,
	onTabClose,
	onCloseOtherTabs,
	onCloseAllTabs,
	historyOpen = false,
	onHistoryClick,
	onHistoryClose
}) => {
	const global = useGlobal()
	const navigate = useNavigate()
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const tabsRef = useRef<HTMLDivElement>(null)

	// Context menu state
	const [contextMenu, setContextMenu] = useState<{
		position: { x: number; y: number } | null
		tabId: string | null
	}>({ position: null, tabId: null })

	// Scroll active tab into view
	const scrollToActive = useCallback(() => {
		if (tabsRef.current && activeTabId) {
			const activeTab = tabsRef.current.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement
			if (activeTab) {
				activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
			}
		}
	}, [activeTabId])

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

	// Handle mouse wheel for horizontal scrolling
	const handleWheel = (e: React.WheelEvent) => {
		if (tabsRef.current) {
			tabsRef.current.scrollLeft += e.deltaY
		}
	}

	// Handle tab click
	const handleTabClick = (tabId: string) => {
		// Close history if open
		if (historyOpen) {
			onHistoryClose?.()
		}
		onTabChange?.(tabId)
		// Also navigate to the tab's URL for URL sync
		const tab = tabs.find((t) => t.id === tabId)
		if (tab) {
			navigate(tab.url, { replace: true })
		}
	}

	// Handle tab close
	const handleTabClose = (e: React.MouseEvent, tabId: string) => {
		e.stopPropagation()
		onTabClose?.(tabId)
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
		onCloseOtherTabs?.()
	}, [onCloseOtherTabs])

	const handleContextCloseAll = useCallback(() => {
		onCloseAllTabs?.()
	}, [onCloseAllTabs])

	// Open in new window handler
	const handleContextOpenInNewWindow = useCallback(() => {
		if (contextMenu.tabId) {
			const tab = tabs.find((t) => t.id === contextMenu.tabId)
			if (tab && canOpenInNewWindow(tab.url)) {
				const newWindowUrl = getNewWindowUrl(tab.url)
				window.open(newWindowUrl, '_blank')
			}
		}
	}, [contextMenu.tabId, tabs])

	// Check if current context menu tab can be opened in new window
	const contextTabCanOpenInNewWindow = contextMenu.tabId
		? canOpenInNewWindow(tabs.find((t) => t.id === contextMenu.tabId)?.url || '')
		: false

	return (
		<header className='sidebar_header'>
			<div className='sidebar_header_left'>
				{/* History button */}
				<div
					className={clsx('sidebar_header_history_btn', historyOpen && 'active')}
					onClick={onHistoryClick}
					title={is_cn ? '浏览历史' : 'History'}
				>
					<Icon name={historyOpen ? 'material-menu_open' : 'material-menu'} size={18} />
				</div>

				{/* Tabs */}
				<div className='sidebar_header_tabs' ref={tabsRef} onWheel={handleWheel}>
					{tabs.map((tab) => (
						<div
							key={tab.id}
							data-tab-id={tab.id}
							className={clsx('sidebar_header_tab', tab.id === activeTabId && 'active')}
							onClick={() => handleTabClick(tab.id)}
							onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
							title={tab.title}
						>
							{tab.icon && (
								<Icon name={tab.icon} size={14} className='sidebar_header_tab_icon' />
							)}
							<span className='sidebar_header_tab_title'>{tab.title}</span>
							<span
								className='sidebar_header_tab_close'
								onClick={(e) => handleTabClose(e, tab.id)}
							>
								<Icon name='material-close' size={14} />
							</span>
						</div>
					))}
				</div>
			</div>

			{/* Right actions */}
			{!noChatbox && (
				<div className='sidebar_header_right'>
					<Tooltip title={is_cn ? '活动监视器' : 'Activity Monitor'}>
						<div
							className='sidebar_header_task_btn'
							onClick={() => {
								window.$app?.Event?.emit('app/openSidebar', {
									path: '/jobs',
									title: is_cn ? '活动监视器' : 'Activity Monitor',
									icon: 'material-monitor_heart'
								})
							}}
						>
							<span className='sidebar_header_task_text'>
								{is_cn ? '活动监视器' : 'Activity Monitor'}
							</span>
							<span
								className={clsx(
									'sidebar_header_task_number',
									global.runningJobsCount > 0 && 'has-jobs'
								)}
							>
								{global.runningJobsCount}
							</span>
						</div>
					</Tooltip>

					<Tooltip title={is_cn ? 'AI 助手' : 'AI Assistants'}>
						<div
							className='sidebar_header_btn'
							onClick={() => {
								window.$app?.Event?.emit('app/openSidebar', {
									path: '/assistants',
									title: is_cn ? 'AI 助手' : 'AI Assistants',
									icon: 'material-assistant'
								})
							}}
						>
							<Icon name='material-assistant' size={14} />
						</div>
					</Tooltip>

					{window.$app?.kb && Object.keys(window.$app.kb).length > 0 && (
						<Tooltip title={is_cn ? '知识库' : 'Knowledge Base'}>
							<div
								className='sidebar_header_btn'
								onClick={() => {
									window.$app?.Event?.emit('app/openSidebar', {
										path: '/kb',
										title: is_cn ? '知识库' : 'Knowledge Base',
										icon: 'material-library_books'
									})
								}}
							>
								<Icon name='material-library_books' size={14} />
							</div>
						</Tooltip>
					)}

					<div
						className='sidebar_header_btn'
						onClick={closeSidebar}
						title={is_cn ? '关闭' : 'Close'}
					>
						<Icon name='material-close' size={16} />
					</div>
				</div>
			)}

			{/* Tab Context Menu */}
			<TabContextMenu
				position={contextMenu.position}
				onClose={closeContextMenu}
				onCloseTab={handleContextCloseTab}
				onCloseOthers={handleContextCloseOthers}
				onCloseAll={handleContextCloseAll}
				onOpenInNewWindow={handleContextOpenInNewWindow}
				disableCloseTab={tabs.length === 0}
				disableCloseOthers={tabs.length <= 1}
				disableCloseAll={tabs.length === 0}
				showOpenInNewWindow={contextTabCanOpenInNewWindow}
			/>
		</header>
	)
}

export default observer(Header)
