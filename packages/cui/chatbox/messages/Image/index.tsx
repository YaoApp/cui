import React from 'react'
import type { ImageMessage } from '../../../openapi'

interface IImageProps {
	message: ImageMessage
}

const Image = ({ message }: IImageProps) => {
	return (
		<div style={{ marginBottom: '24px' }}>
			{/* TODO: Implement Image component */}
			<img src={message.props?.url} alt={message.props?.alt || 'Image'} />
		</div>
	)
}

export default Image

