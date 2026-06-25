import { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { Modal, message } from 'antd'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import { Input, InputPassword, TextArea, Switch } from '@/components/ui/inputs'
import type { TaskConfig, SetConfigRequest } from '@/openapi/agent/tasks'
import type { KanbanTask } from '../../kanban/types'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'

interface SecretItem {
	key: string
	has_value: boolean
	source: string
}

interface Props {
	task: KanbanTask
	taskId: string
	config: TaskConfig | null
	onConfigSave: (req: SetConfigRequest) => Promise<void>
}

const SecretsSection = ({ task, taskId, config, onConfigSave }: Props) => {
	const is_cn = getLocale() === 'zh-CN'

	const [secrets, setSecrets] = useState<SecretItem[]>([])
	const [editKey, setEditKey] = useState<string | null>(null)
	const [editValue, setEditValue] = useState('')
	const [saving, setSaving] = useState(false)

	const [addOpen, setAddOpen] = useState(false)
	const [newKey, setNewKey] = useState('')
	const [newValue, setNewValue] = useState('')
	const [newMultiline, setNewMultiline] = useState(false)

	useEffect(() => {
		if (!config?.setting?.secrets) {
			setSecrets([])
			return
		}
		const source = config._resolved_from?.secrets || 'task'
		const items: SecretItem[] = Object.keys(config.setting.secrets).map((key) => ({
			key,
			has_value: true,
			source
		}))
		setSecrets(items)
	}, [config])

	const sourceTag = (source: string) => {
		const labels: Record<string, string> = {
			task: is_cn ? '任务' : 'Task',
			agent: is_cn ? 'AI 专家' : 'AI Expert',
			'system/team/user': is_cn ? '默认' : 'Default'
		}
		const colors: Record<string, string> = {
			task: '#1890ff',
			agent: '#722ed1',
			'system/team/user': '#8c8c8c'
		}
		return (
			<span style={{
				fontSize: 10,
				padding: '1px 5px',
				borderRadius: 3,
				background: `${colors[source] || '#8c8c8c'}15`,
				color: colors[source] || '#8c8c8c',
				fontWeight: 500,
				marginLeft: 6
			}}>
				{labels[source] || source}
			</span>
		)
	}

	const handleSave = async () => {
		if (!editKey || !editValue.trim()) return
		setSaving(true)
		try {
			await onConfigSave({ secrets: { [editKey]: editValue } })
			setEditKey(null)
			setEditValue('')
			message.success(is_cn ? '保存成功' : 'Saved')
		} catch {
			message.error(is_cn ? '保存失败' : 'Save failed')
		} finally {
			setSaving(false)
		}
	}

	const handleClear = async () => {
		if (!editKey) return
		setSaving(true)
		try {
			await onConfigSave({ secrets: { [editKey]: null } })
			setEditKey(null)
			setEditValue('')
			message.success(is_cn ? '已清除' : 'Cleared')
		} catch {
			message.error(is_cn ? '清除失败' : 'Clear failed')
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = (key: string) => {
		Modal.confirm({
			title: is_cn ? '确认删除' : 'Confirm Delete',
			content: is_cn ? `确定删除密钥 "${key}"？` : `Delete secret "${key}"?`,
			onOk: async () => {
				try {
					await onConfigSave({ secrets: { [key]: null } })
					message.success(is_cn ? '已删除' : 'Deleted')
				} catch {
					message.error(is_cn ? '删除失败' : 'Delete failed')
				}
			}
		})
	}

	const handleAdd = async () => {
		if (!newKey.trim() || !newValue.trim()) return
		setSaving(true)
		try {
			await onConfigSave({ secrets: { [newKey.trim()]: newValue } })
			resetAdd()
			message.success(is_cn ? '添加成功' : 'Added')
		} catch {
			message.error(is_cn ? '添加失败' : 'Add failed')
		} finally {
			setSaving(false)
		}
	}

	const resetAdd = () => {
		setAddOpen(false)
		setNewKey('')
		setNewValue('')
		setNewMultiline(false)
	}

	return (
		<div className={viewStyles.sectionContent}>
			<div className={viewStyles.card}>
				<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
					<div>
						<div className={viewStyles.cardTitle}>{is_cn ? '密钥管理' : 'Secrets'}</div>
						<div className={viewStyles.cardDesc}>
							{is_cn
								? '任务级别覆盖。优先级：任务 > AI 专家 > 默认。AES 加密存储，不会发送给 LLM。'
								: 'Task-level override. Priority: Task > AI Expert > Default. AES encrypted, never sent to LLM.'}
						</div>
					</div>
					<div style={{ flexShrink: 0 }}>
						<Button size='small' type='primary' onClick={() => setAddOpen(true)}>
							{is_cn ? '+ 添加' : '+ Add'}
						</Button>
					</div>
				</div>

				{secrets.length > 0 ? (
					<table className={viewStyles.secretsTable}>
						<colgroup>
							<col style={{ width: 36 }} />
							<col style={{ width: '30%' }} />
							<col style={{ width: '25%' }} />
							<col style={{ width: '15%' }} />
							<col style={{ width: '30%' }} />
						</colgroup>
						<thead>
							<tr>
								<th style={{ textAlign: 'center', paddingLeft: 10 }}></th>
								<th>Key</th>
								<th>{is_cn ? '值' : 'Value'}</th>
								<th>{is_cn ? '来源' : 'Source'}</th>
								<th style={{ textAlign: 'right' }}>{is_cn ? '操作' : 'Actions'}</th>
							</tr>
						</thead>
						<tbody>
							{secrets.map((entry) => (
								<tr key={entry.key}>
									<td style={{ textAlign: 'center', padding: '10px 4px 10px 10px' }}>
										<Icon
											name={entry.has_value ? 'material-check_circle' : 'material-radio_button_unchecked'}
											size={14}
											style={{ color: entry.has_value ? 'var(--color_success, #52c41a)' : 'var(--color_text_grey)' }}
										/>
									</td>
									<td>
										<code className={viewStyles.secretKey}>{entry.key}</code>
									</td>
									<td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color_text_grey)' }}>
										{entry.has_value ? '***···***' : (
											<em>{is_cn ? '未设置' : 'not set'}</em>
										)}
									</td>
									<td>{sourceTag(entry.source)}</td>
									<td>
										<div className={viewStyles.secretsTableActions}>
											<Button
												size='small'
												type='default'
												onClick={() => { setEditKey(entry.key); setEditValue('') }}
											>
												{entry.has_value ? (is_cn ? '修改' : 'Edit') : (is_cn ? '设置' : 'Set')}
											</Button>
											<Button
												size='small'
												type='default'
												onClick={() => handleDelete(entry.key)}
											>
												<Icon name='material-delete' size={14} />
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<div className={viewStyles.emptyState}>
						<Icon name='material-key' size={32} />
						<span style={{ marginTop: 12 }}>
							{is_cn ? '暂无密钥配置' : 'No secrets configured'}
						</span>
					</div>
				)}

				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 16 }}>
					<div className={viewStyles.noticeCard} style={{ marginTop: 0 }}>
						<Icon name='material-lock' size={13} className={viewStyles.noticeIcon} />
						<span>{is_cn ? 'AES 加密存储，不会发送给 LLM' : 'AES encrypted, never sent to LLM'}</span>
					</div>
				</div>
			</div>

			{/* Edit Modal */}
			<Modal
				title={is_cn ? `修改 ${editKey}` : `Edit ${editKey}`}
				open={editKey !== null}
				onCancel={() => { setEditKey(null); setEditValue('') }}
				footer={null}
				destroyOnClose
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 12 }}>
					<div className={viewStyles.formField}>
						<label className={viewStyles.formLabel}>
							{is_cn ? '新值' : 'New Value'}
						</label>
						<InputPassword
							schema={{ type: 'string', placeholder: is_cn ? '输入新值' : 'Enter new value' }}
							value={editValue}
							onChange={(v) => setEditValue(v as string)}
						/>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
						<div>
							<Button type='default' size='small' loading={saving} onClick={handleClear}>
								{is_cn ? '清除' : 'Clear'}
							</Button>
						</div>
						<div style={{ display: 'flex', gap: 8 }}>
							<Button onClick={() => { setEditKey(null); setEditValue('') }}>
								{is_cn ? '取消' : 'Cancel'}
							</Button>
							<Button type='primary' loading={saving} disabled={!editValue.trim()} onClick={handleSave}>
								{is_cn ? '保存' : 'Save'}
							</Button>
						</div>
					</div>
				</div>
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
					<div className={viewStyles.formField}>
						<label className={viewStyles.formLabel}>
							Key
							<span className={viewStyles.formHint}>
								{is_cn ? '只允许大写字母、数字和下划线' : 'Uppercase letters, digits, underscores only'}
							</span>
						</label>
						<Input
							schema={{ type: 'string', placeholder: is_cn ? '如 API_KEY, DATABASE_URL' : 'e.g. API_KEY, DATABASE_URL' }}
							value={newKey}
							onChange={(v) => setNewKey((v as string).toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
						/>
					</div>
					<div className={viewStyles.formField}>
						<label className={viewStyles.formLabel}>{is_cn ? '密钥值' : 'Secret Value'}</label>
						{newMultiline ? (
							<TextArea
								schema={{ type: 'string', placeholder: is_cn ? '粘贴密钥内容' : 'Paste secret content', rows: 6 }}
								value={newValue}
								onChange={(v) => setNewValue(v as string)}
							/>
						) : (
							<InputPassword
								schema={{ type: 'string', placeholder: is_cn ? '输入密钥值' : 'Enter secret value' }}
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
							{is_cn ? '多行（SSH Key、证书等）' : 'Multiline (SSH Key, Cert, etc.)'}
						</div>
						<div style={{ display: 'flex', gap: 8 }}>
							<Button onClick={resetAdd}>{is_cn ? '取消' : 'Cancel'}</Button>
							<Button type='primary' loading={saving} disabled={!newKey.trim() || !newValue.trim()} onClick={handleAdd}>
								{is_cn ? '保存' : 'Save'}
							</Button>
						</div>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default SecretsSection
