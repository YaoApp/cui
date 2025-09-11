import { useState, useEffect } from 'react'
import { Modal, Form, Input, Button as AntdButton, message, Switch, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { Button } from '@/components/ui'
import styles from './index.less'

interface InviteData {
	invite_code: string
	total_invited: number
	total_earnings: {
		points: number
		commission: number
	}
	invitee_benefits: {
		points_gift: number
		one_time: boolean
	}
	is_influencer: boolean
	influencer_application: {
		status: 'none' | 'pending' | 'approved' | 'rejected'
		submitted_at?: string
	}
}

interface InfluencerApplication {
	name: string
	email: string
	social_platform: string
	account_url: string
	content_type: string
	reason: string
}

const Invite = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [form] = Form.useForm()

	// 状态管理
	const [loading, setLoading] = useState(true)
	const [inviteData, setInviteData] = useState<InviteData | null>(null)
	const [applicationModalVisible, setApplicationModalVisible] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [isInfluencerMode, setIsInfluencerMode] = useState(false) // 临时切换开关

	// 计算当前模式
	const currentMode = isInfluencerMode || (inviteData?.is_influencer ?? false)

	// 模拟数据加载
	useEffect(() => {
		const loadInviteData = async () => {
			try {
				setLoading(true)
				// 模拟API调用
				await new Promise((resolve) => setTimeout(resolve, 1000))

				const mockData: InviteData = {
					invite_code: 'WHGI4I408EEDRADA',
					total_invited: 7,
					total_earnings: {
						points: isInfluencerMode ? 3500 : 2000,
						commission: isInfluencerMode ? 280 : 0
					},
					invitee_benefits: {
						points_gift: isInfluencerMode ? 6000 : 4000,
						one_time: true
					},
					is_influencer: false,
					influencer_application: {
						status: 'none'
					}
				}

				setInviteData(mockData)
			} catch (error) {
				console.error('Failed to load invite data:', error)
				message.error(is_cn ? '加载邀请信息失败' : 'Failed to load invite data')
			} finally {
				setLoading(false)
			}
		}

		loadInviteData()
	}, [is_cn, isInfluencerMode])

	// 复制邀请码
	const handleCopyInviteCode = async () => {
		if (!inviteData) return

		try {
			await navigator.clipboard.writeText(inviteData.invite_code)
			message.success(is_cn ? '邀请码已复制' : 'Invite code copied')
		} catch (error) {
			message.error(is_cn ? '复制失败' : 'Failed to copy')
		}
	}

	// 复制邀请链接
	const handleCopyInviteLink = async () => {
		if (!inviteData) return

		const inviteUrl = `${window.location.origin}?inv=${inviteData.invite_code}`
		try {
			await navigator.clipboard.writeText(inviteUrl)
			message.success(is_cn ? '邀请链接已复制' : 'Invite link copied')
		} catch (error) {
			message.error(is_cn ? '复制失败' : 'Failed to copy')
		}
	}

	// 处理申请表单提交
	const handleApplicationSubmit = async () => {
		try {
			const values = await form.validateFields()
			setSubmitting(true)

			// 模拟提交
			await new Promise((resolve) => setTimeout(resolve, 2000))

			message.success(
				is_cn
					? '自媒体认证申请已提交，我们将在3-5个工作日内审核'
					: 'Influencer certification application submitted, we will review within 3-5 business days'
			)

			// 更新状态
			if (inviteData) {
				setInviteData({
					...inviteData,
					influencer_application: {
						status: 'pending',
						submitted_at: new Date().toISOString()
					}
				})
			}

			setApplicationModalVisible(false)
			form.resetFields()
		} catch (error) {
			console.error('Application failed:', error)
		} finally {
			setSubmitting(false)
		}
	}

	// 处理模态框关闭
	const handleModalClose = () => {
		setApplicationModalVisible(false)
		form.resetFields()
	}

	// 获取申请状态显示
	const getApplicationStatusDisplay = (status: InviteData['influencer_application']['status']) => {
		const statusMap = {
			none: { label: { 'zh-CN': '未申请', 'en-US': 'Not Applied' }, className: '' },
			pending: { label: { 'zh-CN': '审核中', 'en-US': 'Pending' }, className: styles.statusPending },
			approved: { label: { 'zh-CN': '已通过', 'en-US': 'Approved' }, className: styles.statusApproved },
			rejected: { label: { 'zh-CN': '已拒绝', 'en-US': 'Rejected' }, className: styles.statusRejected }
		}

		const config = statusMap[status]
		const label = config.label[locale as 'zh-CN' | 'en-US'] || config.label['en-US']

		return { label, className: config.className }
	}

	// 格式化数字显示
	const formatNumber = (num: number) => {
		return num.toLocaleString()
	}

	if (loading) {
		return (
			<div className={styles.invite}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '邀请码' : 'Invite Code'}</h2>
						<p>
							{is_cn
								? '邀请用户注册，获得点数奖励和佣金收益'
								: 'Invite users to register and earn credits rewards and commission'}
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

	if (!inviteData) {
		return (
			<div className={styles.invite}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '邀请码' : 'Invite Code'}</h2>
						<p>
							{is_cn
								? '邀请用户注册，获得点数奖励和佣金收益'
								: 'Invite users to register and earn credits rewards and commission'}
						</p>
					</div>
				</div>
				<div className={styles.errorState}>
					<Icon name='material-error' size={32} className={styles.errorIcon} />
					<span>{is_cn ? '加载失败' : 'Failed to load'}</span>
				</div>
			</div>
		)
	}

	const applicationStatus = getApplicationStatusDisplay(inviteData.influencer_application.status)

	return (
		<div className={styles.invite}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '邀请码' : 'Invite Code'}</h2>
					<p>
						{is_cn
							? '邀请用户注册，获得点数奖励和佣金收益'
							: 'Invite users to register and earn credits rewards and commission'}
					</p>
				</div>
				<div className={styles.headerActions}>
					{/* 临时切换开关 - 仅用于演示 */}
					<div className={styles.tempToggle}>
						<span className={styles.toggleLabel}>
							{is_cn ? '模拟 Influencer' : 'Simulate Influencer'}
						</span>
						<Switch size='small' checked={isInfluencerMode} onChange={setIsInfluencerMode} />
					</div>
				</div>
			</div>

			{/* Content Stack */}
			<div className={styles.contentStack}>
				{/* S1: 邀请码呈现 */}
				<div className={`${styles.inviteCodeCard} ${currentMode ? styles.influencerMode : ''}`}>
					<div className={styles.cardHeader}>
						<div className={styles.cardTitle}>
							<Icon name='material-person_add' size={16} className={styles.cardIcon} />
							<h3>{is_cn ? '邀请码' : 'Invite Code'}</h3>
						</div>
						<div className={styles.cardActions}>
							{!currentMode && inviteData.influencer_application.status === 'none' && (
								<Tooltip
									title={
										is_cn
											? '申请自媒体认证，获得专属推广资源和优先客服支持'
											: 'Apply for Influencer certification to get exclusive promotional resources and priority support'
									}
									placement='bottomRight'
								>
									<button
										className={styles.detailsLink}
										onClick={() => setApplicationModalVisible(true)}
									>
										<Icon name='material-star' size={14} />
										<span>
											{is_cn ? '申请自媒体认证' : 'Apply for Influencer'}
										</span>
									</button>
								</Tooltip>
							)}
							{currentMode && (
								<div className={styles.influencerBadge}>
									<Icon name='material-verified' size={14} />
									<span>{is_cn ? '自媒体认证' : 'Influencer Verified'}</span>
								</div>
							)}
							{!currentMode && inviteData.influencer_application.status !== 'none' && (
								<div
									className={`${styles.applicationStatus} ${applicationStatus.className}`}
								>
									{applicationStatus.label}
								</div>
							)}
						</div>
					</div>
					<div className={styles.cardContent}>
						<div className={styles.inviteCodeDisplay}>
							<div className={styles.codeSection}>
								<div className={styles.codeValue}>{inviteData.invite_code}</div>
								<div className={styles.codeUrl}>
									{window.location.origin}?inv={inviteData.invite_code}
								</div>
							</div>
							<div className={styles.codeActions}>
								<Button
									type='default'
									size='medium'
									icon={<Icon name='material-content_copy' size={14} />}
									onClick={handleCopyInviteCode}
								>
									{is_cn ? '复制' : 'Copy'}
								</Button>
								<Button
									type='default'
									size='medium'
									icon={<Icon name='material-share' size={14} />}
									onClick={handleCopyInviteLink}
								>
									{is_cn ? '分享' : 'Share'}
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* S2: 邀请收益 */}
				<div className={styles.earningsSection}>
					<div className={styles.sectionTitle}>
						<Icon name='material-trending_up' size={16} className={styles.sectionIcon} />
						<h3>{is_cn ? '邀请收益' : 'Invite Earnings'}</h3>
						<div className={styles.sectionMeta}>{is_cn ? '您的收益' : 'Your Earnings'}</div>
					</div>

					<div className={styles.earningsGrid}>
						{/* 获得点数 */}
						<div
							className={`${styles.earningsCard} ${
								currentMode ? styles.influencerMode : ''
							}`}
						>
							<div className={styles.earningsHeader}>
								<Icon name='material-stars' size={16} className={styles.earningsIcon} />
								<span className={styles.earningsType}>
									{is_cn ? '获得点数' : 'Earned Credits'}
								</span>
							</div>
							<div className={styles.earningsContent}>
								<div className={styles.earningsAmount}>
									{formatNumber(inviteData.total_earnings.points)}
								</div>
								<div className={styles.earningsLabel}>
									{is_cn ? '总计邀请奖励' : 'Total Invite Rewards'}
								</div>
								<div className={styles.earningsDetail}>
									{is_cn
										? currentMode
											? '每位粉丝成功注册，您获得'
											: '每位用户成功注册，您获得'
										: currentMode
										? 'You earn per fan registration'
										: 'You earn per user registration'}
									<span className={styles.rewardAmount}>
										{currentMode ? '3000' : '2000'}{' '}
										{is_cn ? '点数奖励' : 'Credits'}
									</span>
								</div>
							</div>
						</div>

						{/* 获取佣金 */}
						<div
							className={`${styles.earningsCard} ${styles.commissionCard} ${
								currentMode ? styles.influencerMode : ''
							}`}
						>
							<div className={styles.earningsHeader}>
								<Icon
									name='material-payments'
									size={16}
									className={styles.earningsIcon}
								/>
								<span className={styles.earningsType}>
									{is_cn ? '获取佣金' : 'Commission'}
								</span>
							</div>
							<div className={styles.earningsContent}>
								<div className={styles.earningsAmount}>
									${inviteData.total_earnings.commission}
								</div>
								<div className={styles.earningsLabel}>
									{is_cn ? '您的总佣金收入' : 'Your Total Commission'}
								</div>
								<div className={styles.earningsDetail}>
									{is_cn
										? currentMode
											? '粉丝通过您的邀请购买，其前 3 个月的所有付费消费，您都能获得'
											: '用户通过您的邀请购买，其前 3 个月的所有付费消费，您都能获得'
										: currentMode
										? 'When fans purchase through your invite, you receive'
										: 'When users purchase through your invite, you receive'}
									<span className={styles.commissionRate}>
										{' '}
										{currentMode ? '30%' : '20%'}{' '}
									</span>
									{is_cn
										? '的佣金返还'
										: 'commission on their purchases in first 3 months'}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* S3: 被邀请人收益 */}
				<div className={styles.inviteeSection}>
					<div className={styles.sectionTitle}>
						<Icon name='material-card_giftcard' size={16} className={styles.sectionIcon} />
						<h3>
							{is_cn
								? currentMode
									? '粉丝福利'
									: '好友福利'
								: currentMode
								? 'Fan Benefits'
								: 'Friend Benefits'}
						</h3>
						<div className={styles.sectionMeta}>
							{is_cn
								? currentMode
									? '您的粉丝福利'
									: '好友的收益'
								: currentMode
								? 'Your Fan Benefits'
								: "Friend's Benefits"}
						</div>
					</div>

					<div className={styles.inviteeSingleCard}>
						{/* 即刻体验 */}
						<div
							className={`${styles.inviteeCard} ${
								currentMode ? styles.influencerMode : ''
							}`}
						>
							<div className={styles.inviteeHeader}>
								<Icon
									name='material-auto_awesome'
									size={16}
									className={styles.inviteeIcon}
								/>
								<span className={styles.inviteeType}>
									{is_cn ? '即刻体验' : 'Instant Experience'}
								</span>
							</div>
							<div className={styles.inviteeContent}>
								<div className={styles.inviteeAmount}>
									{formatNumber(inviteData.invitee_benefits.points_gift)}
								</div>
								<div className={styles.inviteeLabel}>
									{is_cn ? '新人专享福利' : 'New User Benefits'}
								</div>
								<div className={styles.inviteeDetail}>
									{is_cn
										? currentMode
											? '粉丝注册即获 1000 点数，通过您的邀请码注册额外获得'
											: '用户注册即获 1000 点数，通过您的邀请码注册额外获得'
										: currentMode
										? 'Fans get 1000 credits on registration, plus'
										: 'Users get 1000 credits on registration, plus'}
									<span className={styles.bonusAmount}>
										{' '}
										{currentMode ? '5000' : '3000'} {is_cn ? '点数' : 'Credits'}{' '}
									</span>
									{is_cn ? '奖励' : 'bonus through your invite code'}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Influencer 申请模态框 */}
			<Modal
				title={is_cn ? '申请自媒体认证' : 'Apply for Influencer'}
				open={applicationModalVisible}
				onCancel={handleModalClose}
				footer={null}
				width={520}
				className={styles.applicationModal}
			>
				<div className={styles.modalContent}>
					<div className={styles.modalDescription}>
						{is_cn
							? '通过自媒体认证后，您将获得更高的佣金比例和专属推广资源。'
							: 'After Influencer certification, you will receive higher commission rates and exclusive promotional resources.'}
					</div>

					<Form form={form} layout='vertical' className={styles.applicationForm}>
						<Form.Item
							name='name'
							label={is_cn ? '姓名' : 'Name'}
							rules={[
								{
									required: true,
									message: is_cn ? '请输入姓名' : 'Please enter your name'
								}
							]}
						>
							<Input placeholder={is_cn ? '请输入您的姓名' : 'Enter your name'} />
						</Form.Item>

						<Form.Item
							name='email'
							label={is_cn ? '邮箱' : 'Email'}
							rules={[
								{
									required: true,
									message: is_cn ? '请输入邮箱' : 'Please enter your email'
								},
								{
									type: 'email',
									message: is_cn
										? '请输入有效的邮箱地址'
										: 'Please enter a valid email'
								}
							]}
						>
							<Input placeholder={is_cn ? '请输入您的邮箱' : 'Enter your email'} />
						</Form.Item>

						<Form.Item
							name='social_platform'
							label={is_cn ? '主要社交平台' : 'Main Social Platform'}
							rules={[
								{
									required: true,
									message: is_cn
										? '请输入社交平台'
										: 'Please enter your social platform'
								}
							]}
						>
							<Input
								placeholder={
									is_cn
										? '如：微博、抖音、YouTube等'
										: 'e.g. Twitter, TikTok, YouTube, etc.'
								}
							/>
						</Form.Item>

						<Form.Item
							name='account_url'
							label={is_cn ? '账号地址' : 'Account URL'}
							rules={[
								{
									required: true,
									message: is_cn ? '请输入账号地址' : 'Please enter account URL'
								},
								{
									type: 'url',
									message: is_cn ? '请输入有效的网址' : 'Please enter a valid URL'
								}
							]}
						>
							<Input
								placeholder={
									is_cn
										? '请输入您的社交账号链接'
										: 'Enter your social media profile URL'
								}
							/>
						</Form.Item>

						<Form.Item
							name='content_type'
							label={is_cn ? '内容类型' : 'Content Type'}
							rules={[
								{
									required: true,
									message: is_cn ? '请输入内容类型' : 'Please enter content type'
								}
							]}
						>
							<Input
								placeholder={
									is_cn
										? '如：科技、教育、生活等'
										: 'e.g. Tech, Education, Lifestyle, etc.'
								}
							/>
						</Form.Item>

						<Form.Item
							name='reason'
							label={is_cn ? '申请理由' : 'Application Reason'}
							rules={[
								{
									required: true,
									message: is_cn ? '请输入申请理由' : 'Please enter your reason'
								}
							]}
						>
							<Input.TextArea
								rows={3}
								placeholder={
									is_cn
										? '请简要说明为什么要申请自媒体认证'
										: 'Please briefly explain why you want to apply for Influencer certification'
								}
							/>
						</Form.Item>
					</Form>

					<div className={styles.modalActions}>
						<AntdButton onClick={handleModalClose}>{is_cn ? '取消' : 'Cancel'}</AntdButton>
						<AntdButton type='primary' loading={submitting} onClick={handleApplicationSubmit}>
							{is_cn ? '提交申请' : 'Submit Application'}
						</AntdButton>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default Invite
