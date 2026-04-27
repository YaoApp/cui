import { useState, useEffect, useMemo } from 'react'
import { getLocale, useNavigate } from '@umijs/max'
import { message, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { RadioGroup, Input, InputPassword } from '@/components/ui/inputs'
import type { CloudServiceData, CloudRegion } from '../../types'
import type { PropertySchema } from '@/components/ui/inputs/types'
import { mockApi } from '../../mockApi'
import styles from './index.less'

const REGISTER_URL = 'https://yaoagents.com?source=client-settings-cloud'

const CloudService = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const navigate = useNavigate()

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [testing, setTesting] = useState(false)
	const [data, setData] = useState<CloudServiceData | null>(null)

	const [region, setRegion] = useState('')
	const [apiUrl, setApiUrl] = useState('')
	const [apiKey, setApiKey] = useState('')

	useEffect(() => {
		mockApi.getCloudService().then((res) => {
			setData(res)
			setRegion(res.region)
			setApiUrl(res.api_url)
			setApiKey(res.api_key)
			setLoading(false)
		})
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
		if (!apiKey.trim()) {
			message.warning(is_cn ? '请输入 API Key' : 'Please enter API Key')
			return
		}
		setSaving(true)
		try {
			const result = await mockApi.saveCloudService({ region, api_url: apiUrl, api_key: apiKey })
			setData(result)
			message.success(is_cn ? '保存成功' : 'Saved successfully')
		} finally {
			setSaving(false)
		}
	}

	const handleTest = async () => {
		if (!apiKey.trim()) {
			message.warning(is_cn ? '请先输入 API Key' : 'Please enter API Key first')
			return
		}
		setTesting(true)
		try {
			const result = await mockApi.testCloudService()
			if (result.success) {
				message.success(
					is_cn
						? `连接成功（延迟 ${result.latency_ms}ms）`
						: `Connected successfully (${result.latency_ms}ms latency)`
				)
				const saved = await mockApi.saveCloudService({ region, api_url: apiUrl, api_key: apiKey })
				setData(saved)
			} else {
				message.error(result.message)
			}
		} finally {
			setTesting(false)
		}
	}

	const regionSchema = useMemo((): PropertySchema => {
		if (!data) return { type: 'string', enum: [] }
		return {
			type: 'string',
			enum: data.regions.map((r: CloudRegion) => ({
				label: r.label[is_cn ? 'zh-CN' : 'en-US'],
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
						<InputPassword
							schema={keySchema}
							value={apiKey}
							onChange={(val) => setApiKey(String(val))}
						/>
					</div>

					<div className={styles.actions}>
						<Button type='default' loading={testing} onClick={handleTest}>
							{is_cn ? '测试连接' : 'Test Connection'}
						</Button>
						<Button type='primary' loading={saving} onClick={handleSave}>
							{is_cn ? '保存' : 'Save'}
						</Button>
					</div>
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
