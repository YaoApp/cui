import React, { useState, useCallback, useEffect, useRef } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Creature from '@/widgets/Creature'
import type { RobotState } from '../../types'
import styles from './index.less'

// ==================== Types ====================
export interface Message {
	id: string
	role: 'user' | 'assistant'
	content: string
	timestamp: Date
	status?: 'sending' | 'sent' | 'error'
}

export interface ExecutionContextInfo {
	name: string
	phase: string
	currentTask?: string
	progress?: string
	/** Goals content (markdown/text) */
	goals?: string
	/** Task list for display */
	tasks?: Array<{
		id: string
		name: string
		status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled'
	}>
}

export interface ChatDrawerContext {
	/** Type of context: assign (new task) or guide (running execution) */
	type: 'assign' | 'guide'
	/** Robot display name */
	robotName: string
	/** Robot status for Creature avatar */
	robotStatus: RobotState['status']
	/** For guide mode: execution context info */
	execution?: ExecutionContextInfo
}

export interface ChatDrawerProps {
	visible: boolean
	onClose: () => void
	context: ChatDrawerContext
	/** Drawer title */
	title: string
	/** Empty state config */
	emptyState: {
		icon: string
		title: string
		hint: string
	}
	/** Input placeholder text */
	placeholder: string
	/** Success state config (shown after task complete) */
	successState?: {
		title: string
		hint: string
	}
	/** Called when user sends a message */
	onSend?: (content: string, attachments?: File[]) => Promise<string | null>
	/** Called when task/guidance is confirmed complete */
	onComplete?: () => void
	/** Whether to show execution context in meta bar (for guide mode) */
	showExecutionContext?: boolean
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
	showExecutionContext = false
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	const [messages, setMessages] = useState<Message[]>([])
	const [inputContent, setInputContent] = useState('')
	const [attachments, setAttachments] = useState<File[]>([])
	const [sending, setSending] = useState(false)
	const [completed, setCompleted] = useState(false)
	const [contextExpanded, setContextExpanded] = useState(false)

	// Task status icon helper
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

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	// Focus textarea when opened
	useEffect(() => {
		if (visible && textareaRef.current) {
			setTimeout(() => textareaRef.current?.focus(), 100)
		}
	}, [visible])

	// Reset state when closed
	useEffect(() => {
		if (!visible) {
			setMessages([])
			setInputContent('')
			setAttachments([])
			setCompleted(false)
		}
	}, [visible])

	// Auto-resize textarea
	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInputContent(e.target.value)
		// Auto-resize
		const textarea = e.target
		textarea.style.height = 'auto'
		textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
	}

	const handleSend = useCallback(async () => {
		if (!inputContent.trim() || sending) return

		const userMessage: Message = {
			id: `msg-${Date.now()}`,
			role: 'user',
			content: inputContent.trim(),
			timestamp: new Date(),
			status: 'sending'
		}

		setMessages((prev) => [...prev, userMessage])
		setInputContent('')
		setSending(true)

		// Reset textarea height
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
		}

		try {
			// Call external send handler
			const response = await onSend?.(userMessage.content, attachments)

			// Update user message status
			setMessages((prev) =>
				prev.map((m) => (m.id === userMessage.id ? { ...m, status: 'sent' } : m))
			)

			// Add assistant response if provided
			if (response) {
				const assistantMessage: Message = {
					id: `msg-${Date.now()}-assistant`,
					role: 'assistant',
					content: response,
					timestamp: new Date()
				}
				setMessages((prev) => [...prev, assistantMessage])
			}
		} catch (error) {
			// Update message status to error
			setMessages((prev) =>
				prev.map((m) => (m.id === userMessage.id ? { ...m, status: 'error' } : m))
			)
		} finally {
			setSending(false)
			setAttachments([])
		}
	}, [inputContent, sending, attachments, onSend])

	const handleComplete = useCallback(async () => {
		if (messages.length === 0) return

		setCompleted(true)

		// Notify parent
		await onComplete?.()

		// Auto close after showing success
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
		// TODO: Implement file picker
		console.log('Add file attachment')
	}

	// Handle keyboard shortcuts
	const handleKeyDown = (e: React.KeyboardEvent) => {
		// Cmd/Ctrl + Enter to send
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault()
			if (inputContent.trim() && !sending) {
				handleSend()
			}
		}
		// Escape to close
		if (e.key === 'Escape' && !sending && !completed) {
			handleClose()
		}
	}

	// Format time
	const formatTime = (date: Date) => {
		const hours = date.getHours().toString().padStart(2, '0')
		const minutes = date.getMinutes().toString().padStart(2, '0')
		return `${hours}:${minutes}`
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
											{/* Current Task */}
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

											{/* Goals */}
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

											{/* Task List */}
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
								{messages.length === 0 ? (
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
									<div className={styles.messageList}>
										{messages.map((msg) => (
											<div
												key={msg.id}
												className={`${styles.message} ${
													msg.role === 'user' ? styles.messageUser : styles.messageAssistant
												}`}
											>
												{msg.role === 'assistant' && (
													<div className={styles.messageAvatar}>
														<Creature
															status={context.robotStatus}
															size='xs'
															animated={false}
															showAura={false}
															showRing={false}
															showGlow={false}
														/>
													</div>
												)}
												<div className={styles.messageContent}>
													<div className={styles.messageBubble}>
														{msg.content.split('\n').map((line, i) => (
															<React.Fragment key={i}>
																{line}
																{i < msg.content.split('\n').length - 1 && <br />}
															</React.Fragment>
														))}
													</div>
													<div className={styles.messageMeta}>
														<span className={styles.messageTime}>{formatTime(msg.timestamp)}</span>
														{msg.role === 'user' && msg.status === 'sending' && (
															<Icon name='material-schedule' size={12} className={styles.messageStatusIcon} />
														)}
														{msg.role === 'user' && msg.status === 'sent' && (
															<Icon name='material-done' size={12} className={styles.messageStatusIcon} />
														)}
														{msg.role === 'user' && msg.status === 'error' && (
															<Icon name='material-error_outline' size={12} className={styles.messageStatusError} />
														)}
													</div>
												</div>
											</div>
										))}
										{sending && (
											<div className={`${styles.message} ${styles.messageAssistant}`}>
												<div className={styles.messageAvatar}>
													<Creature
														status={context.robotStatus}
														size='xs'
														animated={false}
														showAura={false}
														showRing={false}
														showGlow={false}
													/>
												</div>
												<div className={styles.messageContent}>
													<div className={`${styles.messageBubble} ${styles.typing}`}>
														<span className={styles.typingDot} />
														<span className={styles.typingDot} />
														<span className={styles.typingDot} />
													</div>
												</div>
											</div>
										)}
										<div ref={messagesEndRef} />
									</div>
								)}
							</div>

							{/* Input Area */}
							<div className={styles.inputArea}>
								{/* Attachments Preview */}
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

								{/* Input Row */}
								<div className={styles.inputRow}>
									<button
										className={styles.actionBtn}
										onClick={handleFileAdd}
										disabled={sending}
										title={is_cn ? '添加附件' : 'Add attachment'}
									>
										<Icon name='material-attach_file' size={18} />
									</button>
									<textarea
										ref={textareaRef}
										className={styles.taskInput}
										placeholder={placeholder}
										value={inputContent}
										onChange={handleInputChange}
										disabled={sending}
										rows={1}
									/>
									<button
										className={`${styles.sendBtn} ${
											!inputContent.trim() || sending ? styles.sendBtnDisabled : ''
										}`}
										onClick={handleSend}
										disabled={!inputContent.trim() || sending}
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
