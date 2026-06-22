import { useCallback } from 'react'
import { useKanbanContext } from '../context'
import type { CreateTaskData, KanbanTask } from '../types'

const emitError = (msg: string) => {
	window.$app?.Event?.emit('app/toast', { type: 'error', message: msg })
}

export function useTasks() {
	const { tasks, filteredTasks, addTask, updateTask, moveTask, removeTask, refreshTasks, is_cn } =
		useKanbanContext()

	const handleCreateTask = useCallback(
		async (data: CreateTaskData) => {
			try {
				await addTask(data)
			} catch (err: any) {
				emitError(err?.message || (is_cn ? '创建任务失败' : 'Failed to create task'))
			}
		},
		[addTask, is_cn]
	)

	// Pause/Resume are not supported by backend; stop via WS instead
	const handlePauseTask = useCallback(async (_taskId: string) => {}, [])
	const handleResumeTask = useCallback(async (_taskId: string) => {}, [])

	const handleCancelTask = useCallback(
		async (taskId: string) => {
			try {
				await updateTask(taskId, { status: 'cancelled' })
			} catch (err: any) {
				emitError(err?.message || (is_cn ? '取消任务失败' : 'Failed to cancel task'))
			}
		},
		[updateTask, is_cn]
	)

	const handleRetryTask = useCallback(
		async (taskId: string) => {
			try {
				await updateTask(taskId, { status: 'pending', error_message: undefined })
			} catch (err: any) {
				emitError(err?.message || (is_cn ? '重试任务失败' : 'Failed to retry task'))
			}
		},
		[updateTask, is_cn]
	)

	const handleDeleteTask = useCallback(
		async (taskId: string) => {
			try {
				await removeTask(taskId)
			} catch (err: any) {
				emitError(err?.message || (is_cn ? '删除任务失败' : 'Failed to delete task'))
			}
		},
		[removeTask, is_cn]
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
