import { useEffect, useRef, useMemo } from 'react'
import Icon from '@/widgets/Icon'
import { useKanbanContext } from '../../context'
import type { KanbanTask } from '../../types'
import styles from './index.less'

export interface ContextMenuState {
	task: KanbanTask
	x: number
	y: number
}

interface TaskContextMenuProps {
	menu: ContextMenuState
	onClose: () => void
}

const TaskContextMenu = ({ menu, onClose }: TaskContextMenuProps) => {
	const { board, is_cn, selectTask, togglePin, moveTask, removeTask } = useKanbanContext()
	const ref = useRef<HTMLDivElement>(null)
	const { task, x, y } = menu

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

	const columns = useMemo(() => {
		if (!board) return []
		return [...board.columns]
			.sort((a, b) => a.position - b.position)
			.filter((c) => c.id !== task.column_id)
	}, [board, task.column_id])

	const handleAction = (action: () => void) => {
		action()
		onClose()
	}

	return (
		<div ref={ref} className={styles.menu} style={{ left: x, top: y }}>
			<div
				className={styles.item}
				onClick={() => handleAction(() => selectTask(task.id))}
			>
				<span className={styles.icon}><Icon name='material-open_in_new' size={14} /></span>
				{is_cn ? '打开详情' : 'Open Detail'}
			</div>

			<div
				className={styles.item}
				onClick={() => handleAction(() => togglePin(task.id, !task.pinned))}
			>
				<span className={styles.icon}><Icon name='material-push_pin' size={14} /></span>
				{task.pinned
					? (is_cn ? '取消置顶' : 'Unpin')
					: (is_cn ? '置顶' : 'Pin to Top')
				}
			</div>

			{columns.length > 0 && (
				<>
					<div className={styles.divider} />
					<div className={styles.groupLabel}>
						{is_cn ? '移动到' : 'Move to'}
					</div>
					{columns.map((col) => (
						<div
							key={col.id}
							className={styles.item}
							onClick={() => handleAction(() => moveTask(task.id, col.id, 0))}
						>
							<span className={styles.icon} style={col.color ? { color: col.color } : undefined}>
								<Icon name={col.icon || 'material-folder'} size={14} />
							</span>
							{col.title}
						</div>
					))}
				</>
			)}

			<div className={styles.divider} />

			<div
				className={`${styles.item} ${styles.danger}`}
				onClick={() => handleAction(() => removeTask(task.id))}
			>
				<span className={styles.icon}><Icon name='material-delete' size={14} /></span>
				{is_cn ? '删除任务' : 'Delete Task'}
			</div>
		</div>
	)
}

export default window.$app.memo(TaskContextMenu)
