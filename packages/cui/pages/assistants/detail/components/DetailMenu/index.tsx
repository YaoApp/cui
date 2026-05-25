import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface DetailMenuProps {
	active: string
	onChange: (key: string) => void
	onBack?: () => void
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
		key: 'overview',
		label: { 'zh-CN': '', 'en-US': '' },
		items: [{ key: 'overview', icon: 'material-info', label: { 'zh-CN': '概览', 'en-US': 'Overview' } }]
	},
	{
		key: 'config',
		label: { 'zh-CN': '设置', 'en-US': 'SETTINGS' },
		items: [
			{ key: 'skills', icon: 'material-auto_fix_high', label: { 'zh-CN': '技能', 'en-US': 'Skills' } },
			{ key: 'secrets', icon: 'material-key', label: { 'zh-CN': '密钥', 'en-US': 'Secrets' } },
			{ key: 'sandbox', icon: 'material-computer', label: { 'zh-CN': '沙箱', 'en-US': 'Sandbox' } }
		]
	},
	{
		key: 'developer',
		label: { 'zh-CN': '开发', 'en-US': 'DEVELOPER' },
		items: [
			{ key: 'integrations', icon: 'material-code', label: { 'zh-CN': '集成', 'en-US': 'Integrations' } }
		]
	}
]

const DetailMenu = ({ active, onChange, onBack }: DetailMenuProps) => {
	const locale = getLocale()
	const lang = locale === 'zh-CN' ? 'zh-CN' : 'en-US'

	return (
		<div className={styles.menu}>
			<div className={styles.menuInner}>
				<div className={styles.menuContent}>
				{MENU_GROUPS.map((group) => (
					<div key={group.key} className={styles.group}>
						{group.label[lang] && (
							<div className={styles.groupTitle}>{group.label[lang]}</div>
						)}
						<div className={styles.items}>
								{group.items.map((item) => (
									<div
										key={item.key}
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
								))}
							</div>
					</div>
				))}
				</div>

				{onBack && (
					<div className={styles.backItem} onClick={onBack}>
						<Icon name='material-arrow_back' size={14} className={styles.icon} />
						<span className={styles.text}>{lang === 'zh-CN' ? '返回列表' : 'Back to list'}</span>
					</div>
				)}
			</div>
		</div>
	)
}

export default DetailMenu
