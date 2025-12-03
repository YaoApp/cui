import React from 'react'
import type { Message, UserMessage, ChatCompletionRequest, ConnectorOptions } from '../openapi'
import type { QueuedMessage } from './hooks/useChat'

/**
 * Send Message Request
 * Uses ChatCompletionRequest but omits assistant_id and chat_id which are controlled by useChat
 * Single message version (messages is a tuple of one UserMessage)
 */
export type SendMessageRequest = Omit<ChatCompletionRequest, 'assistant_id' | 'chat_id'> & {
	messages: [UserMessage]
}

/**
 * 聊天会话摘要 (用于 Sidebar 列表)
 */
export interface IChatSession {
	chat_id: string
	title: string
	last_message?: string
	updated_at: number // timestamp
	assistant_id?: string
	model?: string
}

/**
 * 打开的会话 Tab
 */
export interface ChatTab {
	chatId: string // 'new' | chat_id
	title: string
	assistantId?: string // Added assistantId
	streaming?: boolean // Is this tab currently streaming
}

/**
 * 组件通用的 Props 接口
 * 用于 Page 和 Widget 的顶层配置
 */
export interface IChatProps {
	/** 助手 ID */
	assistantId?: string
	/** 当前会话 ID */
	chatId?: string
	/** 样式类名 */
	className?: string
	/** 内联样式 */
	style?: React.CSSProperties
}

/**
 * 输入框组件 Props
 */
export interface IInputAreaProps {
	/** 当前模式 */
	mode: 'placeholder' | 'normal'
	/** 是否正在加载/发送中 */
	loading?: boolean
	/** 是否正在流式输出中 */
	streaming?: boolean
	/** 是否禁用 */
	disabled?: boolean
	/** 发送回调 - 接受 ChatCompletionRequest 的部分参数 (assistant_id 和 chat_id 由 useChat 控制) */
	onSend: (request: SendMessageRequest) => Promise<void>
	/** 取消/停止生成回调 */
	onAbort?: () => void
	/** 附件上传器 ID (可选) */
	uploader?: string
	/** 当前会话 ID (用于重置输入框) */
	chatId?: string
	/** Assistant Info */
	assistant?: {
		name: string
		id: string
		avatar?: string
		description?: string
		connector?: string
		connector_options?: ConnectorOptions
		modes?: string[]
		default_mode?: string
		// Deprecated fields (for backward compatibility)
		allowModelSelection?: boolean
		defaultModel?: string
	}
	/** Message Queue */
	messageQueue?: QueuedMessage[]
	/** Queue message callback */
	onQueueMessage?: (message: UserMessage, type: 'graceful' | 'force') => void
	/** Send queued message callback - queueId is ignored, always sends all messages */
	onSendQueuedMessage?: (queueId?: string, asForce?: boolean) => void
	/** Cancel queued message callback */
	onCancelQueuedMessage?: (queueId: string) => void
	className?: string
	style?: React.CSSProperties
}

/**
 * 消息列表组件 Props
 */
export interface IMessageListProps {
	/** 消息列表数据 */
	messages: Message[]
	/** 加载历史记录中 */
	loading?: boolean
	/** 正在流式输出中 */
	streaming?: boolean
	/** 样式类名 */
	className?: string
	/** 重试回调 */
	onRetry?: (messageId: string) => void
}

/**
 * 顶部栏组件 Props
 */
export interface IHeaderProps {
	mode: 'tabs' | 'single' | 'custom'
	title?: string
	/** Tabs 模式下的数据 */
	tabs?: ChatTab[]
	activeTabId?: string
	/** 切换 Tab 回调 */
	onTabChange?: (id: string) => void
	/** 关闭 Tab 回调 */
	onTabClose?: (id: string) => void
	/** 新建会话回调 */
	onNewChat?: () => void
	/** 历史记录回调 */
	onHistoryClick?: () => void
	/** 设置/更多回调 */
	onSettingsClick?: () => void
	className?: string
}
