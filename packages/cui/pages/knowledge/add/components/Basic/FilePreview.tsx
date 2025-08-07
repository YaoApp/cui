import React from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from '../../index.less'

interface FilePreviewProps {
	data: {
		file: File
		name: string
		size: number
	}
}

const FilePreview: React.FC<FilePreviewProps> = ({ data }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 B'
		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	const getFileIcon = (fileName: string): string => {
		const ext = fileName.split('.').pop()?.toLowerCase()
		switch (ext) {
			case 'pdf':
				return 'material-picture_as_pdf'
			case 'doc':
			case 'docx':
				return 'material-description'
			case 'xls':
			case 'xlsx':
				return 'material-table_chart'
			case 'ppt':
			case 'pptx':
				return 'material-slideshow'
			case 'txt':
				return 'material-text_snippet'
			case 'md':
				return 'material-article'
			default:
				return 'material-insert_drive_file'
		}
	}

	return (
		<div className={styles.filePreview}>
			<div className={styles.fileInfo}>
				<div className={styles.fileIcon}>
					<Icon name={getFileIcon(data.name)} size={20} />
				</div>
				<div className={styles.fileDetails}>
					<div className={styles.fileName}>{data.name}</div>
					<div className={styles.fileSize}>
						{formatFileSize(data.size)} • {is_cn ? '已选择' : 'Selected'}
					</div>
				</div>
			</div>

			<div className={styles.fileContent}>
				<div className={styles.contentLabel}>{is_cn ? '文件内容预览' : 'File Content Preview'}</div>
				<div className={styles.contentPreview}>
					{is_cn
						? '文件内容将在处理后显示。支持的格式包括 PDF、Word、Excel、PowerPoint、文本文件等。'
						: 'File content will be displayed after processing. Supported formats include PDF, Word, Excel, PowerPoint, text files, etc.'}
				</div>
			</div>
		</div>
	)
}

export default FilePreview
