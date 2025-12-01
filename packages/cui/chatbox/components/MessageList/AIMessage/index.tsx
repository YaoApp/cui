import React from 'react'
import clsx from 'clsx'
import type { Message } from '../../../../openapi'
import UserAvatar from '../../../../widgets/UserAvatar'
import styles from './index.less'

interface IAIMessageProps {
	message: Message
	loading?: boolean // Is this message still generating?
}

const AIMessage = ({ message, loading }: IAIMessageProps) => {
	const isTextType = message.type === 'text' || !message.type
	const showDebugInfo = !isTextType

	// Get assistant info from message
	const assistant = (message as any).assistant
	const avatarData = assistant
		? {
				id: assistant.assistant_id || '',
				avatar: assistant.avatar,
				name: assistant.name || 'AI'
		  }
		: null

	return (
		<div className={clsx(styles.aiRow)}>
			<div className={styles.messageBubble}>
				{/* Show header (avatar + name) only if assistant info is present */}
				{avatarData && (
					<div className={styles.messageHeader}>
						<UserAvatar size='sm' shape='circle' data={avatarData} />
						<div className={styles.senderName}>{assistant.name || 'AI'}</div>
					</div>
				)}

				<div className={styles.messageContent}>
					{showDebugInfo ? (
						// Debug view for non-text assistant messages
						<div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
							<div style={{ color: '#666', marginBottom: '4px' }}>
								<strong>Type:</strong> {message.type}
							</div>
							<div style={{ color: '#666' }}>
								<strong>Props:</strong>
							</div>
							<pre
								style={{
									background: '#f5f5f5',
									padding: '8px',
									borderRadius: '4px',
									overflow: 'auto',
									maxWidth: '100%'
								}}
							>
								{JSON.stringify(message.props, null, 2)}
							</pre>
						</div>
					) : (
						// Normal text view
						<>{message.props?.content || ''}</>
					)}

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
