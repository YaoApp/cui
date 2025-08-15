import React, { useEffect, useState, useRef } from 'react'
import { Modal, Button, Spin, message, Tag, Tooltip } from 'antd'

import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { KnowledgeBase } from '../types'
import { mockFetchKnowledgeBase, mockFetchDocumentContent } from './mockData'
import { KB, Document } from '@/openapi'
import { getFileTypeIcon } from '@/assets/icons'
import Summary from './Summary'
import Layout from './Layout'
import Original from './Original'
import Chunks from './Chunks'
import styles from './index.less'

interface DocumentModalProps {
	visible: boolean
	onClose: () => void
	collectionId: string
	docid: string
}

const DocumentModal: React.FC<DocumentModalProps> = ({ visible, onClose, collectionId, docid }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null)
	const [document, setDocument] = useState<Document | null>(null)
	const [documentContent, setDocumentContent] = useState<string>('')

	const [showMetadata, setShowMetadata] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const [isFullscreen, setIsFullscreen] = useState(false)

	// 添加ref用于检测外部点击
	const popoverRef = useRef<HTMLDivElement>(null)
	const infoButtonRef = useRef<HTMLButtonElement>(null)

	// 丝滑关闭函数
	const closePopover = () => {
		setIsClosing(true)
		setTimeout(() => {
			setShowMetadata(false)
			setIsClosing(false)
		}, 200)
	}

	// 切换全屏模式
	const toggleFullscreen = () => {
		setIsFullscreen(!isFullscreen)
	}

	// 检测外部点击关闭弹窗
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (!showMetadata) return

			const target = event.target as Node
			const isClickInsidePopover = popoverRef.current?.contains(target)
			const isClickInsideButton = infoButtonRef.current?.contains(target)

			if (!isClickInsidePopover && !isClickInsideButton) {
				closePopover()
			}
		}

		window.document.addEventListener('mousedown', handleClickOutside)
		return () => window.document.removeEventListener('mousedown', handleClickOutside)
	}, [showMetadata])

	const loadKnowledgeBase = async () => {
		try {
			const kb = await mockFetchKnowledgeBase(collectionId)
			setKnowledgeBase(kb)
		} catch (error) {
			console.error('Failed to load knowledge base:', error)
		}
	}

	const loadDocument = async () => {
		try {
			const kb = new KB(window.$app.openapi)
			const response = await kb.GetDocument(docid)

			if (window.$app.openapi.IsError(response)) {
				console.error('Failed to load document:', response.error)
				message.error(is_cn ? '加载文档失败' : 'Failed to load document')
				return
			}

			setDocument(response.data || null)
		} catch (error) {
			console.error('Failed to load document:', error)
			message.error(is_cn ? '加载文档失败' : 'Failed to load document')
		}
	}

	const loadDocumentContent = async () => {
		try {
			const content = await mockFetchDocumentContent(docid)
			setDocumentContent(content)
		} catch (error) {
			console.error('Failed to load document content:', error)
		}
	}

	useEffect(() => {
		if (visible && collectionId && docid) {
			const loadData = async () => {
				setLoading(true)
				await Promise.all([loadKnowledgeBase(), loadDocument(), loadDocumentContent()])
				setLoading(false)
			}
			loadData()
		}
	}, [visible, collectionId, docid])

	if (loading) {
		return (
			<Modal
				open={visible}
				onCancel={onClose}
				footer={null}
				title={null}
				width={isFullscreen ? '100%' : '90%'}
				style={{
					top: isFullscreen ? 0 : '5vh',
					paddingBottom: 0,
					maxWidth: isFullscreen ? '100%' : 'none'
				}}
				bodyStyle={{
					padding: 0,
					height: isFullscreen ? '100vh' : '90vh',
					overflow: 'hidden'
				}}
				className={`${styles.documentModal} ${isFullscreen ? styles.fullscreen : ''}`}
				closable={false}
				maskClosable={false}
			>
				<div className={styles.loading}>
					<Spin size='large' />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</Modal>
		)
	}

	return (
		<Modal
			open={visible}
			onCancel={onClose}
			footer={null}
			title={null}
			width={isFullscreen ? '100%' : '90%'}
			style={{
				top: isFullscreen ? 0 : '5vh',
				paddingBottom: 0,
				maxWidth: isFullscreen ? '100%' : 'none'
			}}
			bodyStyle={{
				padding: 0,
				height: isFullscreen ? '100vh' : '90vh',
				overflow: 'hidden'
			}}
			className={`${styles.documentModal} ${isFullscreen ? styles.fullscreen : ''}`}
			closable={false}
			maskClosable={false}
		>
			<div className={styles.modalContent}>
				{/* 头部导航 */}
				<div className={styles.header} style={{ position: 'relative' }}>
					<div className={styles.headerLeft}>
						<div style={{ display: 'flex', alignItems: 'center' }}>
							<img
								src={getFileTypeIcon(document?.name || '')}
								alt='file icon'
								style={{ width: 24, height: 24, marginRight: 8 }}
							/>
							<h1 className={styles.title}>{document?.name}</h1>
						</div>
					</div>
					<div className={styles.headerRight}>
						<Tooltip title={is_cn ? '文档信息' : 'Document Info'}>
							<Button
								type='text'
								icon={<Icon name='material-info' size={16} />}
								onClick={() => {
									if (showMetadata) {
										closePopover()
									} else {
										setShowMetadata(true)
									}
								}}
								className={`${styles.infoButton} ${showMetadata ? styles.active : ''}`}
								ref={infoButtonRef}
							/>
						</Tooltip>
						<Tooltip
							title={
								is_cn
									? isFullscreen
										? '退出全屏'
										: '全屏阅读'
									: isFullscreen
									? 'Exit Fullscreen'
									: 'Fullscreen Reading'
							}
						>
							<Button
								type='text'
								icon={
									<Icon
										name={
											isFullscreen
												? 'material-fullscreen_exit'
												: 'material-fullscreen'
										}
										size={16}
									/>
								}
								onClick={toggleFullscreen}
								className={styles.fullscreenButton}
							/>
						</Tooltip>
						<Tooltip title={is_cn ? '更多操作' : 'More Actions'}>
							<Button
								type='text'
								icon={<Icon name='material-more_vert' size={16} />}
								className={styles.moreButton}
							/>
						</Tooltip>
						<Tooltip title={is_cn ? '关闭' : 'Close'}>
							<Button
								type='text'
								icon={<Icon name='material-close' size={16} />}
								className={styles.closeButton}
								onClick={onClose}
							/>
						</Tooltip>
					</div>
				</div>

				{/* 气泡式文档信息 */}
				<Summary
					visible={showMetadata}
					isClosing={isClosing}
					document={document}
					popoverRef={popoverRef}
				/>

				{/* 主要内容区域 */}
				<div className={styles.content}>
					<Layout
						OriginalComponent={Original}
						ChunksComponent={Chunks}
						docid={docid}
						collectionId={collectionId}
						document={document}
					/>
				</div>
			</div>
		</Modal>
	)
}

export default DocumentModal
