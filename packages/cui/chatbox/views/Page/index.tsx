import React, { useEffect } from 'react'
import styles from './index.less'
import type { IChatProps } from '../../types'
import { useChatContext } from '../../context'
import Chatbox from '../../components/Chatbox'
import Header from '../../components/Header'
import { useGlobal } from '@/context/app'
import type { App } from '@/types'

// Map local props to type
interface IPageProps extends IChatProps {
	title?: string
	headerMode?: 'tabs' | 'single' | 'custom'
}

/**
 * Page 组件 - 聊天页面容器
 * 架构: Page -> Header + Chatbox (MessageList + InputArea)
 * 每个 Tab 对应一个独立的 Chatbox 实例
 *
 * 优化后：Page 只关注页面级别的布局和全局事件
 * Chatbox 内部自行管理聊天业务逻辑，通过 Context 获取状态
 */
const Page = (props: IPageProps) => {
	const { title, headerMode = 'tabs' } = props

	const global = useGlobal()

	// Page 只需要关注 Header 相关的状态和方法
	const chatContext = useChatContext()
	
	// Wait for ChatProvider to be ready
	if (!chatContext) {
		return null
	}
	
	const { createNewChat, tabs, activeTabId, activateTab, closeTab } = chatContext

	// 显示 Header 的条件：
	// - tabs 模式：有 tabs 时显示
	// - single/custom 模式：始终显示
	const showHeader = headerMode === 'tabs' ? tabs.length > 0 : true

	// Chatbox 始终显示，即使没有 activeTabId
	// 当 activeTabId 为空时，Chatbox 会显示 Placeholder 模式
	// 用户可以直接输入开始新对话（sendMessage 会自动创建 tab）
	const showChatbox = true

	// Register global event listener for creating new chat with assistant
	useEffect(() => {
		const handleNewChatWithAssistant = (assistantId?: string) => {
			// If sidebar is maximized, switch to normal mode to show chat window
			// Sidebar will stay open but won't block the chat area
			if (global.sidebar_maximized) {
				window.$app.Event.emit('app/openSidebar', { forceNormal: true })
			}

			// Create new chat with specified assistant ID
			createNewChat(assistantId)
		}

		// Register event
		if (window.$app?.Event) {
			window.$app.Event.on('chat/newWithAssistant', handleNewChatWithAssistant)
		}

		// Cleanup
		return () => {
			if (window.$app?.Event) {
				window.$app.Event.off('chat/newWithAssistant', handleNewChatWithAssistant)
			}
		}
	}, [createNewChat, global])

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
			{/* Chatbox 内部直接从 Context 获取状态，无需通过 props 传递 */}
			{showChatbox && <Chatbox />}
		</div>
	)
}

export default Page
