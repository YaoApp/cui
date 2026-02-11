/**
 * Action handlers registry
 */

import navigate, { NavigatePayload } from './navigate'
import navigateBack, { NavigateBackPayload } from './navigate.back'
import appMenuReload from './app.menu.reload'
import { notifySuccess, notifyError, notifyWarning, notifyInfo, NotifyPayload } from './notify'
import chatNewWithAssistant, { ChatNewWithAssistantPayload } from './chat.newWithAssistant'

export type ActionPayload = NavigatePayload | NavigateBackPayload | NotifyPayload | ChatNewWithAssistantPayload | undefined

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

	// App
	'app.menu.reload': appMenuReload,

	// Notify
	'notify.success': notifySuccess,
	'notify.error': notifyError,
	'notify.warning': notifyWarning,
	'notify.info': notifyInfo,

	// Chat
	'chat.newWithAssistant': chatNewWithAssistant
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
