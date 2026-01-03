import { FC, useEffect, useRef, useState, useCallback } from 'react'
import Icon from '@/widgets/Icon'
import { getLocale } from '@umijs/max'
import './index.less'

/**
 * Check if a URL can be opened in a new window
 * - /web/* paths (iframe pages)
 * - http:// or https:// external links
 */
export const canOpenInNewWindow = (url: string): boolean => {
	if (!url) return false
	// External http/https links
	if (url.startsWith('http://') || url.startsWith('https://')) {
		return true
	}
	// /web/* iframe paths
	if (url.startsWith('/web/') || url === '/web') {
		return true
	}
	return false
}

/**
 * Get the actual URL for opening in a new window
 * - For /web/* paths, remove the /web prefix (e.g., /web/xxx -> /xxx)
 * - For http/https, return as-is
 */
export const getNewWindowUrl = (url: string): string => {
	if (!url) return ''
	// External http/https links - open directly
	if (url.startsWith('http://') || url.startsWith('https://')) {
		return url
	}
	// /web/* iframe paths - remove /web prefix
	if (url.startsWith('/web/')) {
		// /web/xxx?query=1 -> /xxx?query=1
		return url.substring(4) // Remove '/web' (4 characters)
	}
	if (url === '/web') {
		return '/'
	}
	return url
}

export interface TabContextMenuProps {
	/** Position of the menu */
	position: { x: number; y: number } | null
	/** Close the menu */
	onClose: () => void
	/** Close current tab */
	onCloseTab?: () => void
	/** Close other tabs */
	onCloseOthers?: () => void
	/** Close all tabs */
	onCloseAll?: () => void
	/** Open in new window */
	onOpenInNewWindow?: () => void
	/** Disable close tab option */
	disableCloseTab?: boolean
	/** Disable close others option */
	disableCloseOthers?: boolean
	/** Disable close all option */
	disableCloseAll?: boolean
	/** Show open in new window option */
	showOpenInNewWindow?: boolean
	/** Custom labels */
	labels?: {
		closeTab?: string
		closeOthers?: string
		closeAll?: string
		openInNewWindow?: string
	}
}

const TabContextMenu: FC<TabContextMenuProps> = ({
	position,
	onClose,
	onCloseTab,
	onCloseOthers,
	onCloseAll,
	onOpenInNewWindow,
	disableCloseTab = false,
	disableCloseOthers = false,
	disableCloseAll = false,
	showOpenInNewWindow = false,
	labels
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const menuRef = useRef<HTMLDivElement>(null)

	// Default labels
	const defaultLabels = {
		closeTab: is_cn ? '关闭标签' : 'Close Tab',
		closeOthers: is_cn ? '关闭其他标签' : 'Close Other Tabs',
		closeAll: is_cn ? '关闭全部标签' : 'Close All Tabs',
		openInNewWindow: is_cn ? '在新窗口打开' : 'Open in New Window'
	}

	const mergedLabels = { ...defaultLabels, ...labels }

	// Close menu when clicking outside
	useEffect(() => {
		if (!position) return

		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				onClose()
			}
		}

		const handleScroll = () => {
			onClose()
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
		}

		// Delay adding listeners to avoid immediate close
		const timer = setTimeout(() => {
			document.addEventListener('mousedown', handleClickOutside)
			document.addEventListener('scroll', handleScroll, true)
			document.addEventListener('keydown', handleKeyDown)
		}, 0)

		return () => {
			clearTimeout(timer)
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('scroll', handleScroll, true)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [position, onClose])

	const handleCloseTab = useCallback(() => {
		if (!disableCloseTab) {
			onCloseTab?.()
			onClose()
		}
	}, [disableCloseTab, onCloseTab, onClose])

	const handleCloseOthers = useCallback(() => {
		if (!disableCloseOthers) {
			onCloseOthers?.()
			onClose()
		}
	}, [disableCloseOthers, onCloseOthers, onClose])

	const handleCloseAll = useCallback(() => {
		if (!disableCloseAll) {
			onCloseAll?.()
			onClose()
		}
	}, [disableCloseAll, onCloseAll, onClose])

	const handleOpenInNewWindow = useCallback(() => {
		onOpenInNewWindow?.()
		onClose()
	}, [onOpenInNewWindow, onClose])

	if (!position) return null

	return (
		<div
			ref={menuRef}
			className='tab_context_menu'
			style={{
				left: position.x,
				top: position.y
			}}
		>
			{showOpenInNewWindow && (
				<>
					<div className='tab_context_menu_item' onClick={handleOpenInNewWindow}>
						<Icon name='material-open_in_new' size={14} />
						<span>{mergedLabels.openInNewWindow}</span>
					</div>
					<div className='tab_context_menu_divider' />
				</>
			)}
			<div
				className={`tab_context_menu_item ${disableCloseTab ? 'disabled' : ''}`}
				onClick={handleCloseTab}
			>
				<Icon name='material-close' size={14} />
				<span>{mergedLabels.closeTab}</span>
			</div>
			<div
				className={`tab_context_menu_item ${disableCloseOthers ? 'disabled' : ''}`}
				onClick={handleCloseOthers}
			>
				<Icon name='material-tab_close' size={14} />
				<span>{mergedLabels.closeOthers}</span>
			</div>
			<div className='tab_context_menu_divider' />
			<div
				className={`tab_context_menu_item ${disableCloseAll ? 'disabled' : ''}`}
				onClick={handleCloseAll}
			>
				<Icon name='material-clear_all' size={14} />
				<span>{mergedLabels.closeAll}</span>
			</div>
		</div>
	)
}

export default TabContextMenu

