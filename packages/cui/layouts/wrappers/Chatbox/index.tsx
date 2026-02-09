import { Button } from 'antd'
import { observer } from 'mobx-react-lite'
import { FC, PropsWithChildren, useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { container } from 'tsyringe'
import { GlobalModel } from '@/context/app'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import clsx from 'clsx'
import { nanoid } from 'nanoid'
import { IPropsNeo } from '@/layouts/types'
import Menu from './Menu'
import Container from './Container/index'
import { Page } from '@/chatbox' // Import new Page component
import { ChatProvider } from '@/chatbox/context'
import './style.less'
import { useNavigate, useLocation } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { App } from '@/types'
import type { SidebarTab, SidebarHistoryItem } from './Container/types'

// ============ Sidebar History Storage ============
const SIDEBAR_HISTORY_KEY_PREFIX = 'sidebar_history'
const SIDEBAR_HISTORY_MAX = 50

/**
 * Get storage key for sidebar history based on user and team ID
 * Format: sidebar_history_<user_id>_<team_id> or sidebar_history_<user_id> if no team
 */
const getSidebarHistoryKey = (userId?: string | number, teamId?: string): string => {
	if (!userId) {
		return SIDEBAR_HISTORY_KEY_PREFIX
	}
	if (teamId) {
		return `${SIDEBAR_HISTORY_KEY_PREFIX}_${userId}_${teamId}`
	}
	return `${SIDEBAR_HISTORY_KEY_PREFIX}_${userId}`
}

/** Load history from localStorage for specific user/team */
const loadSidebarHistory = (userId?: string | number, teamId?: string): SidebarHistoryItem[] => {
	try {
		const key = getSidebarHistoryKey(userId, teamId)
		const data = localStorage.getItem(key)
		if (data) {
			return JSON.parse(data)
		}
	} catch (e) {
		console.warn('Failed to load sidebar history:', e)
	}
	return []
}

/** Save history to localStorage for specific user/team */
const saveSidebarHistory = (items: SidebarHistoryItem[], userId?: string | number, teamId?: string) => {
	try {
		const key = getSidebarHistoryKey(userId, teamId)
		// Limit to max items
		const limited = items.slice(0, SIDEBAR_HISTORY_MAX)
		localStorage.setItem(key, JSON.stringify(limited))
	} catch (e) {
		console.warn('Failed to save sidebar history:', e)
	}
}

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
const SIDEBAR_ONLY_PATHS = ['/settings', '/login', '/register', '/mission-control']

/**
 * Paths that default to chatbox-only mode (entry pages, no sidebar)
 */
const CHATBOX_ONLY_PATHS = ['/', '/welcome', '/chat']

/**
 * Check if path matches any sidebar-only default paths (case-insensitive)
 */
const isSidebarOnlyPath = (path: string): boolean => {
	const lowerPath = path.toLowerCase()
	for (const prefix of SIDEBAR_ONLY_PATHS) {
		if (lowerPath === prefix || lowerPath.startsWith(prefix + '/')) {
			return true
		}
	}
	return false
}

/**
 * Check if path matches any chatbox-only default paths (case-insensitive)
 */
const isChatboxOnlyPath = (path: string): boolean => {
	const lowerPath = path.toLowerCase()
	return CHATBOX_ONLY_PATHS.includes(lowerPath)
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

	// Navigation hook (used by multiple handlers)
	const navigate = useNavigate()

	// ============ User Identity for History Storage ============
	// Get user ID and team ID for history storage isolation
	const userId = global.user?.id
	const teamId = global.user?.team_id

	// ============ Sidebar Tabs State ============
	const [sidebarTabs, setSidebarTabs] = useState<SidebarTab[]>([])
	const [activeSidebarTabId, setActiveSidebarTabId] = useState<string | null>(null)
	const [sidebarHistoryOpen, setSidebarHistoryOpen] = useState(false)
	const [sidebarHistory, setSidebarHistory] = useState<SidebarHistoryItem[]>(() =>
		loadSidebarHistory(userId, teamId)
	)

	// Reload history when user/team changes (e.g., after login or team switch)
	useEffect(() => {
		const newHistory = loadSidebarHistory(userId, teamId)
		setSidebarHistory(newHistory)
	}, [userId, teamId])

	// Get base URL without query string
	const getBaseUrl = (url: string): string => {
		try {
			const urlObj = new URL(url, window.location.origin)
			// Strip /web prefix so that /web/agents/... and /agents/... match
			return urlObj.pathname.replace(/^\/web/, '')
		} catch {
			// If URL parsing fails, try simple split
			return url.split('?')[0].replace(/^\/web/, '')
		}
	}

	// Add a new tab (or reuse existing tab with same base URL)
	const addSidebarTab = useCallback(
		(url: string, title: string, icon?: string) => {
			const baseUrl = getBaseUrl(url)

			// Check if a tab with the same base URL already exists
			const existingTabIndex = sidebarTabs.findIndex((tab) => getBaseUrl(tab.url) === baseUrl)

			if (existingTabIndex !== -1) {
				// Tab exists - update its URL and activate it
				const existingTab = sidebarTabs[existingTabIndex]
				setSidebarTabs((prev) =>
					prev.map((tab) =>
						tab.id === existingTab.id
							? { ...tab, url, title: title || tab.title, timestamp: Date.now() }
							: tab
					)
				)
				setActiveSidebarTabId(existingTab.id)

				// Update history
				const historyItem: SidebarHistoryItem = {
					url,
					title: title || existingTab.title,
					icon: icon || existingTab.icon,
					lastVisited: Date.now()
				}
				setSidebarHistory((prev) => {
					const filtered = prev.filter((item) => getBaseUrl(item.url) !== baseUrl)
					const updated = [historyItem, ...filtered]
					saveSidebarHistory(updated, userId, teamId)
					return updated
				})

				return existingTab.id
			}

			// No existing tab - create new one
			const newTab: SidebarTab = {
				id: nanoid(),
				url,
				title,
				icon,
				timestamp: Date.now()
			}
			setSidebarTabs((prev) => [...prev, newTab])
			setActiveSidebarTabId(newTab.id)

			// Add to history
			const historyItem: SidebarHistoryItem = {
				url,
				title,
				icon,
				lastVisited: Date.now()
			}
			setSidebarHistory((prev) => {
				// Remove existing entry with same base URL, add new one at front
				const filtered = prev.filter((item) => getBaseUrl(item.url) !== baseUrl)
				const updated = [historyItem, ...filtered]
				saveSidebarHistory(updated, userId, teamId)
				return updated
			})

			return newTab.id
		},
		[sidebarTabs, userId, teamId]
	)

	// Update tab title (used by /web pages to update title from iframe)
	const updateSidebarTabTitle = useCallback(
		(url: string, title: string) => {
			if (!title) return

			const baseUrl = getBaseUrl(url)

			// Update tab title — match by exact base URL
			setSidebarTabs((prev) =>
				prev.map((tab) => {
					if (getBaseUrl(tab.url) === baseUrl) {
						return { ...tab, title }
					}
					return tab
				})
			)

			// Also update history
			setSidebarHistory((prev) => {
				const updated = prev.map((item) => {
					if (getBaseUrl(item.url) === baseUrl) {
						return { ...item, title }
					}
					return item
				})
				saveSidebarHistory(updated, userId, teamId)
				return updated
			})
		},
		[userId, teamId]
	)

	// Update active tab's URL and title (for in-iframe sub-navigation)
	const updateActiveTab = useCallback(
		(url: string, title: string) => {
			setActiveSidebarTabId((activeId) => {
				if (!activeId) return activeId

				setSidebarTabs((prev) =>
					prev.map((tab) => {
						if (tab.id === activeId) {
							return { ...tab, url, title: title || tab.title, timestamp: Date.now() }
						}
						return tab
					})
				)

				return activeId
			})
		},
		[]
	)

	// Remove a tab
	const removeSidebarTab = useCallback((tabId: string) => {
		setSidebarTabs((prev) => {
			const index = prev.findIndex((t) => t.id === tabId)
			const newTabs = prev.filter((t) => t.id !== tabId)

			// If removing active tab, activate another one
			setActiveSidebarTabId((currentActive) => {
				if (currentActive === tabId && newTabs.length > 0) {
					// Activate the tab at the same index, or the last one
					const newIndex = Math.min(index, newTabs.length - 1)
					return newTabs[newIndex].id
				}
				if (newTabs.length === 0) {
					return null
				}
				return currentActive
			})

			return newTabs
		})
	}, [])

	// Activate a tab
	const activateSidebarTab = useCallback((tabId: string) => {
		setActiveSidebarTabId(tabId)
	}, [])

	// Close other tabs (keep only the active one)
	const closeOtherSidebarTabs = useCallback(() => {
		setSidebarTabs((prev) => {
			const activeTab = prev.find((t) => t.id === activeSidebarTabId)
			return activeTab ? [activeTab] : []
		})
	}, [activeSidebarTabId])

	// Close all tabs
	const closeAllSidebarTabs = useCallback(() => {
		setSidebarTabs([])
		setActiveSidebarTabId(null)
	}, [])

	// History handlers
	const handleSidebarHistorySelect = useCallback(
		(item: SidebarHistoryItem) => {
			addSidebarTab(item.url, item.title, item.icon)
			setSidebarHistoryOpen(false)
			// Navigate to the URL to update page content
			navigate(item.url, { replace: true })
		},
		[addSidebarTab, navigate]
	)

	const handleSidebarHistoryDelete = useCallback(
		(url: string) => {
			setSidebarHistory((prev) => {
				const updated = prev.filter((item) => item.url !== url)
				saveSidebarHistory(updated, userId, teamId)
				return updated
			})
		},
		[userId, teamId]
	)

	const handleSidebarHistoryClear = useCallback(() => {
		setSidebarHistory([])
		saveSidebarHistory([], userId, teamId)
	}, [userId, teamId])

	// Initialize tab from current URL on page load/refresh
	const initializedRef = useRef(false)

	// Get all menu items for chatbox visibility check
	const allMenuItems = useMemo(() => {
		const items = global.menus?.items || []
		const setting = global.menus?.setting || []
		const quick = global.menus?.quick || []
		return [...items, ...setting, ...quick]
	}, [global.menus])

	// Initialize tab on page load (wait for menus to be loaded)
	useEffect(() => {
		// Only run once on mount, and wait for menus to be loaded
		if (initializedRef.current) return
		if (allMenuItems.length === 0) return // Wait for menus

		// Get current URL with search params
		const fullUrl = location.pathname + location.search
		const basePath = location.pathname

		// Skip chatbox-only paths (they don't need tabs)
		if (isChatboxOnlyPath(basePath)) {
			initializedRef.current = true
			return
		}

		// Skip sidebar-only paths (they render full screen without tabs header)
		if (isSidebarOnlyPath(basePath)) {
			initializedRef.current = true
			return
		}

		// Mark as initialized
		initializedRef.current = true

		// Find menu item to get proper title and icon
		const currentMenu = findMenuByPath(basePath, allMenuItems)
		const title = currentMenu?.name || basePath
		const icon = currentMenu?.icon
			? typeof currentMenu.icon === 'string'
				? currentMenu.icon
				: currentMenu.icon.name
			: undefined

		// Create new tab directly (avoid dependency on addSidebarTab)
		const newTab: SidebarTab = {
			id: nanoid(),
			url: fullUrl,
			title,
			icon,
			timestamp: Date.now()
		}
		setSidebarTabs([newTab])
		setActiveSidebarTabId(newTab.id)

		// Make sure sidebar is visible
		global.setSidebarVisible(true)
	}, [location.pathname, location.search, global, allMenuItems])

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
				const url = detail.url || detail.path
				const title = detail.title || url

				if (url) {
					// Get base path for checking
					const basePath = url.split('?')[0]

					// Skip chatbox-only paths - they should not create tabs
					// These are chat-related pages that belong to the Chatbox area
					if (isChatboxOnlyPath(basePath)) {
						// Just navigate, don't create tab
						navigate(url)
						return
					}

					// Skip sidebar-only paths - they should not create tabs or history
					// These are system pages (settings, login, etc.) that render full screen
					if (isSidebarOnlyPath(basePath)) {
						// Just navigate, don't create tab
						navigate(url)
						return
					}

					// Reset maximized state and width when opening sidebar from menu
					// This ensures proper layout in 'both' mode
					if (global.sidebar_maximized) {
						global.setSidebarMaximized(false)
					}

					// Reset sidebar width if it's too large (from maximized state)
					// In 'both' mode, sidebar should not exceed max width (screen - chatbox min - menu)
					const maxAllowedWidth = getMaxWidth()
					if (global.sidebar_width > maxAllowedWidth) {
						const defaultWidth = getResponsiveWidths().default
						global.setSidebarWidth(defaultWidth)
					}

					// Create a new Tab (Sidebar Tabs mode)
					addSidebarTab(url, title, detail.icon)

					// Also navigate for URL sync (replace to avoid history stack)
					navigate(url, { replace: true })
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

		// Handle menu expanding - disable sidebar transition temporarily
		const handleMenuExpanding = (expanding: boolean) => {
			setMenuExpanding(expanding)
		}

		// Handle sidebar tab title update (from /web iframe pages)
		const handleUpdateSidebarTabTitle = (detail: { url: string; title: string }) => {
			if (detail?.url && detail?.title) {
				updateSidebarTabTitle(detail.url, detail.title)
			}
		}

		// Handle active tab update (for in-iframe sub-navigation)
		const handleUpdateActiveTab = (detail: { url: string; title: string }) => {
			if (detail?.url) {
				updateActiveTab(detail.url, detail.title)
			}
		}

		window.$app.Event.on('app/toggleSidebar', handleToggleSidebar)
		window.$app.Event.on('app/openSidebar', handleOpenSidebar)
		window.$app.Event.on('app/closeSidebar', handleCloseSidebar)
		window.$app.Event.on('app/menuExpanding', handleMenuExpanding)
		window.$app.Event.on('app/updateSidebarTabTitle', handleUpdateSidebarTabTitle)
		window.$app.Event.on('app/updateActiveTab', handleUpdateActiveTab)

		return () => {
			window.$app.Event.off('app/toggleSidebar', handleToggleSidebar)
			window.$app.Event.off('app/openSidebar', handleOpenSidebar)
			window.$app.Event.off('app/closeSidebar', handleCloseSidebar)
			window.$app.Event.off('app/menuExpanding', handleMenuExpanding)
			window.$app.Event.off('app/updateSidebarTabTitle', handleUpdateSidebarTabTitle)
			window.$app.Event.off('app/updateActiveTab', handleUpdateActiveTab)
		}
	}, [sidebarVisible, handleSetSidebarVisible, navigate, addSidebarTab, updateSidebarTabTitle, updateActiveTab])

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

			// Check if clicked on the maximize button - don't start resize
			const target = e.target as HTMLElement
			if (
				target.closest('.maximize-btn') ||
				target.closest('button') ||
				target.tagName === 'BUTTON'
			) {
				return
			}

			e.preventDefault()

			const startX = e.pageX
			const startWidth = sidebarWidth

			// Prevent text selection and interference during drag
			document.body.style.cursor = 'col-resize'
			document.body.style.userSelect = 'none'
			// Add a transparent overlay to prevent iframe/other elements from capturing mouse events
			const overlay = document.createElement('div')
			overlay.id = 'resize-overlay'
			overlay.style.cssText =
				'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;cursor:col-resize;'
			document.body.appendChild(overlay)

			const handleMouseMove = (e: MouseEvent) => {
				const delta = startX - e.pageX
				const newWidth = Math.min(
					Math.max(startWidth + delta, responsiveWidths.min),
					responsiveWidths.max
				)
				global.setSidebarWidth(newWidth)
			}

			const handleMouseUp = () => {
				// Cleanup: restore cursor and remove overlay
				document.body.style.cursor = ''
				document.body.style.userSelect = ''
				const existingOverlay = document.getElementById('resize-overlay')
				if (existingOverlay) {
					existingOverlay.remove()
				}
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
	// - CHATBOX_ONLY_PATHS (e.g., /, /welcome, /chat): always chatbox-only
	// - Everything else: 'both' mode (Chatbox + Sidebar)
	const effectiveDisplayMode = (() => {
		// System pages: always sidebar-only
		if (isSidebarOnlyPath(currentPath)) {
			return 'sidebar-only'
		}
		// Chat pages: always chatbox-only
		if (isChatboxOnlyPath(currentPath)) {
			return 'chatbox-only'
		}
		// Everything else: both mode
		return 'both'
	})()

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

	// In 'both' mode, disable maximized state (maximized only works in sidebar-only mode)
	const effectiveMaximized = effectiveDisplayMode === 'sidebar-only' && isMaximized

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
					effectiveMaximized && 'maximized',
					menuExpanding && 'no-transition'
				)}
				style={
					{
						'--sidebar-width': `${sidebarWidth}px`
					} as React.CSSProperties
				}
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
							// New Sidebar Tabs props
							tabs={sidebarTabs}
							activeTabId={activeSidebarTabId}
							onTabChange={activateSidebarTab}
							onTabClose={removeSidebarTab}
							onCloseOtherTabs={closeOtherSidebarTabs}
							onCloseAllTabs={closeAllSidebarTabs}
							historyOpen={sidebarHistoryOpen}
							historyItems={sidebarHistory}
							onHistoryClick={() => setSidebarHistoryOpen((prev) => !prev)}
							onHistoryClose={() => setSidebarHistoryOpen(false)}
							onHistorySelect={handleSidebarHistorySelect}
							onHistoryDelete={handleSidebarHistoryDelete}
							onHistoryClear={handleSidebarHistoryClear}
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
								width: sidebarWidth
								// Note: In 'both' mode, sidebar is not maximizable
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
									isMaximized={false}
									openSidebar={openSidebar}
									closeSidebar={closeSidebar}
									// Legacy props (will be removed after full migration)
									temporaryLink={temporaryLink}
									currentPageName={currentPageName}
									isTemporaryView={isTemporaryView}
									onBackToNormal={handleBackToNormal}
									// New Sidebar Tabs props
									tabs={sidebarTabs}
									activeTabId={activeSidebarTabId}
									onTabChange={activateSidebarTab}
									onTabClose={removeSidebarTab}
									onCloseOtherTabs={closeOtherSidebarTabs}
									onCloseAllTabs={closeAllSidebarTabs}
									historyOpen={sidebarHistoryOpen}
									historyItems={sidebarHistory}
									onHistoryClick={() => setSidebarHistoryOpen((prev) => !prev)}
									onHistoryClose={() => setSidebarHistoryOpen(false)}
									onHistorySelect={handleSidebarHistorySelect}
									onHistoryDelete={handleSidebarHistoryDelete}
									onHistoryClear={handleSidebarHistoryClear}
								>
									{children}
								</Container>
							</div>
						</div>
						{/* No overlay in 'both' mode - maximized only works in sidebar-only mode */}
					</>
				)}
			</div>
		</ChatProvider>
	)
}

export default observer(ChatboxWrapper)
