import { useCallback } from 'react'
import { nanoid } from 'nanoid'
import { getLocale } from '@umijs/max'
import type { Message, UserMessage } from '../../openapi'
import { Chat } from '../../openapi'
import type { ChatTab, SendMessageRequest } from '../types'
import type { QueuedMessage } from './types'
import type { ChatRefs } from './state'
import { applyDelta, clearMessageCache } from './delta'

export interface UseStreamOptions {
	chatClient: Chat | null
	tabs: ChatTab[]
	activeTabId: string
	defaultAssistantId?: string
	updateMessages: (chatId: string, updater: (prev: Message[]) => Message[]) => void
	setTabs: React.Dispatch<React.SetStateAction<ChatTab[]>>
	setChatStates: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>
	setActiveTabId: React.Dispatch<React.SetStateAction<string>>
	setStreamingStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	setMessageQueues: React.Dispatch<React.SetStateAction<Record<string, QueuedMessage[]>>>
	refs: ChatRefs
	generateChatTitle: (targetTabId: string, currentMessages: Message[]) => Promise<void>
}

// Stream chunk handler - processes incoming stream chunks
function createChunkHandler(
	targetTabId: string,
	refs: ChatRefs,
	updateMessages: (chatId: string, updater: (prev: Message[]) => Message[]) => void,
	setStreamingStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
	setMessageQueues: React.Dispatch<React.SetStateAction<Record<string, QueuedMessage[]>>>,
	tabs: ChatTab[],
	defaultAssistantId: string | undefined,
	startNewStreamWithMessages: (messages: UserMessage[], targetTabId: string, targetAssistantId: string) => void,
	generateChatTitle?: (targetTabId: string, currentMessages: Message[]) => Promise<void>
) {
	return (chunk: Message) => {
		// Event handling
		if (chunk.type === 'event') {
			if (chunk.props?.event === 'stream_start') {
				const ctxId = chunk.props?.data?.context_id
				if (ctxId) {
					refs.contextIds.current[targetTabId] = ctxId
				}
				const reqId = chunk.props?.data?.request_id
				if (reqId) {
					refs.requestIds.current[targetTabId] = reqId
				}
				const assistantInfo = chunk.props?.data?.assistant
				if (assistantInfo) {
					refs.assistantInfo.current[targetTabId] = assistantInfo
					refs.shouldAddAssistant.current[targetTabId] = true
				}
				const streamId = nanoid()
				refs.streamIds.current[targetTabId] = streamId
				refs.completedMessages.current = {}

				// Open sidebar trace view for task mode
				const metadata = chunk.props?.data?.metadata
				const traceId = chunk.props?.data?.trace_id
				if (metadata?.mode === 'task' && traceId) {
					if (window.$app?.Event) {
						const locale = getLocale()
						const is_cn = locale === 'zh-CN'
						// Use short trace ID for display (last 8 chars, since trace ID is timestamp-based)
						const shortTraceId = traceId.length > 8 ? traceId.slice(-8) : traceId
						window.$app.Event.emit('app/openSidebar', {
							url: `/trace/${traceId}`,
							title: `${is_cn ? '追踪' : 'Trace'} ${shortTraceId}`,
							icon: 'material-timeline',
							forceNormal: true
						})
					}
				}
			}

			if (chunk.props?.event === 'message_end') {
				const rawMessageId = chunk.props?.data?.message_id
				if (rawMessageId) {
					const streamId = refs.streamIds.current[targetTabId] || 'default'
					const messageId = `${streamId}:${rawMessageId}`

					refs.completedMessages.current[messageId] = true
					clearMessageCache(targetTabId, messageId)

					updateMessages(targetTabId, (prev) => {
						const index = prev.findIndex((m) => m.message_id === messageId)
						if (index !== -1) {
							const newArr = [...prev]
							newArr[index] = { ...newArr[index], delta: false }
							return newArr
						}
						return prev
					})
				}
			}

			if (chunk.props?.event === 'stream_end') {
				setStreamingStates((prev) => ({ ...prev, [targetTabId]: false }))
				delete refs.abortHandles.current[targetTabId]

				// Display error message if stream ended with error status
				const streamEndData = chunk.props?.data
				if (streamEndData?.status === 'error' && streamEndData?.error) {
					updateMessages(targetTabId, (prev) => {
						const errorMessage = {
							type: 'error' as const,
							props: {
								message: streamEndData.error,
								code: streamEndData.request_id || undefined,
								details: undefined
							}
						}
						return [...prev, errorMessage]
					})
				}

				// Generate title on first round completion
				// Title generation logic checks if it's first round internally
				if (generateChatTitle) {
					updateMessages(targetTabId, (prev) => {
						generateChatTitle(targetTabId, prev)
						return prev
					})
				}

				// Process queue
				setMessageQueues((prev) => {
					const queue = prev[targetTabId] || []
					if (queue.length > 0) {
						const allMessages = queue.map((q) => q.message)
						const tab = tabs.find((t) => t.chatId === targetTabId)
						const assistantId = tab?.assistantId || defaultAssistantId

						if (assistantId) {
							setTimeout(() => {
								startNewStreamWithMessages(allMessages, targetTabId, assistantId)
							}, 100)
						} else {
							console.error('No assistant ID for sending queued messages')
						}

						return { ...prev, [targetTabId]: [] }
					}
					return prev
				})
			}

			return
		}

		// Type change handling
		const streamId = refs.streamIds.current[targetTabId] || 'default'
		const rawMessageId = chunk.message_id || chunk.chunk_id || `ai-response-unknown`
		const messageId = `${streamId}:${rawMessageId}`

		if (chunk.type_change) {
			clearMessageCache(targetTabId, messageId)
			updateMessages(targetTabId, (prev) => {
				const index = prev.findIndex((m) => m.message_id === messageId)
				if (index !== -1) {
					const newArr = [...prev]
					newArr[index] = { ...chunk, message_id: messageId, delta: false }
					return newArr
				}
				return [...prev, { ...chunk, message_id: messageId }]
			})
			return
		}

		// Apply Delta
		const mergedState = applyDelta(targetTabId, messageId, chunk)
		const isCompleted = refs.completedMessages.current[messageId]

		updateMessages(targetTabId, (prev) => {
			const index = prev.findIndex((m) => m.message_id === messageId)
			const assistantInfo = refs.assistantInfo.current[targetTabId]
			const shouldAdd = refs.shouldAddAssistant.current[targetTabId]

			// Get current request_id for reference support
			const requestId = refs.requestIds.current[targetTabId]

			if (index !== -1) {
				const newArr = [...prev]
				newArr[index] = {
					...newArr[index],
					chunk_id: chunk.chunk_id,
					message_id: messageId,
					block_id: chunk.block_id,
					thread_id: chunk.thread_id,
					type: mergedState.type,
					props: mergedState.props,
					delta: isCompleted ? false : chunk.delta,
					metadata: {
						...newArr[index].metadata,
						request_id: requestId
					}
				}
				return newArr
			} else {
				let finalShouldAdd = shouldAdd
				if (finalShouldAdd && assistantInfo && prev.length > 0) {
					const lastMsg = prev[prev.length - 1]
					if (lastMsg.type !== 'user_input') {
						const prevAssistant = (lastMsg as any).assistant
						if (prevAssistant && prevAssistant.assistant_id === assistantInfo.assistant_id) {
							finalShouldAdd = false
						}
					}
				}

				const newMessage: Message = {
					ui_id: nanoid(),
					chunk_id: chunk.chunk_id,
					message_id: messageId,
					block_id: chunk.block_id,
					thread_id: chunk.thread_id,
					type: mergedState.type,
					props: mergedState.props,
					delta: isCompleted ? false : chunk.delta,
					metadata: { request_id: requestId },
					...(finalShouldAdd && assistantInfo && { assistant: assistantInfo })
				}
				if (shouldAdd) {
					refs.shouldAddAssistant.current[targetTabId] = false
				}
				return [...prev, newMessage]
			}
		})
	}
}

export function useStream({
	chatClient,
	tabs,
	activeTabId,
	defaultAssistantId,
	updateMessages,
	setTabs,
	setChatStates,
	setActiveTabId,
	setStreamingStates,
	setMessageQueues,
	refs,
	generateChatTitle
}: UseStreamOptions) {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Get current assistant ID from active tab
	const activeTab = tabs.find((t) => t.chatId === activeTabId)
	const currentAssistantId = activeTab?.assistantId || defaultAssistantId

	// Start a new stream with multiple messages (for queue processing)
	const startNewStreamWithMessages = useCallback(
		async (messages: UserMessage[], targetTabId: string, targetAssistantId: string) => {
			if (!chatClient) {
				console.error('Chat client not initialized')
				return
			}

			setStreamingStates((prev) => ({ ...prev, [targetTabId]: true }))

			const userMessages: Message[] = messages.map((msg) => ({
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

			try {
				const abortFn = chatClient.StreamCompletion(
					{
						assistant_id: targetAssistantId,
						chat_id: targetTabId,
						messages: messages,
						locale: getLocale()
					},
					createChunkHandler(
						targetTabId,
						refs,
						updateMessages,
						setStreamingStates,
						setMessageQueues,
						tabs,
						defaultAssistantId,
						startNewStreamWithMessages
					),
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
						delete refs.abortHandles.current[targetTabId]
					}
				)

				refs.abortHandles.current[targetTabId] = abortFn
			} catch (err) {
				console.error('Failed to start new stream:', err)
				setStreamingStates((prev) => ({ ...prev, [targetTabId]: false }))
			}
		},
		[chatClient, updateMessages, setStreamingStates, setMessageQueues, tabs, defaultAssistantId, refs]
	)

	// Send Message
	const sendMessage = useCallback(
		async (request: SendMessageRequest) => {
			const inputMsg = request.messages[0]
			let targetTabId = activeTabId
			let targetAssistantId = currentAssistantId

			if (!targetTabId) {
				const newId = nanoid()
				targetAssistantId = defaultAssistantId
				const newTab: ChatTab = {
					chatId: newId,
					title: is_cn ? '新对话' : 'New Chat',
					assistantId: targetAssistantId,
					isNew: true // Mark as newly created, not loaded from history
				}
				setTabs((prev) => [...prev, newTab])
				setChatStates((prev) => ({ ...prev, [newId]: [] }))
				setActiveTabId(newId)
				targetTabId = newId
			} else {
				const tab = tabs.find((t) => t.chatId === targetTabId)
				if (tab && tab.assistantId) {
					targetAssistantId = tab.assistantId
				}
			}

			if (!chatClient) {
				console.error('Chat client not initialized')
				return
			}

			setStreamingStates((prev) => ({ ...prev, [targetTabId]: true }))

			const userMsg: Message = {
				ui_id: nanoid(),
				type: 'user_input',
				chunk_id: `user-${Date.now()}`,
				props: {
					content: inputMsg.content,
					role: inputMsg.role,
					name: inputMsg.name
				}
			}
			updateMessages(targetTabId, (prev) => [...prev, userMsg])

			try {
				if (!targetAssistantId) {
					console.error('Assistant ID is missing')
					setStreamingStates((prev) => ({ ...prev, [targetTabId]: false }))
					return
				}

				const abortFn = chatClient.StreamCompletion(
					{
						assistant_id: targetAssistantId,
						chat_id: targetTabId,
						messages: request.messages,
						model: request.model,
						locale: request.locale,
						metadata: request.metadata,
						options: request.options,
						skip: request.skip
					},
					createChunkHandler(
						targetTabId,
						refs,
						updateMessages,
						setStreamingStates,
						setMessageQueues,
						tabs,
						defaultAssistantId,
						startNewStreamWithMessages,
						generateChatTitle
					),
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
						delete refs.abortHandles.current[targetTabId]
					}
				)

				refs.abortHandles.current[targetTabId] = abortFn
			} catch (err) {
				console.error('Failed to send message:', err)
				setStreamingStates((prev) => ({ ...prev, [targetTabId]: false }))
			}
		},
		[
			chatClient,
			defaultAssistantId,
			currentAssistantId,
			activeTabId,
			updateMessages,
			tabs,
			is_cn,
			setTabs,
			setChatStates,
			setActiveTabId,
			setStreamingStates,
			setMessageQueues,
			refs,
			startNewStreamWithMessages,
			generateChatTitle
		]
	)

	const abort = useCallback(() => {
		if (!activeTabId) return
		const abortFn = refs.abortHandles.current[activeTabId]
		if (abortFn) {
			abortFn()
			delete refs.abortHandles.current[activeTabId]
		}
		setStreamingStates((prev) => ({ ...prev, [activeTabId]: false }))
	}, [activeTabId, refs, setStreamingStates])

	const reset = useCallback(() => {
		if (!activeTabId) return
		updateMessages(activeTabId, () => [])
		clearMessageCache(activeTabId)
	}, [activeTabId, updateMessages])

	return {
		sendMessage,
		abort,
		reset,
		startNewStreamWithMessages
	}
}
