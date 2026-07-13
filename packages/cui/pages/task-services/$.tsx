import { useState, useEffect, useCallback, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { useAppRoute, type AppRouteProps } from '@/hooks/useAppRoute'
import { AgentTasks, type TaskItem, type PortInfo, type PortsResponse } from '@/openapi/agent/tasks'
import styles from './index.less'

function getTasksAPI(): AgentTasks | null {
	const openapi = window.$app?.openapi
	if (!openapi) return null
	return new AgentTasks(openapi)
}

const HIDDEN_PROCESSES = ['x11vnc', 'websockify', 'tai']

const STATE_COLORS: Record<string, string> = {
	LISTEN: '#52c41a',
	ESTABLISHED: '#1890ff',
	TIME_WAIT: '#faad14',
	CLOSE_WAIT: '#ff4d4f'
}

const PROTOCOL_STYLES: Record<string, string> = {
	tcp: 'tcp',
	udp: 'udp',
	tcp6: 'tcp',
	udp6: 'udp'
}

const TaskServices = (props: AppRouteProps) => {
	const { params } = useAppRoute(props)
	const taskId = params['*'] || ''
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [taskInfo, setTaskInfo] = useState<TaskItem | null>(null)
	const [ports, setPorts] = useState<PortInfo[]>([])
	const [loading, setLoading] = useState(false)
	const [notRunning, setNotRunning] = useState(false)
	const [error, setError] = useState(false)

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

	const loadPorts = useCallback(async () => {
		if (!taskId) return
		const api = getTasksAPI()
		if (!api) return
		setLoading(true)
		setError(false)
		try {
			const res = await api.GetPorts(taskId)
			if (window.$app?.openapi?.IsError(res)) {
				setError(true)
				return
			}
			const data = window.$app!.openapi.GetData(res) as PortsResponse | null
			if (!data) {
				setError(true)
				return
			}
			if ('status' in data && data.status === 'sandbox_not_running') {
				setNotRunning(true)
				setPorts([])
			} else if ('ports' in data) {
				setNotRunning(false)
				setPorts(data.ports || [])
			}
		} catch {
			setError(true)
		} finally {
			setLoading(false)
		}
	}, [taskId])

	useEffect(() => {
		loadPorts()
	}, [loadPorts])

	const [bindingPort, setBindingPort] = useState<number | null>(null)

	const handleOpenPort = useCallback(async (port: number) => {
		const api = getTasksAPI()
		if (!api || !taskId) return
		setBindingPort(port)
		try {
			const res = await api.BindProxy(taskId, port)
			if (window.$app?.openapi?.IsError(res)) return
		const data = window.$app!.openapi.GetData(res) as any
		if (data?.host_port) {
			const baseUrl = data.domain
				? data.url
				: `${window.location.protocol}//${window.location.hostname}:${data.host_port}`
			const authUrl = data.token
				? `${baseUrl}/.auth?token=${encodeURIComponent(data.token)}`
				: undefined
			const title = data.label || `Port ${data.target_port}`
			window.$app.Navigate(authUrl || baseUrl, { title, newWindowUrl: authUrl })
			} else if (data?.error) {
				console.warn('proxy bind error:', data.error)
			}
		} catch (e) {
			console.error('proxy bind failed:', e)
		} finally {
			setBindingPort(null)
		}
	}, [taskId])

	const filteredPorts = useMemo(() => {
		return ports.filter((p) => {
			if (!p.process && !p.command) return false
			const name = (p.process || '').toLowerCase()
			if (HIDDEN_PROCESSES.some((h) => name.includes(h))) return false
			return true
		})
	}, [ports])

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
						<Icon name='material-dns' size={16} />
						<span>{taskInfo?.title ? `${taskInfo.title} ${is_cn ? '服务' : 'Services'}` : (is_cn ? '服务端口' : 'Service Ports')}</span>
					</div>
					<div
						className={styles.toolBtn}
						onClick={loadPorts}
						title={is_cn ? '刷新' : 'Refresh'}
					>
						<Icon name='material-refresh' size={14} />
					</div>
				</div>

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
							{is_cn ? '启动任务后将显示监听端口' : 'Listening ports will appear after the task starts'}
						</span>
					</div>
				) : filteredPorts.length === 0 ? (
					<div className={styles.emptyState}>
						<Icon name='material-cloud_off' size={40} />
						<span>{is_cn ? '暂无监听端口' : 'No listening ports'}</span>
					</div>
				) : (
					<div className={styles.portTable}>
						<div className={styles.portHeader}>
							<span className={styles.colProcess}>{is_cn ? '进程' : 'Process'}</span>
							<span className={styles.colPort}>{is_cn ? '端口' : 'Port'}</span>
							<span className={styles.colProtocol}>{is_cn ? '协议' : 'Proto'}</span>
							<span className={styles.colPid}>PID</span>
							<span className={styles.colAddress}>{is_cn ? '地址' : 'Address'}</span>
							<span className={styles.colCommand}>{is_cn ? '命令' : 'Command'}</span>
							<span className={styles.colState}>{is_cn ? '状态' : 'State'}</span>
							<span className={styles.colAction}></span>
						</div>
						{filteredPorts.map((port, idx) => (
							<div key={idx} className={styles.portRow}>
								<span className={styles.colProcess}>{port.process || '—'}</span>
								<span className={styles.colPort}>{port.port}</span>
								<span className={styles.colProtocol}>
									<span className={`${styles.protocolTag} ${styles[PROTOCOL_STYLES[port.protocol] || 'tcp']}`}>
										{port.protocol}
									</span>
								</span>
								<span className={styles.colPid}>{port.pid || '—'}</span>
								<span className={styles.colAddress}>{port.address || '0.0.0.0'}</span>
								<span className={styles.colCommand} title={port.command}>
									{port.command || '—'}
								</span>
								<span className={styles.colState}>
									<span
										className={styles.stateIndicator}
										style={{ background: STATE_COLORS[port.state] || '#52c41a' }}
									/>
									{port.state}
								</span>
								<span className={styles.colAction}>
									{port.state === 'LISTEN' && (
										<button
											className={styles.openBtn}
											onClick={() => handleOpenPort(port.port)}
											disabled={bindingPort === port.port}
											title={is_cn ? '打开' : 'Open'}
										>
											{bindingPort === port.port ? (
												<Icon name='material-sync' size={12} />
											) : (
												<Icon name='material-open_in_new' size={12} />
											)}
											<span>{is_cn ? '打开' : 'Open'}</span>
										</button>
									)}
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
