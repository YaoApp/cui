import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
	DndContext,
	DragOverlay,
	pointerWithin,
	rectIntersection,
	closestCenter,
	closestCorners,
	getFirstCollision,
	PointerSensor,
	useSensor,
	useSensors,
	type DragStartEvent,
	type DragEndEvent,
	type DragOverEvent,
	type CollisionDetection,
	type UniqueIdentifier
} from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import Icon from '@/widgets/Icon'
import { getLocale } from '@umijs/max'
import { useKanbanContext } from '../../context'
import Column from '../Column'
import TaskCard from '../TaskCard'
import TaskContextMenu, { type ContextMenuState } from '../TaskContextMenu'
import type { KanbanTask, Column as ColumnType } from '../../types'
import styles from './index.less'

const COLUMN_PREFIX = 'column-'
const CARDLIST_PREFIX = 'cardlist-'

function isColumnId(id: string): boolean {
	return id.startsWith(COLUMN_PREFIX)
}

function isCardlistId(id: string): boolean {
	return id.startsWith(CARDLIST_PREFIX)
}

function extractColumnId(id: string): string {
	return id.replace(COLUMN_PREFIX, '')
}

function extractCardlistColumnId(id: string): string {
	return id.replace(CARDLIST_PREFIX, '')
}

function getColumnIdFromDropTarget(id: string): string | null {
	if (isColumnId(id)) return extractColumnId(id)
	if (isCardlistId(id)) return extractCardlistColumnId(id)
	return null
}

type DragType = 'task' | 'column' | null

const PRESET_ICONS = [
	'material-search', 'material-bar_chart', 'material-edit_note', 'material-group',
	'material-lightbulb', 'material-rocket_launch', 'material-science', 'material-code',
	'material-shopping_cart', 'material-support_agent', 'material-campaign', 'material-palette',
	'material-attach_money', 'material-analytics', 'material-folder_special', 'material-task'
]

const PRESET_COLORS = [
	'#6366F1', '#3B82F6', '#22C55E', '#F59E0B',
	'#EF4444', '#EC4899', '#8B5CF6', '#06B6D4',
	'#F97316', '#14B8A6', '#64748B', '#A855F7'
]

interface AddColumnFormProps {
	is_cn: boolean
	onSubmit: (data: { title: string; icon: string; color: string }) => void
	onCancel: () => void
}

const AddColumnForm = ({ is_cn, onSubmit, onCancel }: AddColumnFormProps) => {
	const [title, setTitle] = useState('')
	const [icon, setIcon] = useState(PRESET_ICONS[0])
	const [color, setColor] = useState(PRESET_COLORS[0])
	const ref = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		inputRef.current?.focus()
	}, [])

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) onCancel()
		}
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onCancel()
		}
		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleEsc)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleEsc)
		}
	}, [onCancel])

	const handleSubmit = () => {
		const trimmed = title.trim()
		if (!trimmed) return
		onSubmit({ title: trimmed, icon, color })
	}

	return (
		<div ref={ref} className={styles.addForm}>
			<input
				ref={inputRef}
				className={styles.addFormInput}
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
				placeholder={is_cn ? '分组名称' : 'Group name'}
			/>

			<div className={styles.addFormSection}>
				<span className={styles.addFormLabel}>{is_cn ? '图标' : 'Icon'}</span>
				<div className={styles.addFormGrid}>
					{PRESET_ICONS.map((name) => (
						<span
							key={name}
							className={`${styles.addFormIconItem} ${icon === name ? styles.selected : ''}`}
							style={icon === name ? { color } : undefined}
							onClick={() => setIcon(name)}
						>
							<Icon name={name} size={16} />
						</span>
					))}
				</div>
			</div>

			<div className={styles.addFormSection}>
				<span className={styles.addFormLabel}>{is_cn ? '颜色' : 'Color'}</span>
				<div className={styles.addFormGrid}>
					{PRESET_COLORS.map((c) => (
						<span
							key={c}
							className={`${styles.addFormColorItem} ${color === c ? styles.selected : ''}`}
							style={{ background: c }}
							onClick={() => setColor(c)}
						/>
					))}
				</div>
			</div>

			<div className={styles.addFormActions}>
				<button className={styles.addFormCancel} onClick={onCancel}>
					{is_cn ? '取消' : 'Cancel'}
				</button>
				<button className={styles.addFormConfirm} disabled={!title.trim()} onClick={handleSubmit}>
					{is_cn ? '确定' : 'Confirm'}
				</button>
			</div>
		</div>
	)
}

const Board = ({ onCreateTaskInColumn }: { onCreateTaskInColumn?: (columnId: string) => void }) => {
	const { board, filteredTasks, is_cn, selectedTaskId, selectTask, moveTask, reorderColumns, togglePin, addColumn, updateColumn, removeColumn } = useKanbanContext()
	const [activeId, setActiveId] = useState<string | null>(null)
	const [dragType, setDragType] = useState<DragType>(null)
	const [localTasks, setLocalTasks] = useState<KanbanTask[] | null>(null)
	const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
	const [showAddForm, setShowAddForm] = useState(false)
	const lastOverIdRef = useRef<UniqueIdentifier | null>(null)
	const recentlyMovedToNewContainer = useRef(false)
	const dragOriginRef = useRef<{ taskId: string; columnId: string; position: number } | null>(null)

	const handleTaskContextMenu = useCallback((task: KanbanTask, e: React.MouseEvent) => {
		setContextMenu({ task, x: e.clientX, y: e.clientY })
	}, [])

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 }
		})
	)

	const tasks = localTasks ?? filteredTasks

	const activeTask = useMemo(() => {
		if (!activeId || dragType !== 'task') return null
		return tasks.find((t) => t.id === activeId) || null
	}, [activeId, dragType, tasks])

	const activeColumn = useMemo(() => {
		if (!activeId || dragType !== 'column' || !board) return null
		const colId = extractColumnId(activeId)
		return board.columns.find((c) => c.id === colId) || null
	}, [activeId, dragType, board])

	const getColumnTasks = useCallback(
		(columnId: string) => {
			return tasks
				.filter((t) => t.column_id === columnId)
				.sort((a, b) => {
					if (a.pinned && !b.pinned) return -1
					if (!a.pinned && b.pinned) return 1
					return a.position - b.position
				})
		},
		[tasks]
	)

	useEffect(() => {
		requestAnimationFrame(() => {
			recentlyMovedToNewContainer.current = false
		})
	}, [localTasks])

	const collisionDetection: CollisionDetection = useCallback(
		(args) => {
			if (dragType === 'column') {
				const columnContainers = args.droppableContainers.filter(
					(container) => isColumnId(String(container.id))
				)
				return closestCorners({ ...args, droppableContainers: columnContainers })
			}

			const pointerIntersections = pointerWithin(args)
			const intersections =
				pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args)

			let overId = getFirstCollision(intersections, 'id')

			if (overId != null) {
				const overStr = String(overId)

			const colId = getColumnIdFromDropTarget(overStr)
			if (colId) {
				const columnTasks = getColumnTasks(colId)
				const taskContainers = args.droppableContainers.filter((c) => {
					const cid = String(c.id)
					return !isColumnId(cid) && !isCardlistId(cid) && columnTasks.some((t) => t.id === cid)
				})

				if (taskContainers.length > 0) {
					overId = closestCenter({
						...args,
						droppableContainers: taskContainers
					})[0]?.id
				}
			}

				lastOverIdRef.current = overId
				return [{ id: overId }]
			}

			if (recentlyMovedToNewContainer.current) {
				lastOverIdRef.current = activeId
			}

			return lastOverIdRef.current ? [{ id: lastOverIdRef.current }] : []
		},
		[activeId, dragType, getColumnTasks]
	)

	const handleDragStart = useCallback(
		(event: DragStartEvent) => {
			const id = String(event.active.id)

			if (isColumnId(id)) {
				setActiveId(id)
				setDragType('column')
				return
			}

			const task = filteredTasks.find((t) => t.id === id)
			if (task?.pinned) return

			setActiveId(id)
			setDragType('task')
			setLocalTasks(filteredTasks.map((t) => ({ ...t })))
			lastOverIdRef.current = null
			recentlyMovedToNewContainer.current = false
			dragOriginRef.current = task
				? { taskId: task.id, columnId: task.column_id, position: task.position }
				: null
		},
		[filteredTasks]
	)

	const handleDragOver = useCallback(
		(event: DragOverEvent) => {
			if (dragType !== 'task') return

			const { active, over } = event
			if (!over || !activeId) return

			const activeStr = String(active.id)
			const overStr = String(over.id)

			if (activeStr === overStr) return

			setLocalTasks((prev) => {
				if (!prev) return prev

			const activeCol = prev.find((t) => t.id === activeStr)?.column_id
			const overCol = getColumnIdFromDropTarget(overStr)
				?? prev.find((t) => t.id === overStr)?.column_id

				if (!activeCol || !overCol || activeCol === overCol) return prev

				const overItems = prev
					.filter((t) => t.column_id === overCol && t.id !== activeStr)
					.sort((a, b) => a.position - b.position)

			let newIndex: number
			if (getColumnIdFromDropTarget(overStr)) {
				newIndex = overItems.length + 1
			} else {
					const overIndex = overItems.findIndex((t) => t.id === overStr)
					const isBelowOver =
						over &&
						active.rect.current.translated &&
						active.rect.current.translated.top >
							over.rect.top + over.rect.height

					const modifier = isBelowOver ? 1 : 0
					newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1
				}

				recentlyMovedToNewContainer.current = true

				const sourceItems = prev
					.filter((t) => t.column_id === activeCol && t.id !== activeStr)
					.sort((a, b) => a.position - b.position)

				return prev.map((t) => {
					if (t.id === activeStr) {
						return { ...t, column_id: overCol, position: newIndex }
					}
					if (t.column_id === activeCol && t.id !== activeStr) {
						const idx = sourceItems.findIndex((st) => st.id === t.id)
						return idx >= 0 ? { ...t, position: idx } : t
					}
					if (t.column_id === overCol && t.id !== activeStr) {
						const idx = overItems.findIndex((ot) => ot.id === t.id)
						return { ...t, position: idx >= newIndex ? idx + 1 : idx }
					}
					return t
				})
			})
		},
		[activeId, dragType]
	)

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event

		if (dragType === 'column') {
			setActiveId(null)
			setDragType(null)
			if (!over || !board) return
			const activeStr = String(active.id)
			const overStr = String(over.id)
			if (activeStr === overStr) return

			const sorted = [...board.columns].sort((a, b) => a.position - b.position)
			const oldIdx = sorted.findIndex((c) => `column-${c.id}` === activeStr)
			const newIdx = sorted.findIndex((c) => `column-${c.id}` === overStr)
			if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return

			const reordered = arrayMove(sorted, oldIdx, newIdx)
			reorderColumns(reordered.map((c) => c.id))
			return
		}

			const origin = dragOriginRef.current
			setActiveId(null)
			setDragType(null)
			dragOriginRef.current = null

			if (!over || !origin) {
				setLocalTasks(null)
				return
			}

			const activeStr = String(active.id)
			const overId = String(over.id)
			const currentTasks = localTasks ?? filteredTasks
			const activeTask = currentTasks.find((t) => t.id === activeStr)

			if (!activeTask) {
				setLocalTasks(null)
				return
			}

		const activeContainer = activeTask.column_id
		const overContainer = getColumnIdFromDropTarget(overId)
			?? currentTasks.find((t) => t.id === overId)?.column_id

		if (!overContainer) {
			setLocalTasks(null)
			return
		}

		const colTaskIds = currentTasks
			.filter((t) => t.column_id === overContainer)
			.sort((a, b) => a.position - b.position)
			.map((t) => t.id)

		const activeIndex = colTaskIds.indexOf(activeStr)
		const overIndex = getColumnIdFromDropTarget(overId)
			? colTaskIds.length - 1
			: colTaskIds.indexOf(overId)

			let finalPosition: number
			if (activeIndex >= 0 && overIndex >= 0 && activeIndex !== overIndex) {
				const reordered = arrayMove(colTaskIds, activeIndex, overIndex)
				finalPosition = reordered.indexOf(activeStr)
			} else {
				finalPosition = activeIndex >= 0 ? activeIndex : 0
			}

			const hasMoved = activeContainer !== origin.columnId || finalPosition !== origin.position
			setLocalTasks(null)

			if (hasMoved) {
				moveTask(activeStr, activeContainer, finalPosition)
			}
		},
		[dragType, board, localTasks, filteredTasks, moveTask, reorderColumns]
	)

	const handleDragCancel = useCallback(() => {
		if (dragOriginRef.current) {
			setLocalTasks(null)
		}
		setActiveId(null)
		setDragType(null)
		dragOriginRef.current = null
		lastOverIdRef.current = null
	}, [])

	if (!board) return null

	const columns = [...board.columns].sort((a, b) => a.position - b.position)
	const columnSortIds = columns.map((c) => `column-${c.id}`)

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={collisionDetection}
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			<SortableContext items={columnSortIds} strategy={horizontalListSortingStrategy}>
				<div className={styles.board}>
					{columns.map((col) => (
						<Column
							key={col.id}
							column={col}
							tasks={getColumnTasks(col.id)}
							is_cn={is_cn}
							totalColumns={columns.length}
							selectedTaskId={selectedTaskId}
							isDragActive={!!activeId}
							onTaskClick={selectTask}
							onTogglePin={togglePin}
							onTaskContextMenu={handleTaskContextMenu}
							onCreateTask={onCreateTaskInColumn}
							onEditColumn={(id, data) => updateColumn(id, data)}
							onDeleteColumn={removeColumn}
						/>
					))}

					<div className={styles.addColumn}>
						<button
							className={styles.addColumnBtn}
							onClick={() => setShowAddForm(true)}
							title={is_cn ? '创建分组' : 'New Group'}
						>
							<Icon name='material-add' size={16} />
							<span>{is_cn ? '新分组' : 'New Group'}</span>
						</button>
						{showAddForm && (
							<AddColumnForm
								is_cn={is_cn}
								onSubmit={(data) => {
									addColumn({
										title: data.title,
										icon: data.icon,
										color: data.color,
										board_id: board!.id,
										position: board!.columns.length
									})
									setShowAddForm(false)
								}}
								onCancel={() => setShowAddForm(false)}
							/>
						)}
					</div>
				</div>
			</SortableContext>

			<DragOverlay
				dropAnimation={{
					duration: 200,
					easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)'
				}}
			>
				{activeTask && (
					<div className={styles.dragOverlay}>
						<TaskCard task={activeTask} is_cn={is_cn} />
					</div>
				)}
				{activeColumn && (
					<div className={styles.dragOverlayColumn}>
						<Column
							column={activeColumn}
							tasks={getColumnTasks(activeColumn.id)}
							is_cn={is_cn}
							onTaskClick={() => {}}
							isDragOverlay
						/>
					</div>
				)}
			</DragOverlay>

			{contextMenu && (
				<TaskContextMenu
					menu={contextMenu}
					onClose={() => setContextMenu(null)}
				/>
			)}
		</DndContext>
	)
}

export default window.$app.memo(Board)
