import React, { useEffect, useRef } from 'react'
import type { Message as CUIMessage } from '@/openapi/chat/types'
import type { InteractDoneData } from '@/openapi/agent/robot/types'
import { Loading, Thinking, Text, ToolCall, Error as ErrorMsg, Custom } from '@/chatbox/messages'
import InteractResultCard from './InteractResultCard'
import styles from './index.less'

interface DrawerMessageListProps {
	messages: CUIMessage[]
	streaming: boolean
	interactResult?: InteractDoneData | null
}

const DrawerMessageList: React.FC<DrawerMessageListProps> = ({ messages, streaming, interactResult }) => {
	const bottomRef = useRef<HTMLDivElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const shouldAutoScroll = useRef(true)
	const lastScrollTop = useRef(0)

	const handleScroll = () => {
		if (!containerRef.current) return
		const { scrollTop, scrollHeight, clientHeight } = containerRef.current
		if (scrollTop < lastScrollTop.current) {
			shouldAutoScroll.current = false
		}
		const isAtBottom = scrollHeight - scrollTop - clientHeight <= 80
		if (isAtBottom) {
			shouldAutoScroll.current = true
		}
		lastScrollTop.current = scrollTop
	}

	useEffect(() => {
		const lastMsg = messages[messages.length - 1]
		const isUserInput = lastMsg?.type === 'user_input'

		if (isUserInput) {
			shouldAutoScroll.current = true
		}

		if (shouldAutoScroll.current && bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: isUserInput ? 'auto' : 'smooth', block: 'nearest' })
		}
	}, [messages.length, messages[messages.length - 1]?.props?.content])

	useEffect(() => {
		if (interactResult && shouldAutoScroll.current && bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
		}
	}, [interactResult])

	const lastMsg = messages[messages.length - 1]
	const showPendingLoading = lastMsg?.type === 'user_input' && streaming

	const renderContent = (msg: CUIMessage, isGenerating: boolean) => {
		switch (msg.type) {
			case 'loading':
				return <Loading message={msg as any} />
			case 'thinking':
				return <Thinking message={msg as any} loading={isGenerating} />
			case 'text':
				return <Text message={msg as any} />
			case 'tool_call':
				return <ToolCall message={msg as any} loading={isGenerating} />
			case 'error':
				return <ErrorMsg message={msg as any} />
			default:
				return <Custom message={msg as any} />
		}
	}

	return (
		<div ref={containerRef} className={styles.drawerMessageList} onScroll={handleScroll}>
			{messages.map((msg, index) => {
				const isUserInput = msg.type === 'user_input'
				const isLast = index === messages.length - 1
				const isGenerating = streaming && isLast && !isUserInput

				if (isUserInput) {
					const content = msg.props?.content
					const text = typeof content === 'string' ? content : Array.isArray(content)
						? content.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
						: ''

					return (
						<div
							key={msg.ui_id || msg.message_id || index}
							className={`${styles.drawerMsg} ${styles.drawerMsgUser}`}
						>
							<div className={styles.drawerBubbleUser}>{text}</div>
						</div>
					)
				}

				return (
					<div
						key={msg.ui_id || msg.message_id || index}
						className={`${styles.drawerMsg} ${styles.drawerMsgAgent}`}
					>
						<div className={styles.drawerBubbleAgent}>
							{renderContent(msg, isGenerating)}
							{isGenerating && (
								<div className={styles.drawerInlineLoading}>
									<span className={styles.drawerDot} />
									<span className={styles.drawerDot} />
									<span className={styles.drawerDot} />
								</div>
							)}
						</div>
					</div>
				)
			})}

			{showPendingLoading && (
				<div className={`${styles.drawerMsg} ${styles.drawerMsgAgent}`}>
					<div className={styles.drawerBubbleAgent}>
						<div className={styles.drawerInlineLoading}>
							<span className={styles.drawerDot} />
							<span className={styles.drawerDot} />
							<span className={styles.drawerDot} />
						</div>
					</div>
				</div>
			)}

			{interactResult && <InteractResultCard data={interactResult} />}

			<div ref={bottomRef} />
			<div style={{ height: 20, flexShrink: 0 }} />
		</div>
	)
}

export default DrawerMessageList
