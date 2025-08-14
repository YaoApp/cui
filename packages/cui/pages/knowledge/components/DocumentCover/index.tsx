import React from 'react'
import { Tooltip } from 'antd'
import Icon from '@/widgets/Icon'
import styles from './index.less'
import { DocumentStatus } from '@/openapi/kb/types'

interface DocumentCoverProps {
	cover?: string
	name: string
	description?: string
	status: DocumentStatus
	errorMessage?: string
	className?: string
}

const DocumentCover: React.FC<DocumentCoverProps> = ({ cover, name, description, status, errorMessage, className }) => {
	// 处理中状态 - 使用原始样式（有动画）
	if (
		status === 'pending' ||
		status === 'converting' ||
		status === 'chunking' ||
		status === 'extracting' ||
		status === 'embedding' ||
		status === 'storing'
	) {
		return (
			<div className={`${styles.documentCoverContainer} ${className || ''}`}>
				<div className={styles.cardCoverPlaceholder}>
					<Icon name='material-psychology' size={48} />
					<span>智能处理中...</span>
				</div>
			</div>
		)
	}

	// 错误状态 - 直接显示错误信息，不要图标
	if (status === 'error') {
		const fullErrorMessage = errorMessage || '处理失败'

		return (
			<div className={`${styles.documentCoverContainer} ${className || ''}`}>
				<div className={`${styles.cardCoverPlaceholder} ${styles.errorState}`}>
					<Tooltip title={fullErrorMessage} placement='top' overlayStyle={{ maxWidth: '400px' }}>
						<span className={styles.errorMessage}>{fullErrorMessage}</span>
					</Tooltip>
				</div>
			</div>
		)
	}

	// 维护状态
	if (status === 'maintenance' || status === 'restoring') {
		return (
			<div className={`${styles.documentCoverContainer} ${className || ''}`}>
				<div className={styles.cardCoverPlaceholder}>
					<Icon name='material-build' size={48} />
					<span>{status === 'maintenance' ? '维护中' : '恢复中'}</span>
				</div>
			</div>
		)
	}

	// 正常状态 - 显示封面图片
	if (cover) {
		return (
			<div className={`${styles.documentCoverContainer} ${className || ''}`}>
				<img src={cover} alt={name} className={styles.coverImage} />
			</div>
		)
	}

	// 没有封面 - 显示描述或名称（与CollectionCover有差异）
	return (
		<div className={`${styles.documentCoverContainer} ${styles.textCover} ${className || ''}`}>
			<div className={styles.textContent}>{description || name}</div>
		</div>
	)
}

export default DocumentCover
