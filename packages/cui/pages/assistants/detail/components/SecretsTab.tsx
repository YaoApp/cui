import { useEffect, useState, useCallback } from 'react'
import { Alert, Modal, Spin, message } from 'antd'
import { getLocale } from '@umijs/max'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import { Input, InputPassword, TextArea, Switch } from '@/components/ui/inputs'
import { Setting } from '@/openapi/setting'
import type { SecretEntry } from '@/openapi/setting/types'
import styles from './View/index.less'

interface SecretsTabProps {
	assistantId: string
}

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

const SecretsTab = ({ assistantId }: SecretsTabProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [secrets, setSecrets] = useState<Record<string, SecretEntry>>({})
	const [loading, setLoading] = useState(true)
	const [loadError, setLoadError] = useState(false)
	const [saving, setSaving] = useState(false)

	const [editKey, setEditKey] = useState<string | null>(null)
	const [editValue, setEditValue] = useState('')

	const [addOpen, setAddOpen] = useState(false)
	const [newKey, setNewKey] = useState('')
	const [newLabel, setNewLabel] = useState('')
	const [newDesc, setNewDesc] = useState('')
	const [newMultiline, setNewMultiline] = useState(false)
	const [newValue, setNewValue] = useState('')

	const loadSecrets = useCallback(async () => {
		const api = getSettingAPI()
		if (!api) {
			setLoading(false)
			return
		}
		setLoadError(false)
		try {
			const res = await api.GetAgentSecrets(assistantId)
			if (!window.$app?.openapi?.IsError(res)) {
				setSecrets(window.$app.openapi.GetData(res) || {})
			} else {
				setLoadError(true)
			}
		} catch (err) {
			console.error('[SecretsTab] load failed:', err)
			setLoadError(true)
		} finally {
			setLoading(false)
		}
	}, [assistantId])

	useEffect(() => {
		loadSecrets()
	}, [loadSecrets])

	const handleSave = async (key: string, value: string) => {
		const api = getSettingAPI()
		if (!api) return
		setSaving(true)
		try {
			const existing = secrets[key]
			const res = await api.UpdateAgentSecrets(assistantId, {
				[key]: {
					value,
					label: existing?.label,
					description: existing?.description,
					required: existing?.required,
					multiline: existing?.multiline
				}
			})
			if (!window.$app?.openapi?.IsError(res)) {
				message.success(is_cn ? '保存成功' : 'Saved successfully')
				setEditKey(null)
				setEditValue('')
				await loadSecrets()
			} else {
				message.error(is_cn ? '保存失败' : 'Save failed')
			}
		} finally {
			setSaving(false)
		}
	}

	const handleAdd = async () => {
		if (!newKey.trim() || !newValue.trim()) return
		const api = getSettingAPI()
		if (!api) return
		setSaving(true)
		try {
			const res = await api.UpdateAgentSecrets(assistantId, {
				[newKey.trim()]: {
					value: newValue,
					label: newLabel || undefined,
					description: newDesc || undefined,
					multiline: newMultiline || undefined
				}
			})
			if (!window.$app?.openapi?.IsError(res)) {
				message.success(is_cn ? '添加成功' : 'Added successfully')
				setAddOpen(false)
				setNewKey('')
				setNewLabel('')
				setNewDesc('')
				setNewMultiline(false)
				setNewValue('')
				await loadSecrets()
			} else {
				message.error(is_cn ? '添加失败' : 'Add failed')
			}
		} finally {
			setSaving(false)
		}
	}

	const handleClear = async (key: string) => {
		const api = getSettingAPI()
		if (!api) return
		setSaving(true)
		try {
			const res = await api.DeleteAgentSecret(assistantId, key)
			if (!window.$app?.openapi?.IsError(res)) {
				message.success(is_cn ? '已清除' : 'Cleared')
				setEditKey(null)
				setEditValue('')
				await loadSecrets()
			} else {
				message.error(is_cn ? '清除失败' : 'Clear failed')
			}
		} catch {
			message.error(is_cn ? '清除失败' : 'Clear failed')
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (key: string) => {
		const api = getSettingAPI()
		if (!api) return
		try {
			const res = await api.DeleteAgentSecret(assistantId, key)
			if (!window.$app?.openapi?.IsError(res)) {
				message.success(is_cn ? '已删除' : 'Deleted')
				await loadSecrets()
			}
		} catch {
			message.error(is_cn ? '删除失败' : 'Delete failed')
		}
	}

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
					message={is_cn ? '无法加载密钥配置' : 'Failed to load secrets'}
					action={
						<Button
							size='small'
							onClick={() => {
								setLoading(true)
								loadSecrets()
							}}
						>
							{is_cn ? '重试' : 'Retry'}
						</Button>
					}
				/>
			</div>
		)
	}

	const predefined = Object.entries(secrets).filter(([, v]) => v.predefined)
	const custom = Object.entries(secrets).filter(([, v]) => !v.predefined)
	const editEntry = editKey ? secrets[editKey] : null

	const renderTable = (entries: [string, SecretEntry][], canDelete: boolean) => (
		<table className={styles.secretsTable}>
			<colgroup>
				<col style={{ width: 42 }} />
				<col style={{ width: '25%' }} />
				<col style={{ width: '25%' }} />
				<col style={{ width: '30%' }} />
				<col style={{ width: '20%' }} />
			</colgroup>
			<thead>
				<tr>
					<th style={{ textAlign: 'center', paddingLeft: 14 }}></th>
					<th>Key</th>
					<th>{is_cn ? '名称' : 'Label'}</th>
					<th>{is_cn ? '值' : 'Value'}</th>
					<th style={{ textAlign: 'right' }}>{is_cn ? '操作' : 'Actions'}</th>
				</tr>
			</thead>
			<tbody>
				{entries.map(([key, entry]) => (
					<tr key={key}>
						<td style={{ textAlign: 'center', padding: '10px 4px 10px 14px' }}>
							<Icon
								name={entry.has_value ? 'material-check_circle' : 'material-radio_button_unchecked'}
								size={14}
								style={{ color: entry.has_value ? 'var(--color_success, #52c41a)' : 'var(--color_text_grey)' }}
							/>
						</td>
						<td>
							<code className={styles.secretKey}>{key}</code>
							{entry.required && <span className={styles.requiredMark}> *</span>}
						</td>
						<td style={{ color: 'var(--color_text_grey)', fontSize: 13 }}>
							{entry.label || '\u2014'}
						</td>
						<td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color_text_grey)' }}>
							{entry.has_value ? '***\u00B7\u00B7\u00B7***' : (
								<em>{is_cn ? '未设置' : 'not set'}</em>
							)}
						</td>
						<td>
							<div className={styles.secretsTableActions}>
								<Button
									size='small'
									type='default'
									onClick={() => { setEditKey(key); setEditValue('') }}
								>
									{entry.has_value ? (is_cn ? '修改' : 'Edit') : (is_cn ? '设置' : 'Set')}
								</Button>
								{canDelete && (
									<Button
										size='small'
										type='default'
										onClick={() => {
											Modal.confirm({
												title: is_cn ? '确认删除' : 'Confirm Delete',
												content: is_cn ? `确定要删除密钥 "${key}" 吗？` : `Delete secret "${key}"?`,
												onOk: () => handleDelete(key)
											})
										}}
									>
										<Icon name='material-delete' size={14} />
									</Button>
								)}
							</div>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	)

	const resetAdd = () => {
		setAddOpen(false)
		setNewKey('')
		setNewLabel('')
		setNewDesc('')
		setNewMultiline(false)
		setNewValue('')
	}

	return (
		<div className={styles.sectionContent}>
			{(predefined.length > 0 || custom.length > 0) ? (
				<div className={styles.card}>
					<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
						<div>
							<div className={styles.cardTitle}>{is_cn ? '密钥管理' : 'Secrets'}</div>
							<div className={styles.cardDesc}>
								{is_cn
									? '管理助手使用的密钥和凭证，AES 加密存储，仅在沙箱内可读取，不会发送给 LLM。'
									: 'Manage secrets and credentials. AES encrypted, only accessible inside the sandbox, never sent to LLM.'}
							</div>
						</div>
						<div style={{ flexShrink: 0 }}>
							<Button size='small' type='primary' onClick={() => setAddOpen(true)}>
								{is_cn ? '+ 添加' : '+ Add'}
							</Button>
						</div>
					</div>
					{predefined.length > 0 && (
						<div style={{ marginBottom: custom.length > 0 ? 20 : 0 }}>
							<div className={styles.infoLabel} style={{ marginBottom: 8 }}>
								{is_cn ? 'Agent 要求的 Secrets' : 'Agent Required Secrets'}
							</div>
							{renderTable(predefined, false)}
						</div>
					)}
					{custom.length > 0 && (
						<div>
							<div className={styles.infoLabel} style={{ marginBottom: 8 }}>
								{is_cn ? '自定义 Secrets' : 'Custom Secrets'}
							</div>
							{renderTable(custom, true)}
						</div>
					)}
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
						<div className={styles.legendRow} style={{ marginTop: 0 }}>
							<span className={styles.legendItem}>
								<Icon name='material-check_circle' size={13} style={{ color: 'var(--color_success, #52c41a)' }} />
								{is_cn ? '已设置' : 'Set'}
							</span>
							<span className={styles.legendItem}>
								<Icon name='material-radio_button_unchecked' size={13} style={{ color: 'var(--color_text_grey)' }} />
								{is_cn ? '未设置' : 'Not set'}
							</span>
							<span className={styles.legendItem}>
								<span className={styles.requiredMark}>*</span>
								{is_cn ? '必填' : 'Required'}
							</span>
						</div>
						<div className={styles.noticeCard} style={{ marginTop: 0 }}>
							<Icon name='material-lock' size={13} className={styles.noticeIcon} />
							<span>
								{is_cn
									? 'AES 加密存储，不会发送给 LLM'
									: 'AES encrypted, never sent to LLM'}
							</span>
						</div>
					</div>
				</div>
			) : (
				<div className={styles.card}>
					<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
						<div>
							<div className={styles.cardTitle}>{is_cn ? '密钥管理' : 'Secrets'}</div>
							<div className={styles.cardDesc}>
								{is_cn
									? '管理助手使用的密钥和凭证，AES 加密存储，仅在沙箱内可读取，不会发送给 LLM。'
									: 'Manage secrets and credentials. AES encrypted, only accessible inside the sandbox, never sent to LLM.'}
							</div>
						</div>
						<div style={{ flexShrink: 0 }}>
							<Button size='small' type='primary' onClick={() => setAddOpen(true)}>
								{is_cn ? '+ 添加' : '+ Add'}
							</Button>
						</div>
					</div>
					<div className={styles.emptyState}>
						<Icon name='material-key' size={32} />
						<span style={{ marginTop: 12 }}>
							{is_cn ? '暂无密钥配置' : 'No secrets configured'}
						</span>
					</div>
				</div>
			)}

			{/* Edit Modal */}
			<Modal
				title={is_cn ? `修改 ${editKey}` : `Edit ${editKey}`}
				open={editKey !== null}
				onCancel={() => { setEditKey(null); setEditValue('') }}
				footer={null}
				destroyOnClose
			>
				{editEntry && (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 12 }}>
						{(editEntry.label || editEntry.description) && (
							<div className={styles.formField}>
								{editEntry.label && (
									<div className={styles.formLabel}>
										{editEntry.label}
										{editEntry.required && <span className={styles.requiredMark}>*</span>}
									</div>
								)}
								{editEntry.description && (
									<div style={{ fontSize: 12, color: 'var(--color_text_grey)' }}>
										{editEntry.description}
									</div>
								)}
							</div>
						)}
						<div className={styles.formField}>
							<label className={styles.formLabel}>
								{is_cn ? '新值' : 'New Value'}
								{editEntry.has_value && (
									<span className={styles.formHint}>
										{is_cn ? '输入将覆盖已有设置' : 'Will overwrite existing value'}
									</span>
								)}
							</label>
							{editEntry.multiline ? (
								<TextArea
									schema={{
										type: 'string',
										placeholder: is_cn ? '输入新值' : 'Enter new value',
										rows: 6
									}}
									value={editValue}
									onChange={(v) => setEditValue(v as string)}
								/>
							) : (
								<InputPassword
									schema={{
										type: 'string',
										placeholder: is_cn ? '输入新值' : 'Enter new value'
									}}
									value={editValue}
									onChange={(v) => setEditValue(v as string)}
								/>
							)}
						</div>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
							<div>
								{editEntry.has_value && (
									<Button
										type='default'
										size='small'
										loading={saving}
										onClick={() => editKey && handleClear(editKey)}
									>
										{is_cn ? '清除已设值' : 'Clear Value'}
									</Button>
								)}
							</div>
							<div style={{ display: 'flex', gap: 8 }}>
								<Button onClick={() => { setEditKey(null); setEditValue('') }}>
									{is_cn ? '取消' : 'Cancel'}
								</Button>
								<Button
									type='primary'
									loading={saving}
									disabled={!editValue.trim()}
									onClick={() => editKey && handleSave(editKey, editValue)}
								>
									{is_cn ? '保存' : 'Save'}
								</Button>
							</div>
						</div>
					</div>
				)}
			</Modal>

			{/* Add Modal */}
			<Modal
				title={is_cn ? '添加 Secret' : 'Add Secret'}
				open={addOpen}
				onCancel={resetAdd}
				footer={null}
				destroyOnClose
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 12 }}>
					<div className={styles.formField}>
						<label className={styles.formLabel}>
							Key
							<span className={styles.formHint}>
								{is_cn ? '只允许大写字母、数字和下划线' : 'Uppercase letters, digits, underscores only'}
							</span>
						</label>
						<Input
							schema={{
								type: 'string',
								placeholder: is_cn ? '如 API_KEY, DATABASE_URL' : 'e.g. API_KEY, DATABASE_URL'
							}}
							value={newKey}
							onChange={(v) =>
								setNewKey((v as string).toUpperCase().replace(/[^A-Z0-9_]/g, ''))
							}
						/>
					</div>
					<div className={styles.formField}>
						<label className={styles.formLabel}>
							{is_cn ? '显示名称' : 'Display Name'}
							<span className={styles.formOptional}>{is_cn ? '可选' : 'optional'}</span>
						</label>
						<Input
							schema={{
								type: 'string',
								placeholder: is_cn ? '如 OpenAI API 密钥' : 'e.g. OpenAI API Key'
							}}
							value={newLabel}
							onChange={(v) => setNewLabel(v as string)}
						/>
					</div>
					<div className={styles.formField}>
						<label className={styles.formLabel}>
							{is_cn ? '用途说明' : 'Description'}
							<span className={styles.formOptional}>{is_cn ? '可选' : 'optional'}</span>
						</label>
						<Input
							schema={{
								type: 'string',
								placeholder: is_cn ? '如 用于调用 GPT-4 接口' : 'e.g. Used to call GPT-4 API'
							}}
							value={newDesc}
							onChange={(v) => setNewDesc(v as string)}
						/>
					</div>
					<div className={styles.formField}>
						<label className={styles.formLabel}>
							{is_cn ? '密钥值' : 'Secret Value'}
						</label>
						{newMultiline ? (
							<TextArea
								schema={{
									type: 'string',
									placeholder: is_cn ? '粘贴密钥内容' : 'Paste secret content',
									rows: 6
								}}
								value={newValue}
								onChange={(v) => setNewValue(v as string)}
							/>
						) : (
							<InputPassword
								schema={{
									type: 'string',
									placeholder: is_cn ? '输入密钥值' : 'Enter secret value'
								}}
								value={newValue}
								onChange={(v) => setNewValue(v as string)}
							/>
						)}
					</div>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color_text_grey)' }}>
							<Switch
								schema={{ type: 'boolean' }}
								value={newMultiline}
								onChange={(v) => setNewMultiline(v as boolean)}
							/>
							{is_cn ? '多行（SSH Key、证书、PEM 等）' : 'Multiline (SSH Key, Cert, PEM, etc.)'}
						</div>
						<div style={{ display: 'flex', gap: 8 }}>
							<Button onClick={resetAdd}>{is_cn ? '取消' : 'Cancel'}</Button>
							<Button
								type='primary'
								loading={saving}
								disabled={!newKey.trim() || !newValue.trim()}
								onClick={handleAdd}
							>
								{is_cn ? '保存' : 'Save'}
							</Button>
						</div>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default SecretsTab
