import { useEffect, useState } from 'react'
import { Button, Spin, Tag, Timeline, Card, Row, Col, Statistic, Modal, Typography, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { Job, Execution, Log, JobAPI } from '@/openapi'
import { DataTable } from '@/pages/kb/components'
import { TableColumn, TableAction } from '@/pages/kb/components/DataTable/types'
import styles from './Detail.less'

const { Text } = Typography

interface DetailProps {
	visible: boolean
	onClose: () => void
	task: Job
	taskDetail: Job | null
	loading: boolean
	onRefresh: () => void
}

const Detail: React.FC<DetailProps> = ({ visible, onClose, task, taskDetail, loading, onRefresh }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 日志相关状态
	const [logs, setLogs] = useState<Log[]>([])
	const [logsLoading, setLogsLoading] = useState(false)
	const [logsTotal, setLogsTotal] = useState(0)
	const [currentJobDetail, setCurrentJobDetail] = useState<Job | null>(taskDetail)

	// 自动刷新详情页面
	useEffect(() => {
		if (task.status === 'running') {
			const interval = setInterval(onRefresh, 30000) // 每30秒刷新
			return () => clearInterval(interval)
		}
	}, [task.status, onRefresh])

	// 加载任务详情和日志
	useEffect(() => {
		if (visible && task.job_id) {
			loadJobDetail()
			loadJobLogs()
		}
	}, [visible, task.job_id])

	// 加载任务详情
	const loadJobDetail = async () => {
		if (!window.$app?.openapi) return

		try {
			const jobAPI = new JobAPI(window.$app.openapi)
			const response = await jobAPI.GetJob(task.job_id)

			if (!window.$app.openapi.IsError(response) && response.data) {
				setCurrentJobDetail(response.data)
			}
		} catch (error) {
			console.error('Failed to load job detail:', error)
		}
	}

	// 加载任务日志
	const loadJobLogs = async () => {
		if (!window.$app?.openapi) return

		try {
			setLogsLoading(true)
			const jobAPI = new JobAPI(window.$app.openapi)
			const response = await jobAPI.ListJobLogs({
				job_id: task.job_id,
				page: 1,
				pagesize: 100
			})

			if (!window.$app.openapi.IsError(response) && response.data) {
				setLogs(response.data.data || [])
				setLogsTotal(response.data.total || 0)
			}
		} catch (error) {
			console.error('Failed to load job logs:', error)
		} finally {
			setLogsLoading(false)
		}
	}

	// 获取日志级别颜色
	const getLogLevelColor = (level: string): string => {
		const colorMap: Record<string, string> = {
			info: 'var(--color_main)',
			error: 'var(--color_danger)',
			warning: 'var(--color_warning)',
			retry: 'var(--color_warning)'
		}
		return colorMap[level] || 'var(--color_text_grey)'
	}

	// 获取日志级别图标
	const getLogLevelIcon = (level: string): string => {
		const iconMap: Record<string, string> = {
			info: 'material-info',
			error: 'material-error',
			warning: 'material-warning',
			retry: 'material-refresh'
		}
		return iconMap[level] || 'material-circle'
	}

	// 格式化时间
	const formatDateTime = (timestamp: string): string => {
		const date = new Date(timestamp)
		return date.toLocaleString(is_cn ? 'zh-CN' : 'en-US')
	}

	// 计算任务持续时间
	const getTaskDuration = (): string => {
		const jobData = currentJobDetail || task
		if (!jobData.last_run_at) return '-'

		const startTime = new Date(jobData.last_run_at).getTime()
		const endTime = jobData.status === 'running' ? new Date().getTime() : new Date(jobData.updated_at).getTime()
		const duration = endTime - startTime

		const seconds = Math.floor(duration / 1000)
		const minutes = Math.floor(seconds / 60)
		const hours = Math.floor(minutes / 60)
		const days = Math.floor(hours / 24)

		if (days > 0) {
			return `${days}d ${hours % 24}h ${minutes % 60}m`
		} else if (hours > 0) {
			return `${hours}h ${minutes % 60}m ${seconds % 60}s`
		} else if (minutes > 0) {
			return `${minutes}m ${seconds % 60}s`
		} else {
			return `${seconds}s`
		}
	}

	// 获取 Job 状态图标 - 与列表页保持一致
	const getJobStatusIcon = (status: string): string => {
		const iconMap: Record<string, string> = {
			draft: 'material-edit',
			ready: 'material-schedule',
			running: 'material-play_circle',
			completed: 'material-check_circle',
			failed: 'material-error_outline',
			disabled: 'material-pause_circle',
			deleted: 'material-delete'
		}
		return iconMap[status] || 'material-help_outline'
	}

	// 获取 Job 状态颜色 - 与列表页保持一致
	const getJobStatusColor = (status: string): string => {
		const colorMap: Record<string, string> = {
			draft: 'var(--color_text_grey)',
			ready: 'var(--color_warning)',
			running: 'var(--color_main)',
			completed: 'var(--color_success)',
			failed: 'var(--color_danger)',
			disabled: 'var(--color_text_grey)',
			deleted: 'var(--color_text_grey)'
		}
		return colorMap[status] || 'var(--color_text_grey)'
	}

	// 渲染状态标签 - 与列表页样式保持一致
	const renderStatusTag = () => {
		const jobData = currentJobDetail || task
		const statusText = is_cn
			? {
					draft: '草稿',
					ready: '就绪',
					running: '运行中',
					completed: '已完成',
					failed: '失败',
					disabled: '已禁用',
					deleted: '已删除'
			  }[jobData.status] || jobData.status
			: jobData.status

		return (
			<div className={styles.cardStatus}>
				<Icon
					name={getJobStatusIcon(jobData.status)}
					size={14}
					style={{ color: getJobStatusColor(jobData.status) }}
				/>
				<span className={styles.statusText} style={{ color: getJobStatusColor(jobData.status) }}>
					{statusText}
				</span>
			</div>
		)
	}

	// 渲染基本信息 - 扁平化布局
	const renderBasicInfo = () => {
		const jobData = currentJobDetail || task
		return (
			<div className={styles.basicInfo}>
				<Row gutter={[24, 16]} className={styles.statsRow}>
					<Col span={4}>
						<div className={styles.statItem}>
							<div className={styles.statLabel}>{is_cn ? '任务ID' : 'Task ID'}</div>
							<div className={styles.statValue}>{jobData.job_id}</div>
						</div>
					</Col>
					<Col span={4}>
						<div className={styles.statItem}>
							<div className={styles.statLabel}>{is_cn ? '状态' : 'Status'}</div>
							<div className={styles.statValue}>{renderStatusTag()}</div>
						</div>
					</Col>
					<Col span={4}>
						<div className={styles.statItem}>
							<div className={styles.statLabel}>{is_cn ? '创建时间' : 'Created At'}</div>
							<div className={styles.statValue}>{formatDateTime(jobData.created_at)}</div>
						</div>
					</Col>
					<Col span={4}>
						<div className={styles.statItem}>
							<div className={styles.statLabel}>{is_cn ? '最后运行' : 'Last Run At'}</div>
							<div className={styles.statValue}>
								{jobData.last_run_at ? formatDateTime(jobData.last_run_at) : '-'}
							</div>
						</div>
					</Col>
					<Col span={4}>
						<div className={styles.statItem}>
							<div className={styles.statLabel}>{is_cn ? '运行时长' : 'Duration'}</div>
							<div className={styles.statValue}>{getTaskDuration()}</div>
						</div>
					</Col>
					<Col span={4}>
						<div className={styles.statItem}>
							<div className={styles.statLabel}>{is_cn ? '日志数' : 'Logs'}</div>
							<div className={styles.statValue}>{logsTotal}</div>
						</div>
					</Col>
				</Row>

				{jobData.description && (
					<Row gutter={[24, 16]} className={styles.descriptionRow}>
						<Col span={24}>
							<div className={styles.statItem}>
								<div className={styles.statLabel}>{is_cn ? '描述' : 'Description'}</div>
								<div className={styles.statValue}>{jobData.description}</div>
							</div>
						</Col>
					</Row>
				)}
			</div>
		)
	}

	// 定义日志表格列
	const logColumns: TableColumn<Log>[] = [
		{
			key: 'timestamp',
			title: is_cn ? '时间' : 'Time',
			dataIndex: 'timestamp',
			width: 180,
			render: (timestamp: string) => <span className={styles.timestamp}>{formatDateTime(timestamp)}</span>
		},
		{
			key: 'level',
			title: is_cn ? '级别' : 'Level',
			dataIndex: 'level',
			width: 100,
			render: (level: string) => (
				<span className={styles.logLevel} style={{ color: getLogLevelColor(level) }}>
					{level.toUpperCase()}
				</span>
			)
		},
		{
			key: 'message',
			title: is_cn ? '消息' : 'Message',
			dataIndex: 'message',
			ellipsis: true,
			render: (message: string) => (
				<Tooltip title={message}>
					<span className={styles.logMessage}>{message}</span>
				</Tooltip>
			)
		}
	]

	// 渲染日志信息 - 字段样式布局
	const renderLogs = () => {
		return (
			<div className={styles.logsField}>
				<div className={styles.logsFieldHeader}>
					<div className={styles.statLabel}>
						{is_cn ? '执行日志' : 'Execution Logs'} ({logsTotal})
					</div>
					<Button
						type='text'
						icon={<Icon name='material-refresh' size={11} />}
						onClick={() => {
							onRefresh()
							loadJobLogs()
						}}
						loading={logsLoading}
						size='small'
						className={styles.refreshButton}
					>
						{is_cn ? '刷新' : 'Refresh'}
					</Button>
				</div>

				<div className={styles.logsFieldContent}>
					{logsLoading ? (
						<div className={styles.loadingState}>
							<Icon name='material-hourglass_empty' size={32} />
							<Text>{is_cn ? '正在加载日志...' : 'Loading logs...'}</Text>
						</div>
					) : logs.length === 0 ? (
						<div className={styles.emptyState}>
							<Icon name='material-description' size={48} />
							<div className={styles.emptyTitle}>{is_cn ? '暂无日志' : 'No Logs'}</div>
							<div className={styles.emptyDescription}>
								{is_cn
									? '该任务还没有生成日志'
									: 'This task has not generated any logs yet'}
							</div>
						</div>
					) : (
						<div className={styles.tableContainer}>
							<DataTable<Log>
								data={logs}
								columns={logColumns}
								loading={false}
								total={logsTotal}
								columnWidthPreset='normal'
								autoFitColumns={true}
								pagination={false}
								rowKey={(record, index) => record.id?.toString() || `log-${index}`}
								size='small'
								scroll={{ x: 'max-content' }}
							/>
						</div>
					)}
				</div>
			</div>
		)
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.titleSection}>
						<Icon name='material-assignment' size={16} />
						<span className={styles.modalTitle}>
							{(currentJobDetail || task).name || (currentJobDetail || task).job_id}
						</span>
					</div>
					<div className={styles.closeButton} onClick={onClose}>
						<Icon name='material-close' size={16} />
					</div>
				</div>
			}
			open={visible}
			onCancel={onClose}
			footer={null}
			width='90%'
			style={{
				top: '5vh',
				paddingBottom: 0,
				maxWidth: 'none'
			}}
			bodyStyle={{
				padding: 0,
				height: 'calc(90vh - 56px)',
				overflow: 'hidden'
			}}
			destroyOnClose
			closable={false}
			maskClosable={true}
			className={styles.taskDetailModal}
		>
			<div className={styles.modalContent}>
				<div className={styles.taskDetail}>
					{renderBasicInfo()}
					{renderLogs()}
				</div>
			</div>
		</Modal>
	)
}

export default Detail
