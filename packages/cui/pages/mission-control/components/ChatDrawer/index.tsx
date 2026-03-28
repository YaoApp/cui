import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Creature from '@/widgets/Creature'
import DrawerMessageList from './DrawerMessageList'
import { newStreamSession } from '@/chatbox/utils/chunkProcessor'
import type { StreamSession } from '@/chatbox/utils/chunkProcessor'
import { applyDelta, clearMessageCache } from '@/chatbox/hooks/delta'
import { nanoid } from 'nanoid'
import { Chat, FileAPI } from '@/openapi'
import type { Message as CUIMessage } from '@/openapi/chat/types'
import type { InteractDoneData } from '@/openapi/agent/robot/types'
import type { RobotState } from '../../types'
import styles from './index.less'

interface ChatAttachment {
	id: string
	file: File
	name: string
	type: 'image' | 'file'
	previewUrl?: string
	uploading: boolean
	error?: string
	fileId?: string
	wrapper?: string
}

interface ChatHistoryItem {
	chat_id: string
	title: string
	updated_at: string
}

// ==================== Types ====================
export interface ExecutionContextInfo {
	name: string
	phase: string
	currentTask?: string
	progress?: string
	goals?: string
	tasks?: Array<{
		id: string
		name: string
		status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled'
	}>
}

export interface ChatDrawerContext {
	type: 'assign' | 'guide'
	robotName: string
	robotStatus: RobotState['status']
	execution?: ExecutionContextInfo
}

export interface ChatDrawerProps {
	visible: boolean
	onClose: () => void
	context: ChatDrawerContext
	title: string
	emptyState: {
		icon: string
		title: string
		hint: string
	}
	placeholder: string
	successState?: {
		title: string
		hint: string
	}
	// Stream configuration — ChatDrawer manages StreamCompletion internally (fire-and-forget, like chatbox)
	assistantId?: string
	chatId?: string
	metadata?: Record<string, any>
	onComplete?: () => void
	showExecutionContext?: boolean
	robotId?: string
	initialMessages?: CUIMessage[]
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({
	visible,
	onClose,
	context,
	title,
	emptyState,
	placeholder,
	successState,
	assistantId,
	chatId: propChatId,
	metadata,
	onComplete,
	showExecutionContext = false,
	robotId,
	initialMessages
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const chatIdRef = useRef(propChatId || `chat-drawer-${Date.now()}`)
	const sessionRef = useRef<StreamSession>(newStreamSession())
	const abortRef = useRef<(() => void) | null>(null)

	const chatClient = useMemo(() => {
		const openapi = window.$app?.openapi
		if (!openapi) return null
		return new Chat(openapi)
	}, [])

	const [messages, setMessages] = useState<CUIMessage[]>(initialMessages || [])
	const [inputContent, setInputContent] = useState('')
	const [attachments, setAttachments] = useState<ChatAttachment[]>([])
	const [sending, setSending] = useState(false)
	const [streaming, setStreaming] = useState(false)
	const [completed, setCompleted] = useState(false)
	const [contextExpanded, setContextExpanded] = useState(false)
	const [interactResult, setInteractResult] = useState<InteractDoneData | null>(null)
	const [historyOpen, setHistoryOpen] = useState(false)
	const [historyItems, setHistoryItems] = useState<ChatHistoryItem[]>([])
	const [historyLoading, setHistoryLoading] = useState(false)
	const historyDropdownRef = useRef<HTMLDivElement>(null)
	const historyBtnRef = useRef<HTMLButtonElement>(null)

	// Task is finalized when we have an interact result that is not "wait_for_more"
	const isFinalized = !!(interactResult && !interactResult.wait_for_more && interactResult.status !== 'error')

	const getTaskStatusIcon = (status: string) => {
		switch (status) {
			case 'completed':
				return { icon: 'material-check_circle', class: styles.taskCompleted }
			case 'running':
				return { icon: 'material-play_circle', class: styles.taskRunning }
			case 'failed':
				return { icon: 'material-error', class: styles.taskFailed }
			case 'skipped':
				return { icon: 'material-skip_next', class: styles.taskSkipped }
			case 'cancelled':
				return { icon: 'material-cancel', class: styles.taskCancelled }
			default:
				return { icon: 'material-radio_button_unchecked', class: styles.taskPending }
		}
	}

	useEffect(() => {
		if (propChatId) {
			chatIdRef.current = propChatId
		}
	}, [propChatId])

	useEffect(() => {
		if (visible && textareaRef.current) {
			setTimeout(() => textareaRef.current?.focus(), 100)
		}
	}, [visible])

	useEffect(() => {
		if (!visible) {
			if (context.type === 'assign') {
				setMessages([])
				clearMessageCache(chatIdRef.current)
				// Preserve robot_ prefix format so history lookup works correctly
				if (robotId) {
					chatIdRef.current = `robot_${robotId}_${Date.now()}`
				} else {
					chatIdRef.current = propChatId || `chat-drawer-${Date.now()}`
				}
				sessionRef.current = newStreamSession()
			}
			setInputContent('')
			setAttachments([])
			setCompleted(false)
			setInteractResult(null)
		}
	}, [visible, context.type])

	useEffect(() => {
		if (initialMessages && initialMessages.length > 0) {
			setMessages(initialMessages)
		}
	}, [initialMessages])

	// Close history dropdown on outside click or ESC
	useEffect(() => {
		if (!historyOpen) return
		const handleClick = (e: MouseEvent) => {
			if (
				historyDropdownRef.current &&
				!historyDropdownRef.current.contains(e.target as Node) &&
				historyBtnRef.current &&
				!historyBtnRef.current.contains(e.target as Node)
			) {
				setHistoryOpen(false)
			}
		}
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setHistoryOpen(false)
		}
		document.addEventListener('mousedown', handleClick)
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('mousedown', handleClick)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [historyOpen])

	// Fetch chat history for this robot
	const fetchHistory = useCallback(async () => {
		if (!robotId) return
		const openapi = window.$app?.openapi
		if (!openapi) return

		setHistoryLoading(true)
		try {
			const chatApi = new Chat(openapi)
			const res = await chatApi.ListSessions({
				chat_id_prefix: `robot_${robotId}_`,
				pagesize: 20,
				order_by: 'updated_at',
				order: 'desc'
			})
				const items: any[] = res?.data ?? []
			setHistoryItems(
				items.map((s: any) => ({
					chat_id: s.chat_id,
					// title is written by Next Hook on confirm_task; fallback to time if not yet set
					title: s.title || new Date(s.last_message_at || s.updated_at || s.created_at).toLocaleString(),
					updated_at: s.updated_at
				}))
			)
		} catch (err) {
			console.error('[ChatDrawer] Failed to fetch history:', err)
		} finally {
			setHistoryLoading(false)
		}
	}, [robotId])

	const handleHistoryToggle = useCallback(() => {
		if (!historyOpen) {
			fetchHistory()
		}
		setHistoryOpen((prev) => !prev)
	}, [historyOpen, fetchHistory])

	const handleHistorySelect = useCallback(
		(item: ChatHistoryItem) => {
			chatIdRef.current = item.chat_id
			setMessages([])
			clearMessageCache(item.chat_id)
			sessionRef.current = newStreamSession()
			setHistoryOpen(false)
			setInteractResult(null)
			setCompleted(false)

			// Load messages for the selected chat
			if (chatClient) {
				chatClient.GetMessages(item.chat_id).then((res) => {
					const msgs = (res?.messages ?? []).filter(
						(m: any) => m.type !== 'action' && m.type !== 'loading'
					)
					setMessages(msgs)
				}).catch((err) => {
					console.error('[ChatDrawer] Failed to load messages:', err)
				})
			}
		},
		[chatClient]
	)

	const handleHistoryDelete = useCallback(
		async (e: React.MouseEvent, item: ChatHistoryItem) => {
			e.stopPropagation()
			if (!chatClient) return
			try {
				await chatClient.DeleteSession(item.chat_id)
				setHistoryItems((prev) => prev.filter((h) => h.chat_id !== item.chat_id))
				// If the deleted chat is the current one, start a new conversation
				if (chatIdRef.current === item.chat_id) {
					chatIdRef.current = `robot_${robotId}_${Date.now()}`
					setMessages([])
					clearMessageCache(chatIdRef.current)
					sessionRef.current = newStreamSession()
					setInteractResult(null)
					setCompleted(false)
				}
			} catch (err) {
				console.error('[ChatDrawer] Failed to delete session:', err)
			}
		},
		[chatClient, robotId]
	)

	const handleNewConversation = useCallback(() => {
		chatIdRef.current = `robot_${robotId}_${Date.now()}`
		setMessages([])
		clearMessageCache(chatIdRef.current)
		sessionRef.current = newStreamSession()
		setHistoryOpen(false)
		setInteractResult(null)
		setCompleted(false)
	}, [robotId])

	// Auto-close drawer after task is finalized (confirmed/adjusted)
	useEffect(() => {
		if (isFinalized) {
			const timer = setTimeout(() => {
				onComplete?.()
				onClose()
			}, 2000)
			return () => clearTimeout(timer)
		}
	}, [isFinalized, onComplete, onClose])

	useEffect(() => {
		return () => {
			attachments.forEach((att) => {
				if (att.previewUrl) URL.revokeObjectURL(att.previewUrl)
			})
		}
	}, [])

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInputContent(e.target.value)
		const textarea = e.target
		textarea.style.height = 'auto'
		textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
	}

	const handleSend = useCallback(() => {
		const readyAttachments = attachments.filter((att) => !att.uploading && !att.error && att.wrapper)
		const hasUploading = attachments.some((att) => att.uploading)

		if ((!inputContent.trim() && readyAttachments.length === 0) || sending || isFinalized || hasUploading) return
		if (!chatClient || !assistantId) return

		const userContent = inputContent.trim()
		const currentChatId = chatIdRef.current

		let messageContent: any
		if (readyAttachments.length > 0) {
			const parts: any[] = []
			if (userContent) parts.push({ type: 'text', text: userContent })
			readyAttachments.forEach((att) => {
				if (att.type === 'image') {
					parts.push({ type: 'image_url', image_url: { url: att.wrapper, detail: 'auto' } })
				} else {
					parts.push({ type: 'file', file: { url: att.wrapper, filename: att.name } })
				}
			})
			messageContent = parts
		} else {
			messageContent = userContent
		}

		const displayContent = userContent || (is_cn
			? `[${readyAttachments.length} 个附件]`
			: `[${readyAttachments.length} attachment${readyAttachments.length > 1 ? 's' : ''}]`)

		// Add user message immediately
		const userMsg: CUIMessage = {
			type: 'user_input',
			props: { content: displayContent, role: 'user' },
			ui_id: `user-${Date.now()}`,
			message_id: `user-${Date.now()}`
		}
		setMessages((prev) => [...prev, userMsg])
		setInputContent('')
		setAttachments([])
		setSending(true)
		setStreaming(true)
		setInteractResult(null)

		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
		}

		// New stream session per send (isolates message_ids across rounds, same as chatbox)
		sessionRef.current = newStreamSession()
		const currentSession = sessionRef.current

		// Fire-and-forget: identical pattern to chatbox createChunkHandler
		const abortFn = chatClient.StreamCompletion(
			{
				assistant_id: assistantId,
				chat_id: currentChatId,
				messages: [{ role: 'user', content: messageContent }],
				metadata
			},
			(chunk: CUIMessage) => {
				if (!chunk) return

				if (chunk.type === 'event') {
					const eventName = chunk.props?.event as string

					if (eventName === 'stream_start') {
						const streamId = nanoid()
						currentSession.streamId = streamId
						currentSession.completedMessages = {}
						return
					}

					if (eventName === 'message_end') {
						const rawMsgId = chunk.props?.data?.message_id
						if (rawMsgId) {
							const msgId = `${currentSession.streamId}:${rawMsgId}`
							currentSession.completedMessages[msgId] = true
							clearMessageCache(currentChatId, msgId)
							setMessages((prev) => {
								const idx = prev.findIndex((m) => m.message_id === msgId)
								if (idx !== -1) {
									const next = [...prev]
									next[idx] = { ...next[idx], delta: false }
									return next
								}
								return prev
							})
						}
						return
					}

					if (eventName === 'stream_end') {
						// stream_end turns off streaming — same as chatbox createChunkHandler
						setStreaming(false)
						setSending(false)
						setTimeout(() => textareaRef.current?.focus(), 50)
						delete abortRef.current
						return
					}

					if (eventName === 'interact_done') {
						const doneData = (chunk.props?.data || chunk.props) as InteractDoneData
						if (doneData) {
							setInteractResult(doneData)
						}
						return
					}

					return
				}

				// Non-event chunks: apply delta merge (same logic as chatbox stream.ts)
				const streamId = currentSession.streamId || 'default'
				const rawMsgId = chunk.message_id || chunk.chunk_id || 'ai-response-unknown'
				const messageId = `${streamId}:${rawMsgId}`

				if (chunk.type_change) {
					clearMessageCache(currentChatId, messageId)
					setMessages((prev) => {
						const idx = prev.findIndex((m) => m.message_id === messageId)
						const replaced: CUIMessage = { ...chunk, message_id: messageId, delta: false, ui_id: nanoid() }
						if (idx !== -1) {
							const next = [...prev]
							next[idx] = replaced
							return next
						}
						return [...prev, replaced]
					})
					return
				}

				const mergedState = applyDelta(currentChatId, messageId, chunk)
				const isCompleted = currentSession.completedMessages[messageId]
				const snapshotProps = { ...mergedState.props }

				setMessages((prev) => {
					const idx = prev.findIndex((m) => m.message_id === messageId)
					if (idx !== -1) {
						const next = [...prev]
						next[idx] = {
							...next[idx],
							chunk_id: chunk.chunk_id,
							message_id: messageId,
							type: mergedState.type,
							props: snapshotProps,
							delta: isCompleted ? false : chunk.delta
						}
						return next
					}
					return [...prev, {
						ui_id: nanoid(),
						chunk_id: chunk.chunk_id,
						message_id: messageId,
						type: mergedState.type,
						props: snapshotProps,
						delta: isCompleted ? false : chunk.delta
					}]
				})
			},
			(error: any) => {
				console.error('[ChatDrawer] Stream error:', error)
				setMessages((prev) => [...prev, {
					type: 'error',
					props: { message: error?.message || (is_cn ? '发送失败，请重试' : 'Failed to send, please retry') },
					ui_id: `error-${Date.now()}`,
					message_id: `error-${Date.now()}`
				}])
				setStreaming(false)
				setSending(false)
				delete abortRef.current
			}
		)

		abortRef.current = abortFn
	}, [inputContent, sending, isFinalized, chatClient, assistantId, metadata, is_cn, attachments])

	const handleComplete = useCallback(async () => {
		if (messages.length === 0) return

		setCompleted(true)
		await onComplete?.()

		setTimeout(() => {
			onClose()
		}, 1000)
	}, [messages.length, onComplete, onClose])

	const handleClose = () => {
		if (sending) {
			abortRef.current?.()
			abortRef.current = null
			setStreaming(false)
			setSending(false)
		}
		if (!completed) {
			onClose()
		}
	}

	const handleFileAdd = () => {
		fileInputRef.current?.click()
	}

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) return

		if (fileInputRef.current) fileInputRef.current.value = ''

		const openapi = window.$app?.openapi
		if (!openapi) return

		const uploaderID = '__yao.attachment'
		const fileApi = new FileAPI(openapi, uploaderID)

		const newAttachments: ChatAttachment[] = Array.from(files).map((file) => ({
			id: Math.random().toString(36).substring(7),
			file,
			name: file.name,
			type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
			previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
			uploading: true
		}))

		setAttachments((prev) => [...prev, ...newAttachments])

		for (const att of newAttachments) {
			try {
				const res = await fileApi.Upload(att.file, {
					uploaderID,
					originalFilename: att.name,
					compressImage: att.type === 'image',
					public: true
				})

				if (openapi.IsError(res) || !res.data?.file_id) {
					throw new Error(res.error?.error_description || (is_cn ? '上传失败' : 'Upload failed'))
				}

				const fileId = res.data.file_id
				const wrapper = `${uploaderID}://${fileId}`

				setAttachments((prev) =>
					prev.map((p) => (p.id === att.id ? { ...p, uploading: false, fileId, wrapper } : p))
				)
			} catch (err: any) {
				console.error('[ChatDrawer] Upload error:', err)
				setAttachments((prev) =>
					prev.map((p) =>
						p.id === att.id
							? { ...p, uploading: false, error: err?.message || (is_cn ? '上传失败' : 'Upload failed') }
							: p
					)
				)
			}
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault()
			const hasReadyAttachments = attachments.some((a) => !a.uploading && !a.error && a.wrapper)
			if ((inputContent.trim() || hasReadyAttachments) && !sending) {
				handleSend()
			}
		}
		if (e.key === 'Escape' && !sending && !completed) {
			handleClose()
		}
	}

	if (!visible) return null

	return (
		<div className={styles.drawerOverlay} onClick={handleClose}>
			<div
				className={styles.drawerPanel}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={handleKeyDown}
				tabIndex={-1}
			>
				{/* Header */}
				<div className={styles.drawerHeader}>
					<h3 className={styles.drawerTitle}>{title}</h3>
					<button className={styles.closeBtn} onClick={handleClose} disabled={sending || completed}>
						<Icon name='material-close' size={18} />
					</button>
				</div>

				{/* Meta Bar */}
				<div className={styles.metaBar}>
					<div className={styles.metaLeft}>
						<div className={styles.metaItem}>
							<Icon name='material-smart_toy' size={14} />
							<span>{context.robotName}</span>
						</div>
						<div className={styles.metaDivider} />
						{showExecutionContext && context.execution ? (
							<>
								<div className={styles.metaItem}>
									<Icon name='material-play_circle' size={14} />
									<span>{context.execution.phase}</span>
								</div>
								{context.execution.progress && (
									<>
										<div className={styles.metaDivider} />
										<div className={styles.metaItem}>
											<Icon name='material-pending' size={14} />
											<span>{context.execution.progress}</span>
										</div>
									</>
								)}
							</>
						) : (
							<div className={styles.metaItem}>
								<Icon name='material-person' size={14} />
								<span>{is_cn ? '手动触发' : 'Manual'}</span>
							</div>
						)}
					</div>
					{robotId && (
						<div className={styles.metaRight}>
							<button
								ref={historyBtnRef}
								className={`${styles.historyBtn} ${historyOpen ? styles.historyBtnActive : ''}`}
								onClick={handleHistoryToggle}
								title={is_cn ? '对话历史' : 'Chat History'}
							>
								<Icon name='material-history' size={16} />
							</button>

							{/* Floating dropdown — anchored to button via position:absolute on metaRight */}
							{historyOpen && (
								<div ref={historyDropdownRef} className={styles.historyDropdown}>
									<div className={styles.historyHeader}>
										<span>{is_cn ? '历史对话' : 'History'}</span>
										<button className={styles.historyNewBtn} onClick={handleNewConversation}>
											<Icon name='material-add' size={12} />
											<span>{is_cn ? '新对话' : 'New'}</span>
										</button>
									</div>
									<div className={styles.historyList}>
										{historyLoading ? (
											<div className={styles.historyEmpty}>{is_cn ? '加载中...' : 'Loading...'}</div>
										) : historyItems.length === 0 ? (
											<div className={styles.historyEmpty}>{is_cn ? '暂无历史对话' : 'No history'}</div>
										) : (
											historyItems.map((item) => (
												<div
													key={item.chat_id}
													className={`${styles.historyItem} ${item.chat_id === chatIdRef.current ? styles.historyItemActive : ''}`}
													onClick={() => handleHistorySelect(item)}
												>
													<span className={styles.historyItemTitle}>{item.title}</span>
													<button
														className={styles.historyItemDelete}
														onClick={(e) => handleHistoryDelete(e, item)}
														title={is_cn ? '删除' : 'Delete'}
													>
														<Icon name='material-close' size={12} />
													</button>
												</div>
											))
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Content */}
				<div className={styles.drawerContent}>
					{completed && successState ? (
						<div className={styles.successState}>
							<div className={styles.successIcon}>
								<Icon name='material-check' size={32} />
							</div>
							<span className={styles.successTitle}>{successState.title}</span>
							<span className={styles.successHint}>{successState.hint}</span>
						</div>
					) : (
						<>
							{/* Execution Context Panel - for guide mode */}
							{showExecutionContext && context.execution && (context.execution.goals || context.execution.tasks) && (
								<div className={styles.contextPanel}>
									<div 
										className={styles.contextHeader}
										onClick={() => setContextExpanded(!contextExpanded)}
									>
										<div className={styles.contextHeaderLeft}>
											<Icon name='material-info' size={14} />
											<span>{is_cn ? '执行上下文' : 'Execution Context'}</span>
										</div>
										<Icon 
											name={contextExpanded ? 'material-expand_less' : 'material-expand_more'} 
											size={16} 
											className={styles.contextExpandIcon}
										/>
									</div>
									{contextExpanded && (
										<div className={styles.contextBody}>
											{context.execution.currentTask && (
												<div className={styles.contextSection}>
													<div className={styles.contextSectionHeader}>
														<Icon name='material-play_arrow' size={14} />
														<span>{is_cn ? '当前任务' : 'Current Task'}</span>
													</div>
													<div className={styles.currentTaskCard}>
														<div className={styles.currentTaskPulse} />
														<span>{context.execution.currentTask}</span>
														{context.execution.progress && (
															<span className={styles.currentTaskProgress}>
																{context.execution.progress}
															</span>
														)}
													</div>
												</div>
											)}

											{context.execution.goals && (
												<div className={styles.contextSection}>
													<div className={styles.contextSectionHeader}>
														<Icon name='material-flag' size={14} />
														<span>{is_cn ? '执行目标' : 'Goals'}</span>
													</div>
													<div className={styles.goalsCard}>
														<pre>{context.execution.goals}</pre>
													</div>
												</div>
											)}

											{context.execution.tasks && context.execution.tasks.length > 0 && (
												<div className={styles.contextSection}>
													<div className={styles.contextSectionHeader}>
														<Icon name='material-checklist' size={14} />
														<span>{is_cn ? '任务列表' : 'Task List'}</span>
														<span className={styles.contextSectionCount}>
															{context.execution.tasks.filter(t => t.status === 'completed').length}/{context.execution.tasks.length}
														</span>
													</div>
													<div className={styles.taskListCard}>
														{context.execution.tasks.map((task) => {
															const statusInfo = getTaskStatusIcon(task.status)
															return (
																<div 
																	key={task.id} 
																	className={`${styles.taskItem} ${task.status === 'running' ? styles.taskItemCurrent : ''}`}
																>
																	<div className={`${styles.taskIcon} ${statusInfo.class}`}>
																		<Icon name={statusInfo.icon} size={14} />
																	</div>
																	<span className={styles.taskName}>{task.name}</span>
																</div>
															)
														})}
													</div>
												</div>
											)}
										</div>
									)}
								</div>
							)}

							{/* Message Area */}
							<div className={styles.messageArea}>
								{messages.length === 0 && !streaming ? (
									<div className={styles.emptyMessages}>
										<div className={styles.emptyCreature}>
											<Creature
												status={context.robotStatus}
												size='medium'
												animated={true}
												showAura={true}
												showRing={false}
												showGlow={true}
											/>
										</div>
										<span className={styles.emptyTitle}>{emptyState.title}</span>
										<span className={styles.emptyHint}>{emptyState.hint}</span>
									</div>
								) : (
									<DrawerMessageList
										messages={messages}
										streaming={streaming}
										interactResult={interactResult}
									/>
								)}
							</div>

							{/* Input Area */}
							<div className={styles.inputArea}>
							{attachments.length > 0 && (
								<div className={styles.attachmentList}>
									{attachments.map((att) => (
										<div
											key={att.id}
											className={`${styles.attachmentItem} ${att.error ? styles.attachmentError : ''}`}
										>
											{att.type === 'image' && att.previewUrl ? (
												<div
													className={styles.attachmentThumb}
													style={{ backgroundImage: `url(${att.previewUrl})` }}
												/>
											) : (
												<Icon name='material-attach_file' size={12} />
											)}
											<span className={styles.attachmentName}>{att.name}</span>
											{att.uploading && (
												<span className={styles.attachmentUploading}>
													<Icon name='material-sync' size={10} />
												</span>
											)}
											{att.error && (
												<span className={styles.attachmentErrorText}>
													{att.error}
												</span>
											)}
											<button
												className={styles.attachmentRemove}
												onClick={() => {
													if (att.previewUrl) URL.revokeObjectURL(att.previewUrl)
													setAttachments((prev) => prev.filter((p) => p.id !== att.id))
												}}
											>
												<Icon name='material-close' size={10} />
											</button>
										</div>
									))}
								</div>
							)}

								<div className={styles.inputRow}>
								<button
									className={styles.actionBtn}
									onClick={handleFileAdd}
									disabled={sending || isFinalized}
									title={is_cn ? '添加附件' : 'Add attachment'}
								>
									<Icon name='material-attach_file' size={16} />
								</button>
								<input
									type='file'
									ref={fileInputRef}
									style={{ display: 'none' }}
									onChange={handleFileSelect}
									multiple
								/>
								<textarea
									ref={textareaRef}
									className={styles.taskInput}
									placeholder={isFinalized ? (is_cn ? '任务已确认' : 'Task confirmed') : placeholder}
									value={inputContent}
									onChange={handleInputChange}
									disabled={sending || isFinalized}
									rows={1}
								/>
								<button
									className={`${styles.sendBtn} ${
										(!inputContent.trim() && !attachments.some((a) => !a.uploading && !a.error && a.wrapper))
											|| sending || isFinalized || attachments.some((a) => a.uploading)
											? styles.sendBtnDisabled : ''
									}`}
									onClick={handleSend}
									disabled={
										(!inputContent.trim() && !attachments.some((a) => !a.uploading && !a.error && a.wrapper))
											|| sending || isFinalized || attachments.some((a) => a.uploading)
									}
								>
										<Icon name='material-rocket_launch' size={16} />
									</button>
								</div>
								<div className={styles.inputHint}>
									{is_cn ? '⌘+Enter 发送' : '⌘+Enter to send'}
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	)
}

export default ChatDrawer
