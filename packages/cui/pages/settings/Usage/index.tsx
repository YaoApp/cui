import { useState, useEffect } from 'react'
import { Card, Statistic, Progress, Spin, Row, Col } from 'antd'
import { getLocale } from '@umijs/max'
import { mockApi, UsageStats } from '../mockData'
import styles from './index.less'

const Usage = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [stats, setStats] = useState<UsageStats | null>(null)

	useEffect(() => {
		const loadStats = async () => {
			try {
				setLoading(true)
				const data = await mockApi.getUsageStats()
				setStats(data)
			} catch (error) {
				console.error('Failed to load usage stats:', error)
			} finally {
				setLoading(false)
			}
		}

		loadStats()
	}, [])

	if (loading) {
		return (
			<div className={styles.loading}>
				<Spin size='large' />
				<span>{is_cn ? '加载中...' : 'Loading...'}</span>
			</div>
		)
	}

	if (!stats) {
		return null
	}

	const usagePercent = (stats.current_month.requests / stats.current_month.requests_limit) * 100
	const remainingRequests = stats.current_month.requests_limit - stats.current_month.requests

	// 计算最近7天的总请求数
	const last7Days = stats.last_30_days.slice(-7)
	const last7DaysRequests = last7Days.reduce((sum, day) => sum + day.requests, 0)

	return (
		<div className={styles.usage}>
			<div className={styles.header}>
				<h2>{is_cn ? '使用统计' : 'Usage Statistics'}</h2>
				<p>{is_cn ? '查看您的API使用情况和统计信息' : 'View your API usage and statistics'}</p>
			</div>

			<div className={styles.content}>
				<Row gutter={[24, 24]}>
					{/* 当月使用情况 */}
					<Col xs={24} lg={12}>
						<Card
							className={styles.card}
							title={is_cn ? '当月使用情况' : 'Current Month Usage'}
						>
							<div className={styles.usageOverview}>
								<div className={styles.progressSection}>
									<Progress
										type='circle'
										percent={Math.round(usagePercent)}
										format={() => `${Math.round(usagePercent)}%`}
										size={120 as any}
										strokeColor={{
											'0%': '#3371fc',
											'100%': '#4580ff'
										}}
										className={styles.progressCircle}
									/>
									<div className={styles.progressInfo}>
										<div className={styles.used}>
											<span className={styles.number}>
												{stats.current_month.requests.toLocaleString()}
											</span>
											<span className={styles.label}>
												{is_cn ? '已使用' : 'Used'}
											</span>
										</div>
										<div className={styles.total}>
											<span className={styles.number}>
												{stats.current_month.requests_limit.toLocaleString()}
											</span>
											<span className={styles.label}>
												{is_cn ? '总限额' : 'Total'}
											</span>
										</div>
									</div>
								</div>
								<div className={styles.remaining}>
									<Statistic
										title={is_cn ? '剩余请求数' : 'Remaining Requests'}
										value={remainingRequests}
										valueStyle={{
											color:
												remainingRequests > 1000
													? 'var(--color_success)'
													: 'var(--color_warning)'
										}}
									/>
								</div>
							</div>
						</Card>
					</Col>

					{/* 统计概览 */}
					<Col xs={24} lg={12}>
						<Card className={styles.card} title={is_cn ? '统计概览' : 'Statistics Overview'}>
							<div className={styles.statsGrid}>
								<div className={styles.statItem}>
									<Statistic
										title={is_cn ? '本月费用' : 'Monthly Cost'}
										value={stats.current_month.cost}
										prefix='$'
										precision={2}
										valueStyle={{ color: 'var(--color_main)' }}
									/>
								</div>
								<div className={styles.statItem}>
									<Statistic
										title={is_cn ? '最近7天' : 'Last 7 Days'}
										value={last7DaysRequests}
										suffix={is_cn ? '次请求' : 'requests'}
										valueStyle={{ color: 'var(--color_success)' }}
									/>
								</div>
								<div className={styles.statItem}>
									<Statistic
										title={is_cn ? '平均每日' : 'Daily Average'}
										value={Math.round(last7DaysRequests / 7)}
										suffix={is_cn ? '次请求' : 'requests'}
										valueStyle={{ color: 'var(--color_text)' }}
									/>
								</div>
								<div className={styles.statItem}>
									<Statistic
										title={is_cn ? '使用率' : 'Usage Rate'}
										value={usagePercent}
										suffix='%'
										precision={1}
										valueStyle={{
											color:
												usagePercent > 80
													? 'var(--color_warning)'
													: 'var(--color_success)'
										}}
									/>
								</div>
							</div>
						</Card>
					</Col>

					{/* 使用趋势 */}
					<Col xs={24}>
						<Card
							className={styles.card}
							title={is_cn ? '最近30天使用趋势' : 'Usage Trend (Last 30 Days)'}
						>
							<div className={styles.chartPlaceholder}>
								<div className={styles.chartIcon}>📊</div>
								<h4>{is_cn ? '图表功能开发中' : 'Chart Coming Soon'}</h4>
								<p>
									{is_cn
										? '将显示详细的使用趋势图表'
										: 'Detailed usage trend chart will be displayed here'}
								</p>
								<div className={styles.sampleData}>
									<div className={styles.dataTitle}>
										{is_cn
											? '最近7天数据样例：'
											: 'Sample data for last 7 days:'}
									</div>
									<div className={styles.dataList}>
										{last7Days.map((day, index) => (
											<div key={index} className={styles.dataItem}>
												<span className={styles.date}>{day.date}</span>
												<span className={styles.requests}>
													{day.requests}{' '}
													{is_cn ? '请求' : 'requests'}
												</span>
												<span className={styles.cost}>${day.cost}</span>
											</div>
										))}
									</div>
								</div>
							</div>
						</Card>
					</Col>
				</Row>
			</div>
		</div>
	)
}

export default Usage
