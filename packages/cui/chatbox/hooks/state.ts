import { useState, useCallback, useRef, useMemo } from 'react'
import type { Message } from '../../openapi'
import type { ChatTab } from '../types'
import type { QueuedMessage } from './types'

export interface ChatRefs {
	abortHandles: React.MutableRefObject<Record<string, () => void>>
	streamIds: React.MutableRefObject<Record<string, string>>
	assistantInfo: React.MutableRefObject<Record<string, any>>
	shouldAddAssistant: React.MutableRefObject<Record<string, boolean>>
	contextIds: React.MutableRefObject<Record<string, string>>
	titleGenerated: React.MutableRefObject<Record<string, boolean>>
	completedMessages: React.MutableRefObject<Record<string, boolean>>
}

export interface ChatState {
	chatStates: Record<string, Message[]>
	tabs: ChatTab[]
	activeTabId: string
	sessions: any[]
	loadingStates: Record<string, boolean>
	streamingStates: Record<string, boolean>
	messageQueues: Record<string, QueuedMessage[]>
	assistant: any
	chatClient: any
}

export interface ChatStateActions {
	setChatStates: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>
	setTabs: React.Dispatch<React.SetStateAction<ChatTab[]>>
	setActiveTabId: React.Dispatch<React.SetStateAction<string>>
	setSessions: React.Dispatch<React.SetStateAction<any[]>>
	setLoadingStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	setStreamingStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	setMessageQueues: React.Dispatch<React.SetStateAction<Record<string, QueuedMessage[]>>>
	setAssistant: React.Dispatch<React.SetStateAction<any>>
	setChatClient: React.Dispatch<React.SetStateAction<any>>
	updateMessages: (chatId: string, updater: (prev: Message[]) => Message[]) => void
}

export function useChatState(): [ChatState, ChatStateActions, ChatRefs] {
	// Chat States Map: chatId -> messages
	const [chatStates, setChatStates] = useState<Record<string, Message[]>>({})

	// Tabs - Start empty
	const [tabs, setTabs] = useState<ChatTab[]>([])
	const [activeTabId, setActiveTabId] = useState<string>('')

	const [sessions, setSessions] = useState<any[]>([])

	// Loading/Streaming States Map: chatId -> boolean
	const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
	const [streamingStates, setStreamingStates] = useState<Record<string, boolean>>({})

	// Message Queue State Map: chatId -> queue
	const [messageQueues, setMessageQueues] = useState<Record<string, QueuedMessage[]>>({})

	const [assistant, setAssistant] = useState<any>(null)
	const [chatClient, setChatClient] = useState<any>(null)

	// Refs
	const abortHandlesRef = useRef<Record<string, () => void>>({})
	const streamIdRef = useRef<Record<string, string>>({})
	const assistantInfoRef = useRef<Record<string, any>>({})
	const shouldAddAssistantRef = useRef<Record<string, boolean>>({})
	const contextIdsRef = useRef<Record<string, string>>({})
	const titleGeneratedRef = useRef<Record<string, boolean>>({})
	const completedMessagesRef = useRef<Record<string, boolean>>({})

	// Helper to update messages for a specific chat ID
	const updateMessages = useCallback((chatId: string, updater: (prev: Message[]) => Message[]) => {
		setChatStates((prev) => ({
			...prev,
			[chatId]: updater(prev[chatId] || [])
		}))
	}, [])

	const state: ChatState = {
		chatStates,
		tabs,
		activeTabId,
		sessions,
		loadingStates,
		streamingStates,
		messageQueues,
		assistant,
		chatClient
	}

	// Memoize actions to prevent unnecessary re-renders
	const actions: ChatStateActions = useMemo(
		() => ({
			setChatStates,
			setTabs,
			setActiveTabId,
			setSessions,
			setLoadingStates,
			setStreamingStates,
			setMessageQueues,
			setAssistant,
			setChatClient,
			updateMessages
		}),
		[updateMessages]
	)

	// Memoize refs to prevent unnecessary re-renders
	const refs: ChatRefs = useMemo(
		() => ({
			abortHandles: abortHandlesRef,
			streamIds: streamIdRef,
			assistantInfo: assistantInfoRef,
			shouldAddAssistant: shouldAddAssistantRef,
			contextIds: contextIdsRef,
			titleGenerated: titleGeneratedRef,
			completedMessages: completedMessagesRef
		}),
		[]
	)

	return [state, actions, refs]
}
