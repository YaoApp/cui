import { useState } from 'react'
import Icon from '@/widgets/Icon'
import { useInboxContext } from '../../context'
import type { InboxCategory, InboxMessage } from '../../types'
import MessageItem from './MessageItem'
import MessageContextMenu, { type ContextMenuState } from '../MessageContextMenu'
import styles from './index.less'

const CATEGORY_LABELS: Record<InboxCategory, { cn: string; en: string }> = {
	all: { cn: '全部', en: 'All' },
	starred: { cn: '收藏', en: 'Starred' },
	task_interaction: { cn: '任务交互', en: 'Interactions' },
	task_notification: { cn: '任务通知', en: 'Notifications' },
	task_failed: { cn: '任务失败', en: 'Failed' },
	archived: { cn: '已归档', en: 'Archived' }
}

const MessageList = () => {
	const { filteredMessages, selectedMessageId, selectMessage, is_cn, category, unreadCount, searchKeyword, setSearchKeyword, markAllRead, toggleStar } = useInboxContext()
	const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

	const categoryLabel = CATEGORY_LABELS[category]

	const handleContextMenu = (e: React.MouseEvent, message: InboxMessage) => {
		e.preventDefault()
		setContextMenu({ message, x: e.clientX, y: e.clientY })
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<span className={styles.title}>
					{is_cn ? categoryLabel.cn : categoryLabel.en}
					{unreadCount > 0 && category === 'all' && <span className={styles.badge}>({unreadCount})</span>}
				</span>
				<span className={styles.headerAction} onClick={markAllRead} title={is_cn ? '全部已读' : 'Mark all read'}>
					<Icon name='material-done_all' size={14} />
				</span>
			</div>

			<div className={styles.searchBox}>
				<Icon name='material-search' size={15} className={styles.searchIcon} />
				<input
					type='text'
					placeholder={is_cn ? '搜索消息...' : 'Search...'}
					value={searchKeyword}
					onChange={(e) => setSearchKeyword(e.target.value)}
				/>
			</div>

			<div className={styles.list}>
				{filteredMessages.length === 0 ? (
					<div className={styles.empty}>
						<span>{is_cn ? '暂无消息' : 'No messages'}</span>
					</div>
				) : (
					filteredMessages.map((msg) => (
						<MessageItem
							key={msg.id}
							message={msg}
							selected={msg.id === selectedMessageId}
							is_cn={is_cn}
							onClick={() => selectMessage(msg.id)}
							onToggleStar={() => toggleStar(msg.id)}
							onContextMenu={(e) => handleContextMenu(e, msg)}
						/>
					))
				)}
			</div>

			{contextMenu && (
				<MessageContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />
			)}
		</div>
	)
}

export default window.$app.memo(MessageList)
