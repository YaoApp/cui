import { FC, useMemo } from 'react'
import clsx from 'clsx'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { canOpenInNewWindow, getNewWindowUrl } from '@/widgets/TabContextMenu'
import type { SidebarHistoryItem } from './types'
import './history.less'

// Group label translations
const GROUP_LABELS: Record<string, { en: string; cn: string }> = {
	today: { en: 'Today', cn: '今天' },
	yesterday: { en: 'Yesterday', cn: '昨天' },
	this_week: { en: 'This Week', cn: '本周' },
	earlier: { en: 'Earlier', cn: '更早' }
}

interface HistoryGroup {
	key: string
	label: string
	items: SidebarHistoryItem[]
}

/**
 * Group history items by time
 */
const groupByTime = (items: SidebarHistoryItem[]): HistoryGroup[] => {
	const now = new Date()
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
	const yesterday = today - 24 * 60 * 60 * 1000
	const thisWeek = today - 7 * 24 * 60 * 60 * 1000

	const groups: Record<string, SidebarHistoryItem[]> = {
		today: [],
		yesterday: [],
		this_week: [],
		earlier: []
	}

	items.forEach((item) => {
		const time = item.lastVisited
		if (time >= today) {
			groups.today.push(item)
		} else if (time >= yesterday) {
			groups.yesterday.push(item)
		} else if (time >= thisWeek) {
			groups.this_week.push(item)
		} else {
			groups.earlier.push(item)
		}
	})

	// Return non-empty groups
	return Object.entries(groups)
		.filter(([_, items]) => items.length > 0)
		.map(([key, items]) => ({
			key,
			label: key,
			items
		}))
}

interface HistoryProps {
	/** Is the history panel open */
	open: boolean
	/** History items */
	items: SidebarHistoryItem[]
	/** Select a history item */
	onSelect: (item: SidebarHistoryItem) => void
	/** Delete a history item */
	onDelete: (url: string) => void
	/** Clear all history */
	onClear: () => void
	/** Close the history panel */
	onClose: () => void
	/** Overlay mode (for narrow screens) */
	overlay?: boolean
}

const History: FC<HistoryProps> = ({ open, items, onSelect, onDelete, onClear, onClose, overlay = false }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Group items by time
	const groups = useMemo(() => groupByTime(items), [items])

	// Get localized group label
	const getGroupLabel = (key: string): string => {
		const labels = GROUP_LABELS[key]
		if (labels) {
			return is_cn ? labels.cn : labels.en
		}
		return key
	}

	// Handle delete click
	const handleDelete = (e: React.MouseEvent, url: string) => {
		e.stopPropagation()
		onDelete(url)
	}

	// Handle open in new window
	const handleOpenInNewWindow = (e: React.MouseEvent, url: string) => {
		e.stopPropagation()
		const newWindowUrl = getNewWindowUrl(url)
		window.open(newWindowUrl, '_blank')
	}

	return (
		<>
			{/* Overlay backdrop */}
			{overlay && open && <div className='sidebar_history_overlay' onClick={onClose} />}

			{/* History panel */}
			<div className={clsx('sidebar_history', open && 'open', overlay && 'overlay')}>
				<div className='sidebar_history_content'>
					{/* Header */}
					<div className='sidebar_history_header'>
						<span className='sidebar_history_title'>
							{is_cn ? '浏览历史' : 'History'}
						</span>
						{items.length > 0 && (
							<span className='sidebar_history_clear' onClick={onClear}>
								{is_cn ? '清空' : 'Clear'}
							</span>
						)}
					</div>

					{/* List */}
					<div className='sidebar_history_list'>
						{groups.map((group) => (
							<div key={group.key} className='sidebar_history_group'>
								<div className='sidebar_history_group_label'>
									{getGroupLabel(group.key)}
								</div>
								{group.items.map((item) => (
									<div
										key={item.url}
										className='sidebar_history_item'
										onClick={() => onSelect(item)}
										title={item.title}
									>
										{item.icon && (
											<Icon
												name={item.icon}
												size={14}
												className='sidebar_history_item_icon'
											/>
										)}
										<span className='sidebar_history_item_title'>
											{item.title}
										</span>
										<div className='sidebar_history_item_actions'>
											{canOpenInNewWindow(item.url) && (
												<div
													className='sidebar_history_item_action'
													onClick={(e) =>
														handleOpenInNewWindow(e, item.url)
													}
													title={
														is_cn
															? '在新窗口打开'
															: 'Open in New Window'
													}
												>
													<Icon name='material-open_in_new' size={14} />
												</div>
											)}
											<div
												className='sidebar_history_item_action'
												onClick={(e) => handleDelete(e, item.url)}
												title={is_cn ? '删除' : 'Delete'}
											>
												<Icon name='material-close' size={14} />
											</div>
										</div>
									</div>
								))}
							</div>
						))}

						{items.length === 0 && (
							<div className='sidebar_history_empty'>
								{is_cn ? '暂无浏览历史' : 'No history yet'}
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	)
}

export default History

