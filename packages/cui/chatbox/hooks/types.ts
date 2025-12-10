import type { Message, UserMessage } from '../../openapi'
import type { IChatSession, ChatTab, SendMessageRequest } from '../types'

export interface QueuedMessage {
	id: string
	message: UserMessage
	type: 'graceful' | 'force'
	timestamp: number
}

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
	assistant?: any

	// Tab State
	tabs: ChatTab[]
	activeTab?: ChatTab
	activeTabId: string

	// Message Queue State
	messageQueue: QueuedMessage[]

	// Actions
	sendMessage: (request: SendMessageRequest) => Promise<void>
	abort: () => void
	reset: () => void
	loadHistory: (chatId: string) => Promise<void>
	createNewChat: (assistantId?: string) => void

	// Tab Actions
	activateTab: (chatId: string) => void
	closeTab: (chatId: string) => void

	// Queue Actions
	queueMessage: (message: UserMessage, type: 'graceful' | 'force') => void
	sendQueuedMessage: (queueId?: string, asForce?: boolean) => void
	cancelQueuedMessage: (queueId: string) => void
}

// Re-export types from other files
export type { Message, UserMessage } from '../../openapi'
export type { IChatSession, ChatTab, SendMessageRequest } from '../types'
