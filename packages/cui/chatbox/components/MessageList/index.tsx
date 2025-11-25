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
					const isUser =
						msg.props?.role === 'user' ||
						(msg.type === 'text' && index % 2 === 0 && !msg.props?.role) // Fallback logic for mock
					// In real app, check msg.props.role or specific type logic
					const role = msg.props?.role || (index % 2 === 0 ? 'user' : 'assistant')

					return (
						<div
							key={msg.id || index}
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
									{msg.props?.content || ''}
									{msg.delta && <span className={styles.cursor}>▋</span>}
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
