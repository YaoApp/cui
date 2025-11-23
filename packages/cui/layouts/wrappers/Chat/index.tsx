import { Button } from 'antd'
import { observer } from 'mobx-react-lite'
import { FC, PropsWithChildren, useState, useCallback, useEffect } from 'react'
import { container } from 'tsyringe'
import { GlobalModel } from '@/context/app'
import { LeftOutlined, RightOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { IPropsNeo } from '@/layouts/types'
import clsx from 'clsx'
import Menu from './Menu'
import Container from './Container/index'
import NeoPage, { NEO_PAGE_BREAKPOINT, NEO_PAGE_PADDING } from '@/chatbox/components/Page'
import './style.less'
import { useNavigate } from '@umijs/max'
import Icon from '@/widgets/Icon'

const MAIN_CONTENT_MIN_WIDTH = 320
const DEFAULT_WIDTH = 400

// Get maximum available width for sidebar while maintaining minimum content width
const getMaxWidth = () => {
	return window.innerWidth - MAIN_CONTENT_MIN_WIDTH
}

// Get maximum width for maximized state (full viewport minus button space)
const getMaximizedWidth = () => {
	return window.innerWidth - 40
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

const ChatWrapper: FC<PropsWithChildren> = ({ children }) => {
	const global = container.resolve(GlobalModel)

	// Use global state for sidebar management
	const sidebarVisible = global.sidebar_visible
	const sidebarWidth = global.sidebar_width
	const isMaximized = global.sidebar_maximized

	const [isAnimating, setIsAnimating] = useState(false)
	const [responsiveWidths, setResponsiveWidths] = useState(getResponsiveWidths())
	const [previousWidth, setPreviousWidth] = useState(DEFAULT_WIDTH)

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
				// 强制以正常模式显示，使用默认宽度
				const defaultWidth = getResponsiveWidths().default
				global.updateSidebarState(visible, false, defaultWidth)
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

	const props_neo: IPropsNeo = {
		stack: global.stack.paths.join('/'),
		api: global.app_info.optional?.neo?.api!,
		studio: global.app_info.optional?.neo?.studio,
		dock: global.app_info.optional?.neo?.dock || 'right-bottom'
	}
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
				// Open Page
				if (detail.path) {
					navigate(detail.path)
				}

				// Open Temporary Link
				if (detail.url) {
					if (detail.title) setCurrentPageName(detail.title || detail.url)
					setTemporaryLink(detail.url)
					setIsTemporaryView(true)
					navigate(detail.url)
				}
			}

			handleSetSidebarVisible(true)
		}

		const handleCloseSidebar = () => {
			handleSetSidebarVisible(false)
		}

		window.$app.Event.on('app/toggleSidebar', handleToggleSidebar)
		window.$app.Event.on('app/openSidebar', handleOpenSidebar)
		window.$app.Event.on('app/closeSidebar', handleCloseSidebar)

		return () => {
			window.$app.Event.off('app/toggleSidebar', handleToggleSidebar)
			window.$app.Event.off('app/openSidebar', handleOpenSidebar)
			window.$app.Event.off('app/closeSidebar', handleCloseSidebar)
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

	return (
		<div
			className={clsx(
				'chat-wrapper',
				sidebarVisible && 'with-sidebar',
				isAnimating && 'animating',
				isMaximized && 'maximized'
			)}
		>
			{/* <div className='chat-header'>
				<Button onClick={handleToggleLayout} style={{ marginRight: 8 }}>
					Switch to Admin
				</Button>
				<Button onClick={handleToggleSidebar}>
					{sidebarVisible ? 'Close Sidebar' : 'Open Sidebar'}
				</Button>
			</div> */}

			<Menu
				sidebarVisible={sidebarVisible}
				setSidebarVisible={handleSetSidebarVisible}
				openSidebar={openSidebar}
				closeSidebar={closeSidebar}
			/>
			<div
				className='chat-content'
				style={
					sidebarVisible && !isMaximized
						? { width: `calc(100% - ${sidebarWidth}px)` }
						: { marginLeft: '92px', width: 'calc(100% - 92px)' }
				}
			>
				{!sidebarVisible && (
					<Button
						type='text'
						icon={<Icon name='material-chevron_left' size={16} color='var(--color_text)' />}
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
						maxWidth: '1200px',
						height: '100%',
						padding: (() => {
							const availableWidth =
								window.innerWidth - (sidebarVisible ? sidebarWidth : 92)
							// If available width is less than or equal to breakpoint, don't add padding
							return availableWidth <= NEO_PAGE_BREAKPOINT ? 0 : `${NEO_PAGE_PADDING}px`
						})()
					}}
				>
					<NeoPage {...props_neo}></NeoPage>
				</div>
			</div>
			<div
				className={clsx('chat-sidebar', !sidebarVisible && 'hidden', isAnimating && 'animating')}
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
			{isMaximized && sidebarVisible && <div className='sidebar-overlay' onClick={handleToggleMaximize} />}
		</div>
	)
}

export default observer(ChatWrapper)
