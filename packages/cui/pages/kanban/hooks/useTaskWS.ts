import { useCallback, useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import { getLocale } from '@umijs/max'
import type { Message, UserMessage } from '@/openapi'
import { newStreamSession } from '@/chatbox/utils/chunkProcessor'
import type { StreamSession, ChunkEvent } from '@/chatbox/utils/chunkProcessor'
import { processHistoryMessages } from '@/chatbox/utils/messageHistory'
import { applyDelta, clearMessageCache } from '@/chatbox/hooks/delta'

export interface UseTaskWSOptions {
	chatId: string
	assistantId?: string
	columnId?: string
	workspaceId?: string
	enabled?: boolean
	onEvent?: (event: ChunkEvent) => void
}

export interface UseTaskWSReturn {
	messages: Message[]
	streaming: boolean
	connected: boolean
	hasMore: boolean
	loadingMore: boolean
	sendMessage: (msg: UserMessage, metadata?: Record<string, any>) => void
	retry: (extra?: UserMessage) => void
	repeat: () => void
	loadMore: () => void
	abort: () => void
}

interface WSCommand {
	type: 'read' | 'history' | 'run' | 'retry' | 'repeat' | 'stop' | 'cancel'
	messages?: Array<{ role: string; content: any }>
	assistant_id?: string
	metadata?: Record<string, any>
	since?: number
	before?: number
	limit?: number
	locale?: string
}

export function useTaskWS(options: UseTaskWSOptions): UseTaskWSReturn {
	const { chatId, assistantId, columnId, enabled = true, onEvent } = options

	const [messages, setMessages] = useState<Message[]>([])
	const [streaming, setStreaming] = useState(false)
	const [connected, setConnected] = useState(false)
	const [hasMore, setHasMore] = useState(false)
	const [loadingMore, setLoadingMore] = useState(false)

	const wsRef = useRef<WebSocket | null>(null)
	const sessionRef = useRef<StreamSession>(newStreamSession())
	const messagesRef = useRef<Message[]>([])
	const lastSeqRef = useRef<number>(0)
	const firstIdRef = useRef<number>(0)
	const isFirstRunRef = useRef(true)
	const destroyedRef = useRef(false)
	const onEventRef = useRef(onEvent)
	const pendingCommandRef = useRef<WSCommand | null>(null)
	const assistantIdRef = useRef(assistantId)
	const columnIdRef = useRef(columnId)
	const loadingMoreRef = useRef(false)
	const hasMoreRef = useRef(false)
	const assistantInfoRef = useRef<any>(null)
	const shouldAddAssistantRef = useRef(false)
	onEventRef.current = onEvent
	assistantIdRef.current = assistantId
	columnIdRef.current = columnId

	const buildWSUrl = useCallback(() => {
		const baseURL = (window.$app?.openapi as any)?.config?.baseURL || '/v1'
		const loc = window.location
		const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:'

		let wsBase: string
		if (baseURL.startsWith('http://') || baseURL.startsWith('https://')) {
			const url = new URL(baseURL)
			wsBase = `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}${url.pathname}`
		} else {
			wsBase = `${protocol}//${loc.host}${baseURL}`
		}

		wsBase = wsBase.replace(/\/$/, '')
		return `${wsBase}/agent/tasks/${chatId}/ws`
	}, [chatId])

	const handleChunk = useCallback(
		(chunk: Message) => {
			if (chunk.metadata?.sequence) {
				lastSeqRef.current = chunk.metadata.sequence
			}

			// === ALL events handled here ===
			if (chunk.type === 'event') {
				const eventName = chunk.props?.event as string

				if (eventName === 'read_complete') {
					const isLive = chunk.props?.live === true

					if (!isLive && chunk.props?.messages) {
						const rawMessages = chunk.props.messages as any[]
						const assistants = chunk.props.assistants as Record<string, any> | undefined
						const processed = processHistoryMessages(rawMessages, assistants, assistantIdRef.current)

						if (loadingMoreRef.current) {
							messagesRef.current = [...processed, ...messagesRef.current]
							loadingMoreRef.current = false
							setLoadingMore(false)
						} else {
							messagesRef.current = processed
						}
						setMessages([...messagesRef.current])

						if (chunk.props.first_id) firstIdRef.current = chunk.props.first_id as number
					}

					const newHasMore = !!chunk.props?.has_more
					setHasMore(newHasMore)
					hasMoreRef.current = newHasMore
					if (chunk.props?.last_seq) lastSeqRef.current = chunk.props.last_seq as number
					onEventRef.current?.({ name: 'read_complete', data: chunk.props })
					return
				}

				if (eventName === 'history_complete') {
					const newHasMore = !!chunk.props?.has_more
					setHasMore(newHasMore)
					hasMoreRef.current = newHasMore
					onEventRef.current?.({ name: 'history_complete', data: chunk.props })
					return
				}

				if (eventName === 'live_status') {
					if (chunk.props?.status === 'idle') {
						setStreaming(false)
					} else if (chunk.props?.status === 'running') {
						setStreaming(true)
					}
					onEventRef.current?.({ name: 'live_status', data: chunk.props })
					return
				}

				if (eventName === 'stream_start') {
					sessionRef.current.streamId = nanoid()
					sessionRef.current.completedMessages = {}
					setStreaming(true)

					const assistantData = chunk.props?.data?.assistant
					if (assistantData) {
						assistantInfoRef.current = assistantData
						shouldAddAssistantRef.current = true
					}

					onEventRef.current?.({ name: 'stream_start', data: chunk.props?.data })
					return
				}

				if (eventName === 'message_end') {
					const rawId = chunk.props?.data?.message_id
					if (rawId) {
						const scopedId = `${sessionRef.current.streamId}:${rawId}`
						sessionRef.current.completedMessages[scopedId] = true
						clearMessageCache(chatId, scopedId)
						const idx = messagesRef.current.findIndex((m) => m.message_id === scopedId)
						if (idx !== -1) {
							messagesRef.current[idx] = { ...messagesRef.current[idx], delta: false }
							setMessages([...messagesRef.current])
						}
					}
					onEventRef.current?.({ name: 'message_end', data: chunk.props?.data })
					return
				}

				if (eventName === 'stream_end') {
					setStreaming(false)
					onEventRef.current?.({ name: 'stream_end', data: chunk.props?.data })
					return
				}

				if (eventName === 'error') {
					onEventRef.current?.({ name: 'error', data: chunk.props })
					return
				}

				if (eventName === 'queued') {
					onEventRef.current?.({ name: 'queued', data: chunk.props })
					return
				}

				return
			}

			// === Done message ===
			if (chunk.type === 'done') {
				setStreaming(false)
				onEventRef.current?.({ name: 'done' })
				return
			}

			// === LIVE PHASE: dedup + streaming delta processing ===

			if (chunk.message_id) {
				const scopedId = `${sessionRef.current.streamId}:${chunk.message_id}`
				const exists = messagesRef.current.some((m) => m.message_id === scopedId)
				if (exists && !chunk.delta) return
			}

			if (chunk.type === 'user_input' && chunk.message_id) {
				const scopedId = `${sessionRef.current.streamId}:${chunk.message_id}`
				const exists = messagesRef.current.some((m) => m.message_id === scopedId)
				if (exists) return
				const newMsg: Message = {
					ui_id: nanoid(),
					message_id: scopedId,
					type: 'user_input',
					props: chunk.props,
					metadata: { ...(chunk.metadata || {}), timestamp: Date.now() },
					delta: false
				}
				messagesRef.current = [...messagesRef.current, newMsg]
				setMessages(messagesRef.current)
				return
			}

			const streamId = sessionRef.current.streamId
			const rawMessageId = chunk.message_id || chunk.chunk_id || `msg-${nanoid()}`
			const messageId = `${streamId}:${rawMessageId}`
			const isCompleted = sessionRef.current.completedMessages[messageId]

			if (chunk.type_change) {
				clearMessageCache(chatId, messageId)
				const idx = messagesRef.current.findIndex((m) => m.message_id === messageId)
				const replaced: Message = { ...chunk, message_id: messageId, delta: false, ui_id: nanoid() }
				if (idx !== -1) {
					messagesRef.current[idx] = replaced
				} else {
					messagesRef.current = [...messagesRef.current, replaced]
				}
				setMessages([...messagesRef.current])
				return
			}

			const mergedState = applyDelta(chatId, messageId, chunk)
			const snapshotProps = { ...mergedState.props }
			const idx = messagesRef.current.findIndex((m) => m.message_id === messageId)

			if (idx !== -1) {
				messagesRef.current[idx] = {
					...messagesRef.current[idx],
					chunk_id: chunk.chunk_id,
					message_id: messageId,
					block_id: chunk.block_id,
					thread_id: chunk.thread_id,
					type: mergedState.type,
					props: snapshotProps,
					metadata: chunk.metadata || messagesRef.current[idx].metadata,
					delta: isCompleted ? false : chunk.delta
				}
			} else {
				const newMessage: Message = {
					ui_id: nanoid(),
					chunk_id: chunk.chunk_id,
					message_id: messageId,
					block_id: chunk.block_id,
					thread_id: chunk.thread_id,
					type: mergedState.type,
					props: snapshotProps,
					metadata: { ...(chunk.metadata || {}), timestamp: Date.now() },
					delta: isCompleted ? false : chunk.delta
				}

				if (shouldAddAssistantRef.current && assistantInfoRef.current) {
					let finalShouldAdd = true
					if (messagesRef.current.length > 0) {
						const prevMsg = messagesRef.current[messagesRef.current.length - 1]
						if (prevMsg.type !== 'user_input') {
							const prevAssistant = (prevMsg as any)?.assistant
							if (prevAssistant?.assistant_id === assistantInfoRef.current.assistant_id) {
								finalShouldAdd = false
							}
						}
					}
					if (finalShouldAdd) {
						;(newMessage as any).assistant = assistantInfoRef.current
					}
					shouldAddAssistantRef.current = false
				}

				messagesRef.current = [...messagesRef.current, newMessage]
			}
			setMessages([...messagesRef.current])
		},
		[chatId]
	)

	const doConnect = useCallback(
		(afterOpen?: WSCommand) => {
			if (wsRef.current?.readyState === WebSocket.OPEN || destroyedRef.current) {
				if (afterOpen && wsRef.current?.readyState === WebSocket.OPEN) {
					console.log(`[TaskWS] SEND chatId=${chatId} cmd=${afterOpen.type}`)
					wsRef.current.send(JSON.stringify(afterOpen))
				}
				return
			}

			if (wsRef.current) {
				wsRef.current.close()
				wsRef.current = null
			}

			pendingCommandRef.current = afterOpen || null
			const url = buildWSUrl()
			console.log(`[TaskWS] connect chatId=${chatId} url=${url}`)
			const ws = new WebSocket(url)
			wsRef.current = ws

			ws.onopen = () => {
				console.log(`[TaskWS] OPEN chatId=${chatId}`)
				setConnected(true)
				if (pendingCommandRef.current) {
					console.log(`[TaskWS] SEND chatId=${chatId} cmd=${pendingCommandRef.current.type}`)
					ws.send(JSON.stringify(pendingCommandRef.current))
					pendingCommandRef.current = null
				}
			}

			ws.onmessage = (event) => {
				try {
					const msg = JSON.parse(event.data) as Message
					if (msg.type === 'event') {
						console.log(`[TaskWS] RECV chatId=${chatId} type=event event=${msg.props?.event}`)
					}
					handleChunk(msg)
				} catch {
					// ignore malformed
				}
			}

			ws.onclose = (event) => {
				console.log(`[TaskWS] CLOSE chatId=${chatId} code=${event.code} reason=${event.reason}`)
				setConnected(false)
				wsRef.current = null

				if (event.code === 1000) {
					return
				}

				if (!destroyedRef.current) {
					setTimeout(() => {
						if (!destroyedRef.current) {
							messagesRef.current = []
							setMessages([])
							sessionRef.current = newStreamSession()
							doConnect({ type: 'read', locale: getLocale() })
						}
					}, 1000)
				}
			}

			ws.onerror = () => {
				console.log(`[TaskWS] ERROR chatId=${chatId}`)
				ws.close()
			}
		},
		[buildWSUrl, handleChunk, chatId]
	)

	const sendCmd = useCallback(
		(cmd: WSCommand) => {
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				console.log(`[TaskWS] SEND chatId=${chatId} cmd=${cmd.type}`)
				wsRef.current.send(JSON.stringify(cmd))
			} else {
				doConnect(cmd)
			}
		},
		[doConnect, chatId]
	)

	const sendMessage = useCallback(
		(msg: UserMessage, metadata?: Record<string, any>) => {
			// Optimistic insert: show user message immediately
			const userMsgId = `user-${Date.now()}`
			const localUserMsg: Message = {
				ui_id: userMsgId,
				message_id: `${sessionRef.current.streamId}:${userMsgId}`,
				type: 'user_input',
				props: { content: msg.content, role: 'user' },
				delta: false
			}
			messagesRef.current = [...messagesRef.current, localUserMsg]
			setMessages(messagesRef.current)

			const cmd: WSCommand = {
				type: 'run',
				messages: [{ role: msg.role, content: msg.content }],
				locale: getLocale()
			}
			const aid = assistantIdRef.current
			const cid = columnIdRef.current

			cmd.metadata = { ...metadata, user_msg_id: userMsgId }

			if (isFirstRunRef.current && (aid || cid)) {
				cmd.assistant_id = aid
				if (cid) cmd.metadata.column_id = cid
				if (aid) cmd.metadata.assistant_id = aid
				isFirstRunRef.current = false
			}

			setStreaming(true)
			sendCmd(cmd)
		},
		[sendCmd]
	)

	const retry = useCallback(
		(extra?: UserMessage) => {
			const cmd: WSCommand = { type: 'retry', locale: getLocale() }
			if (extra) {
				cmd.messages = [{ role: extra.role, content: extra.content }]
			}
			setStreaming(true)
			sendCmd(cmd)
		},
		[sendCmd]
	)

	const repeat = useCallback(() => {
		setStreaming(true)
		sendCmd({ type: 'repeat', locale: getLocale() })
	}, [sendCmd])

	const loadMore = useCallback(() => {
		if (!hasMoreRef.current || loadingMoreRef.current) return
		loadingMoreRef.current = true
		setLoadingMore(true)
		sendCmd({ type: 'read', before: firstIdRef.current, limit: 50, locale: getLocale() })
	}, [sendCmd])

	const abort = useCallback(() => {
		sendCmd({ type: 'stop' })
	}, [sendCmd])

	// Auto-connect and send initial read on mount
	useEffect(() => {
		destroyedRef.current = false
		messagesRef.current = []
		setMessages([])
		sessionRef.current = newStreamSession()
		lastSeqRef.current = 0
		firstIdRef.current = 0
		isFirstRunRef.current = true
		setHasMore(false)
		hasMoreRef.current = false
		setStreaming(false)
		setLoadingMore(false)
		loadingMoreRef.current = false

		if (enabled && chatId) {
			doConnect({ type: 'read', locale: getLocale() })
		}

		return () => {
			console.log(`[TaskWS] UNMOUNT chatId=${chatId}`)
			destroyedRef.current = true
			if (wsRef.current) {
				wsRef.current.close()
				wsRef.current = null
			}
		}
	}, [chatId, enabled, doConnect])

	return {
		messages,
		streaming,
		connected,
		hasMore,
		loadingMore,
		sendMessage,
		retry,
		repeat,
		loadMore,
		abort
	}
}
