import React, { useMemo } from 'react'
import { ResolveFileURL } from '@/utils/fileWrapper'
import type { AudioMessage } from '../../../openapi'

interface IAudioProps {
	message: AudioMessage
}

const Audio = ({ message }: IAudioProps) => {
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
				No audio URL
			</div>
		)
	}

	return (
		<div style={{ marginBottom: 24 }}>
			<audio src={resolvedUrl} controls style={{ width: '100%' }} />
		</div>
	)
}

export default Audio
