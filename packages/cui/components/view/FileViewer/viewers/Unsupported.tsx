import React, { useMemo } from 'react'
import { FileOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { getLocale } from '@umijs/max'
import styles from '../index.less'

interface UnsupportedProps {
	src?: string
	file?: File
	contentType?: string
	fileName?: string
}

const UnsupportedComponent: React.FC<UnsupportedProps> = ({ src, file, contentType, fileName }) => {
	// 统一处理文件源
	const fileSource = useMemo(() => {
		if (src) return src
		if (file) return URL.createObjectURL(file)
		return undefined
	}, [src, file])

	const fileSize = file?.size
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const formatFileSize = (bytes?: number): string => {
		if (!bytes) return ''
		if (bytes === 0) return '0 B'
		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	const handleDownload = () => {
		if (fileSource && fileName) {
			const link = document.createElement('a')
			link.href = fileSource
			link.download = fileName
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
		}
	}

	return (
		<div className={styles.viewer}>
			<div className={styles.content}>
				<div className={styles.unsupportedContainer}>
					<div className={styles.fileIcon}>
						<FileOutlined />
					</div>
					<div className={styles.fileInfo}>
						<div className={styles.fileName}>{fileName}</div>
						{fileSize && <div className={styles.fileSize}>{formatFileSize(fileSize)}</div>}
						<div className={styles.unsupportedText}>
							{is_cn ? '不支持预览此文件类型' : 'Preview not supported for this file type'}
						</div>
					</div>
					{fileSource && (
						<div className={styles.actions}>
							<Button type='primary' icon={<DownloadOutlined />} onClick={handleDownload}>
								{is_cn ? '下载文件' : 'Download File'}
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default UnsupportedComponent
