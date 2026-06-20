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
	const [aliases, setAliases] = useState<Record<number, string>>({})
	const [editingPort, setEditingPort] = useState<number | null>(null)

	const handleAliasChange = (port: number, value: string) => {
		setAliases((prev) => ({ ...prev, [port]: value }))
	}

	const handleAliasConfirm = (port: number) => {
		setEditingPort(null)
		window.$app?.Event?.emit('app/toast', { type: 'success', message: `Alias saved for :${port}` })
	}

	if (!task.services?.length) {
		return (
			<div className={styles.emptyState}>
				<Icon name='material-cloud_off' size={32} />
				<p>{is_cn ? '暂无运行中的服务' : 'No running services'}</p>
				<p style={{ fontSize: 11, opacity: 0.6 }}>{is_cn ? '端口将在 Computer 启动后自动检测' : 'Ports will be auto-detected when Computer starts'}</p>
			</div>
		)
	}

	return (
		<div className={styles.infoTab}>
			<div className={styles.infoCard}>
				<div className={styles.infoCardHeader}>
					<Icon name='material-dns' size={14} />
					{is_cn ? '监听端口' : 'Listening Ports'}
					<span className={styles.headerBadge}>{task.services.length}</span>
				</div>
				<div className={styles.infoCardBody}>
					{task.services.map((s) => (
						<div key={s.port} className={styles.serviceItem}>
							<span className={styles.serviceStatus} />
							<span className={styles.servicePort}>:{s.port}</span>
							<span className={styles.serviceProtocol}>{s.protocol || 'http'}</span>
							{editingPort === s.port ? (
								<input
									className={styles.aliasInput}
									value={aliases[s.port] ?? s.alias ?? s.name}
									onChange={(e) => handleAliasChange(s.port, e.target.value)}
									onBlur={() => handleAliasConfirm(s.port)}
									onKeyDown={(e) => e.key === 'Enter' && handleAliasConfirm(s.port)}
									autoFocus
								/>
							) : (
								<span
									className={styles.serviceName}
									onClick={() => setEditingPort(s.port)}
									title={is_cn ? '点击编辑别名' : 'Click to edit alias'}
								>
									{aliases[s.port] || s.alias || s.name}
									<Icon name='material-edit' size={10} className={styles.editHint} />
								</span>
							)}
							{s.pid && <span className={styles.servicePid}>PID {s.pid}</span>}
							<span className={styles.linkBtn} title={is_cn ? '打开预览' : 'Open Preview'}>
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

	const handleUpload = () => {
		window.$app?.Event?.emit('app/toast', { type: 'info', message: is_cn ? '上传功能即将上线' : 'Upload coming soon' })
	}

	return (
		<div className={styles.infoTab}>
			<div className={styles.infoCard}>
				<div className={styles.infoCardHeader}>
					<Icon name='material-input' size={14} />
					{is_cn ? '输入（附件）' : 'Inputs'}
				</div>
				<div className={styles.infoCardBody}>
					{task.inputs && task.inputs.length > 0 ? (
						task.inputs.map((f) => (
							<div key={f.name} className={styles.outputItem}>
								<Icon name='material-description' size={14} style={{ color: 'var(--color_neo_icon_muted)' }} />
								<span className={styles.outputName}>{f.name}</span>
								<span className={styles.outputSize}>{formatFileSize(f.size)}</span>
								<span className={styles.linkBtn}>
									<Icon name='material-visibility' size={11} />
								</span>
							</div>
						))
					) : (
						<div className={styles.emptyHint}>{is_cn ? '暂无输入文件' : 'No inputs'}</div>
					)}
					<div className={styles.uploadRow}>
						<span className={styles.linkBtn} onClick={handleUpload}>
							<Icon name='material-upload_file' size={12} />
							{is_cn ? '上传文件' : 'Upload File'}
						</span>
					</div>
				</div>
			</div>

			<div className={styles.infoCard}>
				<div className={styles.infoCardHeader}>
					<Icon name='material-output' size={14} />
					{is_cn ? '输出（产出）' : 'Outputs'}
				</div>
				<div className={styles.infoCardBody}>
					{task.outputs && task.outputs.length > 0 ? (
						task.outputs.map((f) => (
							<div key={f.name} className={styles.outputItem}>
								<Icon name='material-description' size={14} style={{ color: 'var(--color_neo_icon_muted)' }} />
								<span className={styles.outputName}>{f.name}</span>
								<span className={styles.outputSize}>{formatFileSize(f.size)}</span>
								<span className={styles.linkBtn}>
									<Icon name='material-download' size={11} />
								</span>
							</div>
						))
					) : (
						<div className={styles.emptyHint}>{is_cn ? '暂无产出文件' : 'No outputs yet'}</div>
					)}
				</div>
			</div>
		</div>
	)
}

const INTERNAL_VIEWS: Record<string, React.FC<{ task: KanbanTask }>> = {
	'__task/workspace': WorkspaceView,
	'__task/services': ServicesView,
	'__task/outputs': OutputsView
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
