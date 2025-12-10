import { useCallback, useEffect } from 'react'
import { nanoid } from 'nanoid'
import { getLocale } from '@umijs/max'
import type { ChatTab } from '../types'
import type { QueuedMessage } from './types'
import type { ChatState, ChatStateActions, ChatRefs } from './state'
import { clearMessageCache } from './delta'
import { getChatHistory } from '../services/mock'

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
				assistantId: targetAssistantId
			}
			setTabs((prev) => [...prev, newTab])
			setChatStates((prev) => ({ ...prev, [newId]: [] }))
			setActiveTabId(newId)
			clearMessageCache()
		},
		[defaultAssistantId, tabs, activeTabId, is_cn, setTabs, setChatStates, setActiveTabId]
	)

	const loadHistory = useCallback(
		async (chatId: string) => {
			if (tabs.find((t) => t.chatId === chatId)) {
				setActiveTabId(chatId)
				return
			}

			const session = sessions.find((s: any) => s.chat_id === chatId)
			const historyAssistantId = session?.assistant_id || defaultAssistantId

			const newTab: ChatTab = { chatId, title: 'Loading...', assistantId: historyAssistantId }
			setTabs((prev) => [...prev, newTab])
			setActiveTabId(chatId)
			setLoadingStates((prev) => ({ ...prev, [chatId]: true }))

			try {
				const history = await getChatHistory(chatId)
				setChatStates((prev) => ({ ...prev, [chatId]: history }))

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
		[tabs, sessions, defaultAssistantId, setTabs, setActiveTabId, setLoadingStates, setChatStates]
	)

	return {
		activateTab,
		closeTab,
		createNewChat,
		loadHistory
	}
}
