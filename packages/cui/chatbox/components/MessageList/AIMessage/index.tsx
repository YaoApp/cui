import React from 'react'
import clsx from 'clsx'
import type { Message } from '../../../../openapi'
import UserAvatar from '../../../../widgets/UserAvatar'
import { Loading, Thinking, Text, ToolCall, Action, Image, Audio, Video, Custom, Error } from '../../../messages'
import styles from './index.less'

interface IAIMessageProps {
	message: Message
	loading?: boolean // Is this message still generating?
}

const AIMessage = ({ message, loading }: IAIMessageProps) => {
	// Get assistant info from message props (for history messages) or message.assistant (for streaming)
	const props = message.props || {}
	const assistant = (message as any).assistant
	const hasAssistantInfo = assistant || props.assistant_name || props.assistant_avatar

	const avatarData = hasAssistantInfo
		? {
				id: assistant?.assistant_id || '',
				avatar: assistant?.avatar || props.assistant_avatar,
				name: assistant?.name || props.assistant_name || 'AI'
		  }
		: null

	// Render message content based on type
	const renderContent = () => {
		switch (message.type) {
			case 'loading':
				return <Loading message={message as any} />
			case 'thinking':
				return <Thinking message={message as any} loading={loading} />
			case 'text':
				return <Text message={message as any} />
			case 'tool_call':
				return <ToolCall message={message as any} loading={loading} />
			case 'error':
				return <Error message={message as any} />
			case 'action':
				return <Action message={message as any} />
			case 'image':
				return <Image message={message as any} />
			case 'audio':
				return <Audio message={message as any} />
			case 'video':
				return <Video message={message as any} />
			default:
				// For custom types or unknown types
				return <Custom message={message as any} />
		}
	}

	return (
		<div className={clsx(styles.aiRow)}>
			<div className={styles.messageBubble}>
				{/* Show header (avatar + name) only if assistant info is present */}
				{avatarData && (
					<div className={styles.messageHeader}>
						<UserAvatar size='sm' shape='circle' data={avatarData} />
						<div className={styles.senderName}>{avatarData.name}</div>
					</div>
				)}

				<div className={styles.messageContent}>
					{renderContent()}

					{/* Loading indicator below message content while generating */}
					{loading && (
						<div className={styles.inlineLoading}>
							<span className={styles.dot}></span>
							<span className={styles.dot}></span>
							<span className={styles.dot}></span>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default AIMessage
