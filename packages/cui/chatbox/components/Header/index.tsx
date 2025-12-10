import React, { useRef, useEffect, useCallback } from 'react'
import clsx from 'clsx'
import Icon from '../../../widgets/Icon'
import type { IHeaderProps } from '../../types'
import styles from './index.less'

const Header = (props: IHeaderProps) => {
	const {
		mode,
		title,
		className,
		onNewChat,
		tabs,
		activeTabId,
		onTabChange,
		onTabClose,
		onHistoryClick,
		onSettingsClick
	} = props

	const tabsRef = useRef<HTMLDivElement>(null)

	// Helper to scroll active tab into view
	const scrollToActive = useCallback(() => {
		if (tabsRef.current) {
			const activeTab = tabsRef.current.querySelector(`.${styles.active}`) as HTMLElement
			if (activeTab) {
				activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
			}
		}
	}, [])

	// Scroll when activeTabId changes
	useEffect(() => {
		scrollToActive()
	}, [activeTabId, scrollToActive])

	// Observe container resize to keep active tab visible
	useEffect(() => {
		const container = tabsRef.current
		if (!container) return

		const observer = new ResizeObserver(() => {
			scrollToActive()
		})

		observer.observe(container)

		return () => observer.disconnect()
	}, [scrollToActive])

	const handleWheel = (e: React.WheelEvent) => {
		if (tabsRef.current) {
			tabsRef.current.scrollLeft += e.deltaY
		}
	}

	return (
		<div className={clsx(styles.container, className)}>
			{mode === 'tabs' && (
				<div className={styles.leftSection}>
					{/* History button before tabs */}
					<div className={styles.historyBtn} onClick={onHistoryClick} title='History'>
						<Icon name='material-menu' size={18} />
					</div>

					<div className={styles.tabs} ref={tabsRef} onWheel={handleWheel}>
						{tabs?.map((tab) => (
							<div
								key={tab.chatId}
								className={clsx(
									styles.tab,
									tab.chatId === activeTabId && styles.active
								)}
								onClick={() => onTabChange?.(tab.chatId)}
								title={tab.title}
							>
								{tab.streaming && <span className={styles.streamingIndicator} />}
								<span className={styles.tabTitle}>{tab.title}</span>
								<span
									className={styles.closeIcon}
									onClick={(e) => {
										e.stopPropagation()
										onTabClose?.(tab.chatId)
									}}
								>
									<Icon name='material-close' size={14} />
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{mode === 'single' && <div className={styles.singleTitle}>{title || 'Chat'}</div>}

			<div className={styles.actions}>
				<div className={styles.iconBtn} onClick={onNewChat} title='New Chat'>
					<Icon name='material-add' size={18} />
				</div>
				<div className={styles.iconBtn} onClick={onSettingsClick} title='Settings'>
					<Icon name='material-more_horiz' size={18} />
				</div>
			</div>
		</div>
	)
}

export default Header
