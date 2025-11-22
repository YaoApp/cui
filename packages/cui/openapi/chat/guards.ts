import {
	Message,
	BuiltinMessage,
	MessageType,
	MessageTypeValue,
	EventType,
	TextMessage,
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
	GroupStartEventProps,
	GroupEndEventProps
} from './types'

/**
 * Type guard functions for built-in message types
 * These narrow the Message union type to specific typed messages
 */

export function IsTextMessage(msg: Message): msg is TextMessage {
	return msg.type === MessageType.TEXT
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
export function IsStreamStartEvent(
	msg: EventMessage
): msg is EventMessage & { props: StreamStartEventProps } {
	return msg.props.event === EventType.STREAM_START
}

export function IsStreamEndEvent(msg: EventMessage): msg is EventMessage & { props: StreamEndEventProps } {
	return msg.props.event === EventType.STREAM_END
}

export function IsGroupStartEvent(msg: EventMessage): msg is EventMessage & { props: GroupStartEventProps } {
	return msg.props.event === EventType.GROUP_START
}

export function IsGroupEndEvent(msg: EventMessage): msg is EventMessage & { props: GroupEndEventProps } {
	return msg.props.event === EventType.GROUP_END
}
