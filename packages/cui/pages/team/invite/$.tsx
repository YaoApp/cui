import React, { useState, useEffect } from 'react'
import { message, Button } from 'antd'
import { getLocale, history } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import AuthLayout from '../../auth/components/AuthLayout'
import Icon from '@/widgets/Icon'
import styles from './index.less'
import { User } from '@/openapi/user'
import type { PublicInvitationResponse } from '@/openapi/user/types'

// 浏览器语言检测工具函数
const getBrowserLanguage = (): string => {
	const browserLang = navigator.language || navigator.languages?.[0] || 'en'
	return browserLang
}

// 语言标准化函数
const normalizeLocale = (locale: string): string => {
	if (locale.startsWith('zh')) {
		return 'zh-CN'
	}
	if (locale.startsWith('en')) {
		return 'en-US'
	}
	return locale
}

const TeamInvite = () => {
	const global = useGlobal()

	// 语言设置
	const browserLang = getBrowserLanguage()
	const rawLocale = getLocale() || browserLang
	const currentLocale = normalizeLocale(rawLocale)
	const is_cn = currentLocale.startsWith('zh')

	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string>('')
	const [invitationData, setInvitationData] = useState<PublicInvitationResponse | null>(null)
	const [invitationId, setInvitationId] = useState<string>('')
	const [token, setToken] = useState<string>('')

	// Check if user is logged in (you may need to adjust this based on your auth implementation)
	const isLoggedIn = !!global.user

	// Fetch invitation data
	useEffect(() => {
		const fetchInvitation = async () => {
			try {
				// Parse URL parameters
				const pathSegments = window.location.pathname.split('/')
				const inviteIndex = pathSegments.findIndex((segment) => segment === 'invite')

				if (inviteIndex === -1 || !pathSegments[inviteIndex + 1]) {
					setError(is_cn ? '无效的邀请链接' : 'Invalid invitation link')
					setLoading(false)
					return
				}

				const invId = pathSegments[inviteIndex + 1]
				const invToken = pathSegments[inviteIndex + 2] || ''

				setInvitationId(invId)
				setToken(invToken)

				// Check if openapi is available
				if (!window.$app?.openapi) {
					console.warn('OpenAPI not initialized yet, retrying...')
					// Retry after a short delay
					setTimeout(fetchInvitation, 100)
					return
				}

				// Call API to get invitation details
				const user = new User(window.$app.openapi)
				const response = await user.teams.GetPublicInvitation(invId, currentLocale)

				if (response.status === 200 && response.data) {
					setInvitationData(response.data)
					setError('') // Clear any previous errors
				} else {
					setInvitationData(null) // Clear data on error
					setError(
						response.error?.error_description ||
							response.error?.error ||
							(is_cn ? '获取邀请信息失败' : 'Failed to load invitation')
					)
				}
			} catch (err: any) {
				console.error('Failed to fetch invitation:', err)
				setInvitationData(null) // Clear data on error
				setError(err.message || (is_cn ? '获取邀请信息失败' : 'Failed to load invitation'))
			} finally {
				setLoading(false)
			}
		}

		// Reset states when locale changes
		setLoading(true)
		setError('')
		// Don't clear invitationData here to avoid flashing expired state
		fetchInvitation()
	}, [currentLocale])

	// Check if invitation is expired (only check when data is available)
	const isExpired =
		invitationData &&
		(invitationData.status !== 'pending' ||
			(invitationData.invitation_expires_at && new Date(invitationData.invitation_expires_at) < new Date()))

	// Calculate remaining time
	const getRemainingTime = () => {
		if (!invitationData?.invitation_expires_at) {
			return is_cn ? '无期限' : 'No expiry'
		}

		const now = new Date()
		const expiresAt = new Date(invitationData.invitation_expires_at)
		const diff = expiresAt.getTime() - now.getTime()

		if (diff <= 0) {
			return is_cn ? '已过期' : 'Expired'
		}

		const days = Math.floor(diff / (1000 * 60 * 60 * 24))
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

		if (days > 0) {
			return is_cn
				? `${days} 天 ${hours} 小时`
				: `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`
		}
		return is_cn ? `${hours} 小时` : `${hours} hour${hours > 1 ? 's' : ''}`
	}

	// Handle accept invitation
	const handleAcceptInvitation = async () => {
		// TODO: API call to accept invitation
		// const user = new User(window.$app.openapi)
		// const response = await user.teams.AcceptInvitation(invitationId, token)
		message.success(is_cn ? '已接受邀请' : 'Invitation accepted')
	}

	// Handle login
	const handleLogin = () => {
		const returnUrl = encodeURIComponent(window.location.pathname)
		history.push(`/auth/signin?redirect=${returnUrl}`)
	}

	// Handle register
	const handleRegister = () => {
		const returnUrl = encodeURIComponent(window.location.pathname)
		// TODO: Update with actual register URL
		history.push(`/auth/signup?redirect=${returnUrl}`)
	}

	// Handle switch account
	const handleSwitchAccount = () => {
		// TODO: Implement logout and redirect to login
		const returnUrl = encodeURIComponent(window.location.pathname)
		history.push(`/auth/signin?redirect=${returnUrl}`)
	}

	// Render loading state
	if (loading) {
		return (
			<AuthLayout
				logo={global.app_info?.logo || '/api/__yao/app/icons/app.png'}
				theme={global.theme}
				onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
			>
				<div className={styles.inviteContainer}>
					<div className={styles.inviteCard}>
						<div className={styles.loadingContainer}>
							<div className={styles.loadingSpinner}></div>
							<p className={styles.loadingText}>
								{is_cn ? '加载邀请信息...' : 'Loading invitation...'}
							</p>
						</div>
					</div>
				</div>
			</AuthLayout>
		)
	}

	// Render error state
	if (error) {
		return (
			<AuthLayout
				logo={global.app_info?.logo || '/api/__yao/app/icons/app.png'}
				theme={global.theme}
				onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
			>
				<div className={styles.inviteContainer}>
					<div className={styles.inviteCard}>
						<div className={styles.expiredSection}>
							<div className={styles.expiredIcon}>
								<Icon name='material-error_outline' size={64} />
							</div>
							<h1 className={styles.expiredTitle}>
								{is_cn ? '加载失败' : 'Failed to Load'}
							</h1>
							<p className={styles.expiredDescription}>{error}</p>

							<div className={styles.expiredActions}>
								<Button
									type='default'
									size='large'
									onClick={() => window.location.reload()}
									className={styles.backButton}
								>
									{is_cn ? '重试' : 'Retry'}
								</Button>
								<Button
									type='default'
									size='large'
									onClick={() => history.push('/')}
									className={styles.backButton}
								>
									{is_cn ? '返回首页' : 'Back to Home'}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</AuthLayout>
		)
	}

	// Render expired state
	if (isExpired) {
		return (
			<AuthLayout
				logo={global.app_info?.logo || '/api/__yao/app/icons/app.png'}
				theme={global.theme}
				onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
			>
				<div className={styles.inviteContainer}>
					<div className={styles.inviteCard}>
						<div className={styles.expiredSection}>
							<div className={styles.expiredIcon}>
								<Icon name='material-event_busy' size={64} />
							</div>
							<h1 className={styles.expiredTitle}>
								{is_cn ? '邀请已过期' : 'Invitation Expired'}
							</h1>
							<p className={styles.expiredDescription}>
								{is_cn
									? '此邀请链接已过期，请联系团队管理员重新发送邀请。'
									: 'This invitation link has expired. Please contact the team administrator for a new invitation.'}
							</p>

							{invitationData && (
								<div className={styles.expiredDetails}>
									<div className={styles.detailRow}>
										<span className={styles.detailLabel}>
											{is_cn ? '团队名称：' : 'Team:'}
										</span>
										<span className={styles.detailValue}>
											{invitationData.team_name}
										</span>
									</div>
									{invitationData.invitation_expires_at && (
										<div className={styles.detailRow}>
											<span className={styles.detailLabel}>
												{is_cn ? '过期时间：' : 'Expired on:'}
											</span>
											<span className={styles.detailValue}>
												{new Date(
													invitationData.invitation_expires_at
												).toLocaleString(currentLocale)}
											</span>
										</div>
									)}
								</div>
							)}

							<div className={styles.expiredActions}>
								<Button
									type='default'
									size='large'
									onClick={() => history.push('/')}
									className={styles.backButton}
								>
									{is_cn ? '返回首页' : 'Back to Home'}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</AuthLayout>
		)
	}

	// Render active invitation (at this point: loading is false, no error, check if expired or show invitation)
	// Safety check: if no data, don't render (shouldn't happen as we should have error)
	if (!invitationData) {
		return null
	}

	return (
		<AuthLayout
			logo={global.app_info?.logo || '/api/__yao/app/icons/app.png'}
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			<div className={styles.inviteContainer}>
				<div className={styles.inviteCard}>
					{/* Title Section */}
					<div className={styles.titleSection}>
						<h1 className={styles.inviteTitle}>{is_cn ? '加入团队邀请' : 'Team Invitation'}</h1>
						<p className={styles.inviteSubtitle}>
							{is_cn ? (
								<>
									{invitationData.inviter_info?.name && (
										<>
											<span className={styles.inviterHighlight}>
												{invitationData.inviter_info.name}
											</span>{' '}
											邀请你加入{' '}
										</>
									)}
									<span className={styles.teamHighlight}>
										{invitationData.team_name}
									</span>
								</>
							) : (
								<>
									{invitationData.inviter_info?.name && (
										<>
											<span className={styles.inviterHighlight}>
												{invitationData.inviter_info.name}
											</span>{' '}
											invited you to join{' '}
										</>
									)}
									<span className={styles.teamHighlight}>
										{invitationData.team_name}
									</span>
								</>
							)}
						</p>
					</div>

					{/* Team Section */}
					<div className={styles.teamSection}>
						<div className={styles.teamHeader}>
							<div className={styles.teamAvatar}>
								{invitationData.team_logo ? (
									<img
										src={invitationData.team_logo}
										alt={invitationData.team_name}
									/>
								) : (
									<div className={styles.avatarPlaceholder}>
										<Icon name='material-group' size={32} />
									</div>
								)}
							</div>
							<div className={styles.teamInfo}>
								<h2 className={styles.teamName}>{invitationData.team_name}</h2>
								{invitationData.team_description && (
									<p className={styles.teamDescription}>
										{invitationData.team_description}
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Invitation Details */}
					<div className={styles.detailsSection}>
						{invitationData.role_label && (
							<div className={styles.detailItem}>
								<Icon name='material-badge' size={18} className={styles.detailIcon} />
								<div className={styles.detailContent}>
									<span className={styles.detailLabel}>
										{is_cn ? '角色' : 'Role'}
									</span>
									<span className={styles.detailValue}>
										{invitationData.role_label}
									</span>
								</div>
							</div>
						)}
						{invitationData.invitation_expires_at && (
							<>
								<div className={styles.detailItem}>
									<Icon
										name='material-schedule'
										size={18}
										className={styles.detailIcon}
									/>
									<div className={styles.detailContent}>
										<span className={styles.detailLabel}>
											{is_cn ? '剩余有效期' : 'Expires in'}
										</span>
										<span className={styles.detailValue}>
											{getRemainingTime()}
										</span>
									</div>
								</div>
								<div className={styles.detailItem}>
									<Icon
										name='material-event'
										size={18}
										className={styles.detailIcon}
									/>
									<div className={styles.detailContent}>
										<span className={styles.detailLabel}>
											{is_cn ? '过期时间' : 'Expiry date'}
										</span>
										<span className={styles.detailValue}>
											{new Date(
												invitationData.invitation_expires_at
											).toLocaleString(currentLocale)}
										</span>
									</div>
								</div>
							</>
						)}
						{invitationData.message && (
							<div className={styles.detailItem}>
								<Icon name='material-message' size={18} className={styles.detailIcon} />
								<div className={styles.detailContent}>
									<span className={styles.detailLabel}>
										{is_cn ? '留言' : 'Message'}
									</span>
									<span className={styles.detailValue}>
										{invitationData.message}
									</span>
								</div>
							</div>
						)}
					</div>

					{/* Action Section */}
					<div className={styles.actionSection}>
						{isLoggedIn ? (
							<>
								<Button
									type='primary'
									size='large'
									onClick={handleAcceptInvitation}
									className={styles.acceptButton}
									block
								>
									{is_cn ? '接受邀请' : 'Accept Invitation'}
								</Button>
								<div className={styles.switchAccountSection}>
									<span className={styles.switchAccountText}>
										{is_cn ? '不是您的账号？' : 'Not your account?'}
									</span>
									<a
										href='#'
										className={styles.switchAccountLink}
										onClick={(e) => {
											e.preventDefault()
											handleSwitchAccount()
										}}
									>
										{is_cn ? '切换账号' : 'Switch Account'}
									</a>
								</div>
							</>
						) : (
							<>
								<p className={styles.loginPrompt}>
									{is_cn
										? '请先登录或注册以接受邀请'
										: 'Please login or register to accept this invitation'}
								</p>
								<div className={styles.authButtons}>
									<Button
										type='primary'
										size='large'
										onClick={handleLogin}
										className={styles.loginButton}
									>
										{is_cn ? '登录' : 'Login'}
									</Button>
									<Button
										type='default'
										size='large'
										onClick={handleRegister}
										className={styles.registerButton}
									>
										{is_cn ? '注册' : 'Register'}
									</Button>
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</AuthLayout>
	)
}

export default observer(TeamInvite)
