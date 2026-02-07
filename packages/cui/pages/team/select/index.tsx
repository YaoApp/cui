import React, { useState, useEffect, useRef } from 'react'
import { message, Button, Spin } from 'antd'
import { getLocale, history } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { User } from '@/openapi/user'
import { UserTeam, TeamConfig } from '@/openapi/user/types'
import AuthLayout from '../../auth/components/AuthLayout'
import TeamCard from './components/TeamCard'
import { AfterLogin } from '../../auth/auth'
import { getDefaultLogoUrl } from '@/services/wellknown'
import styles from './index.less'

// Cookie utility
const getCookie = (name: string): string | null => {
	const value = `; ${document.cookie}`
	const parts = value.split(`; ${name}=`)
	if (parts.length === 2) return parts.pop()?.split(';').shift() || null
	return null
}

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
	const autoSelectingRef = useRef(false)

	useEffect(() => {
		// Wait for openapi to be initialized
		const initAndFetch = async () => {
			// Check if openapi is initialized
			if (!window.$app?.openapi) {
				// Wait for app initialization
				await window.$app?.Event?.emit('app/getAppInfo')

				// Double check after waiting
				if (!window.$app?.openapi) {
					const errorMsg = currentLocale.startsWith('zh')
						? 'OpenAPI 未初始化'
						: 'OpenAPI not initialized'
					setError(errorMsg)
					setFetching(false)
					return
				}
			}

			// Now safe to fetch data
			await fetchConfig()
			await fetchTeams()
		}

		initAndFetch()
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
						history.push('/auth/entry')
					}, 1000)
					return
				}

				// Other errors - show message but don't redirect immediately
				throw new Error(errorMsg)
			}

			const teamList = response.data || []
			setTeams(teamList)
			console.log('Teams loaded successfully:', teamList.length)

			// If no teams found, show error
			if (teamList.length === 0) {
				setError(
					currentLocale.startsWith('zh')
						? '您还没有加入任何团队，请联系管理员'
						: 'You have not joined any team yet. Please contact your administrator.'
				)
				return
			}

			// Auto-select if only one team (defense in depth, backend should also handle this)
			if (teamList.length === 1 && !autoSelectingRef.current) {
				autoSelectingRef.current = true
				// Small delay to ensure state is set before auto-selecting
				setTimeout(() => {
					handleSelectTeam(teamList[0].team_id)
				}, 100)
				return
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
			message.warning(currentLocale.startsWith('zh') ? '请选择一个团队' : 'Please select a team')
			return
		}

		setLoading(true)
		try {
			if (!window.$app?.openapi) {
				message.error('API not initialized')
				return
			}

			const user = new User(window.$app.openapi)
			const response = await user.teams.SelectTeam({ team_id: teamId })

			if (user.IsError(response)) {
				const errorMsg = response.error?.error_description || 'Failed to select team'
				message.error(errorMsg)
				console.error('SelectTeam error:', response.error)
				return
			}

			// Store selected team info
			const selectedTeam = teams.find((t) => t.team_id === teamId)
			if (selectedTeam) {
				sessionStorage.setItem('selected_team_id', teamId)
				sessionStorage.setItem('selected_team', JSON.stringify(selectedTeam))
			}

			// Setup user state and redirect
			try {
				const loginRedirect = getCookie('login_redirect') || '/auth/helloworld'
				const logoutRedirect = getCookie('logout_redirect') || '/'

				await AfterLogin(global, {
					user: response.data?.user || ({} as any),
					entry: loginRedirect,
					logout_redirect: logoutRedirect
				})

				setTimeout(() => {
					window.location.href = loginRedirect
				}, 500)
			} catch (error) {
				console.error('Failed to setup after login:', error)
				const loginRedirect = getCookie('login_redirect') || '/auth/helloworld'
				setTimeout(() => {
					window.location.href = loginRedirect
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
			logo={global.app_info?.logo || getDefaultLogoUrl()}
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			<div className={styles.teamSelectContainer}>
			<div className={styles.teamSelectCard}>
				<div className={styles.titleSection}>
					<h1 className={styles.appTitle}>
						{currentLocale.startsWith('zh') ? '选择团队' : 'Select Team'}
					</h1>
					<p className={styles.appSubtitle}>
						{currentLocale.startsWith('zh')
							? '请选择要进入的团队'
							: 'Please select the team you want to enter'}
					</p>
				</div>

				{fetching || autoSelectingRef.current ? (
					<div className={styles.loadingContainer}>
						<Spin size='large' />
						<p className={styles.loadingText}>
							{autoSelectingRef.current
								? (currentLocale.startsWith('zh') ? '正在进入...' : 'Entering...')
								: (currentLocale.startsWith('zh') ? '加载团队列表...' : 'Loading teams...')}
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
							<Button onClick={() => history.push('/auth/entry')}>
								{currentLocale.startsWith('zh') ? '返回登录' : 'Back to Login'}
							</Button>
						</div>
					</div>
				) : (
					<>
						<div className={styles.teamsGrid}>
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
								onClick={() => history.push('/auth/entry')}
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
