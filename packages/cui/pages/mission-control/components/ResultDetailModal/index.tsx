import React, { useState } from 'react'
import { Modal, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { ResultDetail } from '@/openapi/agent/robot'
import styles from './index.less'

interface ResultDetailModalProps {
	visible: boolean
	onClose: () => void
	result: ResultDetail | null
}

type TabType = 'content' | 'attachments'

// Simple markdown to HTML converter (basic support)
const renderMarkdown = (text: string): string => {
	if (!text) return ''

	// First, handle code blocks (preserve them)
	const codeBlocks: string[] = []
	let html = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
		const index = codeBlocks.length
		codeBlocks.push(`<pre><code class="language-${lang || 'text'}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim()}</code></pre>`)
		return `__CODE_BLOCK_${index}__`
	})

	// Handle tables
	html = html.replace(/\n\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/g, (_, header, rows) => {
		const headers = header.split('|').filter((h: string) => h.trim()).map((h: string) => `<th>${h.trim()}</th>`).join('')
		const bodyRows = rows.trim().split('\n').map((row: string) => {
			const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('')
			return `<tr>${cells}</tr>`
		}).join('')
		return `<table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>`
	})

	// Escape remaining HTML (but not in already processed parts)
	html = html
		// Headers (must be before other processing)
		.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
		.replace(/^### (.+)$/gm, '<h3>$1</h3>')
		.replace(/^## (.+)$/gm, '<h2>$1</h2>')
		.replace(/^# (.+)$/gm, '<h1>$1</h1>')
		// Bold
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		// Italic
		.replace(/\*(.+?)\*/g, '<em>$1</em>')
		// Inline code
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		// Horizontal rule
		.replace(/^---$/gm, '<hr />')
		// Blockquote
		.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
		// Ordered list items
		.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
		// Unordered list items
		.replace(/^- (.+)$/gm, '<li>$1</li>')
		// Links (basic)
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

	// Wrap consecutive list items in ul/ol
	html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, '<ul>$&</ul>')

	// Merge consecutive blockquotes
	html = html.replace(/(<blockquote>[\s\S]*?<\/blockquote>\n?)+/g, (match) => {
		const content = match.replace(/<\/?blockquote>/g, '').trim()
		return `<blockquote>${content}</blockquote>`
	})

	// Paragraphs - wrap text between block elements
	const lines = html.split('\n')
	const result: string[] = []
	let inParagraph = false

	for (const line of lines) {
		const trimmed = line.trim()
		if (!trimmed) {
			if (inParagraph) {
				result.push('</p>')
				inParagraph = false
			}
			continue
		}

		const isBlockElement = /^<(h[1-6]|ul|ol|li|table|thead|tbody|tr|th|td|pre|blockquote|hr)/.test(trimmed) ||
			/^__CODE_BLOCK_\d+__$/.test(trimmed)

		if (isBlockElement) {
			if (inParagraph) {
				result.push('</p>')
				inParagraph = false
			}
			result.push(trimmed)
		} else {
			if (!inParagraph) {
				result.push('<p>')
				inParagraph = true
			}
			result.push(trimmed)
		}
	}
	if (inParagraph) {
		result.push('</p>')
	}

	html = result.join('\n')

	// Restore code blocks
	codeBlocks.forEach((block, index) => {
		html = html.replace(`__CODE_BLOCK_${index}__`, block)
	})

	return html
}

const ResultDetailModal: React.FC<ResultDetailModalProps> = ({ visible, onClose, result }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [activeTab, setActiveTab] = useState<TabType>('content')

	// Format helpers
	const formatFullDate = (dateStr: string) => {
		const date = new Date(dateStr)
		const year = date.getFullYear()
		const month = (date.getMonth() + 1).toString().padStart(2, '0')
		const day = date.getDate().toString().padStart(2, '0')
		const hours = date.getHours().toString().padStart(2, '0')
		const minutes = date.getMinutes().toString().padStart(2, '0')
		return `${year}-${month}-${day} ${hours}:${minutes}`
	}

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}

	const getTriggerInfo = (type: string) => {
		switch (type) {
			case 'clock':
				return { icon: 'material-schedule', label: is_cn ? '定时触发' : 'Scheduled' }
			case 'human':
				return { icon: 'material-person', label: is_cn ? '人工触发' : 'Manual' }
			case 'event':
				return { icon: 'material-bolt', label: is_cn ? '事件触发' : 'Event' }
			default:
				return { icon: 'material-help_outline', label: type }
		}
	}

	const getFileIcon = (filename: string) => {
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
				return 'material-article'
			case 'png':
			case 'jpg':
			case 'jpeg':
			case 'svg':
				return 'material-image'
			case 'json':
				return 'material-code'
			case 'zip':
				return 'material-folder_zip'
			default:
				return 'material-description'
		}
	}

	// Handle download
	const handleDownload = (e: React.MouseEvent, attachment: { title: string; file: string }) => {
		e.stopPropagation()
		console.log('Download:', attachment)
		alert(is_cn ? `下载: ${attachment.title}` : `Download: ${attachment.title}`)
	}

	// Handle preview
	const handlePreview = (e: React.MouseEvent, attachment: { title: string; file: string }) => {
		e.stopPropagation()
		console.log('Preview:', attachment)
		alert(is_cn ? `预览: ${attachment.title}` : `Preview: ${attachment.title}`)
	}

	// Handle download all
	const handleDownloadAll = () => {
		const attachments = result?.delivery?.content?.attachments
		if (attachments && attachments.length > 0) {
			const names = attachments.map((a) => a.title).join(', ')
			console.log('Download all:', attachments)
			alert(is_cn ? `下载全部: ${names}` : `Download all: ${names}`)
		}
	}

	if (!result) return null

	const delivery = result.delivery
	const title = result.name || '-'
	const triggerInfo = getTriggerInfo(result.trigger_type)
	const attachments = delivery?.content?.attachments || []
	const hasAttachments = attachments.length > 0
	const attachmentCount = attachments.length

	// Tab definitions
	const tabs = [
		{
			key: 'content' as TabType,
			label: is_cn ? '内容' : 'Content',
			icon: 'material-article'
		},
		{
			key: 'attachments' as TabType,
			label: is_cn ? '附件' : 'Attachments',
			icon: 'material-attach_file',
			count: attachmentCount
		}
	]

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.titleSection}>
						<Icon name='material-inventory_2' size={20} className={styles.titleIcon} />
						<h3 className={styles.modalTitle}>{title}</h3>
					</div>
					<div className={styles.tabs}>
						{tabs.map((tab) => (
							<div
								key={tab.key}
								className={`${styles.tabItem} ${activeTab === tab.key ? styles.tabItemActive : ''}`}
								onClick={() => setActiveTab(tab.key)}
							>
								<Icon name={tab.icon} size={14} />
								<span>{tab.label}</span>
								{tab.count !== undefined && tab.count > 0 && (
									<span className={styles.tabCount}>{tab.count}</span>
								)}
							</div>
						))}
					</div>
					<div className={styles.headerActions}>
						<button className={styles.iconButton} onClick={onClose}>
							<Icon name='material-close' size={18} />
						</button>
					</div>
				</div>
			}
			open={visible}
			onCancel={onClose}
			footer={null}
			width='90%'
			style={{
				top: '5vh',
				paddingBottom: 0,
				maxWidth: 'none'
			}}
			bodyStyle={{
				padding: 0,
				height: 'calc(90vh - 56px)',
				overflow: 'hidden'
			}}
			destroyOnClose
			closable={false}
			className={styles.resultDetailModal}
		>
			<div className={styles.modalContent}>
				{activeTab === 'content' && (
					<div className={styles.contentTab}>
						{/* Meta info bar */}
						<div className={styles.metaBar}>
							<div className={styles.metaItem}>
								<Icon name={triggerInfo.icon} size={14} />
								<span>{triggerInfo.label}</span>
							</div>
							<span className={styles.metaDot}>·</span>
							<div className={styles.metaItem}>
								<Icon name='material-schedule' size={14} />
								<span>{result.end_time ? formatFullDate(result.end_time) : '-'}</span>
							</div>
						</div>

						{/* Summary */}
						{delivery?.content?.summary && (
							<div className={styles.summaryBox}>
								{delivery.content.summary}
							</div>
						)}

						{/* Article content */}
						{delivery?.content?.body && (
							<article 
								className={styles.articleContent}
								dangerouslySetInnerHTML={{ __html: renderMarkdown(delivery.content.body) }}
							/>
						)}

						{/* No content */}
						{!delivery?.content?.summary && !delivery?.content?.body && (
							<div className={styles.emptyContent}>
								<Icon name='material-article' size={48} />
								<span>{is_cn ? '暂无内容' : 'No content'}</span>
							</div>
						)}
					</div>
				)}

				{activeTab === 'attachments' && (
					<div className={styles.attachmentsTab}>
						{hasAttachments ? (
							<>
								<div className={styles.attachmentsHeader}>
									<span className={styles.attachmentsCount}>
										{is_cn ? `共 ${attachmentCount} 个附件` : `${attachmentCount} attachments`}
									</span>
									<button className={styles.downloadAllBtn} onClick={handleDownloadAll}>
										<Icon name='material-download' size={14} />
										<span>{is_cn ? '全部下载' : 'Download All'}</span>
									</button>
								</div>
								<div className={styles.attachmentList}>
									{attachments.map((att, idx) => (
										<div key={idx} className={styles.attachmentCard}>
											<div className={styles.attachmentIcon}>
												<Icon name={getFileIcon(att.title)} size={28} />
											</div>
											<div className={styles.attachmentInfo}>
												<span className={styles.attachmentName}>{att.title}</span>
												{att.description && (
													<span className={styles.attachmentDesc}>{att.description}</span>
												)}
											</div>
											<div className={styles.attachmentActions}>
												<Tooltip title={is_cn ? '预览' : 'Preview'}>
													<button
														className={styles.attachmentBtn}
														onClick={(e) => handlePreview(e, att)}
													>
														<Icon name='material-visibility' size={16} />
													</button>
												</Tooltip>
												<Tooltip title={is_cn ? '下载' : 'Download'}>
													<button
														className={`${styles.attachmentBtn} ${styles.attachmentBtnPrimary}`}
														onClick={(e) => handleDownload(e, att)}
													>
														<Icon name='material-download' size={16} />
													</button>
												</Tooltip>
											</div>
										</div>
									))}
								</div>
							</>
						) : (
							<div className={styles.emptyAttachments}>
								<Icon name='material-folder_off' size={48} />
								<span>{is_cn ? '无附件' : 'No attachments'}</span>
							</div>
						)}
					</div>
				)}
			</div>
		</Modal>
	)
}

export default ResultDetailModal
