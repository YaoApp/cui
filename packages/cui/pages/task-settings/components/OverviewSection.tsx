import { useState, useRef } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import Icon from '@/widgets/Icon'
import type { KanbanTask } from '../../kanban/types'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'
import styles from '../index.less'

const STATUS_MAP: Record<string, { cn: string; en: string; icon: string }> = {
	running: { cn: '运行中', en: 'Running', icon: 'material-check_circle' },
	completed: { cn: '已完成', en: 'Completed', icon: 'material-check_circle' },
	failed: { cn: '失败', en: 'Failed', icon: 'material-cancel' },
	pending: { cn: '等待中', en: 'Pending', icon: 'material-cancel' },
	paused: { cn: '已暂停', en: 'Paused', icon: 'material-cancel' },
	cancelled: { cn: '已取消', en: 'Cancelled', icon: 'material-cancel' },
	creating: { cn: '创建中', en: 'Creating', icon: 'material-cancel' },
	waiting: { cn: '等待输入', en: 'Waiting Input', icon: 'material-cancel' }
}

interface Props {
	task: KanbanTask
	taskId: string
	onTaskUpdate: (data: Partial<KanbanTask>) => Promise<void>
}

const OverviewSection = ({ task, taskId, onTaskUpdate }: Props) => {
	const is_cn = getLocale() === 'zh-CN'
	const [editingTags, setEditingTags] = useState(false)
	const [tagInput, setTagInput] = useState('')
	const [localTags, setLocalTags] = useState<string[]>(task.tags || [])
	const tagInputRef = useRef<HTMLInputElement>(null)

	const formatTime = (ts?: number) => {
		if (!ts) return '-'
		return new Date(ts).toLocaleString(is_cn ? 'zh-CN' : 'en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const status = STATUS_MAP[task.status] || STATUS_MAP.pending

	const handleTagsEdit = () => {
		setEditingTags(true)
		setTagInput('')
		setTimeout(() => tagInputRef.current?.focus(), 0)
	}

	const handleTagAdd = () => {
		const val = tagInput.trim()
		if (val && !localTags.includes(val)) {
			setLocalTags([...localTags, val])
		}
		setTagInput('')
	}

	const handleTagRemove = (tag: string) => {
		setLocalTags(localTags.filter((t) => t !== tag))
	}

	const handleTagsDone = async () => {
		setEditingTags(false)
		if (JSON.stringify(localTags) !== JSON.stringify(task.tags || [])) {
			try {
				await onTaskUpdate({ tags: localTags })
			} catch {
				message.error(is_cn ? '标签更新失败' : 'Failed to update tags')
			}
		}
	}

	return (
		<div className={viewStyles.sectionContent}>
			<div className={viewStyles.card}>
				<div className={viewStyles.sectionTitle}>
					{is_cn ? '基本信息' : 'General'}
				</div>
				<div className={viewStyles.kvTable}>
					<div className={viewStyles.kvRow}>
						<div className={viewStyles.kvLabel}>
							{is_cn ? '当前专家' : 'Current Expert'}
						</div>
						<div className={viewStyles.kvValue}>
							{task.assistant_name || task.assistant_id || '-'}
						</div>
					</div>

					<div className={viewStyles.kvRow}>
						<div className={viewStyles.kvLabel}>
							{is_cn ? '当前模型' : 'Current Model'}
						</div>
						<div className={viewStyles.kvValue}>
							{task.connector_name || '-'}
						</div>
					</div>

					<div className={viewStyles.kvRow}>
						<div className={viewStyles.kvLabel}>
							{is_cn ? '标签' : 'Tags'}
						</div>
						<div className={viewStyles.kvValue}>
							{editingTags ? (
								<div className={styles.tagsEditor}>
									<div className={styles.tagsList}>
										{localTags.map((tag) => (
											<span key={tag} className={styles.tagItem}>
												{tag}
												<Icon
													name='material-close'
													size={12}
													className={styles.tagRemove}
													onClick={() => handleTagRemove(tag)}
												/>
											</span>
										))}
									</div>
									<div className={styles.tagInputRow}>
										<input
											ref={tagInputRef}
											className={styles.tagInput}
											value={tagInput}
											onChange={(e) => setTagInput(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') handleTagAdd()
												if (e.key === 'Escape') handleTagsDone()
											}}
											placeholder={is_cn ? '输入标签，回车添加' : 'Type tag, Enter to add'}
										/>
										<span className={styles.tagDone} onClick={handleTagsDone}>
											{is_cn ? '完成' : 'Done'}
										</span>
									</div>
								</div>
							) : (
								<span className={styles.clickableValue} onClick={handleTagsEdit}>
									{localTags.length > 0 ? (
										localTags.map((tag) => (
											<span key={tag} className={styles.tagDisplay}>{tag}</span>
										))
									) : (
										<span style={{ opacity: 0.5 }}>{is_cn ? '点击添加' : 'Click to add'}</span>
									)}
									<Icon name='material-edit' size={13} style={{ opacity: 0.4, marginLeft: 4 }} />
								</span>
							)}
						</div>
					</div>

					<div className={viewStyles.kvRow}>
						<div className={viewStyles.kvLabel}>
							{is_cn ? '工作区' : 'Workspace'}
						</div>
						<div className={viewStyles.kvValue}>
							{task.workspace?.name || (is_cn ? '未绑定' : 'Unbound')}
						</div>
					</div>

					<div className={viewStyles.kvRow}>
						<div className={viewStyles.kvLabel}>
							{is_cn ? '状态' : 'Status'}
						</div>
						<div className={viewStyles.kvValue}>
							<span className={viewStyles.statusBadge}>
								<Icon name={status.icon} size={14} />
								{is_cn ? status.cn : status.en}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div className={viewStyles.card}>
				<div className={viewStyles.sectionTitle}>
					{is_cn ? '时间' : 'Timeline'}
				</div>
				<div className={viewStyles.kvTable}>
					<div className={viewStyles.kvRow}>
						<div className={viewStyles.kvLabel}>
							{is_cn ? '创建时间' : 'Created'}
						</div>
						<div className={viewStyles.kvValue}>
							{formatTime(task.created_at)}
						</div>
					</div>

					<div className={viewStyles.kvRow}>
						<div className={viewStyles.kvLabel}>
							{is_cn ? '最近更新' : 'Updated'}
						</div>
						<div className={viewStyles.kvValue}>
							{formatTime(task.updated_at)}
						</div>
					</div>

					{task.started_at && (
						<div className={viewStyles.kvRow}>
							<div className={viewStyles.kvLabel}>
								{is_cn ? '开始时间' : 'Started'}
							</div>
							<div className={viewStyles.kvValue}>
								{formatTime(task.started_at)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default OverviewSection
