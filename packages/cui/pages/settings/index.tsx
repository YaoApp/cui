import { useState } from 'react'
import { getLocale } from '@umijs/max'
import Menu from './Menu'
import Profile from './Profile'
import ApiSdk from './ApiSdk'
import Usage from './Usage'
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
	const [activeKey, setActiveKey] = useState('profile')

	// 页面组件映射
	const pageComponents: Record<string, React.ReactNode> = {
		// Profile 分组
		profile: <Profile />,
		'api-sdk': <ApiSdk />,
		team: <ComingSoon title={is_cn ? '团队' : 'Team'} />,
		advanced: <ComingSoon title={is_cn ? '高级' : 'Advanced'} />,
		// Plan 分组
		plans: <ComingSoon title={is_cn ? '套餐与价格' : 'Plans & Pricing'} />,
		subscription: <ComingSoon title={is_cn ? '订阅管理' : 'Subscription'} />,
		usage: <Usage />,
		billing: <ComingSoon title={is_cn ? '付款和发票' : 'Payment & Invoices'} />,
		// Connectors 分组
		connectors: <ComingSoon title={is_cn ? '连接器' : 'Connectors'} />,
		// MCP 分组
		'mcp-servers': <ComingSoon title={is_cn ? 'MCP 服务器' : 'MCP Servers'} />,
		// Security 分组
		security: <ComingSoon title={is_cn ? '账号安全' : 'Account Security'} />,
		privacy: <ComingSoon title={is_cn ? '隐私设置' : 'Privacy'} />,
		'audit-logs': <ComingSoon title={is_cn ? '审计日志' : 'Audit Logs'} />,
		// Support 分组
		docs: <ComingSoon title={is_cn ? '文档' : 'Documentation'} />,
		contact: <ComingSoon title={is_cn ? '联系' : 'Contact'} />
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
				<Menu active={activeKey} onChange={setActiveKey} />
				<div className={styles.main}>{pageComponents[activeKey] || <Profile />}</div>
			</div>
		</div>
	)
}

export default Settings
