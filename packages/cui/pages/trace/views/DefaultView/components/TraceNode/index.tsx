import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface TraceNodeData {
	label: string
	description?: string
	type: 'start' | 'search' | 'query' | 'llm' | 'format' | 'complete' | 'custom'
	status: 'pending' | 'running' | 'success' | 'error'
	duration?: number
	error?: string
}

const TraceNode = ({ data }: NodeProps<TraceNodeData>) => {
	// 获取节点类型图标
	const getTypeIcon = (type: string): string => {
		const iconMap: Record<string, string> = {
			start: 'material-play_circle',
			search: 'material-search',
			query: 'material-database',
			llm: 'material-psychology',
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

	return (
		<div className={`${styles.traceNode} ${styles[data.status]}`}>
			<Handle type="target" position={Position.Top} className={styles.handle} />
			
			{/* 节点头部 - 类型 */}
			<div className={styles.nodeHeader}>
				<Icon name={getTypeIcon(data.type)} size={12} />
				<span className={styles.typeLabel}>{data.type}</span>
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

			{/* 节点底部 - 时长或错误 */}
			<div className={styles.nodeFooter}>
				{data.error ? (
					<div className={styles.errorText}>
						<Icon name="material-warning" size={12} />
						{data.error}
					</div>
				) : (
					<div className={styles.duration}>{formatDuration(data.duration)}</div>
				)}
			</div>

			<Handle type="source" position={Position.Bottom} className={styles.handle} />
		</div>
	)
}

export default memo(TraceNode)

