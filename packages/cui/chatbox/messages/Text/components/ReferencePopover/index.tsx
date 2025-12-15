import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getLocale } from '@umijs/max'
import { Chat, Reference } from '../../../../../openapi'
import styles from './index.less'

interface IReferencePopoverProps {
	requestId: string
	refIndex: number
	refType: string
	anchorEl: HTMLElement | null
	onClose: () => void
}

const ReferencePopover: React.FC<IReferencePopoverProps> = ({
	requestId,
	refIndex,
	refType,
	anchorEl,
	onClose
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [reference, setReference] = useState<Reference | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const popoverRef = useRef<HTMLDivElement>(null)

	// Fetch reference data
	useEffect(() => {
		if (!requestId || !refIndex) return

		const fetchReference = async () => {
			setLoading(true)
			setError(null)

			try {
				if (!window.$app?.openapi) {
					throw new Error('OpenAPI not initialized')
				}

				const chatClient = new Chat(window.$app.openapi)
				const ref = await chatClient.GetReference(requestId, refIndex)
				setReference(ref)
			} catch (err: any) {
				console.error('Failed to fetch reference:', err)
				setError(is_cn ? '加载引用失败' : 'Failed to load reference')
			} finally {
				setLoading(false)
			}
		}

		fetchReference()
	}, [requestId, refIndex, is_cn])

	// Position the popover
	useEffect(() => {
		if (!anchorEl || !popoverRef.current) return

		const updatePosition = () => {
			if (!popoverRef.current || !anchorEl) return

			const anchorRect = anchorEl.getBoundingClientRect()
			const popover = popoverRef.current
			const popoverRect = popover.getBoundingClientRect()

			// Calculate position - prefer below the anchor, but flip if needed
			let top = anchorRect.bottom + 8
			let left = anchorRect.left

			// Check if popover would go off the bottom of the screen
			if (top + popoverRect.height > window.innerHeight - 20) {
				top = anchorRect.top - popoverRect.height - 8
			}

			// Check if popover would go off the right of the screen
			if (left + popoverRect.width > window.innerWidth - 20) {
				left = window.innerWidth - popoverRect.width - 20
			}

			// Ensure left is not negative
			if (left < 20) {
				left = 20
			}

			popover.style.top = `${top}px`
			popover.style.left = `${left}px`
		}

		// Initial position
		updatePosition()

		// Update on scroll/resize
		window.addEventListener('scroll', updatePosition, true)
		window.addEventListener('resize', updatePosition)

		return () => {
			window.removeEventListener('scroll', updatePosition, true)
			window.removeEventListener('resize', updatePosition)
		}
	}, [anchorEl, loading])

	// Close on click outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
				onClose()
			}
		}

		// Close on escape
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleKeyDown)

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [onClose])

	if (!anchorEl) return null

	const getTypeLabel = (type: string) => {
		switch (type) {
			case 'web':
				return is_cn ? '网页' : 'Web'
			case 'kb':
				return is_cn ? '知识库' : 'Knowledge Base'
			case 'db':
				return is_cn ? '数据库' : 'Database'
			default:
				return type
		}
	}

	const content = (
		<div ref={popoverRef} className={styles.popover}>
			{loading && <div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>}

			{error && <div className={styles.error}>{error}</div>}

			{!loading && !error && reference && (
				<>
					<div className={styles.header}>
						<span className={styles.index}>[{reference.index}]</span>
						<span className={styles.type}>{getTypeLabel(reference.type)}</span>
						<button className={styles.close} onClick={onClose}>
							×
						</button>
					</div>

					<div className={styles.title}>{reference.title}</div>

					{reference.snippet && <div className={styles.snippet}>{reference.snippet}</div>}

					{reference.content && !reference.snippet && (
						<div className={styles.content}>{reference.content}</div>
					)}

					{reference.url && (
						<a
							href={reference.url}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.url}
						>
							{reference.url}
						</a>
					)}
				</>
			)}
		</div>
	)

	return createPortal(content, document.body)
}

export default ReferencePopover

