import { useEffect, useState, useMemo } from 'react'
import { Avatar, Button, Spin, Tooltip, Radio, Divider, Select, Dropdown } from 'antd'
import { getLocale, setLocale, history } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useMemoizedFn } from 'ahooks'
import { local } from '@yaoapp/storex'
import { difference } from 'lodash-es'
import Icon from '@/widgets/Icon'
import UserAvatar from '@/widgets/UserAvatar'
import { GetCurrentUser } from '@/pages/auth/auth'
import { mockApi, MenuItem, MenuGroup, User } from '../../mockData'
import { useGlobal } from '@/context/app'
import { useIntl } from '@/hooks'
import styles from './index.less'

interface MenuProps {
	active: string
	onChange: (key: string) => void
}

// Helper function to check if a path is an external URL
const isExternalUrl = (path: string): boolean => {
	return path.startsWith('http://') || path.startsWith('https://')
}

const Menu = ({ active, onChange }: MenuProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()
	const messages = useIntl()

	const [loading, setLoading] = useState(true)
	const [groups, setGroups] = useState<MenuGroup[]>([])

	// Get current user from auth
	const currentUser = useMemo(() => GetCurrentUser(), [])

	// Determine if user is in team context
	const isTeam = useMemo(() => {
		return !!(currentUser?.team_id && currentUser?.team)
	}, [currentUser])

	// 清除存储和退出登录
	const clearStorage = useMemoizedFn(async () => {
		try {
			// Call server logout endpoint to revoke tokens
			if (window.$app?.openapi) {
				const { User } = await import('@/openapi/user')
				const user = new User(window.$app.openapi)
				await user.auth.Logout(true)
			}
		} catch (error) {
			console.error('Server logout failed:', error)
			// Continue with local cleanup even if server logout fails
		}

		// Clear user info from local storage and global state
		const { AfterLogout } = await import('@/pages/auth/auth')
		AfterLogout(global)

		if (!local.logout_redirect) {
			history.push(local.login_url || '/')
		}

		const excludes = ['paths', 'avatar', 'xgen_theme', 'remote_cache', 'token_storage', 'temp_sid']
		const all = []
		for (let index = 0; index < localStorage.length; index++) {
			all.push(localStorage.key(index)!)
		}

		difference(all, excludes).map((item) => local.removeItem(item))
		sessionStorage.clear()

		// Clear the token and studio token
		localStorage.removeItem('xgen:token')
		localStorage.removeItem('xgen:studio')

		// Redirect to the custom logout page
		if (local.logout_redirect) {
			window.location = local.logout_redirect
			return
		}
	})

	// 切换语言
	const changeLocale = async (locale: string) => {
		await window.$app.Event.emit(`app/getUserMenu`, locale)
		setLocale(locale)
	}

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true)
				const groupsData = await mockApi.getMenuGroups()
				setGroups(groupsData)
			} catch (error) {
				console.error('Failed to load settings data:', error)
			} finally {
				setLoading(false)
			}
		}

		loadData()
	}, [])

	// 数据已经是分组结构，不需要额外处理

	if (loading) {
		return (
			<div className={styles.loading}>
				<Spin size='small' />
			</div>
		)
	}

	return (
		<div className={styles.menu}>
			<div className={styles.menuContent}>
				{/* 可滚动的菜单区域 */}
				<div className={styles.scrollableContent}>
				{currentUser && (
					<div className={styles.userSection}>
						{isTeam && (
							<span className={styles.roleBadge}>
								{currentUser.is_owner
									? is_cn ? '所有者' : 'Owner'
									: is_cn ? '成员' : 'Member'}
							</span>
						)}
						<UserAvatar
							size={36}
							showCard={false}
							data={{
								id: String(currentUser.id),
								name: isTeam
									? currentUser.member?.display_name || currentUser.name
									: currentUser.name,
								avatar: isTeam
									? currentUser.member?.avatar || currentUser.avatar
									: currentUser.avatar,
								...(isTeam && currentUser.team ? {
									team: {
										team_id: currentUser.team.team_id || currentUser.team.id || '',
										name: currentUser.team.name,
										logo: currentUser.team.logo
									}
								} : {})
							}}
						/>
						<div className={styles.userInfo}>
							<div className={styles.primaryName}>
								{isTeam
									? currentUser.team?.name || currentUser.name
									: currentUser.name}
							</div>
							{isTeam && (
								<div className={styles.secondaryName}>
									<Icon name='material-person' size={12} />
									<span>
										{currentUser.member?.display_name ||
											currentUser.name}
									</span>
								</div>
							)}
						</div>
					</div>
				)}

					{groups
						.sort((a, b) => a.order - b.order)
						.filter((group) => group.items.length > 0) // 只显示有菜单项的分组
						.map((group) => (
							<div key={group.key} className={styles.group}>
								<div className={styles.title}>
									{group.name[is_cn ? 'zh-CN' : 'en-US']}
								</div>
								<div className={styles.items}>
									{group.items.map((item) => {
										const isExternal = isExternalUrl(item.path)
										return (
											<div
												key={item.key}
												className={`${styles.item} ${
													active === item.key ? styles.active : ''
												}`}
												onClick={() => {
													if (isExternal) {
														window.open(
															item.path,
															'_blank',
															'noopener,noreferrer'
														)
													} else {
														onChange(item.key)
													}
												}}
											>
												<Icon
													name={item.icon}
													size={16}
													className={
														active === item.key
															? styles.menuIconActive
															: styles.menuIcon
													}
												/>
												<span className={styles.text}>
													{item.name[is_cn ? 'zh-CN' : 'en-US']}
												</span>
												{isExternal && (
													<Icon
														name='material-open_in_new'
														size={12}
														className={styles.externalIcon}
													/>
												)}
											</div>
										)
									})}
								</div>
							</div>
						))}
				</div>

				{/* 底部固定设置栏 */}
				<div className={styles.footer}>
					<Divider className={styles.divider} />

					<div className={styles.settingsRow}>
						{/* 左侧：主题和语言切换 */}
						<div className={styles.leftControls}>
							{/* 主题切换 */}
							<Tooltip
								title={
									messages.layout?.setting?.theme?.title ||
									(is_cn ? '切换主题' : 'Toggle Theme')
								}
								placement='top'
							>
								<div
									className={styles.themeButton}
									onClick={() =>
										global.setTheme(global.theme === 'light' ? 'dark' : 'light')
									}
								>
									<Icon
										name={
											global.theme === 'light'
												? 'material-dark_mode'
												: 'material-light_mode'
										}
										size={14}
										className={styles.footerIcon}
									/>
								</div>
							</Tooltip>

							{/* 语言切换 */}
							<Dropdown
								menu={{
									items: [
										{
											key: 'zh-CN',
											label: '中文',
											onClick: () => changeLocale('zh-CN')
										},
										{
											key: 'en-US',
											label: 'English',
											onClick: () => changeLocale('en-US')
										}
									],
									selectedKeys: [is_cn ? 'zh-CN' : 'en-US']
								}}
								placement='topRight'
								trigger={['click']}
							>
								<Tooltip
									title={
										messages.layout?.setting?.language?.title ||
										(is_cn ? '切换语言' : 'Switch Language')
									}
									placement='top'
								>
									<div className={styles.languageButton}>
										<Icon
											name='material-public'
											size={14}
											className={styles.footerIcon}
										/>
										<span className={styles.languageText}>
											{is_cn ? '中' : 'EN'}
										</span>
									</div>
								</Tooltip>
							</Dropdown>
						</div>

						{/* 右侧：退出按钮 */}
						<Tooltip title={is_cn ? '退出' : 'Exit'} placement='top'>
							<div className={styles.logoutButton} onClick={clearStorage}>
								<Icon name='material-logout' size={14} className={styles.footerIcon} />
							</div>
						</Tooltip>
					</div>
				</div>
			</div>
		</div>
	)
}

export default observer(Menu)
