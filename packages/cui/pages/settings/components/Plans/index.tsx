import { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import { mockApi, PlanData, PlanType } from '../../mockData'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface PlanFeature {
	name: { 'zh-CN': string; 'en-US': string }
	included: boolean
	description?: { 'zh-CN': string; 'en-US': string }
}

interface Plan {
	id: string
	type: PlanType
	name: { 'zh-CN': string; 'en-US': string }
	description: { 'zh-CN': string; 'en-US': string }
	price: {
		monthly?: number
		yearly?: number
		yearlyDiscount?: number // 年付折扣百分比
		isRange?: boolean // 是否为价格范围
		rangeStart?: number // 价格范围起始
		rangeEnd?: number // 价格范围结束
	}
	credits: {
		monthly: number
		description: { 'zh-CN': string; 'en-US': string }
	}
	features: PlanFeature[]
	popular?: boolean
	buttonText?: { 'zh-CN': string; 'en-US': string }
	buttonType?: 'primary' | 'default'
}

const Plans = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [currentPlan, setCurrentPlan] = useState<PlanType>('free')
	const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
	const [upgrading, setUpgrading] = useState<string | null>(null)

	// 模拟套餐数据
	const plans: Plan[] = [
		{
			id: 'free',
			type: 'free',
			name: { 'zh-CN': '免费版', 'en-US': 'Free' },
			description: {
				'zh-CN': '适合个人用户和小型项目',
				'en-US': 'Perfect for personal use and small projects'
			},
			price: {},
			credits: {
				monthly: 1000,
				description: { 'zh-CN': '每月免费额度', 'en-US': 'Free monthly credits' }
			},
			features: [
				{
					name: { 'zh-CN': '基础 API 访问', 'en-US': 'Basic API Access' },
					included: true
				},
				{
					name: { 'zh-CN': '社区支持', 'en-US': 'Community Support' },
					included: true
				},
				{
					name: { 'zh-CN': '标准响应速度', 'en-US': 'Standard Response Time' },
					included: true
				},
				{
					name: { 'zh-CN': '高级功能', 'en-US': 'Advanced Features' },
					included: false
				},
				{
					name: { 'zh-CN': '优先支持', 'en-US': 'Priority Support' },
					included: false
				}
			],
			buttonText: { 'zh-CN': '当前套餐', 'en-US': 'Current Plan' },
			buttonType: 'default'
		},
		{
			id: 'pro',
			type: 'pro',
			name: { 'zh-CN': 'Pro 版', 'en-US': 'Pro' },
			description: {
				'zh-CN': '适合专业用户和团队协作',
				'en-US': 'Perfect for professionals and team collaboration'
			},
			price: {
				monthly: is_cn ? 199 : 29,
				yearly: is_cn ? 1990 : 290,
				yearlyDiscount: 17 // 年付优惠17%
			},
			credits: {
				monthly: 10000,
				description: { 'zh-CN': '每月高额度', 'en-US': 'High monthly credits' }
			},
			features: [
				{
					name: { 'zh-CN': '完整 API 访问', 'en-US': 'Full API Access' },
					included: true
				},
				{
					name: { 'zh-CN': '优先支持', 'en-US': 'Priority Support' },
					included: true
				},
				{
					name: { 'zh-CN': '高速响应', 'en-US': 'High-Speed Response' },
					included: true
				},
				{
					name: { 'zh-CN': '高级功能', 'en-US': 'Advanced Features' },
					included: true
				},
				{
					name: { 'zh-CN': '团队协作', 'en-US': 'Team Collaboration' },
					included: true
				}
			],
			popular: true,
			buttonText: { 'zh-CN': '升级到 Pro', 'en-US': 'Upgrade to Pro' },
			buttonType: 'primary'
		},
		{
			id: 'enterprise',
			type: 'enterprise',
			name: { 'zh-CN': '企业版', 'en-US': 'Enterprise' },
			description: {
				'zh-CN': '适合大型团队和企业客户',
				'en-US': 'Perfect for large teams and enterprise customers'
			},
			price: {},
			credits: {
				monthly: 200000,
				description: { 'zh-CN': '企业级额度', 'en-US': 'Enterprise credits' }
			},
			features: [
				{
					name: { 'zh-CN': '完整 API 访问', 'en-US': 'Full API Access' },
					included: true
				},
				{
					name: { 'zh-CN': '专属技术支持', 'en-US': 'Dedicated Support' },
					included: true
				},
				{
					name: { 'zh-CN': '企业级 SLA', 'en-US': 'Enterprise SLA' },
					included: true
				},
				{
					name: { 'zh-CN': '定制化功能', 'en-US': 'Custom Features' },
					included: true
				},
				{
					name: { 'zh-CN': '多团队管理', 'en-US': 'Multi-team Management' },
					included: true
				}
			],
			buttonText: { 'zh-CN': '联系销售', 'en-US': 'Contact Sales' },
			buttonType: 'default'
		},
		{
			id: 'selfhosting',
			type: 'selfhosting',
			name: { 'zh-CN': '私有部署', 'en-US': 'Self-hosting' },
			description: { 'zh-CN': '完全私有化的本地部署方案', 'en-US': 'Fully private on-premises deployment' },
			price: {
				monthly: is_cn ? 6999 : 999, // 起始价格
				yearly: is_cn ? 69990 : 9990,
				yearlyDiscount: 17,
				isRange: true, // 标记为价格范围
				rangeStart: is_cn ? 6999 : 999,
				rangeEnd: is_cn ? 29999 : 4999
			},
			credits: {
				monthly: 999999,
				description: { 'zh-CN': '无限制使用', 'en-US': 'Unlimited usage' }
			},
			features: [
				{
					name: { 'zh-CN': '完全私有化', 'en-US': 'Fully Private' },
					included: true
				},
				{
					name: { 'zh-CN': '无限制使用', 'en-US': 'Unlimited Usage' },
					included: true
				},
				{
					name: { 'zh-CN': '本地部署', 'en-US': 'On-premises Deployment' },
					included: true
				},
				{
					name: { 'zh-CN': '数据完全控制', 'en-US': 'Full Data Control' },
					included: true
				},
				{
					name: { 'zh-CN': '部署证书许可', 'en-US': 'Deployment License' },
					included: true
				}
			],
			buttonText: { 'zh-CN': '购买许可证', 'en-US': 'Buy License' },
			buttonType: 'default'
		}
	]

	useEffect(() => {
		const loadCurrentPlan = async () => {
			try {
				setLoading(true)
				// 模拟获取用户当前套餐
				const planData = await mockApi.getCurrentPlan()
				setCurrentPlan(planData.type)
			} catch (error) {
				console.error('Failed to load current plan:', error)
				message.error(is_cn ? '加载套餐信息失败' : 'Failed to load plan information')
			} finally {
				setLoading(false)
			}
		}

		loadCurrentPlan()
	}, [is_cn])

	const handleUpgrade = async (planId: string) => {
		if (planId === 'enterprise') {
			// 企业版联系销售
			message.info(
				is_cn
					? '请联系我们的销售团队获取企业版报价'
					: 'Please contact our sales team for enterprise pricing'
			)
			return
		}

		if (planId === 'selfhosting') {
			// 私有部署跳转到购买页面或文档
			message.info(is_cn ? '即将跳转到许可证购买页面' : 'Redirecting to license purchase page')
			// 这里可以添加实际的跳转逻辑
			// window.open('/docs/deployment', '_blank')
			return
		}

		try {
			setUpgrading(planId)
			// 模拟升级过程
			await new Promise((resolve) => setTimeout(resolve, 2000))
			setCurrentPlan(planId as PlanType)
			message.success(is_cn ? '套餐升级成功！' : 'Plan upgraded successfully!')
		} catch (error) {
			message.error(is_cn ? '升级失败，请重试' : 'Upgrade failed, please try again')
		} finally {
			setUpgrading(null)
		}
	}

	const formatPrice = (price: number) => {
		if (is_cn) {
			return `¥${price.toLocaleString('zh-CN')}`
		} else {
			return `$${price}`
		}
	}

	const formatCredits = (credits: number) => {
		if (credits >= 999999) {
			return is_cn ? '无限制' : 'Unlimited'
		}
		if (credits === 200000) {
			return '200,000+'
		}
		return credits.toLocaleString()
	}

	const renderPlanCard = (plan: Plan) => {
		const isCurrentPlan = plan.type === currentPlan
		const isUpgrading = upgrading === plan.id

		return (
			<div
				key={plan.id}
				className={`${styles.planCard} ${isCurrentPlan ? styles.currentPlan : ''} ${
					plan.popular ? styles.popularPlan : ''
				}`}
			>
				{plan.popular && (
					<div className={styles.popularBadge}>
						<Icon name='material-star' size={12} />
						<span>{is_cn ? '推荐' : 'Popular'}</span>
					</div>
				)}

				<div className={styles.planHeader}>
					<h3 className={styles.planName}>
						{plan.name[locale as keyof typeof plan.name] || plan.name['en-US']}
					</h3>
					<p className={styles.planDescription}>
						{plan.description[locale as keyof typeof plan.description] ||
							plan.description['en-US']}
					</p>
				</div>

				<div className={styles.planPricing}>
					{plan.price.monthly ? (
						<>
							<div className={styles.priceDisplay}>
								<div className={styles.currentPrice}>
									{plan.price.isRange ? (
										<>
											<span className={styles.priceAmount}>
												{formatPrice(plan.price.rangeStart!)} -{' '}
												{formatPrice(plan.price.rangeEnd!)}
											</span>
											<span className={styles.pricePeriod}>
												{is_cn ? '/月' : '/month'}
											</span>
										</>
									) : (
										<>
											<span className={styles.priceAmount}>
												{formatPrice(
													billingCycle === 'monthly'
														? plan.price.monthly
														: Math.floor(
																plan.price.yearly! / 12
														  )
												)}
											</span>
											<span className={styles.pricePeriod}>
												{is_cn ? '/月' : '/month'}
											</span>
										</>
									)}
								</div>
								{!plan.price.isRange &&
									billingCycle === 'yearly' &&
									plan.price.yearlyDiscount && (
										<div className={styles.originalPrice}>
											<span className={styles.strikethrough}>
												{formatPrice(plan.price.monthly)}
											</span>
											<span className={styles.discount}>
												{is_cn
													? `省${plan.price.yearlyDiscount}%`
													: `Save ${plan.price.yearlyDiscount}%`}
											</span>
										</div>
									)}
								{plan.price.isRange && (
									<div className={styles.rangeInfo}>
										{is_cn
											? '根据部署规模定价'
											: 'Pricing based on deployment scale'}
									</div>
								)}
							</div>
							{!plan.price.isRange && billingCycle === 'yearly' && (
								<div className={styles.yearlyInfo}>
									{is_cn
										? `年付 ${formatPrice(plan.price.yearly!)}`
										: `${formatPrice(plan.price.yearly!)} billed yearly`}
								</div>
							)}
						</>
					) : (
						<div className={styles.freePrice}>
							{plan.type === 'free'
								? is_cn
									? '免费'
									: 'Free'
								: is_cn
								? '联系销售'
								: 'Contact Sales'}
						</div>
					)}
				</div>

				<div className={styles.planCredits}>
					<div className={styles.creditsAmount}>{formatCredits(plan.credits.monthly)}</div>
					<div className={styles.creditsDescription}>
						{plan.credits.description[locale as keyof typeof plan.credits.description] ||
							plan.credits.description['en-US']}
					</div>
				</div>

				<div className={styles.planFeatures}>
					{plan.features.map((feature, index) => (
						<div key={index} className={styles.featureItem}>
							<Icon
								name={feature.included ? 'material-check' : 'material-close'}
								size={16}
								className={`${styles.featureIcon} ${
									feature.included ? styles.included : styles.excluded
								}`}
							/>
							<span className={styles.featureName}>
								{feature.name[locale as keyof typeof feature.name] ||
									feature.name['en-US']}
							</span>
						</div>
					))}
				</div>

				<div className={styles.planAction}>
					<Button
						type={isCurrentPlan ? 'default' : plan.buttonType || 'primary'}
						size='large'
						onClick={() => !isCurrentPlan && handleUpgrade(plan.id)}
						loading={isUpgrading}
						disabled={isCurrentPlan}
						className={styles.planButton}
					>
						{isCurrentPlan
							? is_cn
								? '当前套餐'
								: 'Current Plan'
							: plan.buttonText?.[locale as keyof typeof plan.buttonText] ||
							  plan.buttonText?.['en-US'] ||
							  (is_cn ? '选择套餐' : 'Choose Plan')}
					</Button>
				</div>

				{isCurrentPlan && (
					<div className={styles.currentBadge}>
						<Icon name='material-check_circle' size={14} />
						<span>{is_cn ? '当前使用' : 'Current'}</span>
					</div>
				)}
			</div>
		)
	}

	if (loading) {
		return (
			<div className={styles.plans}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '套餐与价格' : 'Plans & Pricing'}</h2>
						<p>{is_cn ? '选择适合您需求的套餐计划' : 'Choose the plan that fits your needs'}</p>
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

	return (
		<div className={styles.plans}>
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '套餐与价格' : 'Plans & Pricing'}</h2>
					<p>{is_cn ? '选择适合您需求的套餐计划' : 'Choose the plan that fits your needs'}</p>
				</div>
				<div className={styles.headerActions}>
					<div className={styles.billingToggle}>
						<button
							className={`${styles.toggleButton} ${
								billingCycle === 'monthly' ? styles.active : ''
							}`}
							onClick={() => setBillingCycle('monthly')}
						>
							{is_cn ? '按月' : 'Monthly'}
						</button>
						<button
							className={`${styles.toggleButton} ${
								billingCycle === 'yearly' ? styles.active : ''
							}`}
							onClick={() => setBillingCycle('yearly')}
						>
							{is_cn ? '按年' : 'Yearly'}
							<span className={styles.discountBadge}>{is_cn ? '省17%' : 'Save 17%'}</span>
						</button>
					</div>
				</div>
			</div>

			<div className={styles.panel}>
				<div className={styles.panelContent}>
					<div className={styles.plansGrid}>{plans.map((plan) => renderPlanCard(plan))}</div>
				</div>
			</div>
		</div>
	)
}

export default Plans
