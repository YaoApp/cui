import React from 'react'
import { Button, Tooltip, Input } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import FileViewer from '@/components/view/FileViewer'
import layoutStyles from '../Layout/index.less'
import styles from './index.less'

interface OriginalProps {
	viewMode: 'dual' | 'left' | 'right'
	onHideRightPanel: () => void
	onRestoreDualPanels: () => void
	docid: string
	collectionId: string
	document?: any
}

const Original: React.FC<OriginalProps> = ({
	viewMode,
	onHideRightPanel,
	onRestoreDualPanels,
	docid,
	collectionId,
	document
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 根据 docid 和 collectionId 构建文档路径
	const documentPath = `/documents/${collectionId}/${docid}`
	const previewURL = `/api/preview/${collectionId}/${docid}`

	return (
		<div className={layoutStyles.panelContent}>
			<div className={layoutStyles.panelHeader}>
				<div className={layoutStyles.headerTitle}>
					<Icon name='material-description' size={14} />
					<h3>{is_cn ? '原始文档' : 'Original Document'}</h3>
				</div>
				<div className={layoutStyles.headerActions}>
					{/* 视图切换按钮 */}
					{viewMode === 'dual' ? (
						<Tooltip title={is_cn ? '最大化原始文档' : 'Maximize Original Document'}>
							<Button
								type='text'
								size='small'
								icon={<Icon name='material-fullscreen' size={14} />}
								onClick={onHideRightPanel}
								className={layoutStyles.headerButton}
							/>
						</Tooltip>
					) : viewMode === 'left' ? (
						<Tooltip title={is_cn ? '恢复双栏显示' : 'Restore Dual Panels'}>
							<Button
								type='text'
								size='small'
								icon={<Icon name='material-vertical_split' size={14} />}
								onClick={onRestoreDualPanels}
								className={layoutStyles.headerButton}
							/>
						</Tooltip>
					) : null}
				</div>
			</div>

			<div className={layoutStyles.scrollableContent}>
				<div className={layoutStyles.documentViewer}>
					{document?.type === 'url' ? (
						// URL 类型：显示地址和 iframe 预览
						<div className={styles.urlPreviewContainer}>
							<div className={styles.urlHeader}>
								<Icon name='material-link' size={16} />
								<Input
									value={document?.url || ''}
									readOnly
									placeholder={is_cn ? '网页URL地址' : 'Web URL address'}
									className={styles.urlInput}
								/>
							</div>
							<iframe
								src={document?.url || ''}
								title='URL Preview'
								className={styles.urlIframe}
								sandbox='allow-same-origin allow-scripts allow-forms allow-popups'
							/>
						</div>
					) : document?.type === 'text' ? (
						// Text 类型：使用 FileViewer 的文本预览功能
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
							content={document?.text_content}
							contentType='text/plain'
						/>
					) : (
						// File 类型：使用 FileViewer 的文件预览功能
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
							fileID={document?.file_id}
							uploader={document?.uploader_id || '__yao.attachment'}
							contentType={document?.file_mime_type}
						/>
					)}
				</div>
			</div>
		</div>
	)
}

export default Original
