import { useState, useEffect, useRef } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import * as echarts from 'echarts'
import { mockApi, PlanData, CreditsInfo, CreditPackage, CreditPackageType } from '../../mockData'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import styles from './index.less'

const Subscription = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [planData, setPlanData] = useState<PlanData | null>(null)
	const [upgrading, setUpgrading] = useState(false)
	const chartRef = useRef<HTMLDivElement>(null)
	const chartInstance = useRef<echarts.ECharts | null>(null)

	// Load current plan data
	useEffect(() => {
		const loadPlanData = async () => {
			try {
				setLoading(true)
				const data = await mockApi.getCurrentPlan()
				setPlanData(data)
			} catch (error) {
				console.error('Failed to load subscription data:', error)
				message.error(is_cn ? '加载订阅信息失败' : 'Failed to load subscription data')
			} finally {
				setLoading(false)
			}
		}

		loadPlanData()
	}, [is_cn])

	// Handle upgrade
	const handleUpgrade = async () => {
		if (!planData) return

		try {
			setUpgrading(true)
			// Simulate upgrade process
			await new Promise((resolve) => setTimeout(resolve, 2000))
			message.success(is_cn ? '即将跳转到升级页面' : 'Redirecting to upgrade page')
			// In real implementation, redirect to plans page
			// window.location.href = '/settings/plans'
		} catch (error) {
			message.error(is_cn ? '升级失败，请重试' : 'Upgrade failed, please try again')
		} finally {
			setUpgrading(false)
		}
	}

	// Handle view details
	const handleViewDetails = () => {
		message.info(is_cn ? '即将跳转到套餐详情' : 'Redirecting to plan details')
		// In real implementation, redirect to plans page
		// window.location.href = '/settings/plans'
	}

	// Handle view usage
	const handleViewUsage = () => {
		message.info(is_cn ? '即将跳转到使用统计' : 'Redirecting to usage statistics')
		// In real implementation, redirect to usage page
		// window.location.href = '/settings/usage'
	}

	// Format plan type display
	const getPlanDisplayName = (type: string) => {
		const planNames = {
			free: { 'zh-CN': '免费版', 'en-US': 'Free Plan' },
			pro: { 'zh-CN': 'Pro 版', 'en-US': 'Pro Plan' },
			enterprise: { 'zh-CN': '企业版', 'en-US': 'Enterprise Plan' },
			selfhosting: { 'zh-CN': '私有部署', 'en-US': 'Self-hosting Plan' }
		}
		return (
			planNames[type as keyof typeof planNames]?.[locale as 'zh-CN' | 'en-US'] ||
			planNames[type as keyof typeof planNames]?.['en-US'] ||
			type
		)
	}

	// Get plan status display
	const getPlanStatusDisplay = (status: string) => {
		const statusNames = {
			active: { 'zh-CN': '活跃', 'en-US': 'Active' },
			cancelled: { 'zh-CN': '已取消', 'en-US': 'Cancelled' },
			expired: { 'zh-CN': '已过期', 'en-US': 'Expired' }
		}
		return (
			statusNames[status as keyof typeof statusNames]?.[locale as 'zh-CN' | 'en-US'] ||
			statusNames[status as keyof typeof statusNames]?.['en-US'] ||
			status
		)
	}

	// Calculate usage percentage
	const getUsagePercentage = () => {
		if (!planData) return 0
		return Math.min((planData.credits.total_used / planData.credits.total_available) * 100, 100)
	}

	// Calculate monthly usage percentage
	const getMonthlyUsagePercentage = () => {
		if (!planData) return 0
		return Math.min((planData.credits.monthly.used / planData.credits.monthly.limit) * 100, 100)
	}

	// Calculate total extra packages balance and used
	const getTotalPackagesBalance = () => {
		if (!planData) return 0
		return planData.credits.packages.reduce((sum, pkg) => sum + pkg.balance, 0)
	}

	const getTotalPackagesUsed = () => {
		if (!planData) return 0
		return planData.credits.packages.reduce((sum, pkg) => sum + pkg.used, 0)
	}

	// Handle view extra credits details
	const handleViewExtraCredits = () => {
		message.info(is_cn ? '即将跳转到点数详情页面' : 'Redirecting to credits details page')
		// In real implementation, redirect to detailed credits page
		// window.location.href = '/settings/credits-details'
	}

	// Format credits number
	const formatCredits = (credits: number) => {
		if (credits >= 1000000) {
			return is_cn ? '无限制' : 'Unlimited'
		}
		return credits.toLocaleString()
	}

	// Initialize usage chart
	const initUsageChart = () => {
		if (!chartRef.current || !planData) return

		// Dispose existing chart
		if (chartInstance.current) {
			chartInstance.current.dispose()
		}

		// Create new chart instance
		const chart = echarts.init(chartRef.current)
		chartInstance.current = chart

		const usagePercentage = getUsagePercentage()
		const remainingPercentage = 100 - usagePercentage

		const option = {
			series: [
				{
					type: 'pie',
					radius: ['65%', '80%'], // 减小环的粗细，让环更细
					center: ['50%', '50%'],
					avoidLabelOverlap: false,
					silent: true, // 禁用交互
					label: {
						show: false
					},
					labelLine: {
						show: false
					},
					data: [
						{
							value: usagePercentage,
							name: is_cn ? '已使用' : 'Used',
							itemStyle: {
								color: '#3371FC' // 使用主题蓝色
							}
						},
						{
							value: remainingPercentage,
							name: is_cn ? '剩余' : 'Remaining',
							itemStyle: {
								color: 'rgba(51, 113, 252, 0.1)' // 浅蓝色背景
							}
						}
					]
				}
			]
		}

		chart.setOption(option)

		// Handle resize
		const handleResize = () => {
			chart.resize()
		}
		window.addEventListener('resize', handleResize)

		return () => {
			window.removeEventListener('resize', handleResize)
			chart.dispose()
		}
	}

	// Initialize chart when data is ready
	useEffect(() => {
		if (planData && chartRef.current) {
			const cleanup = initUsageChart()
			return cleanup
		}
	}, [planData, is_cn])

	if (loading) {
		return (
			<div className={styles.subscription}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '订阅管理' : 'Subscription'}</h2>
						<p>
							{is_cn
								? '管理您的订阅计划和使用情况'
								: 'Manage your subscription plan and usage'}
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

	if (!planData) {
		return (
			<div className={styles.subscription}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '订阅管理' : 'Subscription'}</h2>
						<p>
							{is_cn
								? '管理您的订阅计划和使用情况'
								: 'Manage your subscription plan and usage'}
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
		<div className={styles.subscription}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '订阅管理' : 'Subscription'}</h2>
					<p>{is_cn ? '管理您的订阅计划和使用情况' : 'Manage your subscription plan and usage'}</p>
				</div>
				<div className={styles.headerActions}>
					<Button
						type='primary'
						icon={<Icon name='material-upgrade' size={14} />}
						onClick={handleUpgrade}
						loading={upgrading}
					>
						{is_cn ? '升级套餐' : 'Upgrade Plan'}
					</Button>
				</div>
			</div>

			{/* Content Stack */}
			<div className={styles.contentStack}>
				{/* Plan and Status Cards Section */}
				<div className={styles.planSection}>
					{/* Current Plan Card */}
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
								<button className={styles.detailsLink} onClick={handleViewDetails}>
									<Icon name='material-info' size={14} />
									<span>{is_cn ? '查看详情' : 'View Details'}</span>
								</button>
							</div>
						</div>
						<div className={styles.cardContent}>
							<div className={styles.planDisplay}>
								<div className={styles.planNameWithStatus}>
									<div className={styles.planName}>
										{getPlanDisplayName(planData.type)}
									</div>
									<div className={styles.planStatus}>
										<span
											className={`${styles.statusText} ${
												styles[planData.status]
											}`}
										>
											{getPlanStatusDisplay(planData.status)}
										</span>
									</div>
								</div>
							</div>
							{planData.next_billing_date && (
								<div className={styles.billingInfo}>
									<Icon
										name='material-event'
										size={16}
										className={styles.billingIcon}
									/>
									<span>
										{is_cn ? '续费：' : 'Renewal: '}
										{new Date(planData.next_billing_date).toLocaleDateString()}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Total Usage Card */}
					<div className={styles.usageOverviewCard}>
						<div className={styles.cardHeader}>
							<div className={styles.cardTitle}>
								<Icon
									name='material-donut_large'
									size={16}
									className={styles.cardIcon}
								/>
								<h3>{is_cn ? '总体使用情况' : 'Overall Usage'}</h3>
							</div>
							<div className={styles.cardActions}>
								<button className={styles.detailsLink} onClick={handleViewUsage}>
									<Icon name='material-info' size={14} />
									<span>{is_cn ? '查看详情' : 'View Details'}</span>
								</button>
							</div>
						</div>
						<div className={styles.cardContent}>
							<div className={styles.usageOverviewDisplay}>
								<div className={styles.chartContainer}>
									<div ref={chartRef} className={styles.usageChart}></div>
									<div className={styles.chartCenter}>
										<div className={styles.usageNumber}>
											{getUsagePercentage().toFixed(1)}%
										</div>
										<div className={styles.usageLabel}>
											{is_cn ? '已使用' : 'Used'}
										</div>
									</div>
								</div>
								<div className={styles.usageStatsColumn}>
									<div className={styles.usageStatsRow}>
										<div className={styles.statItem}>
											<span className={styles.statNumber}>
												{formatCredits(planData.credits.total_used)}
											</span>
											<span className={styles.statLabel}>
												{is_cn ? '已使用' : 'Used'}
											</span>
										</div>
										<div className={styles.statDivider}>/</div>
										<div className={styles.statItem}>
											<span className={styles.statNumber}>
												{formatCredits(
													planData.credits.total_available
												)}
											</span>
											<span className={styles.statLabel}>
												{is_cn ? '总计' : 'Total'}
											</span>
										</div>
									</div>
									{getTotalPackagesBalance() > 0 && (
										<div className={styles.extraCreditsInfo}>
											<Icon
												name='material-stars'
												size={12}
												className={styles.extraIcon}
											/>
											<div className={styles.extraCreditsItem}>
												<span className={styles.extraNumber}>
													{formatCredits(getTotalPackagesBalance())}
												</span>
												<span className={styles.extraLabel}>
													{is_cn
														? '额外点数余额'
														: 'Extra Credits Balance'}
												</span>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Monthly Usage Card */}
				<div className={styles.monthlyUsageCard}>
					<div className={styles.cardHeader}>
						<div className={styles.cardTitle}>
							<Icon name='material-autorenew' size={16} className={styles.cardIcon} />
							<h3>{is_cn ? '月度使用情况' : 'Monthly Usage'}</h3>
						</div>
						<div className={styles.cardMeta}>
							{is_cn ? '重置于 ' : 'Resets on '}
							{new Date(planData.credits.monthly.reset_date).toLocaleDateString()}
						</div>
					</div>
					<div className={styles.cardContent}>
						<div className={styles.creditsDisplay}>
							<div className={styles.usedSection}>
								<span className={styles.creditsUsed}>
									{formatCredits(planData.credits.monthly.used)}
								</span>
								<span className={styles.usedLabel}>{is_cn ? '已使用' : 'Used'}</span>
							</div>
							<span className={styles.creditsDivider}>/</span>
							<div className={styles.limitSection}>
								<span className={styles.creditsLimit}>
									{formatCredits(planData.credits.monthly.limit)}
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
										width: `${getMonthlyUsagePercentage()}%`
									}}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Usage Warning */}
				{getUsagePercentage() > 80 && (
					<div className={styles.warningCard}>
						<div className={styles.warningContent}>
							<Icon name='material-warning' size={20} className={styles.warningIcon} />
							<div className={styles.warningText}>
								<div className={styles.warningTitle}>
									{is_cn ? '点数使用警告' : 'Credits Usage Warning'}
								</div>
								<div className={styles.warningMessage}>
									{is_cn
										? '您的点数已使用超过 80%，建议升级套餐或购买更多点数'
										: 'Your credits usage is over 80%. Consider upgrading your plan or purchasing additional credits.'}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default Subscription
