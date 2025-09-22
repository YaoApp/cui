import '@/styles/index.less'

import { ConfigProvider } from 'antd'
import { observer } from 'mobx-react-lite'
import { useLayoutEffect, useState } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { container } from 'tsyringe'

import { GlobalContext, GlobalModel } from '@/context/app'
import { useIntl } from '@/hooks'
import { Outlet, useLocation } from '@umijs/max'

import Helmet from './components/Helmet'
import LoginWrapper from './wrappers/Login'
import AuthWrapper from './wrappers/Auth'
import AdminWrapper from './wrappers/Admin'
import ChatWrapper from './wrappers/Chat'

import type { IPropsHelmet, IPropsLoginWrapper } from './types'

const Index = () => {
	const messages = useIntl()
	const [global] = useState(() => container.resolve(GlobalModel))
	const [isInitialLoad, setIsInitialLoad] = useState(true)
	const { pathname, search } = useLocation()
	const is_login = pathname.indexOf('/login/') !== -1 || pathname === '/'
	const is_auth = pathname === '/auth'

	// For OAuth login
	const is_auth_signin = pathname === '/auth/signin'
	const is_auth_signin_totp = pathname === '/auth/signin/totp'
	const is_auth_signin_sms = pathname === '/auth/signin/sms'
	const is_auth_logout = pathname === '/auth/logout'
	const is_auth_back = pathname.startsWith('/auth/back/')
	const is_auth_consent = pathname === '/auth/consent'
	const is_auth_helloworld = pathname === '/auth/helloworld'

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
			console.log(pathname)
			if (pathname === '/chat' || pathname === '/chat/') {
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

	const renderMainContent = () => {
		// OAuth login
		if (
			is_auth_signin ||
			is_auth_consent ||
			is_auth_signin_totp ||
			is_auth_signin_sms ||
			is_auth_back ||
			is_auth_logout ||
			is_auth_helloworld
		) {
			return <Outlet />
		}

		if (is_login) {
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

		if (global.layout === 'Chat') {
			return (
				<ChatWrapper>
					<Outlet />
				</ChatWrapper>
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
