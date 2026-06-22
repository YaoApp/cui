/**
 * Action handlers registry
 */

import navigate, { NavigatePayload } from './navigate'
import navigateBack, { NavigateBackPayload } from './navigate.back'
import navigateReplace, { NavigateReplacePayload } from './navigate.replace'
import appMenuReload from './app.menu.reload'
import { notifySuccess, notifyError, notifyWarning, notifyInfo, NotifyPayload } from './notify'
import chatNewWithAssistant, { ChatNewWithAssistantPayload } from './chat.newWithAssistant'
import robotExecute, { RobotExecutePayload } from './robot.execute'
import confirm, { ConfirmPayload } from './confirm'
import eventEmit, { EventEmitPayload } from './event.emit'
import {
	taskRefreshServices,
	taskRefreshFiles,
	taskRefreshProcesses,
	taskOpenPreview,
	taskInputRequired
} from './task'

export type ActionPayload = NavigatePayload | NavigateBackPayload | NavigateReplacePayload | NotifyPayload | ChatNewWithAssistantPayload | RobotExecutePayload | ConfirmPayload | EventEmitPayload | undefined

export interface ActionHandler {
	(payload?: any): void
}

/**
 * Action handlers map
 */
export const actionHandlers: Record<string, ActionHandler> = {
	// Navigate
	navigate,
	'navigate.back': navigateBack,
	'navigate.replace': navigateReplace,

	// App
	'app.menu.reload': appMenuReload,

	// Notify
	'notify.success': notifySuccess,
	'notify.error': notifyError,
	'notify.warning': notifyWarning,
	'notify.info': notifyInfo,

	// Chat
	'chat.newWithAssistant': chatNewWithAssistant,

	// Robot
	'robot.execute': robotExecute,

	// Confirm (Agent requests user confirmation)
	confirm,

	// Event (Generic custom event dispatch)
	'event.emit': eventEmit,

	// Task-specific actions
	'task.refresh_services': taskRefreshServices,
	'task.refresh_files': taskRefreshFiles,
	'task.refresh_processes': taskRefreshProcesses,
	'task.open_preview': taskOpenPreview,
	'task.input_required': taskInputRequired
}

/**
 * Execute an action by name
 */
export const executeAction = (name: string, payload?: any): boolean => {
	const handler = actionHandlers[name]
	if (!handler) {
		console.warn(`[Action] Unknown action: ${name}`)
		return false
	}

	try {
		handler(payload)
		return true
	} catch (error) {
		console.error(`[Action] Failed to execute action "${name}":`, error)
		return false
	}
}

export default executeAction
