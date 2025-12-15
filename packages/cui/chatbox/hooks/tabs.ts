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
 * Parse tool_call content from stored format to ToolCallProps
 * Stored format: "[{...delta1}][{...delta2}]..." concatenated JSON arrays
 * Each delta contains: index, id?, type?, function: { name?, arguments? }
 * @param content - Raw content string from storage
 * @returns Parsed ToolCallProps with id, name, arguments
 */
const parseToolCallContent = (content: string): { id?: string; name?: string; arguments?: string } => {
	if (!content) return {}

	try {
		// Split concatenated JSON arrays: "[...][...]" -> ["[...]", "[...]"]
		const chunks = content.match(/\[[^\[\]]*\]/g) || []

		let id: string | undefined
		let name: string | undefined
		let args = ''

		for (const chunk of chunks) {
			try {
				const arr = JSON.parse(chunk)
				if (Array.isArray(arr) && arr.length > 0) {
					const item = arr[0]
					// Extract id from first chunk that has it
					if (item.id && !id) {
						id = item.id
					}
					// Extract name from function
					if (item.function?.name && !name) {
						name = item.function.name
					}
					// Accumulate arguments
					if (item.function?.arguments) {
						args += item.function.arguments
					}
				}
			} catch {
				// Skip invalid chunks
			}
		}

		return { id, name, arguments: args || undefined }
	} catch {
		return {}
	}
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

	// Parse tool_call content if needed
	let props = { ...stored.props, role: stored.role }
	if (stored.type === 'tool_call' && stored.props?.content) {
		const toolCallProps = parseToolCallContent(stored.props.content)
		props = {
			...props,
			...toolCallProps
		}
	}

	return {
		ui_id: nanoid(), // Generate unique UI ID for React key
		message_id: stored.message_id,
		type: stored.type,
		props,
		block_id: stored.block_id,
		thread_id: stored.thread_id,
		delta: false, // Historical messages are complete
		metadata: {
			timestamp: new Date(stored.created_at).getTime(),
			sequence: stored.sequence,
			request_id: stored.request_id // Include request_id for reference support
		},
		// Add assistant info at message root level (same as streaming messages)
		...(assistantInfo && {
			assistant: {
				assistant_id: stored.assistant_id,
				name: assistantInfo.name,
				avatar: assistantInfo.avatar
			}
		})
	}
}

/**
 * Process messages to deduplicate consecutive assistant info
 * Only the first message from an assistant (after user message or different assistant) shows avatar
 * @param messages - Array of display messages
 * @returns Processed messages with deduplicated assistant info
 */
const deduplicateAssistantInfo = (messages: Message[]): Message[] => {
	let lastAssistantId: string | undefined = undefined

	return messages.map((msg) => {
		const msgAssistant = (msg as any).assistant

		// User messages reset the lastAssistantId
		if (msg.type === 'user_input') {
			lastAssistantId = undefined
			return msg
		}

		// For assistant messages, check if we should show the assistant info
		if (msgAssistant?.assistant_id) {
			if (msgAssistant.assistant_id === lastAssistantId) {
				// Same assistant as previous, remove assistant info
				const { assistant, ...rest } = msg as any
				return rest as Message
			}
			// Different assistant, keep info and update lastAssistantId
			lastAssistantId = msgAssistant.assistant_id
		}

		return msg
	})
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
				// Use functional update for activeTabId to avoid closure issues
				setActiveTabId((currentActiveId) => {
					if (chatId === currentActiveId) {
						if (newTabs.length > 0) {
							// Find the index of closed tab and switch to previous tab
							const closedIndex = prev.findIndex((t) => t.chatId === chatId)
							// Prefer previous tab, or next if closing first tab
							const nextIndex = closedIndex > 0 ? closedIndex - 1 : 0
							return newTabs[nextIndex]?.chatId || newTabs[newTabs.length - 1].chatId
						} else {
							// No tabs left - reset to initial empty state
							return ''
						}
					}
					return currentActiveId
				})
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
		[setTabs, setActiveTabId, setChatStates, setLoadingStates, setStreamingStates, setMessageQueues, refs]
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
					// Update tab title to show error
					setTabs((prev) =>
						prev.map((t) =>
							t.chatId === chatId
								? {
										...t,
										title: is_cn ? '加载失败' : 'Load Failed',
										historyLoaded: true
								  }
								: t
						)
					)
					return
				}

				// Fetch session details and messages in parallel
				const [sessionRes, messagesRes] = await Promise.all([
					state.chatClient.GetSession(chatId).catch(() => null),
					state.chatClient.GetMessages(chatId)
				])

				// Convert stored messages to display format with assistant info
				// Filter out 'loading' type messages as they are transient states
				// Then deduplicate consecutive assistant info
				const convertedMessages = messagesRes.messages
					.filter((msg: ChatMessage) => msg.type !== 'loading')
					.map((msg: ChatMessage) => convertStoredToDisplay(msg, messagesRes.assistants))
				const displayMessages = deduplicateAssistantInfo(convertedMessages)
				setChatStates((prev) => ({ ...prev, [chatId]: displayMessages }))

				// Update tab with session details (title, assistantId, lastConnector, lastMode, historyLoaded)
				const title = sessionRes?.title || session?.title || (is_cn ? '历史对话' : 'Chat History')
				const assistantId = sessionRes?.assistant_id || session?.assistant_id
				const lastConnector = sessionRes?.last_connector
				const mode = sessionRes?.last_mode as 'chat' | 'task' | undefined
				setTabs((prev) =>
					prev.map((t) =>
						t.chatId === chatId
							? {
									...t,
									title,
									historyLoaded: true, // Mark as loaded to prevent duplicate requests
									...(assistantId && { assistantId }), // Update assistant from session
									...(lastConnector && { lastConnector }),
									...(mode && { mode })
							  }
							: t
					)
				)
			} catch (err: any) {
				console.error('Failed to load history', err)
				// Parse error for better feedback
				const errMsg = err?.message || ''
				let errorTitle = is_cn ? '加载失败' : 'Load Failed'
				if (errMsg.includes('403') || errMsg.includes('Forbidden')) {
					errorTitle = is_cn ? '无访问权限' : 'Access Denied'
				} else if (errMsg.includes('401') || errMsg.includes('Unauthorized')) {
					errorTitle = is_cn ? '请先登录' : 'Please Login'
				} else if (errMsg.includes('404') || errMsg.includes('Not Found')) {
					errorTitle = is_cn ? '会话不存在' : 'Chat Not Found'
				}
				// Set empty messages on error, update tab title to show error
				setChatStates((prev) => ({ ...prev, [chatId]: [] }))
				setTabs((prev) =>
					prev.map((t) =>
						t.chatId === chatId ? { ...t, title: errorTitle, historyLoaded: true } : t
					)
				)
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
