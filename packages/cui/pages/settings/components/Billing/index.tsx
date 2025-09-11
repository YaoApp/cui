import { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import { Button, PaginatedTable, Select } from '@/components/ui'
import { TableColumn, TableAction } from '@/components/ui/PaginatedTable/types'
import Icon from '@/widgets/Icon'
import { mockApi, BillingData, Invoice } from '../../mockData'
import styles from './index.less'

const Billing = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [billingData, setBillingData] = useState<BillingData | null>(null)
	const [invoices, setInvoices] = useState<Invoice[]>([])
	const [invoicesLoading, setInvoicesLoading] = useState(false)
	const [selectedMonth, setSelectedMonth] = useState('2025-09')

	// 月份选项 schema
	const monthSchema = {
		type: 'string' as const,
		title: is_cn ? '选择月份' : 'Select Month',
		enum: [
			{ label: is_cn ? '2025年9月' : 'September 2025', value: '2025-09' },
			{ label: is_cn ? '2025年8月' : 'August 2025', value: '2025-08' },
			{ label: is_cn ? '2025年7月' : 'July 2025', value: '2025-07' },
			{ label: is_cn ? '2025年6月' : 'June 2025', value: '2025-06' },
			{ label: is_cn ? '2025年5月' : 'May 2025', value: '2025-05' },
			{ label: is_cn ? '2025年4月' : 'April 2025', value: '2025-04' },
			{ label: is_cn ? '2025年3月' : 'March 2025', value: '2025-03' },
			{ label: is_cn ? '2025年2月' : 'February 2025', value: '2025-02' },
			{ label: is_cn ? '2025年1月' : 'January 2025', value: '2025-01' },
			{ label: is_cn ? '2024年12月' : 'December 2024', value: '2024-12' },
			{ label: is_cn ? '2024年11月' : 'November 2024', value: '2024-11' },
			{ label: is_cn ? '2024年10月' : 'October 2024', value: '2024-10' }
		]
	}

	// 处理月份变化
	const handleMonthChange = (value: string) => {
		setSelectedMonth(value)
		console.log('Month changed:', value)
		// 这里可以重新加载对应月份的数据
	}

	// 加载账单数据
	useEffect(() => {
		const loadBillingData = async () => {
			try {
				setLoading(true)
				const data = await mockApi.getBillingData()
				setBillingData(data)
			} catch (error) {
				console.error('Failed to load billing data:', error)
				message.error(is_cn ? '加载账单信息失败' : 'Failed to load billing data')
			} finally {
				setLoading(false)
			}
		}

		loadBillingData()
	}, [is_cn])

	// 加载发票列表
	useEffect(() => {
		const loadInvoices = async () => {
			try {
				setInvoicesLoading(true)
				const data = await mockApi.getInvoices()
				setInvoices(data)
			} catch (error) {
				console.error('Failed to load invoices:', error)
			} finally {
				setInvoicesLoading(false)
			}
		}

		loadInvoices()
	}, [])

	// 处理付款方式管理
	const handleManagePaymentMethod = () => {
		message.info(is_cn ? '即将跳转到 Stripe 付款方式管理' : 'Redirecting to Stripe payment method management')
		// 实际实现中跳转到 Stripe
		// window.open('https://billing.stripe.com/p/login/...', '_blank')
	}

	// 处理账单历史
	const handleViewBillingHistory = () => {
		message.info(is_cn ? '即将跳转到 Stripe 账单历史' : 'Redirecting to Stripe billing history')
		// 实际实现中跳转到 Stripe
		// window.open('https://billing.stripe.com/p/login/...', '_blank')
	}

	// 处理更新账单信息
	const handleUpdateBillingInfo = () => {
		message.info(is_cn ? '即将跳转到 Stripe 账单信息更新' : 'Redirecting to Stripe billing info update')
		// 实际实现中跳转到 Stripe
		// window.open('https://billing.stripe.com/p/login/...', '_blank')
	}

	// 格式化金额
	const formatAmount = (amount: number, currency: string = 'USD') => {
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency: currency
		}).format(amount / 100) // Stripe 金额以分为单位
	}

	// 格式化状态显示
	const getStatusDisplay = (status: string) => {
		const statusMap = {
			paid: { 'zh-CN': '已支付', 'en-US': 'Paid' },
			pending: { 'zh-CN': '待支付', 'en-US': 'Pending' },
			failed: { 'zh-CN': '支付失败', 'en-US': 'Failed' },
			refunded: { 'zh-CN': '已退款', 'en-US': 'Refunded' }
		}
		return statusMap[status as keyof typeof statusMap]?.[locale as 'zh-CN' | 'en-US'] || status
	}

	// 获取状态颜色类名
	const getStatusClassName = (status: string) => {
		const statusClassMap = {
			paid: styles.statusPaid,
			pending: styles.statusPending,
			failed: styles.statusFailed,
			refunded: styles.statusRefunded
		}
		return statusClassMap[status as keyof typeof statusClassMap] || ''
	}

	// 发票表格列定义
	const invoiceColumns: TableColumn<Invoice>[] = [
		{
			key: 'date',
			title: is_cn ? '日期' : 'Date',
			dataIndex: 'date',
			width: is_cn ? 140 : 120,
			render: (date: string) => {
				return new Date(date).toLocaleDateString(locale, {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				})
			}
		},
		{
			key: 'description',
			title: is_cn ? '描述' : 'Description',
			dataIndex: 'description',
			width: 400,
			render: (description: string) => <span className={styles.description}>{description}</span>
		},
		{
			key: 'status',
			title: is_cn ? '状态' : 'Status',
			dataIndex: 'status',
			width: 120,
			align: 'center',
			render: (status: string) => (
				<span className={`${styles.status} ${getStatusClassName(status)}`}>
					{getStatusDisplay(status)}
				</span>
			)
		},
		{
			key: 'amount',
			title: is_cn ? '金额' : 'Amount',
			dataIndex: 'amount',
			width: 100,
			align: 'right',
			render: (amount: number, record: Invoice) => (
				<span className={styles.amount}>{formatAmount(amount, record.currency)}</span>
			)
		}
	]

	// 发票表格操作
	const invoiceActions: TableAction<Invoice>[] = [
		{
			key: 'download',
			label: is_cn ? '下载' : 'Download',
			icon: <Icon name='material-download' size={14} />,
			onClick: (record) => {
				message.info(
					is_cn ? `下载发票 ${record.invoice_number}` : `Download invoice ${record.invoice_number}`
				)
				// 实际实现中下载发票PDF
			}
		}
	]

	if (loading) {
		return (
			<div className={styles.billing}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '账单发票' : 'Billing & Invoices'}</h2>
						<p>
							{is_cn
								? '管理您的付款方式和查看账单历史'
								: 'Manage your payment methods and view billing history'}
						</p>
					</div>
				</div>
				<div className={styles.panel}>
					<div className={styles.panelContent}>
						<div className={styles.loadingState}>
							<Icon
								name='material-hourglass_empty'
								size={32}
								className={styles.loadingIcon}
							/>
							<span>{is_cn ? '加载中...' : 'Loading...'}</span>
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (!billingData) {
		return (
			<div className={styles.billing}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '账单发票' : 'Billing & Invoices'}</h2>
						<p>
							{is_cn
								? '管理您的付款方式和查看账单历史'
								: 'Manage your payment methods and view billing history'}
						</p>
					</div>
				</div>
				<div className={styles.panel}>
					<div className={styles.panelContent}>
						<div className={styles.errorState}>
							<Icon name='material-error' size={32} className={styles.errorIcon} />
							<span>{is_cn ? '加载失败' : 'Failed to load'}</span>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.billing}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '账单发票' : 'Billing & Invoices'}</h2>
					<p>
						{is_cn
							? '管理您的订阅计划和查看账单历史'
							: 'Manage your subscription plan and view billing history'}
					</p>
				</div>
				<div className={styles.headerActions}>
					<div className={styles.monthSelectWrapper}>
						<Select
							schema={monthSchema}
							value={selectedMonth}
							onChange={(value) => handleMonthChange(value as string)}
							size='medium'
						/>
					</div>
				</div>
			</div>

			{/* Content Stack */}
			<div className={styles.contentStack}>
				{/* Part 1: Current Plan Card */}
				<div className={styles.planCard}>
					<div className={styles.cardHeader}>
						<div className={styles.cardTitle}>
							<Icon
								name='material-workspace_premium'
								size={16}
								className={styles.cardIcon}
							/>
							<h3>{is_cn ? '当前套餐' : 'Current Plan'}</h3>
						</div>
						<div className={styles.cardActions}>
							<button className={styles.detailsLink} onClick={handleManagePaymentMethod}>
								<Icon name='material-open_in_new' size={14} />
								<span>{is_cn ? '管理订阅' : 'Manage Subscription'}</span>
							</button>
							<button
								className={`${styles.detailsLink} ${styles.refundLink}`}
								onClick={() => {
									message.info(is_cn ? '申请退款' : 'Request Refund')
								}}
							>
								<Icon name='material-close' size={14} />
								<span>{is_cn ? '申请退款' : 'Request Refund'}</span>
							</button>
						</div>
					</div>
					<div className={styles.cardContent}>
						<div className={styles.planDisplay}>
							<div className={styles.planNameWithStatus}>
								<div className={styles.planName}>
									{billingData.current_plan.name} Summary
								</div>
							</div>
							<div className={styles.planPeriod}>
								{is_cn ? '2025年9月4日 - 2025年10月4日' : 'Sep 4, 2025 - Oct 4, 2025'}
							</div>
						</div>
					</div>
				</div>

				{/* Invoice History */}
				<div className={styles.invoicesSection}>
					<PaginatedTable
						data={invoices}
						columns={invoiceColumns}
						actions={invoiceActions}
						actionsTitle={is_cn ? '发票' : 'Invoice'}
						loading={invoicesLoading}
						showPagination={false}
						size='small'
						emptyText={
							<div className={styles.emptyState}>
								<Icon name='material-receipt' size={48} />
								<p>{is_cn ? '暂无发票记录' : 'No invoices available'}</p>
							</div>
						}
						rowKey='id'
					/>
				</div>
			</div>
		</div>
	)
}

export default Billing
