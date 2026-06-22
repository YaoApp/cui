import { useCallback, useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import type { Message } from '@/openapi'
import { processChunk, newStreamSession } from '@/chatbox/utils/chunkProcessor'
import type { StreamSession, ChunkEvent } from '@/chatbox/utils/chunkProcessor'

interface TaskWSCommand {
	type: 'run' | 'input' | 'append' | 'stop' | 'confirm' | 'pong'
	messages?: Array<{ role: string; content: string }>
	assistant_id?: string
	chat_id?: string
	locale?: string
	metadata?: Record<string, any>
	interrupt?: 'graceful' | 'force'
	id?: string
	choice?: string
}

interface UseTaskWSOptions {
	onEvent?: (event: ChunkEvent) => void
	onAction?: (name: string, payload: Record<string, any>) => void
	autoConnect?: boolean
	sinceSequence?: number
}

interface UseTaskWSReturn {
	send: (cmd: TaskWSCommand) => void
	messages: Message[]
	isConnected: boolean
	isStreaming: boolean
	connect: () => void
	disconnect: () => void
	clearMessages: () => void
}

export function useTaskWS(chatId: string, options: UseTaskWSOptions = {}): UseTaskWSReturn {
	const { onEvent, onAction, autoConnect = true, sinceSequence } = options
	const [messages, setMessages] = useState<Message[]>([])
	const [isConnected, setIsConnected] = useState(false)
	const [isStreaming, setIsStreaming] = useState(false)

	const wsRef = useRef<WebSocket | null>(null)
	const sessionRef = useRef<StreamSession>(newStreamSession())
	const messagesRef = useRef<Message[]>([])
	const heartbeatRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastSequenceRef = useRef<number>(sinceSequence || 0)
	const destroyedRef = useRef(false)

	const onEventRef = useRef(onEvent)
	const onActionRef = useRef(onAction)
	onEventRef.current = onEvent
	onActionRef.current = onAction

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
		let wsUrl = `${wsBase}/agent/tasks/${chatId}/ws`
		if (lastSequenceRef.current > 0) {
			wsUrl += `?since=${lastSequenceRef.current}`
		}
		return wsUrl
	}, [chatId])

	const clearHeartbeat = useCallback(() => {
		if (heartbeatRef.current) {
			clearTimeout(heartbeatRef.current)
			heartbeatRef.current = null
		}
	}, [])

	const resetHeartbeat = useCallback(() => {
		clearHeartbeat()
		heartbeatRef.current = setTimeout(() => {
			wsRef.current?.close()
		}, 60000)
	}, [clearHeartbeat])

	const handleChunk = useCallback(
		(chunk: Message) => {
			// Handle action type
			if (chunk.type === 'action') {
				const name = chunk.props?.name as string
				const payload = chunk.props?.payload as Record<string, any>
				if (name && onActionRef.current) {
					onActionRef.current(name, payload || {})
				}
				return
			}

			// Track sequence for reconnection
			if (chunk.metadata?.sequence) {
				lastSequenceRef.current = chunk.metadata.sequence
			}

			// Process through chunkProcessor
			const result = processChunk(sessionRef.current, chatId, chunk, messagesRef.current)
			messagesRef.current = result.messages
			setMessages(result.messages)

			// Handle events
			if (result.event) {
				if (result.event.name === 'stream_start') {
					setIsStreaming(true)
				} else if (result.event.name === 'stream_end') {
					setIsStreaming(false)
				}
				onEventRef.current?.(result.event)
			}
		},
		[chatId]
	)

	const connect = useCallback(() => {
		if (wsRef.current || destroyedRef.current) return
		const url = buildWSUrl()

		const ws = new WebSocket(url)
		wsRef.current = ws

		ws.onopen = () => {
			setIsConnected(true)
			resetHeartbeat()
		}

		ws.onmessage = (event) => {
			try {
				const msg = JSON.parse(event.data) as Message
				// Handle ping from server
				if (msg.type === 'event' && msg.props?.event === 'ping') {
					ws.send(JSON.stringify({ type: 'pong' }))
					resetHeartbeat()
					return
				}
				handleChunk(msg)
			} catch {
				// ignore malformed
			}
		}

		ws.onclose = () => {
			setIsConnected(false)
			wsRef.current = null
			clearHeartbeat()
		}

		ws.onerror = () => {
			ws.close()
		}
	}, [buildWSUrl, handleChunk, resetHeartbeat, clearHeartbeat])

	const disconnect = useCallback(() => {
		destroyedRef.current = true
		clearHeartbeat()
		if (reconnectRef.current) {
			clearTimeout(reconnectRef.current)
			reconnectRef.current = null
		}
		if (wsRef.current) {
			wsRef.current.close()
			wsRef.current = null
		}
		setIsConnected(false)
	}, [clearHeartbeat])

	const send = useCallback((cmd: TaskWSCommand) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(cmd))
		}
	}, [])

	const clearMessages = useCallback(() => {
		messagesRef.current = []
		setMessages([])
		sessionRef.current = newStreamSession()
	}, [])

	useEffect(() => {
		destroyedRef.current = false
		if (autoConnect && chatId) {
			connect()
		}
		return () => {
			destroyedRef.current = true
			clearHeartbeat()
			if (wsRef.current) {
				wsRef.current.close()
				wsRef.current = null
			}
		}
	}, [chatId, autoConnect, connect, clearHeartbeat])

	return { send, messages, isConnected, isStreaming, connect, disconnect, clearMessages }
}
