import { useState, useEffect, useCallback, useRef } from 'react'
import { getLocale } from '@umijs/max'
import clsx from 'clsx'
import Icon from '@/widgets/Icon'
import type { Message } from '@/openapi'
import { MessageList } from '@/chatbox'
import InputArea from '@/chatbox/components/InputArea'
import type { SendMessageRequest } from '@/chatbox/types'
import { useGlobal } from '@/context/app'
import { Agent } from '@/openapi/agent'
import { useKanbanContext } from '../../context'
import * as services from '../../services'
import { getTaskMessages, sendMessage } from '../../services'
import type { KanbanTask } from '../../types'
import TaskInput from './TaskInput'
import styles from './index.less'

interface TaskDetailProps {
	taskId: string | null
	open: boolean
	onClose: () => void
	panelWidth: number
	onWidthChange: (width: number) => void
	isAnimating?: boolean
}

type TabKey = 'chat' | 'workspace' | 'services' | 'outputs' | 'settings'

const MIN_WIDTH = 360
const MAX_WIDTH = 900

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const TaskDetail = ({ taskId, open, onClose, panelWidth, onWidthChange, isAnimating }: TaskDetailProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()
	const { tasks, creatingTaskId, finalizeCreating, board } = useKanbanContext()
	const [isResizing, setIsResizing] = useState(false)

	const [activeTab, setActiveTab] = useState<TabKey>('chat')
	const [messages, setMessages] = useState<Message[]>([])
	const [messagesLoading, setMessagesLoading] = useState(false)
	const [sending, setSending] = useState(false)
	const [assistant, setAssistant] = useState<any>(null)

	const task = tasks.find((t) => t.id === taskId) || null
	const isCreating = task?.status === 'creating'

	const loadAssistantInfo = useCallback(
		(assistantId: string) => {
			if (!window.$app?.openapi || !assistantId) return
			const agentClient = new Agent(window.$app.openapi)
			agentClient.assistants
				.GetInfo(assistantId, locale)
				.then((res) => {
					if (!window.$app.openapi.IsError(res)) {
						const data = window.$app.openapi.GetData(res)
						setAssistant({
							id: data.assistant_id,
							name: data.name,
							avatar: data.avatar,
							description: data.description,
							connector: data.connector,
							connector_options: data.connector_options,
							modes: data.modes,
							default_mode: data.default_mode,
							sandbox: data.sandbox,
							computer_filter: data.computer_filter,
							allowModelSelection: data.connector_options?.optional || false,
							defaultModel: data.connector
						})
					}
				})
				.catch(() => {})
		},
		[locale]
	)

	const handleSwitchAssistant = useCallback(
		(assistantId: string) => {
			loadAssistantInfo(assistantId)
		},
		[loadAssistantInfo]
	)

	useEffect(() => {
		const assistantId = global.default_assistant?.assistant_id
		if (assistantId) loadAssistantInfo(assistantId)
	}, [global.default_assistant?.assistant_id, loadAssistantInfo])

	useEffect(() => {
		if (!taskId || !open) return
		setActiveTab('chat')
		if (taskId.startsWith('temp_')) return
		setMessagesLoading(true)
		getTaskMessages(taskId)
			.then(setMessages)
			.finally(() => setMessagesLoading(false))
	}, [taskId, open])

	const handleSend = useCallback(
		async (content: string) => {
			if (!taskId) return
			setSending(true)
			try {
				const msg = await sendMessage(taskId, content)
				setMessages((prev) => [...prev, msg])
			} finally {
				setSending(false)
			}
		},
		[taskId]
	)

	const handleCreateSend = useCallback(
		async (request: SendMessageRequest) => {
			const message = request.messages[0]
			if (!message || !creatingTaskId) return

			const text =
				typeof message.content === 'string'
					? message.content
					: message.content
							.map((c) => (c.type === 'text' ? c.text || '' : ''))
							.join('')

			if (!text.trim()) return

			setSending(true)
			try {
				const title = text.split('\n')[0].slice(0, 60)
				const creatingTask = tasks.find((t) => t.id === creatingTaskId)
				const columnId =
					creatingTask?.column_id || board?.columns[board.columns.length - 1]?.id || ''

				const realTask = await services.createTask({
					title,
					description: text.trim(),
					column_id: columnId
				})

				finalizeCreating(creatingTaskId, realTask)
			} finally {
				setSending(false)
			}
		},
		[creatingTaskId, tasks, board, finalizeCreating]
	)

	const tabs: { key: TabKey; cn: string; en: string; icon: string }[] = [
		{ key: 'chat', cn: '会话', en: 'Chat', icon: 'material-chat' },
		{ key: 'workspace', cn: '工作区', en: 'Workspace', icon: 'material-folder' },
		{ key: 'services', cn: '服务', en: 'Services', icon: 'material-language' },
		{ key: 'outputs', cn: '产出', en: 'Outputs', icon: 'material-attach_file' },
		{ key: 'settings', cn: '设置', en: 'Settings', icon: 'material-settings' }
	]

	const statusLabels: Record<string, { cn: string; en: string }> = {
		creating: { cn: '创建中', en: 'Creating' },
		pending: { cn: '待执行', en: 'Pending' },
		running: { cn: '运行中', en: 'Running' },
		waiting_input: { cn: '等待输入', en: 'Waiting for Input' },
		completed: { cn: '已完成', en: 'Completed' },
		failed: { cn: '失败', en: 'Failed' },
		paused: { cn: '已暂停', en: 'Paused' },
		cancelled: { cn: '已取消', en: 'Cancelled' }
	}

	const renderChatTab = () => {
		if (isCreating) {
			return (
				<div className={styles.tabContent}>
					<div className={styles.creatingHint}>
						<Icon name='material-chat_bubble_outline' size={32} className={styles.creatingHintIcon} />
						<p>{is_cn ? '输入任务描述，开始执行' : 'Describe your task to get started'}</p>
					</div>
					<InputArea
						mode='normal'
						onSend={handleCreateSend}
						loading={sending}
						disabled={sending}
						assistant={assistant}
						onSwitchAssistant={handleSwitchAssistant}
					/>
				</div>
			)
		}
		return (
			<div className={styles.tabContent}>
				<div className={styles.messageList}>
					<MessageList
						messages={messages}
						loading={messagesLoading}
						streaming={task?.status === 'running'}
					/>
				</div>
				<TaskInput
					onSend={handleSend}
					loading={sending}
					disabled={task?.status === 'completed' || task?.status === 'cancelled'}
					placeholder={is_cn ? '输入消息...' : 'Type a message...'}
				/>
			</div>
		)
	}

	const renderWorkspaceTab = () => {
		if (!task?.workspace) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-folder_open' size={32} />
					<p>{is_cn ? '未绑定工作区' : 'No workspace bound'}</p>
				</div>
			)
		}
		return (
			<div className={styles.infoTab}>
				<div className={styles.infoCard}>
					<div className={styles.infoCardHeader}>
						<Icon name='material-folder' size={14} />
						{task.workspace.name}
					</div>
					<div className={styles.infoCardBody}>
						{task.workspace.path && (
							<div className={styles.infoRow}>
								<span className={styles.infoLabel}>{is_cn ? '路径' : 'Path'}</span>
								<span className={styles.infoValue}>{task.workspace.path}</span>
							</div>
						)}
						{task.workspace.node_name && (
							<div className={styles.infoRow}>
								<span className={styles.infoLabel}>{is_cn ? '节点' : 'Node'}</span>
								<span className={styles.infoValue}>{task.workspace.node_name}</span>
							</div>
						)}
						<div className={styles.infoRow}>
							<span className={styles.infoLabel}>{is_cn ? '状态' : 'Status'}</span>
							<span className={styles.infoValue}>
								{task.workspace.status === 'online'
									? (is_cn ? '在线' : 'Online')
									: (is_cn ? '离线' : 'Offline')}
							</span>
						</div>
					</div>
				</div>
				<span className={styles.linkBtn}>
					<Icon name='material-open_in_new' size={12} />
					{is_cn ? '打开工作区' : 'Open Workspace'}
				</span>
			</div>
		)
	}

	const renderServicesTab = () => {
		if (!task?.services?.length) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-cloud_off' size={32} />
					<p>{is_cn ? '暂无关联服务' : 'No services'}</p>
				</div>
			)
		}
		return (
			<div className={styles.infoTab}>
				<div className={styles.infoCard}>
					<div className={styles.infoCardHeader}>
						<Icon name='material-language' size={14} />
						{is_cn ? '关联服务' : 'Services'}
					</div>
					<div className={styles.infoCardBody}>
						{task.services.map((s) => (
							<div key={s.port} className={styles.serviceItem}>
								<span className={styles.serviceStatus} />
								<span className={styles.serviceName}>{s.name}</span>
								<span className={styles.serviceUrl}>:{s.port}</span>
								<span className={styles.linkBtn}>
									<Icon name='material-open_in_new' size={11} />
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		)
	}

	const renderOutputsTab = () => {
		if (!task?.outputs?.length) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-folder_open' size={32} />
					<p>{is_cn ? '暂无产出文件' : 'No outputs yet'}</p>
				</div>
			)
		}
		return (
			<div className={styles.infoTab}>
				<div className={styles.infoCard}>
					<div className={styles.infoCardHeader}>
						<Icon name='material-attach_file' size={14} />
						{is_cn ? '产出文件' : 'Output Files'}
					</div>
					<div className={styles.infoCardBody}>
						{task.outputs.map((f) => (
							<div key={f.name} className={styles.outputItem}>
								<Icon name='material-description' size={14} style={{ color: 'var(--color_neo_icon_muted)' }} />
								<span className={styles.outputName}>{f.name}</span>
								<span className={styles.outputSize}>{formatFileSize(f.size)}</span>
								<span className={styles.linkBtn}>
									<Icon name='material-download' size={11} />
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		)
	}

	const renderSettingsTab = () => (
		<div className={styles.infoTab}>
			<div className={styles.infoCard}>
				<div className={styles.infoCardHeader}>
					<Icon name='material-settings' size={14} />
					{is_cn ? '任务设置' : 'Task Settings'}
				</div>
				<div className={styles.infoCardBody}>
					{task?.assistant_name && (
						<div className={styles.infoRow}>
							<span className={styles.infoLabel}>{is_cn ? 'AI 助手' : 'AI Assistant'}</span>
							<span className={styles.infoValue}>{task.assistant_name}</span>
						</div>
					)}
					{task?.tags && task.tags.length > 0 && (
						<div className={styles.infoRow}>
							<span className={styles.infoLabel}>{is_cn ? '标签' : 'Tags'}</span>
							<span className={styles.infoValue}>{task.tags.join(', ')}</span>
						</div>
					)}
					{task?.recurring?.enabled && (
						<>
							<div className={styles.infoRow}>
								<span className={styles.infoLabel}>{is_cn ? '调度模式' : 'Schedule'}</span>
								<span className={styles.infoValue}>
									{task.recurring.mode === 'fixed_time'
										? (is_cn ? '固定时间' : 'Fixed Time')
										: (is_cn ? '固定间隔' : 'Interval')}
								</span>
							</div>
							{task.recurring.cron && (
								<div className={styles.infoRow}>
									<span className={styles.infoLabel}>Cron</span>
									<span className={styles.infoValue}>{task.recurring.cron}</span>
								</div>
							)}
							{task.run_count != null && (
								<div className={styles.infoRow}>
									<span className={styles.infoLabel}>{is_cn ? '已执行' : 'Run Count'}</span>
									<span className={styles.infoValue}>{task.run_count}</span>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	)

	const renderTabContent = () => {
		switch (activeTab) {
			case 'chat':
				return renderChatTab()
			case 'workspace':
				return renderWorkspaceTab()
			case 'services':
				return renderServicesTab()
			case 'outputs':
				return renderOutputsTab()
			case 'settings':
				return renderSettingsTab()
			default:
				return renderChatTab()
		}
	}

	const handleResizeStart = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault()
			setIsResizing(true)

			const startX = e.clientX
			const startWidth = panelWidth

			document.body.style.cursor = 'col-resize'
			document.body.style.userSelect = 'none'

			const overlay = document.createElement('div')
			overlay.id = 'kanban-resize-overlay'
			overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;cursor:col-resize;'
			document.body.appendChild(overlay)

			const onMouseMove = (ev: MouseEvent) => {
				const delta = startX - ev.clientX
				const next = Math.min(Math.max(startWidth + delta, MIN_WIDTH), MAX_WIDTH)
				onWidthChange(next)
			}

			const onMouseUp = () => {
				document.body.style.cursor = ''
				document.body.style.userSelect = ''
				document.getElementById('kanban-resize-overlay')?.remove()
				document.removeEventListener('mousemove', onMouseMove)
				document.removeEventListener('mouseup', onMouseUp)
				setIsResizing(false)
			}

			document.addEventListener('mousemove', onMouseMove)
			document.addEventListener('mouseup', onMouseUp)
		},
		[panelWidth]
	)

	const statusLabel = task ? (statusLabels[task.status] || statusLabels.pending) : null
	const showContent = !!taskId

	return (
		<div
			className={clsx(styles.panel, open && styles.open, isAnimating && styles.animating)}
			style={{ width: panelWidth }}
		>
			<div className={styles.resizeHandle} onMouseDown={handleResizeStart}>
				<div className={styles.resizeBar} />
			</div>

			{showContent && task && (
				<>
					<div className={styles.panelHeader}>
						<span className={clsx(styles.statusDot, styles[task.status])} />
						<span className={styles.panelTitle}>{task.title}</span>
						{statusLabel && (
							<span className={styles.panelStatus}>
								{is_cn ? statusLabel.cn : statusLabel.en}
							</span>
						)}
						{!isCreating && task.status === 'running' && (
							<span className={styles.controlBtn} title={is_cn ? '暂停' : 'Pause'}>
								<Icon name='material-pause' size={16} />
							</span>
						)}
						{!isCreating && (
							<span
								className={clsx(styles.controlBtn, styles.danger)}
								title={is_cn ? '取消' : 'Cancel'}
							>
								<Icon name='material-stop' size={16} />
							</span>
						)}
						<span className={styles.controlBtn} onClick={onClose}>
							<Icon name='material-close' size={16} />
						</span>
					</div>

					{!isCreating && (
						<div className={styles.tabs}>
							{tabs.map((t) => (
								<span
									key={t.key}
									className={clsx(styles.tab, activeTab === t.key && styles.active)}
									onClick={() => setActiveTab(t.key)}
								>
									<Icon name={t.icon} size={14} />
									{is_cn ? t.cn : t.en}
								</span>
							))}
						</div>
					)}

					{isCreating ? renderChatTab() : renderTabContent()}
				</>
			)}
		</div>
	)
}

export default window.$app.memo(TaskDetail)
