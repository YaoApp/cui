import { memo, useState, useMemo } from 'react'
import { Modal } from 'antd'
import Icon from '@/widgets/Icon'
import Select from '@/components/ui/inputs/Select'
import JsonViewer from '../JsonViewer'
import styles from './index.less'

interface TraceLog {
	timestamp: number
	level: string
	message: string
	node_id: string
	data?: Record<string, any>
}

interface LogModalProps {
	open: boolean
	onClose: () => void
	logs: TraceLog[]
	title: string
	is_cn?: boolean
}

type LogLevel = 'all' | 'error' | 'warn' | 'info' | 'debug'

const LogModal: React.FC<LogModalProps> = ({ open, onClose, logs, title, is_cn = false }) => {
	const [selectedLevel, setSelectedLevel] = useState<LogLevel>('all')

	// 多语言文案
	const texts = {
		logs: is_cn ? '日志' : 'Logs',
		all: is_cn ? '全部' : 'All',
		error: is_cn ? '错误' : 'Error',
		warn: is_cn ? '警告' : 'Warn',
		info: is_cn ? '信息' : 'Info',
		debug: is_cn ? '调试' : 'Debug',
		noLogs: is_cn ? '暂无日志' : 'No logs'
	}

	// 统计各级别日志数量
	const levelCounts = useMemo(() => {
		const counts: Record<string, number> = { all: logs.length }
		logs.forEach((log) => {
			const level = log.level.toLowerCase()
			counts[level] = (counts[level] || 0) + 1
		})
		return counts
	}, [logs])

	// 过滤日志
	const filteredLogs = useMemo(() => {
		if (selectedLevel === 'all') return logs
		return logs.filter((log) => log.level.toLowerCase() === selectedLevel)
	}, [logs, selectedLevel])

	// 格式化时间（包含毫秒）
	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp)
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		const seconds = String(date.getSeconds()).padStart(2, '0')
		const ms = String(date.getMilliseconds()).padStart(3, '0')
		return `${hours}:${minutes}:${seconds}.${ms}`
	}

	// 获取日志级别图标
	const getLevelIcon = (level: string) => {
		switch (level) {
			case 'error':
				return 'material-error'
			case 'warn':
				return 'material-warning'
			case 'info':
				return 'material-info'
			case 'debug':
				return 'material-bug_report'
			default:
				return 'material-circle'
		}
	}

	// Select 组件的 schema
	const selectSchema = {
		enum: [
			{ value: 'all', label: `${texts.all} (${levelCounts.all || 0})` },
			{ value: 'error', label: `${texts.error} (${levelCounts.error || 0})` },
			{ value: 'warn', label: `${texts.warn} (${levelCounts.warn || 0})` },
			{ value: 'info', label: `${texts.info} (${levelCounts.info || 0})` },
			{ value: 'debug', label: `${texts.debug} (${levelCounts.debug || 0})` }
		],
		default: 'all'
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.modalTitle}>
						<Icon name='material-article' size={16} />
						<span>{title} - {texts.logs} ({logs.length})</span>
					</div>
					<div className={styles.headerRight}>
						<div className={styles.levelSelectWrapper}>
							<Select
								value={selectedLevel}
								onChange={(value) => setSelectedLevel(value as LogLevel)}
								schema={selectSchema}
								size='small'
							/>
						</div>
						<div className={styles.closeButton} onClick={onClose}>
							<Icon name='material-close' size={16} />
						</div>
					</div>
				</div>
			}
			open={open}
			onCancel={onClose}
			footer={null}
			width="80%"
			style={{ maxWidth: 1200 }}
			className={styles.logModal}
			closable={false}
		>
			<div className={styles.logContainer}>
				{filteredLogs.length === 0 ? (
					<div className={styles.emptyLogs}>{texts.noLogs}</div>
				) : (
					<div className={styles.logList}>
						{filteredLogs.map((log, idx) => (
							<div key={idx} className={`${styles.logItem} ${styles[log.level]}`}>
								<div className={styles.logHeader}>
									<span className={styles.logTime}>{formatTime(log.timestamp)}</span>
									<span className={`${styles.logLevel} ${styles[log.level]}`}>
										<Icon name={getLevelIcon(log.level)} size={10} />
										{log.level.toUpperCase()}
									</span>
								</div>
								<div className={styles.logMessage}>{log.message}</div>
								{log.data && Object.keys(log.data).length > 0 && (
									<div className={styles.logData}>
										<JsonViewer data={log.data} />
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</Modal>
	)
}

export default memo(LogModal)
