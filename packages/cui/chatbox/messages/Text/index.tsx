import React from 'react'
import type { TextMessage } from '../../../openapi'

interface ITextProps {
	message: TextMessage
}

const Text = ({ message }: ITextProps) => {
	return (
		<div>
			{/* TODO: Implement Text component with Markdown support */}
			<p>{message.props?.content || ''}</p>
		</div>
	)
}

export default Text

