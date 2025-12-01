import React from 'react'
import type { VideoMessage } from '../../../openapi'

interface IVideoProps {
	message: VideoMessage
}

const Video = ({ message }: IVideoProps) => {
	return (
		<div>
			{/* TODO: Implement Video component */}
			<video src={message.props?.url} controls />
		</div>
	)
}

export default Video

