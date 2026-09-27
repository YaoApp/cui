import { useEffect, useState } from 'react'
import { Spin } from 'antd'
import styles from './index.less'

/**
 * Resolve a dashboard page module by progressively matching path segments
 * to pages under @/pages/. Tries catch-all ($) then index for each prefix length.
 */
export async function resolveDashboardPage(segments: string[]): Promise<{
	mod: { default: React.ComponentType<any> }
	catchAll: string
}> {
	for (let len = segments.length; len >= 1; len--) {
		const dir = segments.slice(0, len).join('/')
		const catchAll = segments.slice(len).join('/')
		try {
			return { mod: await import(/* webpackExclude: /_bak/ */ `@/pages/${dir}/$`), catchAll }
		} catch { /* next */ }
		try {
			return { mod: await import(/* webpackExclude: /_bak/ */ `@/pages/${dir}/index`), catchAll }
		} catch { /* next */ }
	}
	return { mod: { default: () => null }, catchAll: '' }
}

/**
 * Render a CUI page by dynamically importing from @/pages/.
 * Accepts a path like "/workspace/list" or "$dashboard/workspace/list".
 * Passes __routeParams and __routeSearch so useAppRoute works without URL change.
 */
export const DashboardPageRenderer = ({ url }: { url: string }) => {
	const [resolved, setResolved] = useState<{
		Component: React.ComponentType<any>
		catchAll: string
		search: string
	} | null>(null)

	useEffect(() => {
		const path = url.replace('$dashboard', '')
		const [pathname, searchStr] = path.split('?')
		const segments = pathname.split('/').filter(Boolean)
		const search = searchStr ? `?${searchStr}` : ''

		resolveDashboardPage(segments).then(({ mod, catchAll }) => {
			setResolved({ Component: mod.default, catchAll, search })
		})
	}, [url])

	if (!resolved) {
		return <div className={styles.loading}><Spin size='small' /></div>
	}

	const { Component, catchAll, search } = resolved
	return (
		<div className={styles.container}>
			<Component __routeParams={{ '*': catchAll }} __routeSearch={search} />
		</div>
	)
}
