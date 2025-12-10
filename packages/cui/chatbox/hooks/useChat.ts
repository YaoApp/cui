import { useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { useGlobal } from '@/context/app'
import { Chat } from '../../openapi'
import { Agent } from '../../openapi/agent'
import { getRecentChats } from '../services/mock'

import type { UseChatOptions, UseChatReturn } from './types'
import { useChatState } from './state'
import { useTabs } from './tabs'
import { useTitle } from './title'
import { useQueue } from './queue'
import { useStream } from './stream'

export type { QueuedMessage, UseChatOptions, UseChatReturn } from './types'

export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
	const { assistantId: propAssistantId } = options
	const global = useGlobal()

	// Determine effective assistant ID for defaults
	const defaultAssistantId = propAssistantId || global.default_assistant?.assistant_id

	// Get user and team info for tabs storage persistence
	// Use global.user (MobX observable) for reactive updates when user switches
	// Convert id to string since it can be number | string
	const userId = global.user?.id != null ? String(global.user.id) : undefined
	const teamId = global.user?.team_id

	// Initialize state with user/team context for storage persistence
	const [state, actions, refs] = useChatState({ userId, teamId })
	const {
		chatStates,
		tabs,
		activeTabId,
		sessions,
		loadingStates,
		streamingStates,
		messageQueues,
		assistant,
		chatClient
	} = state

	// Derived states for active tab
	const messages = activeTabId ? chatStates[activeTabId] || [] : []
	const loading = activeTabId ? loadingStates[activeTabId] || false : false
	const streaming = activeTabId ? streamingStates[activeTabId] || false : false
	const messageQueue = activeTabId ? messageQueues[activeTabId] || [] : []
	const currentChatId = activeTabId || undefined

	// Get current assistant ID from active tab
	const activeTab = tabs.find((t) => t.chatId === activeTabId)
	const currentAssistantId = activeTab?.assistantId || defaultAssistantId

	// Initialize Chat Client - only run once
	useEffect(() => {
		if (window.$app?.openapi) {
			actions.setChatClient(new Chat(window.$app.openapi))
		} else {
			console.warn('OpenAPI not initialized in window.$app')
		}

		// Load sessions
		getRecentChats().then(actions.setSessions)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Fetch Assistant Info using GetInfo API - only when assistant ID changes
	useEffect(() => {
		if (!window.$app?.openapi || !currentAssistantId) return

		const agentClient = new Agent(window.$app.openapi)
		const fetchAssistant = async () => {
			try {
				const locale = getLocale() || 'en-us'
				const res = await agentClient.assistants.GetInfo(currentAssistantId, locale)
				if (!window.$app.openapi.IsError(res)) {
					const data = window.$app.openapi.GetData(res)
					actions.setAssistant({
						id: data.assistant_id,
						name: data.name,
						avatar: data.avatar,
						description: data.description,
						connector: data.connector,
						connector_options: data.connector_options,
						modes: data.modes,
						default_mode: data.default_mode,
						allowModelSelection: data.connector_options?.optional || false,
						defaultModel: data.connector
					})
				}
			} catch (err) {
				console.error('Failed to fetch assistant info:', err)
			}
		}

		fetchAssistant()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentAssistantId])

	// Title generation
	const { generateChatTitle } = useTitle({
		chatClient,
		titleAgentId: global.agent_uses?.title,
		setTabs: actions.setTabs,
		refs
	})

	// Tab management
	const { activateTab, closeTab, createNewChat, loadHistory } = useTabs({
		state,
		actions,
		refs,
		defaultAssistantId
	})

	// Auto-load history when tab is activated
	// Skip for: newly created tabs (isNew) or already loaded tabs (historyLoaded)
	useEffect(() => {
		if (!activeTabId || !chatClient || !activeTab) return

		// Skip if this is a newly created chat
		if (activeTab.isNew) return

		// Skip if history already loaded
		if (activeTab.historyLoaded) return

		// Load history for restored tabs
		loadHistory(activeTabId)
	}, [activeTabId, chatClient, activeTab, loadHistory])

	// Queue management
	const { queueMessage, sendQueuedMessage, cancelQueuedMessage } = useQueue({
		chatClient,
		activeTabId,
		messageQueues,
		setMessageQueues: actions.setMessageQueues,
		updateMessages: actions.updateMessages,
		refs
	})

	// Stream and message sending
	const { sendMessage, abort, reset } = useStream({
		chatClient,
		tabs,
		activeTabId,
		defaultAssistantId,
		updateMessages: actions.updateMessages,
		setTabs: actions.setTabs,
		setChatStates: actions.setChatStates,
		setActiveTabId: actions.setActiveTabId,
		setStreamingStates: actions.setStreamingStates,
		setMessageQueues: actions.setMessageQueues,
		refs,
		generateChatTitle
	})

	return {
		messages,
		sessions,
		currentChatId,
		loading,
		streaming,
		assistant,
		tabs,
		activeTab,
		activeTabId,
		messageQueue,
		sendMessage,
		abort,
		reset,
		loadHistory,
		createNewChat,
		activateTab,
		closeTab,
		queueMessage,
		sendQueuedMessage,
		cancelQueuedMessage
	}
}
