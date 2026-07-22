import { useCallback, useEffect, useRef } from 'react'
import { nanoid } from 'nanoid'
import { getLocale } from '@umijs/max'
import type { ChatTab } from '../types'
import type { QueuedMessage } from './types'
import type { ChatState, ChatStateActions, ChatRefs } from './state'
import { clearMessageCache } from './delta'
import type { Message } from '../../openapi'
import { processHistoryMessages, groupAgentChildren } from '../utils/messageHistory'

export interface UseTabsOptions {
	state: ChatState
	actions: ChatStateActions
	refs: ChatRefs
	defaultAssistantId?: string
}

export function useTabs({ state, actions, refs, defaultAssistantId }: UseTabsOptions) {
	const { tabs, activeTabId, sessions, streamingStates } = state
	const { setTabs, setActiveTabId, setChatStates, setLoadingStates, setStreamingStates, setMessageQueues } = actions

	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Pagination state refs (for loadMore support)
	const hasMoreStatesRef = useRef<Record<string, boolean>>({})
	const firstSeqStatesRef = useRef<Record<string, number>>({})
	const loadingMoreStatesRef = useRef<Record<string, boolean>>({})

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
			const currentTab = tabs.find((t) => t.chatId === activeTabId)

			let targetAssistantId = assistantId
			if (!targetAssistantId) {
				targetAssistantId = currentTab?.assistantId
			}
			targetAssistantId = targetAssistantId || defaultAssistantId

			const newTab: ChatTab = {
				chatId: newId,
				title: is_cn ? '新对话' : 'New Chat',
				assistantId: targetAssistantId,
				lastWorkspace: currentTab?.lastWorkspace,
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

				const [sessionRes, messagesRes] = await Promise.all([
					state.chatClient.GetSession(chatId).catch(() => null),
					state.chatClient.GetMessages(chatId, { limit: 50, locale: getLocale() }).catch((err: any) => {
						const msg = err?.message || ''
						if (msg.includes('404') || msg.includes('Not Found')) {
							return { messages: [], assistants: {} }
						}
						throw err
					})
				])

				// Session not found on server — treat as new chat
				if (!sessionRes && messagesRes.messages.length === 0) {
					setChatStates((prev) => ({ ...prev, [chatId]: [] }))
					setTabs((prev) =>
						prev.map((t) =>
							t.chatId === chatId
								? { ...t, title: is_cn ? '新对话' : 'New Chat', isNew: true, historyLoaded: true }
								: t
						)
					)
					setLoadingStates((prev) => ({ ...prev, [chatId]: false }))
					return
				}

				// Get main assistant ID from session
				const mainAssistantId = sessionRes?.assistant_id || session?.assistant_id

				const displayMessages = processHistoryMessages(messagesRes.messages, messagesRes.assistants, mainAssistantId)
				setChatStates((prev) => ({ ...prev, [chatId]: displayMessages }))

				hasMoreStatesRef.current[chatId] = messagesRes.messages.length >= 50
				if (displayMessages.length > 0) {
					firstSeqStatesRef.current[chatId] = (displayMessages[0]?.metadata as any)?.id || 0
				}

			// Update tab with session details (title, assistantId, lastConnector, lastMode, historyLoaded)
			const title = sessionRes?.title || session?.title || (is_cn ? '历史对话' : 'Chat History')
			const assistantId = sessionRes?.assistant_id || session?.assistant_id
			const lastConnector = sessionRes?.last_connector
			const mode = sessionRes?.last_mode as 'chat' | 'task' | undefined
			const apiWorkspace = (sessionRes?.last_workspace || sessionRes?.metadata?.workspace_id) as string | undefined
			setTabs((prev) =>
				prev.map((t) =>
					t.chatId === chatId
						? {
								...t,
								title,
								historyLoaded: true, // Mark as loaded to prevent duplicate requests
								...(assistantId && { assistantId }), // Update assistant from session
								...(lastConnector && { lastConnector }),
								...(mode && { mode }),
								...(apiWorkspace && !t.lastWorkspace && { lastWorkspace: apiWorkspace })
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

	const getHasMore = useCallback((chatId: string) => {
		return hasMoreStatesRef.current[chatId] || false
	}, [])

	const getLoadingMore = useCallback((chatId: string) => {
		return loadingMoreStatesRef.current[chatId] || false
	}, [])

	const loadMoreHistory = useCallback(
		async (chatId: string) => {
			const firstId = firstSeqStatesRef.current[chatId]
			if (!firstId || loadingMoreStatesRef.current[chatId]) return
			if (!state.chatClient) return

			loadingMoreStatesRef.current[chatId] = true

			try {
				const messagesRes = await state.chatClient.GetMessages(chatId, {
					limit: 50,
					before_id: firstId,
					locale: getLocale()
				})

				const session = sessions.find((s: any) => s.chat_id === chatId)
				const mainAssistantId = session?.assistant_id || defaultAssistantId

				const olderMessages = processHistoryMessages(messagesRes.messages, messagesRes.assistants, mainAssistantId)

			setChatStates((prev) => {
				const merged = [...olderMessages, ...(prev[chatId] || [])]
				return { ...prev, [chatId]: groupAgentChildren(merged) }
			})

				hasMoreStatesRef.current[chatId] = messagesRes.messages.length >= 50
				if (olderMessages.length > 0) {
					firstSeqStatesRef.current[chatId] = (olderMessages[0]?.metadata as any)?.id || 0
				}
			} catch (err) {
				console.error('Failed to load more history', err)
			} finally {
				loadingMoreStatesRef.current[chatId] = false
			}
		},
		[state.chatClient, sessions, defaultAssistantId, setChatStates]
	)

	const updateTabAssistant = useCallback(
		(chatId: string, assistantId: string) => {
			setTabs((prev) =>
				prev.map((t) => (t.chatId === chatId ? { ...t, assistantId } : t))
			)
		},
		[setTabs]
	)

	const updateTabWorkspace = useCallback(
		(chatId: string, workspaceId: string) => {
			setTabs((prev) =>
				prev.map((t) => (t.chatId === chatId ? { ...t, lastWorkspace: workspaceId } : t))
			)
		},
		[setTabs]
	)

	return {
		activateTab,
		closeTab,
		createNewChat,
		loadHistory,
		loadMoreHistory,
		getHasMore,
		getLoadingMore,
		updateTabAssistant,
		updateTabWorkspace,
		hasMoreStatesRef,
		firstSeqStatesRef
	}
}
