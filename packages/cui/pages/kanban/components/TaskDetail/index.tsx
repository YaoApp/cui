import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { getLocale } from '@umijs/max'
import { Tooltip } from 'antd'
import clsx from 'clsx'
import Icon from '@/widgets/Icon'
import { TaskChat } from '@/chatbox'
import { Chat } from '@/openapi'
import { useGlobal } from '@/context/app'
import { KanbanContext } from '../../context'
import * as services from '../../services'
import DetailPanel from '../DetailPanel'
import TaskSidebar from '../TaskSidebar'
import SidebarContent from '../SidebarContent'
import { useSidebarTabs } from '../../hooks/useSidebarTabs'
import type { KanbanTask } from '../../types'
import styles from './index.less'

interface TaskDetailProps {
	taskId: string | null
	open: boolean
	onClose: () => void
	onPanelWidthChange?: (width: number) => void
	isAnimating?: boolean
	inline?: boolean
}

const DEFAULT_CHAT_WIDTH = 560
const DEFAULT_SIDEBAR_WIDTH = 480
const MIN_CHAT_WIDTH = 280
const MIN_SIDEBAR_WIDTH = 280

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

const TaskDetail = ({ taskId, open, onClose, onPanelWidthChange, isAnimating, inline }: TaskDetailProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()
	const ctx = useContext(KanbanContext)

	const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH)
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
	const [refreshKey, setRefreshKey] = useState(0)
	const [localTask, setLocalTask] = useState<KanbanTask | null>(null)
	const [inlineAnimating, setInlineAnimating] = useState(false)

	const chatWidthRef = useRef(chatWidth)
	chatWidthRef.current = chatWidth
	const taskPageRef = useRef<HTMLDivElement>(null)
	const inlineAnimTimerRef = useRef<number>()

	const [loadingTask, setLoadingTask] = useState(false)

	// Prefer task from KanbanContext (Kanban page); fallback to independent loading (Inbox page)
	const task = ctx?.tasks.find((t) => t.id === taskId) || localTask

	useEffect(() => {
		if (ctx || !taskId) {
			setLocalTask(null)
			setLoadingTask(false)
			return
		}
		setLoadingTask(true)
		services
			.getTaskDetail(taskId)
			.then(setLocalTask)
			.catch(() => setLocalTask(null))
			.finally(() => setLoadingTask(false))
	}, [taskId, ctx])

	const creatingTaskId = ctx?.creatingTaskId || null
	const finalizeCreating = ctx?.finalizeCreating || (() => {})
	const board = ctx?.board || null
	const triggerAnimation = ctx?.triggerAnimation || (() => {})

	const isCreating = task?.status === 'creating'

	const totalWidth = chatWidth + (sidebarOpen ? sidebarWidth : 0)

	// Sidebar tabs management
	const sidebar = useSidebarTabs()

	// Notify parent of width changes (only in sliding mode)
	useEffect(() => {
		if (open && onPanelWidthChange) onPanelWidthChange(totalWidth)
	}, [totalWidth, open, onPanelWidthChange])

	// Reset sidebar only when detail panel closes entirely
	useEffect(() => {
		if (!open) {
			setSidebarOpen(false)
			sidebar.closeAllTabs()
		}
	}, [open])

	// Register/unregister detail_panel_active flag
	useEffect(() => {
		if (!open) {
			global.setDetailPanelActive(false)
			return
		}
		global.setDetailPanelActive(true)

		const handleOpenSidebar = (detail: any) => {
			let url = detail?.url || detail?.path
			if (!url) return

			// Normalize CUI page URLs: events from navigate action arrive
			// as plain paths (e.g. "/workspace/list"). Re-add the $dashboard/
			// prefix so SidebarContent renders them as embedded iframe pages.
			if (
				!url.startsWith('$dashboard/') &&
				!url.startsWith('__task/') &&
				!url.startsWith('/web/') &&
				!url.startsWith('http://') &&
				!url.startsWith('https://')
			) {
				url = `$dashboard${url.startsWith('/') ? url : '/' + url}`
			}

			sidebar.addTab(url, detail.title || url, detail.icon)
			setSidebarOpen(true)
			triggerAnimation()
		}

		const handleUpdateTabTitle = (detail: { url: string; title: string }) => {
			sidebar.updateTabTitle(detail.url, detail.title)
		}

		window.$app.Event.on('app/openSidebar', handleOpenSidebar)
		window.$app.Event.on('app/updateSidebarTabTitle', handleUpdateTabTitle)
		return () => {
			window.$app.Event.off('app/openSidebar', handleOpenSidebar)
			window.$app.Event.off('app/updateSidebarTabTitle', handleUpdateTabTitle)
			global.setDetailPanelActive(false)
		}
	}, [open])

	// Handle left-edge resize (total width)
	const handlePanelResize = useCallback(
		(newTotal: number) => {
			if (sidebarOpen) {
				const ratio = chatWidthRef.current / (chatWidthRef.current + sidebarWidth)
				const newChat = Math.max(Math.round(newTotal * ratio), MIN_CHAT_WIDTH)
				const newSb = Math.max(newTotal - newChat, MIN_SIDEBAR_WIDTH)
				setChatWidth(newChat)
				setSidebarWidth(newSb)
			} else {
				setChatWidth(Math.max(newTotal, MIN_CHAT_WIDTH))
			}
			onPanelWidthChange?.(newTotal)
		},
		[sidebarOpen, sidebarWidth, onPanelWidthChange]
	)

	// Handle middle resize handle (chat/sidebar split)
	const handleSidebarResizeStart = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault()
			const startX = e.clientX
			const startChatWidth = chatWidthRef.current
			const startSidebarWidth = sidebarWidth

			document.body.style.cursor = 'col-resize'
			document.body.style.userSelect = 'none'

			const overlay = document.createElement('div')
			overlay.id = 'task-sidebar-resize-overlay'
			overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;cursor:col-resize;'
			document.body.appendChild(overlay)

			const onMove = (ev: MouseEvent) => {
				const delta = ev.clientX - startX
				const newChat = Math.max(startChatWidth + delta, MIN_CHAT_WIDTH)
				const newSb = Math.max(startSidebarWidth - delta, MIN_SIDEBAR_WIDTH)
				setChatWidth(newChat)
				setSidebarWidth(newSb)
			}

			const onUp = () => {
				document.body.style.cursor = ''
				document.body.style.userSelect = ''
				document.getElementById('task-sidebar-resize-overlay')?.remove()
				document.removeEventListener('mousemove', onMove)
				document.removeEventListener('mouseup', onUp)
			}

			document.addEventListener('mousemove', onMove)
			document.addEventListener('mouseup', onUp)
		},
		[sidebarWidth]
	)

	const triggerInlineAnimation = useCallback(() => {
		if (!inline) return
		clearTimeout(inlineAnimTimerRef.current)
		setInlineAnimating(true)
		inlineAnimTimerRef.current = window.setTimeout(() => setInlineAnimating(false), 300)
	}, [inline])

	const closeSidebar = useCallback(() => {
		setSidebarOpen(false)
		triggerAnimation()
		triggerInlineAnimation()
		onPanelWidthChange?.(chatWidthRef.current)
	}, [triggerAnimation, triggerInlineAnimation, onPanelWidthChange])

	const openSidebarView = useCallback(
		(viewUrl: string, title: string, icon: string) => {
			sidebar.addTab(viewUrl, title, icon)
			if (!sidebarOpen) {
				if (inline && taskPageRef.current) {
					const available = taskPageRef.current.clientWidth
					const sb = Math.max(Math.round((available * 2) / 3), MIN_SIDEBAR_WIDTH)
					const chat = Math.max(available - sb, MIN_CHAT_WIDTH)
					setChatWidth(chat)
					setSidebarWidth(sb)
				}
				setSidebarOpen(true)
				triggerAnimation()
				triggerInlineAnimation()
				onPanelWidthChange?.(chatWidthRef.current + sidebarWidth)
			}
		},
		[sidebarOpen, sidebarWidth, sidebar, triggerAnimation, triggerInlineAnimation, onPanelWidthChange, inline]
	)

	const generateTaskTitle = useCallback(
		async (text: string): Promise<string> => {
			const titleAgentId = global.agent_uses?.title
			if (!titleAgentId || !window.$app?.openapi) {
				return text.split('\n')[0].slice(0, 60) || 'New Task'
			}

			try {
				const chatClient = new Chat(window.$app.openapi)
				const locale = getLocale() || 'en-us'
				const languageHint = locale.startsWith('zh')
					? 'Please generate the title in Chinese.'
					: 'Please generate the title in English.'

				return await new Promise<string>((resolve) => {
					let title = ''
					const timeout = setTimeout(() => {
						resolve(title || text.split('\n')[0].slice(0, 60) || 'New Task')
					}, 10000)

					chatClient.StreamCompletion(
						{
							assistant_id: titleAgentId,
							messages: [
								{
									role: 'user',
									content: `Generate a short title for this task. ${languageHint}\n\nUser message:\n${text.slice(
										0,
										500
									)}`
								}
							],
							skip: { history: true, trace: true }
						},
						(chunk: any) => {
							if (chunk.type === 'event' && chunk.props?.event === 'message_end') {
								clearTimeout(timeout)
								resolve(
									title.trim().slice(0, 50) ||
										text.split('\n')[0].slice(0, 60) ||
										'New Task'
								)
								return
							}
							if (chunk.type === 'text' && chunk.props?.content) {
								if (chunk.delta) {
									title += chunk.props.content
								} else {
									title = chunk.props.content
								}
							}
						},
						() => {
							clearTimeout(timeout)
							resolve(text.split('\n')[0].slice(0, 60) || 'New Task')
						}
					)
				})
			} catch {
				return text.split('\n')[0].slice(0, 60) || 'New Task'
			}
		},
		[global.agent_uses?.title]
	)

	const handleFirstMessage = useCallback(
		async (text: string, chatId: string) => {
			if (!creatingTaskId) return

			const creatingTask = ctx?.tasks.find((t) => t.id === creatingTaskId)
			const columnId = creatingTask?.column_id || board?.columns[board.columns.length - 1]?.id || ''

			const title = await generateTaskTitle(text)

			const realTask = await services.createTask({
				title,
				description: '',
				column_id: columnId,
				chat_id: chatId,
				assistant_id: global.default_assistant?.assistant_id
			})

			finalizeCreating(creatingTaskId, realTask)
		},
		[
			creatingTaskId,
			ctx?.tasks,
			board,
			finalizeCreating,
			generateTaskTitle,
			global.default_assistant?.assistant_id
		]
	)

	const statusLabel = task ? statusLabels[task.status] || statusLabels.pending : null
	const showContent = !!taskId && !!task
	const showLoading = !!taskId && !task && loadingTask

	const taskSidebarStyle = { width: sidebarOpen ? sidebarWidth : 0 }

	const taskSidebarEl = (
		<div className={clsx(styles.taskSidebar, sidebarOpen && styles.taskSidebarOpen)} style={taskSidebarStyle}>
			<div className={styles.sidebarResize} onMouseDown={handleSidebarResizeStart}>
				<div className={styles.sidebarResizeBar} />
			</div>
			<TaskSidebar
				tabs={sidebar.tabs}
				activeTabId={sidebar.activeTabId}
				activeTabUrl={sidebar.activeTabUrl}
				onTabChange={sidebar.activateTab}
				onTabClose={(tabId: string) => {
					sidebar.removeTab(tabId)
					if (sidebar.tabs.length <= 1) closeSidebar()
				}}
				onCloseOtherTabs={sidebar.closeOtherTabs}
				onCloseAllTabs={() => {
					sidebar.closeAllTabs()
					closeSidebar()
				}}
				onRefresh={() => setRefreshKey((k) => k + 1)}
				onClose={closeSidebar}
			>
				<SidebarContent key={refreshKey} url={sidebar.activeTabUrl} task={task} />
			</TaskSidebar>
		</div>
	)

	const chatAreaStyle = { width: sidebarOpen ? chatWidth : '100%' }

	const content = showContent ? (
		<div ref={taskPageRef} className={styles.taskPage}>
			<div className={styles.chatArea} style={chatAreaStyle}>
				<div className={styles.taskHeader}>
					<span
						className={clsx(styles.statusDot, styles[task.status])}
						title={statusLabel ? (is_cn ? statusLabel.cn : statusLabel.en) : ''}
					/>
					<span className={styles.headerTitle}>{task.title}</span>

					<div className={styles.resourceActions}>
						<Tooltip title={is_cn ? '工作空间' : 'Workspaces'}>
							<span
								className={styles.resourceBtn}
								onClick={() =>
									openSidebarView(
										'$dashboard/workspace/list',
										is_cn ? '工作空间' : 'Workspaces',
										'material-workspaces'
									)
								}
							>
								<Icon name='material-workspaces' size={14} />
							</span>
						</Tooltip>
						{!isCreating && (
							<>
								<Tooltip title={is_cn ? '文件' : 'Files'}>
									<span
										className={styles.resourceBtn}
										onClick={() =>
											openSidebarView(
												`$dashboard/task-files/${taskId}`,
												is_cn ? '文件' : 'Files',
												'material-folder_open'
											)
										}
									>
										<Icon name='material-folder_open' size={14} />
										{task.outputs && task.outputs.length > 0 && (
											<span className={styles.resourceBadge}>
												{task.outputs.length}
											</span>
										)}
									</span>
								</Tooltip>
								<Tooltip title={is_cn ? '服务' : 'Services'}>
									<span
										className={styles.resourceBtn}
										onClick={() =>
											openSidebarView(
												`$dashboard/task-services/${taskId}`,
												is_cn ? '服务' : 'Services',
												'material-dns'
											)
										}
									>
										<Icon name='material-dns' size={14} />
										{task.services && task.services.length > 0 && (
											<span className={styles.resourceDot} />
										)}
									</span>
								</Tooltip>
								<Tooltip title={is_cn ? '活动监视器' : 'Activity Monitor'}>
									<span
										className={styles.resourceBtn}
										onClick={() =>
											openSidebarView(
												`$dashboard/task-activity/${taskId}`,
												is_cn ? '活动' : 'Activity',
												'material-monitor_heart'
											)
										}
									>
										<Icon name='material-monitor_heart' size={14} />
									</span>
								</Tooltip>
								<Tooltip title={is_cn ? '设置' : 'Settings'}>
									<span
										className={styles.resourceBtn}
										onClick={() =>
											openSidebarView(
												`$dashboard/task-settings/${taskId}`,
												is_cn ? '设置' : 'Settings',
												'material-settings'
											)
										}
									>
										<Icon name='material-settings' size={14} />
									</span>
								</Tooltip>
							</>
						)}
					</div>

					<span className={styles.controlBtn} onClick={onClose}>
						<Icon name='material-close' size={16} />
					</span>
				</div>

				<div className={styles.chatContent}>
					{(() => {
						const effectiveChatId = isCreating
							? task.chat_id || `creating-${creatingTaskId}`
							: task.chat_id || taskId!

						return (
							<TaskChat
								key={effectiveChatId}
								chatId={effectiveChatId}
								assistantId={
									isCreating
										? global.default_assistant?.assistant_id || ''
										: task.assistant_id ||
										  global.default_assistant?.assistant_id ||
										  ''
								}
								fallbackAssistantId={global.default_assistant?.assistant_id}
								className={styles.chatbox}
								onFirstUserMessage={isCreating ? handleFirstMessage : undefined}
								initialWorkspace={!isCreating ? task.workspace?.id : undefined}
								onWorkspaceChange={
									!isCreating
										? (id) => services.updateTask(taskId!, { workspace_id: id })
										: undefined
								}
								onAssistantChange={
									!isCreating
										? (id) => services.updateTask(taskId!, { assistant_id: id })
										: undefined
								}
								placeholder={
									<div className={styles.taskEmptyState}>
										<Icon
											name='material-chat_bubble_outline'
											size={32}
											className={styles.emptyIcon}
										/>
										<p>
											{is_cn
												? '发送消息开始任务'
												: 'Send a message to start the task'}
										</p>
									</div>
								}
							/>
						)
					})()}
				</div>
			</div>

			{inline ? taskSidebarEl : sidebarOpen && taskSidebarEl}
		</div>
	) : null

	const loadingEl = showLoading ? (
		<div className={styles.taskLoading}>
			<div className={styles.taskLoadingSkeleton}>
				<div className={styles.taskLoadingBar} style={{ width: '45%' }} />
				<div className={styles.taskLoadingBar} style={{ width: '70%' }} />
				<div className={styles.taskLoadingBar} style={{ width: '55%' }} />
			</div>
		</div>
	) : null

	if (inline) {
		return (
			<div className={clsx(styles.inlinePanel, inlineAnimating && styles.inlineAnimating)}>
				{content || loadingEl}
			</div>
		)
	}

	return (
		<DetailPanel
			open={open}
			width={totalWidth}
			onWidthChange={handlePanelResize}
			isAnimating={isAnimating}
			minWidth={MIN_CHAT_WIDTH}
		>
			{content || loadingEl}
		</DetailPanel>
	)
}

export default window.$app.memo(TaskDetail)
