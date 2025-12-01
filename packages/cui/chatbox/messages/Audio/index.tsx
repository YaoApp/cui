import React from 'react'
import type { AudioMessage } from '../../../openapi'

interface IAudioProps {
	message: AudioMessage
}

const Audio = ({ message }: IAudioProps) => {
	return (
		<div style={{ marginBottom: '24px' }}>
			{/* TODO: Implement Audio component */}
			<audio src={message.props?.url} controls />
		</div>
	)
}

export default Audio
