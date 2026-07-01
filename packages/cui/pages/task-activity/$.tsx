import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { useAppRoute, type AppRouteProps } from '@/hooks/useAppRoute'
import { AgentTasks, type TaskItem, type ProcessInfo, type SystemLoad, type ProcessesResponse } from '@/openapi/agent/tasks'
import styles from './index.less'

function getTasksAPI(): AgentTasks | null {
	const openapi = window.$app?.openapi
	if (!openapi) return null
	return new AgentTasks(openapi)
}

const SYSTEM_USERS = ['root']

function formatBytes(bytes: number): string {
	if (bytes <= 0) return '0 B'
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatUptime(sec: number): string {
	if (sec < 60) return `${sec}s`
	if (sec < 3600) return `${Math.floor(sec / 60)}m`
	if (sec < 86400) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`
	return `${Math.floor(sec / 86400)}d ${Math.floor((sec % 86400) / 3600)}h`
}

type SortField = 'mem' | 'cpu'

const TaskActivity = (props: AppRouteProps) => {
	const { params } = useAppRoute(props)
	const taskId = params['*'] || ''
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [taskInfo, setTaskInfo] = useState<TaskItem | null>(null)
	const [processes, setProcesses] = useState<ProcessInfo[]>([])
	const [load, setLoad] = useState<SystemLoad | null>(null)
	const [loading, setLoading] = useState(false)
	const [notRunning, setNotRunning] = useState(false)
	const [error, setError] = useState(false)
	const [sortBy, setSortBy] = useState<SortField>('mem')
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pid: number } | null>(null)
	const menuRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!taskId) return
		const api = getTasksAPI()
		if (!api) return
		api.Get(taskId, locale).then((res) => {
			if (!window.$app?.openapi?.IsError(res)) {
				const data = window.$app!.openapi.GetData(res)
				if (data) setTaskInfo(data)
			}
		})
	}, [taskId, locale])

	const loadProcesses = useCallback(async (fast = true) => {
		if (!taskId) return
		const api = getTasksAPI()
		if (!api) return
		setLoading(true)
		setError(false)
		try {
			const res = await api.GetProcesses(taskId, fast)
			if (window.$app?.openapi?.IsError(res)) {
				setError(true)
				return
			}
			const data = window.$app!.openapi.GetData(res) as ProcessesResponse | null
			if (!data) {
				setError(true)
				return
			}
			if ('status' in data && data.status === 'sandbox_not_running') {
				setNotRunning(true)
				setProcesses([])
				setLoad(null)
			} else if ('processes' in data) {
				setNotRunning(false)
				setProcesses(data.processes || [])
				setLoad(data.load || null)
			}
		} catch {
			setError(true)
		} finally {
			setLoading(false)
		}
	}, [taskId])

	useEffect(() => {
		loadProcesses(true)
	}, [loadProcesses])

	useEffect(() => {
		if (!contextMenu) return
		const handleDismiss = (e: MouseEvent) => {
			if (menuRef.current && menuRef.current.contains(e.target as Node)) return
			setContextMenu(null)
		}
		const handleScroll = () => setContextMenu(null)
		document.addEventListener('mousedown', handleDismiss)
		document.addEventListener('scroll', handleScroll, true)
		return () => {
			document.removeEventListener('mousedown', handleDismiss)
			document.removeEventListener('scroll', handleScroll, true)
		}
	}, [contextMenu])

	const filteredProcesses = useMemo(() => {
		return processes.filter((p) => !SYSTEM_USERS.includes(p.user))
	}, [processes])

	const sortedProcesses = useMemo(() => {
		const sorted = [...filteredProcesses]
		if (sortBy === 'mem') {
			sorted.sort((a, b) => b.rssBytes - a.rssBytes)
		} else {
			sorted.sort((a, b) => b.cpuPercent - a.cpuPercent)
		}
		return sorted
	}, [filteredProcesses, sortBy])

	const handleContextMenu = (e: React.MouseEvent, pid: number) => {
		e.preventDefault()
		setContextMenu({ x: e.clientX, y: e.clientY, pid })
	}

	const handleKill = async (pid: number) => {
		setContextMenu(null)
		if (!taskId) return
		const api = getTasksAPI()
		if (!api) return
		try {
			await api.Exec(taskId, ['kill', '-9', String(pid)], true)
			setTimeout(() => loadProcesses(true), 500)
		} catch {
			// ignore
		}
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
				<div className={styles.pageHeader}>
					<div className={styles.pageTitle}>
						<Icon name='material-monitor_heart' size={16} />
						<span>{taskInfo?.title ? `${taskInfo.title} ${is_cn ? '进程' : 'Processes'}` : (is_cn ? '系统活动' : 'System Activity')}</span>
					</div>
					<div
						className={styles.toolBtn}
						onClick={() => loadProcesses(false)}
						title={is_cn ? '刷新 (完整采样)' : 'Refresh (full sampling)'}
					>
						<Icon name='material-refresh' size={14} />
					</div>
				</div>

				{load && !notRunning && (
					<div className={styles.loadSummary}>
						<div className={styles.loadItem}>
							<span className={styles.loadLabel}>CPU</span>
							<span className={styles.loadValue}>{load.cpuUsage.toFixed(1)}%</span>
							<span className={styles.loadMeta}>{load.cpuCount} {is_cn ? '核' : 'cores'}</span>
						</div>
						<div className={styles.loadItem}>
							<span className={styles.loadLabel}>{is_cn ? '内存' : 'MEM'}</span>
							<span className={styles.loadValue}>{formatBytes(load.memUsed)}</span>
							<span className={styles.loadMeta}>/ {formatBytes(load.memTotal)}</span>
						</div>
						<div className={styles.loadItem}>
							<span className={styles.loadLabel}>LOAD</span>
							<span className={styles.loadValue}>{load.load1.toFixed(2)}</span>
							<span className={styles.loadMeta}>{load.load5.toFixed(2)} / {load.load15.toFixed(2)}</span>
						</div>
						<div className={styles.loadItem}>
							<span className={styles.loadLabel}>{is_cn ? '运行' : 'Up'}</span>
							<span className={styles.loadValue}>{formatUptime(load.uptimeSec)}</span>
						</div>
					</div>
				)}

				{loading ? (
					<div className={styles.emptyState}>
						<span>{is_cn ? '加载中...' : 'Loading...'}</span>
					</div>
				) : error ? (
					<div className={styles.emptyState}>
						<Icon name='material-error_outline' size={40} />
						<span>{is_cn ? '加载失败' : 'Failed to load'}</span>
					</div>
				) : notRunning ? (
					<div className={styles.emptyState}>
						<Icon name='material-power_settings_new' size={40} />
						<span>{is_cn ? 'Sandbox 未运行' : 'Sandbox not running'}</span>
						<span style={{ fontSize: 12, opacity: 0.6 }}>
							{is_cn ? '启动任务后将显示进程活动' : 'Process activity will appear after the task starts'}
						</span>
					</div>
				) : sortedProcesses.length === 0 ? (
					<div className={styles.emptyState}>
						<Icon name='material-do_not_disturb_on' size={40} />
						<span>{is_cn ? '暂无运行进程' : 'No running processes'}</span>
					</div>
				) : (
					<div className={styles.processTable}>
						<div className={styles.processHeader}>
							<span className={styles.colPid}>PID</span>
							<span className={styles.colCommand}>{is_cn ? '命令' : 'Command'}</span>
							<span
								className={`${styles.colCpu} ${styles.sortable} ${sortBy === 'cpu' ? styles.sortActive : ''}`}
								onClick={() => setSortBy('cpu')}
							>
								CPU%{sortBy === 'cpu' && ' ↓'}
							</span>
							<span
								className={`${styles.colMem} ${styles.sortable} ${sortBy === 'mem' ? styles.sortActive : ''}`}
								onClick={() => setSortBy('mem')}
							>
								{is_cn ? '内存' : 'MEM'}{sortBy === 'mem' && ' ↓'}
							</span>
						</div>
						{sortedProcesses.map((proc, idx) => (
							<div
								key={idx}
								className={styles.processRow}
								onContextMenu={(e) => handleContextMenu(e, proc.pid)}
							>
								<span className={styles.colPid}>{proc.pid}</span>
								<span className={styles.colCommand} title={proc.command}>
									{proc.command}
								</span>
								<span className={styles.colCpu}>
									<span className={proc.cpuPercent > 50 ? styles.cpuHigh : proc.cpuPercent > 20 ? styles.cpuMed : ''}>
										{proc.cpuPercent.toFixed(1)}
									</span>
								</span>
							<span className={styles.colMem}>{formatBytes(proc.rssBytes)}</span>
							</div>
						))}
					</div>
				)}

				</div>
			{contextMenu && createPortal(
				<div
					ref={menuRef}
					className={styles.contextMenu}
					style={{ left: contextMenu.x, top: contextMenu.y }}
				>
					<div className={styles.contextMenuItem} onClick={() => handleKill(contextMenu.pid)}>
						<Icon name='material-cancel' size={13} />
						<span>{is_cn ? '终止进程' : 'Kill Process'} (PID {contextMenu.pid})</span>
					</div>
				</div>,
				document.body
			)}
		</div>
	)
}

export default TaskActivity
