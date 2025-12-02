import React, { useState, useEffect } from 'react'
import clsx from 'clsx'
import { FileText, Image as ImageIcon, DownloadSimple } from 'phosphor-react'
import type { Message } from '../../../../openapi'
import { FileAPI } from '../../../../openapi'
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

// Parse attachment URL (e.g., "__yao.attachment://fileID")
const parseAttachmentURL = (url: string): { uploaderID: string; fileID: string } | null => {
	const match = url.match(/^([^:]+):\/\/(.+)$/)
	if (!match) return null
	return {
		uploaderID: match[1],
		fileID: match[2]
	}
}

// Component to handle image attachment with URL resolution
const ImageAttachment: React.FC<{ url: string }> = ({ url }) => {
	const [blobUrl, setBlobUrl] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)

	useEffect(() => {
		let currentBlobUrl: string | null = null

		const loadImage = async () => {
			// Check if it's an attachment URL that needs resolution
			const parsed = parseAttachmentURL(url)
			if (!parsed) {
				// Direct URL, use as-is
				setBlobUrl(url)
				setLoading(false)
				return
			}

			// Load via FileAPI
			try {
				if (!window.$app?.openapi) {
					throw new Error('OpenAPI not initialized')
				}

				const fileApi = new FileAPI(window.$app.openapi, parsed.uploaderID)
				const response = await fileApi.Download(parsed.fileID, parsed.uploaderID)

				if (window.$app.openapi.IsError(response) || !response.data) {
					throw new Error('Failed to download image')
				}

				const blob = response.data
				const objectUrl = URL.createObjectURL(blob)
				currentBlobUrl = objectUrl
				setBlobUrl(objectUrl)
				setLoading(false)
			} catch (err) {
				console.error('Failed to load image:', err)
				setError(true)
				setLoading(false)
			}
		}

		loadImage()

		// Cleanup blob URL on unmount
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

// Component to handle file attachment
const FileAttachment: React.FC<{ url: string; filename?: string }> = ({ url, filename }) => {
	const parsed = parseAttachmentURL(url)
	const displayName = filename || parsed?.fileID || 'file'
	const [downloading, setDownloading] = useState(false)

	const handleDownload = async () => {
		if (downloading) return

		setDownloading(true)
		try {
			// Check if it's an attachment URL that needs resolution
			if (!parsed) {
				// Direct URL, try to download directly
				window.open(url, '_blank')
				return
			}

			// Load via FileAPI
			if (!window.$app?.openapi) {
				throw new Error('OpenAPI not initialized')
			}

			const fileApi = new FileAPI(window.$app.openapi, parsed.uploaderID)
			const response = await fileApi.Download(parsed.fileID, parsed.uploaderID)

			if (window.$app.openapi.IsError(response) || !response.data) {
				throw new Error('Failed to download file')
			}

			// Create blob URL and trigger download
			const blob = response.data
			const blobUrl = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = blobUrl
			link.download = displayName
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)

			// Cleanup
			setTimeout(() => {
				URL.revokeObjectURL(blobUrl)
			}, 100)
		} catch (err) {
			console.error('Failed to download file:', err)
			alert('Failed to download file')
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
