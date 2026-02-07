import '@/styles/index.less'

import { ConfigProvider } from 'antd'
import { observer } from 'mobx-react-lite'
import { useEffect, useLayoutEffect, useState } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { container } from 'tsyringe'

import { GlobalContext, GlobalModel } from '@/context/app'
import { useIntl } from '@/hooks'
import { history, Outlet, useLocation } from '@umijs/max'

import Helmet from './components/Helmet'
import LoginWrapper from './wrappers/Login'
import AuthWrapper from './wrappers/Auth'
import AdminWrapper from './wrappers/Admin'
import ChatWrapper from './wrappers/Chat'
import ChatboxWrapper from './wrappers/Chatbox'

import type { IPropsHelmet, IPropsLoginWrapper } from './types'

// Standalone pages that render without wrappers (OAuth, invitations, etc.)
const STANDALONE_PAGES = new Map([
	// OAuth authentication pages
	['auth_entry', '/auth/entry'], // Unified login/register entry point
	['auth_entry_mfa', '/auth/entry/mfa'], // MFA verification
	['auth_entry_invite', '/auth/entry/invite'], // Invitation code verification
	['auth_logout', '/auth/logout'],
	['auth_back', '/auth/back/'],
	['auth_consent', '/auth/consent'],
	['auth_helloworld', '/auth/helloworld'],
	// Team pages
	['team_select', '/team/select'],
	['team_invite', '/team/invite/']
])

// Check if current path matches any standalone page
const isStandalonePage = (pathname: string): boolean => {
	// Check for trace view mode: /trace/{id}/view
	if (pathname.startsWith('/trace/') && pathname.endsWith('/view')) {
		return true
	}

	return Array.from(STANDALONE_PAGES.values()).some((route) => {
		// For routes ending with '/', use startsWith (e.g., /auth/back/, /team/invite/)
		if (route.endsWith('/')) {
			return pathname.startsWith(route)
		}
		// For exact routes, use strict equality
		return pathname === route
	})
}

const Index = () => {
	const messages = useIntl()
	const [global] = useState(() => container.resolve(GlobalModel))
	const [isInitialLoad, setIsInitialLoad] = useState(true)
	const { pathname, search } = useLocation()
	const is_login = pathname.indexOf('/login/') !== -1 || pathname === '/'
	const is_auth = pathname === '/auth'
	const is_standalone = isStandalonePage(pathname)

	useLayoutEffect(() => {
		window.$global = global

		global.locale_messages = messages
		global.on()
		global.stack.on()

		return () => {
			global.off()
			global.stack.off()
		}
	}, [])

	useLayoutEffect(() => {
		global.visible_menu = true
		global.hide_nav = search.indexOf('__hidemenu=1') !== -1
		global.stack.reset()

		// Chat Layout
		if (global.layout === 'Chat') {
			if (pathname === '/chat' || pathname === '/chat/' || pathname.startsWith('/chatdev')) {
				global.setSidebarVisible(false)
			}
		}

		// 基于路由的侧边栏控制 - 仅在首次加载时生效
		if (isInitialLoad && global.layout === 'Chat') {
			if (pathname.startsWith('/settings/')) {
				// /settings/* 路由：最大化侧边栏
				global.updateSidebarState(true, true, window.innerWidth - 40)
			} else if (pathname !== '/' && !is_login && !is_auth) {
				// 其他路由：显示默认宽度侧边栏
				const screenWidth = window.innerWidth
				const defaultWidth = Math.min(screenWidth * 0.618, screenWidth - 320)
				global.updateSidebarState(true, false, defaultWidth)
			}
			// 标记首次加载已完成
			setIsInitialLoad(false)
		}
	}, [pathname, global.layout, isInitialLoad])

	const props_helmet: IPropsHelmet = {
		theme: global.theme,
		app_info: global.app_info
	}

	const props_Login_wrapper: IPropsLoginWrapper = {
		logo: global.app_info?.logo,
		admin: global.app_info?.login?.admin,
		user: global.app_info?.login?.user
	}

	// Redirect legacy login pages to /auth/entry when OpenAPI is enabled
	useEffect(() => {
		if (is_login && global.isOpenAPIEnabled) {
			history.push('/auth/entry')
		}
	}, [is_login, global.isOpenAPIEnabled])

	const renderMainContent = () => {
		// Standalone pages (OAuth, invitations, etc.) - render without wrappers
		if (is_standalone) {
			return <Outlet />
		}

		if (is_login) {
			// When OpenAPI is enabled, don't render the legacy login wrapper
			if (global.isOpenAPIEnabled) return null

			return (
				<LoginWrapper {...props_Login_wrapper}>
					<Outlet />
				</LoginWrapper>
			)
		}

		if (is_auth) {
			return (
				<AuthWrapper {...props_Login_wrapper}>
					<Outlet />
				</AuthWrapper>
			)
		}

		// Force ChatboxWrapper for /chatdev route regardless of global.layout
		if (pathname.startsWith('/chatdev')) {
			return (
				<ChatboxWrapper>
					<Outlet />
				</ChatboxWrapper>
			)
		}

		if (global.layout === 'Chat') {
			return (
				<ChatboxWrapper>
					<Outlet />
				</ChatboxWrapper>
			)
		}

		return (
			<AdminWrapper>
				<Outlet />
			</AdminWrapper>
		)
	}

	return (
		<HelmetProvider>
			<Helmet {...props_helmet}></Helmet>
			<ConfigProvider prefixCls='xgen'>
				<GlobalContext.Provider value={global}>{renderMainContent()}</GlobalContext.Provider>
			</ConfigProvider>
		</HelmetProvider>
	)
}

export default new window.$app.Handle(Index).by(observer).get()
