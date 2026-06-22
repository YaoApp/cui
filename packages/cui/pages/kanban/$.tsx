import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from '@umijs/max'
import clsx from 'clsx'
import Icon from '@/widgets/Icon'
import { KanbanProvider, useKanbanContext } from './context'
import { getEventStream } from '@/openapi/events'
import HeaderBar from './components/HeaderBar'
import Board from './components/Board'
import TaskDetail from './components/TaskDetail'
import Welcome from './components/Welcome'
import styles from './index.less'

const DEFAULT_PANEL_WIDTH = 560

const KanbanContent = () => {
	const {
		loading,
		boards,
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
	const scrollRafRef = useRef<number>(0)

	const scrollToActiveCard = useCallback(() => {
		if (!selectedTaskId || !boardAreaRef.current) return
		const BREATHING = 40
		const card = boardAreaRef.current.querySelector(`[data-task-id="${selectedTaskId}"]`)
		if (!card) return
		const area = boardAreaRef.current
		const areaRect = area.getBoundingClientRect()
		const cardRect = card.getBoundingClientRect()
		if (cardRect.right > areaRect.right - BREATHING) {
			area.scrollTo({ left: area.scrollLeft + (cardRect.right - areaRect.right) + BREATHING, behavior: 'smooth' })
		} else if (cardRect.left < areaRect.left + BREATHING) {
			area.scrollTo({ left: area.scrollLeft - (areaRect.left - cardRect.left) - BREATHING, behavior: 'smooth' })
		}
	}, [selectedTaskId])

	// Scroll to active card when task selection or detail panel open/close changes
	useEffect(() => {
		if (!selectedTaskId) return
		const delay = detailOpen ? 300 : 50
		const timer = setTimeout(scrollToActiveCard, delay)
		return () => clearTimeout(timer)
	}, [selectedTaskId, detailOpen, scrollToActiveCard])

	// Observe board area size changes to keep active card visible
	// Handles: sidebar open/close, panel resize, window resize, CSS transitions
	useEffect(() => {
		const area = boardAreaRef.current
		if (!area || !selectedTaskId) return

		const observer = new ResizeObserver(() => {
			cancelAnimationFrame(scrollRafRef.current)
			scrollRafRef.current = requestAnimationFrame(scrollToActiveCard)
		})
		observer.observe(area)
		return () => {
			observer.disconnect()
			cancelAnimationFrame(scrollRafRef.current)
		}
	}, [selectedTaskId, scrollToActiveCard])

	// Subscribe to real-time task events via EventBus (replaces polling)
	useEffect(() => {
		const stream = getEventStream()
		const unsub = stream.subscribe('task.*', () => {
			refreshTasks()
		})
		return unsub
	}, [refreshTasks])

	const handleDetailClose = useCallback(() => {
		if (selectedTaskId?.startsWith('temp_')) {
			cancelCreating()
		} else {
			closeDetail()
		}
	}, [selectedTaskId, cancelCreating, closeDetail])

	const containerClass = clsx(styles.container, isAnimating && styles.animating)
	const maxPanelWidth = typeof window !== 'undefined' ? window.innerWidth - 64 : 1200
	const containerStyle = detailOpen ? { paddingRight: Math.min(panelWidth, maxPanelWidth) } : undefined

	if (loading) {
		return (
			<div className={containerClass}>
				<div className={styles.loading}>
					<div className={styles.skeleton}>
						<div className={styles.skeletonBar} style={{ width: '40%' }} />
						<div className={styles.skeletonBar} style={{ width: '65%' }} />
						<div className={styles.skeletonBar} style={{ width: '50%' }} />
					</div>
				</div>
			</div>
		)
	}

	if (boards.length === 0) {
		return (
			<div className={containerClass}>
				<Welcome />
			</div>
		)
	}

	return (
		<div className={containerClass} style={containerStyle}>
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
				onPanelWidthChange={setPanelWidth}
				isAnimating={isAnimating}
			/>
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
