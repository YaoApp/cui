import { useState, useEffect, useRef } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { useAppRoute, type AppRouteProps } from '@/hooks/useAppRoute'
import { getTaskDetail, getTaskServices } from '../kanban/services/mock'
import type { KanbanTask, ServiceBinding } from '../kanban/types'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'
import styles from './index.less'

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

const TaskServices = (props: AppRouteProps) => {
	const { params } = useAppRoute(props)
	const taskId = params['*'] || ''
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [task, setTask] = useState<KanbanTask | null>(null)
	const [services, setServices] = useState<ServiceBinding[]>([])
	const [loading, setLoading] = useState(false)
	const [editingIdx, setEditingIdx] = useState<number | null>(null)
	const [editValue, setEditValue] = useState('')
	const editInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (!taskId) return
		getTaskDetail(taskId).then(setTask)
	}, [taskId])

	useEffect(() => {
		if (!taskId) return
		setLoading(true)
		getTaskServices(taskId)
			.then(setServices)
			.finally(() => setLoading(false))
	}, [taskId])

	const handleEditName = (idx: number) => {
		setEditingIdx(idx)
		setEditValue(services[idx].alias || services[idx].name)
		setTimeout(() => editInputRef.current?.focus(), 0)
	}

	const handleSaveName = () => {
		if (editingIdx === null) return
		const val = editValue.trim()
		if (val) {
			setServices((prev) =>
				prev.map((svc, i) => i === editingIdx ? { ...svc, alias: val } : svc)
			)
		}
		setEditingIdx(null)
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
					<div className={viewStyles.profileActions}>
						<span className={viewStyles.sectionLabel}>
							<Icon name='material-dns' size={16} />
							{is_cn ? '服务' : 'Services'}
						</span>
					</div>
				</div>

				{loading ? (
					<div className={styles.emptyState}>
						<span>{is_cn ? '加载中...' : 'Loading...'}</span>
					</div>
				) : services.length === 0 ? (
					<div className={styles.emptyState}>
						<Icon name='material-cloud_off' size={40} />
						<span>{is_cn ? '暂无运行中的服务' : 'No services running'}</span>
					</div>
				) : (
					<div className={styles.serviceList}>
						{services.map((svc, idx) => (
							<div key={idx} className={styles.serviceRow}>
								<div className={`${styles.serviceIcon} ${svc.status === 'running' ? styles.running : ''}`}>
									<Icon
										name={svc.protocol === 'websocket' ? 'material-sync_alt' : 'material-language'}
										size={18}
									/>
								</div>
								<div className={styles.serviceInfo}>
									<div className={styles.serviceName}>
										{editingIdx === idx ? (
											<input
												ref={editInputRef}
												className={styles.nameInput}
												value={editValue}
												onChange={(e) => setEditValue(e.target.value)}
												onBlur={handleSaveName}
												onKeyDown={(e) => {
													if (e.key === 'Enter') handleSaveName()
													if (e.key === 'Escape') setEditingIdx(null)
												}}
											/>
										) : (
											<span className={styles.nameEditable} onClick={() => handleEditName(idx)}>
												{svc.alias || svc.name}
												<Icon name='material-edit' size={12} className={styles.nameEditIcon} />
											</span>
										)}
									</div>
									<div className={styles.serviceMeta}>
										{svc.alias && <span>{svc.name}</span>}
										{svc.pid && <span>PID {svc.pid}</span>}
										{svc.url && <span>{svc.url}</span>}
									</div>
								</div>
								<span className={`${styles.protocolTag} ${styles[svc.protocol || 'http']}`}>
									{svc.protocol || 'http'}
								</span>
								<span className={styles.portLabel}>:{svc.port}</span>
								<span className={`${styles.statusTag} ${styles[svc.status || 'stopped']}`}>
									<span style={{
										width: 6,
										height: 6,
										borderRadius: '50%',
										background: svc.status === 'running' ? '#52c41a' : '#d9d9d9',
										display: 'inline-block'
									}} />
									{svc.status === 'running' ? (is_cn ? '运行中' : 'Running') : (is_cn ? '已停止' : 'Stopped')}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

export default TaskServices
