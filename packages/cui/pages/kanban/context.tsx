import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getLocale, useNavigate } from '@umijs/max'
import { nanoid } from 'nanoid'
import type { Board, BoardSummary, BoardTemplate, Column, KanbanTask, StatusFilter, CreateTaskData } from './types'
import * as services from './services'

interface KanbanContextValue {
	board: Board | null
	boards: BoardSummary[]
	currentBoardId: string
	tasks: KanbanTask[]
	filteredTasks: KanbanTask[]
	loading: boolean
	selectedTaskId: string | null
	detailOpen: boolean
	isAnimating: boolean
	searchKeyword: string
	statusFilter: StatusFilter
	is_cn: boolean
	creatingTaskId: string | null

	selectTask: (taskId: string) => void
	closeDetail: () => void
	setSearchKeyword: (keyword: string) => void
	setStatusFilter: (filter: StatusFilter) => void
	addTask: (data: CreateTaskData) => Promise<void>
	updateTask: (taskId: string, data: Partial<KanbanTask>) => Promise<void>
	moveTask: (taskId: string, columnId: string, position: number) => Promise<void>
	togglePin: (taskId: string, pinned: boolean) => void
	removeTask: (taskId: string) => Promise<void>
	addColumn: (data: Partial<Column>) => Promise<void>
	updateColumn: (columnId: string, data: Partial<Column>) => Promise<void>
	removeColumn: (columnId: string) => Promise<void>
	reorderColumns: (columnIds: string[]) => Promise<void>
	refreshTasks: () => Promise<void>
	startCreating: (columnId?: string) => void
	finalizeCreating: (tempId: string, realTask: KanbanTask) => void
	cancelCreating: () => void

	triggerAnimation: () => void
	switchBoard: (boardId: string) => void
	createBoard: (data: { title: string; icon?: string; color?: string }) => Promise<void>
	updateBoard: (boardId: string, data: Partial<Board>) => Promise<void>
	deleteBoard: (boardId: string) => Promise<void>
	createBoardFromTemplate: (templateId: string, title?: string) => Promise<void>
	getBoardTemplates: () => Promise<BoardTemplate[]>
	refreshBoards: () => Promise<void>
}

const KanbanContext = createContext<KanbanContextValue | null>(null)

interface KanbanProviderProps {
	children: React.ReactNode
	boardId?: string
}

export function KanbanProvider({ children, boardId: urlBoardId }: KanbanProviderProps) {
	const navigate = useNavigate()
	const [boards, setBoards] = useState<BoardSummary[]>([])
	const [currentBoardId, setCurrentBoardId] = useState<string>(urlBoardId || '')
	const [board, setBoard] = useState<Board | null>(null)
	const [tasks, setTasks] = useState<KanbanTask[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
	const [detailOpen, setDetailOpen] = useState(false)
	const [searchKeyword, setSearchKeyword] = useState('')
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
	const [creatingTaskId, setCreatingTaskId] = useState<string | null>(null)

	const [isAnimating, setIsAnimating] = useState(false)

	const is_cn = useMemo(() => getLocale() === 'zh-CN', [])
	const moveVersionRef = useRef(0)
	// Tracks local position overrides from drag-and-drop moves.
	// Key: taskId, Value: { column_id, position } the user dragged to.
	// Cleared only when refreshTasks confirms server data matches.
	const localMovesRef = useRef<Map<string, { column_id: string; position: number }>>(new Map())
	const initializedRef = useRef(false)
	const closeTimerRef = useRef<number>()
	const animTimerRef = useRef<number>()

	const triggerAnimation = useCallback(() => {
		clearTimeout(animTimerRef.current)
		setIsAnimating(true)
		animTimerRef.current = window.setTimeout(() => setIsAnimating(false), 260)
	}, [])

	const loadBoardData = useCallback(async (boardId: string) => {
		const [boardData, tasksData] = await Promise.all([
			services.getBoard(boardId),
			services.getTasks(boardId)
		])
		setBoard(boardData)
		setTasks(tasksData)
		setCurrentBoardId(boardId)
	}, [])

	const refreshBoards = useCallback(async () => {
		const list = await services.getBoards()
		setBoards(list)
		return list
	}, [])

	useEffect(() => {
		if (initializedRef.current) return
		initializedRef.current = true

		const init = async () => {
			setLoading(true)
			try {
				const list = await services.getBoards()
				setBoards(list)

				if (list.length === 0) return

				const targetId = urlBoardId && list.some((b) => b.id === urlBoardId) ? urlBoardId : list[0].id

				await loadBoardData(targetId)

				if (!urlBoardId || !list.some((b) => b.id === urlBoardId)) {
					navigate(`/kanban/${targetId}`, { replace: true })
				}
			} finally {
				setLoading(false)
			}
		}
		init()
	}, [urlBoardId, loadBoardData, navigate])

	const switchBoard = useCallback(
		(boardId: string) => {
			if (boardId === currentBoardId) return

		clearTimeout(closeTimerRef.current)
		clearTimeout(animTimerRef.current)
		setIsAnimating(false)
		setLoading(true)
		setSelectedTaskId(null)
		setDetailOpen(false)
			setSearchKeyword('')
			setStatusFilter('all')
			if (creatingTaskId) {
				setTasks((prev) => prev.filter((t) => t.id !== creatingTaskId))
				setCreatingTaskId(null)
			}
			localMovesRef.current.clear()
			moveVersionRef.current++

			navigate(`/kanban/${boardId}`)

			loadBoardData(boardId).finally(() => setLoading(false))
		},
		[currentBoardId, loadBoardData, navigate, creatingTaskId]
	)

	const createBoardFn = useCallback(
		async (data: { title: string; icon?: string; color?: string }) => {
			const newBoard = await services.createBoard(data)
			await refreshBoards()
			switchBoard(newBoard.id)
		},
		[refreshBoards, switchBoard]
	)

	const updateBoardFn = useCallback(
		async (boardId: string, data: Partial<Board>) => {
			const updated = await services.updateBoard(boardId, data)
			setBoards((prev) => prev.map((b) => (b.id === boardId ? { ...b, title: updated.title, icon: updated.icon, color: updated.color } : b)))
			if (boardId === currentBoardId) {
				setBoard((prev) => (prev ? { ...prev, ...updated, columns: prev.columns } : prev))
			}
		},
		[currentBoardId]
	)

	const deleteBoardFn = useCallback(
		async (boardId: string) => {
			await services.deleteBoard(boardId)
			const list = await refreshBoards()

			if (boardId === currentBoardId && list.length > 0) {
				switchBoard(list[0].id)
			}
		},
		[currentBoardId, refreshBoards, switchBoard]
	)

	const createBoardFromTemplateFn = useCallback(
		async (templateId: string, title?: string) => {
			const newBoard = await services.createBoardFromTemplate(templateId, title)
			await refreshBoards()
			switchBoard(newBoard.id)
		},
		[refreshBoards, switchBoard]
	)

	const getBoardTemplatesFn = useCallback(async () => {
		return services.getBoardTemplates()
	}, [])

	const selectTask = useCallback((taskId: string) => {
		clearTimeout(closeTimerRef.current)
		if (creatingTaskId && creatingTaskId !== taskId) {
			setTasks((prev) => prev.filter((t) => t.id !== creatingTaskId))
			setCreatingTaskId(null)
		}
		setSelectedTaskId(taskId)
		triggerAnimation()
		setDetailOpen(true)
	}, [creatingTaskId, triggerAnimation])

	const closeDetail = useCallback(() => {
		triggerAnimation()
		setDetailOpen(false)
		closeTimerRef.current = window.setTimeout(() => {
			setSelectedTaskId(null)
		}, 260)
	}, [triggerAnimation])

	const cancelCreating = useCallback(() => {
		const tempId = creatingTaskId
		setCreatingTaskId(null)
		triggerAnimation()
		setDetailOpen(false)
		closeTimerRef.current = window.setTimeout(() => {
			if (tempId) setTasks((prev) => prev.filter((t) => t.id !== tempId))
			setSelectedTaskId(null)
		}, 260)
	}, [creatingTaskId, triggerAnimation])

	const startCreating = useCallback(
		(columnId?: string) => {
			clearTimeout(closeTimerRef.current)
			const targetColumnId = columnId || board?.columns[board.columns.length - 1]?.id || ''
			const tempId = `temp_${Date.now()}`
		const placeholder: KanbanTask = {
			id: tempId,
			title: is_cn ? '新任务' : 'New Task',
			description: '',
			status: 'creating',
			column_id: targetColumnId,
			position: 9999,
			chat_id: nanoid(),
			created_at: Date.now(),
			updated_at: Date.now()
		}
			setTasks((prev) => {
				const filtered = creatingTaskId
					? prev.filter((t) => t.id !== creatingTaskId)
					: prev
				return [...filtered, placeholder]
			})
		setCreatingTaskId(tempId)
		setSelectedTaskId(tempId)
		triggerAnimation()
		setDetailOpen(true)
	},
	[board, is_cn, creatingTaskId, triggerAnimation]
	)

	const finalizeCreating = useCallback(
		(tempId: string, realTask: KanbanTask) => {
			setTasks((prev) => prev.map((t) => (t.id === tempId ? realTask : t)))
			setCreatingTaskId(null)
			setSelectedTaskId(realTask.id)
			setBoards((prev) =>
				prev.map((b) => (b.id === currentBoardId ? { ...b, task_count: b.task_count + 1 } : b))
			)
		},
		[currentBoardId]
	)

	const addTask = useCallback(
		async (data: CreateTaskData) => {
			const task = await services.createTask(data)
			setTasks((prev) => [...prev, task])
			setBoards((prev) => prev.map((b) => (b.id === currentBoardId ? { ...b, task_count: b.task_count + 1 } : b)))
		},
		[currentBoardId]
	)

	const updateTask = useCallback(
		async (taskId: string, data: Partial<KanbanTask>) => {
			const updated = await services.updateTask(taskId, data)
			setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)))
		},
		[]
	)

	const moveTask = useCallback(
		async (taskId: string, columnId: string, position: number) => {
			moveVersionRef.current++
			localMovesRef.current.set(taskId, { column_id: columnId, position })
			setTasks((prev) => {
				const task = prev.find((t) => t.id === taskId)
				if (!task) return prev

				const isSameColumn = task.column_id === columnId

			if (isSameColumn) {
				const colTasks = prev
					.filter((t) => t.column_id === columnId)
					.sort((a, b) => a.position - b.position)
				const without = colTasks.filter((t) => t.id !== taskId)
				without.splice(position, 0, task)
				const posMap = new Map<string, number>()
				without.forEach((t, i) => posMap.set(t.id, i))
				return prev.map((t) => {
					if (t.column_id !== columnId) return t
					const newPos = posMap.get(t.id)
					return newPos !== undefined ? { ...t, position: newPos } : t
				})
			}

			const oldColumnId = task.column_id
			const sourceTasks = prev
				.filter((t) => t.column_id === oldColumnId && t.id !== taskId)
				.sort((a, b) => a.position - b.position)
			const sourceMap = new Map<string, number>()
			sourceTasks.forEach((t, i) => sourceMap.set(t.id, i))

			const targetTasks = prev
				.filter((t) => t.column_id === columnId && t.id !== taskId)
				.sort((a, b) => a.position - b.position)
			targetTasks.splice(position, 0, task)
			const targetMap = new Map<string, number>()
			targetTasks.forEach((t, i) => targetMap.set(t.id, i))

			return prev.map((t) => {
				if (t.id === taskId) return { ...t, column_id: columnId, position }
				if (t.column_id === oldColumnId) {
					const newPos = sourceMap.get(t.id)
					return newPos !== undefined ? { ...t, position: newPos } : t
				}
				if (t.column_id === columnId) {
					const newPos = targetMap.get(t.id)
					return newPos !== undefined ? { ...t, position: newPos } : t
				}
				return t
			})
			})
			if (!taskId.startsWith('temp_')) {
				services.moveTask(taskId, columnId, position).catch(console.error)
			}
		},
		[]
	)

	const togglePin = useCallback(
		(taskId: string, pinned: boolean) => {
			setTasks((prev) => {
				const task = prev.find((t) => t.id === taskId)
				if (!task) return prev

				if (pinned) {
					return prev.map((t) => (t.id === taskId ? { ...t, pinned: true } : t))
				}

				const colTasks = prev
					.filter((t) => t.column_id === task.column_id && t.id !== taskId && !t.pinned)
					.sort((a, b) => a.position - b.position)

				return prev.map((t) => {
					if (t.id === taskId) return { ...t, pinned: false, position: 0 }
					if (t.column_id === task.column_id && !t.pinned) {
						const idx = colTasks.findIndex((ct) => ct.id === t.id)
						return { ...t, position: idx + 1 }
					}
					return t
				})
			})
			services.updateTask(taskId, { pinned } as Partial<KanbanTask>).catch(console.error)
		},
		[]
	)

	const removeTask = useCallback(
		async (taskId: string) => {
			if (taskId === creatingTaskId) {
				setCreatingTaskId(null)
				triggerAnimation()
				setDetailOpen(false)
				closeTimerRef.current = window.setTimeout(() => {
					setTasks((prev) => prev.filter((t) => t.id !== taskId))
					setSelectedTaskId(null)
				}, 260)
				return
			}
			await services.deleteTask(taskId)
			setTasks((prev) => prev.filter((t) => t.id !== taskId))
			setBoards((prev) => prev.map((b) => (b.id === currentBoardId ? { ...b, task_count: Math.max(0, b.task_count - 1) } : b)))
			if (selectedTaskId === taskId) {
				triggerAnimation()
				setDetailOpen(false)
				closeTimerRef.current = window.setTimeout(() => {
					setSelectedTaskId(null)
				}, 260)
			}
		},
		[selectedTaskId, currentBoardId, creatingTaskId, triggerAnimation]
	)

	const addColumn = useCallback(
		async (data: Partial<Column>) => {
			if (!board) return
			const column = await services.createColumn(board.id, data)
			setBoard((prev) => (prev ? { ...prev, columns: [...prev.columns, column] } : prev))
		},
		[board]
	)

	const updateColumnFn = useCallback(async (columnId: string, data: Partial<Column>) => {
		const updated = await services.updateColumn(columnId, data)
		setBoard((prev) =>
			prev
				? { ...prev, columns: prev.columns.map((c) => (c.id === columnId ? updated : c)) }
				: prev
		)
	}, [])

	const removeColumn = useCallback(async (columnId: string) => {
		if (!board || board.columns.length <= 1) return

		const sorted = [...board.columns].sort((a, b) => a.position - b.position)
		const idx = sorted.findIndex((c) => c.id === columnId)
		const targetCol = sorted[idx === 0 ? 1 : idx - 1]
		if (!targetCol) return

		const tasksToMove = tasks.filter((t) => t.column_id === columnId)
		if (tasksToMove.length > 0) {
			const existingCount = tasks.filter((t) => t.column_id === targetCol.id).length
			setTasks((prev) =>
				prev.map((t) => {
					if (t.column_id !== columnId) return t
					const newPos = existingCount + tasksToMove.indexOf(t)
					return { ...t, column_id: targetCol.id, position: newPos }
				})
			)
			for (const t of tasksToMove) {
				services.moveTask(t.id, targetCol.id, existingCount + tasksToMove.indexOf(t)).catch(console.error)
			}
		}

		await services.deleteColumn(columnId)
		setBoard((prev) => {
			if (!prev) return prev
			const remaining = prev.columns
				.filter((c) => c.id !== columnId)
				.sort((a, b) => a.position - b.position)
				.map((c, i) => ({ ...c, position: i }))
			return { ...prev, columns: remaining }
		})
	}, [board, tasks])

	const reorderColumns = useCallback(
		async (columnIds: string[]) => {
			if (!board) return
			setBoard((prev) => {
				if (!prev) return prev
				const columnMap = new Map(prev.columns.map((c) => [c.id, c]))
				const reordered = columnIds
					.map((id, i) => {
						const col = columnMap.get(id)
						return col ? { ...col, position: i } : null
					})
					.filter(Boolean) as Column[]
				return { ...prev, columns: reordered }
			})
			services.reorderColumns(board.id, columnIds).catch(console.error)
		},
		[board]
	)

	const refreshTasks = useCallback(async () => {
		if (!board) return
		const versionBefore = moveVersionRef.current
		const tasksData = await services.getTasks(board.id)
		if (moveVersionRef.current !== versionBefore) return
		setTasks((prev) => {
			const creating = prev.find((t) => t.status === 'creating')
			const moves = localMovesRef.current

			let result = tasksData
			if (moves.size > 0) {
				result = tasksData.map((t) => {
					const override = moves.get(t.id)
					if (!override) return t
					if (t.column_id === override.column_id && t.position === override.position) {
						moves.delete(t.id)
						return t
					}
					return { ...t, column_id: override.column_id, position: override.position }
				})
			}

			if (!creating) return result

			// Determine creating task's intended position (from local move or prev state)
			const creatingMove = moves.get(creating.id)
			const col = creatingMove?.column_id ?? creating.column_id
			const pos = creatingMove?.position ?? creating.position

			// Shift other tasks in the same column to make room for the creating task
			result = result.map((t) => {
				if (t.column_id === col && t.position >= pos) {
					return { ...t, position: t.position + 1 }
				}
				return t
			})

			return [...result, { ...creating, column_id: col, position: pos }]
		})
	}, [board])

	const filteredTasks = useMemo(() => {
		const creatingTask = tasks.find((t) => t.status === 'creating')
		let result = tasks

		if (searchKeyword) {
			const kw = searchKeyword.toLowerCase()
			result = result.filter(
				(t) =>
					t.status === 'creating' ||
					t.title.toLowerCase().includes(kw) ||
					t.description.toLowerCase().includes(kw) ||
					t.tags?.some((tag) => tag.toLowerCase().includes(kw))
			)
		}

		if (statusFilter !== 'all') {
			const statusMap: Record<Exclude<StatusFilter, 'all'>, string[]> = {
				running: ['running'],
				waiting: ['pending', 'waiting_input', 'paused'],
				completed: ['completed'],
				failed: ['failed', 'cancelled']
			}
			const statuses = statusMap[statusFilter]
			result = result.filter((t) => t.status === 'creating' || statuses.includes(t.status))
		}

		if (creatingTask && !result.includes(creatingTask)) {
			result = [...result, creatingTask]
		}

		return result
	}, [tasks, searchKeyword, statusFilter])

	const value = useMemo<KanbanContextValue>(
		() => ({
			board,
			boards,
			currentBoardId,
			tasks,
			filteredTasks,
			loading,
			selectedTaskId,
			detailOpen,
			isAnimating,
			searchKeyword,
			statusFilter,
			is_cn,
			creatingTaskId,
			selectTask,
			closeDetail,
			setSearchKeyword,
			setStatusFilter,
			addTask,
			updateTask,
			moveTask,
			togglePin,
			removeTask,
			addColumn,
			updateColumn: updateColumnFn,
			removeColumn,
			reorderColumns,
			refreshTasks,
			startCreating,
			finalizeCreating,
			cancelCreating,
			triggerAnimation,
			switchBoard,
			createBoard: createBoardFn,
			updateBoard: updateBoardFn,
			deleteBoard: deleteBoardFn,
			createBoardFromTemplate: createBoardFromTemplateFn,
			getBoardTemplates: getBoardTemplatesFn,
			refreshBoards
		}),
		[
			board,
			boards,
			currentBoardId,
			tasks,
			filteredTasks,
			loading,
			selectedTaskId,
			detailOpen,
			isAnimating,
			searchKeyword,
			statusFilter,
			is_cn,
			creatingTaskId,
			selectTask,
			closeDetail,
			addTask,
			updateTask,
			moveTask,
			togglePin,
			removeTask,
			addColumn,
			updateColumnFn,
			removeColumn,
			reorderColumns,
			refreshTasks,
			startCreating,
			finalizeCreating,
			cancelCreating,
			triggerAnimation,
			switchBoard,
			createBoardFn,
			updateBoardFn,
			deleteBoardFn,
			createBoardFromTemplateFn,
			getBoardTemplatesFn,
			refreshBoards
		]
	)

	return <KanbanContext.Provider value={value}>{children}</KanbanContext.Provider>
}

export function useKanbanContext(): KanbanContextValue {
	const ctx = useContext(KanbanContext)
	if (!ctx) {
		throw new Error('useKanbanContext must be used within a KanbanProvider')
	}
	return ctx
}
