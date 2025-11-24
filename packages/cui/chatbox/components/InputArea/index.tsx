import React, { useState, useEffect, useRef } from 'react'
import { Tooltip, Dropdown, Menu, message } from 'antd'
import clsx from 'clsx'
import { getLocale, useLocation } from '@umijs/max'
import { Database, Sparkle, UploadSimple } from 'phosphor-react'
import Icon from '../../../widgets/Icon'
import { FileAPI } from '../../../openapi'
import { CreateFileWrapper } from '@/utils/fileWrapper' // Assuming this util exists or we implement wrapper creation inline
import type { IInputAreaProps } from '../../types'
import type { ChatMessage } from '../../../openapi'
import styles from './index.less'
import AgentTag from './AgentTag'
import ResourcePicker from '../AIChat/ResourcePicker'

// Mock Data
const MOCK_AGENT = {
	name: 'Neo',
	id: 'neo',
	avatar: 'N',
	// Simulate capability to select model (future feature)
	allowModelSelection: true,
	defaultModel: 'gpt-4o'
}

const MOCK_MODELS = [
	{ label: 'GPT-4o', value: 'gpt-4o' },
	{ label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
	{ label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
	{ label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
	{ label: 'Claude 3 Opus', value: 'claude-3-opus' },
	{ label: 'Gemini 1.5 Pro', value: 'gemini-1-5-pro' },
	{ label: 'Llama 3 70B', value: 'llama-3-70b' }
]

const MOCK_MENTIONS = [
	{ id: 'neo', name: 'Neo', avatar: 'N' },
	{ id: 'translate', name: 'Translator', avatar: 'T' },
	{ id: 'code', name: 'Code Assistant', avatar: 'C' }
]

interface Attachment {
	id: string
	file: File
	name: string
	type: 'image' | 'file'
	previewUrl?: string
	uploading: boolean
	fileId?: string
	wrapper?: string
	error?: string
}

const InputArea = (props: IInputAreaProps) => {
	const { mode, onSend, loading, disabled, className, style, chatId, assistant: propAssistant } = props
	const [isAnimating, setIsAnimating] = useState(false)
	const [isDragOver, setIsDragOver] = useState(false)
	const [showMentions, setShowMentions] = useState(false)
	const [isEmpty, setIsEmpty] = useState(true)
	const [currentModel, setCurrentModel] = useState(MOCK_AGENT.defaultModel)

	// Localization & Routing
	const locale = getLocale()
	const { search, pathname } = useLocation()
	const is_cn = locale === 'zh-CN'
	const [currentPage, setCurrentPage] = useState('')

	const editorRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	// Store selection range to restore focus after UI interactions
	const lastRangeRef = useRef<Range | null>(null)

	// State
	const [attachments, setAttachments] = useState<Attachment[]>([])
	const [agent, setAgent] = useState(propAssistant || MOCK_AGENT)
	const [resourcePickerVisible, setResourcePickerVisible] = useState(false)

	useEffect(() => {
		if (propAssistant) {
			setAgent(propAssistant)
			if (propAssistant.defaultModel) {
				setCurrentModel(propAssistant.defaultModel)
			}
		}
	}, [propAssistant])

	// Reset animating state after transition
	useEffect(() => {
		if (mode === 'normal' && isAnimating) {
			const timer = setTimeout(() => setIsAnimating(false), 350)
			return () => clearTimeout(timer)
		}
	}, [mode, isAnimating])

	// Reset input when chatId changes (new chat or switch tab)
	// 每个 tab 的输入框是独立的，切换时清空输入
	useEffect(() => {
		if (editorRef.current) {
			editorRef.current.innerText = ''
			setIsEmpty(true)
			// Auto-focus when entering a tab
			editorRef.current.focus()
		}
		// Reset attachments for new chat/tab
		setAttachments([])
	}, [chatId])

	// When loading changes from true to false (request completed), ensure UI state is correct
	useEffect(() => {
		if (!loading && editorRef.current) {
			// Check if editor is actually empty after request completes
			const content = editorRef.current.textContent || ''
			const hasTags = editorRef.current.querySelectorAll(`.${styles.mentionTag}`).length > 0
			setIsEmpty(!content.trim() && !hasTags)
		}
	}, [loading])

	// Update Current Page
	useEffect(() => {
		// Logic from AIChat/index.tsx
		const url = pathname.replace(/\/_menu.*/gi, '') + search
		setCurrentPage(url)
	}, [pathname, search])

	// --- Helpers ---

	const saveSelection = () => {
		const selection = window.getSelection()
		if (selection && selection.rangeCount > 0) {
			lastRangeRef.current = selection.getRangeAt(0)
		}
	}

	const insertTag = (text: string, id: string, type: 'mention' | 'agent' = 'mention') => {
		const editor = editorRef.current
		if (!editor) return

		editor.focus()

		const selection = window.getSelection()
		if (!selection) return

		let range: Range
		// Use saved range if available and valid
		if (lastRangeRef.current && editor.contains(lastRangeRef.current.commonAncestorContainer)) {
			range = lastRangeRef.current
		} else {
			// Fallback to current selection or end of editor
			if (selection.rangeCount > 0 && editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
				range = selection.getRangeAt(0)
			} else {
				range = document.createRange()
				range.selectNodeContents(editor)
				range.collapse(false)
			}
		}

		// If triggered by '@', we need to replace the keyword.
		if (range.startOffset > 0 && range.startContainer.nodeType === Node.TEXT_NODE) {
			const textBefore = range.startContainer.textContent || ''
			// Simple check: if char before cursor is '@', delete it.
		}

		// Create Tag Element
		const tag = document.createElement('span')
		tag.className = styles.mentionTag
		tag.contentEditable = 'false'
		tag.dataset.id = id
		tag.dataset.type = type
		tag.innerText = `@${text}`

		range.deleteContents()
		range.insertNode(tag)

		// Insert a zero-width space or normal space after tag to allow typing
		const space = document.createTextNode('\u00A0')
		range.setStartAfter(tag)
		range.insertNode(space)

		// Move cursor after space
		range.setStartAfter(space)
		range.collapse(true)

		selection.removeAllRanges()
		selection.addRange(range)

		// Clear saved range
		lastRangeRef.current = null

		handleInput() // Update empty state
	}

	const handleUpload = async (files: File[]) => {
		if (!window.$app?.openapi) {
			message.error('OpenAPI not initialized')
			return
		}

		const uploaderID = '__yao.attachment'
		const fileApi = new FileAPI(window.$app.openapi, uploaderID)

		// 1. Create attachment placeholders
		const newAttachments: Attachment[] = files.map((file) => ({
			id: Math.random().toString(36).substring(7),
			file,
			name: file.name,
			type: file.type.startsWith('image/') ? 'image' : 'file',
			previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
			uploading: true
		}))

		setAttachments((prev) => [...prev, ...newAttachments])

		// 2. Upload each file
		for (const att of newAttachments) {
			try {
				const res = await fileApi.Upload(att.file, {
					uploaderID,
					originalFilename: att.name,
					compressImage: att.type === 'image',
					public: true // Chat attachments usually public for access
				})

				if (window.$app.openapi.IsError(res) || !res.data?.file_id) {
					throw new Error(res.error?.error_description || 'Upload failed')
				}

				const fileId = res.data.file_id
				const wrapper = `${uploaderID}://${fileId}`

				setAttachments((prev) =>
					prev.map((p) => (p.id === att.id ? { ...p, uploading: false, fileId, wrapper } : p))
				)
			} catch (err) {
				console.error('Upload error:', err)
				setAttachments((prev) =>
					prev.map((p) =>
						p.id === att.id
							? { ...p, uploading: false, error: is_cn ? '上传失败' : 'Upload failed' }
							: p
					)
				)
				message.error(`${att.name}: ${is_cn ? '上传失败' : 'Upload failed'}`)
			}
		}
	}

	// --- Handlers ---

	const handleInput = () => {
		if (!editorRef.current) return

		// Check emptiness: text is empty AND no tags
		const hasTags = editorRef.current.querySelectorAll(`.${styles.mentionTag}`).length > 0

		// Robust check:
		const content = editorRef.current.textContent || ''
		setIsEmpty(!content.trim() && !hasTags)

		// Check for mention trigger '@'
		const selection = window.getSelection()
		if (selection?.focusNode?.nodeType === Node.TEXT_NODE) {
			const textNode = selection.focusNode
			const offset = selection.focusOffset
			const charBefore = textNode.textContent?.slice(offset - 1, offset)

			if (charBefore === '@') {
				saveSelection() // Save range when @ is detected
				setShowMentions(true)
			}
		} else {
			setShowMentions(false)
		}
	}

	const handleSend = () => {
		if (!editorRef.current) return
		const text = editorRef.current.innerText
		const hasTags = editorRef.current.querySelectorAll(`.${styles.mentionTag}`).length > 0

		// Filter out attachments that are still uploading or failed
		const validAttachments = attachments.filter((att) => !att.uploading && !att.error && att.wrapper)

		if (!text.trim() && !hasTags && validAttachments.length === 0) return

		// Construct Content
		let content: ChatMessage['content']
		if (validAttachments.length > 0) {
			// Multimodal content
			const parts: any[] = []
			if (text.trim()) {
				parts.push({ type: 'text', text: text })
			}
			validAttachments.forEach((att) => {
				if (att.type === 'image') {
					parts.push({
						type: 'image_url',
						image_url: {
							url: att.wrapper,
							detail: 'auto'
						}
					})
				} else {
					parts.push({
						type: 'file',
						file: {
							url: att.wrapper,
							filename: att.name
						}
					})
				}
			})
			content = parts
		} else {
			content = text // Plain text
		}

		const message: ChatMessage = {
			role: 'user',
			content
		}

		if (mode === 'placeholder') {
			setIsAnimating(true)
		}

		onSend(message).then(() => {
			if (editorRef.current) {
				editorRef.current.innerHTML = ''
				setIsEmpty(true)
				// Keep focus on input after sending
				editorRef.current.focus()
			}
			setAttachments([])
		})
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			if (showMentions) {
				e.preventDefault()
				// Should select first mention? For now just close
				setShowMentions(false)
				return
			}
			e.preventDefault()
			handleSend()
		}

		if (e.key === 'Escape') {
			setShowMentions(false)
		}
	}

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault()
		const text = e.clipboardData.getData('text/plain')
		if (text) {
			document.execCommand('insertText', false, text)
		}

		// Check for files
		const items = e.clipboardData.items
		const files: File[] = []
		for (const item of items) {
			if (item.kind === 'file') {
				const file = item.getAsFile()
				if (file) {
					files.push(file)
				}
			}
		}
		if (files.length > 0) {
			handleUpload(files)
		}
	}

	// --- Drag & Drop ---
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(true)
	}

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(false)
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(false)

		// Check for files
		if (e.dataTransfer.files.length > 0) {
			handleUpload(Array.from(e.dataTransfer.files))
		}

		// Check for custom protocol (Mock)
		const customData = e.dataTransfer.getData('application/x-yao-item')
		if (customData) {
			insertTag('Dropped Item', 'item-id', 'mention')
		}
	}

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			handleUpload(Array.from(e.target.files))
		}
		// Clear input so same file can be selected again
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	// --- Components ---

	const renderPlaceholder = () => (
		<div className={styles.placeholderHint}>
			<h3>{is_cn ? '今天有什么可以帮您？' : 'How can I help you today?'}</h3>
		</div>
	)

	const renderModelSelector = () => {
		// Temporary fix: Show selector even if agent doesn't strictly allow it, or if it's missing
		// This is because mock data might be missing the flag, or real data logic is different.
		// In production, use agent?.allowModelSelection
		// if (!agent?.allowModelSelection) return null

		// Check if we have models to show. If not, maybe show a loading state or just the default
		const models = MOCK_MODELS // In future, fetch from API based on agent

		const menu = (
			<Menu
				onClick={({ key }) => setCurrentModel(key)}
				selectedKeys={[currentModel]}
				style={{ minWidth: 140 }}
				items={models.map((m) => ({
					key: m.value,
					label: (
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								fontSize: '12px',
								padding: '2px 0'
							}}
						>
							<span style={{ fontWeight: m.value === currentModel ? 500 : 400 }}>
								{m.label}
							</span>
							{m.value === currentModel && (
								<Icon
									name='material-check'
									size={14}
									style={{
										color: 'var(--color_primary)',
										marginLeft: 8
									}}
								/>
							)}
						</div>
					)
				}))}
			/>
		)

		const currentLabel = models.find((m) => m.value === currentModel)?.label || currentModel

		return (
			<Dropdown overlay={menu} trigger={['click']} placement='bottomRight'>
				<div className={styles.modelSelector}>
					<span className={styles.modelName}>{currentLabel}</span>
					<Icon name='material-expand_more' size={16} />
				</div>
			</Dropdown>
		)
	}

	const handlePageClick = () => {
		if (!currentPage) return
		// Navigate to the current page
		const fullUrl = window.location.origin + currentPage
		window.open(fullUrl, '_blank')
	}

	const renderContextRow = () => (
		<div className={styles.contextRow}>
			<div className={styles.leftTags}>{agent && <AgentTag agent={agent} />}</div>
			<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
				{currentPage && (
					<Tooltip title={is_cn ? '打开页面' : 'Open page'}>
						<div className={clsx(styles.tag, styles.pageTag)} onClick={handlePageClick}>
							<Icon name='material-link' size={12} />
							<span>{currentPage}</span>
						</div>
					</Tooltip>
				)}
				{renderModelSelector()}
			</div>
		</div>
	)

	const renderAttachments = () => {
		if (attachments.length === 0) return null
		return (
			<div className={styles.attachmentList}>
				{attachments.map((att) => (
					<div key={att.id} className={styles.attachmentItem}>
						{att.type === 'image' && att.previewUrl ? (
							<Tooltip
								title={
									<img
										src={att.previewUrl}
										alt='preview'
										style={{
											maxWidth: 200,
											maxHeight: 200,
											objectFit: 'contain'
										}}
									/>
								}
								color='#fff'
								overlayInnerStyle={{ padding: 4 }}
							>
								<div
									className={styles.thumbnail}
									style={{ backgroundImage: `url(${att.previewUrl})` }}
								/>
							</Tooltip>
						) : (
							<Icon name='material-description' size={20} className={styles.fileIcon} />
						)}
						<div className={styles.fileInfo}>
							<span className={styles.fileName}>{att.name}</span>
							{att.uploading && (
								<span className={styles.uploading}>
									{is_cn ? '上传中...' : 'Uploading...'}
								</span>
							)}
							{att.error && <span className={styles.error}>{att.error}</span>}
						</div>
						<span
							className={styles.removeBtn}
							onClick={() => setAttachments((prev) => prev.filter((p) => p.id !== att.id))}
						>
							<Icon name='material-close' size={14} />
						</span>
					</div>
				))}
			</div>
		)
	}

	const renderSendButton = () => {
		const showStop = loading
		// Enable send if not empty, or has attachments that are ready
		const hasReadyAttachments = attachments.some((att) => !att.uploading && !att.error)
		const canSend = !isEmpty || hasReadyAttachments

		return (
			<button
				className={styles.sendBtn}
				onClick={showStop ? props.onAbort : handleSend}
				disabled={!showStop && (!canSend || disabled)}
			>
				{showStop ? <Icon name='material-stop' size={20} /> : <Icon name='material-send' size={20} />}
			</button>
		)
	}

	const handleOpenResourcePicker = () => {
		if (loading) return
		setResourcePickerVisible(true)
	}

	const handleCloseResourcePicker = () => {
		setResourcePickerVisible(false)
	}

	const renderToolbar = () => {
		return (
			<div className={styles.toolbar}>
				<div className={styles.leftTools}>
					<Tooltip title={is_cn ? '上传文件' : 'Upload File'}>
						<div className={styles.toolBtn} onClick={() => fileInputRef.current?.click()}>
							<UploadSimple size={14} />
						</div>
					</Tooltip>
					<input
						type='file'
						ref={fileInputRef}
						style={{ display: 'none' }}
						onChange={handleFileSelect}
						multiple
					/>

					<Tooltip title={is_cn ? '添加数据' : 'Add Data'}>
						<div
							className={clsx(styles.toolBtn, loading && styles.disabled)}
							onClick={handleOpenResourcePicker}
						>
							<Database size={14} />
						</div>
					</Tooltip>

					<Tooltip
						title={
							!isEmpty
								? is_cn
									? '优化提示词'
									: 'Optimize Prompt'
								: is_cn
								? '请输入内容'
								: 'Please enter content'
						}
					>
						<div
							className={clsx(styles.toolBtn, isEmpty && styles.disabled)}
							onClick={() => {
								if (isEmpty) return
								// TODO: Optimize logic
							}}
						>
							<Sparkle size={14} />
						</div>
					</Tooltip>
				</div>
				<div className={styles.rightTools}>
					<span className={styles.hintText}>
						{is_cn ? 'Shift + Enter 换行' : 'Shift + Enter for new line'}
					</span>
				</div>
			</div>
		)
	}

	const renderMentions = () => {
		if (!showMentions) return null
		return (
			<div className={styles.mentionList}>
				{MOCK_MENTIONS.map((m) => (
					<div
						key={m.id}
						className={styles.mentionItem}
						onClick={() => {
							// Try to remove the '@' that triggered this
							if (lastRangeRef.current) {
								const range = lastRangeRef.current
								if (range.startOffset > 0 && range.startContainer.textContent) {
									const char =
										range.startContainer.textContent[range.startOffset - 1]
									if (char === '@') {
										range.setStart(range.startContainer, range.startOffset - 1)
										range.deleteContents()
									}
								}
							}

							insertTag(m.name, m.id, 'mention')
							setShowMentions(false)
						}}
					>
						<div className={styles.mentionAvatar}>{m.avatar}</div>
						<div className={styles.mentionName}>{m.name}</div>
					</div>
				))}
			</div>
		)
	}

	return (
		<>
			<div
				className={clsx(styles.container, styles[mode], isAnimating && styles.animating, className)}
				style={style}
			>
				<div className={styles.content}>
					{mode === 'placeholder' && renderPlaceholder()}

					<div
						className={styles.publishBox}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
					>
						{isDragOver && (
							<div className={styles.dragOverlay}>
								<span>
									{is_cn ? '拖拽文件或项目到这里' : 'Drop files or items here'}
								</span>
							</div>
						)}

						{renderContextRow()}

						<div className={styles.inputWrapper}>
							{renderAttachments()}
							<div
								className={styles.editor}
								ref={editorRef}
								contentEditable={!disabled}
								onInput={handleInput}
								onKeyDown={handleKeyDown}
								onPaste={handlePaste}
								data-placeholder={
									mode === 'placeholder'
										? is_cn
											? '输入消息...'
											: 'Type a message...'
										: is_cn
										? '输入消息，使用 @ 呼叫智能体'
										: 'Type a message, use @ to mention agent'
								}
							/>
							{renderSendButton()}
							{renderMentions()}
						</div>

						{renderToolbar()}
					</div>
				</div>
			</div>

			{/* Resource Picker Modal */}
			<ResourcePicker visible={resourcePickerVisible} onClose={handleCloseResourcePicker} />
		</>
	)
}

export default InputArea
