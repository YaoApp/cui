import { Handle, memo, sleep } from '@/knife'
import EventEmitter from '@yaoapp/emittery'

window.$app = {
	api_prefix: '',
	memo,
	sleep,
	Handle,
	Event: new EventEmitter(),

	ResolveUrl(url: string): { resolved: string; type: 'dashboard' | 'sui' | 'external' } {
		if (url.startsWith('http://') || url.startsWith('https://')) {
			return { resolved: url, type: 'external' }
		}
		if (url.startsWith('$dashboard/')) {
			return { resolved: url.replace('$dashboard', ''), type: 'dashboard' }
		}
		return { resolved: url.startsWith('/web/') ? url : `/web${url}`, type: 'sui' }
	},

	Navigate(url: string, options?: { title?: string; icon?: string; replace?: boolean }) {
		const global = window.$global

		if (global?.detail_panel_active) {
			window.$app?.Event?.emit('app/openSidebar', {
				url,
				title: options?.title || url.split('/').pop() || url,
				icon: options?.icon
			})
			return
		}

		if (global?.sidebar_visible) {
			if (options?.replace) {
				window.$app?.Event?.emit('app/replaceRoute', {
					url,
					title: options?.title || url.split('/').pop() || url
				})
				return
			}

			const currentBase = window.location.pathname.split('/').filter(Boolean)[0] || ''
			const targetBase = url.split('/').filter(Boolean)[0] || ''
			if (targetBase && currentBase !== targetBase) {
				window.$app?.Event?.emit('app/openSidebar', {
					url,
					title: options?.title || url.split('/').pop() || url,
					icon: options?.icon
				})
				return
			}
		}

		const { history } = require('@umijs/max')
		options?.replace ? history.replace(url) : history.push(url)
	}
}
