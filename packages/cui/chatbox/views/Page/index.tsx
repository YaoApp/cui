import React from 'react'
import styles from './index.less'
import type { IChatProps } from '../../types'
import { useChatContext } from '../../context'
import InputArea from '../../components/InputArea'
import MessageList from '../../components/MessageList'
import Header from '../../components/Header'

// Map local props to type
interface IPageProps extends IChatProps {
	title?: string
	headerMode?: 'tabs' | 'single' | 'custom'
}

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
		closeTab
	} = useChatContext()

	// Determine mode
	// Placeholder mode if:
	// 1. No tabs
	// 2. OR Active tab is New Chat (starts with 'new'), no messages, and NOT loading history
	// regardless of how many tabs are open.
	const isPlaceholderMode =
		tabs.length === 0 || (!!activeTabId && activeTabId.startsWith('new') && messages.length === 0 && !loading)

	const inputMode = isPlaceholderMode ? 'placeholder' : 'normal'

	// Show header only if there are tabs (in tabs mode) or forced single mode
	const showHeader = headerMode === 'tabs' ? tabs.length > 0 : true

	return (
		<div className={styles.container}>
			{/* Header */}
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

			{/* Message List - Render unless it's strictly placeholder mode */}
			{!isPlaceholderMode && <MessageList messages={messages} loading={loading} streaming={streaming} />}

			{/* Input Area */}
			<InputArea mode={inputMode} onSend={sendMessage} loading={streaming} onAbort={abort} />
		</div>
	)
}

export default Page
