import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { getLocale } from '@umijs/max'
import type { InboxMessage, InboxCategory, InboxStatsData } from './types'
import { services } from './services'
import { getEventStream } from '@/openapi/events'

export interface InboxGroup {
	chat_id: string
	title: string
	taskName: string
	latestMail: InboxMessage
	hasUnread: boolean
	bookmarked: boolean
	inboxPinned: boolean
	totalCount: number
	latestTime: number
}

interface InboxContextValue {
	messages: InboxMessage[]
	groupedMessages: InboxGroup[]
	loading: boolean
	loadingMore: boolean
	is_cn: boolean
	category: InboxCategory
	setCategory: (c: InboxCategory) => void
	selectedChatId: string | null
	selectChatGroup: (chatId: string) => void
	searchKeyword: string
	setSearchKeyword: (k: string) => void
	unreadCount: number
	stats: InboxStatsData | null
	markAllRead: () => void
	archiveGroup: (chatId: string) => void
	unarchiveGroup: (chatId: string, columnId: string) => void
	deleteGroup: (chatId: string) => void
	toggleBookmark: (chatId: string) => void
	togglePin: (chatId: string) => void
	sidebarCollapsed: boolean
	setSidebarCollapsed: (v: boolean) => void
	loadMore: () => void
	hasMore: boolean
	taskVersion: number
}

const InboxContext = createContext<InboxContextValue | null>(null)

export function useInboxContext() {
	const ctx = useContext(InboxContext)
	if (!ctx) throw new Error('useInboxContext must be used within InboxProvider')
	return ctx
}

const PAGE_SIZE = 20

const categoryToFilter: Record<InboxCategory, string> = {
	all: 'all',
	bookmarked: 'bookmarked',
	task_interaction: 'input',
	task_notification: 'completed',
	task_failed: 'failed',
	archived: 'archived'
}

export function InboxProvider({ children }: { children: React.ReactNode }) {
	const is_cn = useMemo(() => getLocale() === 'zh-CN', [])
	const [messages, setMessages] = useState<InboxMessage[]>([])
	const [loading, setLoading] = useState(false)
	const [loadingMore, setLoadingMore] = useState(false)
	const [category, setCategoryState] = useState<InboxCategory>('all')
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
	const [searchKeyword, setSearchKeyword] = useState('')
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
	const [stats, setStats] = useState<InboxStatsData | null>(null)
	const [total, setTotal] = useState(0)
	const [taskVersion, setTaskVersion] = useState(0)
	const refreshTimerRef = useRef<number>()
	const fetchingRef = useRef(false)
	const fetchVersionRef = useRef(0)
	const pageRef = useRef(1)
	const selectedChatIdRef = useRef<string | null>(null)
	selectedChatIdRef.current = selectedChatId

	const fetchStats = useCallback(() => {
		services
			.getStats()
			.then(setStats)
			.catch(() => {})
	}, [])

	const fetchMessages = useCallback(
		(cat: InboxCategory, p: number, append = false, force = false) => {
			if (fetchingRef.current && !force) {
				return
			}
			fetchingRef.current = true
			const version = ++fetchVersionRef.current
			const filter = categoryToFilter[cat]
			if (append) {
				setLoadingMore(true)
			} else {
				setLoading(true)
			}
			services
				.getMessages({ filter, page: p, size: PAGE_SIZE })
				.then(({ items, total: t }) => {
					if (fetchVersionRef.current !== version) return
					setMessages((prev) => (append ? [...prev, ...items] : items))
					setTotal(t)
					pageRef.current = p
				})
				.catch((err: any) => {
					if (fetchVersionRef.current !== version) return
					window.$app?.Event?.emit('app/toast', {
						type: 'error',
						message: err?.message || (is_cn ? '加载消息失败' : 'Failed to load messages')
					})
				})
				.finally(() => {
					if (fetchVersionRef.current === version) {
						fetchingRef.current = false
					}
					setLoading(false)
					setLoadingMore(false)
				})
		},
		[is_cn]
	)

	useEffect(() => {
		fetchStats()
		fetchMessages(category, 1)
	}, [])

	useEffect(() => {
		const stream = getEventStream()
		const unsub = stream.subscribe('task.updated', (data: any) => {
			if (data?.chat_id && data.chat_id === selectedChatIdRef.current) {
				if (data.outputs) setTaskVersion((v) => v + 1)
			}
			clearTimeout(refreshTimerRef.current)
			refreshTimerRef.current = window.setTimeout(() => {
				if (fetchingRef.current) return
				fetchStats()
				fetchMessages(category, 1, false, true)
			}, 2000)
		})
		return () => {
			unsub()
			clearTimeout(refreshTimerRef.current)
		}
	}, [category, fetchMessages, fetchStats])

	const setCategory = useCallback(
		(c: InboxCategory) => {
			setCategoryState(c)
			setSelectedChatId(null)
			fetchMessages(c, 1, false, true)
		},
		[fetchMessages]
	)

	const loadMore = useCallback(() => {
		if (fetchingRef.current || messages.length >= total) return
		fetchMessages(category, pageRef.current + 1, true)
	}, [messages.length, total, category, fetchMessages])

	const hasMore = messages.length < total

	// Each message from the API represents one task group (1:1 mapping)
	const groupedMessages = useMemo(() => {
		const filtered = searchKeyword.trim()
			? messages.filter((m) => {
					const kw = searchKeyword.toLowerCase()
					return m.title.toLowerCase().includes(kw) || m.body.toLowerCase().includes(kw)
			  })
			: messages

		return filtered.map((m) => ({
			chat_id: m.chat_id || m.id,
			title: m.title,
			taskName: m.source?.task_title || '',
			latestMail: m,
			hasUnread: m.has_unread,
			bookmarked: m.bookmarked,
			inboxPinned: m.inbox_pinned,
			totalCount: 1,
			latestTime: m.created_at
		}))
	}, [messages, searchKeyword])

	const unreadCount = useMemo(() => messages.filter((m) => m.has_unread).length, [messages])

	const selectChatGroup = useCallback(
		(chatId: string) => {
			setSelectedChatId(chatId || null)
			if (!chatId) return

			const msg = messages.find((m) => m.chat_id === chatId)
			if (!msg || !msg.has_unread) return

			// Optimistically mark as read
			setMessages((prev) =>
				prev.map((m) => (m.chat_id === chatId ? { ...m, has_unread: false, inbox_read_at: Date.now() } : m))
			)

			services
				.viewTask(chatId)
				.then(() => fetchStats())
				.catch(() => {
					setMessages((prev) =>
						prev.map((m) => (m.chat_id === chatId ? { ...m, has_unread: true, inbox_read_at: undefined } : m))
					)
				})
		},
		[messages, fetchStats]
	)

	const markAllRead = useCallback(() => {
		const unreadChatIds = messages.filter((m) => m.has_unread).map((m) => m.chat_id)
		if (unreadChatIds.length === 0) return

		setMessages((prev) => prev.map((m) => (m.has_unread ? { ...m, has_unread: false, inbox_read_at: Date.now() } : m)))
		services
			.markAllRead()
			.then(() => fetchStats())
			.catch((err: any) => {
				setMessages((prev) =>
					prev.map((m) =>
						unreadChatIds.includes(m.chat_id) ? { ...m, has_unread: true, inbox_read_at: undefined } : m
					)
				)
				window.$app?.Event?.emit('app/toast', {
					type: 'error',
					message: err?.message || (is_cn ? '标记全部已读失败' : 'Failed to mark all as read')
				})
			})
	}, [messages, is_cn, fetchStats])

	const archiveGroup = useCallback(
		(chatId: string) => {
			setMessages((prev) => prev.filter((m) => m.chat_id !== chatId))
			if (selectedChatId === chatId) setSelectedChatId(null)
			services
				.archiveTask(chatId)
				.then(() => fetchStats())
				.catch((err: any) => {
					fetchMessages(category, 1, false, true)
					window.$app?.Event?.emit('app/toast', {
						type: 'error',
						message: err?.message || (is_cn ? '归档失败' : 'Failed to archive')
					})
				})
		},
		[selectedChatId, category, fetchMessages, fetchStats, is_cn]
	)

	const unarchiveGroup = useCallback(
		(chatId: string, columnId: string) => {
			setMessages((prev) => prev.filter((m) => m.chat_id !== chatId))
			if (selectedChatId === chatId) setSelectedChatId(null)
			services
				.unarchiveTask(chatId, columnId)
				.then(() => fetchStats())
				.catch((err: any) => {
					fetchMessages(category, 1, false, true)
					window.$app?.Event?.emit('app/toast', {
						type: 'error',
						message: err?.message || (is_cn ? '取消归档失败' : 'Failed to unarchive')
					})
				})
		},
		[selectedChatId, category, fetchMessages, fetchStats, is_cn]
	)

	const deleteGroup = useCallback(
		(chatId: string) => {
			setMessages((prev) => prev.filter((m) => m.chat_id !== chatId))
			if (selectedChatId === chatId) setSelectedChatId(null)
			services
				.deleteGroup(chatId)
				.then(() => fetchStats())
				.catch((err: any) => {
					fetchMessages(category, 1, false, true)
					window.$app?.Event?.emit('app/toast', {
						type: 'error',
						message: err?.message || (is_cn ? '删除失败' : 'Failed to delete')
					})
				})
		},
		[selectedChatId, category, fetchMessages, fetchStats, is_cn]
	)

	const toggleBookmark = useCallback(
		(chatId: string) => {
			setMessages((prev) => {
				const msg = prev.find((m) => m.chat_id === chatId)
				if (!msg) return prev
				const wasBookmarked = msg.bookmarked
				const next = prev.map((m) => (m.chat_id === chatId ? { ...m, bookmarked: !m.bookmarked } : m))
				const req = wasBookmarked ? services.unbookmarkTask(chatId) : services.bookmarkTask(chatId)
				req.catch(() => {
					setMessages((p) => p.map((m) => (m.chat_id === chatId ? { ...m, bookmarked: wasBookmarked } : m)))
				})
				return next
			})
		},
		[]
	)

	const togglePin = useCallback(
		(chatId: string) => {
			setMessages((prev) => {
				const msg = prev.find((m) => m.chat_id === chatId)
				if (!msg) return prev
				const wasPinned = msg.inbox_pinned
				const next = prev.map((m) => (m.chat_id === chatId ? { ...m, inbox_pinned: !m.inbox_pinned } : m))
				const req = wasPinned ? services.unpinTask(chatId) : services.pinTask(chatId)
				req.then(() => {
					fetchMessages(category, 1, false, true)
				}).catch(() => {
					setMessages((p) => p.map((m) => (m.chat_id === chatId ? { ...m, inbox_pinned: wasPinned } : m)))
				})
				return next
			})
		},
		[category, fetchMessages]
	)

	const value: InboxContextValue = {
		messages,
		groupedMessages,
		loading,
		loadingMore,
		is_cn,
		category,
		setCategory,
		selectedChatId,
		selectChatGroup,
		searchKeyword,
		setSearchKeyword,
		unreadCount,
		stats,
		markAllRead,
		archiveGroup,
		unarchiveGroup,
		deleteGroup,
		toggleBookmark,
		togglePin,
		sidebarCollapsed,
		setSidebarCollapsed,
		loadMore,
		hasMore,
		taskVersion
	}

	return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
}
