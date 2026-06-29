import { useState, useEffect, useCallback } from 'react'
import { getLocale } from '@umijs/max'
import { Modal, Spin, message } from 'antd'
import clsx from 'clsx'
import Icon from '@/widgets/Icon'
import FileViewer from '@/components/view/FileViewer'
import { Setting } from '@/openapi/setting'
import type { KanbanTask } from '../../kanban/types'
import styles from '@/pages/assistants/detail/components/View/index.less'

interface SkillItem {
	name: string
	description: string
}

type SkillSource = 'bundled' | 'extended'

interface SkillsResponse {
	bundled: SkillItem[]
	extended: SkillItem[]
	has_workspace: boolean
}

interface Props {
	task: KanbanTask
	taskId: string
}

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

const SkillsSection = ({ task, taskId }: Props) => {
	const is_cn = getLocale() === 'zh-CN'
	const [loading, setLoading] = useState(true)
	const [bundled, setBundled] = useState<SkillItem[]>([])
	const [extended, setExtended] = useState<SkillItem[]>([])
	const [hasWorkspace, setHasWorkspace] = useState(false)
	const [previewFile, setPreviewFile] = useState<{ name: string; content: string; contentType: string } | null>(null)
	const [previewLoading, setPreviewLoading] = useState(false)

	const loadSkills = useCallback(async () => {
		const api = window.$app?.openapi
		if (!api) {
			setLoading(false)
			return
		}
		try {
			const res = await (api as any).Get(`/agent/tasks/${encodeURIComponent(taskId)}/skills`)
			if (!api.IsError(res)) {
				const data: SkillsResponse = api.GetData(res)
				setBundled(data?.bundled || [])
				setExtended(data?.extended || [])
				setHasWorkspace(data?.has_workspace || false)
			}
		} catch (err) {
			console.error('[SkillsSection] load failed:', err)
		} finally {
			setLoading(false)
		}
	}, [taskId])

	useEffect(() => {
		loadSkills()
	}, [loadSkills])

	const handleSkillClick = useCallback(async (skill: SkillItem, source: SkillSource) => {
		setPreviewLoading(true)
		setPreviewFile({ name: `${skill.name} — SKILL.md`, content: '', contentType: 'text/markdown' })

		const api = window.$app?.openapi
		if (!api) {
			setPreviewLoading(false)
			return
		}

		try {
			let content = ''
			if (source === 'bundled') {
				const settingApi = getSettingAPI()
				if (settingApi && task.assistant_id) {
					const res = await settingApi.GetAgentSkillDetail(task.assistant_id, skill.name)
					if (!api.IsError(res)) {
						const data = api.GetData(res)
						content = data?.content || ''
					}
				}
			} else if (task.workspace?.id) {
				const wsId = task.workspace.id
				const filePath = `.yao/skills/${skill.name}/SKILL.md`
				const res = await (api as any).Get(
					`/workspace/${encodeURIComponent(wsId)}/files/${filePath}`
				)
				if (!api.IsError(res)) {
					content = typeof res === 'string' ? res : (api.GetData(res) || '')
				}
			}

			if (content) {
				setPreviewFile({
					name: `${skill.name} — SKILL.md`,
					content,
					contentType: 'text/markdown'
				})
			} else {
				message.error(is_cn ? '加载技能详情失败' : 'Failed to load skill detail')
				setPreviewFile(null)
			}
		} catch {
			message.error(is_cn ? '加载技能详情失败' : 'Failed to load skill detail')
			setPreviewFile(null)
		} finally {
			setPreviewLoading(false)
		}
	}, [task.assistant_id, task.workspace, is_cn])

	if (loading) {
		return (
			<div className={styles.emptyState}>
				<Spin />
			</div>
		)
	}

	const totalSkills = bundled.length + extended.length

	const renderSkillRow = (skill: SkillItem, icon: string, source: SkillSource) => (
		<div
			key={skill.name}
			className={clsx(styles.listRow, styles.listRowClickable)}
			onClick={() => handleSkillClick(skill, source)}
			style={!skill.description ? { alignItems: 'center' } : undefined}
		>
			<Icon name={icon} size={16} className={styles.listRowIcon} />
			<div className={styles.listRowContent}>
				<div className={styles.listRowName}>{skill.name}</div>
				{skill.description && (
					<div className={styles.listRowDesc}>{skill.description}</div>
				)}
			</div>
		</div>
	)

	return (
		<div className={styles.sectionContent}>
			<div className={styles.card}>
				<div style={{ marginBottom: 16 }}>
					<div className={styles.cardTitle}>{is_cn ? '技能配置' : 'Skills'}</div>
					<div className={styles.cardDesc}>
						{is_cn
							? '任务可使用的技能列表。继承 AI 专家技能，也可添加任务专属技能。'
							: 'Skills available for this task. Inherits from AI Expert, with optional task-specific additions.'}
					</div>
				</div>

				{totalSkills > 0 ? (
					<>
						{bundled.length > 0 && (
							<div style={{ marginBottom: extended.length > 0 ? 20 : 0 }}>
								<div className={styles.infoLabel} style={{ marginBottom: 8 }}>
									{is_cn ? `${task.assistant_name || 'AI 专家'} 自带技能` : `${task.assistant_name || 'Agent'} Bundled Skills`}
								</div>
								{bundled.map((skill) => renderSkillRow(skill, 'material-auto_fix_high', 'bundled'))}
							</div>
						)}
						{extended.length > 0 && (
							<div>
								<div className={styles.infoLabel} style={{ marginBottom: 8 }}>
									{is_cn ? '任务扩展技能（Workspace）' : 'Task Extended Skills (Workspace)'}
								</div>
								{extended.map((skill) => renderSkillRow(skill, 'material-extension', 'extended'))}
							</div>
						)}
					</>
				) : (
					<div className={styles.emptyState}>
						<Icon name='material-auto_fix_high' size={32} />
						<span style={{ marginTop: 12 }}>
							{is_cn ? '暂无技能配置' : 'No skills configured'}
						</span>
						{!hasWorkspace && (
							<span style={{ marginTop: 6, fontSize: 12, color: 'var(--color_text_grey)' }}>
								{is_cn ? '任务未绑定 Workspace，扩展技能不可用' : 'No workspace bound, extended skills unavailable'}
							</span>
						)}
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
				{previewLoading ? (
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
						<Spin />
					</div>
				) : (
					previewFile && (
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
					)
				)}
			</Modal>
		</div>
	)
}

export default SkillsSection
