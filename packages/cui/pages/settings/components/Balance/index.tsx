import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Form, Space, Input, Button as AntdButton, Tooltip, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { Button, PaginatedTable } from '@/components/ui'
import type { PaginatedTableProps, TableColumn, TableAction } from '@/components/ui'
import { mockApi } from '../../mockData'
import type { BalanceInfo, TopUpRecord, TopUpMethod, TopUpStatus } from '../../mockData'
import styles from './index.less'

const Balance: React.FC = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [form] = Form.useForm()

	// 状态管理
	const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null)
	const [topUpRecords, setTopUpRecords] = useState<TopUpRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [recordsLoading, setRecordsLoading] = useState(true)
	const [recordsTotal, setRecordsTotal] = useState(0)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(10)

	// 充值模态框状态
	const [topUpModalVisible, setTopUpModalVisible] = useState(false)
	const [topUpMethod, setTopUpMethod] = useState<TopUpMethod>('stripe')
	const [selectedAmount, setSelectedAmount] = useState<number | 'custom' | null>(null)
	const [customAmount, setCustomAmount] = useState('')
	const [cardCode, setCardCode] = useState('')
	const [cardInfo, setCardInfo] = useState<{ credits: number; valid: boolean } | null>(null)
	const [topUpProcessing, setTopUpProcessing] = useState(false)

	// 格式化数字显示
	const formatCredits = (credits: number): string => {
		return credits.toLocaleString()
	}

	const formatAmount = (amount: number): string => {
		return `$${amount.toFixed(2)}`
	}

	// 加载余额信息
	const loadBalanceInfo = useCallback(async () => {
		try {
			setLoading(true)
			const data = await mockApi.getBalanceInfo()
			setBalanceInfo(data)
		} catch (error) {
			console.error('Failed to load balance info:', error)
		} finally {
			setLoading(false)
		}
	}, [])

	// 加载充值记录
	const loadTopUpRecords = useCallback(
		async (page: number = 1, size: number = pageSize) => {
			try {
				setRecordsLoading(true)
				const response = await mockApi.getTopUpRecords(page, size)
				setTopUpRecords(response.records)
				setRecordsTotal(response.total)
				setCurrentPage(page)
			} catch (error) {
				console.error('Failed to load top-up records:', error)
			} finally {
				setRecordsLoading(false)
			}
		},
		[pageSize]
	)

	// 处理分页变化
	const handlePageChange = useCallback(
		(page: number, size: number) => {
			setCurrentPage(page)
			setPageSize(size)
			loadTopUpRecords(page, size)
		},
		[loadTopUpRecords]
	)

	// 充值处理
	// 验证点卡
	const validateCardCode = useCallback((code: string) => {
		if (!code || code.length < 8) {
			setCardInfo(null)
			return
		}

		// 模拟点卡验证逻辑
		const mockCards = {
			CARD1000: { credits: 1000, valid: true },
			CARD5000: { credits: 5000, valid: true },
			CARD10000: { credits: 10000, valid: true },
			VIP20000: { credits: 20000, valid: true },
			BONUS500: { credits: 500, valid: true },
			TEST1234: { credits: 2000, valid: true }
		}

		// 检查是否是预设的有效卡号
		if (mockCards[code as keyof typeof mockCards]) {
			setCardInfo(mockCards[code as keyof typeof mockCards])
		} else {
			// 对于其他卡号，根据长度和格式简单判断
			if (code.length >= 12) {
				// 假设长卡号有效，随机生成点数
				const credits = Math.floor(Math.random() * 5 + 1) * 1000 // 1000-5000点
				setCardInfo({ credits, valid: true })
			} else {
				setCardInfo({ credits: 0, valid: false })
			}
		}
	}, [])

	// 处理模态框关闭
	const handleModalClose = useCallback(() => {
		setTopUpModalVisible(false)
		setTopUpMethod('stripe')
		setSelectedAmount(null)
		setCustomAmount('')
		setCardCode('')
		setCardInfo(null)
		setTopUpProcessing(false)
	}, [])

	// 验证表单是否有效
	const isFormValid = useCallback(() => {
		if (topUpMethod === 'stripe') {
			if (selectedAmount === 'custom') {
				const amount = parseFloat(customAmount)
				return amount >= 1 && amount <= 1000
			}
			return selectedAmount && typeof selectedAmount === 'number'
		}
		if (topUpMethod === 'card_code') {
			return cardCode.trim().length > 0 && cardInfo?.valid === true
		}
		return false
	}, [topUpMethod, selectedAmount, customAmount, cardCode, cardInfo])

	// 处理提交
	const handleSubmit = useCallback(async () => {
		if (!isFormValid()) return

		try {
			setTopUpProcessing(true)

			// 模拟充值处理
			await new Promise((resolve) => setTimeout(resolve, 2000))

			// 计算获得的点数
			let amount: number
			let credits: number

			if (topUpMethod === 'stripe') {
				if (selectedAmount === 'custom') {
					amount = parseFloat(customAmount)
					credits = amount * 100
				} else {
					amount = selectedAmount as number
					credits = amount === 100 ? 11000 : amount * 100 // $100有额外奖励
				}

				message.success(
					is_cn
						? `充值成功！获得 ${credits.toLocaleString()} 点数`
						: `Top-up successful! You got ${credits.toLocaleString()} credits`
				)
			} else {
				message.success(is_cn ? '兑换成功！' : 'Redemption successful!')
			}

			// 刷新数据
			await loadBalanceInfo()
			await loadTopUpRecords(1, pageSize)

			handleModalClose()
		} catch (error) {
			console.error('Top-up failed:', error)
			message.error(is_cn ? '操作失败，请重试' : 'Operation failed, please try again')
		} finally {
			setTopUpProcessing(false)
		}
	}, [
		topUpMethod,
		selectedAmount,
		customAmount,
		cardCode,
		is_cn,
		loadBalanceInfo,
		loadTopUpRecords,
		handleModalClose
	])

	// 初始化数据 - 只运行一次
	useEffect(() => {
		loadBalanceInfo()
		loadTopUpRecords(1, pageSize)
	}, []) // 空依赖数组，只运行一次

	// 获取充值方式显示名称和描述
	const getMethodDisplayInfo = (method: TopUpMethod, record: TopUpRecord) => {
		const methodInfo = {
			stripe: {
				name: { 'zh-CN': 'Stripe', 'en-US': 'Stripe' },
				description: { 'zh-CN': '在线支付', 'en-US': 'Online Payment' }
			},
			card_code: {
				name: { 'zh-CN': '点卡', 'en-US': 'Card Code' },
				description: { 'zh-CN': '兑换码充值', 'en-US': 'Code Redemption' }
			},
			bank_transfer: {
				name: { 'zh-CN': '银行转账', 'en-US': 'Bank Transfer' },
				description: { 'zh-CN': '银行转账付款', 'en-US': 'Bank Transfer Payment' }
			},
			alipay: {
				name: { 'zh-CN': '支付宝', 'en-US': 'Alipay' },
				description: { 'zh-CN': '支付宝付款', 'en-US': 'Alipay Payment' }
			},
			wechat: {
				name: { 'zh-CN': '微信支付', 'en-US': 'WeChat Pay' },
				description: { 'zh-CN': '微信支付付款', 'en-US': 'WeChat Pay Payment' }
			}
		}

		const info = methodInfo[method] || {
			name: { 'zh-CN': method, 'en-US': method },
			description: { 'zh-CN': '其他方式', 'en-US': 'Other Method' }
		}

		return {
			name: info.name[locale as 'zh-CN' | 'en-US'] || info.name['en-US'],
			description: info.description[locale as 'zh-CN' | 'en-US'] || info.description['en-US']
		}
	}

	// 获取状态标签 - 使用Scenario风格的标签
	const getStatusTag = (status: TopUpStatus) => {
		const statusConfig = {
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
			},
			cancelled: {
				label: { 'zh-CN': '已取消', 'en-US': 'Cancelled' },
				className: styles.statusCancelled
			}
		}

		const config = statusConfig[status]
		const label = config?.label?.[locale as 'zh-CN' | 'en-US'] || config?.label?.['en-US'] || status

		return <span className={`${styles.statusTag} ${config?.className || ''}`}>{label}</span>
	}

	// 表格列定义
	const columns: TableColumn<TopUpRecord>[] = [
		{
			key: 'created_at',
			title: is_cn ? '时间' : 'Date',
			dataIndex: 'created_at',
			width: 120,
			render: (date: string) => {
				return new Date(date).toLocaleDateString(locale, {
					month: 'short',
					day: 'numeric',
					year: '2-digit'
				})
			}
		},
		{
			key: 'method',
			title: is_cn ? '方式' : 'Method',
			dataIndex: 'method',
			width: 180,
			render: (method: TopUpMethod, record: TopUpRecord) => {
				const methodInfo = getMethodDisplayInfo(method, record)
				return (
					<div className={styles.methodCell}>
						<div className={styles.methodName}>{methodInfo.name}</div>
						<div className={styles.methodDescription}>{methodInfo.description}</div>
					</div>
				)
			}
		},
		{
			key: 'credits',
			title: is_cn ? '获得点数' : 'Credits',
			dataIndex: 'credits',
			width: 100,
			align: 'right',
			render: (credits: number) => <span className={styles.creditsAmount}>{formatCredits(credits)}</span>
		},
		{
			key: 'expiry_date',
			title: is_cn ? '有效期' : 'Expires',
			dataIndex: 'expiry_date',
			width: 120,
			render: (date: string) => {
				const expiryDate = new Date(date)
				const now = new Date()
				const isExpiringSoon = expiryDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000 // 30天内过期

				return (
					<span
						className={styles.expiryDate}
						style={{ color: isExpiringSoon ? 'var(--color_warning)' : undefined }}
					>
						{expiryDate.toLocaleDateString(locale, {
							month: 'short',
							day: 'numeric',
							year: '2-digit'
						})}
					</span>
				)
			}
		},
		{
			key: 'status',
			title: is_cn ? '状态' : 'Status',
			dataIndex: 'status',
			width: 100,
			align: 'center',
			render: (status: TopUpStatus) => getStatusTag(status)
		}
	]

	// 表格操作
	const actions: TableAction<TopUpRecord>[] = [
		{
			key: 'view',
			label: is_cn ? '查看详情' : 'View Details',
			icon: <Icon name='material-visibility' size={14} />,
			onClick: (record: TopUpRecord) => {
				console.log('View record:', record)
			}
		}
	]

	// 加载状态
	if (loading || !balanceInfo) {
		return (
			<div className={styles.balance}>
				<div className={styles.loadingState}>
					<Icon name='material-hourglass_empty' size={32} className={styles.loadingIcon} />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.balance}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '账户余额' : 'Account Balance'}</h2>
					<p>
						{is_cn
							? '管理您的点数余额，点数充值和查看充值记录'
							: 'Manage your credits balance, top up credits and view top-up history'}
					</p>
				</div>
				<div className={styles.headerActions}>
					<Button
						type='primary'
						icon={<Icon name='material-add_card' size={14} />}
						onClick={() => setTopUpModalVisible(true)}
					>
						{is_cn ? '点数充值' : 'Add Credits'}
					</Button>
				</div>
			</div>

			{/* Content Stack */}
			<div className={styles.contentStack}>
				{/* 余额展示区 - 两个余额块并排 */}
				<div className={styles.balanceSection}>
					{/* 额外点数卡片 */}
					<div className={styles.balanceCard}>
						<div className={styles.cardHeader}>
							<div className={styles.cardTitle}>
								<Icon name='material-stars' size={16} className={styles.cardIcon} />
								<h3>{is_cn ? '额外点数' : 'Extra Credits'}</h3>
							</div>
						</div>
						<div className={styles.cardContent}>
							<div className={styles.balanceDisplay}>
								<div className={styles.balanceNumber}>
									{formatCredits(
										balanceInfo.extra_credits.reduce(
											(sum, pkg) => sum + pkg.balance,
											0
										)
									)}
								</div>
								<div className={styles.balanceLabel}>
									{is_cn ? '可用额外点数' : 'Available Extra Credits'}
								</div>
							</div>
						</div>
					</div>

					{/* 总点数卡片 */}
					<div className={styles.balanceCard}>
						<div className={styles.cardHeader}>
							<div className={styles.cardTitle}>
								<Icon
									name='material-account_balance_wallet'
									size={16}
									className={styles.cardIcon}
								/>
								<h3>{is_cn ? '总点数' : 'Total Credits'}</h3>
							</div>
						</div>
						<div className={styles.cardContent}>
							<div className={styles.balanceDisplay}>
								<div className={styles.balanceNumber}>
									{formatCredits(balanceInfo.total_credits)}
								</div>
								<div className={styles.balanceLabel}>
									{is_cn ? '账户总余额' : 'Total Account Balance'}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* 月度使用情况卡片 - 参考Subscription样式 */}
				<div className={styles.usageCard}>
					<div className={styles.usageHeader}>
						<div className={styles.sectionTitle}>
							<Icon name='material-autorenew' size={16} className={styles.sectionIcon} />
							<span>{is_cn ? '月度使用情况' : 'Monthly Usage'}</span>
						</div>
						<div className={styles.sectionMeta}>
							{is_cn
								? `将于 ${new Date(
										balanceInfo.monthly_credits.reset_date
								  ).toLocaleDateString()} 重置`
								: `Resets on ${new Date(
										balanceInfo.monthly_credits.reset_date
								  ).toLocaleDateString()}`}
						</div>
					</div>
					<div className={styles.sectionContent}>
						<div className={styles.creditsDisplay}>
							<div className={styles.usedSection}>
								<span className={styles.creditsUsed}>
									{formatCredits(balanceInfo.monthly_credits.used)}
								</span>
								<span className={styles.usedLabel}>{is_cn ? '已使用' : 'Used'}</span>
							</div>
							<span className={styles.creditsDivider}>/</span>
							<div className={styles.limitSection}>
								<span className={styles.creditsLimit}>
									{formatCredits(balanceInfo.monthly_credits.limit)}
								</span>
								<span className={styles.limitLabel}>
									{is_cn ? '月度限额' : 'Monthly Limit'}
								</span>
							</div>
						</div>
						<div className={styles.progressWrapper}>
							<div className={styles.progressBar}>
								<div
									className={`${styles.progressFill} ${styles.monthlyProgress}`}
									style={{
										width: `${Math.min(
											(balanceInfo.monthly_credits.used /
												balanceInfo.monthly_credits.limit) *
												100,
											100
										)}%`
									}}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* 充值历史记录 */}
				<div className={styles.historySection}>
					<div className={styles.historyHeader}>
						<h3>{is_cn ? '充值历史记录' : 'Top-up History'}</h3>
					</div>
					<PaginatedTable
						data={topUpRecords}
						columns={columns}
						actions={actions}
						loading={recordsLoading}
						total={recordsTotal}
						current={currentPage}
						pageSize={pageSize}
						onPageChange={handlePageChange}
						size='small'
						showQuickJumper={false}
						showSizeChanger={true}
						showTotal={true}
						emptyText={
							<div className={styles.emptyState}>
								<Icon name='material-receipt' size={48} />
								<p>{is_cn ? '暂无充值记录' : 'No top-up records'}</p>
							</div>
						}
						rowKey='id'
					/>
				</div>
			</div>

			{/* 充值模态框 - 重构版本 */}
			<Modal
				title={is_cn ? '点数充值' : 'Add Credits'}
				open={topUpModalVisible}
				onCancel={handleModalClose}
				footer={null}
				width={480}
				className={styles.topUpModal}
			>
				<div className={styles.modalContent}>
					{/* 支付方式选择 */}
					<div className={styles.section}>
						<div className={styles.sectionLabel}>
							{is_cn ? '充值方式' : 'Payment Method'}{' '}
							<span className={styles.required}>*</span>
						</div>
						<div className={styles.paymentMethodGrid}>
							<div
								className={`${styles.paymentMethod} ${
									topUpMethod === 'stripe' ? styles.selected : ''
								}`}
								onClick={() => {
									setTopUpMethod('stripe')
									setSelectedAmount(null)
								}}
							>
								<Icon name='material-payment' size={16} />
								<span>{is_cn ? 'Stripe 在线支付' : 'Stripe Payment'}</span>
							</div>
							<div
								className={`${styles.paymentMethod} ${
									topUpMethod === 'card_code' ? styles.selected : ''
								}`}
								onClick={() => {
									setTopUpMethod('card_code')
									setSelectedAmount(null)
								}}
							>
								<Icon name='material-redeem' size={16} />
								<span>{is_cn ? '点卡兑换' : 'Card Code'}</span>
							</div>
						</div>
					</div>

					{/* Stripe 金额选择 */}
					{topUpMethod === 'stripe' && (
						<div className={styles.section}>
							<div className={styles.sectionLabel}>
								{is_cn ? '充值金额' : 'Amount'}{' '}
								<span className={styles.required}>*</span>
							</div>
							<div className={styles.amountGrid}>
								<div
									className={`${styles.amountOption} ${
										selectedAmount === 10 ? styles.selected : ''
									}`}
									onClick={() => setSelectedAmount(10)}
								>
									<div className={styles.price}>$10</div>
									<div className={styles.credits}>
										{is_cn ? '1,000 点' : '1,000 Credits'}
									</div>
								</div>
								<div
									className={`${styles.amountOption} ${
										selectedAmount === 50 ? styles.selected : ''
									}`}
									onClick={() => setSelectedAmount(50)}
								>
									<div className={styles.price}>$50</div>
									<div className={styles.credits}>
										{is_cn ? '5,000 点' : '5,000 Credits'}
									</div>
								</div>
								<div
									className={`${styles.amountOption} ${
										selectedAmount === 100 ? styles.selected : ''
									}`}
									onClick={() => setSelectedAmount(100)}
								>
									<div className={styles.price}>$100</div>
									<div className={styles.credits}>
										{is_cn ? '10,000 点' : '10,000 Credits'}
									</div>
								</div>
								<div
									className={`${styles.amountOption} ${
										selectedAmount === 'custom' ? styles.selected : ''
									}`}
									onClick={() => setSelectedAmount('custom')}
								>
									<div className={styles.price}>{is_cn ? '自定义' : 'Custom'}</div>
									<div className={styles.credits}>
										{is_cn ? '输入金额' : 'Enter Amount'}
									</div>
								</div>
							</div>
							{selectedAmount === 'custom' && (
								<div className={styles.customInput}>
									<Input
										placeholder={
											is_cn ? '请输入金额 (USD)' : 'Enter amount (USD)'
										}
										prefix='$'
										type='number'
										min='1'
										max='1000'
										value={customAmount}
										onChange={(e) => setCustomAmount(e.target.value)}
									/>
									{customAmount && parseFloat(customAmount) > 0 && (
										<div className={styles.customPreview}>
											{is_cn ? '可获得：' : 'You will get: '}
											<span className={styles.previewCredits}>
												{(
													parseFloat(customAmount) * 100
												).toLocaleString()}{' '}
												{is_cn ? '点' : 'Credits'}
											</span>
										</div>
									)}
								</div>
							)}
						</div>
					)}

					{/* 点卡兑换 */}
					{topUpMethod === 'card_code' && (
						<div className={styles.section}>
							<div className={styles.sectionLabel}>
								{is_cn ? '兑换码' : 'Card Code'}{' '}
								<span className={styles.required}>*</span>
							</div>
							<div className={styles.cardCodeInput}>
								<Input
									placeholder={is_cn ? '请输入兑换码' : 'Enter card code'}
									maxLength={16}
									value={cardCode}
									onChange={(e) => {
										const code = e.target.value.toUpperCase()
										setCardCode(code)
										validateCardCode(code)
									}}
								/>
								{cardInfo && (
									<div
										className={`${styles.cardPreview} ${
											cardInfo.valid ? styles.valid : styles.invalid
										}`}
									>
										{cardInfo.valid ? (
											<>
												<Icon
													name='material-check_circle'
													size={16}
													className={styles.validIcon}
												/>
												{is_cn
													? '有效卡号，可获得：'
													: 'Valid card, you will get: '}
												<span className={styles.previewCredits}>
													{cardInfo.credits.toLocaleString()}{' '}
													{is_cn ? '点' : 'Credits'}
												</span>
											</>
										) : (
											<>
												<Icon
													name='material-error'
													size={16}
													className={styles.invalidIcon}
												/>
												{is_cn ? '无效的兑换码' : 'Invalid card code'}
											</>
										)}
									</div>
								)}
							</div>
						</div>
					)}

					{/* 操作按钮 */}
					<div className={styles.actions}>
						<AntdButton onClick={handleModalClose}>{is_cn ? '取消' : 'Cancel'}</AntdButton>
						<AntdButton
							type='primary'
							loading={topUpProcessing}
							disabled={!isFormValid()}
							onClick={handleSubmit}
						>
							{topUpMethod === 'stripe'
								? is_cn
									? '立即支付'
									: 'Pay Now'
								: is_cn
								? '立即兑换'
								: 'Redeem Now'}
						</AntdButton>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default Balance
