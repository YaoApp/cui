import { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import clsx from 'clsx'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import type { TaskConfig, SetConfigRequest } from '@/openapi/agent/tasks'
import type { KanbanTask } from '../../kanban/types'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'

interface Props {
	task: KanbanTask
	taskId: string
	config: TaskConfig | null
	onConfigSave: (req: SetConfigRequest) => Promise<void>
}

const SkillsSection = ({ task, taskId, config, onConfigSave }: Props) => {
	const is_cn = getLocale() === 'zh-CN'
	const [skills, setSkills] = useState<string[]>([])

	const skillsSource = config?._resolved_from?.skills || 'default'

	useEffect(() => {
		if (config?.setting?.skills) {
			setSkills(config.setting.skills)
		} else {
			setSkills([])
		}
	}, [config])

	const sourceTag = (source: string) => {
		const labels: Record<string, string> = {
			task: is_cn ? '任务' : 'Task',
			agent: is_cn ? 'AI 专家' : 'AI Expert',
			'system/team/user': is_cn ? '默认' : 'Default',
			default: is_cn ? '默认' : 'Default'
		}
		const colors: Record<string, string> = {
			task: '#1890ff',
			agent: '#722ed1',
			'system/team/user': '#8c8c8c',
			default: '#8c8c8c'
		}
		return (
			<span style={{
				fontSize: 10,
				padding: '1px 5px',
				borderRadius: 3,
				background: `${colors[source] || '#8c8c8c'}15`,
				color: colors[source] || '#8c8c8c',
				fontWeight: 500,
				marginLeft: 8
			}}>
				{labels[source] || source}
			</span>
		)
	}

	const handleRemove = async (skill: string) => {
		const updated = skills.filter((s) => s !== skill)
		try {
			await onConfigSave({ skills: updated })
			setSkills(updated)
			message.success(is_cn ? `已移除技能 ${skill}` : `Removed skill ${skill}`)
		} catch {
			message.error(is_cn ? '移除失败' : 'Remove failed')
		}
	}

	const handleAdd = () => {
		message.info(is_cn ? '添加技能 - 即将上线' : 'Add skill - Coming soon')
	}

	return (
		<div className={viewStyles.sectionContent}>
			<div className={viewStyles.card}>
				<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
					<div>
						<div className={viewStyles.cardTitle}>{is_cn ? '技能配置' : 'Skills'}</div>
						<div className={viewStyles.cardDesc}>
							{is_cn
								? '任务可使用的技能列表。继承 AI 专家技能，也可添加任务专属技能。'
								: 'Skills available for this task. Inherits from AI Expert, with optional task-specific additions.'}
						</div>
					</div>
					<div style={{ flexShrink: 0 }}>
						<Button size='small' type='primary' onClick={handleAdd}>
							{is_cn ? '+ 添加' : '+ Add'}
						</Button>
					</div>
				</div>

				{skills.length > 0 ? (
					<div>
						<div className={viewStyles.infoLabel} style={{ marginBottom: 8 }}>
							{is_cn ? '技能列表' : 'Skills List'}
							{sourceTag(skillsSource)}
						</div>
						{skills.map((skill) => (
							<div
								key={skill}
								className={clsx(viewStyles.listRow, viewStyles.listRowClickable)}
								style={{ position: 'relative' }}
							>
								<Icon name='material-auto_fix_high' size={16} className={viewStyles.listRowIcon} />
								<div className={viewStyles.listRowContent}>
									<div className={viewStyles.listRowName}>{skill}</div>
								</div>
								<span
									className={viewStyles.listRowAction}
									onClick={(e) => {
										e.stopPropagation()
										handleRemove(skill)
									}}
									title={is_cn ? '移除' : 'Remove'}
								>
									<Icon name='material-close' size={14} />
								</span>
							</div>
						))}
					</div>
				) : (
					<div className={viewStyles.emptyState}>
						<Icon name='material-auto_fix_high' size={32} />
						<span style={{ marginTop: 12 }}>
							{is_cn ? '暂无技能配置' : 'No skills configured'}
						</span>
					</div>
				)}
			</div>
		</div>
	)
}

export default SkillsSection
