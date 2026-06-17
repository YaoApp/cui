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
		})
	}, [])

	const filteredMessages = useMemo(() => {
		let result = messages

		if (category === 'archived') {
			result = result.filter((m) => m.archived)
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
				services.markAsRead(id)
				setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true, read_at: Date.now() } : m)))
			}
		},
		[messages]
	)

	const markAsRead = useCallback((id: string) => {
		services.markAsRead(id)
		setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true, read_at: Date.now() } : m)))
	}, [])

	const markAllRead = useCallback(() => {
		services.markAllRead()
		const now = Date.now()
		setMessages((prev) => prev.map((m) => (m.read ? m : { ...m, read: true, read_at: now })))
	}, [])

	const archiveMessage = useCallback((id: string) => {
		services.archiveMessage(id)
		setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, archived: true } : m)))
		if (selectedMessageId === id) {
			const remaining = messages.filter((m) => m.id !== id && !m.archived)
			setSelectedMessageId(remaining.length > 0 ? remaining[0].id : null)
		}
	}, [selectedMessageId, messages])

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
		sidebarCollapsed,
		setSidebarCollapsed
	}

	return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
}
