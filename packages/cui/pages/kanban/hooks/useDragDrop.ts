import { useState, useCallback, useMemo } from 'react'
import { PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import type { KanbanTask } from '../types'

interface UseDragDropOptions {
	tasks: KanbanTask[]
	onMove: (taskId: string, columnId: string, position: number) => Promise<void>
}

export function useDragDrop({ tasks, onMove }: UseDragDropOptions) {
	const [activeId, setActiveId] = useState<string | null>(null)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 }
		})
	)

	const activeTask = useMemo(() => {
		if (!activeId) return null
		return tasks.find((t) => t.id === activeId) || null
	}, [activeId, tasks])

	const getColumnTasks = useCallback(
		(columnId: string) => tasks.filter((t) => t.column_id === columnId).sort((a, b) => a.position - b.position),
		[tasks]
	)

	const findColumnForTask = useCallback(
		(taskId: string) => tasks.find((t) => t.id === taskId)?.column_id || null,
		[tasks]
	)

	const handleDragStart = useCallback((event: DragStartEvent) => {
		setActiveId(String(event.active.id))
	}, [])

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event
			setActiveId(null)
			if (!over) return

			const activeTaskId = String(active.id)
			const overId = String(over.id)

			let targetColumnId: string | null = null
			let targetPosition = 0

			if (overId.startsWith('column-')) {
				targetColumnId = overId.replace('column-', '')
				targetPosition = getColumnTasks(targetColumnId).length
			} else {
				targetColumnId = findColumnForTask(overId)
				if (targetColumnId) {
					const colTasks = getColumnTasks(targetColumnId)
					const overIndex = colTasks.findIndex((t) => t.id === overId)
					targetPosition = overIndex >= 0 ? overIndex : colTasks.length
				}
			}

			if (targetColumnId) {
				onMove(activeTaskId, targetColumnId, targetPosition)
			}
		},
		[getColumnTasks, findColumnForTask, onMove]
	)

	return { sensors, activeId, activeTask, handleDragStart, handleDragEnd, getColumnTasks }
}
