import { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import { mockApi, PlanData, CreditsInfo } from '../../mockData'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import styles from './index.less'

const Subscription = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [planData, setPlanData] = useState<PlanData | null>(null)
	const [upgrading, setUpgrading] = useState(false)

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

	// Calculate purchased credits usage percentage
	const getPurchasedUsagePercentage = () => {
		if (!planData || planData.credits.purchased.balance === 0) return 0
		const totalPurchased = planData.credits.purchased.used + planData.credits.purchased.balance
		return Math.min((planData.credits.purchased.used / totalPurchased) * 100, 100)
	}

	// Format credits number
	const formatCredits = (credits: number) => {
		if (credits >= 1000000) {
			return is_cn ? '无限制' : 'Unlimited'
		}
		return credits.toLocaleString()
	}

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
				{/* Remove header actions - upgrade button moved to plan card */}
			</div>

			{/* Content Panel */}
			<div className={styles.panel}>
				<div className={styles.panelContent}>
					{/* Current Plan Section */}
					<div className={styles.section}>
						<div className={styles.sectionHeader}>
							<h3>{is_cn ? '当前套餐' : 'Current Plan'}</h3>
						</div>
						<div className={styles.planCard}>
							<div className={styles.planInfo}>
								<div className={styles.planMain}>
									<div className={styles.planName}>
										{getPlanDisplayName(planData.type)}
									</div>
									<div className={styles.planStatus}>
										<Icon
											name={
												planData.status === 'active'
													? 'material-check_circle'
													: 'material-error'
											}
											size={14}
											className={`${styles.statusIcon} ${
												styles[planData.status]
											}`}
										/>
										<span
											className={`${styles.statusText} ${
												styles[planData.status]
											}`}
										>
											{getPlanStatusDisplay(planData.status)}
										</span>
									</div>
								</div>
								<div className={styles.planActions}>
									<Button
										type='default'
										icon={<Icon name='material-info' size={14} />}
										onClick={handleViewDetails}
									>
										{is_cn ? '查看详情' : 'View Details'}
									</Button>
									<Button
										type='default'
										icon={<Icon name='material-upgrade' size={14} />}
										onClick={handleUpgrade}
										loading={upgrading}
									>
										{is_cn ? '升级套餐' : 'Upgrade Plan'}
									</Button>
								</div>
							</div>
							{planData.next_billing_date && (
								<div className={styles.planPeriod}>
									<div className={styles.periodInfo}>
										<Icon
											name='material-event'
											size={16}
											className={styles.periodIcon}
										/>
										<span>
											{is_cn ? '续费：' : 'Renewal: '}
											{new Date(
												planData.next_billing_date
											).toLocaleDateString()}
										</span>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Credits Usage Section */}
					<div className={styles.section}>
						<div className={styles.sectionHeader}>
							<h3>{is_cn ? '点数使用情况' : 'Credits Usage'}</h3>
							<Button
								type='default'
								icon={<Icon name='material-analytics' size={14} />}
								onClick={handleViewUsage}
							>
								{is_cn ? '详细统计' : 'View Details'}
							</Button>
						</div>

						{/* Total Usage Overview */}
						<div className={styles.usageCard}>
							<div className={styles.usageHeader}>
								<div className={styles.usageStats}>
									<div className={styles.usageCurrent}>
										<span className={styles.usageNumber}>
											{formatCredits(planData.credits.total_used)}
										</span>
										<span className={styles.usageUnit}>
											{is_cn ? '已使用' : 'Used'}
										</span>
									</div>
									<div className={styles.usageDivider}>/</div>
									<div className={styles.usageLimit}>
										<span className={styles.usageNumber}>
											{formatCredits(planData.credits.total_available)}
										</span>
										<span className={styles.usageUnit}>
											{is_cn ? '总点数' : 'Total'}
										</span>
									</div>
								</div>
								<div className={styles.usagePercentage}>
									{getUsagePercentage().toFixed(1)}%
								</div>
							</div>
							<div className={styles.progressContainer}>
								<div className={styles.progressBar}>
									<div
										className={styles.progressFill}
										style={{ width: `${getUsagePercentage()}%` }}
									/>
								</div>
							</div>
							{getUsagePercentage() > 80 && (
								<div className={styles.usageWarning}>
									<Icon
										name='material-warning'
										size={16}
										className={styles.warningIcon}
									/>
									<span>
										{is_cn
											? '您的点数已使用超过 80%，建议升级套餐或购买更多点数'
											: 'Your credits usage is over 80%. Consider upgrading your plan or purchasing additional credits.'}
									</span>
								</div>
							)}
						</div>

						{/* Credits Breakdown - Unified Design */}
						<div className={styles.creditsBreakdown}>
							<div className={styles.breakdownContainer}>
								{/* Monthly Credits Section */}
								<div className={styles.breakdownSection}>
									<div className={styles.sectionHeader}>
										<div className={styles.sectionTitle}>
											<Icon
												name='material-autorenew'
												size={16}
												className={styles.sectionIcon}
											/>
											<span>{is_cn ? '月度点数' : 'Monthly Credits'}</span>
										</div>
										<div className={styles.sectionMeta}>
											{is_cn ? '重置于 ' : 'Resets on '}
											{new Date(
												planData.credits.monthly.reset_date
											).toLocaleDateString()}
										</div>
									</div>
									<div className={styles.sectionContent}>
										<div className={styles.creditsDisplay}>
											<span className={styles.creditsUsed}>
												{formatCredits(planData.credits.monthly.used)}
											</span>
											<span className={styles.creditsDivider}>/</span>
											<span className={styles.creditsLimit}>
												{formatCredits(planData.credits.monthly.limit)}
											</span>
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

								{/* Separator */}
								{planData.credits.purchased.balance > 0 && (
									<div className={styles.breakdownSeparator}></div>
								)}

								{/* Purchased Credits Section */}
								{planData.credits.purchased.balance > 0 && (
									<div className={styles.breakdownSection}>
										<div className={styles.sectionHeader}>
											<div className={styles.sectionTitle}>
												<Icon
													name='material-account_balance_wallet'
													size={16}
													className={styles.sectionIcon}
												/>
												<span>
													{is_cn ? '购买点数' : 'Purchased Credits'}
												</span>
											</div>
											<div className={styles.sectionMeta}>
												{is_cn ? '有效期至 ' : 'Valid until '}
												{new Date(
													planData.credits.purchased.expiry_date!
												).toLocaleDateString()}
											</div>
										</div>
										<div className={styles.sectionContent}>
											<div className={styles.creditsDisplay}>
												<span className={styles.creditsBalance}>
													{formatCredits(
														planData.credits.purchased.balance
													)}
												</span>
												<span className={styles.creditsLabel}>
													{is_cn ? '余额' : 'Balance'}
												</span>
											</div>
											{planData.credits.purchased.used > 0 && (
												<div className={styles.usedInfo}>
													{is_cn ? '已使用 ' : 'Used: '}
													{formatCredits(
														planData.credits.purchased.used
													)}
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Subscription
