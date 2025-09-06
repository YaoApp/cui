import { useEffect, useState } from 'react'
import { Avatar, Button, Spin, Tooltip, Radio, Divider, Select, Dropdown } from 'antd'
import { getLocale, setLocale, history } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useMemoizedFn } from 'ahooks'
import { local } from '@yaoapp/storex'
import { difference } from 'lodash-es'
import Icon from '@/widgets/Icon'
import { mockApi, MenuItem, User } from '../../mockData'
import { useGlobal } from '@/context/app'
import { useIntl } from '@/hooks'
import styles from './index.less'

interface MenuProps {
	active: string
	onChange: (key: string) => void
}

const Menu = ({ active, onChange }: MenuProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()
	const messages = useIntl()

	const [loading, setLoading] = useState(true)
	const [user, setUser] = useState<User | null>(null)
	const [items, setItems] = useState<MenuItem[]>([])

	// 清除存储和退出登录
	const clearStorage = useMemoizedFn(() => {
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
				const [userData, menuData] = await Promise.all([mockApi.getUser(), mockApi.getMenuItems()])
				setUser(userData)
				setItems(menuData)
			} catch (error) {
				console.error('Failed to load settings data:', error)
			} finally {
				setLoading(false)
			}
		}

		loadData()
	}, [])

	const grouped = items.reduce((groups, item) => {
		if (!groups[item.group]) {
			groups[item.group] = []
		}
		groups[item.group].push(item)
		return groups
	}, {} as Record<string, MenuItem[]>)

	const groupTitles = {
		profile: is_cn ? '账户设置' : 'Account',
		plan: is_cn ? '套餐计划' : 'Plan',
		connectors: is_cn ? '连接器' : 'Connectors',
		mcp: 'MCP',
		security: is_cn ? '安全设置' : 'Security',
		support: is_cn ? '帮助支持' : 'Support'
	}

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
					{user && (
						<div className={styles.user}>
							<Avatar src={user.avatar} size={32} className={styles.avatar}>
								{user.name?.charAt(0)?.toUpperCase() || 'U'}
							</Avatar>
							<div className={styles.info}>
								<div className={styles.firstLine}>
									<span className={styles.name}>{user.name}</span>
									<span className={styles.plan}>{user.plan}</span>
								</div>
								<div className={styles.email}>{user.email}</div>
							</div>
						</div>
					)}

					{Object.entries(grouped)
						.sort(([, itemsA], [, itemsB]) => {
							// 根据每个分组内最小的order值来排序分组
							const minOrderA = Math.min(...itemsA.map((item) => item.order))
							const minOrderB = Math.min(...itemsB.map((item) => item.order))
							return minOrderA - minOrderB
						})
						.map(([group, groupItems]) => (
							<div key={group} className={styles.group}>
								<div className={styles.title}>
									{groupTitles[group as keyof typeof groupTitles]}
								</div>
								<div className={styles.items}>
									{groupItems
										.sort((a, b) => a.order - b.order)
										.map((item) => (
											<div
												key={item.key}
												className={`${styles.item} ${
													active === item.key ? styles.active : ''
												}`}
												onClick={() => onChange(item.key)}
											>
												<Icon name={item.icon} size={16} />
												<span className={styles.text}>
													{item.name[is_cn ? 'zh-CN' : 'en-US']}
												</span>
											</div>
										))}
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
										<Icon name='material-public' size={14} />
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
								<Icon name='material-logout' size={14} />
							</div>
						</Tooltip>
					</div>
				</div>
			</div>
		</div>
	)
}

export default observer(Menu)
