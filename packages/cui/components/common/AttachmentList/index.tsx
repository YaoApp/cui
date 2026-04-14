import React, { useState } from 'react'
import { Tooltip, Spin } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { useFileDownload, type DownloadableFile } from '@/hooks/useFileDownload'
import AttachmentPreviewModal, { type AttachmentPreviewItem } from '../AttachmentPreviewModal'
import styles from './index.less'

export interface AttachmentItem {
	title: string
	file: string
	description?: string
	size?: number
	content_type?: string
}

interface Props {
	attachments: AttachmentItem[]
	showDownloadAll?: boolean
	layout?: 'card' | 'compact'
}

const getFileIcon = (filename: string): string => {
	const ext = filename.split('.').pop()?.toLowerCase()
	switch (ext) {
		case 'pdf':
			return 'material-picture_as_pdf'
		case 'xlsx':
		case 'xls':
		case 'csv':
			return 'material-table_chart'
		case 'md':
		case 'txt':
		case 'log':
			return 'material-article'
		case 'png':
		case 'jpg':
		case 'jpeg':
		case 'gif':
		case 'svg':
		case 'webp':
			return 'material-image'
		case 'mp4':
		case 'avi':
		case 'mov':
		case 'mkv':
		case 'webm':
			return 'material-videocam'
		case 'mp3':
		case 'wav':
		case 'aac':
		case 'flac':
		case 'ogg':
			return 'material-audiotrack'
		case 'json':
		case 'js':
		case 'ts':
		case 'py':
		case 'go':
		case 'java':
			return 'material-code'
		case 'zip':
		case 'rar':
		case '7z':
		case 'tar':
		case 'gz':
			return 'material-folder_zip'
		case 'docx':
		case 'doc':
			return 'material-description'
		case 'pptx':
		case 'ppt':
			return 'material-slideshow'
		default:
			return 'material-description'
	}
}

const formatFileSize = (bytes?: number): string | null => {
	if (bytes == null) return null
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const AttachmentList: React.FC<Props> = ({ attachments, showDownloadAll = true, layout = 'card' }) => {
	const is_cn = getLocale() === 'zh-CN'
	const { downloading, download, downloadAll } = useFileDownload()
	const [previewItem, setPreviewItem] = useState<AttachmentPreviewItem | null>(null)

	if (!attachments || attachments.length === 0) {
		return (
			<div className={styles.empty}>
				<Icon name='material-folder_off' size={48} />
				<span>{is_cn ? '无附件' : 'No attachments'}</span>
			</div>
		)
	}

	const handleDownload = (e: React.MouseEvent, att: AttachmentItem) => {
		e.stopPropagation()
		download(att.file, att.title)
	}

	const handlePreview = (e: React.MouseEvent, att: AttachmentItem) => {
		e.stopPropagation()
		setPreviewItem({ title: att.title, file: att.file, content_type: att.content_type })
	}

	const handleDownloadAll = () => {
		const files: DownloadableFile[] = attachments.map((a) => ({ file: a.file, filename: a.title }))
		downloadAll(files)
	}

	const isCompact = layout === 'compact'

	return (
		<div className={`${styles.wrapper} ${isCompact ? styles.compact : ''}`}>
			<div className={styles.header}>
				<span className={styles.count}>
					{is_cn ? `共 ${attachments.length} 个附件` : `${attachments.length} attachment${attachments.length > 1 ? 's' : ''}`}
				</span>
				{showDownloadAll && attachments.length > 1 && (
					<button className={styles.downloadAllBtn} onClick={handleDownloadAll} disabled={downloading}>
						{downloading ? (
							<>
								<Spin size='small' />
								<span>{is_cn ? '打包中...' : 'Bundling...'}</span>
							</>
						) : (
							<>
								<Icon name='material-download' size={14} />
								<span>{is_cn ? '全部下载' : 'Download All'}</span>
							</>
						)}
					</button>
				)}
			</div>

			<div className={styles.list}>
				{attachments.map((att, idx) => (
					<div key={idx} className={styles.item}>
						<div className={styles.icon}>
							<Icon name={getFileIcon(att.title)} size={isCompact ? 20 : 28} />
						</div>
						<div className={styles.info}>
							<span className={styles.name}>{att.title}</span>
							{!isCompact && att.description && (
								<span className={styles.desc}>{att.description}</span>
							)}
							{formatFileSize(att.size) && (
								<span className={styles.size}>{formatFileSize(att.size)}</span>
							)}
						</div>
						<div className={styles.actions}>
							<Tooltip title={is_cn ? '预览' : 'Preview'}>
								<button className={styles.actionBtn} onClick={(e) => handlePreview(e, att)}>
									<Icon name='material-visibility' size={16} />
								</button>
							</Tooltip>
							<Tooltip title={is_cn ? '下载' : 'Download'}>
								<button className={`${styles.actionBtn} ${styles.primaryBtn}`} onClick={(e) => handleDownload(e, att)}>
									<Icon name='material-download' size={16} />
								</button>
							</Tooltip>
						</div>
					</div>
				))}
			</div>

			<AttachmentPreviewModal
				visible={!!previewItem}
				onClose={() => setPreviewItem(null)}
				attachment={previewItem}
			/>
		</div>
	)
}

export default AttachmentList
