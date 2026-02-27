import { nanoid } from 'nanoid'
import type { Message } from '../../openapi'
import { applyDelta, clearMessageCache } from '../hooks/delta'

export interface StreamSession {
	streamId: string
	completedMessages: Record<string, boolean>
}

export interface ChunkEvent {
	name: string
	data?: Record<string, any>
}

export interface ProcessResult {
	messages: Message[]
	event?: ChunkEvent
}

export function newStreamSession(): StreamSession {
	return {
		streamId: nanoid(),
		completedMessages: {}
	}
}

/**
 * Process a single SSE chunk and return updated messages + any extracted event.
 * This is a pure function (no React state side-effects) that mirrors the core
 * logic from chatbox/hooks/stream.ts createChunkHandler, but decoupled from
 * the Chatbox-specific refs/state management.
 */
export function processChunk(
	session: StreamSession,
	chatId: string,
	chunk: Message,
	prevMessages: Message[]
): ProcessResult {
	// Event handling
	if (chunk.type === 'event') {
		const eventName = chunk.props?.event as string

		if (eventName === 'stream_start') {
			session.streamId = nanoid()
			session.completedMessages = {}
			return { messages: prevMessages, event: { name: 'stream_start', data: chunk.props?.data } }
		}

		if (eventName === 'message_end') {
			const rawMessageId = chunk.props?.data?.message_id
			if (rawMessageId) {
				const messageId = `${session.streamId}:${rawMessageId}`
				session.completedMessages[messageId] = true
				clearMessageCache(chatId, messageId)

				const idx = prevMessages.findIndex((m) => m.message_id === messageId)
				if (idx !== -1) {
					const next = [...prevMessages]
					next[idx] = { ...next[idx], delta: false }
					return { messages: next, event: { name: 'message_end' } }
				}
			}
			return { messages: prevMessages, event: { name: 'message_end' } }
		}

		if (eventName === 'stream_end') {
			return { messages: prevMessages, event: { name: 'stream_end', data: chunk.props?.data } }
		}

		// Custom events (e.g. interact_done) — pass through
		return { messages: prevMessages, event: { name: eventName, data: chunk.props?.data || chunk.props } }
	}

	// Build scoped message_id
	const rawMessageId = chunk.message_id || chunk.chunk_id || 'ai-response-unknown'
	const messageId = `${session.streamId}:${rawMessageId}`

	// Type change handling
	if (chunk.type_change) {
		clearMessageCache(chatId, messageId)
		const idx = prevMessages.findIndex((m) => m.message_id === messageId)
		const replaced: Message = { ...chunk, message_id: messageId, delta: false, ui_id: nanoid() }
		if (idx !== -1) {
			const next = [...prevMessages]
			next[idx] = replaced
			return { messages: next }
		}
		return { messages: [...prevMessages, replaced] }
	}

	// Apply delta merge
	const mergedState = applyDelta(chatId, messageId, chunk)
	const isCompleted = session.completedMessages[messageId]
	// Shallow-copy props so React.memo detects changes (applyDelta mutates in-place)
	const snapshotProps = { ...mergedState.props }

	const idx = prevMessages.findIndex((m) => m.message_id === messageId)
	if (idx !== -1) {
		const next = [...prevMessages]
		next[idx] = {
			...next[idx],
			chunk_id: chunk.chunk_id,
			message_id: messageId,
			block_id: chunk.block_id,
			thread_id: chunk.thread_id,
			type: mergedState.type,
			props: snapshotProps,
			delta: isCompleted ? false : chunk.delta
		}
		return { messages: next }
	}

	const newMessage: Message = {
		ui_id: nanoid(),
		chunk_id: chunk.chunk_id,
		message_id: messageId,
		block_id: chunk.block_id,
		thread_id: chunk.thread_id,
		type: mergedState.type,
		props: snapshotProps,
		delta: isCompleted ? false : chunk.delta
	}
	return { messages: [...prevMessages, newMessage] }
}
