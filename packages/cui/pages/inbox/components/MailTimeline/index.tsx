import { useState, useEffect, useCallback, useRef } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { InboxMessage } from '../../types'
import { services } from '../../services'
import styles from './index.less'

interface MailTimelineProps {
	chatId: string
}

function getTypeLabel(type: string, is_cn: boolean): string {
	if (type === 'completed') return is_cn ? '任务完成' : 'Completed'
	if (type === 'failed') return is_cn ? '任务失败' : 'Failed'
	return is_cn ? '等待输入' : 'Waiting for Input'
}

function getTypeIcon(type: string): { icon: string; color: string } {
	if (type === 'completed') return { icon: 'material-check_circle', color: 'var(--color_success)' }
	if (type === 'failed') return { icon: 'material-error', color: 'var(--color_warning)' }
	return { icon: 'material-chat_bubble_outline', color: 'var(--color_main)' }
}

function formatTime(ts: number): string {
	const d = new Date(ts)
	const now = new Date()
	const isToday = d.toDateString() === now.toDateString()
	const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	if (isToday) return time
	return `${d.getMonth() + 1}/${d.getDate()} ${time}`
}

const MailTimeline = ({ chatId }: MailTimelineProps) => {
	const is_cn = getLocale() === 'zh-CN'
	const [mails, setMails] = useState<InboxMessage[]>([])
	const [loading, setLoading] = useState(true)
	const [hasMore, setHasMore] = useState(false)
	const [page, setPage] = useState(1)
	const [loadingMore, setLoadingMore] = useState(false)
	const listRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		setLoading(true)
		setPage(1)
		services.getMessages({ chat_id: chatId, size: 50 }).then(({ items, total }) => {
			items.sort((a, b) => a.created_at - b.created_at)
			setMails(items)
			setHasMore(items.length < total)
			setLoading(false)
		}).catch(() => {
			setLoading(false)
		})
	}, [chatId])

	const loadMore = useCallback(() => {
		if (loadingMore || !hasMore) return
		const nextPage = page + 1
		setLoadingMore(true)
		services.getMessages({ chat_id: chatId, page: nextPage, size: 50 }).then(({ items, total }) => {
			setMails((prev) => {
				const existingIds = new Set(prev.map((m) => m.id))
				const newItems = items.filter((m) => !existingIds.has(m.id))
				const all = [...prev, ...newItems]
				all.sort((a, b) => a.created_at - b.created_at)
				return all
			})
			setPage(nextPage)
			setHasMore(nextPage * 50 < total)
			setLoadingMore(false)
		}).catch(() => {
			setLoadingMore(false)
		})
	}, [loadingMore, hasMore, page, chatId])

	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		const target = e.currentTarget
		if (target.scrollTop + target.clientHeight >= target.scrollHeight - 50) {
			loadMore()
		}
	}, [loadMore])

	if (loading) {
		return (
			<div className={styles.container}>
				<div className={styles.loadingState}>
					<Icon name='material-hourglass_empty' size={20} />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<div className={styles.headerInfo}>
					<Icon name='material-history' size={18} className={styles.headerIcon} />
					<span className={styles.headerTitle}>{is_cn ? '消息往来' : 'Mail History'}</span>
					<span className={styles.headerCount}>({mails.length})</span>
				</div>
			</div>

			<div className={styles.timeline} ref={listRef} onScroll={handleScroll}>
				{mails.length === 0 ? (
					<div className={styles.emptyState}>
						<span>{is_cn ? '暂无消息记录' : 'No mail history'}</span>
					</div>
				) : (
					mails.map((mail, idx) => {
						const config = getTypeIcon(mail.type)
						const isLast = idx === mails.length - 1

						return (
							<div key={mail.id} className={styles.timelineItem}>
								<div className={styles.timelineLine}>
									<span className={styles.timelineDot} style={{ borderColor: config.color }}>
										<Icon name={config.icon} size={12} style={{ color: config.color }} />
									</span>
									{!isLast && <span className={styles.timelineConnector} />}
								</div>
								<div className={styles.timelineContent}>
									<div className={styles.timelineHeader}>
										<span className={styles.typeLabel}>{getTypeLabel(mail.type, is_cn)}</span>
										<span className={styles.timelineTime}>{formatTime(mail.created_at)}</span>
									</div>
									<div className={styles.timelineTitle}>{mail.title}</div>
									{mail.body && <div className={styles.timelineBody}>{mail.body}</div>}
								</div>
							</div>
						)
					})
				)}
				{loadingMore && (
					<div className={styles.loadingMore}>
						<Icon name='material-hourglass_empty' size={14} />
						<span>{is_cn ? '加载中...' : 'Loading...'}</span>
					</div>
				)}
			</div>
		</div>
	)
}

export default MailTimeline
