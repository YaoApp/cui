import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { getLocale } from '@umijs/max'
import { Tooltip } from 'antd'
import clsx from 'clsx'
import Icon from '@/widgets/Icon'
import { TaskChat } from '@/chatbox'
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
	queued: { cn: '排队中', en: 'Queued' },
	running: { cn: '运行中', en: 'Running' },
	waiting: { cn: '等待输入', en: 'Waiting for Input' },
	completed: { cn: '已完成', en: 'Completed' },
	failed: { cn: '失败', en: 'Failed' },
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
	const [editingTitle, setEditingTitle] = useState(false)
	const [titleValue, setTitleValue] = useState('')
	const titleInputRef = useRef<HTMLInputElement>(null)

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

	const wasCreatingRef = useRef(false)
	const tempTitleSetRef = useRef(false)

	useEffect(() => {
		wasCreatingRef.current = false
		tempTitleSetRef.current = false
	}, [taskId])

	useEffect(() => {
		if (isCreating) wasCreatingRef.current = true
	}, [isCreating])

	const handleTitleClick = useCallback(() => {
		if (!task) return
		setTitleValue(task.title || '')
		setEditingTitle(true)
		setTimeout(() => titleInputRef.current?.focus(), 0)
	}, [task])

	const handleTitleSave = useCallback(() => {
		setEditingTitle(false)
		const trimmed = titleValue.trim()
		if (!trimmed || !taskId || trimmed === task?.title) return
		ctx?.updateLocalTitle?.(taskId, trimmed)
		services.updateTask(taskId, { title: trimmed } as any).catch(() => {})
	}, [titleValue, taskId, task, ctx])

	const handleMessagesChange = useCallback((msgs: any[]) => {
		if (!taskId || tempTitleSetRef.current || !wasCreatingRef.current) return
		const firstUserMsg = msgs.find((m: any) => m.type === 'user_input')
		if (!firstUserMsg) return
		const rawContent = firstUserMsg.props?.content
		if (!rawContent) return
		const text = typeof rawContent === 'string'
			? rawContent
			: (Array.isArray(rawContent) ? (rawContent.find((p: any) => p.type === 'text')?.text || '') : '')
		if (!text) return
		tempTitleSetRef.current = true
		const title = text.length > 50 ? text.slice(0, 50) + '…' : text
		ctx?.updateLocalTitle?.(taskId, title)
	}, [taskId, ctx])

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

	// Task creation is now handled atomically by WS handler (handleRunCmd → CreateFromWS)
	// Title generation is handled by backend enrichTaskResult after daemon exits

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
					{editingTitle ? (
						<input
							ref={titleInputRef}
							className={styles.headerTitleInput}
							value={titleValue}
							onChange={(e) => setTitleValue(e.target.value)}
							onBlur={handleTitleSave}
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleTitleSave()
								if (e.key === 'Escape') setEditingTitle(false)
							}}
						/>
					) : (
						<span className={styles.headerTitle} onClick={handleTitleClick}>
							{task.title}
						</span>
					)}

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
							<Tooltip title={is_cn ? '消息往来' : 'Mail History'}>
								<span
									className={styles.resourceBtn}
									onClick={() =>
										openSidebarView(
											`$dashboard/task-mails/${taskId}`,
											is_cn ? '消息往来' : 'Mail History',
											'material-mail_outline'
										)
									}
								>
									<Icon name='material-mail_outline' size={14} />
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
					console.log(`[TaskDetail] taskId=${taskId} found=${!!task} effectiveChatId=${effectiveChatId}`)

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
								columnId={isCreating ? (task.column_id || board?.columns[board.columns.length - 1]?.id) : undefined}
								className={styles.chatbox}
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
							onMessagesChange={handleMessagesChange}
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
