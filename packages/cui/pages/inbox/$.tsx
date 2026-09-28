import { useState, useCallback, useRef, useEffect } from 'react'
import { nanoid } from 'nanoid'
import Icon from '@/widgets/Icon'
import { useGlobal } from '@/context/app'
import { InboxProvider, useInboxContext } from './context'
import Sidebar from './components/Sidebar'
import MessageList from './components/MessageList'
import UnarchiveModal from './components/UnarchiveModal'
import TaskDetail from '../kanban/components/TaskDetail'
import { getBoard } from '@/pages/kanban/services/api'
import { ensureBoard } from '@/utils/ensureBoard'
import type { KanbanTask, TaskStatus } from '../kanban/types'
import styles from './index.less'

const MIN_LIST_WIDTH = 240
const MAX_LIST_WIDTH = 500
const DEFAULT_LIST_WIDTH = 320

const InboxContent = () => {
	const global = useGlobal()
	const { is_cn, selectedChatId, selectChatGroup, unarchiveGroup, insertLocalTask, removeLocalTask, taskVersion, loading, messages } = useInboxContext()
	const [listWidth, setListWidth] = useState(DEFAULT_LIST_WIDTH)
	const [unarchiveChatId, setUnarchiveChatId] = useState<string | null>(null)
	const [showCreateTask, setShowCreateTask] = useState(false)
	const userId = String(global.user?.id || '')
	const [creatingTask, setCreatingTask] = useState<KanbanTask | null>(null)
	const creatingAtVersionRef = useRef(0)
	const onboardingRef = useRef(false)
	const wasLoadingRef = useRef(false)
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

	const handleUnarchiveConfirm = useCallback((chatId: string, columnId: string, _boardId: string, _workspaceId?: string) => {
		unarchiveGroup(chatId, columnId)
		setUnarchiveChatId(null)
	}, [unarchiveGroup])

	const handleCreateTask = useCallback((_chatId: string, columnId: string, _boardId: string, workspaceId?: string) => {
		const chatId = nanoid()
		const title = is_cn ? '新任务' : 'New Task'
		setShowCreateTask(false)
		setCreatingTask({
			id: chatId,
			chat_id: chatId,
			title,
			description: '',
			status: 'creating' as TaskStatus,
			column_id: columnId,
			position: 0,
			created_at: Date.now(),
			updated_at: Date.now(),
			...(workspaceId && { workspace: { id: workspaceId, name: '' } })
		})
		creatingAtVersionRef.current = taskVersion
		insertLocalTask(chatId, title)
		selectChatGroup(chatId)
	}, [is_cn, selectChatGroup, insertLocalTask, taskVersion])

	// Clean up creating task: confirm on backend update, cancel on navigate away / close
	useEffect(() => {
		if (!creatingTask) return
		if (taskVersion > creatingAtVersionRef.current) {
			setCreatingTask(null)
			return
		}
		if (!selectedChatId || selectedChatId !== creatingTask.chat_id) {
			removeLocalTask(creatingTask.chat_id)
			setCreatingTask(null)
		}
	}, [selectedChatId, taskVersion, creatingTask, removeLocalTask])

	// Auto-create first task for new users
	useEffect(() => {
		if (loading) { wasLoadingRef.current = true; return }
		if (!wasLoadingRef.current || onboardingRef.current) return
		onboardingRef.current = true
		if (messages.length > 0 || !userId) return
		const key = `inbox_task_onboarding:${userId}`
		if (localStorage.getItem(key)) return
		localStorage.setItem(key, '1')

		const autoCreate = async () => {
			const boards = await ensureBoard(is_cn)
			if (boards.length === 0) return
			const targetId = localStorage.getItem('kanban_last_board') || boards[0].id
			const board = await getBoard(targetId)
			const sorted = [...board.columns].sort((a, b) => a.position - b.position)
			const col = sorted[sorted.length - 1]
			if (!col) return
			handleCreateTask('', col.id, targetId)
		}
		autoCreate().catch(() => {})
	}, [loading, messages.length, userId, is_cn, handleCreateTask])

	return (
		<>
			<div className={styles.container}>
				<Sidebar />
				<div className={styles.listArea} style={{ width: listWidth }}>
					<MessageList onUnarchive={handleUnarchive} onCreateTask={() => setShowCreateTask(true)} />
				</div>
				<div className={styles.divider} onMouseDown={handleDragStart} />
				<div className={styles.detailArea}>
					{selectedChatId ? (
						<TaskDetail
							taskId={selectedChatId}
							open={true}
							onClose={handleDetailClose}
							inline={true}
							refreshVersion={taskVersion}
							initialTask={creatingTask?.chat_id === selectedChatId ? creatingTask : undefined}
						/>
					) : (
						<div className={styles.emptyDetail}>
							<Icon name='material-inbox' size={48} className={styles.emptyIcon} />
							<span>{is_cn ? '选择一条消息查看详情' : 'Select a message to view details'}</span>
							<button className={styles.createTaskBtn} onClick={() => setShowCreateTask(true)}>
								<Icon name='material-add' size={16} />
								{is_cn ? '新建任务' : 'New Task'}
							</button>
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
			<UnarchiveModal
				open={showCreateTask}
				chatId=''
				is_cn={is_cn}
				title={is_cn ? '新建任务' : 'New Task'}
				icon='material-add_task'
				confirmText={is_cn ? '创建' : 'Create'}
				showWorkspace
				onConfirm={handleCreateTask}
				onClose={() => setShowCreateTask(false)}
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
