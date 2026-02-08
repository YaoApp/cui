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
	USER_INPUT: 'user_input', // User input message (frontend display)
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
 *
 * Hierarchical structure: Stream > Thread > Block > Message > Chunk
 * - Stream level: overall conversation stream (stream_start, stream_end)
 * - Thread level: concurrent operations (thread_start, thread_end)
 * - Block level: logical output sections (block_start, block_end)
 * - Message level: individual logical messages (message_start, message_end)
 */
export const EventType = {
	// Stream level events (Agent layer - overall conversation stream)
	STREAM_START: 'stream_start',
	STREAM_END: 'stream_end',

	// Thread level events (optional - for concurrent scenarios)
	THREAD_START: 'thread_start',
	THREAD_END: 'thread_end',

	// Block level events (Agent layer - logical output sections)
	BLOCK_START: 'block_start',
	BLOCK_END: 'block_end',

	// Message level events (LLM layer - individual logical messages)
	MESSAGE_START: 'message_start',
	MESSAGE_END: 'message_end'
} as const

export type EventTypeValue = (typeof EventType)[keyof typeof EventType]

/**
 * Text message props
 */
export interface TextProps {
	content: string // Supports Markdown
}

/**
 * User input message props
 * Displayed when user sends a message (before backend processes it)
 */
export interface UserInputProps {
	content: string | ContentPart[] // User input content (text or multimodal)
	role?: UserMessageRole // User role (default: 'user')
	name?: string // Optional participant name
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
	id?: string
	name?: string
	arguments?: string // JSON string
	raw?: string // Raw tool call data (streamed incrementally via delta)
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
 * Tool call information for message events
 */
export interface EventToolCallInfo {
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
	context_id: string // Context ID for the response
	trace_id?: string // Trace ID for debugging
	timestamp: number
	duration_ms: number
	status: 'completed' | 'error' | 'cancelled'
	error?: string
	usage?: UsageInfo
	metadata?: Record<string, any>
}

/**
 * Thread start event data (for concurrent operations)
 */
export interface ThreadStartData {
	thread_id: string // Thread ID (T1, T2, T3...)
	type: string // Thread type: "agent" | "llm" | "mcp" | "tool"
	timestamp: number // Unix timestamp when thread started
	label?: string // Human-readable label (e.g., "Parallel search 1")
	extra?: Record<string, any> // Additional metadata
}

/**
 * Thread end event data
 */
export interface ThreadEndData {
	thread_id: string // Thread ID (T1, T2, T3...)
	type: string // Thread type (same as in thread_start)
	timestamp: number // Unix timestamp when thread ended
	duration_ms: number // Duration of this thread in milliseconds
	block_count: number // Number of blocks in this thread
	status: 'completed' | 'partial' | 'error'
	extra?: Record<string, any> // Additional metadata
}

/**
 * Block start event data
 */
export interface BlockStartData {
	block_id: string // Block ID (B1, B2, B3...)
	type: string // Block type: "llm" | "mcp" | "agent" | "tool" | "mixed"
	timestamp: number // Unix timestamp when block started
	label?: string // Human-readable label (e.g., "Searching knowledge base")
	extra?: Record<string, any> // Additional metadata
}

/**
 * Block end event data
 */
export interface BlockEndData {
	block_id: string // Block ID (B1, B2, B3...)
	type: string // Block type (same as in block_start)
	timestamp: number // Unix timestamp when block ended
	duration_ms: number // Duration of this block in milliseconds
	message_count: number // Number of messages in this block
	status: 'completed' | 'partial' | 'error'
	extra?: Record<string, any> // Additional metadata
}

/**
 * Message start event data
 */
export interface MessageStartData {
	message_id: string // Message ID (M1, M2, M3...)
	type: string // Message type: "text" | "thinking" | "tool_call" | "refusal"
	timestamp: number // Unix timestamp when message started
	tool_call?: EventToolCallInfo // Tool call metadata (if type is "tool_call")
	extra?: Record<string, any> // Additional metadata
}

/**
 * Message end event data
 */
export interface MessageEndData {
	message_id: string // Message ID (M1, M2, M3...)
	type: string // Message type (same as in message_start)
	timestamp: number // Unix timestamp when message ended
	duration_ms: number // Duration of this message in milliseconds
	chunk_count: number // Number of data chunks in this message
	status: 'completed' | 'partial' | 'error'
	tool_call?: EventToolCallInfo // Complete tool call info (if type is "tool_call")
	extra?: Record<string, any> // Additional metadata (e.g., complete content)
}

/**
 * Typed event props for different event types
 */
export type StreamStartEventProps = { event: typeof EventType.STREAM_START; message?: string; data?: StreamStartData }
export type StreamEndEventProps = { event: typeof EventType.STREAM_END; message?: string; data?: StreamEndData }
export type ThreadStartEventProps = { event: typeof EventType.THREAD_START; message?: string; data?: ThreadStartData }
export type ThreadEndEventProps = { event: typeof EventType.THREAD_END; message?: string; data?: ThreadEndData }
export type BlockStartEventProps = { event: typeof EventType.BLOCK_START; message?: string; data?: BlockStartData }
export type BlockEndEventProps = { event: typeof EventType.BLOCK_END; message?: string; data?: BlockEndData }
export type MessageStartEventProps = {
	event: typeof EventType.MESSAGE_START
	message?: string
	data?: MessageStartData
}
export type MessageEndEventProps = { event: typeof EventType.MESSAGE_END; message?: string; data?: MessageEndData }
export type CustomEventProps = { event: string; message?: string; data?: Record<string, any> }

/**
 * Event message props union (CUI only)
 * Different event types have different data structures
 */
export type EventProps =
	| StreamStartEventProps
	| StreamEndEventProps
	| ThreadStartEventProps
	| ThreadEndEventProps
	| BlockStartEventProps
	| BlockEndEventProps
	| MessageStartEventProps
	| MessageEndEventProps
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

	// UI management
	ui_id?: string // Frontend-only unique ID for React key (to prevent key conflicts when message_id repeats across streams)

	// Streaming control - Hierarchical structure for Agent/LLM/MCP streaming
	chunk_id?: string // Unique chunk ID (auto-generated: C1, C2, C3...; for dedup/ordering/debugging)
	message_id?: string // Logical message ID (delta merge target; multiple chunks → one message)
	block_id?: string // Block ID (B1, B2, B3...; Agent-level grouping for UI sections)
	thread_id?: string // Thread ID (T1, T2, T3...; optional; for concurrent streams)

	// Delta control
	delta?: boolean // Whether this is an incremental update
	delta_path?: string // Update path (e.g., "content", "items.0.name")
	delta_action?: 'append' | 'replace' | 'merge' | 'set' // Update action

	// Type correction
	type_change?: boolean // Marks this as a type correction

	// Metadata
	metadata?: {
		timestamp?: number // Unix nanoseconds
		sequence?: number // Message sequence number
		trace_id?: string // For debugging
		request_id?: string // Request ID for tracking
	}
}

/**
 * Typed messages for built-in types with proper props autocomplete
 */
export type TextMessage = BaseMessage & { type: typeof MessageType.TEXT; props: TextProps }
export type UserInputMessage = BaseMessage & { type: typeof MessageType.USER_INPUT; props: UserInputProps }
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
	| UserInputMessage
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
	locale?: string // User locale (e.g., 'zh-CN', 'en-US') for i18n
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

// ============================================================================
// Chat Session Types (History Management)
// ============================================================================

/**
 * Chat session status
 */
export type ChatStatus = 'active' | 'archived'

/**
 * Chat sharing scope
 */
export type ChatShare = 'private' | 'team'

/**
 * Chat session
 * Represents a conversation session with an assistant
 */
export interface ChatSession {
	chat_id: string
	title?: string
	assistant_id: string
	last_connector?: string // Last used connector ID (updated on each message)
	last_mode?: string // Last used chat mode (updated on each message)
	status: ChatStatus
	public?: boolean // Whether shared across all teams
	share?: ChatShare // "private" or "team"
	sort?: number // Sort order for display
	last_message_at?: string // ISO 8601 datetime
	metadata?: Record<string, any>
	created_at: string // ISO 8601 datetime
	updated_at: string // ISO 8601 datetime
}

/**
 * Chat session filter for listing
 */
export interface ChatSessionFilter {
	assistant_id?: string
	status?: ChatStatus
	keywords?: string
	// Time range filter
	start_time?: string // ISO 8601 datetime
	end_time?: string // ISO 8601 datetime
	time_field?: 'created_at' | 'last_message_at'
	// Sorting
	order_by?: 'created_at' | 'updated_at' | 'last_message_at'
	order?: 'asc' | 'desc'
	// Response format
	group_by?: 'time' // "time" for time-based groups, empty for flat list
	// Pagination
	page?: number
	pagesize?: number
}

/**
 * Time-based group of chat sessions
 */
export interface ChatGroup {
	label: string // "Today", "Yesterday", "This Week", "This Month", "Earlier"
	key: string // "today", "yesterday", "this_week", "this_month", "earlier"
	chats: ChatSession[]
	count: number
}

/**
 * Paginated chat session list response
 */
export interface ChatSessionList {
	data: ChatSession[]
	groups?: ChatGroup[] // Time-based groups (when group_by=time)
	page: number
	pagesize: number
	pagecount: number
	total: number
}

/**
 * Request for updating a chat session
 */
export interface UpdateChatRequest {
	title?: string
	status?: ChatStatus
	metadata?: Record<string, any>
}

/**
 * Chat message (stored message)
 * Represents a message stored in the database
 */
export interface ChatMessage {
	message_id: string
	chat_id: string
	request_id?: string
	role: 'user' | 'assistant'
	type: string // "text", "image", "loading", "tool_call", "retrieval", etc.
	props: Record<string, any>
	block_id?: string
	thread_id?: string
	assistant_id?: string
	connector?: string // Connector ID used for this message
	mode?: string // Chat mode used for this message (chat or task)
	sequence: number
	metadata?: Record<string, any>
	created_at: string // ISO 8601 datetime
	updated_at: string // ISO 8601 datetime
}

/**
 * Message filter for listing messages
 */
export interface ChatMessageFilter {
	request_id?: string
	role?: 'user' | 'assistant'
	block_id?: string
	thread_id?: string
	type?: string
	limit?: number
	offset?: number
	locale?: string // Locale for assistant info (e.g., "zh-cn", "en-us")
}

/**
 * Response for getting messages
 */
export interface ChatMessagesResponse {
	chat_id: string
	messages: ChatMessage[]
	count: number
	assistants?: Record<string, AssistantInfo>
}

// ============================================================================
// Search Reference Types (Citation Support)
// ============================================================================

/**
 * Search reference for citation support
 * Represents a reference from web search, knowledge base, or database
 */
export interface Reference {
	index: number // Global index (1-based, unique within request)
	type: string // "web" | "kb" | "db"
	title: string // Reference title
	url?: string // URL (for web)
	snippet?: string // Short snippet
	content?: string // Full content
	metadata?: Record<string, any>
}

/**
 * Response for getting all references for a request
 */
export interface ReferencesResponse {
	request_id: string
	references: Reference[]
	total: number
}
