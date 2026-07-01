import { useState, useEffect, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { useAppRoute, type AppRouteProps } from '@/hooks/useAppRoute'
import { getTaskDetail } from '../kanban/services/api'
import type { KanbanTask } from '../kanban/types'
import wsStyles from '../workspace/components/WorkspaceDetail/index.less'
import styles from './index.less'

interface TaskOutput {
	name: string
	type?: string
	path?: string
	size?: number
	created_at?: string
}

const getFileIcon = (name: string): string => {
	const ext = name.split('.').pop()?.toLowerCase() || ''
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
		jpeg: 'material-image',
		svg: 'material-image',
		html: 'material-language',
		css: 'material-palette',
		sql: 'material-storage',
		log: 'material-article',
		txt: 'material-article',
		zip: 'material-folder_zip',
		tar: 'material-folder_zip',
		gz: 'material-folder_zip'
	}
	return iconMap[ext] || 'material-insert_drive_file'
}

const formatSize = (bytes?: number): string => {
	if (!bytes || bytes === 0) return '—'
	const units = ['B', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(1024))
	return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

const TaskFiles = (props: AppRouteProps) => {
	const { params } = useAppRoute(props)
	const taskId = params['*'] || ''
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [task, setTask] = useState<KanbanTask | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!taskId) return
		setLoading(true)
		getTaskDetail(taskId)
			.then(setTask)
			.catch(() => setTask(null))
			.finally(() => setLoading(false))
	}, [taskId])

	const outputs: TaskOutput[] = useMemo(() => {
		if (!task?.outputs || !Array.isArray(task.outputs)) return []
		return [...(task.outputs as TaskOutput[])].sort((a, b) => {
			if (a.created_at && b.created_at) return b.created_at.localeCompare(a.created_at)
			return 0
		})
	}, [task?.outputs])

	const handleFileClick = (output: TaskOutput) => {
		if (!output.path) return
		let wsId = task?.workspace?.id || ''
		let filePath = output.path

		if (filePath.startsWith('workspace://')) {
			const withoutProtocol = filePath.slice('workspace://'.length)
			const slashIdx = withoutProtocol.indexOf('/')
			if (slashIdx > 0) {
				wsId = withoutProtocol.slice(0, slashIdx)
				filePath = withoutProtocol.slice(slashIdx + 1)
			}
		}

		if (!wsId || !filePath) return
		const url = `/preview?ws=${encodeURIComponent(wsId)}&path=${encodeURIComponent(filePath)}`
		window.$app.Navigate(url, { title: output.name, replace: true })
	}

	const handleRefresh = () => {
		if (!taskId) return
		setLoading(true)
		getTaskDetail(taskId)
			.then(setTask)
			.catch(() => setTask(null))
			.finally(() => setLoading(false))
	}

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
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>
						<Icon name='material-description' size={18} />
						<span>
							{is_cn ? '产出文件' : 'Output Files'}
							{outputs.length > 0 && ` (${outputs.length})`}
						</span>
					</div>
					<div className={styles.headerActions}>
						<div className={styles.toolBtn} onClick={handleRefresh} title={is_cn ? '刷新' : 'Refresh'}>
							<Icon name='material-refresh' size={16} />
						</div>
					</div>
				</div>

				{loading ? (
					<div className={styles.emptyState}>
						<span>{is_cn ? '加载中...' : 'Loading...'}</span>
					</div>
				) : outputs.length === 0 ? (
					<div className={styles.emptyState}>
						<Icon name='material-note_add' size={40} />
						<span>{is_cn ? '任务完成后将展示产出文件' : 'Output files will appear after task completion'}</span>
					</div>
				) : (
					<div className={wsStyles.fileList}>
						{outputs.map((output, idx) => (
							<div
								key={`${output.name}-${idx}`}
								className={wsStyles.fileRow}
								onClick={() => handleFileClick(output)}
							>
								<div className={wsStyles.fileIcon}>
									<Icon name={getFileIcon(output.name)} size={18} />
								</div>
								<div className={wsStyles.fileName}>{output.name}</div>
								<div className={wsStyles.fileTime}>
									{output.created_at
										? new Date(output.created_at).toLocaleString(
												is_cn ? 'zh-CN' : 'en-US',
												{ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
										  )
										: '—'}
								</div>
								<div className={wsStyles.fileSize}>{formatSize(output.size)}</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

export default TaskFiles
