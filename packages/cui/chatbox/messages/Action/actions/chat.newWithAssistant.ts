/**
 * Chat New With Assistant Action
 * Open a new chat session with a specific assistant.
 *
 * This action is typically triggered by an embedded SUI page (e.g., Keeper)
 * via postMessage to start a conversation with the assistant.
 */

export interface ChatNewWithAssistantPayload {
	assistant_id: string
}

/**
 * Execute chat.newWithAssistant action
 */
export const chatNewWithAssistant = (payload: ChatNewWithAssistantPayload): void => {
	if (!payload?.assistant_id) {
		console.warn('[Action:chat.newWithAssistant] Missing assistant_id in payload')
		return
	}

	const { assistant_id } = payload

	// Emit the internal CUI event to open a new chat with the specified assistant
	window.$app?.Event?.emit('chat/newWithAssistant', assistant_id)
}

export default chatNewWithAssistant
