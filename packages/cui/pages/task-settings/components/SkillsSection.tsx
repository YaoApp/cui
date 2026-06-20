import { useState } from 'react'
import { getLocale } from '@umijs/max'
import { Modal, message } from 'antd'
import clsx from 'clsx'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import FileViewer from '@/components/view/FileViewer'
import type { KanbanTask } from '../../kanban/types'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'

interface SkillItem {
	id: string
	name: string
	description?: string
	source: 'task' | 'agent'
	content?: string
}

const MOCK_SKILLS: SkillItem[] = [
	{
		id: 'sk-1',
		name: 'web-search',
		description: '搜索互联网获取最新信息',
		source: 'agent',
		content: '# Web Search\n\n在线搜索工具，支持 Google、Bing 等搜索引擎。\n\n## 用法\n\n调用 `web_search(query)` 获取搜索结果。'
	},
	{
		id: 'sk-2',
		name: 'code-interpreter',
		description: '执行 Python 代码并返回结果',
		source: 'agent',
		content: '# Code Interpreter\n\n安全沙箱中执行 Python 代码。\n\n## 限制\n\n- 最大执行时间: 30s\n- 内存限制: 512MB'
	},
	{
		id: 'sk-3',
		name: 'data-analysis',
		description: '分析 CSV/Excel 数据并生成报告',
		source: 'task',
		content: '# Data Analysis\n\n任务专属技能，用于分析结构化数据。\n\n## 支持格式\n\n- CSV\n- Excel (.xlsx)\n- JSON'
	},
	{
		id: 'sk-4',
		name: 'file-manager',
		description: '管理工作空间中的文件',
		source: 'agent',
		content: '# File Manager\n\n文件管理技能，支持创建、读取、更新、删除文件。'
	}
]

const SkillsSection = ({ task }: { task: KanbanTask }) => {
	const is_cn = getLocale() === 'zh-CN'
	const [skills, setSkills] = useState<SkillItem[]>(MOCK_SKILLS)
	const [previewFile, setPreviewFile] = useState<{ name: string; content: string; contentType: string } | null>(null)

	const sourceTag = (source: 'task' | 'agent') => {
		const labels = { task: is_cn ? '任务' : 'Task', agent: is_cn ? 'AI 专家' : 'AI Expert' }
		const colors = { task: '#1890ff', agent: '#722ed1' }
		return (
			<span style={{
				fontSize: 10,
				padding: '1px 5px',
				borderRadius: 3,
				background: `${colors[source]}15`,
				color: colors[source],
				fontWeight: 500,
				marginLeft: 8
			}}>
				{labels[source]}
			</span>
		)
	}

	const handleSkillClick = (skill: SkillItem) => {
		if (skill.content) {
			setPreviewFile({
				name: `${skill.name} — SKILL.md`,
				content: skill.content,
				contentType: 'text/markdown'
			})
		}
	}

	const handleAdd = () => {
		message.info(is_cn ? '添加技能 - 即将上线' : 'Add skill - Coming soon')
	}

	const handleRemove = (skill: SkillItem) => {
		setSkills((prev) => prev.filter((s) => s.id !== skill.id))
		message.success(is_cn ? `已移除技能 ${skill.name}` : `Removed skill ${skill.name}`)
	}

	const agentSkills = skills.filter((s) => s.source === 'agent')
	const taskSkills = skills.filter((s) => s.source === 'task')

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

				{agentSkills.length > 0 && (
					<div style={{ marginBottom: taskSkills.length > 0 ? 20 : 0 }}>
						<div className={viewStyles.infoLabel} style={{ marginBottom: 8 }}>
							{is_cn ? '继承自 AI 专家' : 'Inherited from AI Expert'}
						</div>
						{agentSkills.map((skill) => (
							<div
								key={skill.id}
								className={clsx(viewStyles.listRow, viewStyles.listRowClickable)}
								onClick={() => handleSkillClick(skill)}
							>
								<Icon name='material-auto_fix_high' size={16} className={viewStyles.listRowIcon} />
								<div className={viewStyles.listRowContent}>
									<div className={viewStyles.listRowName}>
										{skill.name}
										{sourceTag(skill.source)}
									</div>
									{skill.description && (
										<div className={viewStyles.listRowDesc}>{skill.description}</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}

				{taskSkills.length > 0 && (
					<div>
						<div className={viewStyles.infoLabel} style={{ marginBottom: 8 }}>
							{is_cn ? '任务专属' : 'Task-specific'}
						</div>
						{taskSkills.map((skill) => (
							<div
								key={skill.id}
								className={clsx(viewStyles.listRow, viewStyles.listRowClickable)}
								style={{ position: 'relative' }}
								onClick={() => handleSkillClick(skill)}
							>
								<Icon name='material-auto_fix_high' size={16} className={viewStyles.listRowIcon} />
								<div className={viewStyles.listRowContent}>
									<div className={viewStyles.listRowName}>
										{skill.name}
										{sourceTag(skill.source)}
									</div>
									{skill.description && (
										<div className={viewStyles.listRowDesc}>{skill.description}</div>
									)}
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
				)}

				{skills.length === 0 && (
					<div className={viewStyles.emptyState}>
						<Icon name='material-auto_fix_high' size={32} />
						<span style={{ marginTop: 12 }}>
							{is_cn ? '暂无技能配置' : 'No skills configured'}
						</span>
					</div>
				)}
			</div>

			<Modal
				open={!!previewFile}
				title={previewFile?.name}
				footer={null}
				width='80vw'
				styles={{ body: { height: '70vh', padding: 0, overflow: 'hidden' } }}
				onCancel={() => setPreviewFile(null)}
				destroyOnClose
			>
				{previewFile && (
					<FileViewer
						content={previewFile.content}
						contentType={previewFile.contentType}
						__name={previewFile.name}
						__bind=''
						__value={previewFile.name}
						style={{ height: '70vh' }}
						showMaximize
						defaultPreview
					/>
				)}
			</Modal>
		</div>
	)
}

export default SkillsSection
