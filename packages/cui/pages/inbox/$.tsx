import { useState, useCallback, useRef } from 'react'
import Icon from '@/widgets/Icon'
import TaskDetail from '@/pages/kanban/components/TaskDetail'
import { InboxProvider, useInboxContext } from './context'
import Sidebar from './components/Sidebar'
import MessageList from './components/MessageList'
import styles from './index.less'

const MIN_LIST_WIDTH = 240
const MAX_LIST_WIDTH = 500
const DEFAULT_LIST_WIDTH = 320

const InboxContent = () => {
	const { loading, is_cn, selectedMessage, selectMessage } = useInboxContext()
	const [listWidth, setListWidth] = useState(DEFAULT_LIST_WIDTH)
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

	if (loading) {
		return (
			<div className={styles.container}>
				<div className={styles.loading}>
					<div className={styles.skeleton}>
						<div className={styles.skeletonBar} style={{ width: '40%' }} />
						<div className={styles.skeletonBar} style={{ width: '65%' }} />
						<div className={styles.skeletonBar} style={{ width: '50%' }} />
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.container}>
			<Sidebar />
			<div className={styles.listArea} style={{ width: listWidth }}>
				<MessageList />
			</div>
			<div className={styles.divider} onMouseDown={handleDragStart} />
			<div className={styles.detailArea}>
				{selectedMessage ? (
					<TaskDetail
						taskId={selectedMessage.task_id}
						open={true}
						inline={true}
						onClose={() => selectMessage('')}
					/>
				) : (
					<div className={styles.emptyDetail}>
						<Icon name='material-inbox' size={48} className={styles.emptyIcon} />
						<span>{is_cn ? '选择一条消息查看详情' : 'Select a message to view details'}</span>
					</div>
				)}
			</div>
		</div>
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
