import { useState, useEffect, useMemo, useCallback } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { useAppRoute, type AppRouteProps } from '@/hooks/useAppRoute'
import { getTaskFiles, getTaskDetail, type TaskFileEntry } from '../kanban/services/mock'
import type { KanbanTask } from '../kanban/types'
import wsStyles from '../workspace/components/WorkspaceDetail/index.less'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'
import styles from './index.less'

const getFileIcon = (entry: TaskFileEntry): string => {
	if (entry.is_dir) return 'material-folder'
	const ext = entry.name.split('.').pop()?.toLowerCase() || ''
	const iconMap: Record<string, string> = {
		ts: 'material-code',
		tsx: 'material-code',
		js: 'material-javascript',
		json: 'material-data_object',
		md: 'material-description',
		yaml: 'material-settings',
		yml: 'material-settings',
		sh: 'material-terminal',
		csv: 'material-table_chart',
		py: 'material-code',
		go: 'material-code',
		pdf: 'material-picture_as_pdf',
		docx: 'material-description',
		png: 'material-image',
		jpg: 'material-image',
		jpeg: 'material-image'
	}
	return iconMap[ext] || 'material-insert_drive_file'
}

const formatSize = (bytes: number): string => {
	if (bytes === 0) return '—'
	const units = ['B', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(1024))
	return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

const STATUS_COLORS: Record<string, string> = {
	running: '#52c41a',
	completed: '#52c41a',
	pending: '#faad14',
	creating: '#faad14',
	waiting_input: '#1890ff',
	failed: '#ff4d4f',
	paused: '#d9d9d9',
	cancelled: '#d9d9d9'
}

const TaskFiles = (props: AppRouteProps) => {
	const { params } = useAppRoute(props)
	const taskId = params['*'] || ''
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [task, setTask] = useState<KanbanTask | null>(null)
	const [currentPath, setCurrentPath] = useState('/')
	const [entries, setEntries] = useState<TaskFileEntry[]>([])
	const [loading, setLoading] = useState(false)
	const [showHidden, setShowHidden] = useState(false)

	useEffect(() => {
		if (!taskId) return
		getTaskDetail(taskId).then(setTask)
	}, [taskId])

	const loadDir = useCallback(
		async (path: string) => {
			if (!taskId) return
			setLoading(true)
			try {
				const data = await getTaskFiles(taskId, path)
				setEntries(data)
			} catch {
				setEntries([])
			} finally {
				setLoading(false)
			}
		},
		[taskId]
	)

	useEffect(() => {
		loadDir(currentPath)
	}, [currentPath, loadDir])

	const navigateTo = (entry: TaskFileEntry) => {
		if (!entry.is_dir) return
		const next = currentPath === '/' ? `/${entry.name}` : `${currentPath}/${entry.name}`
		setCurrentPath(next)
	}

	const navigateUp = () => {
		if (currentPath === '/') return
		const parts = currentPath.split('/').filter(Boolean)
		parts.pop()
		setCurrentPath(parts.length === 0 ? '/' : '/' + parts.join('/'))
	}

	const handlePreview = (entry: TaskFileEntry) => {
		if (entry.is_dir) return
		window.$app?.Event?.emit('app/toast', {
			type: 'info',
			content: is_cn ? `预览: ${entry.name}` : `Preview: ${entry.name}`
		})
	}

	const breadcrumbs = currentPath.split('/').filter(Boolean)

	const visibleEntries = useMemo(
		() => (showHidden ? entries : entries.filter((e) => !e.name.startsWith('.'))),
		[entries, showHidden]
	)

	if (!taskId) {
		return (
			<div className={styles.scrollWrap}>
				<div className={styles.container}>
					<div className={styles.emptyState}>
						<Icon name='material-error_outline' size={40} />
						<span>{is_cn ? '任务 ID 无效' : 'Invalid task ID'}</span>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.scrollWrap}>
			<div className={styles.container}>
				<div className={viewStyles.profileHeader}>
					<div className={viewStyles.profileInfo}>
						<h1 className={viewStyles.profileName}>
							<span
								className={styles.statusDot}
								style={{ background: STATUS_COLORS[task?.status || 'pending'] || '#d9d9d9' }}
							/>
							{task?.title || taskId}
						</h1>
						{task?.description && (
							<div className={viewStyles.profileDesc}>{task.description}</div>
						)}
					</div>
					<div className={styles.headerActions}>
						<div
							className={`${styles.toolBtn} ${showHidden ? styles.active : ''}`}
							onClick={() => setShowHidden((v) => !v)}
							title={is_cn ? '显示隐藏文件' : 'Show hidden files'}
						>
							<Icon name={showHidden ? 'material-visibility' : 'material-visibility_off'} size={16} />
						</div>
						<div
							className={styles.toolBtn}
							onClick={() => loadDir(currentPath)}
							title={is_cn ? '刷新' : 'Refresh'}
						>
							<Icon name='material-refresh' size={16} />
						</div>
					</div>
				</div>

				<div className={wsStyles.breadcrumb}>
					<span
						className={`${wsStyles.crumb} ${currentPath === '/' ? wsStyles.crumbActive : ''}`}
						onClick={() => setCurrentPath('/')}
					>
						<Icon name='material-home' size={14} />
					</span>
					{breadcrumbs.map((part, i) => (
						<span key={i} className={wsStyles.crumbGroup}>
							<span className={wsStyles.crumbSep}>/</span>
							<span
								className={`${wsStyles.crumb} ${
									i === breadcrumbs.length - 1 ? wsStyles.crumbActive : ''
								}`}
								onClick={() => {
									const path = '/' + breadcrumbs.slice(0, i + 1).join('/')
									setCurrentPath(path)
								}}
							>
								{part}
							</span>
						</span>
					))}
					{currentPath !== '/' && (
						<span className={wsStyles.crumbUp} onClick={navigateUp}>
							<Icon name='material-arrow_upward' size={14} />
						</span>
					)}
				</div>

				<div className={wsStyles.fileList}>
					{loading ? (
						<div className={wsStyles.fileLoading}>
							<span>{is_cn ? '加载中...' : 'Loading...'}</span>
						</div>
					) : visibleEntries.length === 0 ? (
						<div className={wsStyles.fileEmpty}>
							<Icon name='material-folder_off' size={40} />
							<span>{is_cn ? '空目录' : 'Empty directory'}</span>
						</div>
					) : (
						visibleEntries.map((entry) => (
							<div
								key={entry.name}
								className={`${wsStyles.fileRow} ${entry.is_dir ? wsStyles.fileRowDir : ''}`}
								onClick={() => (entry.is_dir ? navigateTo(entry) : handlePreview(entry))}
							>
								<div className={wsStyles.fileIcon}>
									<Icon name={getFileIcon(entry)} size={18} />
								</div>
								<div className={wsStyles.fileName}>{entry.name}</div>
								<div className={wsStyles.fileTime}>
									{entry.mod_time
										? new Date(entry.mod_time).toLocaleString(
												is_cn ? 'zh-CN' : 'en-US',
												{
													month: 'short',
													day: 'numeric',
													hour: '2-digit',
													minute: '2-digit'
												}
										  )
										: '—'}
								</div>
								<div className={wsStyles.fileSize}>
									{entry.is_dir ? '—' : formatSize(entry.size)}
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	)
}

export default TaskFiles
