import React, { useState, useEffect, useRef } from 'react'
import { Tooltip, Dropdown, Menu } from 'antd'
import clsx from 'clsx'
import { getLocale, useLocation } from '@umijs/max'
import Icon from '../../../widgets/Icon'
import type { IInputAreaProps } from '../../types'
import type { ChatMessage } from '../../../openapi'
import styles from './index.less'

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

const MOCK_ATTACHMENTS = [
	{ id: '1', name: 'report.pdf', type: 'file' },
	{ id: '2', name: 'screenshot.png', type: 'image' }
]
const MOCK_MENTIONS = [
	{ id: 'neo', name: 'Neo', avatar: 'N' },
	{ id: 'translate', name: 'Translator', avatar: 'T' },
	{ id: 'code', name: 'Code Assistant', avatar: 'C' }
]

const InputArea = (props: IInputAreaProps) => {
	const { mode, onSend, loading, disabled, className, style, chatId, draft, onChange } = props
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
	// Store selection range to restore focus after UI interactions
	const lastRangeRef = useRef<Range | null>(null)

	// Mock State
	const [attachments, setAttachments] = useState<any[]>([])
	const [agent, setAgent] = useState(MOCK_AGENT)

	// Reset animating state after transition
	useEffect(() => {
		if (mode === 'normal' && isAnimating) {
			const timer = setTimeout(() => setIsAnimating(false), 350)
			return () => clearTimeout(timer)
		}
	}, [mode, isAnimating])

	// Restore draft when chatId changes (new chat or switch tab)
	useEffect(() => {
		if (editorRef.current) {
			const newContent = draft || ''
			// Only update if content is different to avoid cursor jumping if we were typing
			// But this effect runs on chatId change, so it's safe to replace.
			if (editorRef.current.innerText !== newContent) {
				editorRef.current.innerText = newContent
				setIsEmpty(!newContent.trim())
			}
		}
		// Reset attachments for new chat/tab (TODO: Support attachment drafts?)
		setAttachments([])
	}, [chatId]) // draft is not in deps to avoid loop while typing, we only restore on chatId change

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
		// Ideally we should track the start position of '@'.
		// For robust implementation, we can just insert at cursor.
		// Users can delete the '@' manually if needed, or we refine logic to find '@'.
		// Let's try to find '@' immediately before cursor if it exists.
		if (range.startOffset > 0 && range.startContainer.nodeType === Node.TEXT_NODE) {
			const textBefore = range.startContainer.textContent || ''
			// Simple check: if char before cursor is '@', delete it.
			// Or if we have a keyword, delete keyword length + 1.
			// Here we assume simple insertion for simplicity.
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

	// --- Handlers ---

	const handleInput = () => {
		if (!editorRef.current) return
		const text = editorRef.current.innerText

		// Call onChange to update draft
		onChange?.(text)

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
			} else {
				// Basic logic: hide if not typing after @
				// For full implementation, we need to track if we are inside a "mention sequence"
				// Here we just close if not immediately @
				// setShowMentions(false)
			}
		} else {
			setShowMentions(false)
		}
	}

	const handleSend = () => {
		if (!editorRef.current) return
		const text = editorRef.current.innerText
		const hasTags = editorRef.current.querySelectorAll(`.${styles.mentionTag}`).length > 0

		if (!text.trim() && !hasTags && attachments.length === 0) return

		const message: ChatMessage = {
			role: 'user',
			content: text // Send plain text representation
		}

		if (mode === 'placeholder') {
			setIsAnimating(true)
		}

		onSend(message).then(() => {
			if (editorRef.current) {
				editorRef.current.innerHTML = ''
				setIsEmpty(true)
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
		document.execCommand('insertText', false, text)

		// Check for files
		const items = e.clipboardData.items
		for (const item of items) {
			if (item.kind === 'file') {
				const file = item.getAsFile()
				if (file) {
					setAttachments((prev) => [
						...prev,
						{ name: file.name, type: file.type.startsWith('image') ? 'image' : 'file' }
					])
				}
			}
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
			const newFiles = Array.from(e.dataTransfer.files).map((f) => ({
				name: f.name,
				type: f.type.startsWith('image') ? 'image' : 'file'
			}))
			setAttachments((prev) => [...prev, ...newFiles])
		}

		// Check for custom protocol (Mock)
		const customData = e.dataTransfer.getData('application/x-yao-item')
		if (customData) {
			// Insert as Tag at drop position?
			// Drag event doesn't set selection automatically in contentEditable in all browsers correctly for custom data.
			// We simply insert at end or current selection for now.
			insertTag('Dropped Item', 'item-id', 'mention')
		}
	}

	// --- Components ---

	const renderPlaceholder = () => (
		<div className={styles.placeholderHint}>
			<h3>{is_cn ? '今天有什么可以帮您？' : 'How can I help you today?'}</h3>
		</div>
	)

	const renderModelSelector = () => {
		if (!agent?.allowModelSelection) return null

		const menu = (
			<Menu
				onClick={({ key }) => setCurrentModel(key)}
				selectedKeys={[currentModel]}
				style={{ minWidth: 140 }}
				items={MOCK_MODELS.map((m) => ({
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

		const currentLabel = MOCK_MODELS.find((m) => m.value === currentModel)?.label || currentModel

		return (
			<Dropdown overlay={menu} trigger={['click']} placement='bottomRight'>
				<div className={styles.modelSelector}>
					<span className={styles.modelName}>{currentLabel}</span>
					<Icon name='material-expand_more' size={16} />
				</div>
			</Dropdown>
		)
	}

	const renderContextRow = () => (
		<div className={styles.contextRow}>
			<div className={styles.leftTags}>
				{agent && (
					<div className={styles.tag}>
						<div className={styles.tagAvatar}>
							{agent.avatar && agent.avatar.length > 2 ? (
								<img src={agent.avatar} alt={agent.name} />
							) : (
								agent.avatar || agent.name[0]
							)}
						</div>
						<span>{agent.name}</span>
						{/* No close button for Agent */}
					</div>
				)}
				{currentPage && (
					<div className={clsx(styles.tag, styles.pageTag)}>
						<Icon name='material-link' size={12} />
						<span>{currentPage}</span>
					</div>
				)}
			</div>
			{renderModelSelector()}
		</div>
	)

	const renderAttachments = () => {
		if (attachments.length === 0) return null
		return (
			<div className={styles.attachmentList}>
				{attachments.map((att, idx) => (
					<div key={idx} className={styles.attachmentItem}>
						<Icon
							name={att.type === 'image' ? 'material-image' : 'material-description'}
							size={14}
						/>
						<span className={styles.fileName}>{att.name}</span>
						<span
							className={styles.removeBtn}
							onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
						>
							×
						</span>
					</div>
				))}
			</div>
		)
	}

	const renderSendButton = () => {
		const showStop = loading
		const canSend = !isEmpty || attachments.length > 0

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

	const renderToolbar = () => {
		return (
			<div className={styles.toolbar}>
				<div className={styles.leftTools}>
					<Tooltip title={is_cn ? '上传文件' : 'Upload File'}>
						<div className={styles.toolBtn}>
							<Icon name='material-upload_file' size={16} />
						</div>
					</Tooltip>
					<Tooltip title={is_cn ? '添加数据' : 'Add Data'}>
						<div className={styles.toolBtn}>
							<Icon name='material-dataset' size={16} />
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
							<Icon name='material-auto_awesome' size={16} />
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
								// This is tricky without precise tracking.
								// We just insert the tag for now.
								// Deleting the '@' robustly requires tracking its node and offset.
								const range = lastRangeRef.current
								if (range.startOffset > 0 && range.startContainer.textContent) {
									// Check char before
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
							<span>{is_cn ? '拖拽文件或项目到这里' : 'Drop files or items here'}</span>
						</div>
					)}

					{renderContextRow()}

					<div className={styles.inputWrapper}>
						{renderAttachments()}
						<div
							className={styles.editor}
							ref={editorRef}
							contentEditable={!disabled && !loading}
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
	)
}

export default InputArea
