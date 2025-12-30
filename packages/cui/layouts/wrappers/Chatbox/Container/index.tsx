import { FC, PropsWithChildren, useState, useEffect, useRef } from 'react'
import Header from './Header'
import History from './History'
import Empty from './Empty'
import './style.less'
import type { SidebarTab, SidebarHistoryItem } from './types'

interface ContainerProps {
	openSidebar: (temporaryLink?: string, title?: string) => void
	closeSidebar: () => void
	showMenu?: boolean
	isMaximized?: boolean
	/** @deprecated Use tabs instead */
	temporaryLink?: string
	/** @deprecated Use tabs instead */
	currentPageName?: string
	/** @deprecated Use tabs instead */
	isTemporaryView?: boolean
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
	historyItems?: SidebarHistoryItem[]
	onHistoryClick?: () => void
	onHistoryClose?: () => void
	onHistorySelect?: (item: SidebarHistoryItem) => void
	onHistoryDelete?: (url: string) => void
	onHistoryClear?: () => void
}

const Container: FC<PropsWithChildren<ContainerProps>> = ({
	children,
	isMaximized,
	openSidebar,
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
	historyItems = [],
	onHistoryClick,
	onHistoryClose,
	onHistorySelect,
	onHistoryDelete,
	onHistoryClear
}) => {
	const mainContentRef = useRef<HTMLDivElement>(null)
	const [overlayMode, setOverlayMode] = useState(false)

	// Monitor width for overlay mode
	useEffect(() => {
		const checkWidth = () => {
			if (mainContentRef.current) {
				const width = mainContentRef.current.getBoundingClientRect().width
				setOverlayMode(width < 600)
			}
		}

		const resizeObserver = new ResizeObserver(checkWidth)
		if (mainContentRef.current) {
			resizeObserver.observe(mainContentRef.current)
		}

		checkWidth()

		return () => {
			resizeObserver.disconnect()
		}
	}, [])

	// Get active tab
	const activeTab = tabs.find((t) => t.id === activeTabId)

	// Check if we have any tabs
	const hasTabs = tabs.length > 0

	// In noChatbox mode (sidebar-only), always show children directly without tabs logic
	if (noChatbox) {
		return (
			<div className='sidebar_container' style={{ marginLeft: 0 }}>
				{/* No Header in noChatbox mode - full screen content */}
				<div className='sidebar_main' ref={mainContentRef}>
					<main className='sidebar_content'>
						<div className='sidebar_content_wrapper'>{children}</div>
					</main>
				</div>
			</div>
		)
	}

	return (
		<div className='sidebar_container' style={{ marginLeft: isMaximized ? 0 : 2 }}>
			<Header
				openSidebar={openSidebar}
				closeSidebar={closeSidebar}
				noChatbox={noChatbox}
				tabs={tabs}
				activeTabId={activeTabId}
				onTabChange={onTabChange}
				onTabClose={onTabClose}
				onCloseOtherTabs={onCloseOtherTabs}
				onCloseAllTabs={onCloseAllTabs}
				historyOpen={historyOpen}
				onHistoryClick={onHistoryClick}
				onHistoryClose={onHistoryClose}
			/>

			<div className='sidebar_main' ref={mainContentRef}>
				{/* History Panel */}
				<History
					open={historyOpen}
					items={historyItems}
					onSelect={onHistorySelect || (() => {})}
					onDelete={onHistoryDelete || (() => {})}
					onClear={onHistoryClear || (() => {})}
					onClose={onHistoryClose || (() => {})}
					overlay={overlayMode}
				/>

				{/* Content Area - click to close history */}
				<main
					className='sidebar_content'
					onClick={() => {
						if (historyOpen && onHistoryClose) {
							onHistoryClose()
						}
					}}
				>
					{hasTabs ? (
						// Render tab content - children is the routed page content
						<div className='sidebar_content_wrapper'>{children}</div>
					) : (
						// Empty state when no tabs
						<Empty />
					)}
				</main>
			</div>
		</div>
	)
}

export default Container
