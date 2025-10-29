import React, { useState, useRef } from 'react'
import { Modal, message } from 'antd'
import { Button } from '@/components/ui'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Uploader from '../Uploader'
import Generator from '../Generator'
import type { UploadModalProps } from './types'
import styles from './index.less'

const UploadModal: React.FC<UploadModalProps> = ({
	visible,
	onClose,
	onSuccess,
	uploader = '__yao.attachment',
	avatarAgent,
	modalTitle
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const defaultTitle = is_cn ? '设置头像' : 'Set Avatar'

	// If no avatarAgent is configured, always use 'upload' tab
	const [activeTab, setActiveTab] = useState('upload')
	const [confirming, setConfirming] = useState(false)
	const [hasUploadedImage, setHasUploadedImage] = useState(false)
	const [hasGeneratedImage, setHasGeneratedImage] = useState(false)

	const uploaderRef = useRef<any>(null)
	const generatorRef = useRef<any>(null)

	// Reset states when modal visibility changes
	React.useEffect(() => {
		if (!visible) {
			setActiveTab('upload')
			setHasUploadedImage(false)
			setHasGeneratedImage(false)
			setConfirming(false)
		}
	}, [visible])

	const handleConfirm = async () => {
		try {
			setConfirming(true)

			if (activeTab === 'upload') {
				await uploaderRef.current?.handleConfirm()
			} else if (activeTab === 'generate') {
				await generatorRef.current?.handleConfirm()
			}
		} catch (error) {
			console.error('Confirm failed:', error)
		} finally {
			setConfirming(false)
		}
	}

	const handleSuccess = (fileId: string, fileUrl: string) => {
		onSuccess(fileId, fileUrl)
		onClose()
	}

	const renderFooter = () => {
		// Determine if confirm button should be disabled
		const isConfirmDisabled =
			activeTab === 'upload' ? !hasUploadedImage : activeTab === 'generate' ? !hasGeneratedImage : true

		return (
			<div className={styles.modalFooter}>
				<div className={styles.footerLeft}></div>
				<div className={styles.footerRight}>
					<Button size='small' onClick={onClose} disabled={confirming}>
						{is_cn ? '取消' : 'Cancel'}
					</Button>
					<Button
						type='primary'
						size='small'
						onClick={handleConfirm}
						loading={confirming}
						disabled={isConfirmDisabled}
					>
						{is_cn ? '确定' : 'Confirm'}
					</Button>
				</div>
			</div>
		)
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.titleSection}>
						<Icon name='material-account_circle' size={18} className={styles.titleIcon} />
						<span className={styles.modalTitle}>{modalTitle || defaultTitle}</span>
					</div>
					<div className={styles.closeButton} onClick={onClose}>
						<Icon name='material-close' size={18} className={styles.closeIcon} />
					</div>
				</div>
			}
			open={visible}
			onCancel={onClose}
			footer={renderFooter()}
			width={520}
			className={`${styles.uploadModal} ${!avatarAgent ? styles.uploadModalCompact : ''}`}
			destroyOnClose
			closable={false}
			maskClosable={false}
			keyboard={false}
		>
			<div className={styles.modalContent}>
				{/* Tabs - only show if avatarAgent is configured */}
				{avatarAgent && (
					<div className={styles.tabsContainer}>
						<div className={styles.tabsNav}>
							<button
								className={`${styles.tabItem} ${
									activeTab === 'upload' ? styles.tabActive : ''
								}`}
								onClick={() => setActiveTab('upload')}
							>
								<Icon name='material-upload' size={14} style={{ marginRight: 4 }} />
								{is_cn ? '上传' : 'Upload'}
							</button>
							<button
								className={`${styles.tabItem} ${
									activeTab === 'generate' ? styles.tabActive : ''
								}`}
								onClick={() => setActiveTab('generate')}
							>
								<Icon
									name='material-auto_awesome'
									size={14}
									style={{ marginRight: 4 }}
								/>
								{is_cn ? 'AI 生成' : 'AI Generate'}
							</button>
						</div>
					</div>
				)}

				{/* Tab Content */}
				<div className={styles.tabsContent}>
					{activeTab === 'upload' && (
						<Uploader
							ref={uploaderRef}
							uploader={uploader}
							onSuccess={handleSuccess}
							onImageSelect={(hasImage) => setHasUploadedImage(hasImage)}
						/>
					)}
					{activeTab === 'generate' && avatarAgent && (
						<Generator
							ref={generatorRef}
							avatarAgent={avatarAgent}
							onSuccess={handleSuccess}
							onImageGenerate={(hasImage) => setHasGeneratedImage(hasImage)}
						/>
					)}
				</div>
			</div>
		</Modal>
	)
}

export default UploadModal
