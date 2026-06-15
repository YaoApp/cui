import { useMemo } from 'react'
import clsx from 'clsx'
import Icon from '@/widgets/Icon'
import type { KanbanTask } from '../../types'
import styles from './index.less'

interface TaskCardProps {
	task: KanbanTask
	is_cn: boolean
	isDragging?: boolean
	isSelected?: boolean
	onClick?: () => void
	onMenuClick?: (e: React.MouseEvent) => void
	onTogglePin?: (taskId: string, pinned: boolean) => void
	onContextMenu?: (task: KanbanTask, e: React.MouseEvent) => void
}

const STATUS_CONFIG: Record<string, { icon: string; color: string; label_cn: string; label_en: string }> = {
	creating: { icon: 'material-add_circle', color: 'var(--color_info)', label_cn: '创建中', label_en: 'Creating' },
	pending: { icon: 'material-schedule', color: 'var(--color_info)', label_cn: '待开始', label_en: 'Pending' },
	running: { icon: 'material-play_circle', color: 'var(--color_success)', label_cn: '进行中', label_en: 'Running' },
	waiting_input: { icon: 'material-chat_bubble', color: 'var(--color_warning)', label_cn: '等待回复', label_en: 'Awaiting' },
	completed: { icon: 'material-check_circle', color: 'var(--color_success)', label_cn: '已完成', label_en: 'Done' },
	failed: { icon: 'material-error', color: 'var(--color_danger)', label_cn: '失败', label_en: 'Failed' },
	paused: { icon: 'material-pause_circle', color: 'var(--color_text_grey)', label_cn: '已暂停', label_en: 'Paused' },
	cancelled: { icon: 'material-cancel', color: 'var(--color_text_grey)', label_cn: '已取消', label_en: 'Cancelled' }
}

function formatDuration(seconds: number): string {
	if (seconds < 60) return `${seconds}s`
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const TaskCard = ({ task, is_cn, isDragging, isSelected, onClick, onMenuClick, onTogglePin, onContextMenu }: TaskCardProps) => {
	const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending

	const activity = useMemo(() => {
		if (task.status === 'running' && task.current_step) return task.current_step
		if (task.status === 'waiting_input' && task.last_message) return task.last_message
		if (task.status === 'failed' && task.error_message) return task.error_message
		return null
	}, [task.status, task.current_step, task.last_message, task.error_message])

	const elapsed = useMemo(() => {
		if (task.duration) return formatDuration(task.duration)
		if (task.started_at && (task.status === 'running' || task.status === 'waiting_input')) {
			return formatDuration(Math.floor((Date.now() - task.started_at) / 1000))
		}
		return null
	}, [task.duration, task.started_at, task.status])

	const handlePinClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		onTogglePin?.(task.id, !task.pinned)
	}

	return (
		<div
			className={clsx(styles.card, styles[task.status], isDragging && styles.dragging, isSelected && styles.selected)}
			onClick={onClick}
			onContextMenu={(e) => {
				e.preventDefault()
				onContextMenu?.(task, e)
			}}
		>
			{/* ── Title row: dot + title + pin (top-right) ── */}
			<div className={styles.titleRow}>
				<span className={styles.statusDot} style={{ background: status.color }} />
				<span className={styles.title}>{task.title}</span>
				<span
					className={clsx(styles.pinBtn, task.pinned && styles.pinned)}
					title={task.pinned ? (is_cn ? '取消置顶' : 'Unpin') : (is_cn ? '置顶' : 'Pin')}
					onClick={handlePinClick}
				>
					<Icon name='material-push_pin' size={12} />
				</span>
			</div>

			{/* ── Activity text ── */}
			{activity && (
				<div className={clsx(styles.activity, task.status === 'failed' && styles.activityError)}>
					{activity}
				</div>
			)}

			{/* ── Progress bar ── */}
			{task.status === 'running' && task.progress != null && task.progress > 0 && (
				<div className={styles.progress}>
					<div className={styles.progressFill} style={{ width: `${task.progress}%` }} />
				</div>
			)}

			{/* ── Footer (fixed layout) ── */}
			<div className={styles.footer}>
				<div className={styles.footerLine}>
					<span className={styles.statusLabel} style={{ color: status.color }}>
						<Icon name={status.icon} size={12} />
						{is_cn ? status.label_cn : status.label_en}
					</span>
					{task.recurring?.enabled && (
						<span className={styles.badge}>
							<Icon name='material-event_repeat' size={11} />
							{is_cn ? '定时' : 'Sched'}
						</span>
					)}
					<span className={styles.footerSpacer} />
					{elapsed && (
						<span className={styles.elapsed}>
							<Icon name='material-schedule' size={11} />
							{elapsed}
						</span>
					)}
				</div>

				<div className={styles.footerLine}>
					<span className={styles.footerSlot}>
						<Icon name='material-folder' size={12} />
						{task.workspace?.name || '—'}
					</span>
					<span className={styles.footerSpacer} />
					<span className={styles.footerSlot}>
						<Icon name='material-assistant' size={12} />
						{task.assistant_name || '—'}
					</span>
				</div>
			</div>

			{/* ── Settings button (absolute bottom-right) ── */}
			<span
				className={styles.settingsBtn}
				onClick={(e) => {
					e.stopPropagation()
					onMenuClick?.(e)
				}}
			>
				<Icon name='material-settings' size={13} />
			</span>
		</div>
	)
}

export default window.$app.memo(TaskCard)
