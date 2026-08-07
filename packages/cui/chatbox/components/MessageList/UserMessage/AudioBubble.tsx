import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { message, Dropdown } from 'antd'
import { getLocale } from '@umijs/max'
import { Play, Pause, DownloadSimple } from 'phosphor-react'
import { ParseFileRef, ResolveFileURL } from '@/utils/fileWrapper'
import { FileAPI } from '@/openapi'
import Icon from '../../../../widgets/Icon'
import type { ContentPart } from '../../../utils/media'
import styles from './AudioBubble.less'

function formatTime(seconds: number): string {
	if (!isFinite(seconds) || seconds < 0) return '0:00'
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = Math.floor(seconds % 60)
	if (h > 0) {
		return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
	}
	return `${m}:${s.toString().padStart(2, '0')}`
}

// ======== AudioPlayer (used by AI audio messages — do not remove) ========

export interface AudioPlayerProps {
	src: string
	duration?: number
	standalone?: boolean
	filename?: string
	downloadUrl?: string
	transcript?: string
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
	src,
	duration: initialDuration,
	standalone,
	filename,
	downloadUrl,
	transcript
}) => {
	const audioRef = useRef<HTMLAudioElement>(null)
	const [playing, setPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(initialDuration ?? 0)
	const [downloading, setDownloading] = useState(false)

	useEffect(() => {
		if (initialDuration) setDuration(initialDuration)
	}, [initialDuration])

	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return

		const onTimeUpdate = () => setCurrentTime(audio.currentTime)
		const onLoadedMetadata = () => {
			if (!initialDuration && audio.duration && isFinite(audio.duration)) {
				setDuration(audio.duration)
			}
		}
		const onEnded = () => setPlaying(false)
		const onPlay = () => setPlaying(true)
		const onPause = () => setPlaying(false)

		audio.addEventListener('timeupdate', onTimeUpdate)
		audio.addEventListener('loadedmetadata', onLoadedMetadata)
		audio.addEventListener('ended', onEnded)
		audio.addEventListener('play', onPlay)
		audio.addEventListener('pause', onPause)

		return () => {
			audio.removeEventListener('timeupdate', onTimeUpdate)
			audio.removeEventListener('loadedmetadata', onLoadedMetadata)
			audio.removeEventListener('ended', onEnded)
			audio.removeEventListener('play', onPlay)
			audio.removeEventListener('pause', onPause)
		}
	}, [src, initialDuration])

	const togglePlay = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return
		if (playing) {
			audio.pause()
		} else {
			document.querySelectorAll('audio').forEach((el) => {
				if (el !== audio) el.pause()
			})
			audio.play().catch(() => {})
		}
	}, [playing])

	const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
		const audio = audioRef.current
		if (!audio) return
		const time = parseFloat(e.target.value)
		audio.currentTime = time
		setCurrentTime(time)
	}

	const handleDownload = async () => {
		if (downloading) return
		setDownloading(true)
		try {
			let blob: Blob
			if (src.startsWith('blob:')) {
				const resp = await fetch(src)
				blob = await resp.blob()
			} else {
				const url = downloadUrl ? ResolveFileURL(downloadUrl) : src
				const resp = await fetch(url, { credentials: 'include' })
				if (!resp.ok) throw new Error(`${resp.status}`)
				blob = await resp.blob()
			}
			const blobUrl = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = blobUrl
			link.download = filename || 'audio'
			link.style.display = 'none'
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
		} catch {
			message.error(getLocale() === 'zh-CN' ? '下载失败' : 'Download failed')
		} finally {
			setDownloading(false)
		}
	}

	return (
		<div className={`${styles.audioBubble} ${standalone ? styles.standalone : styles.inline}`}>
			<audio ref={audioRef} src={src} preload='metadata' />
			<button
				type='button'
				className={styles.playButton}
				onClick={togglePlay}
				aria-label={playing ? 'Pause' : 'Play'}
			>
				{playing ? (
					<Pause size={standalone ? 20 : 16} weight='fill' />
				) : (
					<Play size={standalone ? 20 : 16} weight='fill' />
				)}
			</button>
			<div className={styles.playerBody}>
				<input
					type='range'
					className={styles.progressBar}
					min={0}
					max={duration || 0}
					step={0.1}
					value={currentTime}
					onChange={handleSeek}
				/>
				<div className={styles.timeRow}>
					<span className={styles.time}>{formatTime(currentTime)}</span>
					<span className={styles.timeDivider}>/</span>
					<span className={styles.time}>{formatTime(duration)}</span>
				</div>
				{transcript && <div className={styles.transcript}>{transcript}</div>}
			</div>
			<button
				type='button'
				className={styles.downloadButton}
				onClick={handleDownload}
				aria-label='Download'
				disabled={downloading}
			>
				<DownloadSimple size={16} />
			</button>
		</div>
	)
}

// ======== WeChat-style voice bubble (user-sent voice messages) ========

interface AudioBubbleProps {
	part: ContentPart
	standalone?: boolean
}

const AudioBubble: React.FC<AudioBubbleProps> = ({ part, standalone }) => {
	const audioRef = useRef<HTMLAudioElement>(null)
	const blobUrlRef = useRef<string | null>(null)
	const [playing, setPlaying] = useState(false)
	const [error, setError] = useState(false)
	const [duration, setDuration] = useState(0)
	const [downloadUrl, setDownloadUrl] = useState<string>()
	const [filename, setFilename] = useState<string>()

	const fileUrl = part.type === 'file' ? part.file?.url : undefined
	const inputAudioData = part.type === 'input_audio' ? part.input_audio?.data : undefined

	// Load audio source
	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return
		let cancelled = false

		// Revoke previous blob URL if any
		if (blobUrlRef.current) {
			URL.revokeObjectURL(blobUrlRef.current)
			blobUrlRef.current = null
		}

		if (part.type === 'input_audio' && part.input_audio) {
			const { data, format } = part.input_audio
			const binary = atob(data)
			const bytes = new Uint8Array(binary.length)
			for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
			const blob = new Blob([bytes], { type: `audio/${format || 'mp4'}` })
			const url = URL.createObjectURL(blob)
			blobUrlRef.current = url
			audio.src = url
			return
		}

		if (part.type === 'file' && part.file?.url) {
			setFilename(part.file.filename)
			setDownloadUrl(part.file.url)

			const resolvedUrl = ResolveFileURL(part.file.url)
			audio.src = resolvedUrl

			// Fetch duration from API if available
			const ref = ParseFileRef(part.file.url)
			if (ref.type === 'wrapper' && ref.fileID && window.$app?.openapi) {
				const fileApi = new FileAPI(window.$app.openapi, ref.uploaderID)
				fileApi
					.Retrieve(ref.fileID, ref.uploaderID)
					.then((info) => {
						if (info?.data?.duration && !cancelled) {
							setDuration(info.data.duration)
						}
					})
					.catch(() => {})
			}
			return
		}

		return () => {
			cancelled = true
			audio.pause()
			audio.removeAttribute('src')
			audio.load()
			if (blobUrlRef.current) {
				URL.revokeObjectURL(blobUrlRef.current)
				blobUrlRef.current = null
			}
		}
	}, [fileUrl, inputAudioData])

	// Audio event listeners
	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return

		const onLoadedMetadata = () => {
			if (audio.duration && isFinite(audio.duration)) {
				setDuration((prev) => Math.max(prev, audio.duration))
			}
		}
		const onEnded = () => setPlaying(false)
		const onPlay = () => setPlaying(true)
		const onPause = () => setPlaying(false)
		const onError = () => {
			if (audio.src) {
				console.error('Audio playback error:', audio.error)
				setError(true)
			}
		}

		audio.addEventListener('loadedmetadata', onLoadedMetadata)
		audio.addEventListener('ended', onEnded)
		audio.addEventListener('play', onPlay)
		audio.addEventListener('pause', onPause)
		audio.addEventListener('error', onError)

		return () => {
			audio.removeEventListener('loadedmetadata', onLoadedMetadata)
			audio.removeEventListener('ended', onEnded)
			audio.removeEventListener('play', onPlay)
			audio.removeEventListener('pause', onPause)
			audio.removeEventListener('error', onError)
		}
	}, [])

	const togglePlay = useCallback(() => {
		const audio = audioRef.current
		if (!audio || error) return
		if (playing) {
			audio.pause()
		} else {
			document.querySelectorAll('audio').forEach((el) => {
				if (el !== audio) el.pause()
			})
			audio.play().catch((err) => {
				console.error('Audio playback failed:', err)
				message.error('播放失败')
			})
		}
	}, [playing, error])

	const handleDownload = useCallback(async () => {
		try {
			const url = downloadUrl ? ResolveFileURL(downloadUrl) : blobUrlRef.current
			if (!url) return
			const resp = await fetch(url, { credentials: 'include' })
			if (!resp.ok) throw new Error(`${resp.status}`)
			const blob = await resp.blob()
			const blobUrl = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = blobUrl
			link.download = filename || 'voice.m4a'
			link.style.display = 'none'
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
		} catch {
			message.error(is_cn ? '下载失败' : 'Download failed')
		}
	}, [downloadUrl, filename])

	const is_cn = getLocale() === 'zh-CN'

	const contextMenu = useMemo(
		() => ({
			items: [
				{
					key: 'download',
					label: (
						<span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
							<Icon name='material-download' size={14} />
							{is_cn ? '下载语音' : 'Download'}
						</span>
					)
				}
			],
			onClick: () => handleDownload()
		}),
		[handleDownload, is_cn]
	)

	const durationSec = Math.floor(duration)
	const bubbleWidth =
		duration > 0 ? Math.min(210, Math.max(88, 88 + Math.min(duration, 60) * 2)) : 88

	const cls = [
		styles.voiceBubble,
		standalone ? styles.voiceStandalone : styles.voiceInline,
		playing && styles.voicePlaying,
		error && styles.voiceError
	]
		.filter(Boolean)
		.join(' ')

	return (
		<Dropdown menu={contextMenu} trigger={['contextMenu']}>
			<div
				className={cls}
				style={{ width: bubbleWidth }}
				onClick={error ? undefined : togglePlay}
				role='button'
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						if (!error) togglePlay()
					}
				}}
			>
				<audio ref={audioRef} preload='none' style={{ display: 'none' }} />
				<span className={styles.voiceDuration}>
					{durationSec > 0 ? `${durationSec}\u2033` : '--\u2033'}
				</span>
				{playing ? (
					<Icon name='pause-filled' size={20} className={styles.voiceIcon} />
				) : (
					<Icon name='graphic_eq-filled' size={20} className={styles.voiceIcon} />
				)}
			</div>
		</Dropdown>
	)
}

export default AudioBubble
