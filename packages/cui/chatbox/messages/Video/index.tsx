import React, { useMemo } from 'react'
import { ResolveFileURL } from '@/utils/fileWrapper'
import type { VideoMessage } from '../../../openapi'

interface IVideoProps {
	message: VideoMessage
}

const Video = ({ message }: IVideoProps) => {
	const url = message.props?.url || ''
	const resolvedUrl = useMemo(() => {
		if (!url) return ''
		return url.startsWith('workspace://') ? ResolveFileURL(url) : url
	}, [url])

	if (!resolvedUrl) {
		return (
			<div
				style={{
					marginBottom: 24,
					padding: '12px 16px',
					background: 'var(--color_bg_field)',
					borderRadius: 'var(--radius)',
					color: 'var(--color_text_grey)',
					fontSize: 13
				}}
			>
				No video URL
			</div>
		)
	}

	return (
		<div style={{ marginBottom: 24 }}>
			<video
				src={resolvedUrl}
				controls
				style={{
					maxWidth: '100%',
					height: 'auto',
					borderRadius: 'var(--radius)',
					border: '1px solid var(--color_border_soft)'
				}}
			/>
		</div>
	)
}

export default Video
