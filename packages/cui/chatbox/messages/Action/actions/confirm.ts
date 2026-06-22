/**
 * Confirm Action
 * Agent requests user confirmation before proceeding.
 * Displays a confirmation dialog and resolves via WS confirm command.
 */

export interface ConfirmPayload {
	id: string
	title: string
	content: string
	ok_text?: string
	cancel_text?: string
}

// Pending confirm callbacks, keyed by confirm id
const pendingConfirms = new Map<string, (choice: string) => void>()

export function registerConfirmResolver(id: string, resolver: (choice: string) => void) {
	pendingConfirms.set(id, resolver)
}

export function resolveConfirm(id: string, choice: string) {
	const resolver = pendingConfirms.get(id)
	if (resolver) {
		resolver(choice)
		pendingConfirms.delete(id)
	}
}

const confirm = (payload?: ConfirmPayload) => {
	if (!payload?.id) return

	// Emit a custom event that the TaskDetail component can listen to
	window.$app?.Event?.emit('task/confirm', {
		id: payload.id,
		title: payload.title,
		content: payload.content,
		ok_text: payload.ok_text || 'Confirm',
		cancel_text: payload.cancel_text || 'Cancel'
	})
}

export default confirm
