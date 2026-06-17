import clsx from 'clsx'
import Icon from '@/widgets/Icon'
import type { InboxCategory } from '../../types'
import { useInboxContext } from '../../context'
import styles from './index.less'

interface CategoryItem {
	key: InboxCategory
	icon: string
	cn: string
	en: string
}

const CATEGORIES: CategoryItem[] = [
	{ key: 'all', icon: 'material-inbox', cn: '全部', en: 'All' },
	{ key: 'task_interaction', icon: 'material-mark_chat_unread', cn: '任务交互', en: 'Interactions' },
	{ key: 'task_notification', icon: 'material-assignment_turned_in', cn: '任务通知', en: 'Notifications' },
	{ key: 'task_failed', icon: 'material-assignment_late', cn: '任务失败', en: 'Failed' },
	{ key: 'archived', icon: 'material-archive', cn: '已归档', en: 'Archived' }
]

const Sidebar = () => {
	const { is_cn, category, setCategory, categoryCountMap } = useInboxContext()

	return (
		<div className={styles.sidebar}>
			<div className={styles.header}>
				<Icon name='material-inbox' size={18} className={styles.headerIcon} />
				<span className={styles.headerTitle}>{is_cn ? '收件箱' : 'Inbox'}</span>
			</div>

			<div className={styles.categories}>
				{CATEGORIES.map((item, idx) => {
					const isActive = category === item.key
					const count = categoryCountMap[item.key] || 0
					const showDivider = item.key === 'all' || item.key === 'task_failed'

					return (
						<div key={item.key}>
							<div
								className={clsx(styles.categoryItem, isActive && styles.active)}
								onClick={() => setCategory(item.key)}
							>
								<span className={styles.itemIcon}>
									<Icon name={item.icon} size={18} />
								</span>
								<span className={styles.itemLabel}>{is_cn ? item.cn : item.en}</span>
								{count > 0 && <span className={styles.itemCount}>{count}</span>}
							</div>
							{showDivider && idx < CATEGORIES.length - 1 && <div className={styles.divider} />}
						</div>
					)
				})}
			</div>
		</div>
	)
}

export default window.$app.memo(Sidebar)
