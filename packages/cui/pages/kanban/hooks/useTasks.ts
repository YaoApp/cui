import { useCallback } from 'react'
import { useKanbanContext } from '../context'
import type { CreateTaskData, KanbanTask } from '../types'

export function useTasks() {
	const { tasks, filteredTasks, addTask, updateTask, moveTask, removeTask, refreshTasks, is_cn } =
		useKanbanContext()

	const handleCreateTask = useCallback(
		async (data: CreateTaskData) => {
			await addTask(data)
		},
		[addTask]
	)

	const handlePauseTask = useCallback(
		async (taskId: string) => {
			await updateTask(taskId, { status: 'paused' })
		},
		[updateTask]
	)

	const handleResumeTask = useCallback(
		async (taskId: string) => {
			await updateTask(taskId, { status: 'running' })
		},
		[updateTask]
	)

	const handleCancelTask = useCallback(
		async (taskId: string) => {
			await updateTask(taskId, { status: 'cancelled' })
		},
		[updateTask]
	)

	const handleRetryTask = useCallback(
		async (taskId: string) => {
			await updateTask(taskId, { status: 'pending', error_message: undefined })
		},
		[updateTask]
	)

	const handleDeleteTask = useCallback(
		async (taskId: string) => {
			await removeTask(taskId)
		},
		[removeTask]
	)

	return {
		tasks,
		filteredTasks,
		handleCreateTask,
		handlePauseTask,
		handleResumeTask,
		handleCancelTask,
		handleRetryTask,
		handleDeleteTask,
		moveTask,
		refreshTasks,
		is_cn
	}
}
