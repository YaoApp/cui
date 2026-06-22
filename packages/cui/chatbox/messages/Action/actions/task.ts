/**
 * Task-specific Actions
 * Actions pushed by the Agent during task execution.
 */

export interface TaskRefreshPayload {
	chat_id: string
	paths?: string[]
}

export interface TaskOpenPreviewPayload {
	url: string
	title?: string
}

export interface TaskInputRequiredPayload {
	id: string
	prompt: string
	options?: Array<{ label: string; value: string }>
}

export const taskRefreshServices = (payload?: TaskRefreshPayload) => {
	if (!payload?.chat_id) return
	window.$app?.Event?.emit('task/refresh_services', payload)
}

export const taskRefreshFiles = (payload?: TaskRefreshPayload) => {
	if (!payload?.chat_id) return
	window.$app?.Event?.emit('task/refresh_files', payload)
}

export const taskRefreshProcesses = (payload?: TaskRefreshPayload) => {
	if (!payload?.chat_id) return
	window.$app?.Event?.emit('task/refresh_processes', payload)
}

export const taskOpenPreview = (payload?: TaskOpenPreviewPayload) => {
	if (!payload?.url) return
	// Open preview in a new tab or embedded frame
	window.$app?.Event?.emit('task/open_preview', payload)
}

export const taskInputRequired = (payload?: TaskInputRequiredPayload) => {
	if (!payload?.id) return
	window.$app?.Event?.emit('task/input_required', payload)
}
