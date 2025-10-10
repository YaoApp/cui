import React, { useState, useEffect } from 'react'
import { message, Button, Avatar } from 'antd'
import { getLocale, history } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import AuthLayout from '../../auth/components/AuthLayout'
import styles from './index.less'

// Mock team data
interface Team {
	id: string
	team_id: string
	name: string
	description: string
	logo?: string
	member_count: number
	role: string
}

const mockTeams: Team[] = [
	{
		id: '1',
		team_id: 'team_001',
		name: 'Engineering Team',
		description: 'Core engineering and development team',
		logo: '',
		member_count: 24,
		role: 'Admin'
	},
	{
		id: '2',
		team_id: 'team_002',
		name: 'Product Team',
		description: 'Product management and design',
		logo: '',
		member_count: 12,
		role: 'Member'
	},
	{
		id: '3',
		team_id: 'team_003',
		name: 'Marketing Team',
		description: 'Marketing and growth operations',
		logo: '',
		member_count: 8,
		role: 'Member'
	}
]

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
	const [selectedTeamId, setSelectedTeamId] = useState<string>('')
	const [teams] = useState<Team[]>(mockTeams)

	useEffect(() => {
		// TODO: Fetch teams from API (session is managed by Cookie)
		// For now, using mock data
	}, [])

	const handleSelectTeam = async (teamId: string) => {
		setLoading(true)
		try {
			// TODO: Call API to select team (session is managed by Cookie)
			// const response = await api.selectTeam(teamId)

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 500))

			message.success(currentLocale.startsWith('zh') ? '团队选择成功' : 'Team selected successfully')

			// Redirect to dashboard or entry page
			history.push('/auth/helloworld')
		} catch (error) {
			console.error('Failed to select team:', error)
			message.error(currentLocale.startsWith('zh') ? '团队选择失败' : 'Failed to select team')
		} finally {
			setLoading(false)
		}
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
							{currentLocale.startsWith('zh') ? '选择团队' : 'Select Team'}
						</h1>
						<p className={styles.appSubtitle}>
							{currentLocale.startsWith('zh')
								? '您属于多个团队，请选择要访问的团队'
								: 'You belong to multiple teams, please select the team you want to access'}
						</p>
					</div>

					<div className={styles.teamsGrid}>
						{teams.map((team) => (
							<div
								key={team.id}
								className={`${styles.teamCard} ${
									selectedTeamId === team.id ? styles.teamCardSelected : ''
								}`}
								onClick={() => setSelectedTeamId(team.id)}
							>
								<div className={styles.teamCardHeader}>
									<Avatar size={48} className={styles.teamLogo}>
										{team.name[0].toUpperCase()}
									</Avatar>
									<div className={styles.teamInfo}>
										<h3 className={styles.teamName}>{team.name}</h3>
										<p className={styles.teamRole}>{team.role}</p>
									</div>
								</div>
								<p className={styles.teamDescription}>{team.description}</p>
								<div className={styles.teamMeta}>
									<span className={styles.teamMembers}>
										{team.member_count}{' '}
										{currentLocale.startsWith('zh') ? '成员' : 'members'}
									</span>
								</div>
							</div>
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
							{currentLocale.startsWith('zh') ? '继续' : 'Continue'}
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
				</div>
			</div>
		</AuthLayout>
	)
}

export default new window.$app.Handle(TeamSelect).by(observer).by(window.$app.memo).get()
