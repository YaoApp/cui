import { useState, useEffect, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import { Tooltip, Popconfirm, message } from 'antd'
import Icon from '@/widgets/Icon'
import { useAppRoute, type AppRouteProps } from '@/hooks/useAppRoute'
import { getTaskDetail, getTaskProcesses, type TaskProcess } from '../kanban/services/mock'
import type { KanbanTask } from '../kanban/types'
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

const TaskActivity = (props: AppRouteProps) => {
	const { params } = useAppRoute(props)
	const taskId = params['*'] || ''
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [task, setTask] = useState<KanbanTask | null>(null)
	const [processes, setProcesses] = useState<TaskProcess[]>([])
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (!taskId) return
		getTaskDetail(taskId).then(setTask)
	}, [taskId])

	const loadProcesses = () => {
		if (!taskId) return
		setLoading(true)
		getTaskProcesses(taskId)
			.then(setProcesses)
			.finally(() => setLoading(false))
	}

	useEffect(() => {
		loadProcesses()
	}, [taskId])

	const killProcess = (proc: TaskProcess) => {
		setProcesses((prev) => prev.filter((p) => p.pid !== proc.pid))
		message.success(is_cn ? `已终止进程 ${proc.name} (PID: ${proc.pid})` : `Killed ${proc.name} (PID: ${proc.pid})`)
	}

	const summary = useMemo(() => {
		const running = processes.filter((p) => p.status === 'running').length
		const sleeping = processes.filter((p) => p.status === 'sleeping').length
		const stopped = processes.filter((p) => p.status === 'stopped').length
		const totalCpu = processes.reduce((sum, p) => sum + p.cpu, 0)
		const totalMem = processes.reduce((sum, p) => sum + p.memory, 0)
		return { running, sleeping, stopped, totalCpu, totalMem }
	}, [processes])

	const cpuClass = (cpu: number) => {
		if (cpu >= 20) return styles.high
		if (cpu >= 10) return styles.medium
		return ''
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
					<div className={styles.headerActions}>
						<div
							className={styles.toolBtn}
							onClick={loadProcesses}
							title={is_cn ? '刷新' : 'Refresh'}
						>
							<Icon name='material-refresh' size={16} />
						</div>
					</div>
				</div>

				{loading ? (
					<div className={styles.emptyState}>
						<span>{is_cn ? '加载中...' : 'Loading...'}</span>
					</div>
				) : processes.length === 0 ? (
					<div className={styles.emptyState}>
						<Icon name='material-hourglass_empty' size={40} />
						<span>{is_cn ? '暂无活动进程' : 'No active processes'}</span>
					</div>
				) : (
					<>
						<div className={styles.processTable}>
							<div className={styles.processHeader}>
								<span className={styles.colPid}>PID</span>
								<span className={styles.colName}>{is_cn ? '进程' : 'Process'}</span>
								<span className={styles.colPort}>{is_cn ? '端口' : 'Port'}</span>
								<span className={styles.colCpu}>CPU%</span>
								<span className={styles.colMem}>{is_cn ? '内存' : 'Mem'}</span>
								<span className={styles.colStatus}>{is_cn ? '状态' : 'Status'}</span>
								<span className={styles.colActions}></span>
							</div>
							{processes.map((proc) => (
								<div key={proc.pid} className={styles.processRow}>
									<span className={styles.colPid}>{proc.pid}</span>
									<span className={styles.colName}>
										{proc.name}
										{proc.command && (
											<span className={styles.commandHint} title={proc.command}>
												{proc.command}
											</span>
										)}
									</span>
									<span className={styles.colPort}>
										{proc.port ? <span className={styles.portTag}>{proc.port}</span> : '—'}
									</span>
									<span className={`${styles.colCpu} ${cpuClass(proc.cpu)}`}>
										{proc.cpu.toFixed(1)}
									</span>
									<span className={styles.colMem}>
										{proc.memory >= 1024
											? `${(proc.memory / 1024).toFixed(1)} G`
											: `${proc.memory} M`}
									</span>
									<span className={styles.colStatus}>
										<span className={`${styles.statusIndicator} ${styles[proc.status]}`} />
										{proc.status === 'running'
											? (is_cn ? '运行' : 'run')
											: proc.status === 'sleeping'
												? (is_cn ? '休眠' : 'sleep')
												: (is_cn ? '停止' : 'stop')}
									</span>
									<span className={styles.colActions}>
										{proc.status !== 'stopped' && (
											<Popconfirm
												title={
													is_cn
														? `确定终止进程 ${proc.name} (PID: ${proc.pid})？`
														: `Kill ${proc.name} (PID: ${proc.pid})?`
												}
												onConfirm={() => killProcess(proc)}
												okText={is_cn ? '终止' : 'Kill'}
												cancelText={is_cn ? '取消' : 'Cancel'}
											>
												<span className={styles.killBtn}>
													<Icon name='material-close' size={12} />
												</span>
											</Popconfirm>
										)}
									</span>
								</div>
							))}
						</div>
						<div className={styles.summary}>
							<span className={styles.summaryItem}>
								<span className={`${styles.statusIndicator} ${styles.running}`} />
								{summary.running} {is_cn ? '运行' : 'running'}
							</span>
							<span className={styles.summaryItem}>
								<span className={`${styles.statusIndicator} ${styles.sleeping}`} />
								{summary.sleeping} {is_cn ? '休眠' : 'sleeping'}
							</span>
							<span className={styles.summaryItem}>
								<span className={`${styles.statusIndicator} ${styles.stopped}`} />
								{summary.stopped} {is_cn ? '停止' : 'stopped'}
							</span>
							<span className={styles.summaryItem}>
								CPU {summary.totalCpu.toFixed(1)}%
							</span>
							<span className={styles.summaryItem}>
								{is_cn ? '内存' : 'Mem'} {summary.totalMem >= 1024
									? `${(summary.totalMem / 1024).toFixed(1)} GB`
									: `${summary.totalMem} MB`}
							</span>
						</div>
					</>
				)}
			</div>
		</div>
	)
}

export default TaskActivity
