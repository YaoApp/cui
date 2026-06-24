import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getLocale } from '@umijs/max'
import type { Message } from '../../../openapi'
import type { SendMessageRequest, InputAreaHandle } from '../../types'
import { Agent } from '../../../openapi/agent'
import { useTaskWS } from '../../../pages/kanban/hooks/useTaskWS'
import MessageList from '../MessageList'
import InputArea from '../InputArea'
import Placeholder from '../Chatbox/Placeholder'
import styles from './index.less'

interface AssistantInfo {
	id: string
	name: string
	avatar?: string
	description?: string
	connector?: string
	connector_options?: any
	modes?: string[]
	default_mode?: string
	sandbox?: boolean
	computer_filter?: any
	placeholder?: { title?: string; description?: string; prompts?: string[] }
}

export interface TaskChatProps {
	chatId: string
	assistantId: string
	fallbackAssistantId?: string
	columnId?: string

	className?: string
	style?: React.CSSProperties
	placeholder?: React.ReactNode

	disabled?: boolean
	readOnly?: boolean
	forceModelSelector?: boolean
	allowAssistantSwitch?: boolean

	initialWorkspace?: string
	onWorkspaceChange?: (id: string) => void

	onSend?: (request: SendMessageRequest) => Promise<void>
	messages?: Message[]
	loading?: boolean
	streaming?: boolean

	onAssistantChange?: (assistantId: string) => void
	onMessagesChange?: (messages: Message[]) => void
}

const TaskChat: React.FC<TaskChatProps> = (props) => {
	const {
		chatId,
		assistantId,
		fallbackAssistantId,
		columnId,
		className,
		style,
		placeholder,
		disabled,
		readOnly,
		forceModelSelector = true,
		allowAssistantSwitch = true,
		initialWorkspace,
		onWorkspaceChange,
		onSend,
		messages: externalMessages,
		loading: externalLoading,
		streaming: externalStreaming,
		onAssistantChange,
		onMessagesChange
	} = props

	const locale = getLocale()
	const [assistant, setAssistant] = useState<AssistantInfo | null>(null)

	useEffect(() => {
		if (!window.$app?.openapi) return
		const targetId = assistantId || fallbackAssistantId
		if (!targetId) return

		const agentClient = new Agent(window.$app.openapi)
		const loc = locale || 'en-us'

		const buildAssistant = (data: any): AssistantInfo => ({
			id: data.assistant_id,
			name: data.name,
			avatar: data.avatar,
			description: data.description,
			connector: data.connector,
			connector_options: forceModelSelector
				? { ...data.connector_options, optional: true }
				: data.connector_options,
			modes: data.modes,
			default_mode: data.default_mode,
			sandbox: data.sandbox,
			computer_filter: data.computer_filter,
			placeholder: data.placeholder
		})

		const fetchAssistant = async (id: string): Promise<boolean> => {
			try {
				const res = await agentClient.assistants.GetInfo(id, loc)
				if (!window.$app.openapi.IsError(res)) {
					const data = window.$app.openapi.GetData(res)
					if (data?.connector) {
						setAssistant(buildAssistant(data))
						return true
					}
				}
			} catch {}
			return false
		}

		fetchAssistant(targetId).then((ok) => {
			if (!ok && fallbackAssistantId && fallbackAssistantId !== targetId) {
				fetchAssistant(fallbackAssistantId)
			}
		})
	}, [assistantId, fallbackAssistantId, locale, forceModelSelector])

	const handleSwitchAssistant = useCallback(
		(newAssistantId: string) => {
			if (!allowAssistantSwitch) return
			if (!window.$app?.openapi) return

			const agentClient = new Agent(window.$app.openapi)
			const loc = locale || 'en-us'
			agentClient.assistants.GetInfo(newAssistantId, loc).then((res: any) => {
				if (!window.$app.openapi.IsError(res)) {
					const data = window.$app.openapi.GetData(res)
					if (data?.connector) {
						setAssistant({
							id: data.assistant_id,
							name: data.name,
							avatar: data.avatar,
							description: data.description,
							connector: data.connector,
							connector_options: forceModelSelector
								? { ...data.connector_options, optional: true }
								: data.connector_options,
							modes: data.modes,
							default_mode: data.default_mode,
							sandbox: data.sandbox,
							computer_filter: data.computer_filter,
							placeholder: data.placeholder
						})
					}
					onAssistantChange?.(newAssistantId)
				}
			}).catch(() => {})
		},
		[allowAssistantSwitch, locale, forceModelSelector, onAssistantChange]
	)

	const containerClass = `${styles.taskChat} ${className || ''}`
	const resolvedAssistantId = assistant?.id || assistantId

	if (onSend) {
		return (
			<TaskChatCustom
				className={containerClass}
				style={style}
				assistant={assistant}
				messages={externalMessages}
				loading={externalLoading}
				streaming={externalStreaming}
				onSend={onSend}
				placeholder={placeholder}
				disabled={disabled}
				readOnly={readOnly}
				allowAssistantSwitch={allowAssistantSwitch}
				onSwitchAssistant={handleSwitchAssistant}
			/>
		)
	}

	return (
		<TaskChatWS
			className={containerClass}
			style={style}
			assistant={assistant}
			chatId={chatId}
			assistantId={resolvedAssistantId}
			columnId={columnId}
			placeholder={placeholder}
			disabled={disabled}
			readOnly={readOnly}
			initialWorkspace={initialWorkspace}
			onWorkspaceChange={onWorkspaceChange}
			allowAssistantSwitch={allowAssistantSwitch}
			onSwitchAssistant={handleSwitchAssistant}
			onMessagesChange={onMessagesChange}
		/>
	)
}

interface TaskChatWSProps {
	className?: string
	style?: React.CSSProperties
	assistant: AssistantInfo | null
	chatId: string
	assistantId: string
	columnId?: string
	placeholder?: React.ReactNode
	disabled?: boolean
	readOnly?: boolean
	initialWorkspace?: string
	onWorkspaceChange?: (id: string) => void
	allowAssistantSwitch: boolean
	onSwitchAssistant: (id: string) => void
	onMessagesChange?: (messages: Message[]) => void
}

const TaskChatWS: React.FC<TaskChatWSProps> = ({
	className,
	style,
	assistant,
	chatId,
	assistantId,
	columnId,
	placeholder,
	disabled,
	readOnly,
	initialWorkspace,
	onWorkspaceChange,
	allowAssistantSwitch,
	onSwitchAssistant,
	onMessagesChange
}) => {
	const { messages, streaming, hasMore, loadingMore, sendMessage, loadMore, abort } = useTaskWS({
		chatId,
		assistantId,
		columnId,
		workspaceId: initialWorkspace,
		enabled: true
	})
	const inputAreaRef = useRef<InputAreaHandle>(null)

	useEffect(() => {
		onMessagesChange?.(messages)
	}, [messages, onMessagesChange])

	const handleSend = useCallback(
		async (request: SendMessageRequest) => {
			const msg = request.messages?.[0]
			if (!msg) return
			sendMessage(msg, request.metadata)
		},
		[sendMessage]
	)

	const handleQuickPrompt = useCallback((text: string) => {
		inputAreaRef.current?.insertText(text)
	}, [])

	const isEmpty = messages.length === 0 && !streaming

	const renderPlaceholder = () => {
		if (placeholder) return placeholder
		return <Placeholder assistant={assistant} onQuickPrompt={handleQuickPrompt} />
	}

	return (
		<div className={className} style={style}>
			{isEmpty ? renderPlaceholder() : (
				<MessageList
					messages={messages}
					loading={false}
					streaming={streaming}
					hasMore={hasMore}
					loadingMore={loadingMore}
					onLoadMore={loadMore}
				/>
			)}
		{!readOnly && (
			<InputArea
				ref={inputAreaRef}
				assistant={assistant || undefined}
				onSend={handleSend}
				onAbort={abort}
				chatId={chatId}
				loading={streaming}
				streaming={streaming}
				disabled={disabled}
				initialWorkspace={initialWorkspace}
				onWorkspaceChange={onWorkspaceChange}
				workspaceLocked={messages.length > 0}
				onSwitchAssistant={allowAssistantSwitch ? onSwitchAssistant : undefined}
			/>
		)}
	</div>
)
}

interface TaskChatCustomProps {
	className?: string
	style?: React.CSSProperties
	assistant: AssistantInfo | null
	messages?: Message[]
	loading?: boolean
	streaming?: boolean
	onSend: (request: SendMessageRequest) => Promise<void>
	placeholder?: React.ReactNode
	disabled?: boolean
	readOnly?: boolean
	allowAssistantSwitch: boolean
	onSwitchAssistant: (id: string) => void
}

const TaskChatCustom: React.FC<TaskChatCustomProps> = ({
	className,
	style,
	assistant,
	messages: externalMessages,
	loading,
	streaming,
	onSend,
	placeholder,
	disabled,
	readOnly,
	allowAssistantSwitch,
	onSwitchAssistant
}) => {
	const msgs = externalMessages || []
	const isPlaceholder = msgs.length === 0 && !loading
	const inputAreaRef = useRef<InputAreaHandle>(null)

	const handleQuickPrompt = useCallback((text: string) => {
		inputAreaRef.current?.insertText(text)
	}, [])

	const renderPlaceholder = () => {
		if (placeholder) return placeholder
		return <Placeholder assistant={assistant} onQuickPrompt={handleQuickPrompt} />
	}

	return (
		<div className={className} style={style}>
			{isPlaceholder && renderPlaceholder()}
			{!isPlaceholder && <MessageList messages={msgs} loading={loading} streaming={streaming} />}
		{!readOnly && (
			<InputArea
				ref={inputAreaRef}
				assistant={assistant || undefined}
				onSend={onSend}
				loading={loading}
				streaming={streaming}
				disabled={disabled || loading}
				onSwitchAssistant={allowAssistantSwitch ? onSwitchAssistant : undefined}
			/>
		)}
		</div>
	)
}

export default TaskChat
