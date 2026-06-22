/**
 * Event Emit Action
 * Generic custom event dispatch through the application event bus.
 */

export interface EventEmitPayload {
	event: string
	data?: Record<string, any>
}

const eventEmit = (payload?: EventEmitPayload) => {
	if (!payload?.event) return
	window.$app?.Event?.emit(payload.event, payload.data || {})
}

export default eventEmit
