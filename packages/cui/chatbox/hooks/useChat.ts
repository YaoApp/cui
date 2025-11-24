import { useState, useCallback, useEffect, useRef } from 'react'
import { nanoid } from 'nanoid'
import { getLocale } from '@umijs/max'
import { useGlobal } from '@/context/app'
import { Chat } from '../../openapi'
import { Agent } from '../../openapi/agent'
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
	assistant?: any // Added assistant info

	// Tab State
	tabs: ChatTab[]
	activeTabId: string

	// Actions
	sendMessage: (message: ChatMessage) => Promise<void>
	abort: () => void
	reset: () => void
	loadHistory: (chatId: string) => Promise<void>
	createNewChat: (assistantId?: string) => void

	// Tab Actions
	activateTab: (chatId: string) => void
	closeTab: (chatId: string) => void
}

export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
	const { assistantId: propAssistantId } = options
	const global = useGlobal()

	// Determine effective assistant ID for *defaults*
	// 1. Prop
	// 2. Global default assistant
	const defaultAssistantId = propAssistantId || global.default_assistant?.assistant_id

	// Chat States Map: chatId -> messages
	const [chatStates, setChatStates] = useState<Record<string, Message[]>>({})

	// Tabs - Start empty
	const [tabs, setTabs] = useState<ChatTab[]>([])
	const [activeTabId, setActiveTabId] = useState<string>('')

	const [sessions, setSessions] = useState<IChatSession[]>([])

	// Loading/Streaming States Map: chatId -> boolean
	const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
	const [streamingStates, setStreamingStates] = useState<Record<string, boolean>>({})

	const [assistant, setAssistant] = useState<any>(null) // Assistant info

	const [chatClient, setChatClient] = useState<Chat | null>(null)
	// Abort Handles Map: chatId -> abort function
	const abortHandlesRef = useRef<Record<string, () => void>>({})

	// Derived states for active tab
	const messages = activeTabId ? chatStates[activeTabId] || [] : []
	const loading = activeTabId ? loadingStates[activeTabId] || false : false
	const streaming = activeTabId ? streamingStates[activeTabId] || false : false

	// currentChatId is activeTabId
	const currentChatId = activeTabId || undefined

	// Get current assistant ID from active tab
	const activeTab = tabs.find((t) => t.chatId === activeTabId)
	const currentAssistantId = activeTab?.assistantId || defaultAssistantId

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

	// Fetch Assistant Info
	useEffect(() => {
		// If we have a currentAssistantId, fetch it.
		// If not (e.g. new chat without inherited ID), we might fallback to default or wait.
		if (!window.$app?.openapi) return

		const fetchId = currentAssistantId

		const fetchAssistant = async () => {
			if (!fetchId) return // Don't fetch if no ID

			const agentClient = new Agent(window.$app.openapi)
			try {
				// Use 'zh-cn' or 'en-us' based on locale if needed, but api usually handles it or returns raw
				const locale = getLocale() || 'en-us'
				const res = await agentClient.assistants.Get(fetchId, locale)
				if (!window.$app.openapi.IsError(res)) {
					const data = window.$app.openapi.GetData(res)
					// Filter necessary info
					const {
						assistant_id,
						name,
						avatar,
						description,
						built_in,
						connector,
						type,
						public: isPublic,
						readonly
					} = data
					setAssistant({
						assistant_id,
						name,
						avatar,
						description,
						built_in,
						connector,
						type,
						public: isPublic,
						readonly
					})
				}
			} catch (err) {
				console.error('Failed to fetch assistant info:', err)
			}
		}

		fetchAssistant()
	}, [currentAssistantId])

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
			let targetAssistantId = currentAssistantId

			if (!targetTabId) {
				const newId = nanoid()
				// Use default assistant ID for auto-created tab
				targetAssistantId = defaultAssistantId
				const newTab: ChatTab = { chatId: newId, title: 'New Chat', assistantId: targetAssistantId }
				setTabs((prev) => [...prev, newTab])
				setChatStates((prev) => ({ ...prev, [newId]: [] }))
				setActiveTabId(newId)
				targetTabId = newId
			} else {
				// Use existing tab's assistant
				const tab = tabs.find((t) => t.chatId === targetTabId)
				if (tab && tab.assistantId) {
					targetAssistantId = tab.assistantId
				}
			}

			if (!chatClient) {
				console.error('Chat client not initialized')
				return
			}

			// Set streaming state for this specific chat
			setStreamingStates((prev) => ({ ...prev, [targetTabId]: true }))

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
				if (!targetAssistantId) {
					console.error('Assistant ID is missing')
					setStreamingStates((prev) => ({ ...prev, [targetTabId]: false }))
					return
				}

				const abortFn = chatClient.StreamCompletion(
					{
						assistant_id: targetAssistantId,
						chat_id: targetTabId, // Always pass chat_id (generated by frontend)
						messages: [inputMsg]
					},
					(chunk: Message) => {
						// Handle Chunk

						// Event handling
						if (chunk.type === 'event') {
							if (chunk.props?.event === 'stream_end') {
								setStreamingStates((prev) => ({ ...prev, [targetTabId]: false }))
								delete abortHandlesRef.current[targetTabId]
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
							// Also end streaming when we receive the final done message
							// This is a fallback in case stream_end event is missed
							setStreamingStates((prev) => ({ ...prev, [targetTabId]: false }))
							delete abortHandlesRef.current[targetTabId]
						}
					},
					(error: any) => {
						console.error('Stream error:', error)
						setStreamingStates((prev) => ({ ...prev, [targetTabId]: false }))
						updateMessages(targetTabId, (prev) => [
							...prev,
							{
								type: 'error',
								props: { message: error.message || 'Connection failed' }
							}
						])
						delete abortHandlesRef.current[targetTabId]
					}
				)

				abortHandlesRef.current[targetTabId] = abortFn
			} catch (err) {
				console.error('Failed to send message:', err)
				setStreamingStates((prev) => ({ ...prev, [targetTabId]: false }))
			}
		},
		[chatClient, defaultAssistantId, currentAssistantId, activeTabId, updateMessages, tabs]
	)

	const abort = useCallback(() => {
		if (!activeTabId) return
		const abortFn = abortHandlesRef.current[activeTabId]
		if (abortFn) {
			abortFn()
			delete abortHandlesRef.current[activeTabId]
		}
		setStreamingStates((prev) => ({ ...prev, [activeTabId]: false }))
	}, [activeTabId])

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
			// For history loading, we might need to fetch the assistant ID from the session details
			// For now, we assume default or try to get it from sessions list
			const session = sessions.find((s) => s.chat_id === chatId)
			const historyAssistantId = session?.assistant_id || defaultAssistantId

			const newTab: ChatTab = { chatId, title: 'Loading...', assistantId: historyAssistantId }
			setTabs((prev) => [...prev, newTab])
			setActiveTabId(chatId)
			setLoadingStates((prev) => ({ ...prev, [chatId]: true }))

			try {
				const history = await getChatHistory(chatId)
				// Update state map
				setChatStates((prev) => ({ ...prev, [chatId]: history }))

				// Update title based on history? (Mock: use session title)
				if (session) {
					setTabs((prev) =>
						prev.map((t) => (t.chatId === chatId ? { ...t, title: session.title } : t))
					)
				}
			} catch (err) {
				console.error('Failed to load history', err)
			} finally {
				setLoadingStates((prev) => ({ ...prev, [chatId]: false }))
			}
		},
		[tabs, sessions, defaultAssistantId]
	)

	const createNewChat = useCallback(
		(arg?: string | any) => {
			// Check if arg is a string (assistantId), otherwise treat as event/empty
			const assistantId = typeof arg === 'string' ? arg : undefined

			const newId = nanoid()

			// Inherit from active tab if no assistant ID provided
			let targetAssistantId = assistantId
			if (!targetAssistantId) {
				const currentTab = tabs.find((t) => t.chatId === activeTabId)
				targetAssistantId = currentTab?.assistantId
			}

			// Fallback to default
			targetAssistantId = targetAssistantId || defaultAssistantId

			const newTab: ChatTab = { chatId: newId, title: 'New Chat', assistantId: targetAssistantId }
			setTabs((prev) => [...prev, newTab])
			setChatStates((prev) => ({ ...prev, [newId]: [] }))
			setActiveTabId(newId)
			clearMessageCache()
		},
		[defaultAssistantId, tabs, activeTabId]
	)

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
			// Clean up all states for closed tab to save memory
			setChatStates((prev) => {
				const newState = { ...prev }
				delete newState[chatId]
				return newState
			})
			setLoadingStates((prev) => {
				const newState = { ...prev }
				delete newState[chatId]
				return newState
			})
			setStreamingStates((prev) => {
				const newState = { ...prev }
				delete newState[chatId]
				return newState
			})
			// Clean up abort handler
			if (abortHandlesRef.current[chatId]) {
				delete abortHandlesRef.current[chatId]
			}
		},
		[activeTabId]
	)

	return {
		messages,
		sessions,
		currentChatId,
		loading,
		streaming,
		assistant, // Export assistant info
		tabs,
		activeTabId,
		sendMessage,
		abort,
		reset,
		loadHistory,
		createNewChat,
		activateTab,
		closeTab
	}
}
