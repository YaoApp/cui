import { useEffect } from 'react'
import { Button, Spin, Tag, Timeline, Card, Row, Col, Statistic } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { Job } from '@/openapi'
import styles from './TaskDetail.less'

interface TaskDetailProps {
	task: Job
	taskDetail: Job | null
	loading: boolean
	onRefresh: () => void
}

const TaskDetail: React.FC<TaskDetailProps> = ({ task, taskDetail, loading, onRefresh }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 自动刷新详情页面
	useEffect(() => {
		if (task.status === 'running') {
			const interval = setInterval(onRefresh, 30000) // 每30秒刷新
			return () => clearInterval(interval)
		}
	}, [task.status, onRefresh])

	// 获取任务状态颜色
	const getTaskStatusColor = (status: string): string => {
		const colorMap: Record<string, string> = {
			pending: 'orange',
			running: 'blue',
			completed: 'green',
			failed: 'red'
		}
		return colorMap[status] || 'default'
	}

	// 获取日志级别颜色
	const getLogLevelColor = (level: string): string => {
		const colorMap: Record<string, string> = {
			info: 'var(--color_main)',
			error: 'var(--color_error)',
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
		if (!task.started_at) return '-'

		const startTime = new Date(task.started_at).getTime()
		const endTime = task.ended_at ? new Date(task.ended_at).getTime() : new Date().getTime()
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

	// 渲染状态标签
	const renderStatusTag = () => {
		const statusText = is_cn
			? {
					pending: '等待中',
					running: '运行中',
					completed: '已完成',
					failed: '失败'
			  }[task.status] || task.status
			: task.status.toUpperCase()

		return <Tag color={getTaskStatusColor(task.status)}>{statusText}</Tag>
	}

	// 渲染基本信息
	const renderBasicInfo = () => {
		return (
			<Card
				title={
					<div className={styles.cardTitle}>
						<Icon name='material-info' size={16} />
						<span>{is_cn ? '基本信息' : 'Basic Info'}</span>
					</div>
				}
				className={styles.infoCard}
			>
				<Row gutter={[16, 16]}>
					<Col span={8}>
						<Statistic
							title={is_cn ? '任务ID' : 'Task ID'}
							value={task.id}
							valueStyle={{ fontSize: '14px', fontFamily: 'monospace' }}
						/>
					</Col>
					<Col span={8}>
						<div className={styles.statusStatistic}>
							<div className={styles.statisticTitle}>{is_cn ? '状态' : 'Status'}</div>
							<div className={styles.statisticValue}>{renderStatusTag()}</div>
						</div>
					</Col>
					<Col span={8}>
						<Statistic title={is_cn ? '创建者' : 'Created By'} value={task.created_by} />
					</Col>
					<Col span={8}>
						<Statistic
							title={is_cn ? '创建时间' : 'Created At'}
							value={formatDateTime(task.created_at)}
							valueStyle={{ fontSize: '14px' }}
						/>
					</Col>
					<Col span={8}>
						<Statistic
							title={is_cn ? '开始时间' : 'Started At'}
							value={task.started_at ? formatDateTime(task.started_at) : '-'}
							valueStyle={{ fontSize: '14px' }}
						/>
					</Col>
					<Col span={8}>
						<Statistic
							title={is_cn ? '运行时长' : 'Duration'}
							value={getTaskDuration()}
							valueStyle={{ fontSize: '14px', fontFamily: 'monospace' }}
						/>
					</Col>
				</Row>

				<div className={styles.description}>
					<div className={styles.descriptionTitle}>{is_cn ? '任务描述' : 'Description'}:</div>
					<div className={styles.descriptionContent}>{task.description}</div>
				</div>

				{task.result && (
					<div className={styles.result}>
						<div className={styles.resultTitle}>{is_cn ? '执行结果' : 'Result'}:</div>
						<div className={styles.resultContent}>
							<pre>{JSON.stringify(task.result, null, 2)}</pre>
						</div>
					</div>
				)}
			</Card>
		)
	}

	// 渲染日志信息
	const renderLogs = () => {
		if (loading) {
			return (
				<Card
					title={
						<div className={styles.cardTitle}>
							<Icon name='material-description' size={16} />
							<span>{is_cn ? '执行日志' : 'Execution Logs'}</span>
						</div>
					}
					extra={
						<Button
							type='text'
							icon={<Icon name='material-refresh' size={14} />}
							onClick={onRefresh}
							loading={loading}
						>
							{is_cn ? '刷新' : 'Refresh'}
						</Button>
					}
					className={styles.logsCard}
				>
					<div className={styles.logsLoading}>
						<Spin size='large' />
						<div>{is_cn ? '加载日志中...' : 'Loading logs...'}</div>
					</div>
				</Card>
			)
		}

		const logs = taskDetail?.logs || []

		if (logs.length === 0) {
			return (
				<Card
					title={
						<div className={styles.cardTitle}>
							<Icon name='material-description' size={16} />
							<span>{is_cn ? '执行日志' : 'Execution Logs'}</span>
						</div>
					}
					extra={
						<Button
							type='text'
							icon={<Icon name='material-refresh' size={14} />}
							onClick={onRefresh}
							loading={loading}
						>
							{is_cn ? '刷新' : 'Refresh'}
						</Button>
					}
					className={styles.logsCard}
				>
					<div className={styles.emptyLogs}>
						<Icon name='material-description' size={48} />
						<div className={styles.emptyTitle}>{is_cn ? '暂无日志' : 'No Logs'}</div>
						<div className={styles.emptyDescription}>
							{is_cn ? '该任务还没有生成日志' : 'This task has not generated any logs yet'}
						</div>
					</div>
				</Card>
			)
		}

		return (
			<Card
				title={
					<div className={styles.cardTitle}>
						<Icon name='material-description' size={16} />
						<span>{is_cn ? '执行日志' : 'Execution Logs'}</span>
						<span className={styles.logCount}>({logs.length})</span>
					</div>
				}
				extra={
					<Button
						type='text'
						icon={<Icon name='material-refresh' size={14} />}
						onClick={onRefresh}
						loading={loading}
					>
						{is_cn ? '刷新' : 'Refresh'}
					</Button>
				}
				className={styles.logsCard}
			>
				<Timeline className={styles.logsTimeline}>
					{logs.map((log: TaskLog, index: number) => (
						<Timeline.Item
							key={index}
							dot={
								<Icon
									name={getLogLevelIcon(log.level)}
									size={12}
									style={{ color: getLogLevelColor(log.level) }}
								/>
							}
						>
							<div className={styles.logItem}>
								<div className={styles.logHeader}>
									<span className={styles.logTime}>
										{formatDateTime(log.timestamp)}
									</span>
									<Tag
										color={getLogLevelColor(log.level)}
										className={styles.logLevel}
									>
										{log.level.toUpperCase()}
									</Tag>
								</div>
								<div className={styles.logMessage}>{log.message}</div>
							</div>
						</Timeline.Item>
					))}
				</Timeline>
			</Card>
		)
	}

	return (
		<div className={styles.taskDetail}>
			{renderBasicInfo()}
			{renderLogs()}
		</div>
	)
}

export default TaskDetail
