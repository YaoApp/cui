import { useState, useEffect, useCallback } from 'react'
import { history, getLocale } from '@umijs/max'
import { message, Spin } from 'antd'
import { Setting } from '@/openapi/setting'
import type { ModelsPageData, RoleAssignment, ModelRole, ProviderConfig } from '@/pages/settings/types'
import RoleSelect from '@/pages/settings/components/Models/RoleSelect'
import SetupLayout from '../components/SetupLayout'
import styles from '../index.less'

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

const ROLE_META: {
	key: ModelRole
	cn: string
	en: string
	tooltip_cn: string
	tooltip_en: string
	required: boolean
}[] = [
	{
		key: 'default',
		cn: '默认模型',
		en: 'Default',
		tooltip_cn: '日常对话、简单编码和常规任务的主力模型。建议选择性价比高、响应快的模型',
		tooltip_en: 'Primary model for everyday conversations, simple coding and routine tasks. Choose a balanced, fast-responding model',
		required: true
	},
	{
		key: 'heavy',
		cn: '复杂任务',
		en: 'Heavy',
		tooltip_cn: '用于复杂任务（代码生成、架构规划、深度审查、多步推理）。不选则使用默认模型',
		tooltip_en: 'For complex tasks (code generation, architecture planning, deep review, multi-step reasoning). Falls back to default if not set',
		required: false
	},
	{
		key: 'light',
		cn: '轻量模型',
		en: 'Light',
		tooltip_cn: '用于标题生成、关键词提取、摘要等简单任务。不选则使用默认模型',
		tooltip_en: 'For titles, keywords, summaries and simple tasks. Uses Default if not set',
		required: false
	},
	{
		key: 'vision',
		cn: '视觉模型',
		en: 'Vision',
		tooltip_cn: '图片理解与分析。不选则使用默认模型',
		tooltip_en: 'Image understanding and analysis. Uses Default if not set',
		required: false
	},
	{
		key: 'audio',
		cn: '语音模型',
		en: 'Audio',
		tooltip_cn: '语音转文字。不选则关闭语音功能',
		tooltip_en: 'Speech-to-text. Disabled if not set',
		required: false
	},
	{
		key: 'embedding',
		cn: '嵌入模型',
		en: 'Embedding',
		tooltip_cn: '文档搜索使用的向量化模型。不选则关闭知识库搜索功能',
		tooltip_en: 'Vectorization model for document search. Disabled if not set',
		required: false
	}
]

function roleValueToStr(assignment?: { provider: string; model: string }): string | undefined {
	if (!assignment) return undefined
	return `${assignment.provider}::${assignment.model}`
}

function strToRoleValue(str: string | undefined): { provider: string; model: string } | undefined {
	if (!str) return undefined
	const [provider, model] = str.split('::')
	return provider && model ? { provider, model } : undefined
}

/** Pick the first chat-capable model from available providers. */
function findFirstChatModel(providers: ProviderConfig[]): string | undefined {
	for (const p of providers) {
		if (!p.enabled) continue
		for (const m of p.models) {
			if (!m.enabled) continue
			const caps = m.capabilities || []
			const isSpecialized =
				caps.includes('embedding') || caps.includes('audio') || caps.includes('image_generation')
			if (!isSpecialized) return `${p.key}::${m.id}`
		}
	}
	return undefined
}

const ByokModels = () => {
	const is_cn = getLocale() === 'zh-CN'

	const byokSteps = [
		{ label: is_cn ? '模型服务' : 'Providers' },
		{ label: is_cn ? '角色分配' : 'Roles' },
		{ label: is_cn ? '搜索配置' : 'Search' }
	]

	const [loading, setLoading] = useState(true)
	const [data, setData] = useState<ModelsPageData | null>(null)
	const [roles, setRoles] = useState<RoleAssignment>({})
	const [saving, setSaving] = useState(false)

	const loadData = useCallback(async () => {
		const api = getSettingAPI()
		if (!api) return
		const resp = await api.GetLLMConfig()
		if (resp.error || !resp.data) return
		const d = resp.data as unknown as ModelsPageData
		setData(d)
		const existingRoles = d.roles || {}
		if (!existingRoles.default) {
			const first = findFirstChatModel(d.providers)
			if (first) {
				existingRoles.default = strToRoleValue(first)
			}
		}
		setRoles(existingRoles)
		setLoading(false)
	}, [])

	useEffect(() => {
		loadData()
	}, [loadData])

	const handleRoleChange = (role: ModelRole, val: string | undefined) => {
		setRoles((prev) => {
			const next = { ...prev }
			const parsed = strToRoleValue(val)
			if (parsed) {
				next[role] = parsed
			} else {
				delete next[role]
			}
			return next
		})
	}

	const doSave = async (rolesToSave: RoleAssignment) => {
		const api = getSettingAPI()
		if (!api) return false
		setSaving(true)
		try {
			const resp = await api.SaveRoles(rolesToSave as any)
			if (resp.error) {
				message.error(resp.error?.error_description || (is_cn ? '保存失败' : 'Save failed'))
				return false
			}
			window.$app?.Event?.emit('models/changed')
			return true
		} finally {
			setSaving(false)
		}
	}

	const handleSaveAndContinue = async () => {
		if (!roles.default) {
			message.warning(is_cn ? '请选择默认模型' : 'Please select a default model')
			return
		}
		const ok = await doSave(roles)
		if (ok) history.push('/setup/byok/search')
	}

	const handleSkip = async () => {
		let rolesToSave = { ...roles }
		if (!rolesToSave.default && data) {
			const first = findFirstChatModel(data.providers)
			if (first) {
				rolesToSave.default = strToRoleValue(first)
			}
		}
		if (!rolesToSave.default) {
			message.warning(is_cn ? '没有可用模型，无法跳过' : 'No available model, cannot skip')
			return
		}
		const ok = await doSave(rolesToSave)
		if (ok) history.push('/setup/byok/search')
	}

	return (
		<SetupLayout
			showBack
			backLabel={is_cn ? '切换使用 Tao Service' : 'Switch to Tao Service'}
			onBack={() => history.push('/setup/tao')}
			steps={byokSteps}
			currentStep={1}
		>
			<div className={styles.byokCard}>
				<h2 className={styles.byokTitle}>
					{is_cn ? '配置 AI 模型角色' : 'Configure AI Model Roles'}
				</h2>
				<p className={styles.byokSubtitle}>
					{is_cn ? '为不同用途分配 AI 模型' : 'Assign AI models for different purposes'}
				</p>

				{loading || !data ? (
					<div className={styles.loadingWrap}>
						<Spin size='small' />
					</div>
				) : (
					<>
						{ROLE_META.map((r) => (
							<div key={r.key} className={styles.byokRoleRow}>
								<div className={styles.byokRoleLabel}>
									<span className={styles.byokRoleName}>
										{is_cn ? r.cn : r.en}
									</span>
									{r.required ? (
										<span className={styles.byokRoleRequired}>
											{is_cn ? '必填' : 'Required'}
										</span>
									) : (
										<span className={styles.byokRoleOptional}>
											{is_cn ? '可选' : 'Optional'}
										</span>
									)}
								</div>
								<div className={styles.byokRoleRight}>
									<div className={styles.byokRoleSelect}>
										<RoleSelect
											role={r.key}
											value={roleValueToStr(roles[r.key])}
											onChange={(v) => handleRoleChange(r.key, v)}
											providers={data.providers}
										/>
									</div>
									<div className={styles.byokRoleDesc}>
										{is_cn ? r.tooltip_cn : r.tooltip_en}
									</div>
								</div>
							</div>
						))}

						<div className={styles.byokFooter}>
							<button
								className={styles.byokSkipBtn}
								type='button'
								onClick={() => history.push('/setup/byok')}
							>
								{is_cn ? '上一步' : 'Previous'}
							</button>
							<button
								className={styles.byokNextBtn}
								type='button'
								disabled={saving || !roles.default}
								onClick={handleSaveAndContinue}
							>
								{saving
									? (is_cn ? '保存中...' : 'Saving...')
									: (is_cn ? '保存并继续 →' : 'Save & Continue →')}
							</button>
						</div>
					</>
				)}
			</div>
		</SetupLayout>
	)
}

export default ByokModels
