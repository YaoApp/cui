import React, { useMemo } from 'react'
import { FileTextOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { getLocale } from '@umijs/max'
import styles from '../index.less'

interface PdfProps {
	src?: string
	file?: File
	contentType?: string
	fileName?: string
}

const PdfComponent: React.FC<PdfProps> = ({ src, file, contentType, fileName }) => {
	// 统一处理文件源
	const fileSource = useMemo(() => {
		if (src) return src
		if (file) return URL.createObjectURL(file)
		return undefined
	}, [src, file])

	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

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

	if (!fileSource) {
		return <div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
	}

	return (
		<div className={styles.pdfContainer}>
			{/* PDF 预览区域 */}
			<div className={styles.pdfViewer}>
				<iframe
					src={`${fileSource}#toolbar=0&navpanes=0&scrollbar=1`}
					style={{
						width: '100%',
						height: '100%',
						border: 'none',
						background: '#fff'
					}}
					title={fileName || 'PDF Preview'}
				>
					{/* 浏览器不支持iframe时的fallback */}
					<div className={styles.pdfFallback}>
						<div className={styles.pdfIcon}>
							<FileTextOutlined />
						</div>
						<div className={styles.pdfInfo}>
							<div className={styles.pdfTitle}>{fileName || 'PDF Document'}</div>
							<div className={styles.pdfMessage}>
								{is_cn
									? '您的浏览器不支持PDF预览，请下载文件查看'
									: 'Your browser does not support PDF preview, please download to view'}
							</div>
							<Button
								type='primary'
								icon={<DownloadOutlined />}
								onClick={handleDownload}
								style={{ marginTop: 16 }}
							>
								{is_cn ? '下载PDF' : 'Download PDF'}
							</Button>
						</div>
					</div>
				</iframe>
			</div>
		</div>
	)
}

export default PdfComponent
