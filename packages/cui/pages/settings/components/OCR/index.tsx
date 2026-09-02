import { useState, useEffect, useCallback } from 'react'
import { getLocale } from '@umijs/max'
import { message, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { Select } from '@/components/ui/inputs'
import { Setting } from '@/openapi/setting'
import { LLM } from '@/openapi/llm'
import type { LLMProvider } from '@/openapi/llm/types'
import type { PropertySchema, EnumOption } from '@/components/ui/inputs/types'
import type { OCRPageData, OCRToolAssignment } from '../../types'
import OCRProviderCard from './OCRProviderCard'
import styles from '../SearchScrape/index.less'

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

function getLLMAPI(): LLM | null {
	if (!window.$app?.openapi) return null
	return new LLM(window.$app.openapi)
}

const OCR = () => {
	const is_cn = getLocale() === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [data, setData] = useState<OCRPageData | null>(null)
	const [assignment, setAssignment] = useState<OCRToolAssignment>({})
	const [savingAssignment, setSavingAssignment] = useState(false)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [ocrConnectors, setOcrConnectors] = useState<LLMProvider[]>([])

	const loadData = useCallback(async () => {
		const api = getSettingAPI()
		if (!api) {
			setLoading(false)
			setLoadError('API not ready')
			return
		}
		try {
			const [resp, connectors] = await Promise.all([
				api.GetOCRConfig(),
				getLLMAPI()?.ListProviders({ capabilities: ['ocr'] }).catch(() => []) ?? Promise.resolve([])
			])
			if (resp.data) {
				setData(resp.data)
				setAssignment(resp.data.tool_assignment)
				setLoadError(null)
			} else {
				setLoadError(resp.error?.error_description || 'Failed to load OCR configuration')
			}
			setOcrConnectors(connectors)
		} catch {
			setLoadError('Failed to load OCR configuration')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadData()
	}, [loadData])

	const handleSaveAssignment = async () => {
		const api = getSettingAPI()
		if (!api) return
		setSavingAssignment(true)
		try {
			const resp = await api.SaveOCRToolAssignment(assignment)
			if (resp.error) {
				message.error(resp.error?.error_description || (is_cn ? '保存失败' : 'Save failed'))
			} else {
				message.success(is_cn ? '默认工具已保存' : 'Default tools saved')
				window.$app?.Event?.emit('setup/recheck')
			}
		} finally {
			setSavingAssignment(false)
		}
	}

	const handleToggle = async (presetKey: string, enabled: boolean) => {
		const api = getSettingAPI()
		if (!api) return
		setData((prev) => {
			if (!prev) return prev
			return {
				...prev,
				providers: prev.providers.map((p) =>
					p.preset_key === presetKey ? { ...p, enabled } : p
				)
			}
		})
		const resp = await api.ToggleOCRProvider(presetKey, { enabled })
		if (resp.error) {
			message.error(resp.error?.error_description || (is_cn ? '操作失败' : 'Operation failed'))
			await loadData()
		} else if (!enabled) {
			await loadData()
		}
	}

	const handleSaveProvider = async (presetKey: string, fieldValues: Record<string, string>) => {
		const api = getSettingAPI()
		if (!api) return
		const resp = await api.UpdateOCRProvider(presetKey, { field_values: fieldValues })
		if (resp.error) {
			message.error(resp.error?.error_description || (is_cn ? '保存失败' : 'Save failed'))
			throw resp.error
		}
		await loadData()
	}

	const buildToolOptions = useCallback((): PropertySchema => {
		if (!data) return { type: 'string', enum: [] }

		const options: EnumOption[] = []

		// Traditional OCR API providers
		for (const provider of data.providers) {
			if (!provider.enabled) continue
			const preset = data.presets.find((p) => p.key === provider.preset_key)
			if (!preset || !preset.tools.includes('ocr_recognize')) continue

			const labelIdx = preset.tools.indexOf('ocr_recognize')
			const toolLabel = preset.tool_labels[labelIdx]
			options.push({
				label: `${preset.name} / ${is_cn ? toolLabel['zh-CN'] : toolLabel['en-US']}`,
				value: provider.preset_key
			})
		}

		// OCR-capable LLM connectors (VLM-OCR models)
		for (const conn of ocrConnectors) {
			options.push({
				label: `${conn.label}${is_cn ? ' (模型)' : ' (LLM)'}`,
				value: `llm:${conn.value}`
			})
		}

		return {
			type: 'string',
			enum: options,
			placeholder: is_cn ? '不选择（使用可用的服务）' : 'None (use any available)',
			allowClear: true
		}
	}, [data, ocrConnectors, is_cn])

	if (loading) {
		return (
			<div className={styles.searchScrape}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '文字识别' : 'OCR'}</h2>
						<p>{is_cn ? 'Agent 文字识别使用的服务' : 'Services used by agents for text recognition'}</p>
					</div>
				</div>
				<div className={styles.loadingState}>
					<Spin size='small' />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	if (!data) {
		return (
			<div className={styles.searchScrape}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '文字识别' : 'OCR'}</h2>
						<p>{is_cn ? 'Agent 文字识别使用的服务' : 'Services used by agents for text recognition'}</p>
					</div>
				</div>
				<div className={styles.loadingState}>
					<span style={{ color: 'var(--color_text_3)' }}>
						{loadError || (is_cn ? '加载失败，请刷新页面重试' : 'Failed to load, please refresh')}
					</span>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.searchScrape}>
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '文字识别' : 'OCR'}</h2>
					<p>{is_cn ? 'Agent 文字识别使用的服务' : 'Services used by agents for text recognition'}</p>
				</div>
			</div>

			{/* Default Provider Assignment */}
			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? '默认服务' : 'Default Provider'}</div>
				</div>

				<div className={styles.card}>
					<div className={styles.roleRow}>
						<div className={styles.roleLabel}>
							<span className={styles.roleName}>{is_cn ? '文字识别' : 'Text Recognition'}</span>
							<span className={styles.roleOptional}>{is_cn ? '可选' : 'Optional'}</span>
						</div>
						<div className={styles.roleSelect}>
							<Select
								schema={buildToolOptions()}
								value={assignment.ocr_recognize}
								onChange={(v) => setAssignment((prev) => ({
									...prev,
									ocr_recognize: v ? String(v) : undefined
								}))}
								allowClear
							/>
						</div>
					</div>

					<div className={styles.roleFooter}>
						<div className={styles.roleHint}>
							<Icon name='material-info' size={14} />
							<span>{is_cn ? '列出已启用的 OCR 服务及具备文字识别能力的模型' : 'Lists enabled OCR services and models with OCR capability'}</span>
						</div>
						<Button type='primary' loading={savingAssignment} onClick={handleSaveAssignment}>
							{is_cn ? '保存' : 'Save'}
						</Button>
					</div>
				</div>
			</div>

			{/* Provider List */}
			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? 'OCR 服务' : 'OCR Providers'}</div>
				</div>

				<div className={styles.providerList}>
					{data.presets.map((preset) => {
						const config = data.providers.find((p) => p.preset_key === preset.key)
						if (!config) return null
						return (
							<OCRProviderCard
								key={preset.key}
								preset={preset}
								config={config}
								onToggle={handleToggle}
								onSave={handleSaveProvider}
								onReload={loadData}
							/>
						)
					})}
				</div>
			</div>
		</div>
	)
}

export default OCR
