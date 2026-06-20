import { useEffect, useRef } from 'react'
import Icon from '@/widgets/Icon'
import type { InboxMessage } from '../../types'
import { useInboxContext } from '../../context'
import styles from './index.less'

export interface ContextMenuState {
	message: InboxMessage
	x: number
	y: number
}

interface MessageContextMenuProps {
	menu: ContextMenuState
	onClose: () => void
}

const MessageContextMenu = ({ menu, onClose }: MessageContextMenuProps) => {
	const { is_cn, togglePin, toggleStar, markAsRead, archiveMessage } = useInboxContext()
	const ref = useRef<HTMLDivElement>(null)
	const { message, x, y } = menu

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) onClose()
		}
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleEsc)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleEsc)
		}
	}, [onClose])

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

	return (
		<div ref={ref} className={styles.menu} style={{ left: x, top: y }}>
			<div
				className={styles.item}
				onClick={() => handleAction(() => togglePin(message.id))}
			>
				<span className={styles.icon}><Icon name='material-push_pin' size={14} /></span>
				{message.pinned
					? (is_cn ? '取消置顶' : 'Unpin')
					: (is_cn ? '置顶' : 'Pin to Top')
				}
			</div>

			<div
				className={styles.item}
				onClick={() => handleAction(() => toggleStar(message.id))}
			>
				<span className={styles.icon}>
					<Icon name={message.starred ? 'material-star' : 'material-star_outline'} size={14} />
				</span>
				{message.starred
					? (is_cn ? '取消收藏' : 'Unstar')
					: (is_cn ? '收藏' : 'Star')
				}
			</div>

			<div className={styles.divider} />

			{!message.read && (
				<div
					className={styles.item}
					onClick={() => handleAction(() => markAsRead(message.id))}
				>
					<span className={styles.icon}><Icon name='material-done' size={14} /></span>
					{is_cn ? '标为已读' : 'Mark as Read'}
				</div>
			)}

			<div
				className={styles.item}
				onClick={() => handleAction(() => archiveMessage(message.id))}
			>
				<span className={styles.icon}><Icon name='material-archive' size={14} /></span>
				{is_cn ? '归档' : 'Archive'}
			</div>
		</div>
	)
}

export default window.$app.memo(MessageContextMenu)
