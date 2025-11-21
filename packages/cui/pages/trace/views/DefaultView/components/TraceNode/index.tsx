import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Modal, Popover } from 'antd'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface TraceLog {
	timestamp: number
	level: string
	message: string
	node_id: string
	data?: Record<string, any>
}

interface TraceNodeData {
	label: string
	description?: string
	type: 'start' | 'search' | 'query' | 'llm' | 'format' | 'complete' | 'custom' | 'agent' | string
	icon?: string
	status: 'pending' | 'running' | 'success' | 'error'
	duration?: number
	error?: string
	logs?: TraceLog[]
	start_time?: number
	end_time?: number
}

const TraceNode = ({ data }: NodeProps<TraceNodeData>) => {
	const [isModalOpen, setIsModalOpen] = useState(false)

	// 打开模态窗
	const handleNodeClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		setIsModalOpen(true)
	}

	// 获取节点类型图标
	const getTypeIcon = (type: string, icon?: string): string => {
		// 优先使用后端提供的 icon 字段
		if (icon) {
			return `material-${icon}`
		}
		
		// 否则根据 type 从映射表查找
		const iconMap: Record<string, string> = {
			start: 'material-play_circle',
			search: 'material-search',
			query: 'material-database',
			llm: 'material-psychology',
			agent: 'material-assistant',
			format: 'material-description',
			complete: 'material-check_circle',
			custom: 'material-extension'
		}
		return iconMap[type] || 'material-circle'
	}

	// 获取状态图标
	const getStatusIcon = (status: string): string => {
		const iconMap: Record<string, string> = {
			pending: 'material-radio_button_unchecked',
			running: 'material-autorenew',
			success: 'material-check_circle',
			error: 'material-error'
		}
		return iconMap[status] || 'material-help_outline'
	}

	// 格式化时间
	const formatDuration = (ms?: number): string => {
		if (!ms) return '-'
		if (ms < 1000) return `${ms}ms`
		return `${(ms / 1000).toFixed(1)}s`
	}

	// 渲染日志列表
	const renderLogList = () => {
		if (!data.logs || data.logs.length === 0) return null
		// Take top 10 logs
		const recentLogs = [...data.logs].reverse().slice(0, 10)
		return (
			<div className={styles.logPopover}>
				<div className={styles.logTitle}>{data.label} ({data.logs.length})</div>
				<div className={styles.logList}>
					{recentLogs.map((log, idx) => (
						<div key={idx} className={styles.logItem}>
							<span className={styles.logTime}>
								{new Date(log.timestamp).toLocaleTimeString('en-US', { 
									hour12: false,
									hour: '2-digit',
									minute: '2-digit',
									second: '2-digit'
								})}
							</span>
							<span className={`${styles.logLevel} ${styles[log.level]}`}>
								[{log.level}]
							</span>
							<span className={styles.logMessage}>{log.message}</span>
						</div>
					))}
				</div>
			</div>
		)
	}

	// 获取最新日志
	const latestLog = data.logs && data.logs.length > 0 ? data.logs[data.logs.length - 1] : null

	return (
		<>
			<Popover
				content={renderLogList()}
				title={null}
				trigger='hover'
				open={data.logs && data.logs.length > 0 ? undefined : false}
				placement='right'
				overlayClassName={styles.logOverlay}
			>
			<div className={`${styles.traceNode} ${styles[data.status]}`} onClick={handleNodeClick}>
					<Handle type='target' position={Position.Top} className={styles.handle} />
			
			{/* 节点头部 - 类型 */}
			<div className={styles.nodeHeader}>
						<Icon name={getTypeIcon(data.type, data.icon)} size={12} />
						<span className={styles.typeLabel}>{data.type.toUpperCase()}</span>
			</div>

			{/* 节点主体 */}
			<div className={styles.nodeBody}>
				<div className={styles.statusIcon}>
					<Icon
						name={getStatusIcon(data.status)}
						size={14}
						className={data.status === 'running' ? styles.spinning : ''}
					/>
				</div>
				<div className={styles.nodeContent}>
					<div className={styles.nodeLabel}>{data.label}</div>
					{data.description && (
						<div className={styles.nodeDescription}>{data.description}</div>
					)}
				</div>
			</div>

					{/* 节点底部 - 时长、错误或最新日志 */}
			<div className={styles.nodeFooter}>
						{data.status === 'running' && latestLog ? (
							<div className={styles.latestLog}>
								<span className={styles.typing}>&gt;</span> {latestLog.message}
							</div>
						) : data.error ? (
					<div className={styles.errorText}>
								<Icon name='material-warning' size={12} />
						{data.error}
					</div>
				) : (
					<div className={styles.duration}>{formatDuration(data.duration)}</div>
				)}
			</div>

					<Handle type='source' position={Position.Bottom} className={styles.handle} />
			</div>
			</Popover>

			{/* 节点详情模态窗 */}
			<Modal
				title={`${data.label} - ${data.type}`}
				open={isModalOpen}
				onCancel={() => setIsModalOpen(false)}
				footer={null}
				width={600}
			>
				<div>
					<p>
						<strong>Status:</strong> {data.status}
					</p>
					<p>
						<strong>Description:</strong> {data.description || '-'}
					</p>
					<p>
						<strong>Duration:</strong> {formatDuration(data.duration)}
					</p>
					{data.error && (
						<p style={{ color: 'red' }}>
							<strong>Error:</strong> {data.error}
						</p>
					)}
				</div>
			</Modal>
		</>
	)
}

export default memo(TraceNode)
