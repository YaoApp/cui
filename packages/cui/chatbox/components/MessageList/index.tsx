import React, { useEffect, useRef, useCallback } from 'react'
import clsx from 'clsx'
import type { IMessageListProps } from '../../types'
import Loading from './Loading'
import UserMessage from './UserMessage'
import AIMessage from './AIMessage'
import styles from './index.less'

const ONE_HOUR_MS = 60 * 60 * 1000

function getMessageTimestamp(msg: any): number | undefined {
	return msg.metadata?.timestamp || msg.created_at
}

function shouldShowTimeSeparator(prevMsg: any, currentMsg: any): boolean {
	if (!prevMsg) return true
	const prevTs = getMessageTimestamp(prevMsg)
	const currTs = getMessageTimestamp(currentMsg)
	if (!prevTs || !currTs) return false
	return Math.abs(currTs - prevTs) > ONE_HOUR_MS
}

function formatTimeSeparator(timestamp: number): string {
	const date = new Date(timestamp)
	const now = new Date()
	const hours = date.getHours().toString().padStart(2, '0')
	const minutes = date.getMinutes().toString().padStart(2, '0')
	const time = `${hours}:${minutes}`

	const isToday = date.toDateString() === now.toDateString()
	if (isToday) return time

	const yesterday = new Date(now)
	yesterday.setDate(yesterday.getDate() - 1)
	if (date.toDateString() === yesterday.toDateString()) return `昨天 ${time}`

	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const day = date.getDate().toString().padStart(2, '0')

	if (date.getFullYear() !== now.getFullYear()) {
		return `${date.getFullYear()}-${month}-${day} ${time}`
	}
	return `${month}-${day} ${time}`
}

const MessageList = (props: IMessageListProps) => {
	const { messages, loading, className, streaming, hasMore, loadingMore, onLoadMore } = props
	const bottomRef = useRef<HTMLDivElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const lastMessageRef = useRef<HTMLDivElement | null>(null)
	const shouldAutoScroll = useRef(true)
	const lastScrollTop = useRef(0)
	const loadMoreSentinelRef = useRef<HTMLDivElement>(null)
	const onLoadMoreRef = useRef(onLoadMore)
	const loadingMoreRef = useRef(loadingMore)
	onLoadMoreRef.current = onLoadMore
	loadingMoreRef.current = loadingMore

	const handleScroll = useCallback(() => {
		if (!containerRef.current) return
		const { scrollTop, scrollHeight, clientHeight } = containerRef.current

		if (scrollTop < lastScrollTop.current) {
			shouldAutoScroll.current = false
		}

		const isAtBottom = scrollHeight - scrollTop - clientHeight <= 100
		if (isAtBottom) {
			shouldAutoScroll.current = true
		}

		lastScrollTop.current = scrollTop
	}, [])

	// Auto scroll to bottom
	useEffect(() => {
		const lastMsg = messages[messages.length - 1]
		const isUserInput = lastMsg?.type === 'user_input'

		if (isUserInput) {
			shouldAutoScroll.current = true
			if (lastMessageRef.current) {
				lastMessageRef.current.scrollIntoView({ behavior: 'auto', block: 'start' })
			}
		} else if (shouldAutoScroll.current && bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
		}
	}, [messages.length, messages[messages.length - 1]?.props?.content])

	// Scroll position retention after loadMore prepend
	const prevScrollHeightRef = useRef(0)
	const prevScrollTopRef = useRef(0)
	const wasLoadingMoreRef = useRef(false)

	useEffect(() => {
		if (loadingMore && containerRef.current) {
			prevScrollHeightRef.current = containerRef.current.scrollHeight
			prevScrollTopRef.current = containerRef.current.scrollTop
			wasLoadingMoreRef.current = true
		}
	}, [loadingMore])

	useEffect(() => {
		if (wasLoadingMoreRef.current && !loadingMore && containerRef.current) {
			const container = containerRef.current
			requestAnimationFrame(() => {
				container.scrollTop = container.scrollHeight - prevScrollHeightRef.current + prevScrollTopRef.current
			})
			wasLoadingMoreRef.current = false
		}
	}, [loadingMore, messages.length])

	// IntersectionObserver for loadMore trigger
	useEffect(() => {
		if (!hasMore || !loadMoreSentinelRef.current) return
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !loadingMoreRef.current) {
					onLoadMoreRef.current?.()
				}
			},
			{ root: containerRef.current, threshold: 0.1 }
		)
		observer.observe(loadMoreSentinelRef.current)
		return () => observer.disconnect()
	}, [hasMore])

	const lastMsg = messages[messages.length - 1]
	const lastIsUser = lastMsg?.type === 'user_input'
	const showPendingLoading = lastIsUser && streaming

	return (
		<div ref={containerRef} className={clsx(styles.container, className)} onScroll={handleScroll}>
			{/* LoadMore trigger at top */}
			{hasMore && (
				<div ref={loadMoreSentinelRef} className={styles.loadMoreTrigger}>
					{loadingMore ? <Loading /> : null}
				</div>
			)}

			{loading && <div className={styles.loading}>Loading history...</div>}

			{!loading &&
				(() => {
					let lastAssistantId: string | undefined = undefined
					return messages.map((msg, index) => {
						const isUserInput = msg.type === 'user_input'
						const role = isUserInput ? 'user' : msg.props?.role || 'assistant'
						const isLast = index === messages.length - 1
						const isGenerating = streaming && isLast && role !== 'user'

						// Time separator
						const prevMsg = messages[index - 1]
						const showTimeSep = shouldShowTimeSeparator(prevMsg, msg)
						const currentTs = getMessageTimestamp(msg)

						// Avatar dedup: consecutive same assistant hides header
						if (isUserInput) {
							lastAssistantId = undefined
						}
						const assistant = (msg as any).assistant
						const showHeader = !!(assistant && assistant.assistant_id !== lastAssistantId)
						if (assistant?.assistant_id) lastAssistantId = assistant.assistant_id

						return (
							<React.Fragment key={msg.ui_id || msg.message_id || msg.chunk_id || index}>
								{showTimeSep && currentTs && (
									<div className={styles.timeSeparator}>
										{formatTimeSeparator(currentTs)}
									</div>
								)}
								<div
									ref={isLast ? lastMessageRef : null}
									className={styles.messageRow}
									style={{ justifyContent: role === 'user' ? 'flex-end' : 'flex-start' }}
								>
									{role === 'user' ? (
										<UserMessage message={msg} isLast={isLast} />
									) : (
										<AIMessage message={msg} loading={isGenerating} showHeader={showHeader} />
									)}
								</div>
							</React.Fragment>
						)
					})
				})()}

			{showPendingLoading && <Loading />}

			<div ref={bottomRef} />
			<div style={{ height: '85vh', flexShrink: 0 }} />
		</div>
	)
}

export default MessageList
