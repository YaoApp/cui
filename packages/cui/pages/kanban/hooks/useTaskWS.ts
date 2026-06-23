import { useCallback, useEffect, useRef, useState } from 'react'
import type { Message, UserMessage } from '@/openapi'
import { processChunk, newStreamSession } from '@/chatbox/utils/chunkProcessor'
import type { StreamSession, ChunkEvent } from '@/chatbox/utils/chunkProcessor'

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
	sendMessage: (msg: UserMessage, metadata?: Record<string, any>) => void
	retry: (extra?: UserMessage) => void
	repeat: () => void
	loadMore: () => void
	abort: () => void
}

interface WSCommand {
	type: 'read' | 'run' | 'retry' | 'repeat' | 'stop' | 'cancel'
	messages?: Array<{ role: string; content: any }>
	assistant_id?: string
	metadata?: Record<string, any>
	since?: number
	limit?: number
}

export function useTaskWS(options: UseTaskWSOptions): UseTaskWSReturn {
	const { chatId, assistantId, columnId, enabled = true, onEvent } = options

	const [messages, setMessages] = useState<Message[]>([])
	const [streaming, setStreaming] = useState(false)
	const [connected, setConnected] = useState(false)
	const [hasMore, setHasMore] = useState(false)

	const wsRef = useRef<WebSocket | null>(null)
	const sessionRef = useRef<StreamSession>(newStreamSession())
	const messagesRef = useRef<Message[]>([])
	const lastSeqRef = useRef<number>(0)
	const isFirstRunRef = useRef(true)
	const destroyedRef = useRef(false)
	const onEventRef = useRef(onEvent)
	const pendingCommandRef = useRef<WSCommand | null>(null)
	const assistantIdRef = useRef(assistantId)
	const columnIdRef = useRef(columnId)
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
			// Track sequence for reconnection
			if (chunk.metadata?.sequence) {
				lastSeqRef.current = chunk.metadata.sequence
			}

			// Handle protocol events
			if (chunk.type === 'event') {
				const eventName = chunk.props?.event as string

				if (eventName === 'read_complete') {
					setHasMore(!!chunk.props?.has_more)
					if (chunk.props?.last_seq) {
						lastSeqRef.current = chunk.props.last_seq as number
					}
					onEventRef.current?.({ name: 'read_complete', data: chunk.props })
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
			}

			// Handle done message (Message DSL protocol)
			if (chunk.type === 'done') {
				setStreaming(false)
				onEventRef.current?.({ name: 'done' })
				return
			}

			// Process through chunkProcessor for message accumulation
			const result = processChunk(sessionRef.current, chatId, chunk, messagesRef.current)
			messagesRef.current = result.messages
			setMessages(result.messages)

			if (result.event) {
				if (result.event.name === 'stream_start') {
					setStreaming(true)
				} else if (result.event.name === 'stream_end') {
					setStreaming(false)
				}
				onEventRef.current?.(result.event)
			}
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
							doConnect({
								type: 'read',
								since: lastSeqRef.current,
								limit: 0
							})
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
			const cmd: WSCommand = {
				type: 'run',
				messages: [{ role: msg.role, content: msg.content }]
			}
			const aid = assistantIdRef.current
			const cid = columnIdRef.current

			cmd.metadata = { ...metadata }

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
			const cmd: WSCommand = { type: 'retry' }
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
		sendCmd({ type: 'repeat' })
	}, [sendCmd])

	const loadMore = useCallback(() => {
		sendCmd({
			type: 'read',
			since: lastSeqRef.current,
			limit: 100
		})
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
		isFirstRunRef.current = true
		setHasMore(false)
		setStreaming(false)

		if (enabled && chatId) {
			doConnect({ type: 'read', since: 0, limit: 0 })
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
		sendMessage,
		retry,
		repeat,
		loadMore,
		abort
	}
}
