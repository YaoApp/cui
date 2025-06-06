import React from 'react'
import { Button, Tooltip, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import FileViewer from '@/components/view/FileViewer'
import styles from '../Layout/index.less'

interface OriginalProps {
	viewMode: 'dual' | 'left' | 'right'
	onHideRightPanel: () => void
	onRestoreDualPanels: () => void
	docid: string
	collectionId: string
}

const Original: React.FC<OriginalProps> = ({
	viewMode,
	onHideRightPanel,
	onRestoreDualPanels,
	docid,
	collectionId
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 根据 docid 和 collectionId 构建文档路径
	const documentPath = `/documents/${collectionId}/${docid}`
	const previewURL = `/api/preview/${collectionId}/${docid}`
	const downloadURL = `/api/download/${collectionId}/${docid}`

	// 下载功能
	const handleDownload = () => {
		try {
			// 创建下载链接
			const link = document.createElement('a')
			link.href = downloadURL
			link.download = `${collectionId}-${docid}.pdf`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)

			message.success(is_cn ? '开始下载文档' : 'Document download started')
		} catch (error) {
			message.error(is_cn ? '下载失败' : 'Download failed')
			console.error('Download error:', error)
		}
	}

	return (
		<div className={styles.panelContent}>
			<div className={styles.panelHeader}>
				<div className={styles.headerTitle}>
					<Icon name='material-description' size={14} />
					<h3>{is_cn ? '原始文档' : 'Original Document'}</h3>
				</div>
				<div className={styles.headerActions}>
					{/* 下载按钮 */}
					<Tooltip title={is_cn ? '下载文档' : 'Download Document'}>
						<Button
							type='text'
							size='small'
							icon={<Icon name='material-download' size={14} />}
							onClick={handleDownload}
							className={styles.headerButton}
						/>
					</Tooltip>

					{/* 视图切换按钮 */}
					{viewMode === 'dual' ? (
						<Tooltip title={is_cn ? '最大化原始文档' : 'Maximize Original Document'}>
							<Button
								type='text'
								size='small'
								icon={<Icon name='material-fullscreen' size={14} />}
								onClick={onHideRightPanel}
								className={styles.headerButton}
							/>
						</Tooltip>
					) : viewMode === 'left' ? (
						<Tooltip title={is_cn ? '恢复双栏显示' : 'Restore Dual Panels'}>
							<Button
								type='text'
								size='small'
								icon={<Icon name='material-vertical_split' size={14} />}
								onClick={onRestoreDualPanels}
								className={styles.headerButton}
							/>
						</Tooltip>
					) : null}
				</div>
			</div>

			<div className={styles.scrollableContent}>
				<div className={styles.documentViewer}>
					<FileViewer
						__value={documentPath}
						__namespace=''
						__primary=''
						__type='view'
						__bind=''
						__name={`${collectionId}-${docid}`}
						previewURL={previewURL}
						onSave={() => {}}
						style={{ width: '100%', height: '100%' }}
					/>
				</div>
			</div>
		</div>
	)
}

export default Original
