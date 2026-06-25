import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import Icon from '@/widgets/Icon'
import { useInboxContext, type InboxGroup } from '../../context'
import type { InboxCategory } from '../../types'
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

function getGroupIcon(group: InboxGroup): { icon: string; color: string } {
	const m = group.latestMail
	const hasUnread = group.unreadCount > 0

	if (m.type === 'completed') {
		return { icon: 'material-assignment_turned_in', color: hasUnread ? 'var(--color_success)' : 'var(--color_neo_text_tertiary)' }
	}
	if (m.type === 'failed') {
		return { icon: 'material-assignment_late', color: hasUnread ? 'var(--color_warning)' : 'var(--color_neo_text_tertiary)' }
	}
	const icon = hasUnread ? 'material-mark_chat_unread' : 'material-chat_bubble_outline'
	const color = hasUnread ? 'var(--color_main)' : 'var(--color_neo_text_tertiary)'
	return { icon, color }
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

interface MessageListProps {
	onUnarchive?: (chatId: string) => void
}

const MessageList = ({ onUnarchive }: MessageListProps) => {
	const { groupedMessages, selectedChatId, selectChatGroup, is_cn, category, unreadCount, searchKeyword, setSearchKeyword, markAllRead, toggleStar, loadMore, hasMore, loading, loadingMore } = useInboxContext()
	const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
	const listRef = useRef<HTMLDivElement>(null)

	const categoryLabel = CATEGORY_LABELS[category]

	const handleScroll = useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			if (!hasMore || loadingMore) return
			const el = e.currentTarget
			if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
				loadMore()
			}
		},
		[hasMore, loadingMore, loadMore]
	)

	useEffect(() => {
		if (!hasMore || loading || loadingMore) return
		const el = listRef.current
		if (!el) return
		const raf = requestAnimationFrame(() => {
			if (el.scrollHeight <= el.clientHeight) {
				loadMore()
			}
		})
		return () => cancelAnimationFrame(raf)
	}, [groupedMessages.length, hasMore, loading, loadingMore, loadMore])

	const handleContextMenu = useCallback((e: React.MouseEvent, group: InboxGroup) => {
		e.preventDefault()
		setContextMenu({ group, x: e.clientX, y: e.clientY })
	}, [])

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

		<div ref={listRef} className={styles.list} onScroll={handleScroll}>
			{loading ? (
				<div className={styles.loadingMore}>
					<Icon name='material-refresh' size={14} className={styles.spinner} />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			) : groupedMessages.length === 0 ? (
				<div className={styles.empty}>
					<span>{is_cn ? '暂无消息' : 'No messages'}</span>
				</div>
			) : (
				<>
					{groupedMessages.map((group) => {
						const config = getGroupIcon(group)
						const isSelected = group.chat_id === selectedChatId
						const hasUnread = group.unreadCount > 0

						return (
							<div
								key={group.chat_id}
								className={clsx(styles.messageItem, isSelected && styles.selected, hasUnread && styles.unread)}
								onClick={() => selectChatGroup(group.chat_id)}
								onContextMenu={(e) => handleContextMenu(e, group)}
							>
								<div className={styles.itemHeader}>
								<span className={styles.typeIcon} style={{ color: config.color }}>
									<Icon name={config.icon} size={16} />
								</span>
								{group.latestMail.pinned && (
									<span className={styles.pinIndicator}>
										<Icon name='material-push_pin' size={13} />
									</span>
								)}
								<span className={styles.itemTitle}>{group.taskName || group.title}</span>
								{hasUnread && <span className={styles.unreadDot} />}
								<span
									className={clsx(styles.starBtn, group.latestMail.starred && styles.starred)}
									onClick={(e) => { e.stopPropagation(); toggleStar(group.latestMail.id) }}
								>
									<Icon name={group.latestMail.starred ? 'material-star' : 'material-star_outline'} size={15} />
								</span>
								<span className={styles.itemTime}>{formatTimeAgo(group.latestTime, is_cn)}</span>
							</div>
							<div className={styles.itemBody}>{group.latestMail.body}</div>
							</div>
						)
					})}
					{loadingMore && (
						<div className={styles.loadingMore}>
							<Icon name='material-refresh' size={14} className={styles.spinner} />
							<span>{is_cn ? '加载更多...' : 'Loading more...'}</span>
						</div>
					)}
				</>
			)}
		</div>

			{contextMenu && (
				<MessageContextMenu
					menu={contextMenu}
					category={category}
					onClose={() => setContextMenu(null)}
					onUnarchive={onUnarchive}
				/>
			)}
		</div>
	)
}

export default window.$app.memo(MessageList)
