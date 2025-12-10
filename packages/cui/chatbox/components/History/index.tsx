import React, { useState, useEffect, useCallback, useRef } from 'react'
import clsx from 'clsx'
import { getLocale } from '@umijs/max'
import Icon from '../../../widgets/Icon'
import { Chat } from '../../../openapi'
import type { ChatGroup, ChatSession } from '../../../openapi/chat/types'
import type { IHistoryProps } from '../../types'
import styles from './index.less'

// Group label translations
const GROUP_LABELS: Record<string, { en: string; cn: string }> = {
	today: { en: 'Today', cn: '今天' },
	yesterday: { en: 'Yesterday', cn: '昨天' },
	this_week: { en: 'This Week', cn: '本周' },
	this_month: { en: 'This Month', cn: '本月' },
	earlier: { en: 'Earlier', cn: '更早' }
}

/**
 * History 组件 - 历史会话侧边栏
 * 从左侧推拉展开，显示分组的历史会话列表
 */
const History = (props: IHistoryProps) => {
	const { open, activeTabId, overlay, onSelect, onDelete, onClose } = props

	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// State
	const [groups, setGroups] = useState<ChatGroup[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [keywords, setKeywords] = useState('')
	const [searchInput, setSearchInput] = useState('')

	// Refs
	const searchTimerRef = useRef<NodeJS.Timeout>()
	const chatClientRef = useRef<Chat | null>(null)

	// Initialize chat client
	useEffect(() => {
		if (window.$app?.openapi) {
			chatClientRef.current = new Chat(window.$app.openapi)
		}
	}, [])

	// Fetch sessions when sidebar opens or keywords change
	const fetchSessions = useCallback(async () => {
		// Check if client is available
		if (!chatClientRef.current) {
			setError(is_cn ? '服务未初始化' : 'Service not initialized')
			setLoading(false)
			return
		}

		setLoading(true)
		setError(null)
		try {
			const result = await chatClientRef.current.ListSessions({
				group_by: 'time',
				keywords: keywords || undefined,
				order_by: 'last_message_at',
				order: 'desc',
				pagesize: 100
			})
			setGroups(result.groups || [])
			setLoading(false)
		} catch (err: any) {
			console.error('Failed to fetch sessions:', err)
			// Parse error message for better user feedback
			const errMsg = err?.message || ''
			if (errMsg.includes('403') || errMsg.includes('Forbidden')) {
				setError(is_cn ? '无访问权限' : 'Access denied')
			} else if (errMsg.includes('401') || errMsg.includes('Unauthorized')) {
				setError(is_cn ? '请先登录' : 'Please login first')
			} else {
				setError(is_cn ? '加载失败，请重试' : 'Failed to load, please retry')
			}
			setGroups([])
			setLoading(false)
		}
	}, [keywords, is_cn])

	// Fetch when opened
	useEffect(() => {
		if (open) {
			fetchSessions()
		}
	}, [open, fetchSessions])

	// Listen for history refresh events (triggered when new chat title is saved)
	useEffect(() => {
		const handleRefresh = () => {
			if (open && chatClientRef.current) {
				fetchSessions()
			}
		}

		if (window.$app?.Event) {
			window.$app.Event.on('chat/historyRefresh', handleRefresh)
		}

		return () => {
			if (window.$app?.Event) {
				window.$app.Event.off('chat/historyRefresh', handleRefresh)
			}
		}
	}, [open, fetchSessions])

	// Debounced search
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		setSearchInput(value)

		// Clear previous timer
		if (searchTimerRef.current) {
			clearTimeout(searchTimerRef.current)
		}

		// Debounce search
		searchTimerRef.current = setTimeout(() => {
			setKeywords(value)
		}, 300)
	}

	// Clear search
	const handleClearSearch = () => {
		setSearchInput('')
		setKeywords('')
	}

	// Get localized group label
	const getGroupLabel = (key: string, label: string) => {
		const labels = GROUP_LABELS[key]
		if (labels) {
			return is_cn ? labels.cn : labels.en
		}
		return label
	}

	// Delete session
	const handleDelete = useCallback(
		async (e: React.MouseEvent, chatId: string) => {
			e.stopPropagation() // Prevent triggering onSelect

			if (!chatClientRef.current) return

			try {
				await chatClientRef.current.DeleteSession(chatId)
				// Remove from local state
				setGroups((prev) =>
					prev
						.map((group) => ({
							...group,
							chats: group.chats.filter((chat) => chat.chat_id !== chatId),
							count: group.chats.filter((chat) => chat.chat_id !== chatId).length
						}))
						.filter((group) => group.chats.length > 0)
				)
				// Close tab if open
				onDelete?.(chatId)
			} catch (err) {
				console.error('Failed to delete session:', err)
			}
		},
		[onDelete]
	)

	return (
		<>
			{/* Overlay backdrop - only in overlay mode */}
			{overlay && open && <div className={styles.backdrop} onClick={onClose} />}

			<div className={clsx(styles.sidebar, open && styles.open, overlay && styles.overlay)}>
				<div className={styles.content}>
					{/* Header with title */}
					<div className={styles.header}>
						<span className={styles.title}>{is_cn ? '历史记录' : 'History'}</span>
					</div>

					{/* Search box */}
					<div className={styles.search}>
						<Icon name='material-search' size={16} className={styles.searchIcon} />
						<input
							type='text'
							className={styles.searchInput}
							placeholder={is_cn ? '搜索...' : 'Search...'}
							value={searchInput}
							onChange={handleSearchChange}
						/>
						{searchInput && (
							<div className={styles.clearBtn} onClick={handleClearSearch}>
								<Icon name='material-close' size={14} />
							</div>
						)}
					</div>

					{/* Session list */}
					<div className={styles.list}>
						{loading && (
							<div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
						)}

						{!loading && error && (
							<div className={styles.error} onClick={fetchSessions}>
								<span>{error}</span>
								<Icon name='material-refresh' size={14} className={styles.retryIcon} />
							</div>
						)}

						{!loading &&
							!error &&
							groups.map((group) => (
								<div key={group.key} className={styles.group}>
									<div className={styles.groupLabel}>
										{getGroupLabel(group.key, group.label)}
									</div>
									{group.chats.map((session: ChatSession) => {
										const title =
											session.title || (is_cn ? '无标题' : 'Untitled')
										const isActive = session.chat_id === activeTabId
										return (
											<div
												key={session.chat_id}
												className={clsx(
													styles.item,
													isActive && styles.active
												)}
												onClick={() => onSelect(session.chat_id)}
												title={title}
											>
												<span className={styles.itemTitle}>
													{title}
												</span>
												<div
													className={styles.deleteBtn}
													onClick={(e) =>
														handleDelete(e, session.chat_id)
													}
													title={is_cn ? '删除' : 'Delete'}
												>
													<Icon
														name='material-delete_outline'
														size={14}
													/>
												</div>
											</div>
										)
									})}
								</div>
							))}

						{!loading && !error && groups.length === 0 && (
							<div className={styles.empty}>
								{keywords
									? is_cn
										? '未找到匹配的会话'
										: 'No matching chats'
									: is_cn
									? '暂无历史记录'
									: 'No history yet'}
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	)
}

export default History
