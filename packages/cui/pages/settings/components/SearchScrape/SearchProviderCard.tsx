import { useState } from 'react'
import { getLocale, useNavigate } from '@umijs/max'
import { message, Switch } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { Input, InputPassword } from '@/components/ui/inputs'
import { Setting } from '@/openapi/setting'
import type { PropertySchema } from '@/components/ui/inputs/types'
import type { SearchProviderPreset, SearchProviderConfig, SearchProviderField } from '../../types'
import styles from './index.less'

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

interface SearchProviderCardProps {
	preset: SearchProviderPreset
	config: SearchProviderConfig
	onToggle: (presetKey: string, enabled: boolean) => void
	onSave: (presetKey: string, fieldValues: Record<string, string>) => void
	onReload: () => void
}

export default function SearchProviderCard({ preset, config, onToggle, onSave, onReload }: SearchProviderCardProps) {
	const is_cn = getLocale() === 'zh-CN'
	const navigate = useNavigate()

	const allFieldsSaved = preset.fields.every((f) => Boolean(config.field_values[f.key]))

	const [editing, setEditing] = useState(!allFieldsSaved)

	const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
		const init: Record<string, string> = {}
		for (const f of preset.fields) {
			if (f.type === 'password') {
				init[f.key] = ''
			} else {
				init[f.key] = config.field_values[f.key] || ''
			}
		}
		return init
	})

	const [testing, setTesting] = useState(false)
	const [saving, setSaving] = useState(false)

	const handleFieldChange = (key: string, val: unknown) => {
		setFieldValues((prev) => ({ ...prev, [key]: String(val || '') }))
	}

	const handleStartEdit = () => {
		setEditing(true)
		setFieldValues(() => {
			const init: Record<string, string> = {}
			for (const f of preset.fields) {
				init[f.key] = f.type === 'password' ? '' : (config.field_values[f.key] || '')
			}
			return init
		})
	}

	const handleCancelEdit = () => {
		setEditing(false)
		setFieldValues(() => {
			const init: Record<string, string> = {}
			for (const f of preset.fields) {
				init[f.key] = f.type === 'password' ? '' : (config.field_values[f.key] || '')
			}
			return init
		})
	}

	const buildFieldSchema = (field: SearchProviderField): PropertySchema => ({
		type: 'string',
		placeholder: field.placeholder
	})

	const allFilled = preset.fields.every((f) => fieldValues[f.key]?.trim())
	const anyChanged = preset.fields.some((f) => {
		if (f.type === 'password') return Boolean(fieldValues[f.key]?.trim())
		return (fieldValues[f.key] || '') !== (config.field_values[f.key] || '')
	})

	const canTest = editing && allFilled
	const canSave = editing && anyChanged && allFilled

	const handleSave = async () => {
		const api = getSettingAPI()
		if (!api) return

		setSaving(true)
		try {
			const submitValues: Record<string, string> = {}
			for (const f of preset.fields) {
				if (fieldValues[f.key]) {
					submitValues[f.key] = fieldValues[f.key]
				}
			}

			const testResp = await api.TestSearchProvider(preset.key, { field_values: submitValues })
			if (!testResp.data?.success) {
				message.error(testResp.data?.message || testResp.error?.error_description || (is_cn ? '验证失败，请检查配置' : 'Validation failed, please check your configuration'))
				return
			}

			await onSave(preset.key, submitValues)
			setEditing(false)
			setFieldValues(() => {
				const init: Record<string, string> = {}
				for (const f of preset.fields) {
					init[f.key] = f.type === 'password' ? '' : (config.field_values[f.key] || '')
				}
				return init
			})
		} finally {
			setSaving(false)
		}
	}

	const handleTest = async () => {
		const api = getSettingAPI()
		if (!api) return
		setTesting(true)
		try {
			const testValues: Record<string, string> = {}
			for (const f of preset.fields) {
				if (fieldValues[f.key]) {
					testValues[f.key] = fieldValues[f.key]
				}
			}
			const resp = await api.TestSearchProvider(preset.key, { field_values: testValues })
			if (resp.data?.success) {
				message.success(is_cn ? `连接成功 (${resp.data.latency_ms}ms)` : `Connected (${resp.data.latency_ms}ms)`)
				onReload()
			} else {
				message.error(resp.data?.message || resp.error?.error_description || (is_cn ? '连接失败' : 'Connection failed'))
			}
		} finally {
			setTesting(false)
		}
	}

	const statusMap: Record<string, { text: string; cls: string } | null> = {
		connected: { text: is_cn ? '已连接' : 'Connected', cls: styles.statusConnected },
		disconnected: { text: is_cn ? '连接失败' : 'Disconnected', cls: styles.statusDisconnected },
		unconfigured: null
	}
	const st = statusMap[config.status] || null

	if (preset.is_cloud) {
		const isConnected = config.status === 'connected'
		return (
			<div className={styles.searchCard}>
				<div className={styles.searchCardHeader}>
					<div className={styles.searchCardTitle}>
						<span className={styles.searchCardName}>{preset.name}</span>
						{st && <span className={`${styles.searchCardStatus} ${st.cls}`}>{st.text}</span>}
						{preset.tool_labels.map((label, idx) => (
							<span key={idx} className={styles.toolTag}>
								{is_cn ? label['zh-CN'] : label['en-US']}
							</span>
						))}
					</div>
				</div>
				<div className={styles.searchCardBody}>
					{isConnected ? (
						<div className={styles.cloudConnected}>
							<Icon name='material-check_circle' size={16} />
							<span>{is_cn ? '云服务已连接，搜索与抓取功能可用' : 'Cloud service connected, search & scrape available'}</span>
							<a onClick={() => navigate('/settings/cloud')}>
								{is_cn ? '修改配置' : 'Edit settings'}
							</a>
						</div>
					) : (
						<div className={styles.cloudDisconnected}>
							<Icon name='material-info' size={16} />
							<span>{is_cn ? '云服务未配置，配置后即可使用搜索与抓取' : 'Cloud service not configured, configure to use search & scrape'}</span>
							<a onClick={() => navigate('/settings/cloud')}>
								{is_cn ? '前往配置' : 'Configure now'}
							</a>
						</div>
					)}
				</div>
			</div>
		)
	}

	return (
		<div className={`${styles.searchCard} ${config.enabled ? styles.searchCardEnabled : ''}`}>
			<div className={styles.searchCardHeader}>
				<div className={styles.searchCardTitle}>
					<span className={styles.searchCardName}>{preset.name}</span>
					{st && <span className={`${styles.searchCardStatus} ${st.cls}`}>{st.text}</span>}
					{preset.tool_labels.map((label, idx) => (
						<span key={idx} className={styles.toolTag}>
							{is_cn ? label['zh-CN'] : label['en-US']}
						</span>
					))}
				</div>
				<Switch
					size='small'
					checked={config.enabled}
					onChange={(checked) => onToggle(preset.key, checked)}
				/>
			</div>

			{(preset.description || preset.website) && (
				<div className={styles.searchCardDesc}>
					{preset.description && (
						<span>{is_cn ? preset.description['zh-CN'] : preset.description['en-US']}</span>
					)}
					{preset.website && (
						<a
							className={styles.websiteLink}
							href={preset.website}
							target='_blank'
							rel='noopener noreferrer'
						>
							{is_cn ? '获取 API Key →' : 'Get API Key →'}
						</a>
					)}
				</div>
			)}

			{config.enabled && (
				<div className={styles.searchCardBody}>
					{!editing ? (
						<>
							{preset.fields.map((field) => (
								<div key={field.key} className={styles.searchField}>
									<label className={styles.searchFieldLabel}>
										{is_cn ? field.label['zh-CN'] : field.label['en-US']}
										{field.hint && (
											<span className={styles.searchFieldHint}>
												{is_cn ? field.hint['zh-CN'] : field.hint['en-US']}
											</span>
										)}
									</label>
									<div className={styles.keyDisplay}>
										<span className={styles.keyText}>{config.field_values[field.key]}</span>
									</div>
								</div>
							))}
							<div className={styles.searchCardActions}>
								<button type='button' className={styles.keyEditBtn} onClick={handleStartEdit}>
									{is_cn ? '修改' : 'Change'}
								</button>
							</div>
						</>
					) : (
						<>
							{preset.fields.map((field) => (
								<div key={field.key} className={styles.searchField}>
									<label className={styles.searchFieldLabel}>
										{is_cn ? field.label['zh-CN'] : field.label['en-US']}
										{field.hint && (
											<span className={styles.searchFieldHint}>
												{is_cn ? field.hint['zh-CN'] : field.hint['en-US']}
											</span>
										)}
									</label>
									{field.type === 'password' ? (
										<InputPassword
											schema={buildFieldSchema(field)}
											value={fieldValues[field.key] || ''}
											onChange={(v) => handleFieldChange(field.key, v)}
										/>
									) : (
										<Input
											schema={buildFieldSchema(field)}
											value={fieldValues[field.key] ?? ''}
											onChange={(v) => handleFieldChange(field.key, v)}
										/>
									)}
								</div>
							))}
							<div className={styles.searchCardActions}>
								<div className={styles.searchCardActionsLeft}>
									{allFieldsSaved && (
										<button type='button' className={styles.keyCancelBtn} onClick={handleCancelEdit}>
											{is_cn ? '取消' : 'Cancel'}
										</button>
									)}
								</div>
								<div className={styles.searchCardActionsRight}>
									<Button type='default' loading={testing} disabled={saving || !canTest} onClick={handleTest} size='small'>
										{is_cn ? '测试连接' : 'Test'}
									</Button>
									<Button type='primary' loading={saving} disabled={testing || !canSave} onClick={handleSave} size='small'>
										{is_cn ? '保存' : 'Save'}
									</Button>
								</div>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	)
}
