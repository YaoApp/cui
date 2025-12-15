import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { local } from '@yaoapp/storex'
import type { Message } from '../../openapi'
import type { ChatTab } from '../types'
import type { QueuedMessage } from './types'

/**
 * Get the storage key for tabs based on user and team
 * Format: chatbox_tabs_{userId}_{teamId}
 */
const getTabsStorageKey = (userId?: string, teamId?: string): string => {
	const userPart = userId || 'anonymous'
	const teamPart = teamId || 'default'
	return `chatbox_tabs_${userPart}_${teamPart}`
}

/**
 * Load tabs from localStorage
 */
const loadTabsFromStorage = (userId?: string, teamId?: string): ChatTab[] => {
	try {
		const key = getTabsStorageKey(userId, teamId)
		const stored = local[key] as ChatTab[] | undefined
		if (stored && Array.isArray(stored)) {
			// Filter out any invalid tabs
			return stored.filter((tab) => tab && tab.chatId && tab.title)
		}
	} catch (e) {
		console.warn('Failed to load tabs from storage:', e)
	}
	return []
}

/**
 * Save tabs to localStorage
 */
const saveTabsToStorage = (tabs: ChatTab[], userId?: string, teamId?: string): void => {
	try {
		const key = getTabsStorageKey(userId, teamId)
		// Only save essential tab data (chatId, title, assistantId)
		const tabsToSave = tabs.map((tab) => ({
			chatId: tab.chatId,
			title: tab.title,
			assistantId: tab.assistantId
		}))
		local[key] = tabsToSave
	} catch (e) {
		console.warn('Failed to save tabs to storage:', e)
	}
}

/**
 * Load active tab ID from localStorage
 */
const loadActiveTabIdFromStorage = (userId?: string, teamId?: string): string => {
	try {
		const key = `${getTabsStorageKey(userId, teamId)}_active`
		const stored = local[key] as string | undefined
		return stored || ''
	} catch (e) {
		console.warn('Failed to load active tab from storage:', e)
	}
	return ''
}

/**
 * Save active tab ID to localStorage
 */
const saveActiveTabIdToStorage = (activeTabId: string, userId?: string, teamId?: string): void => {
	try {
		const key = `${getTabsStorageKey(userId, teamId)}_active`
		local[key] = activeTabId
	} catch (e) {
		console.warn('Failed to save active tab to storage:', e)
	}
}

export interface ChatRefs {
	abortHandles: React.MutableRefObject<Record<string, () => void>>
	streamIds: React.MutableRefObject<Record<string, string>>
	assistantInfo: React.MutableRefObject<Record<string, any>>
	shouldAddAssistant: React.MutableRefObject<Record<string, boolean>>
	contextIds: React.MutableRefObject<Record<string, string>>
	requestIds: React.MutableRefObject<Record<string, string>>
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

export interface UseChatStateOptions {
	userId?: string
	teamId?: string
}

export function useChatState(options: UseChatStateOptions = {}): [ChatState, ChatStateActions, ChatRefs] {
	const { userId, teamId } = options

	// Chat States Map: chatId -> messages
	const [chatStates, setChatStates] = useState<Record<string, Message[]>>({})

	// Tabs - Start empty, will be loaded from storage in useEffect
	const [tabs, setTabs] = useState<ChatTab[]>([])
	const [activeTabId, setActiveTabId] = useState<string>('')

	// Track user/team changes to re-sync storage
	const userTeamKeyRef = useRef<string | null>(null)
	// Track if initial load has been done
	const initialLoadDoneRef = useRef<boolean>(false)

	// Load tabs when userId/teamId changes (including initial load)
	useEffect(() => {
		const newKey = `${userId}_${teamId}`

		// Skip if userId is not available yet (waiting for auth)
		if (userId === undefined) {
			return
		}

		// Check if this is a new user/team context
		if (userTeamKeyRef.current !== newKey) {
			userTeamKeyRef.current = newKey
			const storedTabs = loadTabsFromStorage(userId, teamId)
			const storedActiveTabId = loadActiveTabIdFromStorage(userId, teamId)
			setTabs(storedTabs)
			setActiveTabId(storedActiveTabId)
			// Clear chat states when switching users
			if (initialLoadDoneRef.current) {
				setChatStates({})
			}
			initialLoadDoneRef.current = true
		}
	}, [userId, teamId])

	// Persist tabs to storage when they change
	useEffect(() => {
		// Only save if we have a valid user context and initial load is done
		if (!initialLoadDoneRef.current || userTeamKeyRef.current === null) {
			return
		}
		saveTabsToStorage(tabs, userId, teamId)
	}, [tabs, userId, teamId])

	// Persist active tab to storage when it changes
	useEffect(() => {
		// Only save if we have a valid user context and initial load is done
		if (!initialLoadDoneRef.current || userTeamKeyRef.current === null) {
			return
		}
		saveActiveTabIdToStorage(activeTabId, userId, teamId)
	}, [activeTabId, userId, teamId])

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
	const requestIdsRef = useRef<Record<string, string>>({})
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
			requestIds: requestIdsRef,
			titleGenerated: titleGeneratedRef,
			completedMessages: completedMessagesRef
		}),
		[]
	)

	return [state, actions, refs]
}
