import {
	Message,
	BuiltinMessage,
	MessageType,
	MessageTypeValue,
	EventType,
	TextMessage,
	UserInputMessage,
	ThinkingMessage,
	LoadingMessage,
	ToolCallMessage,
	ErrorMessage,
	ActionMessage,
	EventMessage,
	ImageMessage,
	AudioMessage,
	VideoMessage,
	EventProps,
	StreamStartEventProps,
	StreamEndEventProps,
	ThreadStartEventProps,
	ThreadEndEventProps,
	BlockStartEventProps,
	BlockEndEventProps,
	MessageStartEventProps,
	MessageEndEventProps
} from './types'

/**
 * Type guard functions for built-in message types
 * These narrow the Message union type to specific typed messages
 */

export function IsTextMessage(msg: Message): msg is TextMessage {
	return msg.type === MessageType.TEXT
}

export function IsUserInputMessage(msg: Message): msg is UserInputMessage {
	return msg.type === MessageType.USER_INPUT
}

export function IsThinkingMessage(msg: Message): msg is ThinkingMessage {
	return msg.type === MessageType.THINKING
}

export function IsLoadingMessage(msg: Message): msg is LoadingMessage {
	return msg.type === MessageType.LOADING
}

export function IsToolCallMessage(msg: Message): msg is ToolCallMessage {
	return msg.type === MessageType.TOOL_CALL
}

export function IsErrorMessage(msg: Message): msg is ErrorMessage {
	return msg.type === MessageType.ERROR
}

export function IsActionMessage(msg: Message): msg is ActionMessage {
	return msg.type === MessageType.ACTION
}

export function IsEventMessage(msg: Message): msg is EventMessage {
	return msg.type === MessageType.EVENT
}

export function IsImageMessage(msg: Message): msg is ImageMessage {
	return msg.type === MessageType.IMAGE
}

export function IsAudioMessage(msg: Message): msg is AudioMessage {
	return msg.type === MessageType.AUDIO
}

export function IsVideoMessage(msg: Message): msg is VideoMessage {
	return msg.type === MessageType.VIDEO
}

/**
 * Check if message is a built-in type
 */
export function IsBuiltinMessage(msg: Message): msg is BuiltinMessage {
	return Object.values(MessageType).includes(msg.type as MessageTypeValue)
}

/**
 * Event type guards - narrow down EventMessage to specific event types
 */

// Stream level events
export function IsStreamStartEvent(msg: EventMessage): msg is EventMessage & { props: StreamStartEventProps } {
	return msg.props.event === EventType.STREAM_START
}

export function IsStreamEndEvent(msg: EventMessage): msg is EventMessage & { props: StreamEndEventProps } {
	return msg.props.event === EventType.STREAM_END
}

// Thread level events (concurrent operations)
export function IsThreadStartEvent(msg: EventMessage): msg is EventMessage & { props: ThreadStartEventProps } {
	return msg.props.event === EventType.THREAD_START
}

export function IsThreadEndEvent(msg: EventMessage): msg is EventMessage & { props: ThreadEndEventProps } {
	return msg.props.event === EventType.THREAD_END
}

// Block level events (output sections)
export function IsBlockStartEvent(msg: EventMessage): msg is EventMessage & { props: BlockStartEventProps } {
	return msg.props.event === EventType.BLOCK_START
}

export function IsBlockEndEvent(msg: EventMessage): msg is EventMessage & { props: BlockEndEventProps } {
	return msg.props.event === EventType.BLOCK_END
}

// Message level events (individual logical messages)
export function IsMessageStartEvent(msg: EventMessage): msg is EventMessage & { props: MessageStartEventProps } {
	return msg.props.event === EventType.MESSAGE_START
}

export function IsMessageEndEvent(msg: EventMessage): msg is EventMessage & { props: MessageEndEventProps } {
	return msg.props.event === EventType.MESSAGE_END
}
