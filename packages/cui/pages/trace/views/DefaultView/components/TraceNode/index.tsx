import { memo, useState, useRef, useEffect } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import InputPanel from './components/InputPanel'
import OutputPanel from './components/OutputPanel'
import LogModal from './components/LogModal'
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
	input?: Record<string, any> | string
	output?: Record<string, any> | string
}

const TraceNode = ({ data }: NodeProps<TraceNodeData>) => {
	const [isHovered, setIsHovered] = useState(false)
	const [logModalOpen, setLogModalOpen] = useState(false)
	const leftPanelRef = useRef<HTMLDivElement>(null)
	const rightPanelRef = useRef<HTMLDivElement>(null)

	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 使用原生事件监听器阻止滚轮事件冒泡到 ReactFlow
	useEffect(() => {
		const leftPanel = leftPanelRef.current
		const rightPanel = rightPanelRef.current

		const stopWheelPropagation = (e: WheelEvent) => {
			e.stopPropagation()
		}

		// 添加非被动事件监听器
		if (leftPanel) {
			leftPanel.addEventListener('wheel', stopWheelPropagation, { passive: false })
		}
		if (rightPanel) {
			rightPanel.addEventListener('wheel', stopWheelPropagation, { passive: false })
		}

		return () => {
			if (leftPanel) {
				leftPanel.removeEventListener('wheel', stopWheelPropagation)
			}
			if (rightPanel) {
				rightPanel.removeEventListener('wheel', stopWheelPropagation)
			}
		}
	}, [])

	// 获取节点类型图标
	const getTypeIcon = (type: string, icon?: string): string => {
		if (icon) {
			return `material-${icon}`
		}
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

	// 获取最新日志
	const latestLog = data.logs && data.logs.length > 0 ? data.logs[data.logs.length - 1] : null

	// 打开日志弹窗
	const handleOpenLogs = (e: React.MouseEvent) => {
		e.stopPropagation()
		setLogModalOpen(true)
	}

	return (
		<>
			<div
				className={styles.nodeWrapper}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{/* 左侧 Input Panel */}
				<div
					ref={leftPanelRef}
					className={`${styles.sidePanel} ${styles.leftPanel} ${isHovered ? styles.visible : ''}`}
				>
					<InputPanel input={data.input} is_cn={is_cn} />
				</div>

				{/* 中间节点 */}
				<div className={`${styles.traceNode} ${styles[data.status]}`}>
					<Handle type='target' position={Position.Top} className={styles.handle} />

					{/* 节点头部 - 类型 */}
					<div className={styles.nodeHeader}>
						<Icon name={getTypeIcon(data.type, data.icon)} size={12} />
						<span className={styles.typeLabel}>{data.type.toUpperCase()}</span>
						{data.logs && data.logs.length > 0 && (
							<button className={styles.logBtn} onClick={handleOpenLogs}>
								<Icon name='material-article' size={10} />
								<span>{data.logs.length}</span>
							</button>
						)}
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

				{/* 右侧 Output Panel - 仅在有输出或正在运行时显示 */}
				{(data.output || data.status === 'running') && (
					<div
						ref={rightPanelRef}
						className={`${styles.sidePanel} ${styles.rightPanel} ${
							isHovered ? styles.visible : ''
						}`}
					>
						<OutputPanel
							type={data.type}
							output={data.output}
							status={data.status}
							error={data.error}
							is_cn={is_cn}
						/>
					</div>
				)}
			</div>

			{/* 日志弹窗 */}
			<LogModal
				open={logModalOpen}
				onClose={() => setLogModalOpen(false)}
				logs={data.logs || []}
				title={data.label}
				is_cn={is_cn}
			/>
		</>
	)
}

export default memo(TraceNode)
