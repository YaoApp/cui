import { useEffect } from 'react'
import type { ActionMessage } from '../../../openapi'
import { executeAction } from './actions'

interface IActionProps {
	message: ActionMessage
}

/**
 * Action Message Component
 * Executes actions triggered by AI assistants or backend services.
 * This component is invisible - it only executes actions.
 */
const Action = ({ message }: IActionProps) => {
	useEffect(() => {
		const { name, payload } = message.props || {}

		if (!name) {
			console.warn('[Action] Missing action name in message:', message)
			return
		}

		// Execute the action
		executeAction(name, payload)
	}, [message])

	// Action messages are invisible - they only execute actions
	return null
}

export default Action
