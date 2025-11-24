import React from 'react'
import styles from './index.less'
import type { IChatProps } from '../../types'
import { useChatContext } from '../../context'
import Chatbox from '../../components/Chatbox'
import Header from '../../components/Header'

// Map local props to type
interface IPageProps extends IChatProps {
	title?: string
	headerMode?: 'tabs' | 'single' | 'custom'
}

/**
 * Page 组件 - 聊天页面容器
 * 架构: Page -> Header + Chatbox (MessageList + InputArea)
 * 每个 Tab 对应一个独立的 Chatbox 实例
 */
const Page = (props: IPageProps) => {
	const { title, headerMode = 'tabs' } = props

	const {
		messages,
		sendMessage,
		loading,
		streaming,
		abort,
		createNewChat,
		tabs,
		activeTabId,
		activateTab,
		closeTab,
		assistant
	} = useChatContext()

	// 获取当前活跃 tab 的助手 ID
	const activeTab = tabs.find((t) => t.chatId === activeTabId)
	const currentAssistantId = activeTab?.assistantId

	// 显示 Header 的条件：
	// - tabs 模式：有 tabs 时显示
	// - single/custom 模式：始终显示
	const showHeader = headerMode === 'tabs' ? tabs.length > 0 : true

	// Chatbox 始终显示，即使没有 activeTabId
	// 当 activeTabId 为空时，Chatbox 会显示 Placeholder 模式
	// 用户可以直接输入开始新对话（sendMessage 会自动创建 tab）
	const showChatbox = true

	return (
		<div className={styles.container}>
			{/* Header - 管理 tabs 和导航 */}
			{showHeader && (
				<Header
					mode={headerMode}
					title={title || 'New Chat'}
					onNewChat={createNewChat}
					tabs={tabs}
					activeTabId={activeTabId}
					onTabChange={activateTab}
					onTabClose={closeTab}
					onHistoryClick={() => {
						// TODO: Toggle sidebar or show history modal
						console.log('History clicked')
					}}
					onSettingsClick={() => {
						// TODO: Show settings dropdown
						console.log('Settings clicked')
					}}
				/>
			)}

			{/* Chatbox - 独立的聊天实例，始终显示 */}
			{/* 当没有 activeTabId 时显示 placeholder 模式 */}
			{/* InputArea 的状态完全由其内部管理，切换 tab 时会因 chatId 变化而重置 */}
			{showChatbox && (
				<Chatbox
					messages={messages}
					loading={loading}
					streaming={streaming}
					chatId={activeTabId || ''} // 空字符串表示新对话
					assistantId={currentAssistantId}
					assistant={assistant}
					onSend={sendMessage}
					onAbort={abort}
				/>
			)}
		</div>
	)
}

export default Page
