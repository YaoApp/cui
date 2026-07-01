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
	unreadCount: number
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
	selectedMessageId: string | null
	selectedMessage: InboxMessage | null
	selectMessage: (id: string) => void
	searchKeyword: string
	setSearchKeyword: (k: string) => void
	unreadCount: number
	stats: InboxStatsData | null
	markAsRead: (id: string) => void
	markAllRead: () => void
	archiveGroup: (chatId: string) => void
	unarchiveGroup: (chatId: string, columnId: string) => void
	deleteGroup: (chatId: string) => void
	toggleStar: (id: string) => void
	togglePin: (id: string) => void
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
	starred: 'starred',
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
	const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
	const [searchKeyword, setSearchKeyword] = useState('')
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
	const [stats, setStats] = useState<InboxStatsData | null>(null)
	const [page, setPage] = useState(1)
	const [total, setTotal] = useState(0)
	const [taskVersion, setTaskVersion] = useState(0)
	const refreshTimerRef = useRef<number>()
	const fetchingRef = useRef(false)
	const selectedChatIdRef = useRef<string | null>(null)
	selectedChatIdRef.current = selectedChatId

	const fetchStats = useCallback(() => {
		services.getStats().then(setStats).catch(() => {})
	}, [])

	const fetchMessages = useCallback(
		(cat: InboxCategory, p: number, append = false) => {
			if (fetchingRef.current) return
			fetchingRef.current = true
			const filter = categoryToFilter[cat]
			if (append) {
				setLoadingMore(true)
			} else {
				setLoading(true)
			}
			services
				.getMessages({ filter, page: p, size: PAGE_SIZE })
				.then(({ items, total: t }) => {
					setMessages((prev) => (append ? [...prev, ...items] : items))
					setTotal(t)
				})
				.catch((err: any) => {
					window.$app?.Event?.emit('app/toast', {
						type: 'error',
						message: err?.message || (is_cn ? '加载消息失败' : 'Failed to load messages')
					})
				})
				.finally(() => {
					fetchingRef.current = false
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
		const unsub = stream.subscribe('task.*', (data: any) => {
			if (data?.__event_type === 'task.updated'
				&& data.chat_id === selectedChatIdRef.current
				&& data.outputs) {
				setTaskVersion((v) => v + 1)
			}
			clearTimeout(refreshTimerRef.current)
			refreshTimerRef.current = window.setTimeout(() => {
				fetchStats()
				fetchMessages(category, 1)
				setPage(1)
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
			setPage(1)
			setSelectedChatId(null)
			setSelectedMessageId(null)
			fetchMessages(c, 1)
		},
		[fetchMessages]
	)

	const loadMore = useCallback(() => {
		if (fetchingRef.current || messages.length >= total) return
		const nextPage = page + 1
		setPage(nextPage)
		fetchMessages(category, nextPage, true)
	}, [messages.length, total, page, category, fetchMessages])

	const hasMore = messages.length < total

	const groupedMessages = useMemo(() => {
		const filtered = searchKeyword.trim()
			? messages.filter((m) => {
					const kw = searchKeyword.toLowerCase()
					return m.title.toLowerCase().includes(kw) || m.body.toLowerCase().includes(kw)
				})
			: messages

		const map = new Map<string, InboxGroup>()
		for (const m of filtered) {
			const key = m.chat_id || m.id
			const existing = map.get(key)
			if (!existing) {
				map.set(key, {
					chat_id: key,
					title: m.title,
					taskName: m.source?.task_title || '',
					latestMail: m,
					unreadCount: m.read ? 0 : 1,
					totalCount: 1,
					latestTime: m.created_at
				})
			} else {
				existing.totalCount++
				if (!m.read) existing.unreadCount++
				if (!existing.taskName && m.source?.task_title) {
					existing.taskName = m.source.task_title
				}
				if (m.created_at > existing.latestTime) {
					existing.latestTime = m.created_at
					existing.latestMail = m
					existing.title = m.title
				}
			}
		}
		const groups = Array.from(map.values())
		groups.sort((a, b) => {
			if (a.latestMail.pinned && !b.latestMail.pinned) return -1
			if (!a.latestMail.pinned && b.latestMail.pinned) return 1
			return b.latestTime - a.latestTime
		})
		return groups
	}, [messages, searchKeyword])

	const selectedMessage = useMemo(
		() => messages.find((m) => m.id === selectedMessageId) || null,
		[messages, selectedMessageId]
	)

	const unreadCount = useMemo(() => messages.filter((m) => !m.read).length, [messages])

	const selectChatGroup = useCallback(
		(chatId: string) => {
			setSelectedChatId(chatId || null)
			if (!chatId) return

			const unreadInGroup = messages.filter((m) => m.chat_id === chatId && !m.read)
			if (unreadInGroup.length === 0) return

			const now = Date.now()
			setMessages((prev) =>
				prev.map((m) => (m.chat_id === chatId && !m.read ? { ...m, read: true, read_at: now } : m))
			)

			Promise.all(unreadInGroup.map((mail) => services.markAsRead(mail.id)))
				.then(() => fetchStats())
				.catch(() => {})
		},
		[messages, fetchStats]
	)

	const selectMessage = useCallback(
		(id: string) => {
			setSelectedMessageId(id || null)
			if (!id) return
			const msg = messages.find((m) => m.id === id)
			if (msg && !msg.read) {
				setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true, read_at: Date.now() } : m)))
				services.markAsRead(id).then(() => fetchStats()).catch((err: any) => {
					setMessages((prev) =>
						prev.map((m) => (m.id === id ? { ...m, read: false, read_at: undefined } : m))
					)
					window.$app?.Event?.emit('app/toast', {
						type: 'error',
						message: err?.message || (is_cn ? '标记已读失败' : 'Failed to mark as read')
					})
				})
			}
		},
		[messages, is_cn, fetchStats]
	)

	const markAsRead = useCallback(
		(id: string) => {
			setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true, read_at: Date.now() } : m)))
			services.markAsRead(id).then(() => fetchStats()).catch((err: any) => {
				setMessages((prev) =>
					prev.map((m) => (m.id === id ? { ...m, read: false, read_at: undefined } : m))
				)
				window.$app?.Event?.emit('app/toast', {
					type: 'error',
					message: err?.message || (is_cn ? '标记已读失败' : 'Failed to mark as read')
				})
			})
		},
		[is_cn, fetchStats]
	)

	const markAllRead = useCallback(() => {
		const snapshot = messages.filter((m) => !m.read).map((m) => m.id)
		if (snapshot.length === 0) return
		const now = Date.now()
		setMessages((prev) => prev.map((m) => (m.read ? m : { ...m, read: true, read_at: now })))
		services.markAllRead().then(() => fetchStats()).catch((err: any) => {
			setMessages((prev) =>
				prev.map((m) => (snapshot.includes(m.id) ? { ...m, read: false, read_at: undefined } : m))
			)
			window.$app?.Event?.emit('app/toast', {
				type: 'error',
				message: err?.message || (is_cn ? '标记全部已读失败' : 'Failed to mark all as read')
			})
		})
	}, [messages, is_cn, fetchStats])

	const archiveGroup = useCallback(
		(chatId: string) => {
			setMessages((prev) => prev.filter((m) => (m.chat_id || m.id) !== chatId))
			if (selectedChatId === chatId) {
				setSelectedChatId(null)
				setSelectedMessageId(null)
			}
			services
				.archiveTask(chatId)
				.then(() => fetchStats())
				.catch((err: any) => {
					fetchMessages(category, 1)
					setPage(1)
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
			setMessages((prev) => prev.filter((m) => (m.chat_id || m.id) !== chatId))
			if (selectedChatId === chatId) {
				setSelectedChatId(null)
				setSelectedMessageId(null)
			}
			services
				.unarchiveTask(chatId, columnId)
				.then(() => fetchStats())
				.catch((err: any) => {
					fetchMessages(category, 1)
					setPage(1)
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
			setMessages((prev) => prev.filter((m) => (m.chat_id || m.id) !== chatId))
			if (selectedChatId === chatId) {
				setSelectedChatId(null)
				setSelectedMessageId(null)
			}
			services
				.deleteGroup(chatId)
				.then(() => fetchStats())
				.catch((err: any) => {
					fetchMessages(category, 1)
					setPage(1)
					window.$app?.Event?.emit('app/toast', {
						type: 'error',
						message: err?.message || (is_cn ? '删除失败' : 'Failed to delete')
					})
				})
		},
		[selectedChatId, category, fetchMessages, fetchStats, is_cn]
	)

	const toggleStar = useCallback((id: string) => {
		setMessages((prev) => {
			const msg = prev.find((m) => m.id === id)
			if (!msg) return prev
			const wasStarred = msg.starred
			const next = prev.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m))
			const req = wasStarred ? services.unstarMessage(id) : services.starMessage(id)
			req.catch(() => {
				setMessages((p) => p.map((m) => (m.id === id ? { ...m, starred: wasStarred } : m)))
			})
			return next
		})
	}, [])

	const togglePin = useCallback((id: string) => {
		setMessages((prev) => {
			const msg = prev.find((m) => m.id === id)
			if (!msg) return prev
			const wasPinned = msg.pinned
			const next = prev.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
			const req = wasPinned ? services.unpinMessage(id) : services.pinMessage(id)
			req.catch(() => {
				setMessages((p) => p.map((m) => (m.id === id ? { ...m, pinned: wasPinned } : m)))
			})
			return next
		})
	}, [])

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
		selectedMessageId,
		selectedMessage,
		selectMessage,
		searchKeyword,
		setSearchKeyword,
		unreadCount,
		stats,
		markAsRead,
		markAllRead,
		archiveGroup,
		unarchiveGroup,
		deleteGroup,
		toggleStar,
		togglePin,
		sidebarCollapsed,
		setSidebarCollapsed,
		loadMore,
		hasMore,
		taskVersion
	}

	return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
}
