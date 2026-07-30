import clsx from 'clsx'
import Icon from '@/widgets/Icon'
import type { InboxMessage } from '../../types'
import styles from './index.less'

interface MessageItemProps {
	message: InboxMessage
	selected: boolean
	is_cn: boolean
	onClick: () => void
	onToggleBookmark: () => void
	onContextMenu: (e: React.MouseEvent) => void
}

function formatTimeAgo(ts: number, is_cn: boolean): string {
	const diff = Date.now() - ts
	const mins = Math.floor(diff / 60_000)
	if (mins < 1) return is_cn ? '刚刚' : 'Just now'
	if (mins < 60) return `${mins}m ago`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours}h ago`
	const days = Math.floor(hours / 24)
	return `${days}d ago`
}

function getTypeConfig(message: InboxMessage): { icon: string; color: string } {
	if (message.type === 'completed') return { icon: 'material-assignment_turned_in', color: 'var(--color_success)' }
	if (message.type === 'failed') return { icon: 'material-assignment_late', color: 'var(--color_warning)' }
	const readIcon = message.has_unread ? 'material-mark_chat_unread' : 'material-chat_bubble_outline'
	if (message.priority === 'high') return { icon: readIcon, color: 'var(--color_main)' }
	return { icon: readIcon, color: 'var(--color_neo_text_tertiary)' }
}

const MessageItem = ({ message, selected, is_cn, onClick, onToggleBookmark, onContextMenu }: MessageItemProps) => {
	const config = getTypeConfig(message)

	const handleBookmarkClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		onToggleBookmark()
	}

	return (
		<div
			className={clsx(styles.messageItem, selected && styles.selected, message.has_unread && styles.unread)}
			onClick={onClick}
			onContextMenu={onContextMenu}
		>
			<div className={styles.itemHeader}>
				<span className={styles.typeIcon} style={{ color: config.color }}>
					<Icon name={config.icon} size={16} />
				</span>
				{message.inbox_pinned && (
					<span className={styles.pinIndicator}>
						<Icon name='material-push_pin' size={13} />
					</span>
				)}
				<span className={styles.itemTitle}>{message.title}</span>
				<span
					className={clsx(styles.starBtn, message.bookmarked && styles.starred)}
					onClick={handleBookmarkClick}
				>
					<Icon name={message.bookmarked ? 'material-star' : 'material-star_outline'} size={15} />
				</span>
				<span className={styles.itemTime}>{formatTimeAgo(message.created_at, is_cn)}</span>
			</div>
			<div className={styles.itemBody}>{message.body}</div>
		</div>
	)
}

export default MessageItem
