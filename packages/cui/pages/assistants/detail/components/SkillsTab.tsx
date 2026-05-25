import { useEffect, useState, useCallback } from 'react'
import { Alert, Spin, Modal, message } from 'antd'
import { getLocale } from '@umijs/max'
import clsx from 'clsx'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import FileViewer from '@/components/view/FileViewer'
import { Setting } from '@/openapi/setting'
import type { AgentSkill } from '@/openapi/setting/types'
import styles from './View/index.less'

interface SkillsTabProps {
	assistantId: string
}

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

const SkillsTab = ({ assistantId }: SkillsTabProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [skills, setSkills] = useState<AgentSkill[]>([])
	const [loading, setLoading] = useState(true)
	const [loadError, setLoadError] = useState(false)
	const [previewFile, setPreviewFile] = useState<{ name: string; content: string; contentType: string } | null>(null)
	const [previewLoading, setPreviewLoading] = useState(false)

	const loadSkills = useCallback(async () => {
		const api = getSettingAPI()
		if (!api) {
			setLoading(false)
			return
		}
		setLoadError(false)
		try {
			const res = await api.GetAgentSkills(assistantId)
			if (!window.$app?.openapi?.IsError(res)) {
				setSkills(window.$app.openapi.GetData(res) || [])
			} else {
				setLoadError(true)
			}
		} catch (err) {
			console.error('[SkillsTab] load failed:', err)
			setLoadError(true)
		} finally {
			setLoading(false)
		}
	}, [assistantId])

	const handleSkillClick = useCallback(async (skill: AgentSkill) => {
		const api = getSettingAPI()
		if (!api) return

		setPreviewLoading(true)
		setPreviewFile({ name: `${skill.name} — SKILL.md`, content: '', contentType: 'text/markdown' })

		try {
			const res = await api.GetAgentSkillDetail(assistantId, skill.name)
			if (!window.$app?.openapi?.IsError(res)) {
				const data = window.$app.openapi.GetData(res)
				setPreviewFile({
					name: `${data?.name || skill.name} — SKILL.md`,
					content: data?.content || '',
					contentType: 'text/markdown'
				})
			} else {
				message.error(is_cn ? '加载技能详情失败' : 'Failed to load skill detail')
				setPreviewFile(null)
			}
		} catch (err) {
			console.error('[SkillsTab] detail load failed:', err)
			message.error(is_cn ? '加载技能详情失败' : 'Failed to load skill detail')
			setPreviewFile(null)
		} finally {
			setPreviewLoading(false)
		}
	}, [assistantId, is_cn])

	useEffect(() => {
		loadSkills()
	}, [loadSkills])

	if (loading) {
		return (
			<div className={styles.emptyState}>
				<Spin />
			</div>
		)
	}

	if (loadError) {
		return (
			<div className={styles.sectionContent}>
				<Alert
					type='warning'
					message={is_cn ? '无法加载技能列表' : 'Failed to load skills'}
					action={
						<Button
							size='small'
							onClick={() => {
								setLoading(true)
								loadSkills()
							}}
						>
							{is_cn ? '重试' : 'Retry'}
						</Button>
					}
				/>
			</div>
		)
	}

	if (skills.length === 0) {
		return (
			<div className={styles.emptyState}>
				<Icon name='material-psychology' size={32} />
				<span style={{ marginTop: 12 }}>
					{is_cn ? '该助手暂无技能定义' : 'No skills defined for this assistant'}
				</span>
			</div>
		)
	}

	return (
		<div className={styles.sectionContent}>
			{skills.map((skill, idx) => (
				<div
					key={idx}
					className={clsx(styles.listRow, styles.listRowClickable)}
					onClick={() => handleSkillClick(skill)}
				>
					<Icon name='material-auto_fix_high' size={16} className={styles.listRowIcon} />
					<div className={styles.listRowContent}>
						<div className={styles.listRowName}>{skill.name}</div>
						{skill.description && (
							<div className={styles.listRowDesc}>{skill.description}</div>
						)}
					</div>
				</div>
			))}

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

export default SkillsTab
