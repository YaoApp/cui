import React, { useState, useEffect, useRef } from 'react'
import { message, Tooltip as AntTooltip } from 'antd'
import clsx from 'clsx'
import { getLocale, useLocation } from '@umijs/max'
import { Database, Sparkle, UploadSimple, PaperPlaneTilt, Stop } from 'phosphor-react'
import Icon from '../../../widgets/Icon'
import { FileAPI } from '../../../openapi'
import type { IInputAreaProps } from '../../types'
import type { UserMessage } from '../../../openapi'
import { useAssistantProviders } from '@/hooks/useAssistantProviders'
import { useGlobal } from '@/context/app'
import styles from './index.less'
import AgentTag from './AgentTag'
import ResourcePicker from '../ResourcePicker'
import MessageQueue from '../MessageQueue'
import Selector from './Selector'
import ToolButton from './ToolButton'
import Tooltip from './Tooltip'

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
	const {
		mode,
		onSend,
		loading,
		disabled,
		className,
		style,
		chatId,
		assistant: propAssistant,
		streaming,
		messageQueue,
		onQueueMessage,
		onSendQueuedMessage,
		onCancelQueuedMessage,
		initialModel,
		initialChatMode
	} = props
	const [isAnimating, setIsAnimating] = useState(false)
	const [isDragOver, setIsDragOver] = useState(false)
	const [showMentions, setShowMentions] = useState(false)
	const [isEmpty, setIsEmpty] = useState(true)
	const [currentModel, setCurrentModel] = useState<string>('')
	const [chatMode, setChatMode] = useState<'chat' | 'task'>('task')
	const [isOptimizing, setIsOptimizing] = useState(false) // 优化提示词状态

	// Get global config
	const global = useGlobal()

	// Load LLM providers based on assistant configuration
	const {
		providers: llmProviders,
		loading: llmLoading,
		showSelector,
		defaultProvider
	} = useAssistantProviders({
		assistant: propAssistant
			? {
					connector: propAssistant.connector,
					connector_options: propAssistant.connector_options
			  }
			: undefined
	})

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
	const [agent, setAgent] = useState(propAssistant)
	const [resourcePickerVisible, setResourcePickerVisible] = useState(false)
	const contextRowRef = useRef<HTMLDivElement>(null)
	const [showPageText, setShowPageText] = useState(true)
	const toolbarRef = useRef<HTMLDivElement>(null)
	const [showModeText, setShowModeText] = useState(true)
	const [showModelSelectorResponsive, setShowModelSelectorResponsive] = useState(true) // Responsive layout control

	useEffect(() => {
		if (propAssistant) {
			setAgent(propAssistant)

			// Priority: initialModel (from session history) > defaultProvider (from assistant config)
			if (initialModel) {
				setCurrentModel(initialModel)
			} else if (defaultProvider) {
				setCurrentModel(defaultProvider)
			}

			// Priority: initialChatMode (from session history) > default_mode (from assistant config)
			if (initialChatMode) {
				setChatMode(initialChatMode)
			} else if (propAssistant.default_mode) {
				setChatMode(propAssistant.default_mode as 'chat' | 'task')
			}
		}
	}, [propAssistant, defaultProvider, initialModel, initialChatMode])

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

		// TODO: Mention feature temporarily disabled, will be enabled in a future version
		// const selection = window.getSelection()
		// if (selection?.focusNode?.nodeType === Node.TEXT_NODE) {
		// 	const textNode = selection.focusNode
		// 	const offset = selection.focusOffset
		// 	const charBefore = textNode.textContent?.slice(offset - 1, offset)
		// 	if (charBefore === '@') {
		// 		saveSelection()
		// 		setShowMentions(true)
		// 	}
		// } else {
		// 	setShowMentions(false)
		// }
	}

	const constructMessage = (): UserMessage | null => {
		if (!editorRef.current) return null
		const text = editorRef.current.innerText
		const hasTags = editorRef.current.querySelectorAll(`.${styles.mentionTag}`).length > 0

		// Filter out attachments that are still uploading or failed
		const validAttachments = attachments.filter((att) => !att.uploading && !att.error && att.wrapper)

		if (!text.trim() && !hasTags && validAttachments.length === 0) return null

		// Construct Content
		let content: UserMessage['content']
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

		return {
			role: 'user',
			content
		}
	}

	// Helper function to focus editor and move cursor to end
	const focusEditor = () => {
		if (!editorRef.current) return

		// Direct focus first
		editorRef.current.focus()

		// Then set cursor to end
		const selection = window.getSelection()
		if (selection && editorRef.current.childNodes.length > 0) {
			const range = document.createRange()
			range.selectNodeContents(editorRef.current)
			range.collapse(false) // Collapse to end
			selection.removeAllRanges()
			selection.addRange(range)
		}
	}

	const clearInput = () => {
		if (editorRef.current) {
			editorRef.current.innerHTML = ''
			setIsEmpty(true)
			editorRef.current.focus()
		}
		setAttachments([])
	}

	const handleSend = () => {
		const message = constructMessage()
		if (!message) return

		if (mode === 'placeholder') {
			setIsAnimating(true)
		}

		// Construct ChatCompletionRequest
		onSend({
			messages: [message],
			model: currentModel, // User selected model
			locale, // Pass user locale for i18n
			metadata: {
				mode: chatMode,
				page: currentPage || undefined
			}
		}).then(() => {
			clearInput()
		})
	}

	const handleQueueSend = () => {
		const message = constructMessage()
		if (!message) {
			// Input is empty, but we might have queued messages
			// Send ALL queued messages as force (one request)
			if (messageQueue && messageQueue.length > 0 && onSendQueuedMessage) {
				// Just send the first one's id - the hook will handle sending all messages
				onSendQueuedMessage(messageQueue[0].id, true)
			}
			return
		}

		// Input is not empty, queue the message (graceful mode)
		if (onQueueMessage) {
			onQueueMessage(message, 'graceful')
			clearInput()
		}
	}

	// Handle prompt optimization - 直接在 InputArea 内部调用 Chat API
	const handleOptimizePrompt = async () => {
		if (isEmpty || !editorRef.current || isOptimizing) return

		const currentText = editorRef.current.innerText.trim()
		if (!currentText) return

		// Check if we have the necessary dependencies
		if (!window.$app?.openapi) {
			console.warn('OpenAPI not initialized')
			return
		}

		const promptAgentId = global?.agent_uses?.prompt
		if (!promptAgentId) {
			console.warn('Prompt optimization agent not configured in global.agent_uses.prompt')
			return
		}

		// Lock the input
		setIsOptimizing(true)

		try {
			const { Chat, IsEventMessage, IsStreamEndEvent } = await import('../../../openapi')
			const chatClient = new Chat(window.$app.openapi)
			let optimizedPrompt = ''

			// Language hint
			const languageHint = is_cn ? '请用中文优化提示词。' : 'Please optimize the prompt in English.'

			// Stream optimization
			chatClient.StreamCompletion(
				{
					assistant_id: promptAgentId,
					messages: [
						{
							role: 'user',
							content: `Optimize and improve this prompt to be more clear, specific, and effective. ${languageHint}\n\nOriginal prompt:\n${currentText}`
						}
					],
					model: currentModel, // Use current selected model
					locale, // Pass user locale for i18n
					skip: {
						history: true, // Don't save to history
						trace: true // Don't show trace
					},
					metadata: {
						mode: chatMode,
						page: currentPage || undefined
					}
				},
				(chunk) => {
					// Check for stream end event
					if (IsEventMessage(chunk) && IsStreamEndEvent(chunk)) {
						setIsOptimizing(false)
						// Focus on editor after optimization completes
						setTimeout(() => focusEditor(), 0)
						return
					}

					// Accumulate and update in real-time
					if (chunk.type === 'text' && chunk.props?.content) {
						if (chunk.delta) {
							optimizedPrompt += chunk.props.content
						} else {
							optimizedPrompt = chunk.props.content
						}

						// Real-time update the editor content
						if (editorRef.current && optimizedPrompt.trim()) {
							editorRef.current.innerText = optimizedPrompt.trim()
							// Trigger input event to update isEmpty state
							const event = new Event('input', { bubbles: true })
							editorRef.current.dispatchEvent(event)

							// Move cursor to end
							const range = document.createRange()
							const sel = window.getSelection()
							if (sel && editorRef.current.childNodes.length > 0) {
								range.selectNodeContents(editorRef.current)
								range.collapse(false)
								sel.removeAllRanges()
								sel.addRange(range)
							}
						}
					}
				},
				(error) => {
					console.error('Failed to optimize prompt:', error)
					message.error(is_cn ? '优化提示词失败' : 'Failed to optimize prompt')
					setIsOptimizing(false)
					// Focus on editor even on error
					setTimeout(() => focusEditor(), 0)
				}
			)
		} catch (error) {
			console.error('Error optimizing prompt:', error)
			message.error(is_cn ? '优化提示词失败' : 'Failed to optimize prompt')
			setIsOptimizing(false)
			// Focus on editor even on exception
			setTimeout(() => focusEditor(), 0)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			// TODO: Mention feature temporarily disabled
			// if (showMentions) {
			// 	e.preventDefault()
			// 	setShowMentions(false)
			// 	return
			// }
			e.preventDefault()

			// TODO: Queue/pre-send feature temporarily disabled, will be enabled in a future version
			// When streaming, block sending entirely - user must wait for current response to finish
			if (streaming) {
				return
			}
			// if (streaming) {
			// 	handleQueueSend()
			// } else {
			// 	handleSend()
			// }
			handleSend()
		}

		// TODO: Mention feature temporarily disabled
		// if (e.key === 'Escape') {
		// 	setShowMentions(false)
		// }
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

	const handlePageClick = () => {
		if (!currentPage) return
		// Just open the sidebar, don't navigate
		if (window.$app?.Event) {
			window.$app.Event.emit('app/openSidebar', {})
		}
	}

	// Monitor container width to toggle page text visibility
	useEffect(() => {
		const checkWidth = () => {
			if (contextRowRef.current) {
				const width = contextRowRef.current.offsetWidth
				// Hide page text when container is less than 400px wide
				setShowPageText(width >= 400)
			}
		}

		checkWidth()
		window.addEventListener('resize', checkWidth)

		// Use ResizeObserver for more accurate detection
		const resizeObserver = new ResizeObserver(checkWidth)
		if (contextRowRef.current) {
			resizeObserver.observe(contextRowRef.current)
		}

		return () => {
			window.removeEventListener('resize', checkWidth)
			resizeObserver.disconnect()
		}
	}, [agent, currentPage])

	// Monitor toolbar width to toggle mode text and model selector visibility
	useEffect(() => {
		const checkToolbarWidth = () => {
			if (toolbarRef.current) {
				const width = toolbarRef.current.offsetWidth
				// Hide mode text when toolbar is less than 300px
				setShowModeText(width >= 300)
				// Hide model selector when toolbar is less than 450px (responsive layout)
				setShowModelSelectorResponsive(width >= 450)
			}
		}

		checkToolbarWidth()
		window.addEventListener('resize', checkToolbarWidth)

		const resizeObserver = new ResizeObserver(checkToolbarWidth)
		if (toolbarRef.current) {
			resizeObserver.observe(toolbarRef.current)
		}

		return () => {
			window.removeEventListener('resize', checkToolbarWidth)
			resizeObserver.disconnect()
		}
	}, [])

	const renderContextRow = () => (
		<div ref={contextRowRef} className={styles.contextRow}>
			<div className={styles.leftTags}>{agent && <AgentTag agent={agent} />}</div>
			<div className={styles.rightTags}>
				{currentPage && (
					<Tooltip content={currentPage}>
						<div className={clsx(styles.tag, styles.pageTag)} onClick={handlePageClick}>
							<Icon name='material-my_location' size={12} />
							{showPageText && <span className={styles.pageTagText}>{currentPage}</span>}
						</div>
					</Tooltip>
				)}
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
							<AntTooltip
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
							</AntTooltip>
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
		// Hide send button when optimizing
		if (isOptimizing) {
			return null
		}

		const showStop = loading
		// Enable send if not empty, or has attachments that are ready
		const hasReadyAttachments = attachments.some((att) => !att.uploading && !att.error)
		const canSend = !isEmpty || hasReadyAttachments

		return (
			<button
				className={clsx(styles.sendBtn, showStop && styles.stopping)}
				onClick={showStop ? props.onAbort : handleSend}
				disabled={!showStop && (!canSend || disabled)}
			>
				{showStop ? <Stop size={16} weight='regular' /> : <PaperPlaneTilt size={16} />}
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
		// Build mode options from assistant configuration
		const allModeOptions = [
			{ label: is_cn ? '聊天' : 'Chat', value: 'chat', icon: 'material-chat_bubble_outline' },
			{ label: is_cn ? '任务' : 'Task', value: 'task', icon: 'material-rocket_launch' }
		]

		// Filter mode options based on assistant's modes configuration
		const modeOptions =
			propAssistant?.modes && propAssistant.modes.length > 0
				? allModeOptions.filter((opt) => propAssistant.modes?.includes(opt.value))
				: allModeOptions

		// Show mode selector only if there are multiple modes to choose from
		const showModeSelector = modeOptions.length > 1

		// Build model options from API data
		const modelOptions = llmProviders.map((provider) => ({
			label: provider.label,
			value: provider.value
		}))

		// Only show search if there are 5 or more options
		const showModelSearch = modelOptions.length >= 5

		return (
			<div ref={toolbarRef} className={styles.toolbar}>
				<div className={styles.leftTools}>
					{showModeSelector && (
						<Selector
							value={chatMode}
							options={modeOptions}
							onChange={(value) => setChatMode(value as 'chat' | 'task')}
							variant='tag'
							tooltip={is_cn ? '切换智能体模式' : 'Switch Agent Mode'}
							disabled={loading || isOptimizing}
							searchable={false}
							dropdownWidth='auto'
							dropdownMinWidth={120}
							dropdownMaxWidth={200}
							hideLabel={!showModeText}
						/>
					)}
					{showSelector && showModelSelectorResponsive && (
						<Selector
							value={currentModel}
							options={modelOptions}
							onChange={setCurrentModel}
							variant='normal'
							tooltip={is_cn ? '切换模型' : 'Switch Model'}
							disabled={loading || isOptimizing}
							searchable={showModelSearch}
							dropdownWidth='auto'
							dropdownMinWidth={200}
							dropdownMaxWidth={320}
						/>
					)}
				</div>
				<div className={styles.rightTools}>
					<ToolButton
						tooltip={is_cn ? '上传文件' : 'Upload File'}
						onClick={() => fileInputRef.current?.click()}
						disabled={isOptimizing}
					>
						<UploadSimple size={14} />
					</ToolButton>
					<input
						type='file'
						ref={fileInputRef}
						style={{ display: 'none' }}
						onChange={handleFileSelect}
						multiple
					/>

					{/* 
					 Use drag & drop to add data source to the chat box. disabled for now.
					  <ToolButton
						tooltip={is_cn ? '添加数据' : 'Add Data'}
						onClick={handleOpenResourcePicker}
						disabled={loading || isOptimizing}
					>
						<Database size={14} />
					</ToolButton> */}

					<ToolButton
						tooltip={
							isOptimizing
								? is_cn
									? '优化中...'
									: 'Optimizing...'
								: !isEmpty
								? is_cn
									? '优化提示词'
									: 'Optimize Prompt'
								: is_cn
								? '请输入内容'
								: 'Please enter content'
						}
						onClick={handleOptimizePrompt}
						disabled={isEmpty || isOptimizing}
						active={isOptimizing}
					>
						<Sparkle size={14} />
					</ToolButton>
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

					{/* TODO: Queue/pre-send feature temporarily disabled, will be enabled in a future version */}
					{/* {messageQueue &&
						messageQueue.length > 0 &&
						onCancelQueuedMessage &&
						onSendQueuedMessage && (
							<MessageQueue
								queue={messageQueue}
								onCancel={onCancelQueuedMessage}
								onSendNow={(id) => onSendQueuedMessage(id, true)}
								onSendAll={() => onSendQueuedMessage(undefined, true)}
								className={styles.messageQueue}
							/>
						)} */}

					<div
						className={clsx(
							styles.publishBox
							// TODO: Queue/pre-send feature temporarily disabled
							// messageQueue && messageQueue.length > 0 && styles.hasQueue
						)}
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
								contentEditable={!disabled && !isOptimizing && !streaming}
								onInput={handleInput}
								onKeyDown={handleKeyDown}
								onPaste={handlePaste}
								data-placeholder={
									mode === 'placeholder'
										? is_cn
											? '输入消息... (Shift + Enter 换行)'
											: 'Type a message... (Shift + Enter for new line)'
										: streaming
										? is_cn
											? '正在响应中，请等待完成后再发送...'
											: 'Waiting for response to complete...'
										// TODO: Queue/pre-send feature temporarily disabled
										// ? is_cn
										// 	? messageQueue && messageQueue.length > 0
										// 		? '继续输入（回车键排队）或空回车立即发送队列 (Shift + Enter 换行)'
										// 		: '可继续输入（回车键排队，空回车立即发送） (Shift + Enter 换行)'
										// 	: messageQueue && messageQueue.length > 0
										// 	? 'Continue typing (Enter to queue, empty Enter to send now, Shift + Enter for new line)'
										// 	: 'Continue typing (Enter to queue, empty Enter to send, Shift + Enter for new line)'
										: is_cn
										? '输入消息 (Shift + Enter 换行)'
										: 'Type a message (Shift + Enter for new line)'
								}
							/>
						{renderSendButton()}
						{/* TODO: Mention feature temporarily disabled */}
						{/* {renderMentions()} */}
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
