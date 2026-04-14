import React, { useState, useEffect } from 'react'
import clsx from 'clsx'
import { message } from 'antd'
import { FileText, Image as ImageIcon, DownloadSimple } from 'phosphor-react'
import type { Message } from '../../../../openapi'
import { ParseFileRef, ResolveFileURL } from '@/utils/fileWrapper'
import styles from './index.less'

interface IUserMessageProps {
	message: Message
	isLast?: boolean
}

interface ContentPart {
	type: 'text' | 'image_url' | 'file'
	text?: string
	image_url?: {
		url: string
		detail?: string
	}
	file?: {
		url: string
		filename?: string
	}
}

const ImageAttachment: React.FC<{ url: string }> = ({ url }) => {
	const [blobUrl, setBlobUrl] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)

	useEffect(() => {
		let currentBlobUrl: string | null = null

		const loadImage = async () => {
			const ref = ParseFileRef(url)
			if (ref.type === 'url') {
				setBlobUrl(url)
				setLoading(false)
				return
			}

			const resolvedUrl = ResolveFileURL(url)
			try {
				const resp = await fetch(resolvedUrl, { credentials: 'include' })
				if (!resp.ok) throw new Error(`${resp.status}`)
				const blob = await resp.blob()
				const objectUrl = URL.createObjectURL(blob)
				currentBlobUrl = objectUrl
				setBlobUrl(objectUrl)
			} catch {
				setError(true)
			} finally {
				setLoading(false)
			}
		}

		loadImage()

		return () => {
			if (currentBlobUrl && currentBlobUrl.startsWith('blob:')) {
				URL.revokeObjectURL(currentBlobUrl)
			}
		}
	}, [url])

	const handleImageClick = () => {
		if (blobUrl) {
			window.open(blobUrl, '_blank')
		}
	}

	if (loading) {
		return (
			<div className={styles.attachmentPlaceholder}>
				<ImageIcon size={24} className={styles.iconPlaceholder} />
				<span>Loading image...</span>
			</div>
		)
	}

	if (error || !blobUrl) {
		return (
			<div className={styles.attachmentError}>
				<ImageIcon size={24} className={styles.iconError} />
				<span>Failed to load image</span>
			</div>
		)
	}

	return (
		<img
			src={blobUrl}
			alt='Uploaded image'
			className={styles.attachmentImage}
			onClick={handleImageClick}
			style={{ cursor: 'pointer' }}
		/>
	)
}

const FileAttachment: React.FC<{ url: string; filename?: string }> = ({ url, filename }) => {
	const ref = ParseFileRef(url)
	const displayName = filename || ref.fileID || url.split('/').pop() || 'file'
	const [downloading, setDownloading] = useState(false)

	const handleDownload = async () => {
		if (downloading) return
		setDownloading(true)
		try {
			const resolvedUrl = ResolveFileURL(url)
			const resp = await fetch(resolvedUrl, { credentials: 'include' })
			if (!resp.ok) throw new Error(`${resp.status}`)
			const blob = await resp.blob()
			const blobUrl = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = blobUrl
			link.download = displayName
			link.style.display = 'none'
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
		} catch {
			message.error('Failed to download file')
		} finally {
			setDownloading(false)
		}
	}

	return (
		<div className={styles.fileAttachment} onClick={handleDownload}>
			<div className={styles.fileIconWrapper}>
				<FileText size={24} weight='duotone' />
			</div>
			<div className={styles.fileInfo}>
				<span className={styles.fileName} title={displayName}>
					{displayName}
				</span>
				<span className={styles.fileMeta}>{downloading ? 'Downloading...' : 'Click to download'}</span>
			</div>
			<div className={styles.downloadIcon}>
				<DownloadSimple size={16} />
			</div>
		</div>
	)
}

const UserMessage = ({ message, isLast }: IUserMessageProps) => {
	const content = message.props?.content

	// Handle string content (plain text)
	if (typeof content === 'string') {
		return (
			<div className={clsx(styles.userRow)} style={{ marginBottom: '16px' }}>
				<div className={styles.messageBubble}>
					<div className={styles.messageContent}>{content}</div>
				</div>
			</div>
		)
	}

	// Handle array content (multimodal: text + attachments)
	if (Array.isArray(content)) {
		return (
			<div className={clsx(styles.userRow)} style={{ marginBottom: '16px' }}>
				<div className={styles.messageBubble}>
					{content.map((part: ContentPart, index: number) => {
						if (part.type === 'text' && part.text) {
							return (
								<div key={index} className={styles.messageContent}>
									{part.text}
								</div>
							)
						}

						if (part.type === 'image_url' && part.image_url?.url) {
							return (
								<div key={index} className={styles.attachmentItem}>
									<ImageAttachment url={part.image_url.url} />
								</div>
							)
						}

						if (part.type === 'file' && part.file?.url) {
							return (
								<div key={index} className={styles.attachmentItem}>
									<FileAttachment
										url={part.file.url}
										filename={part.file.filename}
									/>
								</div>
							)
						}

						return null
					})}
				</div>
			</div>
		)
	}

	// Fallback for other content types
	return (
		<div className={clsx(styles.userRow)} style={{ marginBottom: '16px' }}>
			<div className={styles.messageBubble}>
				<div className={styles.messageContent}>{JSON.stringify(content, null, 2)}</div>
			</div>
		</div>
	)
}

export default UserMessage
