import { nanoid } from 'nanoid'
import type { ChatMessage, Message, AssistantInfo } from '../../openapi'

/**
 * Parse tool_call content from stored format to ToolCallProps
 * Stored format: "[{...delta1}][{...delta2}]..." concatenated JSON arrays
 * Each delta contains: index, id?, type?, function: { name?, arguments? }
 */
function parseToolCallContent(content: string): { id?: string; name?: string; arguments?: string } {
	if (!content) return {}

	try {
		const chunks = content.match(/\[[^\[\]]*\]/g) || []

		let id: string | undefined
		let name: string | undefined
		let args = ''

		for (const chunk of chunks) {
			try {
				const arr = JSON.parse(chunk)
				if (Array.isArray(arr) && arr.length > 0) {
					const item = arr[0]
					if (item.id && !id) {
						id = item.id
					}
					if (item.function?.name && !name) {
						name = item.function.name
					}
					if (item.function?.arguments) {
						args += item.function.arguments
					}
				}
			} catch {
				// Skip invalid chunks
			}
		}

		return { id, name, arguments: args || undefined }
	} catch {
		return {}
	}
}

/**
 * Convert stored ChatMessage to display Message format
 * @param stored - ChatMessage from server storage
 * @param assistants - Map of assistant_id to AssistantInfo for avatar/name lookup
 * @param mainAssistantId - Main assistant ID for the chat session (used to replace sub-agent info)
 */
export const convertStoredToDisplay = (
	stored: ChatMessage,
	assistants?: Record<string, AssistantInfo>,
	mainAssistantId?: string
): Message => {
	let assistantInfo = stored.assistant_id && assistants?.[stored.assistant_id]

	// If message has thread_id, it's from a sub-agent - use the main assistant info instead
	if (stored.thread_id && mainAssistantId && assistants?.[mainAssistantId]) {
		assistantInfo = assistants[mainAssistantId]
	}

	let props = { ...stored.props, role: stored.role }
	if (stored.type === 'tool_call' && stored.props?.content) {
		const toolCallProps = parseToolCallContent(stored.props.content)
		props = {
			...props,
			...toolCallProps
		}
	}

	const effectiveAssistantId =
		stored.thread_id && mainAssistantId ? mainAssistantId : stored.assistant_id

	return {
		ui_id: nanoid(),
		message_id: stored.message_id,
		type: stored.type,
		props,
		block_id: stored.block_id,
		thread_id: stored.thread_id,
		delta: false,
		metadata: {
			id: stored.id,
			timestamp: new Date(stored.created_at).getTime(),
			sequence: stored.sequence,
			request_id: stored.request_id
		},
		...(assistantInfo && {
			assistant: {
				assistant_id: effectiveAssistantId,
				name: assistantInfo.name,
				avatar: assistantInfo.avatar
			}
		})
	}
}

/**
 * Process messages to deduplicate consecutive assistant info
 * Only the first message from an assistant (after user message or different assistant) shows avatar
 */
export const deduplicateAssistantInfo = (messages: Message[]): Message[] => {
	let lastAssistantId: string | undefined = undefined

	return messages.map((msg) => {
		const msgAssistant = (msg as any).assistant

		if (msg.type === 'user_input') {
			lastAssistantId = undefined
			return msg
		}

		if (msgAssistant?.assistant_id) {
			if (msgAssistant.assistant_id === lastAssistantId) {
				const { assistant, ...rest } = msg as any
				return rest as Message
			}
			lastAssistantId = msgAssistant.assistant_id
		}

		return msg
	})
}

/**
 * Re-group child messages (those carrying parent_message_id) under their
 * parent Agent message's props.children, mirroring what stream.ts does in
 * real-time. Orphan children (parent not in array) stay top-level.
 */
export function groupAgentChildren(messages: Message[]): Message[] {
	const result = messages.map((m) => ({ ...m, props: { ...m.props } }))
	const childIndices = new Set<number>()

	result.forEach((msg, i) => {
		const parentId = msg.props?.parent_message_id as string | undefined
		if (!parentId) return

		const parentIdx = result.findIndex((m) => m.message_id === parentId)
		if (parentIdx === -1) return

		childIndices.add(i)
		const parent = result[parentIdx]
		const children = Array.isArray(parent.props?.children) ? [...parent.props.children] : []
		children.push({
			message_id: msg.message_id,
			type: msg.type,
			props: msg.props,
			status: msg.props?.status,
			delta: false
		})
		parent.props = { ...parent.props, children }
	})

	return result.filter((_, i) => !childIndices.has(i))
}

/**
 * Process history messages: filter transient types, convert to display format, deduplicate assistant info
 */
export function processHistoryMessages(
	messages: ChatMessage[],
	assistants: Record<string, AssistantInfo> | undefined,
	mainAssistantId?: string
): Message[] {
	return groupAgentChildren(
		deduplicateAssistantInfo(
			messages
				.filter((msg) => msg.type !== 'loading' && msg.type !== 'action')
				.map((msg) => convertStoredToDisplay(msg, assistants, mainAssistantId))
		)
	)
}

/**
 * Determine whether to show a time separator between two messages (1 hour gap)
 */
export function shouldShowTimeSeparator(
	currentMsg: Message,
	prevMsg: Message | undefined
): boolean {
	if (!prevMsg) return true
	const currentTime = currentMsg.metadata?.timestamp
	const prevTime = prevMsg.metadata?.timestamp
	if (!currentTime || !prevTime) return false
	return currentTime - prevTime > 3600000
}
