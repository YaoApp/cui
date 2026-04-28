import { useState, useEffect, useMemo, useRef } from 'react'
import { getLocale, useNavigate } from '@umijs/max'
import { message, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { RadioGroup, Input, InputPassword } from '@/components/ui/inputs'
import { Setting } from '@/openapi/setting'
import type { CloudServiceData, CloudRegion } from '../../types'
import type { PropertySchema } from '@/components/ui/inputs/types'
import styles from './index.less'

const REGISTER_URL = 'https://yaoagents.com?source=client-settings-cloud'

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

const CloudService = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const navigate = useNavigate()

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [testing, setTesting] = useState(false)
	const [data, setData] = useState<CloudServiceData | null>(null)
	const [error, setError] = useState<string | null>(null)

	const [region, setRegion] = useState('')
	const [apiUrl, setApiUrl] = useState('')
	const [apiKey, setApiKey] = useState('')
	const [editingKey, setEditingKey] = useState(false)
	const retryRef = useRef(0)

	const hasKey = Boolean(data?.api_key)
	const regionChanged = Boolean(data && region !== data.region)
	const isEditing = editingKey || !hasKey || regionChanged

	useEffect(() => {
		let cancelled = false

		const load = () => {
			const api = getSettingAPI()
			if (!api) {
				if (retryRef.current < 10) {
					retryRef.current++
					setTimeout(load, 300)
				} else {
					if (!cancelled) {
						setError(is_cn ? 'API 客户端初始化失败' : 'API client initialization failed')
						setLoading(false)
					}
				}
				return
			}

			api.GetCloudService()
				.then((resp) => {
					if (cancelled) return
					if (resp.error || !resp.data) {
						setError(resp.error?.error_description || 'Failed to load cloud service config')
						setLoading(false)
						return
					}
					const res = resp.data
					setData(res)
					setRegion(res.region)
					setApiUrl(res.api_url)
					setApiKey('')
					setLoading(false)
				})
				.catch((err) => {
					if (!cancelled) {
						setError(err?.message || 'Failed to load cloud service config')
						setLoading(false)
					}
				})
		}

		load()
		return () => { cancelled = true }
	}, [])

	const handleRegionChange = (val: any) => {
		const key = String(val)
		setRegion(key)
		const found = data?.regions.find((r) => r.key === key)
		if (found) {
			setApiUrl(found.api_url)
		}
	}

	const handleSave = async () => {
		if (isEditing && !apiKey.trim()) {
			message.warning(is_cn ? '请输入 API Key' : 'Please enter API Key')
			return
		}
		const api = getSettingAPI()
		if (!api) return

		setSaving(true)
		try {
			const payload: Record<string, string> = { region, api_url: apiUrl }
			if (isEditing) payload.api_key = apiKey

			const resp = await api.SaveCloudService(payload)
			if (resp.error || !resp.data) {
				message.error(resp.error?.error_description || (is_cn ? '保存失败' : 'Save failed'))
				return
			}
			setData(resp.data)
			setApiKey('')
			setEditingKey(false)
			message.success(is_cn ? '保存成功' : 'Saved successfully')
		} catch (err: any) {
			message.error(err?.message || (is_cn ? '保存失败' : 'Save failed'))
		} finally {
			setSaving(false)
		}
	}

	const handleTest = async () => {
		if (!apiKey.trim()) {
			message.warning(is_cn ? '请输入 API Key' : 'Please enter API Key')
			return
		}
		const api = getSettingAPI()
		if (!api) return

		setTesting(true)
		try {
			const resp = await api.TestCloudService({ api_url: apiUrl, api_key: apiKey.trim() })
			if (resp.error || !resp.data) {
				message.error(resp.error?.error_description || (is_cn ? '连接测试失败' : 'Connection test failed'))
				return
			}

			const result = resp.data
			if (result.success) {
				message.success(
					is_cn
						? `连接成功（延迟 ${result.latency_ms}ms）`
						: `Connected successfully (${result.latency_ms}ms latency)`
				)
			} else {
				message.error(result.message)
			}
			const refreshed = await api.GetCloudService()
			if (refreshed.data) setData(refreshed.data)
		} catch (err: any) {
			message.error(err?.message || (is_cn ? '连接测试失败' : 'Connection test failed'))
		} finally {
			setTesting(false)
		}
	}

	const handleEditKey = () => {
		setApiKey('')
		setEditingKey(true)
	}

	const handleCancelEdit = () => {
		setApiKey('')
		setEditingKey(false)
	}

	const regionSchema = useMemo((): PropertySchema => {
		if (!data?.regions) return { type: 'string', enum: [] }
		return {
			type: 'string',
			enum: data.regions.map((r: CloudRegion) => ({
				label: r.label?.[is_cn ? 'zh-CN' : 'en-US'] || r.key,
				value: r.key
			}))
		}
	}, [data, is_cn])

	const urlSchema = useMemo((): PropertySchema => ({
		type: 'string',
		readOnly: true,
		placeholder: 'https://api-us.yao.run'
	}), [])

	const keySchema = useMemo((): PropertySchema => ({
		type: 'string',
		placeholder: is_cn ? '输入您的 API Key' : 'Enter your API Key'
	}), [is_cn])

	const statusLabel = (status: CloudServiceData['status']) => {
		const map = {
			connected: { text: is_cn ? '已连接' : 'Connected', cls: styles.status_connected },
			disconnected: { text: is_cn ? '连接失败' : 'Disconnected', cls: styles.status_disconnected },
			unconfigured: { text: is_cn ? '未配置' : 'Not configured', cls: styles.status_unconfigured }
		}
		return map[status]
	}

	if (error) {
		return (
			<div className={styles.cloudService}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '云服务' : 'Cloud Service'}</h2>
						<p>{error}</p>
					</div>
				</div>
			</div>
		)
	}

	if (loading || !data) {
		return (
			<div className={styles.cloudService}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '云服务' : 'Cloud Service'}</h2>
						<p>{is_cn ? '配置云端 API 凭证，用于模型和搜索' : 'Configure cloud API credentials for models and search'}</p>
					</div>
				</div>
				<div className={styles.loadingState}>
					<Spin size='small' />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	const status = statusLabel(data.status)

	return (
		<div className={styles.cloudService}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '云服务' : 'Cloud Service'}</h2>
					<p>{is_cn ? '配置云端 API 凭证，用于模型和搜索' : 'Configure cloud API credentials for models and search'}</p>
				</div>
				<span className={`${styles.statusBadge} ${status.cls}`}>{status.text}</span>
			</div>

			{/* Intro Card */}
			<div className={styles.introCard}>
				<div className={styles.introIcon}>
					<Icon name='material-cloud' size={20} />
				</div>
				<div className={styles.introContent}>
					<div className={styles.introText}>
						{is_cn
							? '云服务由 YaoAgents 平台提供。一个 Key 即可使用多家 LLM 模型和联网搜索能力。'
							: 'Cloud service is provided by YaoAgents platform. A single key unlocks multiple LLM models and web search capabilities.'}
					</div>
					<a href={REGISTER_URL} target='_blank' rel='noopener noreferrer' className={styles.introLink}>
						{is_cn ? '没有 Key？前往 yaoagents.com 注册 →' : "Don't have a key? Register at yaoagents.com →"}
					</a>
				</div>
			</div>

			{/* Credentials Section */}
			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? '凭证配置' : 'Credentials'}</div>
				</div>

				<div className={styles.card}>
					<div className={styles.formField}>
						<label className={styles.fieldLabel}>
							{is_cn ? '区域' : 'Region'}
							<span className={styles.fieldHint}>
								{is_cn ? '选择离你最近的区域以获得最快速度' : 'Choose the region closest to you for best performance'}
							</span>
						</label>
						<RadioGroup schema={regionSchema} value={region} onChange={handleRegionChange} />
					</div>

					<div className={styles.formField}>
						<label className={styles.fieldLabel}>API URL</label>
						<Input schema={urlSchema} value={apiUrl} onChange={() => {}} />
					</div>

				<div className={styles.formField}>
					<label className={styles.fieldLabel}>API Key</label>
					{!isEditing ? (
						<div className={styles.keyDisplay}>
							<span className={styles.keyText}>
								{data.api_key}
							</span>
							<button
								type='button'
								className={styles.keyEditBtn}
								onClick={handleEditKey}
							>
								{is_cn ? '修改' : 'Change'}
							</button>
						</div>
					) : (
						<>
							<InputPassword
								schema={keySchema}
								value={apiKey}
								onChange={(val) => setApiKey(String(val))}
							/>
							{hasKey && editingKey && (
								<button
									type='button'
									className={styles.keyCancelBtn}
									onClick={handleCancelEdit}
								>
									{is_cn ? '取消修改' : 'Cancel'}
								</button>
							)}
						</>
					)}
				</div>

				{isEditing && (
				<div className={styles.actions}>
					{hasKey && (
						<Button type='default' loading={testing} onClick={handleTest}>
							{is_cn ? '测试连接' : 'Test Connection'}
						</Button>
					)}
					<Button type='primary' loading={saving} onClick={handleSave}>
						{is_cn ? '保存' : 'Save'}
					</Button>
				</div>
			)}
				</div>
			</div>

			{/* Next Steps */}
			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? '相关配置' : 'Related Settings'}</div>
				</div>

				<div className={styles.card}>
					<div
						className={styles.nextStepItem}
						onClick={() => navigate('/settings/models')}
					>
						<div className={styles.nextStepIcon}>
							<Icon name='material-model_training' size={18} />
						</div>
						<div className={styles.nextStepContent}>
							<div className={styles.nextStepTitle}>
								{is_cn ? '前往模型配置' : 'Go to Model Configuration'}
							</div>
							<div className={styles.nextStepDesc}>
								{is_cn ? '选择默认模型' : 'Choose your default model'}
							</div>
						</div>
						<Icon name='material-chevron_right' size={18} className={styles.nextStepArrow} />
					</div>

					<div
						className={styles.nextStepItem}
						onClick={() => navigate('/settings/search')}
					>
						<div className={styles.nextStepIcon}>
							<Icon name='material-travel_explore' size={18} />
						</div>
						<div className={styles.nextStepContent}>
							<div className={styles.nextStepTitle}>
								{is_cn ? '前往搜索与抓取' : 'Go to Search & Scrape'}
							</div>
							<div className={styles.nextStepDesc}>
								{is_cn ? '选择默认搜索工具' : 'Choose your default search tool'}
							</div>
						</div>
						<Icon name='material-chevron_right' size={18} className={styles.nextStepArrow} />
					</div>
				</div>
			</div>
		</div>
	)
}

export default CloudService
