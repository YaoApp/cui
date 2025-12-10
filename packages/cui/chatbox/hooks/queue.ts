import { useCallback } from 'react'
import { nanoid } from 'nanoid'
import type { UserMessage, Message } from '../../openapi'
import { Chat } from '../../openapi'
import type { QueuedMessage } from './types'
import type { ChatRefs } from './state'

export interface UseQueueOptions {
	chatClient: Chat | null
	activeTabId: string
	messageQueues: Record<string, QueuedMessage[]>
	setMessageQueues: React.Dispatch<React.SetStateAction<Record<string, QueuedMessage[]>>>
	updateMessages: (chatId: string, updater: (prev: Message[]) => Message[]) => void
	refs: ChatRefs
}

export function useQueue({
	chatClient,
	activeTabId,
	messageQueues,
	setMessageQueues,
	updateMessages,
	refs
}: UseQueueOptions) {
	// Send queued messages using AppendMessages API
	const appendQueuedMessages = useCallback(
		async (queuedMessages: UserMessage[], targetTabId: string, type: 'graceful' | 'force' = 'graceful') => {
			if (!chatClient) {
				console.error('Chat client not initialized')
				return
			}

			const contextId = refs.contextIds.current[targetTabId]
			if (!contextId) {
				console.error('No context_id available for appending messages')
				return
			}

			try {
				const userMessages: Message[] = queuedMessages.map((msg) => ({
					ui_id: nanoid(),
					type: 'user_input',
					chunk_id: `user-${Date.now()}`,
					props: {
						content: msg.content,
						role: msg.role,
						name: msg.name
					}
				}))
				updateMessages(targetTabId, (prev) => [...prev, ...userMessages])

				await chatClient.AppendMessages(contextId, queuedMessages, type)
			} catch (err) {
				console.error('Failed to append messages:', err)
			}
		},
		[chatClient, updateMessages, refs]
	)

	// Queue a message
	const queueMessage = useCallback(
		(message: UserMessage, type: 'graceful' | 'force' = 'graceful') => {
			if (!activeTabId) return

			const queuedMsg: QueuedMessage = {
				id: nanoid(),
				message,
				type,
				timestamp: Date.now()
			}

			setMessageQueues((prev) => ({
				...prev,
				[activeTabId]: [...(prev[activeTabId] || []), queuedMsg]
			}))

			const contextId = refs.contextIds.current[activeTabId]
			if (contextId && chatClient) {
				chatClient.AppendMessages(contextId, [message], 'graceful').catch((err) => {
					console.error('Failed to append message:', err)
				})
			}
		},
		[activeTabId, chatClient, setMessageQueues, refs]
	)

	// Send all queued messages immediately (force mode)
	const sendQueuedMessage = useCallback(
		(queueId?: string, asForce: boolean = true) => {
			if (!activeTabId) return

			const queue = messageQueues[activeTabId] || []
			if (queue.length === 0) return

			const contextId = refs.contextIds.current[activeTabId]
			if (!contextId) {
				console.error('No context_id available')
				return
			}

			const allQueuedMessages = queue.map((q) => q.message)
			appendQueuedMessages(allQueuedMessages, activeTabId, 'force')

			setMessageQueues((prev) => ({
				...prev,
				[activeTabId]: []
			}))
		},
		[activeTabId, messageQueues, appendQueuedMessages, setMessageQueues, refs]
	)

	// Cancel a queued message
	const cancelQueuedMessage = useCallback(
		(queueId: string) => {
			if (!activeTabId) return

			setMessageQueues((prev) => {
				const queue = prev[activeTabId] || []
				const newQueue = queue.filter((m) => m.id !== queueId)
				return { ...prev, [activeTabId]: newQueue }
			})
		},
		[activeTabId, setMessageQueues]
	)

	return {
		appendQueuedMessages,
		queueMessage,
		sendQueuedMessage,
		cancelQueuedMessage
	}
}
