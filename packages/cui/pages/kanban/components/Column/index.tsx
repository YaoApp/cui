import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import Icon from '@/widgets/Icon'
import presets from '../../presets.json'
import type { Column as ColumnType, KanbanTask } from '../../types'
import TaskCard from '../TaskCard'
import styles from './index.less'

const PRESET_ICONS = presets.column.icons
const PRESET_COLORS = presets.column.colors

interface ColumnProps {
	column: ColumnType
	tasks: KanbanTask[]
	is_cn: boolean
	totalColumns: number
	selectedTaskId?: string | null
	isDragActive?: boolean
	onTaskClick: (taskId: string) => void
	onTogglePin?: (taskId: string, pinned: boolean) => void
	onTaskContextMenu?: (task: KanbanTask, e: React.MouseEvent) => void
	onAddTask?: (columnId: string) => void
	onCreateTask?: (columnId: string) => void
	onEditColumn?: (columnId: string, data: Partial<ColumnType>) => void
	onDeleteColumn?: (columnId: string) => void
	isDragOverlay?: boolean
}

interface SortableCardProps {
	task: KanbanTask
	is_cn: boolean
	isSelected?: boolean
	isDragActive?: boolean
	onTaskClick: (taskId: string) => void
	onTogglePin?: (taskId: string, pinned: boolean) => void
	onContextMenu?: (task: KanbanTask, e: React.MouseEvent) => void
}

const SortableCard = ({ task, is_cn, isSelected, isDragActive, onTaskClick, onTogglePin, onContextMenu }: SortableCardProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: task.id,
		disabled: !!task.pinned
	})

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition: isDragActive ? transition : undefined,
		opacity: isDragging ? 0.4 : undefined
	}

	return (
		<div ref={setNodeRef} style={style} data-task-id={task.id} {...attributes} {...listeners}>
			<TaskCard
				task={task}
				is_cn={is_cn}
				isDragging={isDragging}
				isSelected={isSelected}
				onClick={() => onTaskClick(task.id)}
				onTogglePin={onTogglePin}
				onContextMenu={onContextMenu}
			/>
		</div>
	)
}

const ColumnMenu = ({ column, is_cn, totalColumns, onAddTask, onEdit, onDelete, onClose }: {
	column: ColumnType
	is_cn: boolean
	totalColumns: number
	onAddTask: () => void
	onEdit: () => void
	onDelete: () => void
	onClose: () => void
}) => {
	const ref = useRef<HTMLDivElement>(null)
	const isLast = totalColumns <= 1
	const [confirming, setConfirming] = useState(false)

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) onClose()
		}
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				if (confirming) setConfirming(false)
				else onClose()
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleEsc)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleEsc)
		}
	}, [onClose, confirming])

	if (confirming) {
		return (
			<div ref={ref} className={styles.colMenu}>
				<div className={styles.colMenuConfirm}>
					<div className={styles.colMenuConfirmText}>
						{is_cn ? `确定删除「${column.title}」？任务将移至相邻分组。` : `Delete "${column.title}"? Tasks will be moved to an adjacent group.`}
					</div>
					<div className={styles.colMenuConfirmActions}>
						<span className={styles.colMenuConfirmCancel} onClick={() => setConfirming(false)}>
							{is_cn ? '取消' : 'Cancel'}
						</span>
						<span className={styles.colMenuConfirmOk} onClick={() => { onDelete(); onClose() }}>
							{is_cn ? '确定删除' : 'Delete'}
						</span>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div ref={ref} className={styles.colMenu}>
			<div className={styles.colMenuItem} onClick={() => { onAddTask(); onClose() }}>
				<span className={styles.colMenuIcon}><Icon name='material-add_task' size={14} /></span>
				{is_cn ? '添加任务' : 'Add Task'}
			</div>
			<div className={styles.colMenuDivider} />
			<div className={styles.colMenuItem} onClick={() => { onEdit(); onClose() }}>
				<span className={styles.colMenuIcon}><Icon name='material-edit' size={14} /></span>
				{is_cn ? '编辑分组' : 'Edit Group'}
			</div>
			<div className={styles.colMenuDivider} />
			<div
				className={clsx(styles.colMenuItem, isLast ? styles.colMenuDisabled : styles.colMenuDanger)}
				onClick={() => {
					if (isLast) return
					setConfirming(true)
				}}
				title={isLast ? (is_cn ? '至少保留一个分组' : 'Must keep at least one group') : undefined}
			>
				<span className={styles.colMenuIcon}><Icon name='material-delete' size={14} /></span>
				{is_cn ? '删除分组' : 'Delete Group'}
			</div>
		</div>
	)
}

const EditColumnForm = ({ column, is_cn, onSave, onCancel }: {
	column: ColumnType
	is_cn: boolean
	onSave: (data: Partial<ColumnType>) => void
	onCancel: () => void
}) => {
	const [title, setTitle] = useState(column.title)
	const [icon, setIcon] = useState(column.icon || PRESET_ICONS[0])
	const [color, setColor] = useState(column.color || PRESET_COLORS[0])
	const ref = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => { inputRef.current?.focus() }, [])

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

	const handleSave = () => {
		const trimmed = title.trim()
		if (!trimmed) return
		onSave({ title: trimmed, icon, color })
	}

	return (
		<div ref={ref} className={styles.editForm}>
			<input
				ref={inputRef}
				className={styles.editFormInput}
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
				placeholder={is_cn ? '分组名称' : 'Group name'}
			/>
			<div className={styles.editFormSection}>
				<span className={styles.editFormLabel}>{is_cn ? '图标' : 'Icon'}</span>
				<div className={styles.editFormGrid}>
					{PRESET_ICONS.map((name) => (
						<span
							key={name}
							className={clsx(styles.editFormIconItem, icon === name && styles.selected)}
							style={icon === name ? { color } : undefined}
							onClick={() => setIcon(name)}
						>
							<Icon name={name} size={16} />
						</span>
					))}
				</div>
			</div>
			<div className={styles.editFormSection}>
				<span className={styles.editFormLabel}>{is_cn ? '颜色' : 'Color'}</span>
				<div className={styles.editFormGrid}>
					{PRESET_COLORS.map((c) => (
						<span
							key={c}
							className={clsx(styles.editFormColorItem, color === c && styles.selected)}
							style={{ background: c }}
							onClick={() => setColor(c)}
						/>
					))}
				</div>
			</div>
			<div className={styles.editFormActions}>
				<button className={styles.editFormCancel} onClick={onCancel}>
					{is_cn ? '取消' : 'Cancel'}
				</button>
				<button className={styles.editFormConfirm} disabled={!title.trim()} onClick={handleSave}>
					{is_cn ? '保存' : 'Save'}
				</button>
			</div>
		</div>
	)
}

const Column = ({ column, tasks, is_cn, totalColumns, selectedTaskId, isDragActive, onTaskClick, onTogglePin, onTaskContextMenu, onAddTask, onCreateTask, onEditColumn, onDeleteColumn, isDragOverlay }: ColumnProps) => {
	const pinnedTasks = useMemo(() => tasks.filter((t) => t.pinned), [tasks])
	const sortableTasks = useMemo(() => tasks.filter((t) => !t.pinned), [tasks])
	const sortableIds = useMemo(() => sortableTasks.map((t) => t.id), [sortableTasks])
	const sortableId = `column-${column.id}`
	const droppableId = `cardlist-${column.id}`
	const [menuOpen, setMenuOpen] = useState(false)
	const [editOpen, setEditOpen] = useState(false)

	const {
		attributes: colAttributes,
		listeners: colListeners,
		setNodeRef: setColRef,
		transform: colTransform,
		transition: colTransition,
		isDragging: isColDragging
	} = useSortable({ id: sortableId })

	const { setNodeRef: setDropRef, isOver } = useDroppable({
		id: droppableId
	})

	const colStyle: React.CSSProperties = isDragOverlay
		? {}
		: {
			transform: CSS.Transform.toString(colTransform),
			transition: isDragActive ? colTransition : undefined,
			opacity: isColDragging ? 0.4 : undefined
		}

	if (column.collapsed) {
		return (
			<div
				ref={setColRef}
				style={colStyle}
				className={styles.collapsed}
				{...colAttributes}
				{...colListeners}
			>
				<span className={styles.collapsedTitle}>{column.title}</span>
				<span className={styles.collapsedCount}>{tasks.length}</span>
			</div>
		)
	}

	return (
		<div ref={setColRef} style={colStyle} className={clsx(styles.column, isDragOverlay && styles.overlay)}>
			<div className={styles.header} {...colAttributes} {...colListeners}>
				{column.icon && (
					<span className={styles.headerIcon} style={column.color ? { color: column.color } : undefined}>
						<Icon name={column.icon} size={14} />
					</span>
				)}
				<span className={styles.headerTitle}>{column.title}</span>
				<span className={styles.headerCount}>{tasks.length}</span>
				<span className={styles.spacer} />
				<span
					className={styles.headerMenu}
					onClick={(e) => {
						e.stopPropagation()
						setMenuOpen((v) => !v)
					}}
					onPointerDown={(e) => e.stopPropagation()}
				>
					<Icon name='material-more_horiz' size={14} />
				</span>
			</div>

			{menuOpen && !editOpen && (
				<ColumnMenu
					column={column}
					is_cn={is_cn}
					totalColumns={totalColumns}
					onAddTask={() => onCreateTask?.(column.id)}
					onEdit={() => setEditOpen(true)}
					onDelete={() => onDeleteColumn?.(column.id)}
					onClose={() => setMenuOpen(false)}
				/>
			)}

			{editOpen && (
				<EditColumnForm
					column={column}
					is_cn={is_cn}
					onSave={(data) => {
						onEditColumn?.(column.id, data)
						setEditOpen(false)
					}}
					onCancel={() => setEditOpen(false)}
				/>
			)}

			<div ref={setDropRef} className={styles.cardList}>
			{pinnedTasks.map((task) => (
				<div key={task.id} data-task-id={task.id}>
					<TaskCard
						task={task}
						is_cn={is_cn}
						isSelected={task.id === selectedTaskId}
						onClick={() => onTaskClick(task.id)}
						onTogglePin={onTogglePin}
						onContextMenu={onTaskContextMenu}
					/>
				</div>
			))}
				<SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
					{sortableTasks.map((task) => (
						<SortableCard
							key={task.id}
							task={task}
							is_cn={is_cn}
							isSelected={task.id === selectedTaskId}
							isDragActive={isDragActive}
							onTaskClick={onTaskClick}
							onTogglePin={onTogglePin}
							onContextMenu={onTaskContextMenu}
						/>
					))}
				</SortableContext>
				{tasks.length === 0 && isOver && (
					<div className={clsx(styles.dropZone, styles.isOver)} />
				)}
				{tasks.length === 0 && !isOver && (
					<div className={styles.dropZone} />
				)}
			</div>

			{onAddTask && (
				<div
					className={styles.addBtn}
					onClick={() => onAddTask(column.id)}
					onPointerDown={(e) => e.stopPropagation()}
				>
					<Icon name='material-add' size={14} />
					{is_cn ? '添加任务' : 'Add Task'}
				</div>
			)}
		</div>
	)
}

export default window.$app.memo(Column)
