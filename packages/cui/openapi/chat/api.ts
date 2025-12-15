import { OpenAPI } from '../openapi'
import {
	ChatCompletionRequest,
	ChatCompletionResponse,
	StreamChunk,
	StreamCallback,
	UserMessage,
	AppendMessagesResponse,
	InterruptType,
	ChatSession,
	ChatSessionFilter,
	ChatSessionList,
	UpdateChatRequest,
	ChatMessageFilter,
	ChatMessagesResponse,
	Reference,
	ReferencesResponse
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
			abortController,
			request.locale
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
		abortController: AbortController,
		locale?: string
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

			// Add locale to header if provided (for i18n support)
			if (locale) {
				// Use query parameter for locale (priority 1 in backend GetLocale)
				url = `${url}?locale=${encodeURIComponent(locale)}`
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

	// =========================================================================
	// Chat Session Management (History)
	// =========================================================================

	/**
	 * List chat sessions with pagination and filtering
	 * GET /chat/sessions
	 *
	 * @example
	 * ```typescript
	 * // List all active sessions
	 * const sessions = await chat.ListSessions({ status: 'active' })
	 *
	 * // List with time-based grouping
	 * const grouped = await chat.ListSessions({ group_by: 'time' })
	 * console.log(grouped.groups) // [{label: "Today", chats: [...]}, ...]
	 *
	 * // Filter by assistant
	 * const filtered = await chat.ListSessions({
	 *   assistant_id: 'my-assistant',
	 *   keywords: 'search term'
	 * })
	 * ```
	 *
	 * @param filter - Optional filter parameters
	 * @returns Promise with paginated chat session list
	 */
	async ListSessions(filter?: ChatSessionFilter): Promise<ChatSessionList> {
		// @ts-ignore
		const baseURL = this.api.config.baseURL

		// Build query string
		const params = new URLSearchParams()
		if (filter) {
			if (filter.assistant_id) params.append('assistant_id', filter.assistant_id)
			if (filter.status) params.append('status', filter.status)
			if (filter.keywords) params.append('keywords', filter.keywords)
			if (filter.start_time) params.append('start_time', filter.start_time)
			if (filter.end_time) params.append('end_time', filter.end_time)
			if (filter.time_field) params.append('time_field', filter.time_field)
			if (filter.order_by) params.append('order_by', filter.order_by)
			if (filter.order) params.append('order', filter.order)
			if (filter.group_by) params.append('group_by', filter.group_by)
			if (filter.page) params.append('page', String(filter.page))
			if (filter.pagesize) params.append('pagesize', String(filter.pagesize))
		}

		const queryString = params.toString()
		const url = `${baseURL}/chat/sessions${queryString ? '?' + queryString : ''}`

		const response = await fetch(url, {
			method: 'GET',
			credentials: 'include'
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`HTTP ${response.status}: ${errorText}`)
		}

		const result = await response.json()
		// Handle both { data: {...} } and direct response formats
		return (result.data || result) as ChatSessionList
	}

	/**
	 * Get a single chat session by ID
	 * GET /chat/sessions/:chat_id
	 *
	 * @param chatId - The chat session ID
	 * @returns Promise with chat session details
	 */
	async GetSession(chatId: string): Promise<ChatSession> {
		// @ts-ignore
		const baseURL = this.api.config.baseURL
		const url = `${baseURL}/chat/sessions/${chatId}`

		const response = await fetch(url, {
			method: 'GET',
			credentials: 'include'
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`HTTP ${response.status}: ${errorText}`)
		}

		const result = await response.json()
		// Handle both { data: {...} } and direct response formats
		return (result.data || result) as ChatSession
	}

	/**
	 * Update a chat session
	 * PUT /chat/sessions/:chat_id
	 *
	 * @example
	 * ```typescript
	 * // Update title
	 * await chat.UpdateSession('chat-123', { title: 'New Title' })
	 *
	 * // Archive session
	 * await chat.UpdateSession('chat-123', { status: 'archived' })
	 * ```
	 *
	 * @param chatId - The chat session ID
	 * @param updates - Fields to update
	 * @returns Promise with success message
	 */
	async UpdateSession(chatId: string, updates: UpdateChatRequest): Promise<{ message: string; chat_id: string }> {
		// @ts-ignore
		const baseURL = this.api.config.baseURL
		const url = `${baseURL}/chat/sessions/${chatId}`

		const response = await fetch(url, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updates),
			credentials: 'include'
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`HTTP ${response.status}: ${errorText}`)
		}

		const result = await response.json()
		return result.data
	}

	/**
	 * Delete a chat session (soft delete)
	 * DELETE /chat/sessions/:chat_id
	 *
	 * @param chatId - The chat session ID
	 * @returns Promise with success message
	 */
	async DeleteSession(chatId: string): Promise<{ message: string; chat_id: string }> {
		// @ts-ignore
		const baseURL = this.api.config.baseURL
		const url = `${baseURL}/chat/sessions/${chatId}`

		const response = await fetch(url, {
			method: 'DELETE',
			credentials: 'include'
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`HTTP ${response.status}: ${errorText}`)
		}

		const result = await response.json()
		return result.data
	}

	/**
	 * Get messages for a chat session
	 * GET /chat/sessions/:chat_id/messages
	 *
	 * @example
	 * ```typescript
	 * // Get all messages
	 * const messages = await chat.GetMessages('chat-123')
	 *
	 * // Filter by role
	 * const userMessages = await chat.GetMessages('chat-123', { role: 'user' })
	 *
	 * // Paginate
	 * const page = await chat.GetMessages('chat-123', { limit: 50, offset: 0 })
	 * ```
	 *
	 * @param chatId - The chat session ID
	 * @param filter - Optional filter parameters
	 * @returns Promise with messages response
	 */
	async GetMessages(chatId: string, filter?: ChatMessageFilter): Promise<ChatMessagesResponse> {
		// @ts-ignore
		const baseURL = this.api.config.baseURL

		// Build query string
		const params = new URLSearchParams()
		if (filter) {
			if (filter.request_id) params.append('request_id', filter.request_id)
			if (filter.role) params.append('role', filter.role)
			if (filter.block_id) params.append('block_id', filter.block_id)
			if (filter.thread_id) params.append('thread_id', filter.thread_id)
			if (filter.type) params.append('type', filter.type)
			if (filter.limit) params.append('limit', String(filter.limit))
			if (filter.offset) params.append('offset', String(filter.offset))
		}

		const queryString = params.toString()
		const url = `${baseURL}/chat/sessions/${chatId}/messages${queryString ? '?' + queryString : ''}`

		const response = await fetch(url, {
			method: 'GET',
			credentials: 'include'
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`HTTP ${response.status}: ${errorText}`)
		}

		const result = await response.json()
		// Handle both { data: {...} } and direct response formats
		return (result.data || result) as ChatMessagesResponse
	}

	// =========================================================================
	// Search References (Citation Support)
	// =========================================================================

	/**
	 * Get all search references for a request
	 * GET /chat/references/:request_id
	 *
	 * Returns all search references for citation support.
	 * References are collected from web search, knowledge base, and database queries.
	 *
	 * @example
	 * ```typescript
	 * // Get all references for a request
	 * const refs = await chat.GetReferences('req-123')
	 * console.log(refs.references) // [{index: 1, type: 'web', title: '...', url: '...'}, ...]
	 * ```
	 *
	 * @param requestId - The request ID (from stream_start event data.request_id)
	 * @returns Promise with references response
	 */
	async GetReferences(requestId: string): Promise<ReferencesResponse> {
		// @ts-ignore
		const baseURL = this.api.config.baseURL
		const url = `${baseURL}/chat/references/${requestId}`

		const response = await fetch(url, {
			method: 'GET',
			credentials: 'include'
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`HTTP ${response.status}: ${errorText}`)
		}

		const result = await response.json()
		// Handle both { data: {...} } and direct response formats
		return (result.data || result) as ReferencesResponse
	}

	/**
	 * Get a single reference by request ID and index
	 * GET /chat/references/:request_id/:index
	 *
	 * Returns a specific reference for citation click handling.
	 * Index is 1-based (matches citation numbers in text).
	 *
	 * @example
	 * ```typescript
	 * // Get reference #1 when user clicks [1] citation
	 * const ref = await chat.GetReference('req-123', 1)
	 * console.log(ref.title, ref.url) // "Example Page", "https://..."
	 * ```
	 *
	 * @param requestId - The request ID (from stream_start event data.request_id)
	 * @param index - The reference index (1-based, matches citation number)
	 * @returns Promise with the reference
	 */
	async GetReference(requestId: string, index: number): Promise<Reference> {
		// @ts-ignore
		const baseURL = this.api.config.baseURL
		const url = `${baseURL}/chat/references/${requestId}/${index}`

		const response = await fetch(url, {
			method: 'GET',
			credentials: 'include'
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`HTTP ${response.status}: ${errorText}`)
		}

		const result = await response.json()
		// Handle both { data: {...} } and direct response formats
		return (result.data || result) as Reference
	}
}
