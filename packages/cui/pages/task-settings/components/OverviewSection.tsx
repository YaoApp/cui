import { useState, useRef, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Selector from '@/chatbox/components/InputArea/Selector'
import { useLLMProviders } from '@/hooks/useLLMProviders'
import { Agent } from '@/openapi/agent'
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
	waiting_input: { cn: '等待输入', en: 'Waiting Input', icon: 'material-cancel' }
}

const OverviewSection = ({ task, onNavigate }: { task: KanbanTask; onNavigate?: (section: string) => void }) => {
	const is_cn = getLocale() === 'zh-CN'
	const { providers: llmProviders } = useLLMProviders()
	const [assistants, setAssistants] = useState<Array<{ id: string; name: string }>>([])
	const [editingTags, setEditingTags] = useState(false)
	const [tagInput, setTagInput] = useState('')
	const [localTags, setLocalTags] = useState<string[]>(task.tags || [])
	const [currentAssistant, setCurrentAssistant] = useState(task.assistant_id || '')
	const [currentModel, setCurrentModel] = useState(task.connector_name || '')
	const tagInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (!window.$app?.openapi) return
		const api = new Agent(window.$app.openapi)
		api.assistants.List({ pagesize: 50 }).then((res: any) => {
			const list = res?.data?.data
			if (Array.isArray(list)) {
				setAssistants(list.map((a: any) => ({ id: a.assistant_id, name: a.name })))
			}
		}).catch(() => {})
	}, [])

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

	const handleSecretsClick = () => {
		onNavigate?.('secrets')
	}

	const assistantOptions = assistants.map((a) => ({
		value: a.id,
		label: a.name
	}))

	const modelOptions = llmProviders.map((p) => ({
		value: p.value,
		label: p.label
	}))

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

	const handleTagsDone = () => {
		setEditingTags(false)
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
							{is_cn ? '助手' : 'Assistant'}
						</div>
						<div className={viewStyles.kvValue}>
							<Selector
								value={currentAssistant}
								options={assistantOptions}
								onChange={(val) => setCurrentAssistant(val)}
								variant='normal'
								placeholder={is_cn ? '选择助手' : 'Select assistant'}
								searchable={assistantOptions.length >= 5}
								searchPlaceholder={is_cn ? '搜索助手...' : 'Search...'}
								dropdownWidth='auto'
								dropdownMinWidth={200}
								dropdownMaxWidth={320}
							/>
						</div>
					</div>

					<div className={viewStyles.kvRow}>
						<div className={viewStyles.kvLabel}>
							{is_cn ? '模型' : 'Model'}
						</div>
						<div className={viewStyles.kvValue}>
							<Selector
								value={currentModel}
								options={modelOptions}
								onChange={(val) => setCurrentModel(val)}
								variant='normal'
								placeholder={is_cn ? '选择模型' : 'Select model'}
								searchable={modelOptions.length >= 5}
								searchPlaceholder={is_cn ? '搜索模型...' : 'Search...'}
								dropdownWidth='auto'
								dropdownMinWidth={200}
								dropdownMaxWidth={320}
							/>
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

					<div className={viewStyles.kvRow}>
						<div className={viewStyles.kvLabel}>
							{is_cn ? '电脑' : 'Computer'}
						</div>
						<div className={viewStyles.kvValue}>
							{task.computer ? (
								<span className={viewStyles.statusBadge}>
									<Icon name='material-check_circle' size={14} />
									{task.computer.mode} ({task.computer.status})
								</span>
							) : (
								is_cn ? '未分配' : 'N/A'
							)}
						</div>
					</div>

					<div className={viewStyles.kvRow}>
						<div className={viewStyles.kvLabel}>
							{is_cn ? '沙箱' : 'Sandbox'}
						</div>
						<div className={viewStyles.kvValue}>
							{task.sandbox ? (
								<span className={viewStyles.statusBadge}>
									<Icon name='material-check_circle' size={14} />
									{task.sandbox.type}
								</span>
							) : (
								is_cn ? '未配置' : 'N/A'
							)}
						</div>
					</div>

					<div className={viewStyles.kvRow}>
						<div className={viewStyles.kvLabel}>
							{is_cn ? '密钥' : 'Secrets'}
						</div>
						<div className={viewStyles.kvValue}>
							<span className={styles.clickableValue} onClick={handleSecretsClick}>
								{task.secrets_count
									? `${task.secrets_count} ${is_cn ? '个已配置' : 'configured'}`
									: (is_cn ? '无' : 'None')}
								<Icon name='material-chevron_right' size={14} />
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

					{task.progress !== undefined && (
						<div className={viewStyles.kvRow}>
							<div className={viewStyles.kvLabel}>
								{is_cn ? '进度' : 'Progress'}
							</div>
							<div className={viewStyles.kvValue}>
								{task.progress}%
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default OverviewSection
