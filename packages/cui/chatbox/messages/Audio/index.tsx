import React, { useState, useEffect } from 'react'
import { FileAudio } from 'phosphor-react'
import { ParseFileRef, ResolveFileURL } from '@/utils/fileWrapper'
import { AudioPlayer } from '../../components/MessageList/UserMessage/AudioBubble'
import type { AudioMessage } from '../../../openapi'
import styles from '../../components/MessageList/UserMessage/AudioBubble.less'

interface IAudioProps {
	message: AudioMessage
}

const Audio = ({ message }: IAudioProps) => {
	const url = message.props?.url || ''
	const duration = message.props?.duration
	const transcript = message.props?.transcript
	const [blobUrl, setBlobUrl] = useState('')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)

	useEffect(() => {
		if (!url) {
			setLoading(false)
			return
		}

		let currentBlobUrl = ''
		let cancelled = false

		const load = async () => {
			setLoading(true)
			setError(false)
			try {
				const ref = ParseFileRef(url)
				if (ref.type === 'url') {
					if (!cancelled) setBlobUrl(url)
					return
				}

				const resolved = ResolveFileURL(url)
				const resp = await fetch(resolved, { credentials: 'include' })
				if (!resp.ok) throw new Error(`${resp.status}`)
				const blob = await resp.blob()
				currentBlobUrl = URL.createObjectURL(blob)
				if (!cancelled) setBlobUrl(currentBlobUrl)
			} catch {
				if (!cancelled) setError(true)
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		load()

		return () => {
			cancelled = true
			if (currentBlobUrl.startsWith('blob:')) {
				URL.revokeObjectURL(currentBlobUrl)
			}
		}
	}, [url])

	if (!url) {
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

	if (loading) {
		return (
			<div className={`${styles.audioBubble} ${styles.inline} ${styles.loading}`} style={{ marginBottom: 24 }}>
				<FileAudio size={24} className={styles.loadingIcon} />
				<span>Loading audio...</span>
			</div>
		)
	}

	if (error || !blobUrl) {
		return (
			<div className={`${styles.audioBubble} ${styles.inline} ${styles.error}`} style={{ marginBottom: 24 }}>
				<FileAudio size={24} className={styles.errorIcon} />
				<span>Failed to load audio</span>
			</div>
		)
	}

	return (
		<div style={{ marginBottom: 24 }}>
			<AudioPlayer
				src={blobUrl}
				duration={duration}
				filename={url.split('/').pop()}
				downloadUrl={url}
				transcript={transcript}
			/>
		</div>
	)
}

export default Audio
