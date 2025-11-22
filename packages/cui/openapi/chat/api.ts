import { OpenAPI } from '../openapi'
import { ChatCompletionRequest, ChatCompletionResponse, StreamChunk, StreamCallback } from './types'

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
	 * POST /chat/:assistant_id/completions
	 *
	 * This uses fetch() with ReadableStream to handle SSE over POST requests.
	 * Works in browser environments without Node.js dependencies.
	 *
	 * @param request - The chat completion request
	 * @param onEvent - Callback for each SSE event/chunk
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

		// Start the stream
		this.startStream(
			url,
			internalRequest,
			assistantId,
			request.chat_id,
			onEvent,
			onError,
			abortController
		).catch((error) => {
			onError?.(error)
		})

		// Return abort function
		return () => abortController.abort()
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
				'X-Yao-Accept': 'cui-web' // Fixed accept header for CUI format
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
				buffer += decoder.decode(value, { stream: true })

				// Process complete SSE messages
				const lines = buffer.split('\n')
				buffer = lines.pop() || '' // Keep incomplete line in buffer

				for (const line of lines) {
					if (line.trim() === '') {
						continue
					}

					// Parse SSE format: "data: {json}"
					// CUI format may send raw JSON or SSE format
					let data: string
					if (line.startsWith('data: ')) {
						data = line.substring(6) // Remove "data: " prefix
					} else {
						data = line
					}

					// Check for [DONE] marker
					if (data.trim() === '[DONE]') {
						return
					}

					try {
						const chunk = JSON.parse(data) as StreamChunk
						onEvent(chunk)
					} catch (parseError) {
						console.warn('Failed to parse SSE data:', data, parseError)
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
}
