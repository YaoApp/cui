import { useRef, useState, useEffect, useCallback } from 'react'
import { getLocale } from '@umijs/max'
import { Tooltip } from 'antd'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface DetailMenuProps {
	active: string
	onChange: (key: string) => void
}

interface MenuItem {
	key: string
	icon: string
	label: Record<string, string>
}

interface MenuGroup {
	key: string
	label: Record<string, string>
	items: MenuItem[]
}

const MENU_GROUPS: MenuGroup[] = [
	{
		key: 'config',
		label: { 'zh-CN': '', 'en-US': '' },
		items: [
			{ key: 'overview', icon: 'material-info', label: { 'zh-CN': '通用', 'en-US': 'General' } },
			{ key: 'skills', icon: 'material-auto_fix_high', label: { 'zh-CN': '技能', 'en-US': 'Skills' } },
			{ key: 'secrets', icon: 'material-key', label: { 'zh-CN': '密钥', 'en-US': 'Secrets' } },
			{ key: 'sandbox', icon: 'material-computer', label: { 'zh-CN': '沙箱', 'en-US': 'Sandbox' } },
			{ key: 'computer', icon: 'material-desktop_windows', label: { 'zh-CN': '电脑', 'en-US': 'Computer' } },
			{ key: 'schedule', icon: 'material-schedule', label: { 'zh-CN': '定时', 'en-US': 'Schedule' } }
		]
	}
]

const DetailMenu = ({ active, onChange }: DetailMenuProps) => {
	const locale = getLocale()
	const lang = locale === 'zh-CN' ? 'zh-CN' : 'en-US'

	const menuRef = useRef<HTMLDivElement>(null)
	const [collapsed, setCollapsed] = useState(false)

	const checkWidth = useCallback(() => {
		const scrollWrap = menuRef.current?.closest('[class*="scrollWrap"]') as HTMLElement | null
		if (!scrollWrap) return
		setCollapsed(scrollWrap.clientWidth < 680)
	}, [])

	useEffect(() => {
		checkWidth()
		const ro = new ResizeObserver(checkWidth)
		const scrollWrap = menuRef.current?.closest('[class*="scrollWrap"]') as HTMLElement | null
		if (scrollWrap) ro.observe(scrollWrap)
		return () => ro.disconnect()
	}, [checkWidth])

	return (
		<div ref={menuRef} className={`${styles.menu} ${collapsed ? styles.collapsed : ''}`}>
			<div className={styles.menuInner}>
				<div className={styles.menuContent}>
					{MENU_GROUPS.map((group) => (
						<div key={group.key} className={styles.group}>
							{group.label[lang] && (
								<div className={styles.groupTitle}>{group.label[lang]}</div>
							)}
							<div className={styles.items}>
								{group.items.map((item) => (
									<Tooltip
										key={item.key}
										title={collapsed ? item.label[lang] : ''}
										placement='left'
									>
										<div
											className={`${styles.item} ${active === item.key ? styles.active : ''}`}
											onClick={() => onChange(item.key)}
										>
											<Icon
												name={item.icon}
												size={16}
												className={active === item.key ? styles.iconActive : styles.icon}
											/>
											<span className={styles.text}>{item.label[lang]}</span>
										</div>
									</Tooltip>
								))}
							</div>
						</div>
					))}
				</div>

			</div>
		</div>
	)
}

export default DetailMenu
