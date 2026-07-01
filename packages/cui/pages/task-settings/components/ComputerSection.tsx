import { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { Spin } from 'antd'
import Icon from '@/widgets/Icon'
import { Button } from '@/components/ui'
import { AgentTasks, type ComputerInfoResponse } from '@/openapi/agent/tasks'
import { ComputerAPI } from '@/openapi/computer'
import { brandIcons } from '@/assets/icons/brands'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'

const statusLabels: Record<string, { cn: string; en: string }> = {
	running: { cn: '运行中', en: 'Running' },
	online: { cn: '运行中', en: 'Running' },
	stopped: { cn: '已停止', en: 'Stopped' },
	creating: { cn: '创建中', en: 'Creating' }
}

const formatMemory = (bytes?: number): string => {
	if (!bytes) return '—'
	const gb = bytes / (1024 * 1024 * 1024)
	if (gb >= 1) return `${gb.toFixed(1)} GB`
	const mb = bytes / (1024 * 1024)
	return `${mb.toFixed(0)} MB`
}

const ComputerSection = ({ taskId }: { taskId: string }) => {
	const is_cn = getLocale() === 'zh-CN'
	const [info, setInfo] = useState<ComputerInfoResponse | null>(null)
	const [notRunning, setNotRunning] = useState(false)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!taskId || !window.$app?.openapi) return
		setLoading(true)
		const api = new AgentTasks(window.$app.openapi)
		api.GetComputerInfo(taskId).then((resp) => {
			if (!window.$app?.openapi?.IsError(resp)) {
				const data = window.$app!.openapi.GetData(resp)
				if (data && 'status' in data && data.status === 'not_running') {
					setNotRunning(true)
				} else if (data && 'kind' in data) {
					setInfo(data as ComputerInfoResponse)
				}
			}
		}).finally(() => setLoading(false))
	}, [taskId])

	const handleVNC = () => {
		if (!info || !window.$app?.openapi) return
		const api = new ComputerAPI(window.$app.openapi)
		const url = info.kind === 'host'
			? api.GetViewerURL(info.node_id)
			: api.GetViewerURL(info.node_id, info.box_id)
		window.$app.Navigate(url)
	}

	const sys = info?.system
	const os = (sys?.os || '').toLowerCase()
	const osSvg = info?.kind === 'box' ? brandIcons['linux'] : (brandIcons[os] || null)
	const status = statusLabels[info?.status || 'stopped'] || statusLabels.stopped
	const isRunning = info?.status === 'running' || info?.status === 'online'

	return (
		<div className={viewStyles.sectionContent}>
			<div className={viewStyles.card}>
				<div className={viewStyles.sectionTitle}>{is_cn ? '电脑' : 'Computer'}</div>

				{loading ? (
					<div className={viewStyles.emptyState}>
						<Spin />
					</div>
				) : notRunning || !info ? (
					<div className={viewStyles.emptyState}>
						<Icon name='material-computer' size={32} />
						<span style={{ marginTop: 8 }}>
							{notRunning
								? (is_cn ? '电脑未运行' : 'Computer not running')
								: (is_cn ? '未分配电脑' : 'No computer assigned')}
						</span>
					</div>
				) : (
					<>
						<div className={viewStyles.kvTable}>
							<div className={viewStyles.kvRow}>
								<div className={viewStyles.kvLabel}>{is_cn ? '状态' : 'Status'}</div>
								<div className={viewStyles.kvValue}>
									<span className={viewStyles.statusBadge}>
										<Icon
											name={isRunning ? 'material-check_circle' : 'material-cancel'}
											size={14}
										/>
										{is_cn ? status.cn : status.en}
									</span>
								</div>
							</div>

							{sys?.os && (
								<div className={viewStyles.kvRow}>
									<div className={viewStyles.kvLabel}>OS</div>
									<div className={viewStyles.kvValue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
										{osSvg && <img src={osSvg} style={{ width: 14, height: 14 }} />}
										<span>{sys.os}{sys.arch ? ` / ${sys.arch}` : ''}</span>
									</div>
								</div>
							)}
							{sys?.hostname && (
								<div className={viewStyles.kvRow}>
									<div className={viewStyles.kvLabel}>Hostname</div>
									<div className={viewStyles.kvValue}>{sys.hostname}</div>
								</div>
							)}
							{sys && sys.num_cpu > 0 && (
								<div className={viewStyles.kvRow}>
									<div className={viewStyles.kvLabel}>CPU</div>
									<div className={viewStyles.kvValue}>{sys.num_cpu} {is_cn ? '核' : 'cores'}</div>
								</div>
							)}
							{(sys?.total_mem ?? 0) > 0 && (
								<div className={viewStyles.kvRow}>
									<div className={viewStyles.kvLabel}>{is_cn ? '内存' : 'Memory'}</div>
									<div className={viewStyles.kvValue}>{formatMemory(sys.total_mem)}</div>
								</div>
							)}
							{sys?.shell && (
								<div className={viewStyles.kvRow}>
									<div className={viewStyles.kvLabel}>Shell</div>
									<div className={viewStyles.kvValue} style={{ fontFamily: 'var(--font_mono, monospace)', fontSize: 13 }}>
										{sys.shell}
									</div>
								</div>
							)}
						</div>

						{info.vnc && isRunning && (
							<div style={{ marginTop: 16 }}>
								<Button
									type='primary'
									size='small'
									icon={<Icon name='material-desktop_windows' size={14} />}
									onClick={handleVNC}
									style={{ width: '100%', maxWidth: 240 }}
								>
									{is_cn ? '打开远程桌面' : 'Open Remote Desktop'}
								</Button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	)
}

export default ComputerSection
