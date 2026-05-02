import { useState, useEffect, useCallback } from 'react'
import { getLocale } from '@umijs/max'
import { message, Modal, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { Setting } from '@/openapi/setting'
import type { ModelsPageData, RoleAssignment, ModelRole, ProviderConfig } from '../../types'
import RoleSelect from './RoleSelect'
import ProviderCard from './ProviderCard'
import ProviderModal from './ProviderModal'
import styles from './index.less'

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
		tooltip_cn:
			'用于复杂任务（代码生成、架构规划、深度审查、多步推理）。Claude 沙箱中替代 Opus 层级用于深度推理，OpenCode 沙箱中作为默认主力模型。不选则使用默认模型',
		tooltip_en:
			'For complex tasks (code generation, architecture planning, deep review, multi-step reasoning). Replaces the Opus tier in Claude sandbox; used as the default primary model in OpenCode sandbox. Falls back to default if not set',
		required: false
	},
	{
		key: 'light',
		cn: '轻量模型',
		en: 'Light',
		tooltip_cn: '用于标题生成、关键词提取、摘要等简单任务。建议选择快速便宜的模型。不选则使用默认模型',
		tooltip_en: 'For titles, keywords, summaries and simple tasks. Choose a fast, affordable model. Uses Default if not set',
		required: false
	},
	{
		key: 'vision',
		cn: '视觉模型',
		en: 'Vision',
		tooltip_cn: '图片理解与分析。不选则使用默认模型，若默认模型不支持视觉则相关功能将不可用',
		tooltip_en: 'Image understanding and analysis. Uses Default if not set; vision features will fail if Default model lacks vision support',
		required: false
	},
	{
		key: 'audio',
		cn: '语音模型',
		en: 'Audio',
		tooltip_cn: '语音转文字（STT）。不选则关闭语音功能',
		tooltip_en: 'Speech-to-text (STT). Disabled if not set',
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

const Models = () => {
	const is_cn = getLocale() === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [data, setData] = useState<ModelsPageData | null>(null)
	const [roles, setRoles] = useState<RoleAssignment>({})
	const [savingRoles, setSavingRoles] = useState(false)

	const [modalOpen, setModalOpen] = useState(false)
	const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
	const [editProvider, setEditProvider] = useState<ProviderConfig | null>(null)

	useEffect(() => {
		const api = getSettingAPI()
		if (!api) return
		api.GetLLMConfig().then((resp) => {
			if (resp.error || !resp.data) return
			setData(resp.data as unknown as ModelsPageData)
			setRoles((resp.data as any).roles || {})
			setLoading(false)
		})
	}, [])

	const reload = useCallback(async () => {
		const api = getSettingAPI()
		if (!api) return
		const resp = await api.GetLLMConfig()
		if (resp.error || !resp.data) return
		setData(resp.data as unknown as ModelsPageData)
	}, [])

	const handleSaveRoles = async () => {
		if (!roles.default) {
			message.warning(is_cn ? '请选择默认对话模型' : 'Please select a default chat model')
			return
		}
		const api = getSettingAPI()
		if (!api) return
		setSavingRoles(true)
		try {
			const resp = await api.SaveRoles(roles as any)
			if (resp.error) {
				message.error(resp.error?.error_description || (is_cn ? '保存失败' : 'Save failed'))
				return
			}
			message.success(is_cn ? '默认模型已保存' : 'Default models saved')
			window.$app?.Event?.emit('models/changed')
		} finally {
			setSavingRoles(false)
		}
	}

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

	const handleOpenAdd = () => {
		setModalMode('add')
		setEditProvider(null)
		setModalOpen(true)
	}

	const handleOpenEdit = (provider: ProviderConfig) => {
		setModalMode('edit')
		setEditProvider(provider)
		setModalOpen(true)
	}

	const handleDelete = (key: string) => {
		const provider = data?.providers.find((p) => p.key === key)
		Modal.confirm({
			title: is_cn ? '确认删除' : 'Confirm Delete',
			content: is_cn
				? `确定要删除「${provider?.name || key}」吗？此操作不可撤销。`
				: `Are you sure you want to delete "${provider?.name || key}"? This cannot be undone.`,
			okText: is_cn ? '删除' : 'Delete',
			cancelText: is_cn ? '取消' : 'Cancel',
			okType: 'danger',
			onOk: async () => {
				const api = getSettingAPI()
				if (!api) return
				const resp = await api.DeleteProvider(key)
				if (resp.error) {
					message.error(resp.error?.error_description || (is_cn ? '删除失败' : 'Delete failed'))
					return
				}
				await reload()
				message.success(is_cn ? '已删除' : 'Deleted')
				window.$app?.Event?.emit('models/changed')
			}
		})
	}

	const handleModalDone = async () => {
		setModalOpen(false)
		await reload()
		window.$app?.Event?.emit('models/changed')
	}

	if (loading || !data) {
		return (
			<div className={styles.models}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '模型配置' : 'Model Configuration'}</h2>
				<p>{is_cn ? '分配默认/推理/轻量/视觉/语音/嵌入模型，管理模型服务' : 'Assign default/reasoning/light/vision/audio/embedding models, manage model providers'}</p>
			</div>
		</div>
		<div className={styles.loadingState}>
					<Spin size='small' />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.models}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '模型配置' : 'Model Configuration'}</h2>
			<p>{is_cn ? '分配默认/推理/轻量/视觉/语音/嵌入模型，管理模型服务' : 'Assign default/reasoning/light/vision/audio/embedding models, manage model providers'}</p>
		</div>
	</div>

	{/* Role Assignment */}
			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? '默认模型' : 'Default Models'}</div>
				</div>

				<div className={styles.card}>
					{ROLE_META.map((r) => (
						<div key={r.key} className={styles.roleRow}>
							<div className={styles.roleLabel}>
								<span className={styles.roleName}>{is_cn ? r.cn : r.en}</span>
								<span className={r.required ? styles.roleRequired : styles.roleOptional}>
									{r.required ? (is_cn ? '必填' : 'Required') : (is_cn ? '可选' : 'Optional')}
								</span>
							</div>
							<div className={styles.roleRight}>
								<div className={styles.roleSelect}>
									<RoleSelect
										role={r.key}
										value={roleValueToStr(roles[r.key])}
										onChange={(v) => handleRoleChange(r.key, v)}
										providers={data.providers}
									/>
								</div>
								<div className={styles.roleDesc}>{is_cn ? r.tooltip_cn : r.tooltip_en}</div>
							</div>
						</div>
					))}

					<div className={styles.roleFooter}>
						<div className={styles.roleHint}>
							<Icon name='material-info' size={14} />
							<span>{is_cn ? '下拉只列出已启用服务中的可用模型' : 'Only models from enabled providers are listed'}</span>
						</div>
						<Button type='primary' loading={savingRoles} onClick={handleSaveRoles}>
							{is_cn ? '保存' : 'Save'}
						</Button>
					</div>
				</div>
			</div>

			{/* Provider List */}
			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? '模型服务' : 'Model Providers'}</div>
				</div>

				<div className={styles.providerList}>
					{data.providers.map((p) => (
						<ProviderCard
							key={p.key}
							provider={p}
							onEdit={handleOpenEdit}
							onDelete={handleDelete}
						/>
					))}
				</div>

				<div className={styles.addProviderBtn} onClick={handleOpenAdd}>
					<Icon name='material-add' size={18} />
					<span>{is_cn ? '添加模型服务' : 'Add Model Provider'}</span>
				</div>
			</div>

			{/* Modal */}
			<ProviderModal
				open={modalOpen}
				mode={modalMode}
				presets={data.preset_providers}
				editProvider={editProvider}
				onClose={() => setModalOpen(false)}
				onDone={handleModalDone}
			/>
		</div>
	)
}

export default Models
