import { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import { PaginatedTable } from '@/components/ui'
import { DateRange, DateRangeValue } from '@/components/ui/inputs'
import { TableColumn, TableAction } from '@/components/ui/PaginatedTable/types'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface CommissionStats {
	total_credits: number
	total_commission: number
	this_month_credits: number
	this_month_commission: number
}

interface CommissionRecord {
	id: string
	date: string
	type: 'credits' | 'commission'
	amount: number
	currency?: string
	description: string
	invitee_name: string
	status: 'completed' | 'pending' | 'failed'
}

interface CommissionData {
	stats: CommissionStats
	records: CommissionRecord[]
	total: number
}

const Commissions = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 状态管理
	const [loading, setLoading] = useState(true)
	const [recordsLoading, setRecordsLoading] = useState(false)
	const [commissionData, setCommissionData] = useState<CommissionData | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(20)
	const [dateRange, setDateRange] = useState<DateRangeValue>({
		start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		end: new Date().toISOString().split('T')[0]
	})

	// 模拟数据加载
	useEffect(() => {
		const loadCommissionData = async () => {
			try {
				setLoading(true)
				// 模拟API调用
				await new Promise((resolve) => setTimeout(resolve, 1000))

				const mockData: CommissionData = {
					stats: {
						total_credits: 14000,
						total_commission: 1250,
						this_month_credits: 6000,
						this_month_commission: 480
					},
					records: generateMockRecords(),
					total: 45
				}

				setCommissionData(mockData)
			} catch (error) {
				console.error('Failed to load commission data:', error)
				message.error(is_cn ? '加载佣金数据失败' : 'Failed to load commission data')
			} finally {
				setLoading(false)
			}
		}

		loadCommissionData()
	}, [is_cn])

	// 生成模拟记录数据
	const generateMockRecords = (): CommissionRecord[] => {
		const records: CommissionRecord[] = []
		const names = ['Alice Chen', 'Bob Wang', 'Carol Li', 'David Zhang', 'Eva Liu']
		const descriptions = {
			credits: {
				'zh-CN': ['邀请注册奖励', '推荐用户奖励', '新用户注册奖励'],
				'en-US': ['Invite registration reward', 'Referral user reward', 'New user registration reward']
			},
			commission: {
				'zh-CN': ['用户购买佣金', '订阅佣金', '充值佣金'],
				'en-US': ['User purchase commission', 'Subscription commission', 'Top-up commission']
			}
		}

		for (let i = 0; i < 20; i++) {
			const type = Math.random() > 0.6 ? 'commission' : 'credits'
			const isCredits = type === 'credits'

			records.push({
				id: `record_${i + 1}`,
				date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
				type,
				amount: isCredits
					? Math.floor(Math.random() * 3000) + 1000
					: Math.floor(Math.random() * 50) + 10,
				currency: isCredits ? undefined : 'USD',
				description: descriptions[type][locale as 'zh-CN' | 'en-US'][Math.floor(Math.random() * 3)],
				invitee_name: names[Math.floor(Math.random() * names.length)],
				status: Math.random() > 0.1 ? 'completed' : Math.random() > 0.5 ? 'pending' : 'failed'
			})
		}

		return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	}

	// 处理分页变化
	const handlePageChange = (page: number, size: number) => {
		setCurrentPage(page)
		setPageSize(size)
		// 这里可以重新加载数据
		loadRecords(page, size)
	}

	// 处理日期范围变化
	const handleDateRangeChange = (newRange: DateRangeValue) => {
		setDateRange(newRange)
		// 重新加载统计数据和使用记录
		loadRecords(1, pageSize)
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

	// 加载记录数据
	const loadRecords = async (page = currentPage, size = pageSize) => {
		try {
			setRecordsLoading(true)
			// 模拟分页加载
			await new Promise((resolve) => setTimeout(resolve, 500))

			if (commissionData) {
				// 更新记录数据
				setCommissionData({
					...commissionData,
					records: generateMockRecords()
				})
			}
		} catch (error) {
			console.error('Failed to load records:', error)
		} finally {
			setRecordsLoading(false)
		}
	}

	// 格式化数字显示
	const formatNumber = (num: number): string => {
		return num.toLocaleString()
	}

	// 格式化金额显示
	const formatAmount = (amount: number, currency?: string): string => {
		if (currency) {
			return `$${amount.toFixed(2)}`
		}
		return formatNumber(amount)
	}

	// 获取状态显示
	const getStatusDisplay = (status: CommissionRecord['status']) => {
		const statusMap = {
			completed: {
				label: { 'zh-CN': '已完成', 'en-US': 'Completed' },
				className: styles.statusCompleted
			},
			pending: {
				label: { 'zh-CN': '处理中', 'en-US': 'Pending' },
				className: styles.statusPending
			},
			failed: {
				label: { 'zh-CN': '失败', 'en-US': 'Failed' },
				className: styles.statusFailed
			}
		}

		const config = statusMap[status]
		const label = config.label[locale as 'zh-CN' | 'en-US'] || config.label['en-US']

		return <span className={`${styles.statusTag} ${config.className}`}>{label}</span>
	}

	// 表格列定义
	const columns: TableColumn<CommissionRecord>[] = [
		{
			key: 'date',
			title: is_cn ? '日期' : 'Date',
			dataIndex: 'date',
			width: 115,
			render: (date: string) => {
				return new Date(date).toLocaleDateString(locale, {
					month: 'short',
					day: 'numeric',
					year: '2-digit'
				})
			}
		},
		{
			key: 'type',
			title: is_cn ? '类型' : 'Type',
			dataIndex: 'type',
			width: 120,
			render: (type: CommissionRecord['type']) => (
				<span
					className={`${styles.typeTag} ${
						type === 'credits' ? styles.typeCredits : styles.typeCommission
					}`}
				>
					{type === 'credits' ? (is_cn ? '点数' : 'Credits') : is_cn ? '佣金' : 'Commission'}
				</span>
			)
		},
		{
			key: 'description',
			title: is_cn ? '描述' : 'Description',
			dataIndex: 'description',
			width: 200,
			render: (description: string) => <span className={styles.description}>{description}</span>
		},
		{
			key: 'invitee',
			title: is_cn ? '邀请用户' : 'Invitee',
			dataIndex: 'invitee_name',
			width: 105,
			render: (name: string) => <span className={styles.inviteeName}>{name}</span>
		},
		{
			key: 'amount',
			title: is_cn ? '金额' : 'Amount',
			dataIndex: 'amount',
			width: 95,
			align: 'right',
			render: (amount: number, record: CommissionRecord) => (
				<span
					className={`${styles.amount} ${
						record.type === 'credits' ? styles.creditsAmount : styles.commissionAmount
					}`}
				>
					{formatAmount(amount, record.currency)}
				</span>
			)
		},
		{
			key: 'status',
			title: is_cn ? '状态' : 'Status',
			dataIndex: 'status',
			width: 105,
			align: 'center',
			render: (status: CommissionRecord['status']) => getStatusDisplay(status)
		}
	]

	// 表格操作
	const actions: TableAction<CommissionRecord>[] = [
		{
			key: 'view',
			label: is_cn ? '查看详情' : 'View Details',
			icon: <Icon name='material-visibility' size={14} />,
			onClick: (record: CommissionRecord) => {
				console.log('View record:', record)
				message.info(is_cn ? '查看详情功能开发中' : 'View details feature coming soon')
			}
		}
	]

	// 加载状态
	if (loading || !commissionData) {
		return (
			<div className={styles.commissions}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '邀请记录' : 'Commissions'}</h2>
						<p>
							{is_cn
								? '查看您的邀请收益记录和详细统计'
								: 'View your invitation earnings records and detailed statistics'}
						</p>
					</div>
				</div>
				<div className={styles.loadingState}>
					<Icon name='material-hourglass_empty' size={32} className={styles.loadingIcon} />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.commissions}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '邀请记录' : 'Commissions'}</h2>
					<p>
						{is_cn
							? '查看您的邀请收益记录和详细统计'
							: 'View your invitation earnings records and detailed statistics'}
					</p>
				</div>
				<div className={styles.headerActions}>
					<DateRange
						value={dateRange}
						onChange={handleDateRangeChange}
						size='small'
						placement='bottomRight'
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
							},
							{
								label: is_cn ? '最近90天' : 'Last 90 days',
								value: {
									start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
										.toISOString()
										.split('T')[0],
									end: new Date().toISOString().split('T')[0]
								}
							}
						]}
					/>
				</div>
			</div>

			{/* Content Stack */}
			<div className={styles.contentStack}>
				{/* S1: 统计部分 */}
				<div className={styles.statsSection}>
					{/* Earned Credits 卡片 */}
					<div className={styles.statsCard}>
						<div className={styles.cardHeader}>
							<div className={styles.cardTitle}>
								<Icon name='material-stars' size={16} className={styles.cardIcon} />
								<h3>{is_cn ? '获得点数' : 'Earned Credits'}</h3>
							</div>
						</div>
						<div className={styles.cardContent}>
							<div className={styles.statsDisplay}>
								<div className={styles.mainAmount}>
									{formatNumber(commissionData.stats.total_credits)}
								</div>
								<div className={styles.mainLabel}>
									{is_cn ? '总计点数收益' : 'Total Credits Earned'}
								</div>
							</div>
						</div>
					</div>

					{/* Commission 卡片 */}
					<div className={`${styles.statsCard} ${styles.commissionCard}`}>
						<div className={styles.cardHeader}>
							<div className={styles.cardTitle}>
								<Icon name='material-payments' size={16} className={styles.cardIcon} />
								<h3>{is_cn ? '佣金收益' : 'Commission'}</h3>
							</div>
							<button
								className={styles.detailsLink}
								onClick={() => {
									message.info(
										is_cn ? '提现功能开发中' : 'Withdrawal feature coming soon'
									)
								}}
							>
								<Icon name='material-account_balance_wallet' size={14} />
								<span>{is_cn ? '提现' : 'Withdraw'}</span>
							</button>
						</div>
						<div className={styles.cardContent}>
							<div className={styles.statsDisplay}>
								<div className={styles.mainAmount}>
									${formatAmount(commissionData.stats.total_commission)}
								</div>
								<div className={styles.mainLabel}>
									{is_cn ? '总计佣金收益' : 'Total Commission Earned'}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* S2: 记录列表 */}
				<div className={styles.recordsSection}>
					<PaginatedTable
						data={commissionData.records}
						columns={columns}
						actions={actions}
						loading={recordsLoading}
						total={commissionData.total}
						current={currentPage}
						pageSize={pageSize}
						onPageChange={handlePageChange}
						size='small'
						showSizeChanger={true}
						showQuickJumper={false}
						showTotal={true}
						emptyText={
							<div className={styles.emptyState}>
								<Icon name='material-receipt' size={48} />
								<p>{is_cn ? '暂无收益记录' : 'No commission records'}</p>
							</div>
						}
						rowKey='id'
					/>
				</div>
			</div>
		</div>
	)
}

export default Commissions
