import { useState, useCallback, useEffect, useRef } from 'react'
import { nanoid } from 'nanoid'
import { Chat } from '../../openapi'
import type { Message, ChatMessage } from '../../openapi'
import type { IChatSession, ChatTab } from '../types'
import { applyDelta, clearMessageCache } from '../utils/delta'
import { getRecentChats, getChatHistory } from '../services/mock'

export interface UseChatOptions {
	assistantId?: string
	chatId?: string
	apiBaseUrl?: string
}

export interface UseChatReturn {
	// State
	messages: Message[]
	sessions: IChatSession[]
	currentChatId?: string
	loading: boolean
	streaming: boolean

	// Tab State
	tabs: ChatTab[]
	activeTabId: string

	// Draft State
	inputDraft: string
	updateInputDraft: (content: string) => void

	// Actions
	sendMessage: (message: ChatMessage) => Promise<void>
	abort: () => void
	reset: () => void
	loadHistory: (chatId: string) => Promise<void>
	createNewChat: () => void

	// Tab Actions
	activateTab: (chatId: string) => void
	closeTab: (chatId: string) => void
}

export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
	const { assistantId } = options

	// Chat States Map: chatId -> messages
	const [chatStates, setChatStates] = useState<Record<string, Message[]>>({})

	// Tabs - Start empty
	const [tabs, setTabs] = useState<ChatTab[]>([])
	const [activeTabId, setActiveTabId] = useState<string>('')

	// Input Drafts Map: chatId -> draft content
	const [inputDrafts, setInputDrafts] = useState<Record<string, string>>({})

	const [sessions, setSessions] = useState<IChatSession[]>([])
	const [loading, setLoading] = useState(false)
	const [streaming, setStreaming] = useState(false)

	const [chatClient, setChatClient] = useState<Chat | null>(null)
	const abortHandleRef = useRef<(() => void) | null>(null)

	// Derived messages for active tab
	const messages = activeTabId ? chatStates[activeTabId] || [] : []
	// currentChatId is activeTabId
	const currentChatId = activeTabId || undefined

	// Get current draft
	const inputDraft = activeTabId ? inputDrafts[activeTabId] || '' : ''

	// Update draft for active tab
	const updateInputDraft = useCallback((content: string) => {
		if (!activeTabId) return
		setInputDrafts((prev) => ({
			...prev,
			[activeTabId]: content
		}))
	}, [activeTabId])

	// Initialize Chat Client
	useEffect(() => {
		if (window.$app?.openapi) {
			setChatClient(new Chat(window.$app.openapi))
		} else {
			console.warn('OpenAPI not initialized in window.$app')
		}

		// Load sessions
		getRecentChats().then(setSessions)
	}, [])

	// Helper to update messages for a specific chat ID
	const updateMessages = useCallback((chatId: string, updater: (prev: Message[]) => Message[]) => {
		setChatStates((prev) => ({
			...prev,
			[chatId]: updater(prev[chatId] || [])
		}))
	}, [])

	// Send Message
	const sendMessage = useCallback(
		async (inputMsg: ChatMessage) => {
			// If no active tab, create one automatically
			let targetTabId = activeTabId
			if (!targetTabId) {
				const newId = nanoid()
				const newTab: ChatTab = { chatId: newId, title: 'New Chat' }
				setTabs((prev) => [...prev, newTab])
				setChatStates((prev) => ({ ...prev, [newId]: [] }))
				setActiveTabId(newId)
				targetTabId = newId
			}

			// Clear draft
			setInputDrafts((prev) => ({ ...prev, [targetTabId]: '' }))

			if (!chatClient) {
				console.error('Chat client not initialized')
				return
			}

			setStreaming(true)

			// 1. Add User Message locally
			const userMsg: Message = {
				type: 'text',
				id: `user-${Date.now()}`,
				props: {
					content: typeof inputMsg.content === 'string' ? inputMsg.content : 'Multimodal content'
				},
				done: true
			}
			updateMessages(targetTabId, (prev) => [...prev, userMsg])

			try {
				// 2. Start Streaming
				const abortFn = chatClient.StreamCompletion(
					{
						assistant_id: assistantId || 'neo',
						chat_id: targetTabId,
						messages: [inputMsg]
					},
					(chunk: Message) => {
						// Handle Chunk

						// Event handling
						if (chunk.type === 'event') {
							if (chunk.props?.event === 'stream_end') {
								setStreaming(false)
								abortHandleRef.current = null
							}
							return
						}

						// Type change handling
						if (chunk.type_change && chunk.id) {
							clearMessageCache(chunk.id)
							updateMessages(targetTabId, (prev) => {
								const index = prev.findIndex((m) => m.id === chunk.id)
								if (index !== -1) {
									const newArr = [...prev]
									newArr[index] = { ...chunk, delta: false, done: false }
									return newArr
								}
								return [...prev, chunk]
							})
						}

						const msgId = chunk.id || `ai-response-unknown`

						// Apply Delta
						const mergedState = applyDelta(msgId, chunk)

						// Reconstruct Message
						const updatedMessage: Message = {
							id: msgId,
							type: mergedState.type,
							props: mergedState.props,
							done: chunk.done,
							delta: chunk.delta
						}

						updateMessages(targetTabId, (prev) => {
							const index = prev.findIndex((m) => m.id === msgId)
							if (index !== -1) {
								const newArr = [...prev]
								newArr[index] = updatedMessage
								return newArr
							} else {
								return [...prev, updatedMessage]
							}
						})

						if (chunk.done) {
							clearMessageCache(msgId)
						}
					},
					(error: any) => {
						console.error('Stream error:', error)
						setStreaming(false)
						updateMessages(targetTabId, (prev) => [
							...prev,
							{
								type: 'error',
								props: { message: error.message || 'Connection failed' }
							}
						])
						abortHandleRef.current = null
					}
				)

				abortHandleRef.current = abortFn
			} catch (err) {
				console.error('Failed to send message:', err)
				setStreaming(false)
			}
		},
		[chatClient, assistantId, activeTabId, updateMessages]
	)

	const abort = useCallback(() => {
		if (abortHandleRef.current) {
			abortHandleRef.current()
			abortHandleRef.current = null
		}
		setStreaming(false)
	}, [])

	const reset = useCallback(() => {
		if (!activeTabId) return
		updateMessages(activeTabId, () => [])
		clearMessageCache()
	}, [activeTabId, updateMessages])

	// Load History: Check if tab exists, if not create it
	const loadHistory = useCallback(
		async (chatId: string) => {
			// Check if already open
			if (tabs.find((t) => t.chatId === chatId)) {
				setActiveTabId(chatId)
				return
			}

			// Open new tab
			const newTab: ChatTab = { chatId, title: 'Loading...' }
			setTabs((prev) => [...prev, newTab])
			setActiveTabId(chatId)
			setLoading(true)

			try {
				const history = await getChatHistory(chatId)
				// Update state map
				setChatStates((prev) => ({ ...prev, [chatId]: history }))

				// Update title based on history? (Mock: use session title)
				const session = sessions.find((s) => s.chat_id === chatId)
				if (session) {
					setTabs((prev) =>
						prev.map((t) => (t.chatId === chatId ? { ...t, title: session.title } : t))
					)
				}
			} catch (err) {
				console.error('Failed to load history', err)
			} finally {
				setLoading(false)
			}
		},
		[tabs, sessions]
	)

	const createNewChat = useCallback(() => {
		const newId = nanoid()
		const newTab: ChatTab = { chatId: newId, title: 'New Chat' }
		setTabs((prev) => [...prev, newTab])
		setChatStates((prev) => ({ ...prev, [newId]: [] }))
		setActiveTabId(newId)
		clearMessageCache()
	}, [])

	const activateTab = useCallback((chatId: string) => {
		setActiveTabId(chatId)
	}, [])

	const closeTab = useCallback(
		(chatId: string) => {
			setTabs((prev) => {
				const newTabs = prev.filter((t) => t.chatId !== chatId)
				// If we closed the active tab, switch to another
				if (chatId === activeTabId) {
					if (newTabs.length > 0) {
						// Switch to last available tab
						const nextTabId = newTabs[newTabs.length - 1].chatId
						setActiveTabId(nextTabId)
					} else {
						// All tabs closed, go to empty state
						setActiveTabId('')
					}
				}
				return newTabs
			})
			// Optional: Clean up chatStates for closed tab to save memory
			setChatStates((prev) => {
				const newState = { ...prev }
				delete newState[chatId]
				return newState
			})
			// Clean up drafts
			setInputDrafts((prev) => {
				const newState = { ...prev }
				delete newState[chatId]
				return newState
			})
		},
		[activeTabId]
	)

	return {
		messages,
		sessions,
		currentChatId,
		loading,
		streaming,
		tabs,
		activeTabId,
		inputDraft,
		updateInputDraft,
		sendMessage,
		abort,
		reset,
		loadHistory,
		createNewChat,
		activateTab,
		closeTab
	}
}
