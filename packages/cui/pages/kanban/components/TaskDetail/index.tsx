import { useState, useEffect, useCallback, useRef } from 'react'
import { getLocale } from '@umijs/max'
import clsx from 'clsx'
import Icon from '@/widgets/Icon'
import { ChatProvider, Chatbox, InputArea } from '@/chatbox'
import type { SendMessageRequest } from '@/chatbox/types'
import { useGlobal } from '@/context/app'
import { useKanbanContext } from '../../context'
import * as services from '../../services'
import DetailPanel from '../DetailPanel'
import TaskSidebar from '../TaskSidebar'
import SidebarContent from '../SidebarContent'
import { useSidebarTabs } from '../../hooks/useSidebarTabs'
import styles from './index.less'

interface TaskDetailProps {
	taskId: string | null
	open: boolean
	onClose: () => void
	onPanelWidthChange: (width: number) => void
	isAnimating?: boolean
}

const DEFAULT_CHAT_WIDTH = 480
const DEFAULT_SIDEBAR_WIDTH = 400
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

const TaskDetail = ({ taskId, open, onClose, onPanelWidthChange, isAnimating }: TaskDetailProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()
	const { tasks, creatingTaskId, finalizeCreating, board, triggerAnimation } = useKanbanContext()

	const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH)
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
	const [creatingSending, setCreatingSending] = useState(false)
	const [refreshKey, setRefreshKey] = useState(0)

	const chatWidthRef = useRef(chatWidth)
	chatWidthRef.current = chatWidth

	const task = tasks.find((t) => t.id === taskId) || null
	const isCreating = task?.status === 'creating'

	const totalWidth = chatWidth + (sidebarOpen ? sidebarWidth : 0)

	// Sidebar tabs management
	const sidebar = useSidebarTabs()

	// Notify parent of width changes
	useEffect(() => {
		if (open) onPanelWidthChange(totalWidth)
	}, [totalWidth, open, onPanelWidthChange])

	// Reset sidebar when task changes
	useEffect(() => {
		setSidebarOpen(false)
		sidebar.closeAllTabs()
	}, [taskId])

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
			onPanelWidthChange(newTotal)
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

	const closeSidebar = useCallback(() => {
		setSidebarOpen(false)
		triggerAnimation()
		onPanelWidthChange(chatWidthRef.current)
	}, [triggerAnimation, onPanelWidthChange])

	const openSidebarView = useCallback(
		(viewUrl: string, title: string, icon: string) => {
			sidebar.addTab(viewUrl, title, icon)
			if (!sidebarOpen) {
				setSidebarOpen(true)
				triggerAnimation()
				onPanelWidthChange(chatWidthRef.current + sidebarWidth)
			}
		},
		[sidebarOpen, sidebarWidth, sidebar, triggerAnimation, onPanelWidthChange]
	)

	// Creating mode: intercept first message to create task
	const handleCreateSend = useCallback(
		async (request: SendMessageRequest) => {
			const message = request.messages[0]
			if (!message || !creatingTaskId) return

			const text =
				typeof message.content === 'string'
					? message.content
					: message.content.map((c) => (c.type === 'text' ? c.text || '' : '')).join('')

			if (!text.trim()) return

			setCreatingSending(true)
			try {
				const title = text.split('\n')[0].slice(0, 60)
				const creatingTask = tasks.find((t) => t.id === creatingTaskId)
				const columnId = creatingTask?.column_id || board?.columns[board.columns.length - 1]?.id || ''

				const realTask = await services.createTask({
					title,
					description: text.trim(),
					column_id: columnId
				})

				finalizeCreating(creatingTaskId, realTask)
			} finally {
				setCreatingSending(false)
			}
		},
		[creatingTaskId, tasks, board, finalizeCreating]
	)

	const statusLabel = task ? statusLabels[task.status] || statusLabels.pending : null
	const showContent = !!taskId && !!task

	return (
		<DetailPanel
			open={open}
			width={totalWidth}
			onWidthChange={handlePanelResize}
			isAnimating={isAnimating}
			minWidth={MIN_CHAT_WIDTH}
		>
			{showContent && (
				<div className={styles.taskPage}>
					<div className={styles.chatArea} style={{ width: sidebarOpen ? chatWidth : '100%' }}>
						<div className={styles.taskHeader}>
							<span className={clsx(styles.statusDot, styles[task.status])} title={statusLabel ? (is_cn ? statusLabel.cn : statusLabel.en) : ''} />
							<span className={styles.headerTitle}>{task.title}</span>

							<div className={styles.resourceActions}>
								<span
									className={styles.resourceBtn}
									onClick={() => openSidebarView('$dashboard/assistants', is_cn ? 'AI 专家' : 'AI Experts', 'material-assistant')}
									title={is_cn ? 'AI 专家' : 'AI Experts'}
								>
									<Icon name='material-assistant' size={14} />
								</span>
								<span
									className={styles.resourceBtn}
									onClick={() => openSidebarView('$dashboard/workspace/list', is_cn ? '工作空间' : 'Workspaces', 'material-workspaces')}
									title={is_cn ? '工作空间' : 'Workspaces'}
								>
									<Icon name='material-workspaces' size={14} />
								</span>
								{!isCreating && (
									<>
										<span
											className={styles.resourceBtn}
											onClick={() => openSidebarView('__task/outputs', is_cn ? '产出' : 'Outputs', 'material-attach_file')}
											title={is_cn ? '产出' : 'Outputs'}
										>
											<Icon name='material-attach_file' size={14} />
											{task.outputs && task.outputs.length > 0 && (
												<span className={styles.resourceBadge}>{task.outputs.length}</span>
											)}
										</span>
										<span
											className={styles.resourceBtn}
											onClick={() => openSidebarView('__task/settings', is_cn ? '设置' : 'Settings', 'material-settings')}
											title={is_cn ? '设置' : 'Settings'}
										>
											<Icon name='material-settings' size={14} />
										</span>
									</>
								)}
							</div>

							<span className={styles.controlBtn} onClick={onClose}>
								<Icon name='material-close' size={16} />
							</span>
						</div>

						<div className={styles.chatContent}>
							{isCreating ? (
								<div className={styles.creatingView}>
									<div className={styles.creatingHint}>
										<Icon name='material-chat_bubble_outline' size={32} className={styles.creatingHintIcon} />
										<p>{is_cn ? '输入任务描述，开始执行' : 'Describe your task to get started'}</p>
									</div>
									<InputArea
										mode='normal'
										onSend={handleCreateSend}
										loading={creatingSending}
										disabled={creatingSending}
									/>
								</div>
							) : (
								<ChatProvider
									key={taskId}
									chatId={task.chat_id || taskId}
									assistantId={task.assistant_id}
									singleSession
								>
									<Chatbox className={styles.chatbox} />
								</ChatProvider>
							)}
						</div>
					</div>

					{sidebarOpen && (
						<div className={styles.taskSidebar} style={{ width: sidebarWidth }}>
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
								onCloseAllTabs={() => { sidebar.closeAllTabs(); closeSidebar() }}
								onRefresh={() => setRefreshKey((k) => k + 1)}
								onClose={closeSidebar}
							>
								<SidebarContent key={refreshKey} url={sidebar.activeTabUrl} task={task} />
							</TaskSidebar>
						</div>
					)}
				</div>
			)}
		</DetailPanel>
	)
}

export default window.$app.memo(TaskDetail)
