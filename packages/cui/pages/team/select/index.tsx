import React, { useState, useEffect } from 'react'
import { message, Button, Spin } from 'antd'
import { getLocale, history } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { User } from '@/openapi/user'
import { UserTeam, TeamConfig } from '@/openapi/user/types'
import AuthLayout from '../../auth/components/AuthLayout'
import TeamCard from './components/TeamCard'
import styles from './index.less'

// Browser language detection utility
const getBrowserLanguage = (): string => {
	const browserLang = navigator.language || navigator.languages?.[0] || 'en'
	return browserLang
}

// Language normalization
const normalizeLocale = (locale: string): string => {
	if (locale.startsWith('zh')) {
		return 'zh-CN'
	}
	if (locale.startsWith('en')) {
		return 'en-US'
	}
	return locale
}

const TeamSelect = () => {
	const global = useGlobal()

	// Language settings
	const browserLang = getBrowserLanguage()
	const rawLocale = getLocale() || browserLang
	const currentLocale = normalizeLocale(rawLocale)

	const [loading, setLoading] = useState(false)
	const [fetching, setFetching] = useState(true)
	const [selectedTeamId, setSelectedTeamId] = useState<string>('')
	const [teams, setTeams] = useState<UserTeam[]>([])
	const [error, setError] = useState<string>('')
	const [config, setConfig] = useState<TeamConfig | null>(null)

	// Personal workspace option (always first)
	const personalWorkspace: UserTeam = {
		id: 0,
		team_id: 'personal',
		name: currentLocale.startsWith('zh') ? '我的工作空间' : 'My Workspace',
		display_name: currentLocale.startsWith('zh') ? '我的工作空间' : 'My Workspace',
		description: currentLocale.startsWith('zh') ? '使用个人账号访问' : 'Access with personal account',
		owner_id: '',
		status: 'active',
		is_verified: false,
		created_at: '',
		updated_at: '',
		is_owner: true
	}

	useEffect(() => {
		fetchConfig()
		fetchTeams()
	}, [])

	const fetchConfig = async () => {
		try {
			if (!window.$app?.openapi) {
				console.error('OpenAPI not initialized')
				return
			}

			const user = new User(window.$app.openapi)
			const response = await user.teams.GetConfig(currentLocale)

			console.log('GetConfig response:', {
				status: response.status,
				hasError: user.IsError(response),
				roles: response.data?.roles?.length
			})

			if (!user.IsError(response) && response.data) {
				setConfig(response.data)
			} else {
				console.warn('Failed to load team config, using default role names')
			}
		} catch (error) {
			console.error('Failed to fetch team config:', error)
			// Don't show error to user, just use default role names
		}
	}

	const fetchTeams = async () => {
		setFetching(true)
		setError('')
		try {
			if (!window.$app?.openapi) {
				console.error('OpenAPI not initialized')
				throw new Error('OpenAPI not initialized')
			}

			const user = new User(window.$app.openapi)
			const response = await user.teams.GetTeams()

			// Log response for debugging
			console.log('GetTeams response:', {
				status: response.status,
				hasError: user.IsError(response),
				error: user.IsError(response) ? response.error : null,
				dataLength: response.data?.length
			})

			if (user.IsError(response)) {
				const errorMsg =
					response.error?.error_description || response.error?.error || 'Failed to fetch teams'
				const statusCode = response.status

				console.error('GetTeams error:', {
					status: statusCode,
					error: response.error,
					message: errorMsg
				})

				// Handle different error types
				if (statusCode === 401 || statusCode === 403) {
					// Unauthorized or Forbidden - redirect to signin
					message.error(currentLocale.startsWith('zh') ? '请先登录' : 'Please sign in first')
					setTimeout(() => {
						history.push('/auth/signin')
					}, 1000)
					return
				}

				// Other errors - show message but don't redirect immediately
				throw new Error(errorMsg)
			}

			setTeams(response.data || [])
			console.log('Teams loaded successfully:', response.data?.length || 0)

			// If no teams found, redirect to main page
			if (!response.data || response.data.length === 0) {
				message.info(
					currentLocale.startsWith('zh')
						? '您还没有加入任何团队'
						: 'You have not joined any team yet'
				)
				setTimeout(() => {
					history.push('/auth/helloworld')
				}, 1500)
			}
		} catch (error: any) {
			console.error('Failed to fetch teams - Exception:', error)
			const errorMessage =
				error?.message ||
				(currentLocale.startsWith('zh') ? '获取团队列表失败' : 'Failed to fetch teams')
			setError(errorMessage)
			message.error(errorMessage)

			// Don't automatically redirect on network errors
			// Let user manually navigate or retry
		} finally {
			setFetching(false)
		}
	}

	const handleSelectTeam = async (teamId: string) => {
		if (!teamId) {
			message.warning(currentLocale.startsWith('zh') ? '请选择一个工作空间' : 'Please select a workspace')
			return
		}

		setLoading(true)
		try {
			// Handle personal workspace
			if (teamId === 'personal') {
				sessionStorage.removeItem('selected_team_id')
				sessionStorage.removeItem('selected_team')
				message.success(
					currentLocale.startsWith('zh') ? '已切换到我的工作空间' : 'Switched to my workspace'
				)
				setTimeout(() => {
					history.push('/auth/helloworld')
				}, 500)
				return
			}

			// Handle team selection
			const selectedTeam = teams.find((t) => t.team_id === teamId)
			if (selectedTeam) {
				// Store selected team in session storage or context
				sessionStorage.setItem('selected_team_id', teamId)
				sessionStorage.setItem('selected_team', JSON.stringify(selectedTeam))

				message.success(currentLocale.startsWith('zh') ? '团队选择成功' : 'Team selected successfully')

				// Redirect to dashboard or entry page
				setTimeout(() => {
					history.push('/auth/helloworld')
				}, 500)
			}
		} catch (error) {
			console.error('Failed to select team:', error)
			message.error(currentLocale.startsWith('zh') ? '选择失败' : 'Selection failed')
		} finally {
			setLoading(false)
		}
	}

	// Get role label from config
	const getRoleLabel = (roleId?: string): string => {
		if (!roleId) {
			return currentLocale.startsWith('zh') ? '成员' : 'Member'
		}

		// Find role in config
		if (config?.roles) {
			const role = config.roles.find((r) => r.role_id === roleId)
			if (role?.label) {
				return role.label
			}
		}

		// Fallback: capitalize first letter
		return roleId.charAt(0).toUpperCase() + roleId.slice(1)
	}

	return (
		<AuthLayout
			logo={global.app_info?.logo || '/api/__yao/app/icons/app.png'}
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			<div className={styles.teamSelectContainer}>
				<div className={styles.teamSelectCard}>
					<div className={styles.titleSection}>
						<h1 className={styles.appTitle}>
							{currentLocale.startsWith('zh') ? '选择工作空间' : 'Select Workspace'}
						</h1>
						<p className={styles.appSubtitle}>
							{currentLocale.startsWith('zh')
								? '请选择要访问的团队或个人工作空间'
								: 'Please select the team or personal workspace you want to access'}
						</p>
					</div>

					{fetching ? (
						<div className={styles.loadingContainer}>
							<Spin size='large' />
							<p className={styles.loadingText}>
								{currentLocale.startsWith('zh')
									? '加载团队列表...'
									: 'Loading teams...'}
							</p>
						</div>
					) : error ? (
						<div className={styles.errorContainer}>
							<div className={styles.errorIcon}>⚠️</div>
							<p className={styles.errorMessage}>{error}</p>
							<div className={styles.errorActions}>
								<Button type='primary' onClick={() => fetchTeams()}>
									{currentLocale.startsWith('zh') ? '重试' : 'Retry'}
								</Button>
								<Button onClick={() => history.push('/auth/signin')}>
									{currentLocale.startsWith('zh') ? '返回登录' : 'Back to Login'}
								</Button>
							</div>
						</div>
					) : (
						<>
							<div className={styles.teamsGrid}>
								{/* Personal Workspace - Always First */}
								<TeamCard
									key='personal'
									team={personalWorkspace}
									selected={selectedTeamId === 'personal'}
									roleLabel=''
									ownerLabel={currentLocale.startsWith('zh') ? '所有者' : 'Owner'}
									onClick={() => setSelectedTeamId('personal')}
								/>

								{/* Divider */}
								{teams.length > 0 && (
									<div className={styles.divider}>
										<span className={styles.dividerLine}></span>
										<span className={styles.dividerText}>
											{currentLocale.startsWith('zh')
												? '或选择团队'
												: 'or select team'}
										</span>
										<span className={styles.dividerLine}></span>
									</div>
								)}

								{/* Team List */}
								{teams.map((team) => (
									<TeamCard
										key={team.team_id}
										team={team}
										selected={selectedTeamId === team.team_id}
										roleLabel={getRoleLabel(team.role_id)}
										ownerLabel={
											currentLocale.startsWith('zh') ? '所有者' : 'Owner'
										}
										onClick={() => setSelectedTeamId(team.team_id)}
									/>
								))}
							</div>

							<div className={styles.teamSelectActions}>
								<Button
									type='primary'
									size='large'
									onClick={() => handleSelectTeam(selectedTeamId)}
									disabled={!selectedTeamId || loading}
									loading={loading}
									className={styles.continueButton}
								>
									{currentLocale.startsWith('zh') ? '进入' : 'Enter'}
								</Button>
								<Button
									type='default'
									size='large'
									onClick={() => history.push('/auth/signin')}
									disabled={loading}
									className={styles.backButton}
								>
									{currentLocale.startsWith('zh') ? '返回登录' : 'Back to Login'}
								</Button>
							</div>
						</>
					)}
				</div>
			</div>
		</AuthLayout>
	)
}

export default new window.$app.Handle(TeamSelect).by(observer).by(window.$app.memo).get()
