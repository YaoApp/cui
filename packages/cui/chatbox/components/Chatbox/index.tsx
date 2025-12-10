import React from 'react'
import styles from './index.less'
import MessageList from '../MessageList'
import InputArea from '../InputArea'
import { useChatContext } from '../../context'

export interface IChatboxProps {
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
 * 优化：直接从 Context 获取状态和方法，减少 props drilling
 * Page 组件不再需要关注 Chatbox 内部的业务逻辑
 *
 * 重要：InputArea 的状态完全由其内部管理（通过 editorRef）
 * 当 chatId 变化时，InputArea 会自动重置（清空输入）
 */
const Chatbox: React.FC<IChatboxProps> = (props) => {
	const { className, style } = props

	// 直接从 Context 获取所需的状态和方法
	const chatContext = useChatContext()

	// Wait for ChatProvider to be ready
	if (!chatContext) {
		return null
	}

	const {
		messages,
		loading,
		streaming,
		activeTab,
		activeTabId,
		assistant,
		messageQueue,
		sendMessage,
		abort,
		queueMessage,
		sendQueuedMessage,
		cancelQueuedMessage
	} = chatContext

	// 判断是否为占位符模式
	// 当消息列表为空且不在加载历史时，显示占位符模式
	const isPlaceholderMode = messages.length === 0 && !loading
	const inputMode = isPlaceholderMode ? 'placeholder' : 'normal'

	return (
		<div className={`${styles.chatbox} ${className || ''}`} style={style}>
			{/* Message List - 只在非占位符模式下显示 */}
			{!isPlaceholderMode && <MessageList messages={messages} loading={loading} streaming={streaming} />}

			{/* Input Area - 始终显示，状态由其内部管理 */}
			{/* 
				注意：这里传入的 chatId 实际上就是 activeTabId
				每个 Tab 对应一个独立的聊天会话，Tab.chatId 就是聊天会话的唯一标识
				InputArea 使用 chatId 作为 effect 依赖，切换 Tab 时会自动重置输入状态
			*/}
			<InputArea
				mode={inputMode}
				onSend={sendMessage}
				loading={streaming}
				streaming={streaming}
				onAbort={abort}
				chatId={activeTabId || ''}
				assistant={assistant}
				initialModel={activeTab?.lastConnector}
				initialChatMode={activeTab?.mode}
				messageQueue={messageQueue}
				onQueueMessage={queueMessage}
				onSendQueuedMessage={sendQueuedMessage}
				onCancelQueuedMessage={cancelQueuedMessage}
			/>
		</div>
	)
}

export default Chatbox
