import { OpenAPI } from '../openapi'
import {
	ChatCompletionRequest,
	ChatCompletionResponse,
	StreamChunk,
	StreamCallback,
	UserMessage,
	AppendMessagesResponse,
	InterruptType
} from './types'

export class Chat {
	constructor(private api: OpenAPI) {}

	/**
	 * Create chat completion (non-streaming)
	 * POST /chat/:assistant_id/completions
	 *
	 * Note: Currently in development, leaving empty for now
	 */
	async createCompletion(request: ChatCompletionRequest) {
		// TODO: Implement when backend is ready
		throw new Error('createCompletion: Not implemented yet (backend in development)')
	}

	/**
	 * Stream chat completion (SSE via POST)
	 * POST /chat/completions
	 *
	 * This uses fetch() with ReadableStream to handle SSE over POST requests.
	 * Works in browser environments without Node.js dependencies.
	 *
	 * All chunks received are Message objects with the universal DSL format.
	 * The backend converts internal chunk types to Messages before sending.
	 *
	 * @param request - The chat completion request
	 * @param onEvent - Callback for each Message chunk
	 * @param onError - Optional error callback
	 * @returns A function to abort the stream
	 */
	StreamCompletion(
		request: ChatCompletionRequest,
		onEvent: StreamCallback,
		onError?: (error: Error) => void
	): () => void {
		// Access private config to get baseURL
		// @ts-ignore
		const baseURL = this.api.config.baseURL

		// Build URL
		const url = `${baseURL}/chat/completions`

		// Create AbortController for cancellation
		const abortController = new AbortController()

		// Convert to internal format (set stream: true)
		const internalRequest = this.buildInternalRequest(request, true)

		// Extract assistant_id (either from assistant_id field or model field)
		const assistantId = 'assistant_id' in request ? request.assistant_id : undefined

		// Track context_id for cancellation
		let contextId: string | null = null

		// Wrap onEvent to capture context_id from stream_start event
		const wrappedOnEvent: StreamCallback = (chunk) => {
			// Capture context_id from stream_start event for cancellation
			if (chunk.type === 'event' && chunk.props?.event === 'stream_start') {
				// context_id is in props.data (StreamStartData structure)
				contextId = chunk.props?.data?.context_id || null
			}
			onEvent(chunk)
		}

		// Start the stream
		this.startStream(
			url,
			internalRequest,
			assistantId,
			request.chat_id,
			wrappedOnEvent,
			onError,
			abortController
		).catch((error) => {
			onError?.(error)
		})

		// Return abort function that sends force interrupt signal and stops reading
		return () => {
			// If we have context_id, send force interrupt to backend
			if (contextId) {
				this.AppendMessages(contextId, [], 'force').catch((error) => {
					console.error('[Chat API] Failed to send force interrupt:', error)
				})
			}
			// Also abort the fetch to stop reading the stream
			abortController.abort()
		}
	}

	/**
	 * Convert user-friendly request to internal format
	 */
	private buildInternalRequest(request: ChatCompletionRequest, isStream: boolean = false): any {
		const internal: any = {
			messages: request.messages
		}

		// Add model if provided
		if (request.model) {
			internal.model = request.model
		}

		// Merge options
		if (request.options) {
			Object.assign(internal, request.options)
		}

		// Force stream parameter for streaming requests
		if (isStream) {
			internal.stream = true
		}

		// Add skip configuration
		if (request.skip) {
			internal.skip = request.skip
		}

		// Add metadata (without chat_id, as it's sent via header)
		if (request.metadata) {
			internal.metadata = {
				...request.metadata
			}
		}

		return internal
	}

	/**
	 * Internal method to start streaming with fetch API
	 *
	 * Reads SSE stream and parses each line as a Message object.
	 * The backend sends Messages in JSON format (may use SSE "data: " prefix or raw JSON).
	 */
	private async startStream(
		url: string,
		request: any,
		assistantId: string | undefined,
		chatId: string | undefined,
		onEvent: StreamCallback,
		onError: ((error: Error) => void) | undefined,
		abortController: AbortController
	): Promise<void> {
		try {
			// Build headers
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				Accept: 'text/event-stream',
				'X-Yao-Accept': 'cui-web' // Request CUI format (Message DSL)
			}

			// Add assistant_id to header if provided
			if (assistantId) {
				headers['X-Yao-Assistant'] = assistantId
			}

			// Add chat_id to header if provided
			if (chatId) {
				headers['X-Yao-Chat'] = chatId
			}

			// Make POST request with streaming enabled
			const response = await fetch(url, {
				method: 'POST',
				headers,
				body: JSON.stringify(request),
				credentials: 'include', // Include cookies for authentication
				signal: abortController.signal
			})

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`)
			}

			if (!response.body) {
				throw new Error('Response body is null')
			}

			// Read stream using ReadableStream API
			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let buffer = ''

			while (true) {
				const { done, value } = await reader.read()

				if (done) {
					break
				}

				// Decode chunk and add to buffer
				const chunkText = decoder.decode(value, { stream: true })
				buffer += chunkText

				// Process complete SSE messages (split by newline)
				const lines = buffer.split('\n')
				buffer = lines.pop() || '' // Keep incomplete line in buffer

				for (const line of lines) {
					if (line.trim() === '') {
						continue
					}

					// Parse SSE format: "data: {json}" or raw JSON
					// Backend may send either format
					let data: string
					if (line.startsWith('data: ')) {
						data = line.substring(6) // Remove "data: " prefix
					} else {
						data = line
					}

					// Check for [DONE] marker (stream end signal)
					if (data.trim() === '[DONE]') {
						return
					}

					try {
						// Parse JSON as Message object
						const chunk = JSON.parse(data) as StreamChunk
						onEvent(chunk)
					} catch (parseError) {
						console.warn(
							'[Chat API] Failed to parse SSE data:',
							data.substring(0, 100),
							parseError
						)
					}
				}
			}
		} catch (error) {
			// Don't report error if aborted intentionally
			if (error instanceof Error && error.name === 'AbortError') {
				return
			}
			throw error
		}
	}

	/**
	 * Append messages to a running completion (pre-input support)
	 * POST /chat/completions/:context_id/append
	 *
	 * This allows users to send new messages while the AI is still generating a response.
	 * Also used for graceful cancellation by sending empty messages with 'force' type.
	 *
	 * @example
	 * ```typescript
	 * // Start streaming and capture context_id
	 * let contextId: string
	 * const abort = chat.StreamCompletion(request, (chunk) => {
	 *   // Capture context_id from stream_start event
	 *   if (chunk.type === 'event' && chunk.props?.event === 'stream_start') {
	 *     contextId = chunk.props.data?.context_id
	 *   }
	 * })
	 *
	 * // User sends a new message while AI is still responding
	 * await chat.AppendMessages(
	 *   contextId,
	 *   [{ role: 'user', content: 'Wait, I have another question...' }],
	 *   'graceful' // Wait for current step to complete
	 * )
	 *
	 * // Or force cancel by sending empty messages
	 * await chat.AppendMessages(contextId, [], 'force')
	 * ```
	 *
	 * @param contextId - The context ID of the running completion (from stream_start event)
	 * @param messages - New messages to append (empty array for cancellation)
	 * @param type - Interrupt type: "graceful" (wait for current step) or "force" (immediate)
	 * @param metadata - Optional metadata
	 * @returns Promise with append result
	 */
	async AppendMessages(
		contextId: string,
		messages: UserMessage[],
		type: InterruptType = 'graceful',
		metadata?: Record<string, any>
	): Promise<AppendMessagesResponse> {
		// Access private config to get baseURL
		// @ts-ignore
		const baseURL = this.api.config.baseURL

		// Build URL
		const url = `${baseURL}/chat/completions/${contextId}/append`

		// Build request body
		const body = {
			type,
			messages,
			metadata
		}

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body),
				credentials: 'include' // Include cookies for authentication
			})

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`HTTP ${response.status}: ${errorText}`)
			}

			return await response.json()
		} catch (error) {
			throw error instanceof Error ? error : new Error('Failed to append messages')
		}
	}
}
