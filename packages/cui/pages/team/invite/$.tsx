import React, { useState, useEffect } from 'react'
import { message, Button, Avatar, Switch } from 'antd'
import { getLocale, history } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import AuthLayout from '../../auth/components/AuthLayout'
import Icon from '@/widgets/Icon'
import styles from './index.less'
import { User } from '@/openapi/user'

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

// Mock data for development
const mockTeamData = {
	team: {
		team_id: 'team_001',
		name: 'Design Studio',
		description: 'A collaborative workspace for creative professionals',
		avatar: undefined, // Will show placeholder
		created_at: '2025-01-15T08:00:00Z'
	},
	inviter: {
		user_id: 'user_001',
		name: 'Sarah Chen',
		email: 'sarah.chen@example.com',
		avatar: undefined // Will show placeholder
	},
	invitation: {
		invitation_id: 'inv_039408925187',
		token: 'mkx8tq7Ud1vqez5TKQMAqiotcegQacSc_y5pTW1s7jo',
		role_id: 'team_member',
		role_label: 'Member',
		created_at: '2025-10-01T10:00:00Z',
		expires_at: '2028-10-01T10:00:00Z', // Valid until 2028
		status: 'pending'
	}
}

const TeamInvite = () => {
	const global = useGlobal()

	// 语言设置
	const browserLang = getBrowserLanguage()
	const rawLocale = getLocale() || browserLang
	const currentLocale = normalizeLocale(rawLocale)
	const is_cn = currentLocale.startsWith('zh')

	const [loading, setLoading] = useState(true)
	const [invitationId, setInvitationId] = useState<string>('')
	const [token, setToken] = useState<string>('')

	// Mock toggles for development
	const [mockIsLoggedIn, setMockIsLoggedIn] = useState(false)
	const [mockIsExpired, setMockIsExpired] = useState(false)

	// Parse URL parameters
	useEffect(() => {
		const pathSegments = window.location.pathname.split('/')
		const inviteIndex = pathSegments.findIndex((segment) => segment === 'invite')
		if (inviteIndex !== -1 && pathSegments[inviteIndex + 1] && pathSegments[inviteIndex + 2]) {
			setInvitationId(pathSegments[inviteIndex + 1])
			setToken(pathSegments[inviteIndex + 2])
		}

		// Simulate loading
		setTimeout(() => {
			setLoading(false)
		}, 500)
	}, [])

	// Check if invitation is expired
	const isExpired = mockIsExpired || new Date(mockTeamData.invitation.expires_at) < new Date()

	// Calculate remaining time
	const getRemainingTime = () => {
		const now = new Date()
		const expiresAt = new Date(mockTeamData.invitation.expires_at)
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

	// Render expired state
	if (isExpired) {
		return (
			<AuthLayout
				logo={global.app_info?.logo || '/api/__yao/app/icons/app.png'}
				theme={global.theme}
				onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
			>
				{/* Mock toggle - remove in production */}
				<div className={styles.mockControls}>
					<span>{is_cn ? '模拟过期状态：' : 'Mock Expired:'}</span>
					<Switch checked={mockIsExpired} onChange={setMockIsExpired} size='small' />
				</div>

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

							<div className={styles.expiredDetails}>
								<div className={styles.detailRow}>
									<span className={styles.detailLabel}>
										{is_cn ? '团队名称：' : 'Team:'}
									</span>
									<span className={styles.detailValue}>
										{mockTeamData.team.name}
									</span>
								</div>
								<div className={styles.detailRow}>
									<span className={styles.detailLabel}>
										{is_cn ? '过期时间：' : 'Expired on:'}
									</span>
									<span className={styles.detailValue}>
										{new Date(
											mockTeamData.invitation.expires_at
										).toLocaleString(currentLocale)}
									</span>
								</div>
							</div>

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

	// Render active invitation
	return (
		<AuthLayout
			logo={global.app_info?.logo || '/api/__yao/app/icons/app.png'}
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			{/* Mock toggles - remove in production */}
			<div className={styles.mockControls}>
				<div>
					<span>{is_cn ? '模拟登录状态：' : 'Mock Login:'}</span>
					<Switch checked={mockIsLoggedIn} onChange={setMockIsLoggedIn} size='small' />
				</div>
				<div>
					<span>{is_cn ? '模拟过期状态：' : 'Mock Expired:'}</span>
					<Switch checked={mockIsExpired} onChange={setMockIsExpired} size='small' />
				</div>
			</div>

			<div className={styles.inviteContainer}>
				<div className={styles.inviteCard}>
					{/* Title Section */}
					<div className={styles.titleSection}>
						<h1 className={styles.inviteTitle}>{is_cn ? '加入团队邀请' : 'Team Invitation'}</h1>
						<p className={styles.inviteSubtitle}>
							{is_cn ? (
								<>
									<span className={styles.inviterHighlight}>
										{mockTeamData.inviter.name}
									</span>{' '}
									邀请你加入{' '}
									<span className={styles.teamHighlight}>
										{mockTeamData.team.name}
									</span>
								</>
							) : (
								<>
									<span className={styles.inviterHighlight}>
										{mockTeamData.inviter.name}
									</span>{' '}
									invited you to join{' '}
									<span className={styles.teamHighlight}>
										{mockTeamData.team.name}
									</span>
								</>
							)}
						</p>
					</div>

					{/* Team Section */}
					<div className={styles.teamSection}>
						<div className={styles.teamHeader}>
							<div className={styles.teamAvatar}>
								{mockTeamData.team.avatar ? (
									<img
										src={mockTeamData.team.avatar}
										alt={mockTeamData.team.name}
									/>
								) : (
									<div className={styles.avatarPlaceholder}>
										<Icon name='material-group' size={32} />
									</div>
								)}
							</div>
							<div className={styles.teamInfo}>
								<h2 className={styles.teamName}>{mockTeamData.team.name}</h2>
								<p className={styles.teamDescription}>
									{mockTeamData.team.description}
								</p>
							</div>
						</div>
					</div>

					{/* Invitation Details */}
					<div className={styles.detailsSection}>
						<div className={styles.detailItem}>
							<Icon name='material-badge' size={18} className={styles.detailIcon} />
							<div className={styles.detailContent}>
								<span className={styles.detailLabel}>{is_cn ? '角色' : 'Role'}</span>
								<span className={styles.detailValue}>
									{mockTeamData.invitation.role_label}
								</span>
							</div>
						</div>
						<div className={styles.detailItem}>
							<Icon name='material-schedule' size={18} className={styles.detailIcon} />
							<div className={styles.detailContent}>
								<span className={styles.detailLabel}>
									{is_cn ? '剩余有效期' : 'Expires in'}
								</span>
								<span className={styles.detailValue}>{getRemainingTime()}</span>
							</div>
						</div>
						<div className={styles.detailItem}>
							<Icon name='material-event' size={18} className={styles.detailIcon} />
							<div className={styles.detailContent}>
								<span className={styles.detailLabel}>
									{is_cn ? '过期时间' : 'Expiry date'}
								</span>
								<span className={styles.detailValue}>
									{new Date(mockTeamData.invitation.expires_at).toLocaleString(
										currentLocale
									)}
								</span>
							</div>
						</div>
					</div>

					{/* Action Section */}
					<div className={styles.actionSection}>
						{mockIsLoggedIn ? (
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
