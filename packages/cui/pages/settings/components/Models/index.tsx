import { useState, useEffect, useCallback } from 'react'
import { getLocale } from '@umijs/max'
import { message, Modal, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import type { ModelsPageData, RoleAssignment, ModelRole, ProviderConfig } from '../../types'
import { mockApi } from '../../mockApi'
import RoleSelect from './RoleSelect'
import ProviderCard from './ProviderCard'
import ProviderModal from './ProviderModal'
import styles from './index.less'

const ROLE_META: {
	key: ModelRole
	cn: string
	en: string
	tooltip_cn: string
	tooltip_en: string
	required: boolean
}[] = [
	{ key: 'default', cn: '默认对话', en: 'Default Chat', tooltip_cn: '日常聊天使用的模型', tooltip_en: 'Model for daily conversations', required: true },
	{ key: 'vision', cn: '视觉模型', en: 'Vision', tooltip_cn: '能看懂图片和截图的模型', tooltip_en: 'Model that understands images', required: false },
	{ key: 'audio', cn: '语音模型', en: 'Audio', tooltip_cn: '语音转文字使用的模型', tooltip_en: 'Model for speech-to-text', required: false },
	{ key: 'embedding', cn: '嵌入模型', en: 'Embedding', tooltip_cn: '文档搜索内部使用，一般不用选', tooltip_en: 'Used internally for document search, usually not needed', required: false }
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
		mockApi.getModelsConfig().then((res) => {
			setData(res)
			setRoles(res.roles)
			setLoading(false)
		})
	}, [])

	const reload = useCallback(async () => {
		const res = await mockApi.getModelsConfig()
		setData(res)
	}, [])

	const handleSaveRoles = async () => {
		if (!roles.default) {
			message.warning(is_cn ? '请选择默认对话模型' : 'Please select a default chat model')
			return
		}
		setSavingRoles(true)
		try {
			await mockApi.saveRoleAssignment(roles)
			message.success(is_cn ? '默认模型已保存' : 'Default models saved')
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
				await mockApi.removeProvider(key)
				await reload()
				message.success(is_cn ? '已删除' : 'Deleted')
			}
		})
	}

	const handleModalDone = async () => {
		setModalOpen(false)
		await reload()
	}

	if (loading || !data) {
		return (
			<div className={styles.models}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '模型配置' : 'Model Configuration'}</h2>
						<p>{is_cn ? '分配默认/视觉/语音/嵌入模型，管理模型服务' : 'Assign default/vision/audio/embedding models, manage model providers'}</p>
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
					<p>{is_cn ? '分配默认/视觉/语音/嵌入模型，管理模型服务' : 'Assign default/vision/audio/embedding models, manage model providers'}</p>
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
							<div className={styles.roleSelect}>
								<RoleSelect
									role={r.key}
									value={roleValueToStr(roles[r.key])}
									onChange={(v) => handleRoleChange(r.key, v)}
									providers={data.providers}
								/>
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
