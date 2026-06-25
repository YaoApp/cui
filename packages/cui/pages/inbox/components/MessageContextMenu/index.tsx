import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '@/widgets/Icon'
import type { InboxGroup } from '../../context'
import { useInboxContext } from '../../context'
import type { InboxCategory } from '../../types'
import styles from './index.less'

export interface ContextMenuState {
	group: InboxGroup
	x: number
	y: number
}

interface MessageContextMenuProps {
	menu: ContextMenuState
	category: InboxCategory
	onClose: () => void
	onUnarchive?: (chatId: string) => void
}

interface ConfirmDialogProps {
	is_cn: boolean
	title: string
	onConfirm: () => void
	onCancel: () => void
}

const ConfirmDialog = ({ is_cn, title, onConfirm, onCancel }: ConfirmDialogProps) => {
	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onCancel()
		}
		document.addEventListener('keydown', handleEsc)
		return () => document.removeEventListener('keydown', handleEsc)
	}, [onCancel])

	return createPortal(
		<div className={styles.confirmOverlay} onClick={onCancel}>
			<div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
				<div className={styles.confirmIcon}>
					<Icon name='material-warning' size={24} />
				</div>
				<div className={styles.confirmTitle}>{title}</div>
				<div className={styles.confirmDesc}>
					{is_cn ? '此操作不可撤销，相关消息将被永久移除。' : 'This action cannot be undone. Related messages will be permanently removed.'}
				</div>
				<div className={styles.confirmActions}>
					<button className={styles.confirmCancel} onClick={onCancel}>
						{is_cn ? '取消' : 'Cancel'}
					</button>
					<button className={styles.confirmDelete} onClick={onConfirm}>
						{is_cn ? '删除' : 'Delete'}
					</button>
				</div>
			</div>
		</div>,
		document.body
	)
}

const MessageContextMenu = ({ menu, category, onClose, onUnarchive }: MessageContextMenuProps) => {
	const { is_cn, togglePin, toggleStar, markAsRead, archiveGroup, deleteGroup } = useInboxContext()
	const ref = useRef<HTMLDivElement>(null)
	const { group, x, y } = menu
	const mail = group.latestMail
	const [showConfirm, setShowConfirm] = useState(false)

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (showConfirm) return
			if (ref.current && !ref.current.contains(e.target as Node)) onClose()
		}
		const handleEsc = (e: KeyboardEvent) => {
			if (showConfirm) return
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleEsc)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleEsc)
		}
	}, [onClose, showConfirm])

	useEffect(() => {
		if (!ref.current) return
		const rect = ref.current.getBoundingClientRect()
		const vw = window.innerWidth
		const vh = window.innerHeight
		if (rect.right > vw) ref.current.style.left = `${x - rect.width}px`
		if (rect.bottom > vh) ref.current.style.top = `${y - rect.height}px`
	}, [x, y])

	const handleAction = (action: () => void) => {
		action()
		onClose()
	}

	const handleDeleteClick = () => {
		setShowConfirm(true)
	}

	const handleDeleteConfirm = () => {
		deleteGroup(group.chat_id)
		setShowConfirm(false)
		onClose()
	}

	return (
		<>
			<div ref={ref} className={styles.menu} style={{ left: x, top: y }}>
				<div
					className={styles.item}
					onClick={() => handleAction(() => togglePin(mail.id))}
				>
					<span className={styles.icon}><Icon name='material-push_pin' size={14} /></span>
					{mail.pinned
						? (is_cn ? '取消置顶' : 'Unpin')
						: (is_cn ? '置顶' : 'Pin to Top')
					}
				</div>

				<div
					className={styles.item}
					onClick={() => handleAction(() => toggleStar(mail.id))}
				>
					<span className={styles.icon}>
						<Icon name={mail.starred ? 'material-star' : 'material-star_outline'} size={14} />
					</span>
					{mail.starred
						? (is_cn ? '取消收藏' : 'Unstar')
						: (is_cn ? '收藏' : 'Star')
					}
				</div>

				<div className={styles.divider} />

				{group.unreadCount > 0 && (
					<div
						className={styles.item}
						onClick={() => handleAction(() => markAsRead(mail.id))}
					>
						<span className={styles.icon}><Icon name='material-done' size={14} /></span>
						{is_cn ? '标为已读' : 'Mark as Read'}
					</div>
				)}

				{category === 'archived' ? (
					<>
						<div
							className={styles.item}
							onClick={() => handleAction(() => onUnarchive?.(group.chat_id))}
						>
							<span className={styles.icon}><Icon name='material-unarchive' size={14} /></span>
							{is_cn ? '取消归档' : 'Unarchive'}
						</div>
						<div className={styles.divider} />
						<div
							className={`${styles.item} ${styles.danger}`}
							onClick={handleDeleteClick}
						>
							<span className={styles.icon}><Icon name='material-delete_outline' size={14} /></span>
							{is_cn ? '删除' : 'Delete'}
						</div>
					</>
				) : (
					<div
						className={styles.item}
						onClick={() => handleAction(() => archiveGroup(group.chat_id))}
					>
						<span className={styles.icon}><Icon name='material-archive' size={14} /></span>
						{is_cn ? '归档' : 'Archive'}
					</div>
				)}
			</div>

			{showConfirm && (
				<ConfirmDialog
					is_cn={is_cn}
					title={is_cn ? `确定删除「${group.taskName || group.title}」的所有消息？` : `Delete all messages for "${group.taskName || group.title}"?`}
					onConfirm={handleDeleteConfirm}
					onCancel={() => { setShowConfirm(false); onClose() }}
				/>
			)}
		</>
	)
}

export default window.$app.memo(MessageContextMenu)
