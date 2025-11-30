import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import type { IMessageListProps } from '../../types'
import styles from './index.less'

const MessageList = (props: IMessageListProps) => {
	const { messages, loading, className } = props
	const bottomRef = useRef<HTMLDivElement>(null)

	// Auto scroll to bottom
	useEffect(() => {
		if (bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: 'smooth' })
		}
	}, [messages.length, messages[messages.length - 1]?.props?.content])

	return (
		<div className={clsx(styles.container, className)}>
			{loading && <div className={styles.loading}>Loading history...</div>}

			{!loading &&
				messages.map((msg, index) => {
					// Determine if message is from user based on type and role
					// user_input type is always from user
					const isUserInput = msg.type === 'user_input'
					const role = isUserInput ? 'user' : msg.props?.role || 'assistant'

					// For debugging: Show type and props for non-text assistant messages
					const isTextType = msg.type === 'text' || msg.type === 'user_input'
					const showDebugInfo = role === 'assistant' && !isTextType

					return (
						<div
							key={msg.ui_id || msg.message_id || msg.chunk_id || index}
							className={clsx(
								styles.messageRow,
								role === 'user' ? styles.userRow : styles.aiRow
							)}
						>
							<div className={styles.messageBubble}>
								{role !== 'user' && (
									<div className={styles.senderName}>{msg.props?.name || 'AI'}</div>
								)}
								<div className={styles.messageContent}>
									{showDebugInfo ? (
										// Debug view for non-text assistant messages
										<div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
											<div style={{ color: '#666', marginBottom: '4px' }}>
												<strong>Type:</strong> {msg.type}
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
												{JSON.stringify(msg.props, null, 2)}
											</pre>
										</div>
									) : (
										// Normal text view
										<>
											{msg.props?.content || ''}
											{msg.delta && (
												<span className={styles.cursor}>▋</span>
											)}
										</>
									)}
								</div>
							</div>
						</div>
					)
				})}
			<div ref={bottomRef} />
		</div>
	)
}

export default MessageList
