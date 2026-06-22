import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { getLocale } from '@umijs/max'
import type { InboxMessage, InboxCategory } from './types'
import { services } from './services'

interface InboxContextValue {
	messages: InboxMessage[]
	filteredMessages: InboxMessage[]
	loading: boolean
	is_cn: boolean
	category: InboxCategory
	setCategory: (c: InboxCategory) => void
	selectedMessageId: string | null
	selectedMessage: InboxMessage | null
	selectMessage: (id: string) => void
	searchKeyword: string
	setSearchKeyword: (k: string) => void
	unreadCount: number
	categoryCountMap: Record<InboxCategory, number>
	markAsRead: (id: string) => void
	markAllRead: () => void
	archiveMessage: (id: string) => void
	toggleStar: (id: string) => void
	togglePin: (id: string) => void
	sidebarCollapsed: boolean
	setSidebarCollapsed: (v: boolean) => void
}

const InboxContext = createContext<InboxContextValue | null>(null)

export function useInboxContext() {
	const ctx = useContext(InboxContext)
	if (!ctx) throw new Error('useInboxContext must be used within InboxProvider')
	return ctx
}

export function InboxProvider({ children }: { children: React.ReactNode }) {
	const is_cn = useMemo(() => getLocale() === 'zh-CN', [])
	const [messages, setMessages] = useState<InboxMessage[]>([])
	const [loading, setLoading] = useState(true)
	const [category, setCategory] = useState<InboxCategory>('all')
	const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
	const [searchKeyword, setSearchKeyword] = useState('')
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

	useEffect(() => {
		setLoading(true)
		services.getMessages().then((msgs) => {
			setMessages(msgs)
			setLoading(false)
		}).catch((err: any) => {
			setLoading(false)
			window.$app?.Event?.emit('app/toast', { type: 'error', message: err?.message || (is_cn ? '加载消息失败' : 'Failed to load messages') })
		})
	}, [])

	const filteredMessages = useMemo(() => {
		let result = messages

		if (category === 'archived') {
			result = result.filter((m) => m.archived)
		} else if (category === 'starred') {
			result = result.filter((m) => !m.archived && m.starred)
		} else {
			result = result.filter((m) => !m.archived)
			if (category === 'task_interaction') {
				result = result.filter((m) => m.type === 'task_input')
			} else if (category === 'task_notification') {
				result = result.filter((m) => m.type === 'task_completed')
			} else if (category === 'task_failed') {
				result = result.filter((m) => m.type === 'task_failed')
			}
		}

		if (searchKeyword.trim()) {
			const kw = searchKeyword.toLowerCase()
			result = result.filter(
				(m) => m.title.toLowerCase().includes(kw) || m.body.toLowerCase().includes(kw)
			)
		}

		result.sort((a, b) => {
			if (a.pinned && !b.pinned) return -1
			if (!a.pinned && b.pinned) return 1
			return 0
		})

		return result
	}, [messages, category, searchKeyword])

	const selectedMessage = useMemo(
		() => messages.find((m) => m.id === selectedMessageId) || null,
		[messages, selectedMessageId]
	)

	const unreadCount = useMemo(() => messages.filter((m) => !m.read && !m.archived).length, [messages])

	const categoryCountMap = useMemo(() => {
		const nonArchived = messages.filter((m) => !m.archived)
		return {
			all: nonArchived.length,
			starred: nonArchived.filter((m) => m.starred).length,
			task_interaction: nonArchived.filter((m) => m.type === 'task_input').length,
			task_notification: nonArchived.filter((m) => m.type === 'task_completed').length,
			task_failed: nonArchived.filter((m) => m.type === 'task_failed').length,
			archived: messages.filter((m) => m.archived).length
		}
	}, [messages])

	const selectMessage = useCallback(
		(id: string) => {
			setSelectedMessageId(id || null)
			if (!id) return
			const msg = messages.find((m) => m.id === id)
			if (msg && !msg.read) {
				setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true, read_at: Date.now() } : m)))
				services.markAsRead(id).catch((err: any) => {
					setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: false, read_at: undefined } : m)))
					window.$app?.Event?.emit('app/toast', { type: 'error', message: err?.message || (is_cn ? '标记已读失败' : 'Failed to mark as read') })
				})
			}
		},
		[messages, is_cn]
	)

	const markAsRead = useCallback((id: string) => {
		setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true, read_at: Date.now() } : m)))
		services.markAsRead(id).catch((err: any) => {
			setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: false, read_at: undefined } : m)))
			window.$app?.Event?.emit('app/toast', { type: 'error', message: err?.message || (is_cn ? '标记已读失败' : 'Failed to mark as read') })
		})
	}, [is_cn])

	const markAllRead = useCallback(() => {
		const snapshot = messages.filter((m) => !m.read).map((m) => m.id)
		const now = Date.now()
		setMessages((prev) => prev.map((m) => (m.read ? m : { ...m, read: true, read_at: now })))
		services.markAllRead().catch((err: any) => {
			setMessages((prev) => prev.map((m) => (snapshot.includes(m.id) ? { ...m, read: false, read_at: undefined } : m)))
			window.$app?.Event?.emit('app/toast', { type: 'error', message: err?.message || (is_cn ? '标记全部已读失败' : 'Failed to mark all as read') })
		})
	}, [messages, is_cn])

	const archiveMessage = useCallback((id: string) => {
		setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, archived: true } : m)))
		if (selectedMessageId === id) {
			const remaining = messages.filter((m) => m.id !== id && !m.archived)
			setSelectedMessageId(remaining.length > 0 ? remaining[0].id : null)
		}
		services.archiveMessage(id).catch((err: any) => {
			setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, archived: false } : m)))
			window.$app?.Event?.emit('app/toast', { type: 'error', message: err?.message || (is_cn ? '归档失败' : 'Failed to archive') })
		})
	}, [selectedMessageId, messages, is_cn])

	const toggleStar = useCallback((id: string) => {
		const msg = messages.find((m) => m.id === id)
		if (!msg) return
		const wasStarred = msg.starred
		setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)))
		const req = wasStarred ? services.unstarMessage(id) : services.starMessage(id)
		req.catch((err: any) => {
			setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, starred: wasStarred } : m)))
			window.$app?.Event?.emit('app/toast', { type: 'error', message: err?.message || (is_cn ? '操作失败' : 'Operation failed') })
		})
	}, [messages, is_cn])

	const togglePin = useCallback((id: string) => {
		const msg = messages.find((m) => m.id === id)
		if (!msg) return
		const wasPinned = msg.pinned
		setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)))
		const req = wasPinned ? services.unpinMessage(id) : services.pinMessage(id)
		req.catch((err: any) => {
			setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, pinned: wasPinned } : m)))
			window.$app?.Event?.emit('app/toast', { type: 'error', message: err?.message || (is_cn ? '操作失败' : 'Operation failed') })
		})
	}, [messages, is_cn])

	const value: InboxContextValue = {
		messages,
		filteredMessages,
		loading,
		is_cn,
		category,
		setCategory,
		selectedMessageId,
		selectedMessage,
		selectMessage,
		searchKeyword,
		setSearchKeyword,
		unreadCount,
		categoryCountMap,
		markAsRead,
		markAllRead,
		archiveMessage,
		toggleStar,
		togglePin,
		sidebarCollapsed,
		setSidebarCollapsed
	}

	return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
}
