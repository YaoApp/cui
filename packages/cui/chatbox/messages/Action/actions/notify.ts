/**
 * Notify Actions
 * Show notification messages to the user.
 */

import { message } from 'antd'

export interface NotifyPayload {
	message: string
	duration?: number
	icon?: string
	closable?: boolean
}

export type NotifyType = 'success' | 'error' | 'warning' | 'info'

/**
 * Execute notify action
 */
export const notify = (type: NotifyType, payload: NotifyPayload): void => {
	if (!payload?.message) {
		console.warn(`[Action:notify.${type}] Missing message in payload`)
		return
	}

	const { message: content, duration = 3 } = payload

	// Show message based on type
	const config = {
		content,
		duration
	}

	switch (type) {
		case 'success':
			message.success(config)
			break
		case 'error':
			message.error(config)
			break
		case 'warning':
			message.warning(config)
			break
		case 'info':
			message.info(config)
			break
	}
}

export const notifySuccess = (payload: NotifyPayload): void => notify('success', payload)
export const notifyError = (payload: NotifyPayload): void => notify('error', payload)
export const notifyWarning = (payload: NotifyPayload): void => notify('warning', payload)
export const notifyInfo = (payload: NotifyPayload): void => notify('info', payload)

export default notify
