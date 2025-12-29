/**
 * Navigate Back Action
 * Navigate back in history.
 */

export interface NavigateBackPayload {
	steps?: number
}

/**
 * Execute navigate.back action
 */
export const navigateBack = (payload?: NavigateBackPayload): void => {
	const steps = payload?.steps || 1

	if (steps === 1) {
		window.history.back()
	} else {
		window.history.go(-steps)
	}
}

export default navigateBack
