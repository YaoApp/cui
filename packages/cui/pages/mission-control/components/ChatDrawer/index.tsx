import React, { useState, useCallback, useEffect, useRef } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Creature from '@/widgets/Creature'
import DrawerMessageList from './DrawerMessageList'
import { newStreamSession, processChunk } from '@/chatbox/utils/chunkProcessor'
import type { StreamSession } from '@/chatbox/utils/chunkProcessor'
import { clearMessageCache } from '@/chatbox/hooks/delta'
import type { Message as CUIMessage, StreamCallback } from '@/openapi/chat/types'
import type { InteractDoneData } from '@/openapi/agent/robot/types'
import type { RobotState } from '../../types'
import styles from './index.less'

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
	onSend?: (content: string, onChunk: StreamCallback) => Promise<InteractDoneData | null>
	onComplete?: () => void
	showExecutionContext?: boolean
	chatId?: string
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
	onSend,
	onComplete,
	showExecutionContext = false,
	chatId: propChatId,
	initialMessages
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const chatIdRef = useRef(propChatId || `chat-drawer-${Date.now()}`)
	const sessionRef = useRef<StreamSession>(newStreamSession())

	const [messages, setMessages] = useState<CUIMessage[]>(initialMessages || [])
	const [inputContent, setInputContent] = useState('')
	const [attachments, setAttachments] = useState<File[]>([])
	const [sending, setSending] = useState(false)
	const [streaming, setStreaming] = useState(false)
	const [completed, setCompleted] = useState(false)
	const [contextExpanded, setContextExpanded] = useState(false)
	const [interactResult, setInteractResult] = useState<InteractDoneData | null>(null)

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
				chatIdRef.current = `chat-drawer-${Date.now()}`
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

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInputContent(e.target.value)
		const textarea = e.target
		textarea.style.height = 'auto'
		textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
	}

	const handleSend = useCallback(async () => {
		if (!inputContent.trim() || sending || isFinalized) return

		const userContent = inputContent.trim()
		const userMsg: CUIMessage = {
			type: 'user_input',
			props: { content: userContent, role: 'user' },
			ui_id: `user-${Date.now()}`,
			message_id: `user-${Date.now()}`
		}

		setMessages((prev) => [...prev, userMsg])
		setInputContent('')
		setSending(true)
		setStreaming(true)
		setInteractResult(null)

		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
		}

		// New stream session per send to isolate message_ids across rounds
		sessionRef.current = newStreamSession()
		const currentChatId = chatIdRef.current
		const currentSession = sessionRef.current

		try {
			const onChunk: StreamCallback = (chunk) => {
				if (!chunk) return

				// Events: handle interact_done and message lifecycle, skip others
				if (chunk.type === 'event') {
					const eventName = chunk.props?.event as string

					if (eventName === 'interact_done') {
						const doneData = (chunk.props?.data || chunk.props) as InteractDoneData
						if (doneData) {
							setInteractResult(doneData)
						}
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

					// stream_start, stream_end, etc. — no message updates needed
					return
				}

				// Data chunks: apply processChunk to update messages
				setMessages((prev) => {
					const processed = processChunk(currentSession, currentChatId, chunk, prev)
					return processed.messages
				})
			}

			const doneData = await onSend?.(userContent, onChunk)
			if (doneData) {
				setInteractResult((prev) => prev || doneData)
			}
		} catch {
			const errMsg: CUIMessage = {
				type: 'error',
				props: { message: is_cn ? '发送失败，请重试' : 'Failed to send, please retry' },
				ui_id: `error-${Date.now()}`,
				message_id: `error-${Date.now()}`
			}
			setMessages((prev) => [...prev, errMsg])
		} finally {
			setSending(false)
			setStreaming(false)
			setAttachments([])
			if (!interactResult || interactResult.wait_for_more) {
				setTimeout(() => textareaRef.current?.focus(), 50)
			}
		}
	}, [inputContent, sending, isFinalized, onSend, is_cn])

	const handleComplete = useCallback(async () => {
		if (messages.length === 0) return

		setCompleted(true)
		await onComplete?.()

		setTimeout(() => {
			onClose()
		}, 1000)
	}, [messages.length, onComplete, onClose])

	const handleClose = () => {
		if (!sending && !completed) {
			onClose()
		}
	}

	const handleFileAdd = () => {
		console.log('Add file attachment')
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault()
			if (inputContent.trim() && !sending) {
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
										{attachments.map((file, index) => (
											<div key={index} className={styles.attachmentItem}>
												<Icon name='material-attach_file' size={12} />
												<span className={styles.attachmentName}>{file.name}</span>
												<button
													className={styles.attachmentRemove}
													onClick={() =>
														setAttachments((prev) => prev.filter((_, i) => i !== index))
													}
												>
													<Icon name='material-close' size={10} />
												</button>
											</div>
										))}
									</div>
								)}

								<div className={styles.inputRow}>
								{/* TODO: v2 — Attachment upload */}
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
										!inputContent.trim() || sending || isFinalized ? styles.sendBtnDisabled : ''
									}`}
									onClick={handleSend}
									disabled={!inputContent.trim() || sending || isFinalized}
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
