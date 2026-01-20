import React, { useState, useCallback, useEffect, useRef } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { RobotState } from '../../types'
import { robotNames } from '../../mock/data'
import styles from './index.less'

interface AssignTaskDrawerProps {
	visible: boolean
	onClose: () => void
	robot: RobotState
	onTaskAssigned?: () => void
}

const AssignTaskDrawer: React.FC<AssignTaskDrawerProps> = ({
	visible,
	onClose,
	robot,
	onTaskAssigned
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const [taskContent, setTaskContent] = useState('')
	const [attachments, setAttachments] = useState<File[]>([])
	const [submitting, setSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)

	// Get i18n display name
	const displayName = robotNames[robot.member_id]
		? is_cn
			? robotNames[robot.member_id].cn
			: robotNames[robot.member_id].en
		: robot.display_name

	// Focus textarea when opened
	useEffect(() => {
		if (visible && textareaRef.current) {
			setTimeout(() => textareaRef.current?.focus(), 100)
		}
	}, [visible])

	// Reset state when closed
	useEffect(() => {
		if (!visible) {
			setTaskContent('')
			setAttachments([])
			setSubmitted(false)
		}
	}, [visible])

	const handleSubmit = useCallback(async () => {
		if (!taskContent.trim()) return

		setSubmitting(true)

		// TODO: API call - POST /api/robots/:id/trigger
		// {
		//   type: 'human',
		//   input: {
		//     messages: [{ role: 'user', content: taskContent }],
		//     attachments: [...]
		//   }
		// }

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 800))

		setSubmitting(false)
		setSubmitted(true)

		// Auto close after showing success
		setTimeout(() => {
			onTaskAssigned?.()
			onClose()
		}, 1200)
	}, [taskContent, onTaskAssigned, onClose])

	const handleClose = () => {
		if (!submitting) {
			onClose()
		}
	}

	const handleFileAdd = () => {
		// TODO: Implement file picker
		console.log('Add file attachment')
	}

	// Handle keyboard shortcuts
	const handleKeyDown = (e: React.KeyboardEvent) => {
		// Cmd/Ctrl + Enter to submit
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault()
			if (taskContent.trim() && !submitting) {
				handleSubmit()
			}
		}
		// Escape to close
		if (e.key === 'Escape' && !submitting) {
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
			>
				{/* Header */}
				<div className={styles.drawerHeader}>
					<div className={styles.drawerTitle}>
						<Icon name='material-rocket_launch' size={16} />
						<span>{is_cn ? '指派任务' : 'Assign Task'}</span>
					</div>
					<button className={styles.closeBtn} onClick={handleClose} disabled={submitting}>
						<Icon name='material-close' size={16} />
					</button>
				</div>

				{/* Content */}
				<div className={styles.drawerContent}>
					{submitted ? (
						<div className={styles.successState}>
							<Icon name='material-check_circle' size={40} className={styles.successIcon} />
							<span className={styles.successText}>
								{is_cn ? '任务已提交' : 'Task Assigned'}
							</span>
						</div>
					) : (
						<>
							{/* Message History Area - placeholder for future chat history */}
							<div className={styles.messageArea}>
								<div className={styles.emptyMessages}>
									<Icon name='material-rocket_launch' size={36} />
									<span className={styles.emptyTitle}>
										{is_cn ? '指派任务给 ' + displayName : 'Assign task to ' + displayName}
									</span>
									<span className={styles.emptyHint}>
										{is_cn
											? '例如：帮我分析竞品最新动态、生成本周销售报告...'
											: 'e.g., Analyze competitor updates, Generate weekly sales report...'}
									</span>
								</div>
								{/* TODO: MessageList component will go here */}
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
									<textarea
										ref={textareaRef}
										className={styles.taskInput}
										placeholder={
											is_cn
												? '输入任务描述... ⌘+Enter 发送'
												: 'Enter task... ⌘+Enter to send'
										}
										value={taskContent}
										onChange={(e) => setTaskContent(e.target.value)}
										disabled={submitting}
										rows={1}
									/>
									<div className={styles.inputActions}>
										<button
											className={styles.actionBtn}
											onClick={handleFileAdd}
											disabled={submitting}
											title={is_cn ? '添加附件' : 'Add attachment'}
										>
											<Icon name='material-attach_file' size={16} />
										</button>
										<button
											className={`${styles.sendBtn} ${
												!taskContent.trim() || submitting ? styles.sendBtnDisabled : ''
											}`}
											onClick={handleSubmit}
											disabled={!taskContent.trim() || submitting}
										>
											{submitting ? (
												<Icon name='material-hourglass_empty' size={14} />
											) : (
												<Icon name='material-send' size={14} />
											)}
										</button>
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	)
}

export default AssignTaskDrawer
