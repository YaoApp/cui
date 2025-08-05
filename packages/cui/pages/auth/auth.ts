import { GlobalModel } from '@/context/app'
import type { App } from '@/types'
import { findIndex } from 'lodash-es'
import type { UserInfo } from '@/openapi/signin'
import { getPath } from '@/utils'
import { local } from '@yaoapp/storex'
import { history } from '@umijs/max'

type AuthData = {
	user: UserInfo
	entry?: string
	logout_redirect?: string
}

export const AfterLogin = async (global: GlobalModel, data: AuthData): Promise<string> => {
	const user: App.User = {
		id: data.user.user_id || '',
		name: data.user.name || '',
		email: data.user.email || '',
		avatar: data.user.picture || '',
		type: 'user'
	}

	// Get App Menus
	await window.$app.Event.emit('app/getUserMenu')

	const menus = global.menus
	const entry = data.entry || global.app_info?.login?.entry?.['admin'] || '/auth/helloworld'
	const current_nav = findIndex(menus.items, (item) => item.path === entry) || 0
	global.user = user
	global.setMenus(menus, current_nav, false)

	local.user = user
	local.current_nav = current_nav
	local.login_url = getPath(history.location.pathname)
	local.logout_redirect = data.logout_redirect || false
	return entry
}
