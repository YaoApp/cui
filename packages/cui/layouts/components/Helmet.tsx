import { Fragment } from 'react'
import { Helmet } from 'react-helmet-async'

import config from '@/config'

import type { IPropsHelmet } from '../types'

// Get favicon MIME type based on URL extension
const getFaviconType = (url: string): string => {
	if (!url) return 'image/x-icon'
	const ext = url.split('.').pop()?.toLowerCase()
	switch (ext) {
		case 'png':
			return 'image/png'
		case 'svg':
			return 'image/svg+xml'
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg'
		case 'gif':
			return 'image/gif'
		case 'ico':
		default:
			return 'image/x-icon'
	}
}

const Index = (props: IPropsHelmet) => {
	const { theme, app_info } = props

	// Priority: favicon > logo > default favicon
	const faviconUrl = app_info.favicon || app_info.logo || require('@/public/favicon.ico')
	const faviconType = getFaviconType(faviconUrl)
	return (
		<Fragment>
			<Helmet>
				<link rel='shortcut icon' type={faviconType} href={faviconUrl} />
				<link rel='stylesheet' href={`/${$runtime.BASE}/theme/${theme}.css`} />
				<title>{app_info.name ? `${app_info.name} - ${app_info.description}` : config.name}</title>
			</Helmet>
		</Fragment>
	)
}

export default window.$app.memo(Index)
