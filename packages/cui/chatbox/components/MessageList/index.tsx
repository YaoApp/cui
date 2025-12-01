import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import type { IMessageListProps } from '../../types'
import Loading from './Loading'
import UserMessage from './UserMessage'
import AIMessage from './AIMessage'
import styles from './index.less'

const MessageList = (props: IMessageListProps) => {
	const { messages, loading, className, streaming } = props
	const bottomRef = useRef<HTMLDivElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const lastMessageRef = useRef<HTMLDivElement | null>(null)
	const shouldAutoScroll = useRef(true)
	const lastScrollTop = useRef(0)

	const handleScroll = () => {
		if (!containerRef.current) return
		const { scrollTop, scrollHeight, clientHeight } = containerRef.current

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
			bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
		}
	}, [messages.length, messages[messages.length - 1]?.props?.content])

	// Logic to show loading:
	// 1. When receiving user message, before first reply arrives -> Show Loading component
	//    This happens when the last message is from the user and we are streaming (waiting for response).
	const lastMsg = messages[messages.length - 1]
	const lastIsUser = lastMsg?.type === 'user_input'
	const showPendingLoading = lastIsUser && streaming

	return (
		<div ref={containerRef} className={clsx(styles.container, className)} onScroll={handleScroll}>
			{loading && <div className={styles.loading}>Loading history...</div>}

			{!loading &&
				messages.map((msg, index) => {
					// Determine if message is from user based on type and role
					const isUserInput = msg.type === 'user_input'
					const role = isUserInput ? 'user' : msg.props?.role || 'assistant'
					const isLast = index === messages.length - 1

					// Determine if this specific AI message is loading (streaming/generating)
					// Rule 3: Assistant message shows loading below it until completion (streaming ends)
					// We use the streaming prop which reflects the global chat state.
					const isGenerating = streaming && isLast && role !== 'user'

					return (
						<div
							key={msg.ui_id || msg.message_id || msg.chunk_id || index}
							ref={isLast ? lastMessageRef : null}
							className={styles.messageRow} // Re-apply messageRow class for scroll-margin
							style={{ justifyContent: role === 'user' ? 'flex-end' : 'flex-start' }}
						>
							{role === 'user' ? (
								<UserMessage message={msg} isLast={isLast} />
							) : (
								<AIMessage message={msg} loading={isGenerating} />
							)}
						</div>
					)
				})}

			{/* Rule 1: Show separate Loading component if waiting for first reply */}
			{showPendingLoading && <Loading />}

			<div ref={bottomRef} />
			<div style={{ height: '85vh', flexShrink: 0 }} />
		</div>
	)
}

export default MessageList
