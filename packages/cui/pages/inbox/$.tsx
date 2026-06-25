import { useState, useCallback, useRef } from 'react'
import Icon from '@/widgets/Icon'
import { InboxProvider, useInboxContext } from './context'
import Sidebar from './components/Sidebar'
import MessageList from './components/MessageList'
import UnarchiveModal from './components/UnarchiveModal'
import TaskDetail from '../kanban/components/TaskDetail'
import styles from './index.less'

const MIN_LIST_WIDTH = 240
const MAX_LIST_WIDTH = 500
const DEFAULT_LIST_WIDTH = 320

const InboxContent = () => {
	const { is_cn, selectedChatId, selectChatGroup, unarchiveGroup } = useInboxContext()
	const [listWidth, setListWidth] = useState(DEFAULT_LIST_WIDTH)
	const [unarchiveChatId, setUnarchiveChatId] = useState<string | null>(null)
	const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

	const handleDragStart = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault()
			dragRef.current = { startX: e.clientX, startWidth: listWidth }

			const handleMove = (ev: MouseEvent) => {
				if (!dragRef.current) return
				const delta = ev.clientX - dragRef.current.startX
				const newWidth = Math.min(MAX_LIST_WIDTH, Math.max(MIN_LIST_WIDTH, dragRef.current.startWidth + delta))
				setListWidth(newWidth)
			}

			const handleUp = () => {
				dragRef.current = null
				document.removeEventListener('mousemove', handleMove)
				document.removeEventListener('mouseup', handleUp)
				document.body.style.cursor = ''
				document.body.style.userSelect = ''
			}

			document.addEventListener('mousemove', handleMove)
			document.addEventListener('mouseup', handleUp)
			document.body.style.cursor = 'col-resize'
			document.body.style.userSelect = 'none'
		},
		[listWidth]
	)

	const handleDetailClose = useCallback(() => {
		selectChatGroup('')
	}, [selectChatGroup])

	const handleUnarchive = useCallback((chatId: string) => {
		setUnarchiveChatId(chatId)
	}, [])

	const handleUnarchiveConfirm = useCallback((chatId: string, columnId: string) => {
		unarchiveGroup(chatId, columnId)
		setUnarchiveChatId(null)
	}, [unarchiveGroup])

	return (
		<>
			<div className={styles.container}>
				<Sidebar />
				<div className={styles.listArea} style={{ width: listWidth }}>
					<MessageList onUnarchive={handleUnarchive} />
				</div>
				<div className={styles.divider} onMouseDown={handleDragStart} />
				<div className={styles.detailArea}>
					{selectedChatId ? (
						<TaskDetail
							taskId={selectedChatId}
							open={true}
							onClose={handleDetailClose}
							inline={true}
						/>
					) : (
						<div className={styles.emptyDetail}>
							<Icon name='material-inbox' size={48} className={styles.emptyIcon} />
							<span>{is_cn ? '选择一条消息查看详情' : 'Select a message to view details'}</span>
						</div>
					)}
				</div>
			</div>
			<UnarchiveModal
				open={!!unarchiveChatId}
				chatId={unarchiveChatId || ''}
				is_cn={is_cn}
				onConfirm={handleUnarchiveConfirm}
				onClose={() => setUnarchiveChatId(null)}
			/>
		</>
	)
}

const InboxPage = () => {
	return (
		<InboxProvider>
			<InboxContent />
		</InboxProvider>
	)
}

export default InboxPage
