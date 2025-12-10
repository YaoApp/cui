import { Button } from 'antd'
import { observer } from 'mobx-react-lite'
import { FC, PropsWithChildren, useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { container } from 'tsyringe'
import { GlobalModel } from '@/context/app'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import clsx from 'clsx'
import { IPropsNeo } from '@/layouts/types'
import Menu from './Menu'
import Container from './Container/index'
import { Page } from '@/chatbox' // Import new Page component
import { ChatProvider } from '@/chatbox/context'
import './style.less'
import { useNavigate, useLocation } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { App } from '@/types'

/**
 * Find menu item by path (recursively search through menu tree)
 */
const findMenuByPath = (path: string, menus: App.Menu[]): App.Menu | undefined => {
	for (const menu of menus) {
		if (menu.path === path || path.startsWith(menu.path + '/')) {
			return menu
		}
		if (menu.children) {
			const found = findMenuByPath(path, menu.children)
			if (found) return found
		}
	}
	return undefined
}

/**
 * Paths that default to sidebar-only mode (system pages without Chatbox)
 */
const SIDEBAR_ONLY_PATHS = ['/settings', '/login', '/register']

/**
 * Paths that default to chatbox-only mode (entry pages, no sidebar)
 */
const CHATBOX_ONLY_PATHS = ['/', '/welcome', '/chat']

/**
 * Check if path matches any sidebar-only default paths
 */
const isSidebarOnlyPath = (path: string): boolean => {
	for (const prefix of SIDEBAR_ONLY_PATHS) {
		if (path === prefix || path.startsWith(prefix + '/')) {
			return true
		}
	}
	return false
}

/**
 * Check if path matches any chatbox-only default paths
 */
const isChatboxOnlyPath = (path: string): boolean => {
	return CHATBOX_ONLY_PATHS.includes(path)
}

/**
 * Determine display mode for current path and menu
 * Returns: 'chatbox-only' | 'sidebar-only' | 'both'
 *
 * Logic:
 * - Menu found + chatbox: false / 'hidden': Sidebar only
 * - Menu found + chatbox: true / 'visible' / undefined: Both (backward compatible)
 * - Menu not found + known sidebar-only paths (/settings/*): Sidebar only
 * - Menu not found + known chatbox-only paths (/, /welcome, /chat): Chatbox only
 * - Menu not found + unknown routes: Both (default, business pages like /trace/*)
 */
type DisplayMode = 'chatbox-only' | 'sidebar-only' | 'both'

const getDisplayMode = (path: string, menu: App.Menu | undefined): DisplayMode => {
	// Menu found: check chatbox configuration
	if (menu) {
		const setting = menu.chatbox
		if (setting === false || setting === 'hidden') {
			return 'sidebar-only'
		}
		// Default: show both (backward compatible)
		return 'both'
	}

	// Menu not found: check if it's a known sidebar-only path (system pages)
	if (isSidebarOnlyPath(path)) {
		return 'sidebar-only'
	}

	// Menu not found: check if it's a known chatbox-only path (entry pages)
	if (isChatboxOnlyPath(path)) {
		return 'chatbox-only'
	}

	// Unknown route: default to 'both' (business pages like /trace/*)
	return 'both'
}

const MAIN_CONTENT_MIN_WIDTH = 320
const DEFAULT_WIDTH = 400

// Get maximum available width for sidebar while maintaining minimum content width
const getMaxWidth = () => {
	return window.innerWidth - MAIN_CONTENT_MIN_WIDTH - 64
}

// Get maximum width for maximized state (full viewport minus button space)
const getMaximizedWidth = () => {
	return window.innerWidth - 64
}

// Get responsive width settings based on screen size
const getResponsiveWidths = () => {
	const screenWidth = window.innerWidth
	const defaultWidth = screenWidth * 0.618
	const maxAvailableWidth = getMaxWidth()

	if (screenWidth >= 1920) {
		return {
			min: 480,
			max: maxAvailableWidth,
			default: Math.min(defaultWidth, maxAvailableWidth)
		}
	} else if (screenWidth >= 1440) {
		return {
			min: 400,
			max: maxAvailableWidth,
			default: Math.min(defaultWidth, maxAvailableWidth)
		}
	} else {
		return {
			min: 320,
			max: maxAvailableWidth,
			default: Math.min(defaultWidth, maxAvailableWidth)
		}
	}
}

const ChatboxWrapper: FC<PropsWithChildren> = ({ children }) => {
	const global = container.resolve(GlobalModel)
	const location = useLocation()
	const currentPath = location.pathname

	// Check if app is still loading (menus not yet loaded)
	const [isInitialLoading, setIsInitialLoading] = useState(true)

	// Get all menu items for chatbox visibility check
	const allMenuItems = useMemo(() => {
		const items = global.menus?.items || []
		const setting = global.menus?.setting || []
		const quick = global.menus?.quick || []
		return [...items, ...setting, ...quick]
	}, [global.menus])

	// Determine display mode based on menu configuration
	const displayMode = useMemo(() => {
		const currentMenu = findMenuByPath(currentPath, allMenuItems)
		return getDisplayMode(currentPath, currentMenu)
	}, [currentPath, allMenuItems])

	// Handle initial loading state
	useEffect(() => {
		// If menus are loaded, hide loading
		if (allMenuItems.length > 0) {
			// Small delay for smooth transition
			const timer = setTimeout(() => setIsInitialLoading(false), 100)
			return () => clearTimeout(timer)
		}
	}, [allMenuItems])

	// Use global state for sidebar management
	const sidebarVisible = global.sidebar_visible
	const sidebarWidth = global.sidebar_width
	const isMaximized = global.sidebar_maximized

	const [isAnimating, setIsAnimating] = useState(false)
	const [responsiveWidths, setResponsiveWidths] = useState(getResponsiveWidths())
	const [previousWidth, setPreviousWidth] = useState(DEFAULT_WIDTH)
	const [menuExpanding, setMenuExpanding] = useState(false) // Disable sidebar transition during menu expand/collapse

	const props_neo: IPropsNeo = {
		stack: global.stack.paths.join('/'),
		api: global.app_info.optional?.neo?.api!,
		studio: global.app_info.optional?.neo?.studio,
		dock: global.app_info.optional?.neo?.dock || 'right-bottom'
	}

	const handleSetSidebarVisible = useCallback(
		(visible: boolean, maximize?: boolean, forceNormal?: boolean) => {
			if (visible && maximize) {
				// 要求最大化显示
				if (!isMaximized) {
					setPreviousWidth(sidebarWidth)
					global.updateSidebarState(visible, true, getMaximizedWidth())
				} else {
					global.setSidebarVisible(visible)
				}
			} else if (visible && forceNormal) {
				// 强制退出最大化模式，但保留用户调整的宽度
				if (isMaximized) {
					// 如果当前是最大化，则恢复到之前的宽度
					const restoreWidth = previousWidth || getResponsiveWidths().default
					global.updateSidebarState(visible, false, restoreWidth)
				} else {
					// 如果当前不是最大化，只设置可见性，保持当前宽度
					global.setSidebarVisible(visible)
				}
			} else {
				// 默认行为：只设置可见性，保持当前最大化状态
				global.setSidebarVisible(visible)
			}
		},
		[isMaximized, sidebarWidth, global, previousWidth]
	)
	const [temporaryLink, setTemporaryLink] = useState<string>()
	const [isTemporaryView, setIsTemporaryView] = useState(false)
	const [currentPageName, setCurrentPageName] = useState<string>()
	const isFirstTemporaryViewRef = useRef(true) // Track if this is the first temporary view

	// Track if navigation was triggered from menu
	// When true, use menu's chatbox configuration
	// When false (default, or triggered from Chatbox/Action), force 'both' mode
	const [triggeredFromMenu, setTriggeredFromMenu] = useState(false)

	const navigate = useNavigate()

	// Initialize sidebar width if not set
	useEffect(() => {
		const responsiveWidth = getResponsiveWidths().default
		if (global.sidebar_width === 400) {
			// Default value, might need initialization
			global.setSidebarWidth(responsiveWidth)
		}
		// 初始化 previousWidth 为合理的默认值
		if (previousWidth === DEFAULT_WIDTH) {
			setPreviousWidth(responsiveWidth)
		}
	}, [global, previousWidth])

	// Raise Event
	useEffect(() => {
		const handleToggleSidebar = () => {
			if (sidebarVisible) {
				handleSetSidebarVisible(false)
				return
			}
			handleSetSidebarVisible(true)
		}

		const handleOpenSidebar = (detail: any) => {
			if (detail) {
				// Open Page (normal navigation with history)
				if (detail.path) {
					navigate(detail.path)
					// Reset temporary view tracking when navigating to normal page
					isFirstTemporaryViewRef.current = true
				}

				// Open Temporary Link
				if (detail.url) {
					if (detail.title) setCurrentPageName(detail.title || detail.url)
					setTemporaryLink(detail.url)
					setIsTemporaryView(true)

					// First temporary view: push to history (preserve previous page)
					// Subsequent temporary views: replace current (don't stack temporary pages)
					if (isFirstTemporaryViewRef.current) {
						navigate(detail.url)
						isFirstTemporaryViewRef.current = false
					} else {
						navigate(detail.url, { replace: true })
					}
				}

				// Support forceNormal parameter to exit maximized mode
				if (detail.forceNormal) {
					handleSetSidebarVisible(true, false, true)
					return
				}
			}

			handleSetSidebarVisible(true)
		}

		const handleCloseSidebar = () => {
			handleSetSidebarVisible(false)
		}

		// Handle menu navigation - mark as triggered from menu
		const handleMenuNavigation = () => {
			setTriggeredFromMenu(true)
		}

		// Handle openSidebar from Chatbox/Action - reset menu trigger flag
		const wrappedHandleOpenSidebar = (detail: any) => {
			setTriggeredFromMenu(false) // Not from menu, force 'both' mode
			handleOpenSidebar(detail)
		}

		// Handle menu expanding - disable sidebar transition temporarily
		const handleMenuExpanding = (expanding: boolean) => {
			setMenuExpanding(expanding)
		}

		window.$app.Event.on('app/toggleSidebar', handleToggleSidebar)
		window.$app.Event.on('app/openSidebar', wrappedHandleOpenSidebar)
		window.$app.Event.on('app/closeSidebar', handleCloseSidebar)
		window.$app.Event.on('app/menuNavigation', handleMenuNavigation)
		window.$app.Event.on('app/menuExpanding', handleMenuExpanding)

		return () => {
			window.$app.Event.off('app/toggleSidebar', handleToggleSidebar)
			window.$app.Event.off('app/openSidebar', wrappedHandleOpenSidebar)
			window.$app.Event.off('app/closeSidebar', handleCloseSidebar)
			window.$app.Event.off('app/menuNavigation', handleMenuNavigation)
			window.$app.Event.off('app/menuExpanding', handleMenuExpanding)
		}
	}, [sidebarVisible, handleSetSidebarVisible, navigate])

	// Listen for window resize events
	useEffect(() => {
		const handleResize = () => {
			const newWidths = getResponsiveWidths()
			setResponsiveWidths(newWidths)
			// Adjust width to nearest valid value if current width is out of range
			if (!isMaximized) {
				const currentWidth = global.sidebar_width
				if (currentWidth < newWidths.min) {
					global.setSidebarWidth(newWidths.min)
				} else if (currentWidth > newWidths.max) {
					global.setSidebarWidth(newWidths.max)
				}
			} else {
				global.setSidebarWidth(getMaximizedWidth())
			}
		}

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [isMaximized, global])

	const handleToggleLayout = () => {
		global.setLayout('Admin')
	}

	const openSidebar = (tempLink?: string, title?: string) => {
		setIsAnimating(true)
		if (tempLink) {
			setTemporaryLink(tempLink)
			setIsTemporaryView(true)
			setCurrentPageName(title || tempLink)
			if (!sidebarVisible) {
				handleSetSidebarVisible(true)
			}
		} else {
			// 如果没有传入链接，则只是简单地打开侧边栏
			if (!sidebarVisible) {
				handleSetSidebarVisible(true)
			}
		}
		setTimeout(() => setIsAnimating(false), 300)
	}

	const closeSidebar = () => {
		setIsAnimating(true)
		handleSetSidebarVisible(false)
		// 如果是临时视图，清除相关状态
		if (isTemporaryView) {
			handleBackToNormal()
		}
		setTimeout(() => setIsAnimating(false), 300)
	}

	const handleBackToNormal = () => {
		setTemporaryLink(undefined)
		setIsTemporaryView(false)
		setCurrentPageName(undefined)
		// Reset temporary view tracking for next time
		isFirstTemporaryViewRef.current = true
	}

	const handleToggleMaximize = (e: React.MouseEvent) => {
		e.stopPropagation()
		setIsAnimating(true)
		if (isMaximized) {
			// 从最大化切换到正常大小，使用合理的宽度
			const normalWidth =
				previousWidth > 0 && previousWidth !== DEFAULT_WIDTH
					? previousWidth
					: getResponsiveWidths().default
			global.updateSidebarState(undefined, false, normalWidth)
		} else {
			setPreviousWidth(sidebarWidth)
			global.updateSidebarState(undefined, true, getMaximizedWidth())
		}
		setTimeout(() => setIsAnimating(false), 300)
	}

	const handleResizeStart = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (isMaximized) return
			e.preventDefault()

			const startX = e.pageX
			const startWidth = sidebarWidth

			const handleMouseMove = (e: MouseEvent) => {
				const delta = startX - e.pageX
				const newWidth = Math.min(
					Math.max(startWidth + delta, responsiveWidths.min),
					responsiveWidths.max
				)
				global.setSidebarWidth(newWidth)
			}

			const handleMouseUp = () => {
				document.removeEventListener('mousemove', handleMouseMove)
				document.removeEventListener('mouseup', handleMouseUp)
			}

			document.addEventListener('mousemove', handleMouseMove)
			document.addEventListener('mouseup', handleMouseUp)
		},
		[sidebarWidth, responsiveWidths, isMaximized, global]
	)

	// Show loading screen while initial data is loading
	if (isInitialLoading) {
		return (
			<div className='chatbox-loading'>
				<div className='loading-spinner' />
			</div>
		)
	}

	// Determine effective display mode
	// - SIDEBAR_ONLY_PATHS (e.g., /settings/*): always sidebar-only (system pages)
	// - Menu triggered: follow menu's chatbox setting
	// - Chatbox/Action triggered: force 'both' mode (keep chatbox visible)
	// - chatbox-only routes: always chatbox-only
	const effectiveDisplayMode = (() => {
		// System pages: always sidebar-only regardless of trigger source
		if (isSidebarOnlyPath(currentPath)) {
			console.log('[ChatboxWrapper] effectiveDisplayMode: sidebar-only (system path)')
			return 'sidebar-only'
		}
		// Menu navigation: follow menu configuration
		if (triggeredFromMenu) {
			console.log('[ChatboxWrapper] effectiveDisplayMode:', displayMode, '(from menu)')
			return displayMode
		}
		// Non-menu navigation: default to 'both' unless explicitly chatbox-only
		const result = displayMode === 'chatbox-only' ? 'chatbox-only' : 'both'
		console.log('[ChatboxWrapper] effectiveDisplayMode:', result, '(non-menu)')
		return result
	})()

	// Debug logging
	console.log('[ChatboxWrapper] ===== Debug =====')
	console.log('[ChatboxWrapper] currentPath:', currentPath)
	console.log('[ChatboxWrapper] displayMode:', displayMode)
	console.log('[ChatboxWrapper] triggeredFromMenu:', triggeredFromMenu)
	console.log('[ChatboxWrapper] isTemporaryView:', isTemporaryView)
	// Debug: find current menu for logging
	const currentMenuDebug = findMenuByPath(currentPath, allMenuItems)
	console.log('[ChatboxWrapper] effectiveDisplayMode:', effectiveDisplayMode)
	console.log(
		'[ChatboxWrapper] allMenuItems:',
		allMenuItems.map((m) => m.path)
	)
	console.log('[ChatboxWrapper] currentMenu:', currentMenuDebug)
	console.log('[ChatboxWrapper] showChatbox:', effectiveDisplayMode !== 'sidebar-only')
	console.log('[ChatboxWrapper] showSidebarArea:', effectiveDisplayMode !== 'chatbox-only')
	console.log('[ChatboxWrapper] =================')

	// Determine visibility based on display mode
	// - chatbox-only: only show Chatbox (e.g., /welcome or undefined routes)
	// - sidebar-only: only show Sidebar with business page (e.g., /settings, chatbox: false)
	// - both: show both Chatbox and Sidebar (default, backward compatible)
	const showChatbox = effectiveDisplayMode !== 'sidebar-only'
	const showSidebarArea = effectiveDisplayMode !== 'chatbox-only'

	// Calculate content width based on mode (using CSS variable for menu width)
	const getContentWidth = () => {
		if (!showChatbox) {
			// Sidebar-only mode: full width for business content
			return 'calc(100% - var(--menu-width, 64px))'
		}
		if (!showSidebarArea) {
			// Chatbox-only mode: full width for Chatbox
			return 'calc(100% - var(--menu-width, 64px))'
		}
		// Both mode: adjust based on sidebar visibility
		return sidebarVisible && !isMaximized
			? `calc(100% - var(--menu-width, 64px) - ${sidebarWidth}px)`
			: 'calc(100% - var(--menu-width, 64px))'
	}

	// Always render ChatProvider for Action support (e.g., auto-open sidebar during chat)
	return (
		<ChatProvider>
			<div
				className={clsx(
					'chatbox-wrapper',
					effectiveDisplayMode === 'chatbox-only' && 'chatbox-only',
					effectiveDisplayMode === 'sidebar-only' && 'sidebar-only',
					sidebarVisible && showSidebarArea && 'with-sidebar',
					isAnimating && 'animating',
					isMaximized && 'maximized',
					menuExpanding && 'no-transition'
				)}
			>
				<Menu
					sidebarVisible={sidebarVisible && showSidebarArea}
					setSidebarVisible={handleSetSidebarVisible}
					openSidebar={openSidebar}
					closeSidebar={closeSidebar}
				/>

				{/* Chatbox area - always rendered but hidden in sidebar-only mode */}
				<div
					className={clsx('chat-content', !showChatbox && 'hidden')}
					style={{
						marginLeft: 'var(--menu-width, 64px)',
						width: getContentWidth(),
						display: showChatbox ? undefined : 'none'
					}}
				>
					{showSidebarArea && !sidebarVisible && (
						<Button
							type='text'
							icon={
								<Icon
									name='material-chevron_left'
									size={16}
									color='var(--color_text)'
								/>
							}
							onClick={() => handleSetSidebarVisible(true)}
							className='maximize-btn sidebar-toggle-btn'
							style={{
								position: 'fixed',
								right: '0',
								top: '50%',
								transform: 'translateY(-50%)',
								zIndex: 10,
								width: '12px',
								height: '24px',
								padding: 0,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								borderRadius: '2px',
								backgroundColor: 'var(--color_bg_active)',
								color: 'var(--color_text)',
								transition: 'all 0.2s',
								cursor: 'pointer',
								border: 'none'
							}}
						/>
					)}
					<div
						className={clsx(['w_100 border_box flex flex_column'])}
						style={{
							margin: '0 auto',
							height: '100%',
							padding: 0
						}}
					>
						<Page {...props_neo} title='Neo AI' />
					</div>
				</div>

				{/* Sidebar-only mode: full-screen business content */}
				{!showChatbox && (
					<div
						className='full-content'
						style={{
							marginLeft: 'var(--menu-width, 64px)',
							width: 'calc(100% - var(--menu-width, 64px))',
							height: '100%'
						}}
					>
						<Container
							isMaximized={false}
							openSidebar={openSidebar}
							closeSidebar={closeSidebar}
							noChatbox={true}
						>
							{children}
						</Container>
					</div>
				)}

				{/* Sidebar area - only for 'both' mode */}
				{showSidebarArea && showChatbox && (
					<>
						<div
							className={clsx(
								'chat-sidebar',
								!sidebarVisible && 'hidden',
								isAnimating && 'animating'
							)}
							style={{
								width: sidebarWidth,
								...(isMaximized ? { position: 'fixed', right: 0 } : undefined)
							}}
						>
							<div className='resize-handle' onMouseDown={handleResizeStart}>
								<Button
									type='text'
									className='maximize-btn'
									onClick={handleToggleMaximize}
									icon={isMaximized ? <RightOutlined /> : <LeftOutlined />}
								/>
							</div>
							<div className='sidebar-content'>
								<Container
									isMaximized={isMaximized}
									openSidebar={openSidebar}
									closeSidebar={closeSidebar}
									temporaryLink={temporaryLink}
									currentPageName={currentPageName}
									isTemporaryView={isTemporaryView}
									onBackToNormal={handleBackToNormal}
								>
									{children}
								</Container>
							</div>
						</div>
						{isMaximized && sidebarVisible && (
							<div className='sidebar-overlay' onClick={handleToggleMaximize} />
						)}
					</>
				)}
			</div>
		</ChatProvider>
	)
}

export default observer(ChatboxWrapper)
