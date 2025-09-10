import { useState, useEffect, useRef } from 'react'
import { getLocale } from '@umijs/max'
import * as echarts from 'echarts'
import { Button, PaginatedTable } from '@/components/ui'
import { DateRange, DateRangeValue } from '@/components/ui/inputs'
import { TableColumn, TableAction } from '@/components/ui/PaginatedTable/types'
import Icon from '@/widgets/Icon'
import { mockApi, UsageStats, UsageRecord } from '../../mockData'
import styles from './index.less'

const Usage = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const chartRef = useRef<HTMLDivElement>(null)
	const chartInstance = useRef<echarts.ECharts | null>(null)

	const [loading, setLoading] = useState(true)
	const [stats, setStats] = useState<UsageStats | null>(null)
	const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([])
	const [recordsLoading, setRecordsLoading] = useState(true)
	const [recordsTotal, setRecordsTotal] = useState(0)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(20)
	const [dateRange, setDateRange] = useState<DateRangeValue>({
		start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		end: new Date().toISOString().split('T')[0]
	})

	// 加载统计数据
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

	// 加载使用记录
	useEffect(() => {
		loadUsageRecords()
	}, [currentPage, pageSize])

	// 处理分页变化
	const handlePageChange = (page: number, size: number) => {
		setCurrentPage(page)
		setPageSize(size)
	}

	// 加载使用记录
	const loadUsageRecords = async (page = currentPage, size = pageSize) => {
		try {
			setRecordsLoading(true)
			const response = await mockApi.getUsageRecords(page, size)
			setUsageRecords(response.records)
			setRecordsTotal(response.total)
		} catch (error) {
			console.error('Failed to load usage records:', error)
		} finally {
			setRecordsLoading(false)
		}
	}

	// 处理日期范围变化
	const handleDateRangeChange = (newRange: DateRangeValue) => {
		setDateRange(newRange)
		// 重新加载统计数据和使用记录
		loadUsageRecords(1, pageSize)
		console.log('Date range changed:', newRange)
	}

	// 获取日期范围显示文本
	const getDateRangeText = () => {
		if (!dateRange.start && !dateRange.end) {
			return is_cn ? '全部时间' : 'All Time'
		}
		if (dateRange.start && dateRange.end) {
			const startDate = new Date(dateRange.start)
			const endDate = new Date(dateRange.end)
			const formatOptions: Intl.DateTimeFormatOptions = {
				month: 'short',
				day: 'numeric'
			}

			if (startDate.getFullYear() !== endDate.getFullYear()) {
				formatOptions.year = 'numeric'
			}

			return `${startDate.toLocaleDateString(locale, formatOptions)} - ${endDate.toLocaleDateString(
				locale,
				formatOptions
			)}`
		}
		if (dateRange.start) {
			return `${new Date(dateRange.start).toLocaleDateString(locale, {
				month: 'short',
				day: 'numeric'
			})} - ${is_cn ? '现在' : 'Now'}`
		}
		return is_cn ? '全部时间' : 'All Time'
	}

	// 获取图表标题
	const getChartTitle = () => {
		return 'Overview'
	}

	// 初始化月度使用图表
	const initMonthlyChart = () => {
		if (!chartRef.current || !stats) return

		// 释放现有图表
		if (chartInstance.current) {
			chartInstance.current.dispose()
		}

		// 创建新图表
		const chart = echarts.init(chartRef.current)
		chartInstance.current = chart

		const usagePercent = (stats.current_month.requests / stats.current_month.requests_limit) * 100
		const remainingPercent = 100 - usagePercent

		const option = {
			series: [
				{
					type: 'pie',
					radius: ['65%', '80%'],
					center: ['50%', '50%'],
					avoidLabelOverlap: false,
					silent: true,
					label: {
						show: false
					},
					labelLine: {
						show: false
					},
					data: [
						{
							value: usagePercent,
							name: is_cn ? '已使用' : 'Used',
							itemStyle: {
								color: '#3371FC'
							}
						},
						{
							value: remainingPercent,
							name: is_cn ? '剩余' : 'Remaining',
							itemStyle: {
								color: 'rgba(51, 113, 252, 0.1)'
							}
						}
					]
				}
			]
		}

		chart.setOption(option)

		// 处理窗口大小变化
		const handleResize = () => {
			chart.resize()
		}
		window.addEventListener('resize', handleResize)

		return () => {
			window.removeEventListener('resize', handleResize)
			chart.dispose()
		}
	}

	// 初始化图表
	useEffect(() => {
		if (stats && chartRef.current) {
			const cleanup = initMonthlyChart()
			return cleanup
		}
	}, [stats, is_cn])

	// 表格列定义
	const columns: TableColumn<UsageRecord>[] = [
		{
			key: 'date',
			title: is_cn ? '日期' : 'Date',
			dataIndex: 'date',
			width: 140,
			render: (date: string) => {
				return new Date(date).toLocaleDateString(locale, {
					month: 'short',
					day: 'numeric',
					year: '2-digit'
				})
			}
		},
		{
			key: 'requests',
			title: is_cn ? '请求数' : 'Requests',
			dataIndex: 'requests',
			width: 120,
			align: 'right',
			render: (requests: number) => (
				<span className={styles.requestsCount}>{requests.toLocaleString()}</span>
			)
		},
		{
			key: 'cost',
			title: is_cn ? '点数' : 'Credits',
			dataIndex: 'cost',
			width: 120,
			align: 'right',
			render: (cost: number) => (
				<span className={styles.creditsAmount}>{Math.round(cost * 100).toLocaleString()}</span>
			)
		},
		{
			key: 'tokens',
			title: is_cn ? 'Tokens' : 'Tokens',
			dataIndex: 'tokens',
			width: 140,
			align: 'right',
			render: (tokens: number) => <span className={styles.tokensCount}>{tokens.toLocaleString()}</span>
		}
	]

	// 表格操作
	const actions: TableAction<UsageRecord>[] = [
		{
			key: 'view',
			label: is_cn ? '查看详情' : 'View Details',
			icon: <Icon name='material-visibility' size={14} />,
			onClick: (record) => {
				console.log('View record:', record)
			}
		}
	]

	if (loading) {
		return (
			<div className={styles.usage}>
				<div className={styles.loadingState}>
					<Icon name='material-hourglass_empty' size={32} className={styles.loadingIcon} />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
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
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '使用统计' : 'Usage Statistics'}</h2>
					<p>{is_cn ? '查看您的API使用情况和统计信息' : 'View your API usage and statistics'}</p>
				</div>
				<div className={styles.headerActions}>
					<DateRange
						value={dateRange}
						onChange={handleDateRangeChange}
						size='small'
						presets={[
							{
								label: is_cn ? '最近7天' : 'Last 7 days',
								value: {
									start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
										.toISOString()
										.split('T')[0],
									end: new Date().toISOString().split('T')[0]
								}
							},
							{
								label: is_cn ? '最近30天' : 'Last 30 days',
								value: {
									start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
										.toISOString()
										.split('T')[0],
									end: new Date().toISOString().split('T')[0]
								}
							}
						]}
					/>
					<Button
						type='default'
						icon={<Icon name='material-download' size={14} />}
						onClick={() => console.log('Export usage data')}
					>
						{is_cn ? '导出数据' : 'Export Data'}
					</Button>
				</div>
			</div>

			{/* Content Stack */}
			<div className={styles.contentStack}>
				{/* Monthly Usage Chart Section */}
				<div className={styles.chartSection}>
					<div className={styles.usageOverviewCard}>
						<div className={styles.cardHeader}>
							<div className={styles.cardTitle}>
								<Icon
									name='material-donut_large'
									size={16}
									className={styles.cardIcon}
								/>
								<h3>{getChartTitle()}</h3>
							</div>
							<div className={styles.cardMeta}>{getDateRangeText()}</div>
						</div>
						<div className={styles.cardContent}>
							<div className={styles.usageOverviewDisplay}>
								<div className={styles.chartContainer}>
									<div ref={chartRef} className={styles.usageChart}></div>
									<div className={styles.chartCenter}>
										<div className={styles.usageNumber}>
											{usagePercent.toFixed(1)}%
										</div>
										<div className={styles.usageLabel}>
											{is_cn ? '已使用' : 'Used'}
										</div>
									</div>
								</div>
								<div className={styles.usageStatsColumn}>
									<div className={styles.usageStatsGrid}>
										{/* 总使用统计 */}
										<div className={styles.statItem}>
											<span className={styles.statNumber}>
												{(
													stats.current_month.monthly_quota_used +
													stats.current_month.extra_credits_used
												).toLocaleString()}
											</span>
											<span className={styles.statLabel}>
												{is_cn ? '总使用' : 'Total Used'}
											</span>
										</div>
										{/* 分项使用统计 */}
										<div className={styles.statItem}>
											<span className={styles.statNumber}>
												{stats.current_month.monthly_quota_used.toLocaleString()}
											</span>
											<span className={styles.statLabel}>
												{is_cn ? '月度使用' : 'Monthly Used'}
											</span>
										</div>
										<div className={styles.statItem}>
											<span className={styles.statNumber}>
												{stats.current_month.extra_credits_used.toLocaleString()}
											</span>
											<span className={styles.statLabel}>
												{is_cn ? '额外使用' : 'Extra Used'}
											</span>
										</div>
										<div className={styles.statItem}>
											<span className={styles.statNumber}>
												{(
													stats.current_month.tokens_used / 1000
												).toFixed(1)}
												K
											</span>
											<span className={styles.statLabel}>
												{is_cn ? 'Tokens使用' : 'Tokens Used'}
											</span>
										</div>
										<div className={styles.statItem}>
											<span className={styles.statNumber}>
												{stats.current_month.requests.toLocaleString()}
											</span>
											<span className={styles.statLabel}>
												{is_cn ? '请求次数' : 'Requests Used'}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Usage Records Table */}
				<div className={styles.recordsSection}>
					<div className={styles.recordsHeader}>
						<h3>{is_cn ? '使用记录' : 'Usage Records'}</h3>
					</div>
					<PaginatedTable
						data={usageRecords}
						columns={columns}
						actions={actions}
						loading={recordsLoading}
						total={recordsTotal}
						current={currentPage}
						pageSize={pageSize}
						onPageChange={handlePageChange}
						size='small'
						showSizeChanger={true}
						showQuickJumper={false}
						showTotal={true}
						emptyText={
							<div className={styles.emptyState}>
								<Icon name='material-timeline' size={48} />
								<p>{is_cn ? '暂无使用记录' : 'No usage records'}</p>
							</div>
						}
						rowKey='id'
					/>
				</div>
			</div>
		</div>
	)
}

export default Usage
