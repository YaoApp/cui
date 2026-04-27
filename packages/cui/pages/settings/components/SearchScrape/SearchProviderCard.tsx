import { useState, useMemo } from 'react'
import { getLocale, useNavigate } from '@umijs/max'
import { message, Switch } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { Input, InputPassword } from '@/components/ui/inputs'
import type { PropertySchema } from '@/components/ui/inputs/types'
import type { SearchProviderPreset, SearchProviderConfig, SearchProviderField, ProviderTestResult } from '../../types'
import { mockApi } from '../../mockApi'
import styles from './index.less'

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
	const [fieldValues, setFieldValues] = useState<Record<string, string>>(config.field_values)
	const [testing, setTesting] = useState(false)
	const [saving, setSaving] = useState(false)

	const handleFieldChange = (key: string, val: unknown) => {
		setFieldValues((prev) => ({ ...prev, [key]: String(val || '') }))
	}

	const buildFieldSchema = (field: SearchProviderField): PropertySchema => ({
		type: 'string',
		placeholder: field.placeholder
	})

	const handleSave = async () => {
		setSaving(true)
		try {
			await onSave(preset.key, fieldValues)
			message.success(is_cn ? '已保存' : 'Saved')
		} finally {
			setSaving(false)
		}
	}

	const handleTest = async () => {
		setTesting(true)
		try {
			const result: ProviderTestResult = await mockApi.testSearchProvider(preset.key)
			if (result.success) {
				message.success(is_cn ? `连接成功 (${result.latency_ms}ms)` : `Connected (${result.latency_ms}ms)`)
				onReload()
			} else {
				message.error(result.message)
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
									value={fieldValues[field.key] || field.default || ''}
									onChange={(v) => handleFieldChange(field.key, v)}
								/>
							)}
						</div>
					))}

					<div className={styles.searchCardActions}>
						<Button type='default' loading={testing} disabled={saving} onClick={handleTest} size='small'>
							{is_cn ? '测试连接' : 'Test'}
						</Button>
						<Button type='primary' loading={saving} disabled={testing} onClick={handleSave} size='small'>
							{is_cn ? '保存' : 'Save'}
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
