import { useEffect, useRef, useState } from 'react'
import { getLocale } from '@umijs/max'
import { Spin } from 'antd'
import { local } from '@yaoapp/storex'
import Icon from '@/widgets/Icon'
import { sendMessageToIframe } from '@/pages/web/$'
import { executeAction } from '@/chatbox/messages/Action/actions'
import type { App } from '@/types'
import type { KanbanTask } from '../../types'
import styles from './index.less'

interface SidebarContentProps {
	url: string | null
	task?: KanbanTask | null
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const WorkspaceView = ({ task }: { task: KanbanTask }) => {
	const is_cn = getLocale() === 'zh-CN'
	if (!task.workspace) {
		return (
			<div className={styles.emptyState}>
				<Icon name='material-folder_open' size={32} />
				<p>{is_cn ? '未绑定工作区' : 'No workspace bound'}</p>
			</div>
		)
	}
	return (
		<div className={styles.infoTab}>
			<div className={styles.infoCard}>
				<div className={styles.infoCardHeader}>
					<Icon name='material-folder' size={14} />
					{task.workspace.name}
				</div>
				<div className={styles.infoCardBody}>
					{task.workspace.path && (
						<div className={styles.infoRow}>
							<span className={styles.infoLabel}>{is_cn ? '路径' : 'Path'}</span>
							<span className={styles.infoValue}>{task.workspace.path}</span>
						</div>
					)}
					{task.workspace.node_name && (
						<div className={styles.infoRow}>
							<span className={styles.infoLabel}>{is_cn ? '节点' : 'Node'}</span>
							<span className={styles.infoValue}>{task.workspace.node_name}</span>
						</div>
					)}
					<div className={styles.infoRow}>
						<span className={styles.infoLabel}>{is_cn ? '状态' : 'Status'}</span>
						<span className={styles.infoValue}>
							{task.workspace.status === 'online' ? (is_cn ? '在线' : 'Online') : (is_cn ? '离线' : 'Offline')}
						</span>
					</div>
				</div>
			</div>
			<span className={styles.linkBtn}>
				<Icon name='material-open_in_new' size={12} />
				{is_cn ? '打开工作区' : 'Open Workspace'}
			</span>
		</div>
	)
}

const ServicesView = ({ task }: { task: KanbanTask }) => {
	const is_cn = getLocale() === 'zh-CN'
	if (!task.services?.length) {
		return (
			<div className={styles.emptyState}>
				<Icon name='material-cloud_off' size={32} />
				<p>{is_cn ? '暂无关联服务' : 'No services'}</p>
			</div>
		)
	}
	return (
		<div className={styles.infoTab}>
			<div className={styles.infoCard}>
				<div className={styles.infoCardHeader}>
					<Icon name='material-language' size={14} />
					{is_cn ? '关联服务' : 'Services'}
				</div>
				<div className={styles.infoCardBody}>
					{task.services.map((s) => (
						<div key={s.port} className={styles.serviceItem}>
							<span className={styles.serviceStatus} />
							<span className={styles.serviceName}>{s.name}</span>
							<span className={styles.serviceUrl}>:{s.port}</span>
							<span className={styles.linkBtn}>
								<Icon name='material-open_in_new' size={11} />
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

const OutputsView = ({ task }: { task: KanbanTask }) => {
	const is_cn = getLocale() === 'zh-CN'
	if (!task.outputs?.length) {
		return (
			<div className={styles.emptyState}>
				<Icon name='material-folder_open' size={32} />
				<p>{is_cn ? '暂无产出文件' : 'No outputs yet'}</p>
			</div>
		)
	}
	return (
		<div className={styles.infoTab}>
			<div className={styles.infoCard}>
				<div className={styles.infoCardHeader}>
					<Icon name='material-attach_file' size={14} />
					{is_cn ? '产出文件' : 'Output Files'}
				</div>
				<div className={styles.infoCardBody}>
					{task.outputs.map((f) => (
						<div key={f.name} className={styles.outputItem}>
							<Icon name='material-description' size={14} style={{ color: 'var(--color_neo_icon_muted)' }} />
							<span className={styles.outputName}>{f.name}</span>
							<span className={styles.outputSize}>{formatFileSize(f.size)}</span>
							<span className={styles.linkBtn}>
								<Icon name='material-download' size={11} />
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

const SettingsView = ({ task }: { task: KanbanTask }) => {
	const is_cn = getLocale() === 'zh-CN'
	return (
		<div className={styles.infoTab}>
			<div className={styles.infoCard}>
				<div className={styles.infoCardHeader}>
					<Icon name='material-settings' size={14} />
					{is_cn ? '任务设置' : 'Task Settings'}
				</div>
				<div className={styles.infoCardBody}>
					{task.assistant_name && (
						<div className={styles.infoRow}>
							<span className={styles.infoLabel}>{is_cn ? 'AI 助手' : 'AI Assistant'}</span>
							<span className={styles.infoValue}>{task.assistant_name}</span>
						</div>
					)}
					{task.tags && task.tags.length > 0 && (
						<div className={styles.infoRow}>
							<span className={styles.infoLabel}>{is_cn ? '标签' : 'Tags'}</span>
							<span className={styles.infoValue}>{task.tags.join(', ')}</span>
						</div>
					)}
					{task.recurring?.enabled && (
						<>
							<div className={styles.infoRow}>
								<span className={styles.infoLabel}>{is_cn ? '调度模式' : 'Schedule'}</span>
								<span className={styles.infoValue}>
									{task.recurring.mode === 'fixed_time'
										? (is_cn ? '固定时间' : 'Fixed Time')
										: (is_cn ? '固定间隔' : 'Interval')}
								</span>
							</div>
							{task.recurring.cron && (
								<div className={styles.infoRow}>
									<span className={styles.infoLabel}>Cron</span>
									<span className={styles.infoValue}>{task.recurring.cron}</span>
								</div>
							)}
							{task.run_count != null && (
								<div className={styles.infoRow}>
									<span className={styles.infoLabel}>{is_cn ? '已执行' : 'Run Count'}</span>
									<span className={styles.infoValue}>{task.run_count}</span>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	)
}

const INTERNAL_VIEWS: Record<string, React.FC<{ task: KanbanTask }>> = {
	'__task/workspace': WorkspaceView,
	'__task/services': ServicesView,
	'__task/outputs': OutputsView,
	'__task/settings': SettingsView
}

async function resolveDashboardPage(segments: string[]): Promise<{
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

const DashboardPageRenderer = ({ url }: { url: string }) => {
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
		<div className={styles.dashboardContainer}>
			<Component __routeParams={{ '*': catchAll }} __routeSearch={search} />
		</div>
	)
}

const IframeRenderer = ({ url, isExternal }: { url: string; isExternal: boolean }) => {
	const ref = useRef<HTMLIFrameElement>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const handleMessage = (e: MessageEvent) => {
			if (!ref.current || e.source !== ref.current.contentWindow) return
			const { type, message: msg, data } = e.data || {}
			if (!type) return

			switch (type) {
				case 'action': {
					const { name, payload } = msg || data || {}
					if (name) executeAction(name, payload)
					break
				}
				case 'title': {
					const title = msg?.title || e.data?.title
					if (title) {
						window.$app?.Event?.emit('app/updateSidebarTabTitle', { url, title })
					}
					break
				}
				case 'updateTab': {
					const { url: newUrl, title } = msg || {}
					if (newUrl) {
						window.$app?.Event?.emit('app/updateSidebarTabTitle', {
							url: newUrl,
							title: title || newUrl
						})
					}
					break
				}
			}
		}

		window.addEventListener('message', handleMessage)
		return () => window.removeEventListener('message', handleMessage)
	}, [url])

	useEffect(() => {
		if (!loading && ref.current && !isExternal) {
			const getTheme = (): App.Theme => (local.xgen_theme || 'light') as App.Theme
			sendMessageToIframe(ref.current, {
				type: 'setup',
				message: { theme: getTheme(), locale: getLocale() }
			})
		}
	}, [loading, isExternal])

	return (
		<div className={styles.container}>
			<iframe
				key={url}
				ref={ref}
				src={url}
				className={styles.frame}
				onLoad={() => setLoading(false)}
				title='Sidebar Content'
				{...(isExternal ? { sandbox: 'allow-scripts allow-same-origin allow-popups allow-forms' } : {})}
				style={{ display: loading ? 'none' : 'block' }}
			/>
		</div>
	)
}

const SidebarContent = ({ url, task }: SidebarContentProps) => {
	if (!url) return null

	const InternalView = INTERNAL_VIEWS[url]
	if (InternalView && task) {
		return <InternalView task={task} />
	}

	if (url.startsWith('$dashboard/')) {
		return <DashboardPageRenderer key={url} url={url} />
	}

	const isExternal = url.startsWith('http://') || url.startsWith('https://')
	return <IframeRenderer key={url} url={url} isExternal={isExternal} />
}

export default window.$app.memo(SidebarContent)
