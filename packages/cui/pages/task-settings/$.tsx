import { useState, useEffect, useRef, useCallback } from 'react'
import { getLocale } from '@umijs/max'
import { Spin, message } from 'antd'
import Icon from '@/widgets/Icon'
import DetailMenu from './components/DetailMenu'
import OverviewSection from './components/OverviewSection'
import SandboxSection from './components/SandboxSection'
import SecretsSection from './components/SecretsSection'
import ComputerSection from './components/ComputerSection'
import SkillsSection from './components/SkillsSection'
import ScheduleSection from './components/ScheduleSection'
import { useAppRoute, type AppRouteProps } from '@/hooks/useAppRoute'
import { getTaskDetail, getTaskConfig, setTaskConfig, updateTask } from '../kanban/services/api'
import type { TaskConfig, SetConfigRequest } from '@/openapi/agent/tasks'
import type { KanbanTask } from '../kanban/types'
import styles from './index.less'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'

const STATUS_COLORS: Record<string, string> = {
	running: '#52c41a',
	completed: '#52c41a',
	pending: '#faad14',
	creating: '#faad14',
	waiting: '#1890ff',
	failed: '#ff4d4f',
	paused: '#d9d9d9',
	cancelled: '#d9d9d9'
}

const TaskSettings = (props: AppRouteProps) => {
	const { params } = useAppRoute(props)
	const taskId = params['*'] || ''
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [task, setTask] = useState<KanbanTask | null>(null)
	const [config, setConfig] = useState<TaskConfig | null>(null)
	const [activeSection, setActiveSection] = useState('overview')
	const [editingTitle, setEditingTitle] = useState(false)
	const [titleValue, setTitleValue] = useState('')
	const containerRef = useRef<HTMLDivElement>(null)
	const titleInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (!taskId) return
		setLoading(true)
		Promise.all([
			getTaskDetail(taskId),
			getTaskConfig(taskId).catch(() => null)
		]).then(([t, c]) => {
			setTask(t)
			setConfig(c)
			setLoading(false)
		}).catch(() => {
			setLoading(false)
		})
	}, [taskId])

	const handleConfigSave = useCallback(async (req: SetConfigRequest) => {
		const updated = await setTaskConfig(taskId, req)
		setConfig(updated)
	}, [taskId])

	const handleTaskUpdate = useCallback(async (data: Partial<KanbanTask>) => {
		const updated = await updateTask(taskId, data)
		setTask(updated)
	}, [taskId])

	const handleSectionChange = (section: string) => {
		setActiveSection(section)
		containerRef.current?.scrollTo({ top: 0 })
	}

	const handleTitleEdit = () => {
		setTitleValue(task?.title || '')
		setEditingTitle(true)
		setTimeout(() => titleInputRef.current?.focus(), 0)
	}

	const handleTitleSave = async () => {
		setEditingTitle(false)
		if (titleValue.trim() && titleValue !== task?.title) {
			try {
				await handleTaskUpdate({ title: titleValue.trim() })
			} catch {
				message.error(is_cn ? '标题更新失败' : 'Failed to update title')
			}
		}
	}

	if (loading || !task) {
		return (
			<div className={styles.scrollWrap}>
				<div className={styles.loading}>
					<Spin />
				</div>
			</div>
		)
	}

	return (
		<div className={styles.scrollWrap} ref={containerRef}>
			<div className={styles.container}>
				<div className={viewStyles.profileHeader}>
					<div className={viewStyles.profileInfo}>
						{editingTitle ? (
							<input
								ref={titleInputRef}
								className={styles.titleInput}
								value={titleValue}
								onChange={(e) => setTitleValue(e.target.value)}
								onBlur={handleTitleSave}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleTitleSave()
									if (e.key === 'Escape') setEditingTitle(false)
								}}
							/>
						) : (
							<h1 className={viewStyles.profileName} onClick={handleTitleEdit} style={{ cursor: 'text' }}>
								<span
									className={styles.statusDot}
									style={{ background: STATUS_COLORS[task.status] || '#d9d9d9' }}
								/>
								{task.title}
								<Icon name='material-edit' size={14} className={styles.editIcon} />
							</h1>
						)}
						{task.description && (
							<div className={viewStyles.profileDesc}>{task.description}</div>
						)}
					</div>
				</div>

				<div className={styles.content}>
					<DetailMenu active={activeSection} onChange={handleSectionChange} />
					<div className={styles.main}>
						{activeSection === 'overview' && (
							<OverviewSection
								task={task}
								taskId={taskId}
								config={config}
								onConfigSave={handleConfigSave}
								onTaskUpdate={handleTaskUpdate}
								onNavigate={handleSectionChange}
							/>
						)}
						{activeSection === 'sandbox' && (
							<SandboxSection
								task={task}
								taskId={taskId}
								config={config}
								onConfigSave={handleConfigSave}
							/>
						)}
						{activeSection === 'secrets' && (
							<SecretsSection
								task={task}
								taskId={taskId}
								config={config}
								onConfigSave={handleConfigSave}
							/>
						)}
						{activeSection === 'computer' && <ComputerSection task={task} />}
						{activeSection === 'skills' && (
							<SkillsSection
								task={task}
								taskId={taskId}
								config={config}
								onConfigSave={handleConfigSave}
							/>
						)}
						{activeSection === 'schedule' && (
							<ScheduleSection
								task={task}
								taskId={taskId}
								config={config}
								onConfigSave={handleConfigSave}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default TaskSettings
