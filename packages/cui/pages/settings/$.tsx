import { useState, useEffect, useMemo } from 'react'
import { getLocale, useParams, useNavigate } from '@umijs/max'
import Menu from './components/Menu'
import Profile from './components/Profile'
import ApiKeys from './components/ApiKeys'
import Team from './components/Team'
import Usage from './components/Usage'
import Preferences from './components/Preferences'
import Privacy from './components/Privacy'
import Plans from './components/Plans'
import Subscription from './components/Subscription'
import Balance from './components/Balance'
import Billing from './components/Billing'
import Invite from './components/Invite'
import Commissions from './components/Commissions'
import LLMProviders from './components/LLMProviders'
import Stripe from './components/Stripe'
import MCPServers from './components/MCPServers'
import Security from './components/Security'
import AuditLogs from './components/AuditLogs'
import SystemInfo from './components/SystemInfo'
import CloudService from './components/CloudService'
import Models from './components/Models'
import SearchScrape from './components/SearchScrape'
import Sandbox from './components/Sandbox'
import SmtpConfig from './components/SmtpConfig'
import type { MenuItem, MenuGroup } from './types'
import { mockApi } from './mockApi'
import styles from './index.less'

// 临时组件，用于显示其他页面
const ComingSoon = ({ title }: { title: string }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	return (
		<div className={styles.comingSoon}>
			<div className={styles.icon}>🚧</div>
			<h3>{title}</h3>
			<p>{is_cn ? '此功能正在开发中...' : 'This feature is coming soon...'}</p>
		</div>
	)
}

const Settings = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const params = useParams()
	const navigate = useNavigate()

	// 组件注册表 - 将 key 映射到实际组件
	const componentRegistry = useMemo(
		() => ({
			profile: Profile,
			'api-keys': ApiKeys,
			team: Team,
			usage: Usage,
			preferences: Preferences,
			privacy: Privacy,
			plans: Plans,
			subscription: Subscription,
			balance: Balance,
			billing: Billing,
			invite: Invite,
			commissions: Commissions,
			'llm-providers': LLMProviders,
			stripe: Stripe,
			'mcp-servers': MCPServers,
			security: Security,
			'audit-logs': AuditLogs,
			system: SystemInfo,
			cloud: CloudService,
			models: Models,
			search: SearchScrape,
			sandbox: Sandbox,
			smtp: SmtpConfig
		}),
		[]
	)

	// 从菜单数据中动态生成页面组件映射
	const [pageComponents, setPageComponents] = useState<Record<string, React.ReactNode>>({})
	const [menuItems, setMenuItems] = useState<MenuItem[]>([])

	useEffect(() => {
		const loadMenuData = async () => {
			try {
				const groups = await mockApi.getMenuGroups()
				// 从分组数据中提取所有菜单项
				const items: MenuItem[] = groups.flatMap((group) => group.items)
				setMenuItems(items)

				// 根据菜单数据动态创建组件映射
				const components: Record<string, React.ReactNode> = {}
				items.forEach((item) => {
					const ComponentClass = componentRegistry[item.key as keyof typeof componentRegistry]
					if (ComponentClass) {
						components[item.key] = <ComponentClass />
					} else {
						// 未注册的组件显示 ComingSoon，使用菜单中的名称
						const title = item.name[is_cn ? 'zh-CN' : 'en-US']
						components[item.key] = <ComingSoon title={title} />
					}
				})
				setPageComponents(components)
			} catch (error) {
				console.error('Failed to load menu data:', error)
			}
		}

		loadMenuData()
	}, [componentRegistry, is_cn])

	// 从路由参数中获取当前tab，如果没有则默认为 'profile'
	const currentTab = params['*'] || 'profile'
	const [activeKey, setActiveKey] = useState(currentTab)

	// 当路由参数变化或菜单数据加载完成时，更新 activeKey
	useEffect(() => {
		if (menuItems.length === 0) return // 等待菜单数据加载完成

		// 检查当前路由是否有效（基于菜单数据）
		const validTabs = menuItems.map((item) => item.key)
		if (currentTab && !validTabs.includes(currentTab)) {
			// 如果路由无效，重定向到第一个菜单项或默认页面
			const firstTab = menuItems.length > 0 ? menuItems[0].key : 'profile'
			navigate(`/settings/${firstTab}`, { replace: true })
			return
		}
		setActiveKey(currentTab)
	}, [currentTab, navigate, menuItems])

	// 处理 tab 切换，同时更新路由
	const handleTabChange = (key: string) => {
		setActiveKey(key)
		navigate(`/settings/${key}`)
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<div className={styles.title}>
					<h1>{is_cn ? '设置' : 'Settings'}</h1>
					<p>{is_cn ? '管理您的账户设置和偏好' : 'Manage your account settings and preferences'}</p>
				</div>
			</div>
			<div className={styles.content}>
				<Menu active={activeKey} onChange={handleTabChange} />
				<div className={styles.main}>{pageComponents[activeKey] || <Profile />}</div>
			</div>
		</div>
	)
}

export default Settings
