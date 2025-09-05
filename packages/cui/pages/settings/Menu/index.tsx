import { useEffect, useState } from 'react'
import { Avatar, Button, Spin, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { mockApi, MenuItem, User } from '../mockData'
import styles from './index.less'

interface MenuProps {
	active: string
	onChange: (key: string) => void
}

const Menu = ({ active, onChange }: MenuProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [user, setUser] = useState<User | null>(null)
	const [items, setItems] = useState<MenuItem[]>([])

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
						<div className={styles.logoutBtn}>
							<Tooltip title={is_cn ? '退出' : 'Exit'} placement='right'>
								<Button
									type='text'
									size='small'
									icon={<Icon name='material-logout' size={14} />}
									onClick={() => {
										// TODO: 实现退出登录逻辑
										console.log('Logout clicked')
									}}
								/>
							</Tooltip>
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
		</div>
	)
}

export default Menu
