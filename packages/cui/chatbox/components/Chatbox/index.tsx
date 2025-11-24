import React from 'react'
import styles from './index.less'
import MessageList from '../MessageList'
import InputArea from '../InputArea'
import type { Message, ChatMessage } from '../../openapi'
import type { QueuedMessage } from '../../hooks/useChat'

export interface IChatboxProps {
	/** 消息列表 */
	messages: Message[]
	/** 是否正在加载历史 */
	loading?: boolean
	/** 是否正在流式输出 */
	streaming?: boolean
	/** 当前会话 ID */
	chatId: string
	/** 当前助手 ID */
	assistantId?: string
	/** 助手信息 */
	assistant?: {
		name: string
		id: string
		avatar?: string
		description?: string
		allowModelSelection?: boolean
		defaultModel?: string
	}
	/** 消息队列 */
	messageQueue?: QueuedMessage[]
	/** 发送消息回调 */
	onSend: (message: ChatMessage) => Promise<void>
	/** 取消/停止生成回调 */
	onAbort?: () => void
	/** 队列消息回调 */
	onQueueMessage?: (message: ChatMessage, type: 'graceful' | 'force') => void
	/** 发送队列消息回调 */
	onSendQueuedMessage?: (queueId: string, asForce?: boolean) => void
	/** 取消队列消息回调 */
	onCancelQueuedMessage?: (queueId: string) => void
	/** 样式类名 */
	className?: string
	/** 内联样式 */
	style?: React.CSSProperties
}

/**
 * Chatbox 组件 - 独立的聊天实例
 * 包含 MessageList 和 InputArea
 * 每个 Tab 对应一个 Chatbox 实例
 * 
 * 重要：InputArea 的状态完全由其内部管理（通过 editorRef）
 * 当 chatId 变化时，InputArea 会自动重置（清空输入）
 */
const Chatbox: React.FC<IChatboxProps> = (props) => {
	const {
		messages,
		loading,
		streaming,
		chatId,
		assistantId,
		assistant,
		messageQueue,
		onSend,
		onAbort,
		onQueueMessage,
		onSendQueuedMessage,
		onCancelQueuedMessage,
		className,
		style
	} = props

	// 判断是否为占位符模式
	// 当消息列表为空且不在加载历史时，显示占位符模式
	const isPlaceholderMode = messages.length === 0 && !loading
	const inputMode = isPlaceholderMode ? 'placeholder' : 'normal'

	return (
		<div className={`${styles.chatbox} ${className || ''}`} style={style}>
			{/* Message List - 只在非占位符模式下显示 */}
			{!isPlaceholderMode && (
				<MessageList 
					messages={messages} 
					loading={loading} 
					streaming={streaming} 
				/>
			)}

			{/* Input Area - 始终显示，状态由其内部管理 */}
			<InputArea
				mode={inputMode}
				onSend={onSend}
				loading={streaming}
				streaming={streaming}
				onAbort={onAbort}
				chatId={chatId}
				assistant={assistant}
				messageQueue={messageQueue}
				onQueueMessage={onQueueMessage}
				onSendQueuedMessage={onSendQueuedMessage}
				onCancelQueuedMessage={onCancelQueuedMessage}
			/>
		</div>
	)
}

export default Chatbox

