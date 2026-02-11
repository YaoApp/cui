import React, { useState, useEffect, useCallback, useRef } from 'react'
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
	const containerRef = useRef<HTMLDivElement>(null)

	// History sidebar state
	const [historyOpen, setHistoryOpen] = useState(false)
	const [overlayMode, setOverlayMode] = useState(false)

	// Minimum width for push-pull mode (History width 280 + min chat width 400)
	const MIN_CONTAINER_WIDTH = 680

	// Monitor container width to determine overlay mode
	useEffect(() => {
		if (!containerRef.current) return

		const checkWidth = () => {
			if (containerRef.current) {
				const width = containerRef.current.offsetWidth
				setOverlayMode(width < MIN_CONTAINER_WIDTH)
			}
		}

		// Initial check
		checkWidth()

		const observer = new ResizeObserver(() => {
			checkWidth()
		})

		observer.observe(containerRef.current)
		return () => observer.disconnect()
	}, [])

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

	// Close other tabs (keep only the active one)
	const closeOtherTabs = useCallback(() => {
		tabs.forEach((tab) => {
			if (tab.chatId !== activeTabId) {
				closeTab(tab.chatId)
			}
		})
	}, [tabs, activeTabId, closeTab])

	// Close all tabs
	const closeAllTabs = useCallback(() => {
		tabs.forEach((tab) => {
			closeTab(tab.chatId)
		})
	}, [tabs, closeTab])

	// Handle history item selection
	// overlay 模式下自动关闭，push-pull 模式下保持打开
	const handleHistorySelect = useCallback(
		(chatId: string) => {
			loadHistory(chatId)
			if (overlayMode) {
				setHistoryOpen(false)
			}
		},
		[loadHistory, overlayMode]
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

			// Check if there's already an empty (isNew) tab with matching assistantId
			// If so, just activate it instead of creating a duplicate
			const existingNewTab = tabs.find(
				(tab) => tab.isNew && (!assistantId || tab.assistantId === assistantId)
			)
			if (existingNewTab) {
				activateTab(existingNewTab.chatId)
				return
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
	}, [createNewChat, activateTab, tabs, global])

	return (
		<div ref={containerRef} className={styles.container}>
			{/* History Sidebar - 推拉式或覆盖式历史记录 */}
			<History
				overlay={overlayMode}
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
						onCloseOthers={closeOtherTabs}
						onCloseAll={closeAllTabs}
						historyOpen={historyOpen}
						onHistoryClick={toggleHistory}
					/>
				)}

				{/* Chatbox - 独立的聊天实例，始终显示 */}
				{showChatbox && <Chatbox />}
			</div>
		</div>
	)
}

export default Page
