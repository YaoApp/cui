import { FC, useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'
import { GlobalModel } from '@/context/app'
import { Tooltip } from 'antd'
import { useNavigate, useLocation } from '@umijs/max'
import clsx from 'clsx'
import './menu.less'
import { Icon, UserAvatar } from '@/widgets'
import { App } from '@/types'
import { GetCurrentUser } from '@/pages/auth/auth'

/**
 * Check if menu item is sidebar-only mode (no Chatbox)
 */
const isSidebarOnly = (menu: App.Menu): boolean => {
	return menu.chatbox === false || menu.chatbox === 'hidden'
}

/**
 * Check if current path matches a menu item's path
 * Supports exact match and prefix match (e.g., /kb matches /kb/*)
 */
const isMenuActive = (menuPath: string, currentPath: string): boolean => {
	if (!menuPath) return false
	// Exact match
	if (menuPath === currentPath) {
		return true
	}
	// Prefix match: /kb matches /kb/123
	if (currentPath.startsWith(menuPath + '/')) {
		return true
	}
	return false
}

/**
 * Check if a menu or any of its children is active
 */
const isMenuOrChildActive = (menu: App.Menu, currentPath: string): boolean => {
	if (isMenuActive(menu.path, currentPath)) {
		return true
	}
	if (menu.children) {
		return menu.children.some((child) => isMenuOrChildActive(child, currentPath))
	}
	return false
}

/**
 * Get icon name from menu icon
 */
const getIconName = (icon?: string | { name: string; size?: number }): string | undefined => {
	if (!icon) return undefined
	return typeof icon === 'string' ? icon : icon.name
}

/**
 * Get icon size from menu icon
 */
const getIconSize = (icon?: string | { name: string; size?: number }, defaultSize = 20): number => {
	if (!icon) return defaultSize
	return typeof icon === 'string' ? defaultSize : icon.size || defaultSize
}

/**
 * Check if menu has a valid path (not empty)
 */
const hasValidPath = (menu: App.Menu): boolean => {
	return !!menu.path && menu.path.trim() !== ''
}

interface Props {
	sidebarVisible?: boolean
	setSidebarVisible?: (visible: boolean, maximize?: boolean, forceNormal?: boolean) => void
	closeSidebar?: () => void
	openSidebar?: (temporaryLink?: string, title?: string) => void
}

// SubMenu popup component for collapsed mode
interface SubMenuPopupProps {
	menu: App.Menu
	position: { top: number; left: number }
	onClose: () => void
	onNavigate: (path: string, menu: App.Menu) => void
	currentPath: string
}

const SubMenuPopup: FC<SubMenuPopupProps> = ({ menu, position, onClose, onNavigate, currentPath }) => {
	const popupRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
				onClose()
			}
		}
		const handleScroll = () => onClose()

		document.addEventListener('mousedown', handleClickOutside)
		window.addEventListener('scroll', handleScroll, true)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			window.removeEventListener('scroll', handleScroll, true)
		}
	}, [onClose])

	// Adjust position if popup would go off screen
	const adjustedPosition = useMemo(() => {
		const viewportHeight = window.innerHeight
		const popupHeight = (menu.children?.length || 0) * 40 + 56 // Estimate height
		let top = position.top

		if (top + popupHeight > viewportHeight - 20) {
			top = Math.max(20, viewportHeight - popupHeight - 20)
		}

		return { top, left: position.left }
	}, [position, menu.children?.length])

	// Handle header click - only navigate if has valid path
	const handleHeaderClick = () => {
		if (hasValidPath(menu)) {
			onNavigate(menu.path, menu)
			onClose()
		}
	}

	const renderSubMenuItem = (item: App.Menu, level = 0) => {
		const hasChildren = item.children && item.children.length > 0
		const isActive = isMenuActive(item.path, currentPath)
		const canClick = hasValidPath(item) && !hasChildren

		return (
			<div key={item.key || item.path || item.name} className='submenu-item-wrapper'>
				<div
					className={clsx(
						'submenu-item',
						isActive && 'active',
						hasChildren && 'has-children',
						!canClick && 'no-click'
					)}
					style={{ paddingLeft: 12 + level * 16 }}
					onClick={(e) => {
						e.stopPropagation()
						if (canClick) {
							onNavigate(item.path, item)
							onClose()
						}
					}}
				>
					{item.icon && (
						<span className='submenu-icon'>
							<Icon name={getIconName(item.icon)!} size={16} />
						</span>
					)}
					<span className='submenu-text'>{item.name}</span>
					{hasChildren && (
						<span className='submenu-arrow'>
							<Icon name='icon-chevron-right' size={14} />
						</span>
					)}
				</div>
				{hasChildren && (
					<div className='submenu-children'>
						{item.children!.map((child) => renderSubMenuItem(child, level + 1))}
					</div>
				)}
			</div>
		)
	}

	return (
		<div
			ref={popupRef}
			className='submenu-popup'
			style={{ top: adjustedPosition.top, left: adjustedPosition.left }}
		>
			<div
				className={clsx('submenu-header', hasValidPath(menu) && 'clickable')}
				onClick={handleHeaderClick}
			>
				{menu.icon && (
					<span className='submenu-header-icon'>
						<Icon name={getIconName(menu.icon)!} size={18} />
					</span>
				)}
				<span className='submenu-header-text'>{menu.name}</span>
			</div>
			<div className='submenu-content'>{menu.children?.map((child) => renderSubMenuItem(child))}</div>
		</div>
	)
}

const Menu: FC<Props> = ({ sidebarVisible, setSidebarVisible, openSidebar }) => {
	const global = container.resolve(GlobalModel)
	const navigate = useNavigate()
	const location = useLocation()
	const currentPath = location.pathname

	// Use full menu data: items + setting
	const menuItems = global.menus?.items || []
	const settingItems = global.menus?.setting || []

	// Menu expanded state: false = collapsed (icon only), true = expanded (icon + text)
	const [expanded, setExpanded] = useState(false)

	// Logo hover state for showing toggle icon
	const [logoHovered, setLogoHovered] = useState(false)

	// Find all menu keys that should be expanded based on current path
	const getActiveParentKeys = useCallback(
		(items: App.Menu[], path: string, parentKeys: string[] = []): string[] => {
			for (const item of items) {
				const itemKey = item.key || item.path || item.name

				// Check children first (deeper match takes priority)
				if (item.children && item.children.length > 0) {
					const found = getActiveParentKeys(item.children, path, [...parentKeys, itemKey])
					if (found.length > 0) {
						return found
					}
				}

				// If this item matches, return current parent keys
				if (isMenuActive(item.path, path)) {
					return parentKeys
				}
			}
			return []
		},
		[]
	)

	// Expanded menu items in tree mode (expanded mode)
	const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

	// Track if we've initialized expanded keys for current path
	const initializedPathRef = useRef<string | null>(null)

	// Auto-expand parent menus when current path changes or menu data loads
	useEffect(() => {
		const allItems = [...menuItems, ...settingItems]
		if (allItems.length === 0) return // Wait for menu data to load

		const activeParents = getActiveParentKeys(allItems, currentPath)

		// Always expand active parents when path changes or on initial load
		if (activeParents.length > 0) {
			setExpandedKeys((prev) => {
				const next = new Set(prev)
				activeParents.forEach((key) => next.add(key))
				return next
			})
		}

		initializedPathRef.current = currentPath
	}, [currentPath, menuItems, settingItems, getActiveParentKeys])

	// SubMenu popup state for collapsed mode (hover triggered)
	const [popupMenu, setPopupMenu] = useState<{ menu: App.Menu; position: { top: number; left: number } } | null>(
		null
	)

	// Hover timeout ref for delayed popup
	const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const currentHoverMenuRef = useRef<string | null>(null)

	// Get current user name for display in expanded mode
	const userName = useMemo(() => {
		const currentUser = GetCurrentUser()
		if (currentUser) {
			return currentUser.member?.display_name || currentUser.name || ''
		}
		return ''
	}, [])

	// Sync menu width to CSS variable for other components to use
	const menuWidth = expanded ? 240 : 64
	document.documentElement.style.setProperty('--menu-width', `${menuWidth}px`)

	// Navigate to menu path
	const handleNavigate = useCallback(
		(path: string, menu: App.Menu) => {
			// Close popup if open
			setPopupMenu(null)

			// Sidebar-only mode: just navigate (page is full screen without Chatbox)
			if (isSidebarOnly(menu)) {
				navigate(path)
				return
			}

			// Default: emit openSidebar event to create a Tab
			window.$app?.Event?.emit('app/openSidebar', {
				path,
				title: menu.name || path,
				icon: getIconName(menu.icon)
			})
		},
		[navigate]
	)

	// Handle menu item hover (for collapsed mode with children)
	const handleMenuHover = useCallback(
		(menu: App.Menu, event: React.MouseEvent, isEnter: boolean) => {
			if (expanded) return // Only for collapsed mode

			const hasChildren = menu.children && menu.children.length > 0
			if (!hasChildren) return

			const menuKey = menu.key || menu.path || menu.name

			if (isEnter) {
				// Clear any existing timeout
				if (hoverTimeoutRef.current) {
					clearTimeout(hoverTimeoutRef.current)
				}

				currentHoverMenuRef.current = menuKey

				// Capture rect before timeout (event.currentTarget becomes null in async callback)
				const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()

				// Delay popup to avoid flickering
				hoverTimeoutRef.current = setTimeout(() => {
					if (currentHoverMenuRef.current === menuKey) {
						setPopupMenu({
							menu,
							position: { top: rect.top, left: rect.right + 8 }
						})
					}
				}, 100)
			} else {
				// Clear timeout on leave
				if (hoverTimeoutRef.current) {
					clearTimeout(hoverTimeoutRef.current)
				}
				currentHoverMenuRef.current = null
				// Don't close popup immediately - let the popup's own mouse events handle it
			}
		},
		[expanded]
	)

	// Handle menu item click
	const handleMenuClick = useCallback(
		(menu: App.Menu, event: React.MouseEvent) => {
			const hasChildren = menu.children && menu.children.length > 0
			const canNavigate = hasValidPath(menu)

			if (expanded) {
				// Expanded mode: toggle children or navigate
				if (hasChildren) {
					const key = menu.key || menu.path || menu.name
					setExpandedKeys((prev) => {
						const next = new Set(prev)
						if (next.has(key)) {
							next.delete(key)
						} else {
							next.add(key)
						}
						return next
					})
				} else if (canNavigate) {
					handleNavigate(menu.path, menu)
				}
			} else {
				// Collapsed mode: navigate if no children and has path
				if (!hasChildren && canNavigate) {
					handleNavigate(menu.path, menu)
				}
				// If has children, popup is shown on hover, click does nothing
			}
		},
		[expanded, handleNavigate]
	)

	// Toggle menu expanded state
	const handleLogoClick = () => {
		// Notify to disable sidebar/content transition temporarily
		window.$app?.Event?.emit('app/menuExpanding', true)
		setExpanded(!expanded)
		// Close popup when toggling
		setPopupMenu(null)
		// Re-enable transitions after menu animation completes (0.3s = 300ms)
		setTimeout(() => {
			window.$app?.Event?.emit('app/menuExpanding', false)
		}, 320)
	}

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (hoverTimeoutRef.current) {
				clearTimeout(hoverTimeoutRef.current)
			}
		}
	}, [])

	// Render menu item (recursive for tree mode)
	const renderMenuItem = (menu: App.Menu, index: number, level = 0) => {
		const hasChildren = menu.children && menu.children.length > 0
		const isActive = isMenuActive(menu.path, currentPath)
		const isChildActive = hasChildren && isMenuOrChildActive(menu, currentPath)
		const menuKey = menu.key || menu.path || menu.name
		const isExpanded = expandedKeys.has(menuKey)
		const canNavigate = hasValidPath(menu)

		const content = (
			<div
				className={clsx(
					'menu-item',
					// Active: self is active OR has active child (parent should also show active)
					(isActive || isChildActive) && 'active',
					hasChildren && 'has-children',
					isExpanded && 'expanded',
					!canNavigate && !hasChildren && 'no-click'
				)}
				style={expanded && level > 0 ? { paddingLeft: 12 + level * 16 } : undefined}
				onClick={(e) => handleMenuClick(menu, e)}
				onMouseEnter={(e) => handleMenuHover(menu, e, true)}
				onMouseLeave={(e) => handleMenuHover(menu, e, false)}
			>
				<span className='menu-icon'>
					{menu.icon && (
						<Icon
							name={getIconName(menu.icon)!}
							// Force smaller icon for child menu items
							size={level > 0 ? 18 : getIconSize(menu.icon, 24)}
						/>
					)}
				</span>
				{expanded && (
					<>
						<span className='menu-text'>{menu.name}</span>
						{hasChildren && (
							<span className={clsx('menu-arrow', isExpanded && 'expanded')}>
								<Icon name='icon-chevron-down' size={14} />
							</span>
						)}
					</>
				)}
			</div>
		)

		// Wrapper for collapsed mode with tooltip (only for items without children)
		const wrappedContent =
			!expanded && !hasChildren ? (
				<Tooltip key={`${index}-${level}`} title={menu.name} placement='right'>
					{content}
				</Tooltip>
			) : (
				<div key={`${index}-${level}`} className='menu-item-wrapper'>
					{content}
				</div>
			)

		// Render children in expanded mode
		if (expanded && hasChildren && isExpanded) {
			return (
				<div key={`${index}-${level}`} className='menu-group'>
					{wrappedContent}
					<div className='menu-children'>
						{menu.children!.map((child, childIndex) =>
							renderMenuItem(child, childIndex, level + 1)
						)}
					</div>
				</div>
			)
		}

		return wrappedContent
	}

	// Don't render if no menu items
	if (menuItems.length === 0 && settingItems.length === 0) {
		return null
	}

	return (
		<div className={clsx('chatbox-main-menu', expanded && 'expanded')}>
			<div className='menu-content'>
				<div
					className={clsx('menu-logo', logoHovered && 'hovered')}
					onClick={handleLogoClick}
					onMouseEnter={() => setLogoHovered(true)}
					onMouseLeave={() => setLogoHovered(false)}
				>
					<div className='menu-logo-content'>
						<img src={global.app_info?.logo} alt='Logo' />
						<span className='menu-logo-toggle'>
							<Icon name='material-dock_to_right' size={32} />
						</span>
					</div>
					{expanded && <span className='menu-brand-name'>{global.app_info?.name || 'Yao'}</span>}
				</div>

				<div className='menu-items'>
					{/* Main menu items */}
					{menuItems.map((menu, index) => renderMenuItem(menu, index))}
				</div>

				{/* Bottom section: Settings + Avatar */}
				<div className='menu-bottom'>
					{/* Setting items */}
					{settingItems.length > 0 && (
						<div className='menu-settings'>
							{settingItems.map((menu, index) =>
								renderMenuItem(menu, index + menuItems.length)
							)}
						</div>
					)}

					<div
						className='menu-avatar'
						onClick={() => {
							window.$app?.Event?.emit('app/menuNavigation', {
								path: '/settings/profile'
							})
							navigate('/settings/profile')
						}}
					>
						<UserAvatar size={32} showCard={!expanded} cardAlign='end' />
						{expanded && <span className='menu-avatar-text'>{userName}</span>}
					</div>
				</div>
			</div>

			{/* SubMenu popup for collapsed mode */}
			{popupMenu && (
				<SubMenuPopup
					menu={popupMenu.menu}
					position={popupMenu.position}
					onClose={() => setPopupMenu(null)}
					onNavigate={handleNavigate}
					currentPath={currentPath}
				/>
			)}
		</div>
	)
}

export default observer(Menu)
