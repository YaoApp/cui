import React, { useRef, useCallback } from 'react'
import styles from './index.less'
import MessageList from '../MessageList'
import InputArea from '../InputArea'
import Placeholder from './Placeholder'
import { useChatContext } from '../../context'
import type { InputAreaHandle } from '../../types'

export interface IChatboxProps {
	className?: string
	style?: React.CSSProperties
	disabled?: boolean
}

const Chatbox: React.FC<IChatboxProps> = (props) => {
	const { className, style, disabled } = props
	const inputAreaRef = useRef<InputAreaHandle>(null)

	const chatContext = useChatContext()
	if (!chatContext) {
		return null
	}

	const {
		messages,
		loading,
		streaming,
		tokenUsage,
		activeTab,
		activeTabId,
		assistant,
		messageQueue,
		hasMore,
		loadingMore,
		sendMessage,
		abort,
		loadMore,
		queueMessage,
		sendQueuedMessage,
		cancelQueuedMessage,
		updateTabAssistant,
		updateTabWorkspace
	} = chatContext

	const isPlaceholderMode = messages.length === 0 && !loading

	const handleQuickPrompt = useCallback((text: string) => {
		inputAreaRef.current?.insertText(text)
	}, [])

	return (
		<div className={`${styles.chatbox} ${className || ''}`} style={style}>
			{isPlaceholderMode ? (
				<Placeholder assistant={assistant} onQuickPrompt={handleQuickPrompt} />
			) : (
				<MessageList
					messages={messages}
					loading={loading}
					streaming={streaming}
					hasMore={hasMore}
					loadingMore={loadingMore}
					onLoadMore={loadMore}
					chatId={activeTabId}
				/>
			)}

			<InputArea
				ref={inputAreaRef}
				onSend={sendMessage}
				loading={streaming}
				streaming={streaming}
				disabled={disabled}
				tokenUsage={tokenUsage}
				onAbort={abort}
				chatId={activeTabId || ''}
				assistant={assistant}
				initialModel={activeTab?.lastConnector}
				initialWorkspace={activeTab?.lastWorkspace}
				onWorkspaceChange={activeTabId ? (ws: string) => updateTabWorkspace(activeTabId, ws) : undefined}
				workspaceLocked={messages.length > 0}
				initialChatMode={activeTab?.mode}
				messageQueue={messageQueue}
				onQueueMessage={queueMessage}
				onSendQueuedMessage={sendQueuedMessage}
				onCancelQueuedMessage={cancelQueuedMessage}
				onSwitchAssistant={activeTabId ? (assistantId: string) => updateTabAssistant(activeTabId, assistantId) : undefined}
			/>
		</div>
	)
}

export default Chatbox
