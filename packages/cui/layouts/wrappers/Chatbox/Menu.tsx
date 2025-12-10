import { FC, useState, useMemo } from 'react'
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

interface Props {
	sidebarVisible?: boolean
	setSidebarVisible?: (visible: boolean, maximize?: boolean, forceNormal?: boolean) => void
	closeSidebar?: () => void
	openSidebar?: (temporaryLink?: string, title?: string) => void
}

const Menu: FC<Props> = ({ sidebarVisible, setSidebarVisible, openSidebar }) => {
	const global = container.resolve(GlobalModel)
	const quick_items = global.menus?.quick || []
	const navigate = useNavigate()
	const location = useLocation()
	const currentPath = location.pathname

	// Menu expanded state: false = collapsed (icon only), true = expanded (icon + text)
	const [expanded, setExpanded] = useState(false)

	// Get current user name for display in expanded mode
	const userName = useMemo(() => {
		const currentUser = GetCurrentUser()
		if (currentUser) {
			// Priority: member display_name > user name
			return currentUser.member?.display_name || currentUser.name || ''
		}
		return ''
	}, [])

	// Sync menu width to CSS variable for other components to use
	const menuWidth = expanded ? 200 : 64
	document.documentElement.style.setProperty('--menu-width', `${menuWidth}px`)

	if (quick_items.length == 0) {
		return null
	}

	const NavigateTo = (path: string, menu?: App.Menu) => {
		// Emit event to mark this navigation as triggered from menu
		window.$app?.Event?.emit('app/menuNavigation', { path, menu })

		navigate(path)

		// Sidebar-only mode: don't open sidebar (page is full screen without Chatbox)
		if (menu && isSidebarOnly(menu)) {
			return
		}

		// Default: open sidebar in normal mode
		setSidebarVisible?.(true, false, true)
	}

	const handleNavChange = (menu: App.Menu) => {
		// Special action: open sidebar (not a real route)
		if (menu.path === 'open:sidebar') {
			setSidebarVisible?.(true, false, true)
			return
		}

		NavigateTo(menu.path, menu)
	}

	// Toggle menu expanded state
	const handleLogoClick = () => {
		// Notify to disable sidebar/content transition temporarily
		window.$app?.Event?.emit('app/menuExpanding', true)
		setExpanded(!expanded)
		// Re-enable transitions after menu animation completes (0.3s = 300ms)
		setTimeout(() => {
			window.$app?.Event?.emit('app/menuExpanding', false)
		}, 320)
	}

	// Render menu item content
	const renderMenuItem = (menu: App.Menu, index: number) => {
		const content = (
			<div
				className={clsx('menu-item', isMenuActive(menu.path, currentPath) && 'active')}
				onClick={() => handleNavChange(menu)}
			>
				<span className='menu-icon'>
					{menu.icon && (
						<Icon
							name={typeof menu.icon === 'string' ? menu.icon : menu.icon.name}
							size={typeof menu.icon === 'string' ? 24 : menu.icon.size}
						/>
					)}
				</span>
				{expanded && <span className='menu-text'>{menu.name}</span>}
			</div>
		)

		// Only show tooltip in collapsed mode
		if (expanded) {
			return (
				<div key={index} className='menu-item-wrapper'>
					{content}
				</div>
			)
		}

		return (
			<Tooltip key={index} title={menu.name} placement='right'>
				{content}
			</Tooltip>
		)
	}

	return (
		<div className={clsx('chatbox-main-menu', expanded && 'expanded')}>
			<div className='menu-content'>
				<div className='menu-logo' onClick={handleLogoClick}>
					<img src={global.app_info?.logo} alt='Logo' />
					{expanded && <span className='menu-brand-name'>{global.app_info?.name || 'Yao'}</span>}
				</div>

				<div className='menu-items'>{quick_items.map(renderMenuItem)}</div>

				<div
					className='menu-avatar'
					onClick={() => {
						// Mark as menu navigation, then navigate to settings
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
	)
}

export default observer(Menu)
