import { useState, useCallback, useEffect, useRef } from 'react'
import { nanoid } from 'nanoid'
import { getLocale } from '@umijs/max'
import { useGlobal } from '@/context/app'
import { Chat } from '../../openapi'
import { Agent } from '../../openapi/agent'
import type { Message, UserMessage } from '../../openapi'
import type { IChatSession, ChatTab, SendMessageRequest } from '../types'
import { applyDelta, clearMessageCache } from '../utils/delta'
import { getRecentChats, getChatHistory } from '../services/mock'

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
	assistant?: any // Added assistant info

	// Tab State
	tabs: ChatTab[]
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

export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
	const { assistantId: propAssistantId } = options
	const global = useGlobal()
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Determine effective assistant ID for *defaults*
	// 1. Prop
	// 2. Global default assistant
	const defaultAssistantId = propAssistantId || global.default_assistant?.assistant_id

	// Chat States Map: chatId -> messages
	const [chatStates, setChatStates] = useState<Record<string, Message[]>>({})

	// Tabs - Start empty
	const [tabs, setTabs] = useState<ChatTab[]>([])
	const [activeTabId, setActiveTabId] = useState<string>('')

	const [sessions, setSessions] = useState<IChatSession[]>([])

	// Loading/Streaming States Map: chatId -> boolean
	const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
	const [streamingStates, setStreamingStates] = useState<Record<string, boolean>>({})

	// Sync streaming state to tabs
	useEffect(() => {
		setTabs((prevTabs) =>
			prevTabs.map((tab) => ({
				...tab,
				streaming: streamingStates[tab.chatId] || false
			}))
		)
	}, [streamingStates])

	// Message Queue State Map: chatId -> queue
	const [messageQueues, setMessageQueues] = useState<Record<string, QueuedMessage[]>>({})

	const [assistant, setAssistant] = useState<any>(null) // Assistant info

	const [chatClient, setChatClient] = useState<Chat | null>(null)
	// Abort Handles Map: chatId -> abort function
	const abortHandlesRef = useRef<Record<string, () => void>>({})

	// Stream ID Map: chatId -> current stream ID (to namespace message_id across different streams)
	const streamIdRef = useRef<Record<string, string>>({})

	// Assistant Info Map: chatId -> assistant info from stream_start
	const assistantInfoRef = useRef<Record<string, any>>({})

	// Track if we should add assistant info to the next message for each chat
	// This is set to true when stream_start has a different assistant than the last message
	const shouldAddAssistantRef = useRef<Record<string, boolean>>({})

	// Derived states for active tab
	const messages = activeTabId ? chatStates[activeTabId] || [] : []
	const loading = activeTabId ? loadingStates[activeTabId] || false : false
	const streaming = activeTabId ? streamingStates[activeTabId] || false : false
	const messageQueue = activeTabId ? messageQueues[activeTabId] || [] : []

	// currentChatId is activeTabId
	const currentChatId = activeTabId || undefined

	// Get current assistant ID from active tab
	const activeTab = tabs.find((t) => t.chatId === activeTabId)
	const currentAssistantId = activeTab?.assistantId || defaultAssistantId

	// Initialize Chat Client
	useEffect(() => {
		if (window.$app?.openapi) {
			setChatClient(new Chat(window.$app.openapi))
		} else {
			console.warn('OpenAPI not initialized in window.$app')
		}

		// Load sessions
		getRecentChats().then(setSessions)
	}, [])

	// Fetch Assistant Info using GetInfo API (optimized for InputArea)
	useEffect(() => {
		// If we have a currentAssistantId, fetch it.
		// If not (e.g. new chat without inherited ID), we might fallback to default or wait.
		if (!window.$app?.openapi) return

		const fetchId = currentAssistantId

		const fetchAssistant = async () => {
			if (!fetchId) return // Don't fetch if no ID

			const agentClient = new Agent(window.$app.openapi)
			try {
				// Use GetInfo API - optimized for InputArea with minimal fields
				// Returns: id, name, avatar, description, connector, connector_options, modes, default_mode
				const locale = getLocale() || 'en-us'
				const res = await agentClient.assistants.GetInfo(fetchId, locale)
				if (!window.$app.openapi.IsError(res)) {
					const data = window.$app.openapi.GetData(res)
					// GetInfo returns: assistant_id, name, avatar, description, connector, connector_options, modes, default_mode
					setAssistant({
						id: data.assistant_id,
						name: data.name,
						avatar: data.avatar,
						description: data.description,
						connector: data.connector,
						connector_options: data.connector_options,
						modes: data.modes,
						default_mode: data.default_mode,
						// For backward compatibility with InputArea
						allowModelSelection: data.connector_options?.optional || false,
						defaultModel: data.connector // Use connector as default model for now
					})
				}
			} catch (err) {
				console.error('Failed to fetch assistant info:', err)
			}
		}

		fetchAssistant()
	}, [currentAssistantId])

	// Helper to update messages for a specific chat ID
	const updateMessages = useCallback((chatId: string, updater: (prev: Message[]) => Message[]) => {
		setChatStates((prev) => ({
			...prev,
			[chatId]: updater(prev[chatId] || [])
		}))
	}, [])

	// Send queued messages using AppendMessages API
	const appendQueuedMessages = useCallback(
		async (queuedMessages: UserMessage[], targetTabId: string, type: 'graceful' | 'force' = 'graceful') => {
			if (!chatClient) {
				console.error('Chat client not initialized')
				return
			}

			const contextId = contextIdsRef.current[targetTabId]
			if (!contextId) {
				console.error('No context_id available for appending messages')
				return
			}

			try {
				// Add all User Messages to UI first (convert UserMessage to Message format)
				const userMessages: Message[] = queuedMessages.map((msg) => ({
					ui_id: nanoid(), // Unique UI ID for React key
					type: 'user_input',
					chunk_id: `user-${Date.now()}`,
					props: {
						content: msg.content,
						role: msg.role,
						name: msg.name
					}
				}))
				updateMessages(targetTabId, (prev) => [...prev, ...userMessages])

				// Send to backend using AppendMessages API
				await chatClient.AppendMessages(contextId, queuedMessages, type)

				// Note: Don't clear queue here, wait for backend's response
			} catch (err) {
				console.error('Failed to append messages:', err)
			}
		},
		[chatClient, updateMessages]
	)

	// Generate chat title using title agent
	const generateChatTitle = useCallback(
		async (targetTabId: string, currentMessages: Message[], model?: string, metadata?: Record<string, any>) => {
			// Check if title agent is configured
			const titleAgentId = global.agent_uses?.title
			if (!titleAgentId || !chatClient) {
				return
			}

			// Mark as generated to prevent duplicate calls
			titleGeneratedRef.current[targetTabId] = true

			try {
				// Extract conversation content for title generation
				const conversationText = currentMessages
					.filter((msg) => msg.type === 'text' && msg.props?.content)
					.map((msg) => msg.props?.content || '')
					.join('\n')
					.slice(0, 500) // Limit length

				if (!conversationText) {
					return
				}

				let generatedTitle = ''

				// Get current locale
				const locale = getLocale() || 'en-us'
				const languageHint = locale.startsWith('zh')
					? 'Please generate the title in Chinese.'
					: 'Please generate the title in English.'

				// Call title agent with skip history and trace
				chatClient.StreamCompletion(
					{
						assistant_id: titleAgentId,
						messages: [
							{
								role: 'user',
								content: `Generate a short title for this conversation. ${languageHint}\n\nConversation:\n${conversationText}`
							}
						],
						model: model, // Use user selected model if provided
						metadata: metadata, // Pass user metadata (mode, page, etc.)
						skip: {
							history: true, // Don't save title generation to history
							trace: true // Don't show trace for this utility call
						}
					},
					(chunk: Message) => {
						// Handle message_end event for title generation completion
						if (chunk.type === 'event' && chunk.props?.event === 'message_end') {
							if (generatedTitle) {
								const finalTitle = generatedTitle.trim().slice(0, 50)
								setTabs((prev) =>
									prev.map((t) =>
										t.chatId === targetTabId ? { ...t, title: finalTitle } : t
									)
								)
							}
							return
						}

						// Accumulate title text and update in real-time
						if (chunk.type === 'text' && chunk.props?.content) {
							if (chunk.delta) {
								generatedTitle += chunk.props.content
							} else {
								generatedTitle = chunk.props.content
							}

							// Real-time update: Update tab title as we receive chunks
							const currentTitle = generatedTitle.trim().slice(0, 50)
							if (currentTitle) {
								setTabs((prev) =>
									prev.map((t) =>
										t.chatId === targetTabId ? { ...t, title: currentTitle } : t
									)
								)
							}
						}
					},
					(error: any) => {
						console.error('Failed to generate title:', error)
					}
				)
			} catch (err) {
				console.error('Error generating chat title:', err)
			}
		},
		[chatClient, global.agent_uses]
	)

	// Start a new stream with multiple messages (for stream_end queue processing)
	const startNewStreamWithMessages = useCallback(
		async (messages: UserMessage[], targetTabId: string, targetAssistantId: string) => {
			if (!chatClient) {
				console.error('Chat client not initialized')
				return
			}

			// Set streaming state
			setStreamingStates((prev) => ({ ...prev, [targetTabId]: true }))

			// Add all User Messages to UI (convert UserMessage to Message format)
			const userMessages: Message[] = messages.map((msg) => ({
				ui_id: nanoid(), // Unique UI ID for React key
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
				// Start new stream with all messages
				const abortFn = chatClient.StreamCompletion(
					{
						assistant_id: targetAssistantId,
						chat_id: targetTabId,
						messages: messages // Send all queued messages together
					},
					(chunk: Message) => {
						// Same event handling as sendMessage
						if (chunk.type === 'event') {
							if (chunk.props?.event === 'stream_start') {
								const ctxId = chunk.props?.data?.context_id
								if (ctxId) {
									contextIdsRef.current[targetTabId] = ctxId
								}
								// Capture assistant info from stream_start
								const assistantInfo = chunk.props?.data?.assistant
								if (assistantInfo) {
									assistantInfoRef.current[targetTabId] = assistantInfo
									// Set flag to true, will check when creating first message
									shouldAddAssistantRef.current[targetTabId] = true
								}
								// Generate a unique stream ID to namespace message_id across streams
								const streamId = nanoid()
								streamIdRef.current[targetTabId] = streamId
								// Clear completed messages ref for new stream
								completedMessagesRef.current = {}

								// Open sidebar trace view for task mode
								const metadata = chunk.props?.data?.metadata
								const traceId = chunk.props?.data?.trace_id
								if (metadata?.mode === 'task' && traceId) {
									if (window.$app?.Event) {
										const locale = getLocale()
										const is_cn = locale === 'zh-CN'
										window.$app.Event.emit('app/openSidebar', {
											url: `/trace/${traceId}`,
											title: is_cn ? '追踪' : 'Trace',
											forceNormal: true
										})
									}
								}
							}

							if (chunk.props?.event === 'message_end') {
								const rawMessageId = chunk.props?.data?.message_id
								if (rawMessageId) {
									// Namespace message_id with stream ID
									const streamId = streamIdRef.current[targetTabId] || 'default'
									const messageId = `${streamId}:${rawMessageId}`

									// Mark this message as completed to prevent late chunks from re-enabling delta
									completedMessagesRef.current[messageId] = true

									clearMessageCache(messageId)

									// Mark the message as completed (delta: false)
									updateMessages(targetTabId, (prev) => {
										const index = prev.findIndex(
											(m) => m.message_id === messageId
										)
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
								delete abortHandlesRef.current[targetTabId]

								// Check if queue has messages and send them (same as sendMessage)
								setMessageQueues((prev) => {
									const queue = prev[targetTabId] || []
									if (queue.length > 0) {
										const allMessages = queue.map((q) => q.message)

										// Get assistant ID
										const tab = tabs.find((t) => t.chatId === targetTabId)
										const assistantId = tab?.assistantId || defaultAssistantId

										if (assistantId) {
											// Send all queued messages as a new StreamCompletion
											setTimeout(() => {
												startNewStreamWithMessages(
													allMessages,
													targetTabId,
													assistantId
												)
											}, 100)
										} else {
											console.error(
												'No assistant ID for sending queued messages'
											)
										}

										// Clear queue
										return {
											...prev,
											[targetTabId]: []
										}
									}
									return prev
								})
							}

							return
						}

						// Type change handling
						// Use message_id for message identity (all delta chunks share same message_id)
						// Namespace message_id with stream ID to avoid conflicts across different streams
						const streamId = streamIdRef.current[targetTabId] || 'default'
						const rawMessageId = chunk.message_id || chunk.chunk_id || `ai-response-unknown`
						const messageId = `${streamId}:${rawMessageId}`

						if (chunk.type_change) {
							clearMessageCache(messageId)
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

						const mergedState = applyDelta(messageId, chunk)

						// Check if this message is already completed
						// If completed, force delta to false to prevent late chunks from re-enabling cursor
						const isCompleted = completedMessagesRef.current[messageId]

						// Find existing message to preserve its UI ID
						updateMessages(targetTabId, (prev) => {
							const index = prev.findIndex((m) => m.message_id === messageId)
							// Get assistant info for this chat
							const assistantInfo = assistantInfoRef.current[targetTabId]
							const shouldAdd = shouldAddAssistantRef.current[targetTabId]

							if (index !== -1) {
								// Update existing message, preserve its UI ID and existing assistant info
								const newArr = [...prev]
								newArr[index] = {
									...newArr[index], // Preserve existing fields including UI ID and assistant
									chunk_id: chunk.chunk_id,
									message_id: messageId,
									block_id: chunk.block_id,
									thread_id: chunk.thread_id,
									type: mergedState.type,
									props: mergedState.props,
									delta: isCompleted ? false : chunk.delta
								}
								return newArr
							} else {
								// New message: create with unique UI ID
								// Check if we should add assistant info
								let finalShouldAdd = shouldAdd
								if (finalShouldAdd && assistantInfo && prev.length > 0) {
									// Only check the LAST message (immediate previous message)
									const lastMsg = prev[prev.length - 1]
									// Only hide avatar if the immediate previous message is an AI message from the same assistant
									if (lastMsg.type !== 'user_input') {
										const prevAssistant = (lastMsg as any).assistant
										if (
											prevAssistant &&
											prevAssistant.assistant_id ===
												assistantInfo.assistant_id
										) {
											// Same assistant AND consecutive, don't add info
											finalShouldAdd = false
										}
									}
									// If last message is user_input, we always show avatar (finalShouldAdd remains true)
								}

								const newMessage: Message = {
									ui_id: nanoid(), // Unique UI ID for React key
									chunk_id: chunk.chunk_id,
									message_id: messageId,
									block_id: chunk.block_id,
									thread_id: chunk.thread_id,
									type: mergedState.type,
									props: mergedState.props,
									delta: isCompleted ? false : chunk.delta,
									// Add assistant info only if needed
									...(finalShouldAdd &&
										assistantInfo && { assistant: assistantInfo })
								}
								// Reset the flag after checking for the first message
								if (shouldAdd) {
									shouldAddAssistantRef.current[targetTabId] = false
								}
								return [...prev, newMessage]
							}
						})
					},
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
						delete abortHandlesRef.current[targetTabId]
					}
				)

				abortHandlesRef.current[targetTabId] = abortFn
			} catch (err) {
				console.error('Failed to start new stream:', err)
				setStreamingStates((prev) => ({ ...prev, [targetTabId]: false }))
			}
		},
		[chatClient, updateMessages, tabs, defaultAssistantId]
	)

	// Store context_id for each active chat
	const contextIdsRef = useRef<Record<string, string>>({})

	// Track if title has been generated for each chat
	const titleGeneratedRef = useRef<Record<string, boolean>>({})

	// Track completed messages (message_id -> true) to prevent late delta chunks from re-enabling delta flag
	const completedMessagesRef = useRef<Record<string, boolean>>({})

	// Send Message
	const sendMessage = useCallback(
		async (request: SendMessageRequest) => {
			const inputMsg = request.messages[0]
			// If no active tab, create one automatically
			let targetTabId = activeTabId
			let targetAssistantId = currentAssistantId

			if (!targetTabId) {
				const newId = nanoid()
				// Use default assistant ID for auto-created tab
				targetAssistantId = defaultAssistantId
				const newTab: ChatTab = {
					chatId: newId,
					title: is_cn ? '新对话' : 'New Chat',
					assistantId: targetAssistantId
				}
				setTabs((prev) => [...prev, newTab])
				setChatStates((prev) => ({ ...prev, [newId]: [] }))
				setActiveTabId(newId)
				targetTabId = newId
			} else {
				// Use existing tab's assistant
				const tab = tabs.find((t) => t.chatId === targetTabId)
				if (tab && tab.assistantId) {
					targetAssistantId = tab.assistantId
				}
			}

			if (!chatClient) {
				console.error('Chat client not initialized')
				return
			}

			// Set streaming state for this specific chat
			setStreamingStates((prev) => ({ ...prev, [targetTabId]: true }))

			// 1. Add User Message locally (convert UserMessage to Message format for display)
			const userMsg: Message = {
				ui_id: nanoid(), // Unique UI ID for React key
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
				// 2. Start Streaming
				if (!targetAssistantId) {
					console.error('Assistant ID is missing')
					setStreamingStates((prev) => ({ ...prev, [targetTabId]: false }))
					return
				}

				const abortFn = chatClient.StreamCompletion(
					{
						assistant_id: targetAssistantId,
						chat_id: targetTabId, // Always pass chat_id (generated by frontend)
						messages: request.messages,
						model: request.model, // User selected model
						metadata: request.metadata,
						options: request.options,
						skip: request.skip
					},
					(chunk: Message) => {
						// Handle Chunk

						// Event handling
						if (chunk.type === 'event') {
							// Capture context_id from stream_start
							if (chunk.props?.event === 'stream_start') {
								const ctxId = chunk.props?.data?.context_id
								if (ctxId) {
									contextIdsRef.current[targetTabId] = ctxId
								}
								// Capture assistant info from stream_start
								const assistantInfo = chunk.props?.data?.assistant
								if (assistantInfo) {
									assistantInfoRef.current[targetTabId] = assistantInfo
									// Set flag to true, will check when creating first message
									shouldAddAssistantRef.current[targetTabId] = true
								}
								// Generate a unique stream ID to namespace message_id across streams
								const streamId = nanoid()
								streamIdRef.current[targetTabId] = streamId
								// Clear completed messages ref for new stream
								completedMessagesRef.current = {}

								// Open sidebar trace view for task mode
								const metadata = chunk.props?.data?.metadata
								const traceId = chunk.props?.data?.trace_id
								if (metadata?.mode === 'task' && traceId) {
									if (window.$app?.Event) {
										const locale = getLocale()
										const is_cn = locale === 'zh-CN'
										window.$app.Event.emit('app/openSidebar', {
											url: `/trace/${traceId}`,
											title: is_cn ? '追踪' : 'Trace',
											forceNormal: true
										})
									}
								}
							}

							// Handle message_end event to clean up cache
							if (chunk.props?.event === 'message_end') {
								const rawMessageId = chunk.props?.data?.message_id
								if (rawMessageId) {
									// Namespace message_id with stream ID
									const streamId = streamIdRef.current[targetTabId] || 'default'
									const messageId = `${streamId}:${rawMessageId}`

									// Mark this message as completed to prevent late chunks from re-enabling delta
									completedMessagesRef.current[messageId] = true

									clearMessageCache(messageId)

									// Mark the message as completed (delta: false)
									updateMessages(targetTabId, (prev) => {
										const index = prev.findIndex(
											(m) => m.message_id === messageId
										)
										if (index !== -1) {
											const newArr = [...prev]
											// Set delta to false to stop streaming indicator
											newArr[index] = { ...newArr[index], delta: false }
											return newArr
										}
										return prev
									})
								}

								// Check if this is the first completion for title generation
								updateMessages(targetTabId, (prev) => {
									const isFirstCompletion =
										prev.length === 2 && !titleGeneratedRef.current[targetTabId]

									if (isFirstCompletion) {
										generateChatTitle(
											targetTabId,
											prev,
											request.model,
											request.metadata
										)
									}
									return prev
								})
							}

							if (chunk.props?.event === 'stream_end') {
								setStreamingStates((prev) => ({ ...prev, [targetTabId]: false }))
								delete abortHandlesRef.current[targetTabId]

								// If queue has messages, start a new stream with all queued messages
								// Use functional update to get latest queue state
								setMessageQueues((prev) => {
									const queue = prev[targetTabId] || []
									if (queue.length > 0) {
										const allMessages = queue.map((q) => q.message)

										// Get assistant ID
										const tab = tabs.find((t) => t.chatId === targetTabId)
										const assistantId = tab?.assistantId || defaultAssistantId

										if (assistantId) {
											// Send all queued messages as a new StreamCompletion
											setTimeout(() => {
												startNewStreamWithMessages(
													allMessages,
													targetTabId,
													assistantId
												)
											}, 100)
										} else {
											console.error(
												'No assistant ID for sending queued messages'
											)
										}

										// Clear queue
										return {
											...prev,
											[targetTabId]: []
										}
									}
									return prev
								})
							}

							return
						}

						// Type change handling
						// Use message_id for message identity (all delta chunks share same message_id)
						// Namespace message_id with stream ID to avoid conflicts across different streams
						const streamId = streamIdRef.current[targetTabId] || 'default'
						const rawMessageId = chunk.message_id || chunk.chunk_id || `ai-response-unknown`
						const messageId = `${streamId}:${rawMessageId}`

						if (chunk.type_change) {
							clearMessageCache(messageId)
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
						const mergedState = applyDelta(messageId, chunk)

						// Check if this message is already completed
						// If completed, force delta to false to prevent late chunks from re-enabling cursor
						const isCompleted = completedMessagesRef.current[messageId]

						// Find existing message to preserve its UI ID
						updateMessages(targetTabId, (prev) => {
							const index = prev.findIndex((m) => m.message_id === messageId)
							// Get assistant info for this chat
							const assistantInfo = assistantInfoRef.current[targetTabId]
							const shouldAdd = shouldAddAssistantRef.current[targetTabId]

							if (index !== -1) {
								// Update existing message, preserve its UI ID and existing assistant info
								const newArr = [...prev]
								newArr[index] = {
									...newArr[index], // Preserve existing fields including UI ID and assistant
									chunk_id: chunk.chunk_id,
									message_id: messageId,
									block_id: chunk.block_id,
									thread_id: chunk.thread_id,
									type: mergedState.type,
									props: mergedState.props,
									delta: isCompleted ? false : chunk.delta
								}
								return newArr
							} else {
								// New message: create with unique UI ID
								// Check if we should add assistant info
								let finalShouldAdd = shouldAdd
								if (finalShouldAdd && assistantInfo && prev.length > 0) {
									// Only check the LAST message (immediate previous message)
									const lastMsg = prev[prev.length - 1]
									// Only hide avatar if the immediate previous message is an AI message from the same assistant
									if (lastMsg.type !== 'user_input') {
										const prevAssistant = (lastMsg as any).assistant
										if (
											prevAssistant &&
											prevAssistant.assistant_id ===
												assistantInfo.assistant_id
										) {
											// Same assistant AND consecutive, don't add info
											finalShouldAdd = false
										}
									}
									// If last message is user_input, we always show avatar (finalShouldAdd remains true)
								}

								const newMessage: Message = {
									ui_id: nanoid(), // Unique UI ID for React key
									chunk_id: chunk.chunk_id,
									message_id: messageId,
									block_id: chunk.block_id,
									thread_id: chunk.thread_id,
									type: mergedState.type,
									props: mergedState.props,
									delta: isCompleted ? false : chunk.delta,
									// Add assistant info only if needed
									...(finalShouldAdd &&
										assistantInfo && { assistant: assistantInfo })
								}
								// Reset the flag after checking for the first message
								if (shouldAdd) {
									shouldAddAssistantRef.current[targetTabId] = false
								}
								return [...prev, newMessage]
							}
						})
					},
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
						delete abortHandlesRef.current[targetTabId]
					}
				)

				abortHandlesRef.current[targetTabId] = abortFn
			} catch (err) {
				console.error('Failed to send message:', err)
				setStreamingStates((prev) => ({ ...prev, [targetTabId]: false }))
			}
		},
		[chatClient, defaultAssistantId, currentAssistantId, activeTabId, updateMessages, tabs]
	)

	const abort = useCallback(() => {
		if (!activeTabId) return
		const abortFn = abortHandlesRef.current[activeTabId]
		if (abortFn) {
			abortFn()
			delete abortHandlesRef.current[activeTabId]
		}
		setStreamingStates((prev) => ({ ...prev, [activeTabId]: false }))
	}, [activeTabId])

	const reset = useCallback(() => {
		if (!activeTabId) return
		updateMessages(activeTabId, () => [])
		clearMessageCache()
	}, [activeTabId, updateMessages])

	// Load History: Check if tab exists, if not create it
	const loadHistory = useCallback(
		async (chatId: string) => {
			// Check if already open
			if (tabs.find((t) => t.chatId === chatId)) {
				setActiveTabId(chatId)
				return
			}

			// Open new tab
			// For history loading, we might need to fetch the assistant ID from the session details
			// For now, we assume default or try to get it from sessions list
			const session = sessions.find((s) => s.chat_id === chatId)
			const historyAssistantId = session?.assistant_id || defaultAssistantId

			const newTab: ChatTab = { chatId, title: 'Loading...', assistantId: historyAssistantId }
			setTabs((prev) => [...prev, newTab])
			setActiveTabId(chatId)
			setLoadingStates((prev) => ({ ...prev, [chatId]: true }))

			try {
				const history = await getChatHistory(chatId)
				// Update state map
				setChatStates((prev) => ({ ...prev, [chatId]: history }))

				// Update title based on history? (Mock: use session title)
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
		[tabs, sessions, defaultAssistantId]
	)

	const createNewChat = useCallback(
		(arg?: string | any) => {
			// Check if arg is a string (assistantId), otherwise treat as event/empty
			const assistantId = typeof arg === 'string' ? arg : undefined

			const newId = nanoid()

			// Inherit from active tab if no assistant ID provided
			let targetAssistantId = assistantId
			if (!targetAssistantId) {
				const currentTab = tabs.find((t) => t.chatId === activeTabId)
				targetAssistantId = currentTab?.assistantId
			}

			// Fallback to default
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
		[defaultAssistantId, tabs, activeTabId]
	)

	const activateTab = useCallback((chatId: string) => {
		setActiveTabId(chatId)
	}, [])

	const closeTab = useCallback(
		(chatId: string) => {
			setTabs((prev) => {
				const newTabs = prev.filter((t) => t.chatId !== chatId)
				// If we closed the active tab, switch to another
				if (chatId === activeTabId) {
					if (newTabs.length > 0) {
						// Switch to last available tab
						const nextTabId = newTabs[newTabs.length - 1].chatId
						setActiveTabId(nextTabId)
					} else {
						// All tabs closed, go to empty state
						setActiveTabId('')
					}
				}
				return newTabs
			})
			// Clean up all states for closed tab to save memory
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
			// Clean up abort handler
			if (abortHandlesRef.current[chatId]) {
				delete abortHandlesRef.current[chatId]
			}
			// Clean up context_id
			if (contextIdsRef.current[chatId]) {
				delete contextIdsRef.current[chatId]
			}
			// Clean up title generation flag
			if (titleGeneratedRef.current[chatId]) {
				delete titleGeneratedRef.current[chatId]
			}
			// Clean up completed messages tracking
			// Note: We clear all for simplicity, or could track per-chat if needed
			// For now, clearing all is safe when a tab closes
		},
		[activeTabId]
	)

	// Queue a message (just add to local queue, will send via AppendMessages later)
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

			// Immediately send to backend via AppendMessages (type: graceful)
			const contextId = contextIdsRef.current[activeTabId]
			if (contextId && chatClient) {
				chatClient.AppendMessages(contextId, [message], 'graceful').catch((err) => {
					console.error('Failed to append message:', err)
				})
			}
		},
		[activeTabId, chatClient]
	)

	// Send all queued messages immediately (force mode)
	// Note: queueId parameter is ignored, always sends all messages
	const sendQueuedMessage = useCallback(
		(queueId?: string, asForce: boolean = true) => {
			if (!activeTabId) return

			const queue = messageQueues[activeTabId] || []
			if (queue.length === 0) return

			const contextId = contextIdsRef.current[activeTabId]
			if (!contextId) {
				console.error('No context_id available')
				return
			}

			// Extract all messages from queue
			const allQueuedMessages = queue.map((q) => q.message)

			// Send all queued messages via AppendMessages (force mode)
			appendQueuedMessages(allQueuedMessages, activeTabId, 'force')

			// Force mode: Clear queue immediately (don't wait for backend event)
			setMessageQueues((prev) => ({
				...prev,
				[activeTabId]: []
			}))
		},
		[activeTabId, messageQueues, appendQueuedMessages]
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
		[activeTabId]
	)

	return {
		messages,
		sessions,
		currentChatId,
		loading,
		streaming,
		assistant, // Export assistant info
		tabs,
		activeTabId,
		messageQueue, // Export message queue
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
