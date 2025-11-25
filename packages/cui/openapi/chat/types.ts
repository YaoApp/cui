/**
 * Chat Completion Types
 *
 * Compatible with OpenAI Chat Completions API format with CUI extensions
 */

// ============================================================================
// Built-in Message Types (Backend Output)
// ============================================================================

/**
 * Built-in message type constants
 *
 * Note: Message type is extensible - you can use any string as type.
 * These are just the standardized built-in types that have defined Props structures.
 * Custom types require corresponding frontend components.
 */
export const MessageType = {
	// Content types
	TEXT: 'text',
	THINKING: 'thinking',
	LOADING: 'loading',
	TOOL_CALL: 'tool_call',
	ERROR: 'error',

	// Media types
	IMAGE: 'image',
	AUDIO: 'audio',
	VIDEO: 'video',

	// System types (CUI only)
	ACTION: 'action',
	EVENT: 'event'
} as const

export type MessageTypeValue = (typeof MessageType)[keyof typeof MessageType]

// Note: StreamChunkType is removed because frontend receives Message objects,
// not raw chunk types. Backend StreamFunc converts chunks to Messages.

/**
 * Event type constants (for EventProps.event field in TypeEvent messages)
 * These are used in message.props.event when message.type === 'event'
 */
export const EventType = {
	STREAM_START: 'stream_start',
	STREAM_END: 'stream_end',
	GROUP_START: 'group_start',
	GROUP_END: 'group_end'
} as const

export type EventTypeValue = (typeof EventType)[keyof typeof EventType]

/**
 * Text message props
 */
export interface TextProps {
	content: string // Supports Markdown
}

/**
 * Thinking message props (reasoning process)
 */
export interface ThinkingProps {
	content: string // Reasoning/thinking content
}

/**
 * Loading indicator props
 */
export interface LoadingProps {
	message: string // e.g., "Searching knowledge base..."
}

/**
 * Tool call props
 */
export interface ToolCallProps {
	id: string
	name: string
	arguments?: string // JSON string
}

/**
 * Error message props
 */
export interface ErrorProps {
	message: string
	code?: string
	details?: string
}

/**
 * Action message props (CUI only)
 */
export interface ActionProps {
	name: string // e.g., "open_panel", "navigate"
	payload?: Record<string, any>
}

/**
 * Assistant information
 */
export interface AssistantInfo {
	assistant_id: string
	type?: string
	name?: string
	avatar?: string
	description?: string
}

/**
 * Token usage information
 */
export interface UsageInfo {
	prompt_tokens: number
	completion_tokens: number
	total_tokens: number
	prompt_tokens_details?: Record<string, any>
	completion_tokens_details?: Record<string, any>
}

/**
 * Tool call information for group events
 */
export interface GroupToolCallInfo {
	id: string
	name: string
	arguments?: string
	index: number
}

/**
 * Stream start event data
 */
export interface StreamStartData {
	context_id: string // Context ID for the response
	request_id: string // Unique identifier for this request
	timestamp: number // Unix timestamp (milliseconds) when stream started
	chat_id: string // Chat ID being used
	trace_id?: string // Trace ID for debugging
	assistant?: AssistantInfo // Assistant information
	metadata?: Record<string, any> // Metadata to pass to the page for CUI context
}

/**
 * Stream end event data
 */
export interface StreamEndData {
	request_id: string
	timestamp: number
	duration_ms: number
	status: 'completed' | 'error' | 'cancelled'
	error?: string
	context_id?: string // Context ID for the response
	trace_id?: string // Trace ID for debugging
	usage?: UsageInfo
	metadata?: Record<string, any>
}

/**
 * Group start event data
 */
export interface GroupStartData {
	group_id: string
	type: string // "text" | "thinking" | "tool_call" | "refusal"
	timestamp: number
	tool_call?: GroupToolCallInfo
	extra?: Record<string, any>
}

/**
 * Group end event data
 */
export interface GroupEndData {
	group_id: string
	type: string
	timestamp: number
	duration_ms: number
	chunk_count: number
	status: 'completed' | 'partial' | 'error'
	tool_call?: GroupToolCallInfo
	extra?: Record<string, any>
}

/**
 * Typed event props for different event types
 */
export type StreamStartEventProps = { event: typeof EventType.STREAM_START; message?: string; data?: StreamStartData }
export type StreamEndEventProps = { event: typeof EventType.STREAM_END; message?: string; data?: StreamEndData }
export type GroupStartEventProps = { event: typeof EventType.GROUP_START; message?: string; data?: GroupStartData }
export type GroupEndEventProps = { event: typeof EventType.GROUP_END; message?: string; data?: GroupEndData }
export type CustomEventProps = { event: string; message?: string; data?: Record<string, any> }

/**
 * Event message props union (CUI only)
 * Different event types have different data structures
 */
export type EventProps =
	| StreamStartEventProps
	| StreamEndEventProps
	| GroupStartEventProps
	| GroupEndEventProps
	| CustomEventProps

/**
 * Image message props
 */
export interface ImageProps {
	url: string // Required
	alt?: string
	width?: number
	height?: number
	detail?: 'auto' | 'low' | 'high'
}

/**
 * Audio message props
 */
export interface AudioProps {
	url: string // Required
	format?: string // "mp3", "wav", "ogg"
	duration?: number
	transcript?: string
	autoplay?: boolean
	controls?: boolean // default: true
}

/**
 * Video message props
 */
export interface VideoProps {
	url: string // Required
	format?: string // "mp4", "webm"
	duration?: number
	thumbnail?: string
	width?: number
	height?: number
	autoplay?: boolean
	controls?: boolean // default: true
	loop?: boolean
}

/**
 * Base message interface - all messages share these fields
 */
interface BaseMessage {
	// Core fields
	type: string
	props?: Record<string, any>

	// Streaming control
	id?: string // Message ID for merging in streaming
	delta?: boolean // Whether this is an incremental update
	done?: boolean // Whether the message is complete

	// Delta update control
	delta_path?: string // Update path (e.g., "content", "items.0.name")
	delta_action?: 'append' | 'replace' | 'merge' | 'set' // Update action

	// Type correction
	type_change?: boolean // Marks this as a type correction

	// Message grouping
	group_id?: string // Parent message group ID
	group_start?: boolean // Marks the start of a group
	group_end?: boolean // Marks the end of a group

	// Metadata
	metadata?: {
		timestamp?: number // Unix nanoseconds
		sequence?: number // Message sequence number
		trace_id?: string // For debugging
	}
}

/**
 * Typed messages for built-in types with proper props autocomplete
 */
export type TextMessage = BaseMessage & { type: typeof MessageType.TEXT; props: TextProps }
export type ThinkingMessage = BaseMessage & { type: typeof MessageType.THINKING; props: ThinkingProps }
export type LoadingMessage = BaseMessage & { type: typeof MessageType.LOADING; props: LoadingProps }
export type ToolCallMessage = BaseMessage & { type: typeof MessageType.TOOL_CALL; props: ToolCallProps }
export type ErrorMessage = BaseMessage & { type: typeof MessageType.ERROR; props: ErrorProps }
export type ImageMessage = BaseMessage & { type: typeof MessageType.IMAGE; props: ImageProps }
export type AudioMessage = BaseMessage & { type: typeof MessageType.AUDIO; props: AudioProps }
export type VideoMessage = BaseMessage & { type: typeof MessageType.VIDEO; props: VideoProps }
export type ActionMessage = BaseMessage & { type: typeof MessageType.ACTION; props: ActionProps }
export type EventMessage = BaseMessage & { type: typeof MessageType.EVENT; props: EventProps }

/**
 * Union of all built-in typed messages
 */
export type BuiltinMessage =
	| TextMessage
	| ThinkingMessage
	| LoadingMessage
	| ToolCallMessage
	| ErrorMessage
	| ImageMessage
	| AudioMessage
	| VideoMessage
	| ActionMessage
	| EventMessage

/**
 * Custom message for extensibility - type can be any string
 */
export type CustomMessage = BaseMessage & { type: string; props?: Record<string, any> }

/**
 * Universal message with streaming support
 *
 * Type field is extensible:
 * - Built-in types: TypeScript provides autocomplete for props based on type
 * - Custom types: type can be any string (e.g., 'table', 'chart', 'form') with any props
 *
 * Use type guards (IsTextMessage, IsEventMessage, etc.) to narrow down types
 */
export type Message = BuiltinMessage | CustomMessage

/**
 * Message group helper type
 * Note: Groups are not sent as separate chunks
 * Instead, they are marked by group_start/group_end fields in Messages
 */
export interface MessageGroup {
	id: string
	messages: Message[]
}

// ============================================================================
// OpenAI Chat API Types (Input)
// ============================================================================

/**
 * Message role in conversation
 * Compatible with OpenAI Chat Completion API
 *
 * - developer: Developer-provided instructions (o1 models and newer)
 * - system: System instructions
 * - user: User messages
 * - assistant: Assistant responses
 * - tool: Tool responses
 */
export type MessageRole = 'developer' | 'system' | 'user' | 'assistant' | 'tool'

/**
 * User message role - roles that frontend can send
 * - user: User input (most common, 99% of usage)
 * - system: System instructions (advanced usage)
 * - developer: Developer instructions (advanced usage)
 */
export type UserMessageRole = 'user' | 'system' | 'developer'

/**
 * Content part type for multimodal messages
 */
export type ContentPartType = 'text' | 'image_url' | 'input_audio' | 'file'

/**
 * Image detail level for image processing
 */
export type ImageDetailLevel = 'auto' | 'low' | 'high'

/**
 * Image URL in message content
 */
export interface ImageURL {
	url: string // URL of the image or base64 encoded image data
	detail?: ImageDetailLevel // How the model processes the image
}

/**
 * Input audio data in message content
 */
export interface InputAudio {
	data: string // Base64 encoded audio data
	format: string // Audio format (e.g., "wav", "mp3")
}

/**
 * File attachment in message content
 * Note: Backend support for this type is planned for future release
 */
export interface FileAttachment {
	url: string // URL of the file or base64 encoded file data
	filename?: string // Original filename
	mime_type?: string // MIME type (e.g., "application/pdf", "text/plain")
}

/**
 * Content part for multimodal messages
 * Used when content is an array instead of a simple string
 */
export interface ContentPart {
	type: ContentPartType
	text?: string // For type="text": the text content
	image_url?: ImageURL // For type="image_url": the image URL
	input_audio?: InputAudio // For type="input_audio": the input audio data
	file?: FileAttachment // For type="file": file attachment (backend support coming soon)
}

/**
 * User input message for Chat Completion API
 * Used when SENDING messages to backend
 *
 * Frontend sends ONLY the current user input message.
 * Conversation history is managed by backend using chat_id.
 * Backend returns Message (CUI DSL format) for display.
 *
 * @see Message - Response format from backend (CUI DSL)
 */
export interface UserMessage {
	/** Message role - Frontend typically only sends 'user' */
	role: UserMessageRole
	/** Message content - Text or multimodal (image, audio, file) */
	content: string | ContentPart[]
	/** Optional participant name */
	name?: string
}

/**
 * Tool call type
 */
export type ToolCallType = 'function'

/**
 * Function call with name and arguments
 */
export interface ToolCallFunction {
	name: string // Required: name of the function to call
	arguments?: string // Optional: arguments to pass to the function, as a JSON string
}

/**
 * Tool call generated by the model (for assistant messages)
 */
export interface ToolCall {
	id: string // Required: unique identifier for the tool call
	type: ToolCallType // Required: type of tool call, currently only "function"
	function: ToolCallFunction // Required: function call details
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Chat Completion Request (User-friendly API)
 */
/**
 * Skip configuration for internal operations
 * Used to skip saving chat history or trace logs for system calls
 * (e.g., title generation, prompt generation)
 */
export interface Skip {
	history?: boolean // Skip saving chat history (for title/prompt generation)
	trace?: boolean // Skip trace logging
}

/**
 * Base request fields shared by all variants
 */
interface ChatCompletionRequestBase {
	messages: UserMessage[] // User messages (required)
	chat_id?: string // Chat ID (auto-generated if not provided)
	options?: ChatCompletionOptions // Advanced OpenAI-compatible options
	metadata?: Record<string, any> // Custom metadata
	skip?: Skip // Skip configuration (history, trace, etc.)
}

/**
 * Request with assistant_id (recommended)
 */
interface ChatCompletionRequestWithAssistant extends ChatCompletionRequestBase {
	assistant_id: string // Assistant ID (required)
	model?: string // Optional: OpenAI model identifier for compatibility
}

/**
 * Request with model only (OpenAI compatibility mode)
 *
 * The `model` field is designed for OpenAI API compatibility.
 * Backend extracts assistant_id from model string using format:
 * `[prefix-]assistantName-model-yao_assistantID`
 *
 * Examples:
 * - "gpt-4o-yao_myassistant" → assistant_id: "myassistant"
 * - "claude-3-sonnet-yao_chatbot" → assistant_id: "chatbot"
 *
 * The backend splits by "-yao_" and takes the last part as assistant_id.
 */
interface ChatCompletionRequestWithModel extends ChatCompletionRequestBase {
	assistant_id?: string // Optional: Takes priority if both provided
	model: string // Required: Model string with embedded assistant_id (format: *-yao_assistantID)
}

/**
 * Chat Completion Request
 *
 * Either `assistant_id` OR `model` must be provided:
 * - `assistant_id`: Direct assistant reference (recommended for Yao apps)
 * - `model`: OpenAI-compatible model identifier (extracts assistant_id from format: *-yao_assistantID)
 * - Both: `assistant_id` takes priority over model extraction
 *
 * Priority order (backend):
 * 1. Query parameter "assistant_id"
 * 2. Header "X-Yao-Assistant"
 * 3. Extract from "model" field (splits by "-yao_" and takes last part)
 */
export type ChatCompletionRequest = ChatCompletionRequestWithAssistant | ChatCompletionRequestWithModel

/**
 * OpenAI-compatible completion options
 */
export interface ChatCompletionOptions {
	temperature?: number
	max_tokens?: number
	max_completion_tokens?: number
	top_p?: number
	n?: number
	stream?: boolean
	stop?: string | string[]
	presence_penalty?: number
	frequency_penalty?: number
	logit_bias?: Record<string, number>
	user?: string
	seed?: number
	tools?: any[]
	tool_choice?: any
	response_format?: {
		type: 'text' | 'json_object' | 'json_schema'
		json_schema?: {
			name: string
			description?: string
			schema: any
			strict?: boolean
		}
	}
	audio?: {
		voice?: string
		format?: string
	}
	stream_options?: {
		include_usage?: boolean
	}
	route?: string
}

/**
 * Internal request format (matches backend OpenAPI)
 */
export interface ChatCompletionRequestInternal {
	model?: string
	messages: UserMessage[]
	temperature?: number
	max_tokens?: number
	max_completion_tokens?: number
	top_p?: number
	n?: number
	stream?: boolean
	stop?: string | string[]
	presence_penalty?: number
	frequency_penalty?: number
	logit_bias?: Record<string, number>
	user?: string
	seed?: number
	tools?: any[]
	tool_choice?: any
	response_format?: {
		type: 'text' | 'json_object' | 'json_schema'
		json_schema?: {
			name: string
			description?: string
			schema: any
			strict?: boolean
		}
	}
	audio?: {
		voice?: string
		format?: string
	}
	stream_options?: {
		include_usage?: boolean
	}
	metadata?: Record<string, any>
	route?: string
}

// ============================================================================
// Response Types (Non-streaming)
// ============================================================================

export interface ChatCompletionResponse {
	id: string
	object: 'chat.completion'
	created: number
	model: string
	choices: ChatCompletionChoice[]
	usage?: {
		prompt_tokens: number
		completion_tokens: number
		total_tokens: number
	}
	system_fingerprint?: string
}

export interface ChatCompletionChoice {
	index: number
	message: UserMessage
	finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null
	logprobs?: any
}

// ============================================================================
// Streaming Types
// ============================================================================

/**
 * Stream chunk type
 * All chunks are Message objects
 */
export type StreamChunk = Message

// ============================================================================
// Callback Types
// ============================================================================

/**
 * Callback for streaming events
 */
export type StreamCallback = (chunk: StreamChunk) => void

// ============================================================================
// Append Messages Types (Pre-input support)
// ============================================================================

/**
 * Interrupt type for appending messages
 */
export type InterruptType = 'graceful' | 'force'

/**
 * Request for appending messages to running completion
 */
export interface AppendMessagesRequest {
	type: InterruptType // Interrupt type: "graceful" (wait for current step) or "force" (immediate)
	messages: UserMessage[] // New messages to append
	metadata?: Record<string, any> // Optional metadata
}

/**
 * Response from append messages API
 */
export interface AppendMessagesResponse {
	message: string // Success message
	context_id: string // Context ID that was interrupted
	type: InterruptType // Interrupt type that was used
	timestamp: number // Timestamp when the interrupt was processed
}
