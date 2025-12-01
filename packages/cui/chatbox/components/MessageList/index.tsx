import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import type { IMessageListProps } from '../../types'
import styles from './index.less'

const MessageList = (props: IMessageListProps) => {
	const { messages, loading, className } = props
	const bottomRef = useRef<HTMLDivElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const lastMessageRef = useRef<HTMLDivElement | null>(null)
	const shouldAutoScroll = useRef(true)
	const lastScrollTop = useRef(0)

	const handleScroll = () => {
		if (!containerRef.current) return
		const { scrollTop, scrollHeight, clientHeight } = containerRef.current
		// Since we have a large spacer, "at bottom" means we are close to the spacer's top?
		// No, scrollHeight includes the spacer.
		// If we just check relative movement, it's safer.

		if (scrollTop < lastScrollTop.current) {
			shouldAutoScroll.current = false
		}

		// If user scrolled to bottom (or very close), re-enable auto-scroll
		const isAtBottom = scrollHeight - scrollTop - clientHeight <= 100
		if (isAtBottom) {
			shouldAutoScroll.current = true
		}

		lastScrollTop.current = scrollTop
	}

	// Auto scroll to bottom
	useEffect(() => {
		const lastMsg = messages[messages.length - 1]
		const isUserInput = lastMsg?.type === 'user_input'

		if (isUserInput) {
			// User sent a message: "Clear Screen" effect
			// Scroll the user message to the TOP of the view
			shouldAutoScroll.current = true
			if (lastMessageRef.current) {
				lastMessageRef.current.scrollIntoView({ behavior: 'auto', block: 'start' })
			}
		} else if (shouldAutoScroll.current && bottomRef.current) {
			// AI is typing: Keep content visible
			// Use 'nearest' to only scroll if the new content pushes the bottom out of view
			// This prevents forcing the content to the bottom if there is still space
			bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
		}
	}, [messages.length, messages[messages.length - 1]?.props?.content])

	return (
		<div ref={containerRef} className={clsx(styles.container, className)} onScroll={handleScroll}>
			{loading && <div className={styles.loading}>Loading history...</div>}

			{!loading &&
				messages.map((msg, index) => {
					// Determine if message is from user based on type and role
					// user_input type is always from user
					const isUserInput = msg.type === 'user_input'
					const role = isUserInput ? 'user' : msg.props?.role || 'assistant'
					const isLast = index === messages.length - 1

					// For debugging: Show type and props for non-text assistant messages
					const isTextType = msg.type === 'text' || msg.type === 'user_input'
					const showDebugInfo = role === 'assistant' && !isTextType

					return (
						<div
							key={msg.ui_id || msg.message_id || msg.chunk_id || index}
							ref={isLast ? lastMessageRef : null}
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
			<div style={{ height: '85vh', flexShrink: 0 }} />
		</div>
	)
}

export default MessageList
