import { useState, useEffect, useMemo } from 'react'
import { getLocale, useNavigate } from '@umijs/max'
import { Modal, message } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { Select, Input, InputPassword, CheckboxGroup } from '@/components/ui/inputs'
import type { PropertySchema, EnumOption } from '@/components/ui/inputs/types'
import type { ProviderConfig, ProviderPreset, ModelInfo, ModelCapability } from '../../types'
import { Setting } from '@/openapi/setting'
import styles from './index.less'

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

const ALL_CAPS: { key: ModelCapability; cn: string; en: string }[] = [
	{ key: 'vision', cn: '看图', en: 'Vision' },
	{ key: 'audio', cn: '语音', en: 'Audio' },
	{ key: 'reasoning', cn: '思考', en: 'Reasoning' },
	{ key: 'tool_calls', cn: '工具调用', en: 'Tools' },
	{ key: 'streaming', cn: '逐字输出', en: 'Streaming' },
	{ key: 'json', cn: '结构化输出', en: 'JSON' },
	{ key: 'embedding', cn: '嵌入', en: 'Embedding' }
]

function capDesc(caps: ModelCapability[], is_cn: boolean): string {
	return caps
		.map((c) => {
			const item = ALL_CAPS.find((a) => a.key === c)
			return item ? (is_cn ? item.cn : item.en) : ''
		})
		.filter(Boolean)
		.join(' · ')
}

interface ProviderModalProps {
	open: boolean
	mode: 'add' | 'edit'
	presets: ProviderPreset[]
	editProvider?: ProviderConfig | null
	onClose: () => void
	onDone: () => void
}

export default function ProviderModal({ open, mode, presets, editProvider, onClose, onDone }: ProviderModalProps) {
	const is_cn = getLocale() === 'zh-CN'
	const navigate = useNavigate()

	// ─── Form State ──────────────────────────────────────────
	const [presetKey, setPresetKey] = useState('')
	const [name, setName] = useState('')
	const [type, setType] = useState<string>('openai')
	const [apiUrl, setApiUrl] = useState('')
	const [apiKey, setApiKey] = useState('')
	const [models, setModels] = useState<ModelInfo[]>([])
	const [selectedModelIds, setSelectedModelIds] = useState<string[]>([])

	// ─── UI State ────────────────────────────────────────────
	const [saving, setSaving] = useState(false)
	const [testing, setTesting] = useState(false)
	const [newModelName, setNewModelName] = useState('')
	const [newModelLabel, setNewModelLabel] = useState('')
	const [newModelCaps, setNewModelCaps] = useState<string[]>([])
	const [showAddModel, setShowAddModel] = useState(false)
	const [showPresetPicker, setShowPresetPicker] = useState(false)
	const [cloudConnected, setCloudConnected] = useState(false)
	const [editingKey, setEditingKey] = useState(false)
	const [origModelIds, setOrigModelIds] = useState<string[]>([])
	const [newApiKey, setNewApiKey] = useState('')

	// ─── Derived Flags ───────────────────────────────────────

	const isCustomMode = useMemo(() => {
		if (mode === 'edit') return !!editProvider?.is_custom
		return presetKey === 'custom'
	}, [mode, editProvider, presetKey])

	const currentPreset = useMemo(() => {
		if (isCustomMode) return null
		const key = mode === 'edit' ? editProvider?.preset_key : presetKey
		return key ? presets.find((p) => p.key === key) || null : null
	}, [isCustomMode, mode, editProvider, presetKey, presets])

	const isCloud = currentPreset?.is_cloud === true
	const isUrlEditable = currentPreset?.url_editable === true
	const isKeyRequired = currentPreset?.require_key !== false

	const hasContent = presetKey !== '' || mode === 'edit'

	const hasSavedKey = mode === 'edit' && Boolean(editProvider?.api_key)
	const isKeyEditing = editingKey || !hasSavedKey

	const modelsChanged = useMemo(() => {
		if (mode !== 'edit') return false
		const sorted = [...selectedModelIds].sort()
		const origSorted = [...origModelIds].sort()
		if (sorted.length !== origSorted.length) return true
		return sorted.some((id, i) => id !== origSorted[i])
	}, [mode, selectedModelIds, origModelIds])

	const canSaveEdit = isKeyEditing ? Boolean(newApiKey.trim()) : modelsChanged
	const canTestEdit = isKeyEditing && Boolean(newApiKey.trim())

	// ─── Effects ─────────────────────────────────────────────

	useEffect(() => {
		if (!open) return
		const api = getSettingAPI()
		if (!api) return
		api.GetCloudService().then((resp) => {
			if (resp.data) setCloudConnected(resp.data.status === 'connected')
		})
	}, [open])

	useEffect(() => {
		if (!open) return
		if (mode === 'edit' && editProvider) {
			setPresetKey(editProvider.preset_key || (editProvider.is_custom ? 'custom' : ''))
			setName(editProvider.name)
			setType(editProvider.type)
			setApiUrl(editProvider.api_url)
			setApiKey(editProvider.api_key)
			setModels(editProvider.models.map((m) => ({ ...m })))
			const enabledIds = editProvider.models.filter((m) => m.enabled).map((m) => m.id)
			setSelectedModelIds(enabledIds)
			setOrigModelIds(enabledIds)
			setEditingKey(false)
			setNewApiKey('')
		} else {
			setPresetKey('')
			setName('')
			setType('openai')
			setApiUrl('')
			setApiKey('')
			setModels([])
			setSelectedModelIds([])
			setOrigModelIds([])
			setNewModelName('')
			setNewModelLabel('')
			setNewModelCaps([])
			setShowAddModel(false)
			setShowPresetPicker(false)
			setEditingKey(false)
			setNewApiKey('')
		}
	}, [open, mode, editProvider])

	// ─── Handlers ────────────────────────────────────────────

	const handlePresetChange = (val: any) => {
		const key = String(val)
		setPresetKey(key)
		if (key === 'custom') {
			setName('')
			setType('openai')
			setApiUrl('')
			setModels([])
			setSelectedModelIds([])
			return
		}
		const preset = presets.find((p) => p.key === key)
		if (preset) {
			setName(preset.name)
			setType(preset.type)
			setApiUrl(preset.api_url)
			const presetModels = preset.default_models.map((m) => ({ ...m }))
			setModels(presetModels)
			setSelectedModelIds(presetModels.filter((m) => m.enabled).map((m) => m.id))
		}
	}

	const handleAddCustomModel = () => {
		const trimmedId = newModelName.trim()
		if (!trimmedId) {
			message.warning(is_cn ? '请输入模型 ID' : 'Please enter a model ID')
			return
		}
		if (models.some((m) => m.id === trimmedId)) {
			message.warning(is_cn ? '该模型已存在' : 'Model already exists')
			return
		}
		const label = newModelLabel.trim() || trimmedId
		const newModel: ModelInfo = { id: trimmedId, name: label, capabilities: newModelCaps as ModelCapability[], enabled: true }
		setModels((prev) => [...prev, newModel])
		setNewModelName('')
		setNewModelLabel('')
		setNewModelCaps([])
		setShowAddModel(false)
	}

	const handleRemoveModel = (id: string) => {
		setModels((prev) => prev.filter((m) => m.id !== id))
		setSelectedModelIds((prev) => prev.filter((mid) => mid !== id))
	}

	const handleTest = async () => {
		if (!isCloud && !apiUrl.trim()) {
			message.warning(is_cn ? '请输入 API URL' : 'Please enter API URL')
			return
		}
		const api = getSettingAPI()
		if (!api) return

		const keyToTest = mode === 'edit' ? newApiKey : apiKey
		setTesting(true)
		try {
			const testData: { api_url: string; api_key?: string; type?: string } = { api_url: apiUrl }
			if (keyToTest) testData.api_key = keyToTest
			if (type) testData.type = type
			const resp = await api.TestLLMConnection(testData)
			if (resp.data?.success) {
				message.success(is_cn ? `连接成功（${resp.data.latency_ms}ms）` : `Connected (${resp.data.latency_ms}ms)`)
			} else {
				message.error(resp.data?.message || (is_cn ? '连接失败' : 'Connection failed'))
			}
		} finally {
			setTesting(false)
		}
	}

	const handleEditKey = () => {
		setNewApiKey('')
		setEditingKey(true)
	}

	const handleCancelEditKey = () => {
		setNewApiKey('')
		setEditingKey(false)
	}

	const handleSave = async () => {
		if (!name.trim()) {
			message.warning(is_cn ? '请输入名称' : 'Please enter a name')
			return
		}

		if (!isCloud && !isCustomMode && !isUrlEditable && !apiKey.trim() && isKeyRequired) {
			message.warning(is_cn ? '请输入 API Key' : 'Please enter API Key')
			return
		}

		const finalModels = isCustomMode
			? models.map((m) => ({ ...m, enabled: true }))
			: models.map((m) => ({ ...m, enabled: selectedModelIds.includes(m.id) }))

		if (finalModels.filter((m) => m.enabled).length === 0) {
			message.warning(is_cn ? '请至少选择一个模型' : 'Please select at least one model')
			return
		}

		const api = getSettingAPI()
		if (!api) return

		setSaving(true)
		try {
			if (mode === 'edit' && editProvider) {
				if (isKeyEditing && newApiKey && apiUrl) {
					const testResp = await api.TestLLMConnection({ api_url: apiUrl, api_key: newApiKey, type: type || undefined })
					if (!testResp.data?.success) {
						message.error(testResp.data?.message || (is_cn ? 'API Key 验证失败' : 'API Key validation failed'))
						return
					}
				}

				const updateData: Record<string, any> = { models: finalModels }
				if (isCustomMode) {
					updateData.api_url = apiUrl
					updateData.name = name
				}
				if (isKeyEditing && newApiKey) updateData.api_key = newApiKey
				const resp = await api.UpdateProvider(editProvider.key, updateData)
				if (resp.error) {
					message.error(resp.error?.error_description || (is_cn ? '保存失败' : 'Save failed'))
					return
				}
			} else {
				if (!isCloud && apiUrl && apiKey && isKeyRequired) {
					const testResp = await api.TestLLMConnection({ api_url: apiUrl, api_key: apiKey, type: type || undefined })
					if (!testResp.data?.success) {
						message.error(testResp.data?.message || (is_cn ? '连接验证失败，请检查 API URL 和 Key' : 'Connection failed, please check API URL and Key'))
						return
					}
				}

				const createData: Record<string, any> = {}
				if (presetKey && presetKey !== 'custom') {
					createData.preset_key = presetKey
					if (apiKey) createData.api_key = apiKey
					if (apiUrl) createData.api_url = apiUrl
					if (name) createData.name = name
					createData.model_ids = selectedModelIds
				} else {
					createData.key = name.toLowerCase().replace(/\s+/g, '-')
					createData.name = name
					createData.type = type
					createData.api_url = apiUrl
					if (apiKey) createData.api_key = apiKey
					createData.models = finalModels
					createData.require_key = !!apiKey
				}
				const resp = await api.CreateProvider(createData)
				if (resp.error) {
					message.error(resp.error?.error_description || (is_cn ? '添加失败' : 'Add failed'))
					return
				}
			}
			message.success(is_cn ? (mode === 'edit' ? '已保存' : '已添加') : (mode === 'edit' ? 'Saved' : 'Added'))
			onDone()
		} finally {
			setSaving(false)
		}
	}

	// ─── Schemas ─────────────────────────────────────────────

	const presetSchema = useMemo((): PropertySchema => ({
		type: 'string',
		placeholder: is_cn ? '选择供应商...' : 'Select a provider...',
		searchable: true,
		enum: [
			...presets.map((p) => ({ label: p.name, value: p.key })),
			{ label: is_cn ? '自定义' : 'Custom', value: 'custom' }
		]
	}), [presets, is_cn])

	const typeSchema = useMemo((): PropertySchema => ({
		type: 'string',
		enum: [
			{ label: 'OpenAI Compatible', value: 'openai' },
			{ label: 'Anthropic Compatible', value: 'anthropic' }
		]
	}), [])

	const urlSchema = useMemo((): PropertySchema => ({ type: 'string', placeholder: 'https://api.example.com/v1' }), [])
	const keySchema = useMemo((): PropertySchema => ({ type: 'string', placeholder: is_cn ? '输入 API Key' : 'Enter API Key' }), [is_cn])
	const nameSchema = useMemo((): PropertySchema => ({ type: 'string', placeholder: is_cn ? '供应商名称' : 'Provider name' }), [is_cn])

	const capsSchema = useMemo((): PropertySchema => ({
		type: 'array',
		enum: ALL_CAPS.map((c): EnumOption => ({ label: is_cn ? c.cn : c.en, value: c.key }))
	}), [is_cn])

	const newModelNameSchema = useMemo((): PropertySchema => ({
		type: 'string', placeholder: is_cn ? '模型 ID（如 gpt-4o）' : 'Model ID (e.g. gpt-4o)'
	}), [is_cn])

	const newModelLabelSchema = useMemo((): PropertySchema => ({
		type: 'string', placeholder: is_cn ? '展示名称（如 GPT-4o）' : 'Display name (e.g. GPT-4o)'
	}), [is_cn])

	// ─── Render: Preset Model List (shared by all preset modes) ───

	const renderPresetModelList = () => (
		<div className={styles.formField}>
			<label className={styles.fieldLabel}>{is_cn ? '模型' : 'Models'}</label>
			<div className={styles.presetModelList}>
				{selectedModelIds.map((id) => {
					const m = models.find((x) => x.id === id)
					if (!m) return null
					return (
						<div key={m.id} className={styles.presetModelRow}>
							<div className={styles.presetModelInfo}>
								<span className={styles.presetModelName}>{m.name}</span>
								<span className={styles.presetModelCaps}>{capDesc(m.capabilities, is_cn)}</span>
							</div>
							<button className={styles.presetModelRemove} onClick={() => setSelectedModelIds((prev) => prev.filter((x) => x !== id))}>
								<Icon name='material-close' size={14} />
							</button>
						</div>
					)
				})}
				{(() => {
					const remaining = models.filter((m) => !selectedModelIds.includes(m.id))
					if (remaining.length === 0) {
						return <span className={styles.allModelsHint}>{is_cn ? '已添加全部可用模型' : 'All available models added'}</span>
					}
					return (
						<div className={styles.presetPickerWrap}>
							<button className={styles.addModelTrigger} onClick={() => setShowPresetPicker(!showPresetPicker)}>
								<Icon name='material-add' size={14} />
								{is_cn ? '添加模型' : 'Add Model'}
							</button>
							{showPresetPicker && (
								<div className={styles.presetPickerDropdown}>
									{remaining.map((m) => (
										<div
											key={m.id}
											className={styles.presetPickerItem}
											onClick={() => {
												setSelectedModelIds((prev) => [...prev, m.id])
												setShowPresetPicker(false)
											}}
										>
											<span className={styles.presetPickerName}>{m.name}</span>
											<span className={styles.presetPickerCaps}>{capDesc(m.capabilities, is_cn)}</span>
										</div>
									))}
								</div>
							)}
						</div>
					)
				})()}
			</div>
		</div>
	)

	// ─── Render: Preset Connection Fields ─────────────────────
	// Decision tree:
	//   is_cloud     → cloud status block (no URL / Key)
	//   url_editable → editable URL + Key (optional if !require_key)
	//   else         → readonly URL + Key (required)

	const renderPresetFields = () => {
		if (isCloud) {
			return (
				<div className={styles.cloudStatusBlock}>
					{cloudConnected ? (
						<div className={styles.cloudStatusConnected}>
							<Icon name='material-check_circle' size={16} />
							<span>{is_cn ? '云服务已连接' : 'Cloud service connected'}</span>
							<a onClick={() => { onClose(); navigate('/settings/cloud') }}>
								{is_cn ? '修改配置' : 'Edit settings'}
							</a>
						</div>
					) : (
						<div className={styles.cloudStatusDisconnected}>
							<Icon name='material-warning' size={16} />
							<span>{is_cn ? '云服务未配置' : 'Cloud service not configured'}</span>
							<a onClick={() => { onClose(); navigate('/settings/cloud') }}>
								{is_cn ? '前往配置' : 'Configure now'}
							</a>
						</div>
					)}
				</div>
			)
		}

		return (
			<>
				<div className={styles.formField}>
					<label className={styles.fieldLabel}>API URL</label>
					{isUrlEditable ? (
						<Input schema={urlSchema} value={apiUrl} onChange={(v) => setApiUrl(String(v))} />
					) : (
						<div className={styles.readonlyField}>{apiUrl || '-'}</div>
					)}
				</div>
				<div className={styles.formField}>
					<label className={styles.fieldLabel}>
						API Key
						{!isKeyRequired && <span className={styles.optionalHint}> ({is_cn ? '可选' : 'optional'})</span>}
					</label>
					{mode === 'edit' && hasSavedKey && !isKeyEditing ? (
						<div className={styles.keyDisplay}>
							<span className={styles.keyText}>{apiKey}</span>
							<button type='button' className={styles.keyEditBtn} onClick={handleEditKey}>
								{is_cn ? '修改' : 'Change'}
							</button>
						</div>
					) : mode === 'edit' ? (
						<>
							<InputPassword schema={keySchema} value={newApiKey} onChange={(v) => setNewApiKey(String(v))} />
							{hasSavedKey && editingKey && (
								<button type='button' className={styles.keyCancelBtn} onClick={handleCancelEditKey}>
									{is_cn ? '取消修改' : 'Cancel'}
								</button>
							)}
						</>
					) : (
						<InputPassword schema={keySchema} value={apiKey} onChange={(v) => setApiKey(String(v))} />
					)}
				</div>
			</>
		)
	}

	// ─── Render ──────────────────────────────────────────────

	return (
		<Modal
			open={open}
			onCancel={onClose}
			footer={null}
			width={560}
			destroyOnClose
			closable={false}
			className={styles.providerModal}
			style={{ top: '10vh', paddingBottom: 0 }}
			bodyStyle={{ padding: 0 }}
			title={
				<div className={styles.modalHeader}>
					<span className={styles.modalTitle}>
						{mode === 'edit'
						? (is_cn ? `编辑模型服务 - ${name}` : `Edit - ${name}`)
						: (is_cn ? '添加模型服务' : 'Add Model Provider')}
					</span>
					<button className={styles.modalClose} onClick={onClose}><Icon name='material-close' size={18} /></button>
				</div>
			}
		>
			<div className={styles.modalBody}>
				<div className={styles.modalContent}>
					{/* Provider selector (add mode only) */}
					{mode === 'add' && (
						<div className={styles.formField}>
							<label className={styles.fieldLabel}>{is_cn ? '供应商' : 'Provider'}</label>
							<Select schema={presetSchema} value={presetKey} onChange={(v) => handlePresetChange(v)} />
						</div>
					)}

					{hasContent && (
						<>
							{/* ─── Preset Mode ─── */}
							{!isCustomMode && (
								<>
									{renderPresetFields()}
									{renderPresetModelList()}
								</>
							)}

							{/* ─── Custom Mode ─── */}
							{isCustomMode && (
								<>
									<div className={styles.formField}>
										<label className={styles.fieldLabel}>{is_cn ? '名称' : 'Name'}</label>
										<Input schema={nameSchema} value={name} onChange={(v) => setName(String(v))} />
									</div>
									<div className={styles.formField}>
										<label className={styles.fieldLabel}>{is_cn ? '类型' : 'Type'}</label>
										<Select schema={typeSchema} value={type} onChange={(v) => setType(String(v))} />
									</div>
								<div className={styles.formField}>
									<label className={styles.fieldLabel}>API URL</label>
									<Input schema={urlSchema} value={apiUrl} onChange={(v) => setApiUrl(String(v))} />
									<div className={styles.fieldHint}>
										{is_cn
											? <>无尾部 <code>/</code> 自动补全 <code>/v1/</code>；有尾部 <code>/</code> 按填写路径使用</>
											: <>No trailing <code>/</code>: appends <code>/v1/</code>; with trailing <code>/</code>: used as-is</>}
									</div>
								</div>
									<div className={styles.formField}>
										<label className={styles.fieldLabel}>API Key</label>
										<InputPassword schema={keySchema} value={apiKey} onChange={(v) => setApiKey(String(v))} />
									</div>
									<div className={styles.formField}>
										<label className={styles.fieldLabel}>{is_cn ? '模型' : 'Models'}</label>
										<div className={styles.customModelList}>
										{models.map((m) => (
											<div key={m.id} className={styles.customModelItem}>
												<div className={styles.customModelInfo}>
													<span className={styles.customModelName}>
														{m.name}{m.name !== m.id && <span className={styles.customModelId}>{m.id}</span>}
													</span>
													<span className={styles.customModelCaps}>
														{capDesc(m.capabilities, is_cn) || (is_cn ? '无特殊能力' : 'No special capabilities')}
													</span>
												</div>
												<button className={styles.customModelRemove} onClick={() => handleRemoveModel(m.id)}>
													<Icon name='material-close' size={14} />
												</button>
											</div>
										))}
											{showAddModel ? (
											<div className={styles.addModelForm}>
												<div className={styles.addModelRow}>
													<Input schema={newModelNameSchema} value={newModelName} onChange={(v) => setNewModelName(String(v))} />
												</div>
												<div className={styles.addModelRow}>
													<Input schema={newModelLabelSchema} value={newModelLabel} onChange={(v) => setNewModelLabel(String(v))} />
												</div>
												<div className={styles.addModelRow}>
													<label className={styles.capsLabel}>{is_cn ? '能力' : 'Capabilities'}</label>
													<CheckboxGroup schema={capsSchema} value={newModelCaps} onChange={(v) => setNewModelCaps(Array.isArray(v) ? v.map(String) : [])} />
												</div>
												<div className={styles.addModelBtns}>
													<Button size='small' type='primary' onClick={handleAddCustomModel}>{is_cn ? '确认' : 'Confirm'}</Button>
													<Button size='small' type='default' onClick={() => { setShowAddModel(false); setNewModelName(''); setNewModelLabel(''); setNewModelCaps([]) }}>{is_cn ? '取消' : 'Cancel'}</Button>
												</div>
											</div>
											) : (
												<button className={styles.addModelTrigger} onClick={() => setShowAddModel(true)}>
													<Icon name='material-add' size={14} />
													{is_cn ? '添加模型' : 'Add Model'}
												</button>
											)}
										</div>
									</div>
								</>
							)}
						</>
					)}
				</div>

				{/* Actions — pinned to bottom, outside scrollable area */}
			{hasContent && (
				<div className={styles.modalActions}>
					{!isCloud && (
						<Button
							type='default'
							loading={testing}
							disabled={mode === 'edit' && !canTestEdit}
							onClick={handleTest}
						>
							{is_cn ? '测试连接' : 'Test Connection'}
						</Button>
					)}
					<Button
						type='primary'
						loading={saving}
						disabled={mode === 'edit' && !canSaveEdit}
						onClick={handleSave}
					>
						{mode === 'edit' ? (is_cn ? '保存' : 'Save') : (is_cn ? '确认添加' : 'Add')}
					</Button>
				</div>
			)}
			</div>
		</Modal>
	)
}
