import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getLocale } from '@umijs/max'
import type { Message } from '../../../openapi'
import type { SendMessageRequest } from '../../types'
import { Agent } from '../../../openapi/agent'
import { ChatProvider, useChatContext } from '../../context'
import MessageList from '../MessageList'
import InputArea from '../InputArea'
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
}

export interface TaskChatProps {
	chatId: string
	assistantId: string
	fallbackAssistantId?: string

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
	onFirstUserMessage?: (text: string, chatId: string) => void
}

const TaskChat: React.FC<TaskChatProps> = (props) => {
	const {
		chatId,
		assistantId,
		fallbackAssistantId,
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
		onMessagesChange,
		onFirstUserMessage
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
			computer_filter: data.computer_filter
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
							computer_filter: data.computer_filter
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
		<ChatProvider chatId={chatId} assistantId={resolvedAssistantId} singleSession>
			<TaskChatInner
				className={containerClass}
				style={style}
				assistant={assistant}
				placeholder={placeholder}
				disabled={disabled}
				readOnly={readOnly}
				initialWorkspace={initialWorkspace}
				onWorkspaceChange={onWorkspaceChange}
				allowAssistantSwitch={allowAssistantSwitch}
				onSwitchAssistant={handleSwitchAssistant}
				onMessagesChange={onMessagesChange}
				onFirstUserMessage={onFirstUserMessage}
				chatId={chatId}
			/>
		</ChatProvider>
	)
}

interface TaskChatInnerProps {
	className?: string
	style?: React.CSSProperties
	assistant: AssistantInfo | null
	placeholder?: React.ReactNode
	disabled?: boolean
	readOnly?: boolean
	initialWorkspace?: string
	onWorkspaceChange?: (id: string) => void
	allowAssistantSwitch: boolean
	onSwitchAssistant: (id: string) => void
	onMessagesChange?: (messages: Message[]) => void
	onFirstUserMessage?: (text: string, chatId: string) => void
	chatId?: string
}

const TaskChatInner: React.FC<TaskChatInnerProps> = ({
	className,
	style,
	assistant,
	placeholder,
	disabled,
	readOnly,
	initialWorkspace,
	onWorkspaceChange,
	allowAssistantSwitch,
	onSwitchAssistant,
	onMessagesChange,
	onFirstUserMessage,
	chatId
}) => {
	const ctx = useChatContext()
	const firstMessageFiredRef = useRef(false)

	const handleSwitchAssistant = useCallback(
		(newId: string) => {
			if (ctx?.activeTabId) {
				ctx.updateTabAssistant(ctx.activeTabId, newId)
			}
			onSwitchAssistant(newId)
		},
		[ctx?.activeTabId, ctx?.updateTabAssistant, onSwitchAssistant]
	)

	useEffect(() => {
		if (ctx?.messages) {
			onMessagesChange?.(ctx.messages)
		}
	}, [ctx?.messages, onMessagesChange])

	useEffect(() => {
		if (!onFirstUserMessage || firstMessageFiredRef.current) return
		if (!ctx?.messages?.length) return

		const firstUserMsg = ctx.messages.find((m) => m.type === 'user_input')
		if (!firstUserMsg) return

		firstMessageFiredRef.current = true
		const text = firstUserMsg.props?.content || ''
		onFirstUserMessage(text, chatId || ctx.activeTabId || '')
	}, [ctx?.messages, onFirstUserMessage, chatId, ctx?.activeTabId])

	if (!ctx) return null

	const { messages, loading, streaming, tokenUsage, activeTabId, activeTab, messageQueue, sendMessage, abort, queueMessage, sendQueuedMessage, cancelQueuedMessage } = ctx
	const isEmpty = messages.length === 0 && !loading

	return (
		<div className={className} style={style}>
			{isEmpty && placeholder ? placeholder : <MessageList messages={messages} loading={loading} streaming={streaming} />}
			{!readOnly && (
				<InputArea
					mode='normal'
					assistant={assistant || undefined}
					onSend={sendMessage}
					onAbort={abort}
					chatId={activeTabId || ''}
					loading={streaming}
					streaming={streaming}
					disabled={disabled}
					tokenUsage={tokenUsage}
					initialModel={activeTab?.lastConnector}
					initialWorkspace={initialWorkspace}
					onWorkspaceChange={onWorkspaceChange}
					workspaceLocked={messages.length > 0}
					initialChatMode={activeTab?.mode}
					messageQueue={messageQueue}
					onQueueMessage={queueMessage}
					onSendQueuedMessage={sendQueuedMessage}
					onCancelQueuedMessage={cancelQueuedMessage}
					onSwitchAssistant={allowAssistantSwitch ? handleSwitchAssistant : undefined}
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

	return (
		<div className={className} style={style}>
			{isPlaceholder && placeholder}
			{!isPlaceholder && <MessageList messages={msgs} loading={loading} streaming={streaming} />}
			{!readOnly && (
				<InputArea
					mode={isPlaceholder ? 'placeholder' : 'normal'}
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
