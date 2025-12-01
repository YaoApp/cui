import React from 'react'
import type { ActionMessage } from '../../../openapi'

interface IActionProps {
	message: ActionMessage
}

const Action = ({ message }: IActionProps) => {
	return (
		<div>
			{/* TODO: Implement Action component */}
			<p>Action: {message.props?.action || 'Unknown'}</p>
		</div>
	)
}

export default Action

