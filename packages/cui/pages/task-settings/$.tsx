import { useState, useEffect, useRef } from 'react'
import { getLocale } from '@umijs/max'
import { Spin } from 'antd'
import Icon from '@/widgets/Icon'
import DetailMenu from './components/DetailMenu'
import OverviewSection from './components/OverviewSection'
import SandboxSection from './components/SandboxSection'
import SecretsSection from './components/SecretsSection'
import ComputerSection from './components/ComputerSection'
import SkillsSection from './components/SkillsSection'
import ScheduleSection from './components/ScheduleSection'
import { useAppRoute, type AppRouteProps } from '@/hooks/useAppRoute'
import { getTaskDetail } from '../kanban/services/mock'
import type { KanbanTask } from '../kanban/types'
import styles from './index.less'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'

const SECTION_META: Record<string, { icon: string; label: Record<string, string> }> = {
	overview: { icon: 'material-tune', label: { 'zh-CN': '通用', 'en-US': 'General' } },
	sandbox: { icon: 'material-dns', label: { 'zh-CN': '沙箱', 'en-US': 'Sandbox' } },
	secrets: { icon: 'material-vpn_key', label: { 'zh-CN': '密钥', 'en-US': 'Secrets' } },
	computer: { icon: 'material-computer', label: { 'zh-CN': '电脑', 'en-US': 'Computer' } },
	skills: { icon: 'material-extension', label: { 'zh-CN': '技能', 'en-US': 'Skills' } },
	schedule: { icon: 'material-schedule', label: { 'zh-CN': '定时', 'en-US': 'Schedule' } }
}

const STATUS_COLORS: Record<string, string> = {
	running: '#52c41a',
	completed: '#52c41a',
	pending: '#faad14',
	creating: '#faad14',
	waiting_input: '#1890ff',
	failed: '#ff4d4f',
	paused: '#d9d9d9',
	cancelled: '#d9d9d9'
}

const TaskSettings = (props: AppRouteProps) => {
	const { params } = useAppRoute(props)
	const taskId = params['*'] || ''
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const lang = is_cn ? 'zh-CN' : 'en-US'

	const [loading, setLoading] = useState(true)
	const [task, setTask] = useState<KanbanTask | null>(null)
	const [activeSection, setActiveSection] = useState('overview')
	const [editingTitle, setEditingTitle] = useState(false)
	const [titleValue, setTitleValue] = useState('')
	const containerRef = useRef<HTMLDivElement>(null)
	const titleInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (!taskId) return
		setLoading(true)
		getTaskDetail(taskId).then((data) => {
			setTask(data)
			setLoading(false)
		})
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

	const handleTitleSave = () => {
		setEditingTitle(false)
		if (titleValue.trim() && titleValue !== task?.title) {
			setTask((prev) => prev ? { ...prev, title: titleValue.trim() } : prev)
			window.$app?.Event?.emit('app/toast', {
				type: 'info',
				message: is_cn ? '标题已更新（mock）' : 'Title updated (mock)'
			})
		}
	}

	const meta = SECTION_META[activeSection]
	const currentSectionIcon = meta?.icon || 'material-info'
	const currentSectionLabel = meta?.label[lang] || ''

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
						{activeSection === 'overview' && <OverviewSection task={task} onNavigate={handleSectionChange} />}
						{activeSection === 'sandbox' && <SandboxSection task={task} />}
						{activeSection === 'secrets' && <SecretsSection task={task} />}
						{activeSection === 'computer' && <ComputerSection task={task} />}
						{activeSection === 'skills' && <SkillsSection task={task} />}
						{activeSection === 'schedule' && <ScheduleSection task={task} />}
					</div>
				</div>
			</div>
		</div>
	)
}

export default TaskSettings
