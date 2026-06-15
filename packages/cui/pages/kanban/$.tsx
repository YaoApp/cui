import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams } from '@umijs/max'
import clsx from 'clsx'
import Icon from '@/widgets/Icon'
import { KanbanProvider, useKanbanContext } from './context'
import { useTaskPolling } from './hooks/useTaskPolling'
import HeaderBar from './components/HeaderBar'
import Board from './components/Board'
import TaskDetail from './components/TaskDetail'
import styles from './index.less'

const DEFAULT_PANEL_WIDTH = 480

const KanbanContent = () => {
	const {
		loading,
		is_cn,
		tasks,
		selectedTaskId,
		detailOpen,
		isAnimating,
		closeDetail,
		refreshTasks,
		startCreating,
		cancelCreating
	} = useKanbanContext()

	const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH)
	const boardAreaRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!selectedTaskId) return
		const BREATHING = 40
		const delay = detailOpen ? 300 : 50
		const timer = setTimeout(() => {
			const card = boardAreaRef.current?.querySelector(`[data-task-id="${selectedTaskId}"]`)
			if (!card || !boardAreaRef.current) return
			const area = boardAreaRef.current
			const areaRect = area.getBoundingClientRect()
			const cardRect = card.getBoundingClientRect()
			if (cardRect.right > areaRect.right - BREATHING) {
				area.scrollTo({ left: area.scrollLeft + (cardRect.right - areaRect.right) + BREATHING, behavior: 'smooth' })
			} else if (cardRect.left < areaRect.left + BREATHING) {
				area.scrollTo({ left: area.scrollLeft - (areaRect.left - cardRect.left) - BREATHING, behavior: 'smooth' })
			}
		}, delay)
		return () => clearTimeout(timer)
	}, [selectedTaskId, detailOpen])

	const hasRunningTasks = useMemo(
		() => tasks.some((t) => t.status === 'running' || t.status === 'waiting_input'),
		[tasks]
	)

	const handlePoll = useCallback(async () => {
		await refreshTasks()
	}, [refreshTasks])

	useTaskPolling({ hasRunningTasks, onPoll: handlePoll })

	const handleDetailClose = useCallback(() => {
		if (selectedTaskId?.startsWith('temp_')) {
			cancelCreating()
		} else {
			closeDetail()
		}
	}, [selectedTaskId, cancelCreating, closeDetail])

	const containerClass = clsx(styles.container, isAnimating && styles.animating)
	const containerStyle = detailOpen ? { paddingRight: panelWidth } : undefined

	return (
		<div className={containerClass} style={containerStyle}>
			{loading ? (
				<div className={styles.loading}>
					<Icon name='material-refresh' size={18} className={styles.loadingIcon} />
					{is_cn ? '加载中...' : 'Loading...'}
				</div>
			) : (
				<>
					<HeaderBar onCreateTask={() => startCreating()} />
					<div className={styles.body}>
						<div ref={boardAreaRef} className={styles.boardArea}>
							<Board onCreateTaskInColumn={(colId) => startCreating(colId)} />
						</div>
					</div>
					<TaskDetail
						taskId={selectedTaskId}
						open={detailOpen}
						onClose={handleDetailClose}
						panelWidth={panelWidth}
						onWidthChange={setPanelWidth}
						isAnimating={isAnimating}
					/>
				</>
			)}
		</div>
	)
}

const KanbanPage = () => {
	const params = useParams()
	const boardId = params['*'] || undefined

	return (
		<KanbanProvider boardId={boardId}>
			<KanbanContent />
		</KanbanProvider>
	)
}

export default KanbanPage
