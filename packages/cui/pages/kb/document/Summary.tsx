import React from 'react'
import {
	ClockCircleOutlined,
	FileTextOutlined,
	UserOutlined,
	DatabaseOutlined,
	HddOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	LoadingOutlined,
	QuestionCircleOutlined
} from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import { Document } from '@/openapi'
import { getFileTypeIcon } from '@/assets/icons'
import styles from './index.less'

interface SummaryProps {
	visible: boolean
	isClosing: boolean
	document: Document | null
	popoverRef: React.RefObject<HTMLDivElement>
}

const Summary: React.FC<SummaryProps> = ({ visible, isClosing, document, popoverRef }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 获取文档状态
	const getDocumentStatus = (status: string) => {
		const statusMap: {
			[key: string]: { icon: React.ReactNode; color: string; label: string }
		} = {
			ready: {
				icon: <CheckCircleOutlined />,
				color: 'var(--color_success)',
				label: is_cn ? '就绪' : 'Ready'
			},
			processing: {
				icon: <LoadingOutlined />,
				color: 'var(--color_warning)',
				label: is_cn ? '处理中' : 'Processing'
			},
			failed: {
				icon: <CloseCircleOutlined />,
				color: 'var(--color_danger)',
				label: is_cn ? '失败' : 'Failed'
			},
			indexing: {
				icon: <LoadingOutlined />,
				color: 'var(--color_info)',
				label: is_cn ? '索引中' : 'Indexing'
			}
		}
		return (
			statusMap[status] || {
				icon: <QuestionCircleOutlined />,
				color: 'var(--color_text_grey)',
				label: status
			}
		)
	}

	// 格式化文件大小
	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 B'
		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	if (!visible) return null

	return (
		<div className={`${styles.documentPopover} ${isClosing ? styles.closing : ''}`} ref={popoverRef}>
			{/* 三角形箭头 */}
			<div className={styles.popoverArrow} />
			<div className={styles.popoverArrowBorder} />

			{/* Card Header */}
			<div className={styles.popoverHeader}>
				<div className={styles.headerContent}>
					<img
						src={getFileTypeIcon(document?.name || '')}
						alt='file icon'
						style={{ width: 20, height: 20 }}
					/>
					<div className={styles.fileName}>{document?.name}</div>
				</div>
			</div>

			{/* Card Body */}
			<div className={styles.popoverBody}>
				<div className={styles.metaInfo}>
					<ClockCircleOutlined />
					更新时间: {new Date(document?.updated_at || '').toLocaleString('zh-CN')}
				</div>

				<div className={styles.metaInfo}>
					<UserOutlined />
					作者: {document?.uploader_id || 'Unknown'}
				</div>

				<div className={styles.metaInfo}>
					<DatabaseOutlined />
					所属集合: {document?.collection_id}
				</div>

				<div className={styles.metaInfo}>
					<FileTextOutlined />
					切片数量: {document?.segment_count || 0}
				</div>

				<div className={styles.metaInfo}>
					<HddOutlined />
					文件大小: {formatFileSize(document?.size || 0)}
				</div>

				<div className={`${styles.metaInfo} ${styles[`status-${document?.status || 'ready'}`] || ''}`}>
					{getDocumentStatus(document?.status || 'ready').icon}
					文档状态: {getDocumentStatus(document?.status || 'ready').label}
				</div>

				{document?.description && <div className={styles.description}>{document.description}</div>}
			</div>
		</div>
	)
}

export default Summary
