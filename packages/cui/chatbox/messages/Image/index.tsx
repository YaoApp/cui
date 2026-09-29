import React, { useState, useMemo } from 'react'
import { ResolveFileURL } from '@/utils/fileWrapper'
import ImagePreview from '@/components/view/ImagePreview'
import type { ImageMessage } from '../../../openapi'

interface IImageProps {
	message: ImageMessage
}

const Image = ({ message }: IImageProps) => {
	const [errored, setErrored] = useState(false)
	const [preview, setPreview] = useState(false)
	const url = message.props?.url || ''
	const alt = message.props?.alt || 'Image'

	const resolvedUrl = useMemo(() => {
		if (!url) return ''
		return url.startsWith('workspace://') ? ResolveFileURL(url) : url
	}, [url])

	if (!resolvedUrl || errored) {
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
				{errored ? 'Failed to load image' : 'No image URL'}
			</div>
		)
	}

	return (
		<div style={{ marginBottom: 24 }}>
			<img
				src={resolvedUrl}
				alt={alt}
				style={{
					maxWidth: '100%',
					height: 'auto',
					borderRadius: 'var(--radius)',
					border: '1px solid var(--color_border_soft)',
					cursor: 'pointer'
				}}
				onClick={() => setPreview(true)}
				onError={() => setErrored(true)}
			/>
			{preview && <ImagePreview src={resolvedUrl} fileName={alt} onClose={() => setPreview(false)} />}
		</div>
	)
}

export default Image
