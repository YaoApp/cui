import React, { useState, useEffect, useCallback } from 'react'
import styles from './index.less'
import type { IChatProps } from '../../types'
import { useChatContext } from '../../context'
import Chatbox from '../../components/Chatbox'
import Header from '../../components/Header'
import History from '../../components/History'
import { useGlobal } from '@/context/app'
import type { App } from '@/types'

// Map local props to type
interface IPageProps extends IChatProps {
	title?: string
	headerMode?: 'tabs' | 'single' | 'custom'
}

/**
 * Page 组件 - 聊天页面容器
 * 架构: Page -> History + Header + Chatbox (MessageList + InputArea)
 * 每个 Tab 对应一个独立的 Chatbox 实例
 *
 * 优化后：Page 只关注页面级别的布局和全局事件
 * Chatbox 内部自行管理聊天业务逻辑，通过 Context 获取状态
 */
const Page = (props: IPageProps) => {
	const { title, headerMode = 'tabs' } = props

	const global = useGlobal()

	// History sidebar state
	const [historyOpen, setHistoryOpen] = useState(false)

	// Page 只需要关注 Header 相关的状态和方法
	const chatContext = useChatContext()

	// Wait for ChatProvider to be ready
	if (!chatContext) {
		return null
	}

	const { createNewChat, tabs, activeTabId, activateTab, closeTab, loadHistory } = chatContext

	// Toggle history sidebar
	const toggleHistory = useCallback(() => {
		setHistoryOpen((prev) => !prev)
	}, [])

	// Handle history item selection
	// 不自动关闭菜单，让用户自己决定何时关闭
	const handleHistorySelect = useCallback(
		(chatId: string) => {
			loadHistory(chatId)
		},
		[loadHistory]
	)

	// 显示 Header 的条件：
	// - single 模式：不显示 tabs header
	// - tabs/custom 模式：始终显示
	const showHeader = headerMode !== 'single'

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
			{/* History Sidebar - 左侧推拉式历史记录 */}
			<History
				open={historyOpen}
				activeTabId={activeTabId}
				onSelect={handleHistorySelect}
				onDelete={closeTab}
				onClose={() => setHistoryOpen(false)}
			/>

			{/* Main Content Area */}
			<div className={styles.main}>
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
						historyOpen={historyOpen}
						onHistoryClick={toggleHistory}
						onSettingsClick={() => {
							// TODO: Show settings dropdown
							console.log('Settings clicked')
						}}
					/>
				)}

				{/* Chatbox - 独立的聊天实例，始终显示 */}
				{showChatbox && <Chatbox />}
			</div>
		</div>
	)
}

export default Page
