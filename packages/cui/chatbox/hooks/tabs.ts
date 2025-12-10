import { useCallback, useEffect } from 'react'
import { nanoid } from 'nanoid'
import { getLocale } from '@umijs/max'
import type { ChatTab } from '../types'
import type { QueuedMessage } from './types'
import type { ChatState, ChatStateActions, ChatRefs } from './state'
import { clearMessageCache } from './delta'
import type { ChatMessage, Message, AssistantInfo } from '../../openapi'

export interface UseTabsOptions {
	state: ChatState
	actions: ChatStateActions
	refs: ChatRefs
	defaultAssistantId?: string
}

/**
 * Convert stored ChatMessage to display Message format
 * @param stored - ChatMessage from server storage
 * @param assistants - Map of assistant_id to AssistantInfo for avatar/name lookup
 * @returns Message for UI display
 */
const convertStoredToDisplay = (stored: ChatMessage, assistants?: Record<string, AssistantInfo>): Message => {
	// Get assistant info if available
	const assistantInfo = stored.assistant_id && assistants?.[stored.assistant_id]

	return {
		ui_id: nanoid(), // Generate unique UI ID for React key
		message_id: stored.message_id,
		type: stored.type,
		props: {
			...stored.props,
			role: stored.role, // Ensure role is in props for display
			// Add assistant info to props for rendering
			...(assistantInfo && {
				assistant_name: assistantInfo.name,
				assistant_avatar: assistantInfo.avatar
			})
		},
		block_id: stored.block_id,
		thread_id: stored.thread_id,
		delta: false, // Historical messages are complete
		metadata: {
			timestamp: new Date(stored.created_at).getTime(),
			sequence: stored.sequence
		}
	}
}

export function useTabs({ state, actions, refs, defaultAssistantId }: UseTabsOptions) {
	const { tabs, activeTabId, sessions, streamingStates } = state
	const { setTabs, setActiveTabId, setChatStates, setLoadingStates, setStreamingStates, setMessageQueues } = actions

	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Sync streaming state to tabs
	useEffect(() => {
		setTabs((prevTabs) =>
			prevTabs.map((tab) => ({
				...tab,
				streaming: streamingStates[tab.chatId] || false
			}))
		)
	}, [streamingStates, setTabs])

	const activateTab = useCallback(
		(chatId: string) => {
			setActiveTabId(chatId)
		},
		[setActiveTabId]
	)

	const closeTab = useCallback(
		(chatId: string) => {
			setTabs((prev) => {
				const newTabs = prev.filter((t) => t.chatId !== chatId)
				if (chatId === activeTabId) {
					if (newTabs.length > 0) {
						const nextTabId = newTabs[newTabs.length - 1].chatId
						setActiveTabId(nextTabId)
					} else {
						setActiveTabId('')
					}
				}
				return newTabs
			})
			// Clean up all states for closed tab
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
			setMessageQueues((prev) => {
				const newState = { ...prev }
				delete newState[chatId]
				return newState
			})
			// Clean up refs
			if (refs.abortHandles.current[chatId]) {
				delete refs.abortHandles.current[chatId]
			}
			if (refs.contextIds.current[chatId]) {
				delete refs.contextIds.current[chatId]
			}
			if (refs.titleGenerated.current[chatId]) {
				delete refs.titleGenerated.current[chatId]
			}
		},
		[
			activeTabId,
			setTabs,
			setActiveTabId,
			setChatStates,
			setLoadingStates,
			setStreamingStates,
			setMessageQueues,
			refs
		]
	)

	const createNewChat = useCallback(
		(arg?: string | any) => {
			const assistantId = typeof arg === 'string' ? arg : undefined
			const newId = nanoid()

			let targetAssistantId = assistantId
			if (!targetAssistantId) {
				const currentTab = tabs.find((t) => t.chatId === activeTabId)
				targetAssistantId = currentTab?.assistantId
			}
			targetAssistantId = targetAssistantId || defaultAssistantId

			const newTab: ChatTab = {
				chatId: newId,
				title: is_cn ? '新对话' : 'New Chat',
				assistantId: targetAssistantId,
				isNew: true // Mark as newly created, not loaded from history
			}
			setTabs((prev) => [...prev, newTab])
			setChatStates((prev) => ({ ...prev, [newId]: [] }))
			setActiveTabId(newId)
			// Clear only the new chat's cache, don't affect other tabs
			clearMessageCache(newId)
		},
		[defaultAssistantId, tabs, activeTabId, is_cn, setTabs, setChatStates, setActiveTabId]
	)

	const loadHistory = useCallback(
		async (chatId: string) => {
			// If tab already exists, just activate it
			const existingTab = tabs.find((t) => t.chatId === chatId)
			if (existingTab) {
				setActiveTabId(chatId)
			}

			const session = sessions.find((s: any) => s.chat_id === chatId)
			const historyAssistantId = session?.assistant_id || defaultAssistantId

			// Create tab if not exists
			if (!existingTab) {
				const newTab: ChatTab = {
					chatId,
					title: session?.title || 'Loading...',
					assistantId: historyAssistantId
				}
				setTabs((prev) => [...prev, newTab])
				setActiveTabId(chatId)
			}
			setLoadingStates((prev) => ({ ...prev, [chatId]: true }))

			try {
				// Use Chat API to fetch messages
				if (!state.chatClient) {
					console.warn('Chat client not initialized')
					setLoadingStates((prev) => ({ ...prev, [chatId]: false }))
					return
				}

				// Fetch session details and messages in parallel
				const [sessionRes, messagesRes] = await Promise.all([
					state.chatClient.GetSession(chatId).catch(() => null),
					state.chatClient.GetMessages(chatId)
				])

				// Convert stored messages to display format with assistant info
				const displayMessages = messagesRes.messages.map((msg: ChatMessage) =>
					convertStoredToDisplay(msg, messagesRes.assistants)
				)
				setChatStates((prev) => ({ ...prev, [chatId]: displayMessages }))

				// Update tab with session details (title, lastConnector, lastMode, historyLoaded)
				const title = sessionRes?.title || session?.title || (is_cn ? '历史对话' : 'Chat History')
				const lastConnector = sessionRes?.last_connector
				const mode = sessionRes?.last_mode as 'chat' | 'task' | undefined
				setTabs((prev) =>
					prev.map((t) =>
						t.chatId === chatId
							? {
									...t,
									title,
									historyLoaded: true, // Mark as loaded to prevent duplicate requests
									...(lastConnector && { lastConnector }),
									...(mode && { mode })
							  }
							: t
					)
				)
			} catch (err) {
				console.error('Failed to load history', err)
				// Set empty messages on error, but still mark as loaded to prevent retry loop
				setChatStates((prev) => ({ ...prev, [chatId]: [] }))
				setTabs((prev) => prev.map((t) => (t.chatId === chatId ? { ...t, historyLoaded: true } : t)))
			} finally {
				setLoadingStates((prev) => ({ ...prev, [chatId]: false }))
			}
		},
		[
			tabs,
			sessions,
			defaultAssistantId,
			setTabs,
			setActiveTabId,
			setLoadingStates,
			setChatStates,
			state.chatClient,
			is_cn
		]
	)

	return {
		activateTab,
		closeTab,
		createNewChat,
		loadHistory
	}
}
