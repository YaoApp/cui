import { useState, useEffect, useCallback } from 'react'
import { getLocale } from '@umijs/max'
import { message, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { Select } from '@/components/ui/inputs'
import { Setting } from '@/openapi/setting'
import type { PropertySchema, EnumOption } from '@/components/ui/inputs/types'
import type { SearchPageData, SearchToolAssignment, SearchToolType } from '../../types'
import SearchProviderCard from './SearchProviderCard'
import styles from './index.less'

type ToolRole = 'web_search' | 'web_scrape'

const TOOL_ROLES: {
	key: ToolRole
	cn: string
	en: string
	tooltip_cn: string
	tooltip_en: string
	required: boolean
}[] = [
	{
		key: 'web_search',
		cn: '网页搜索',
		en: 'Web Search',
		tooltip_cn: '在互联网上搜索信息',
		tooltip_en: 'Search for information on the internet',
		required: false
	},
	{
		key: 'web_scrape',
		cn: '网页抓取',
		en: 'Web Scrape',
		tooltip_cn: '读取网页内容供 AI 分析',
		tooltip_en: 'Read web page content for AI analysis',
		required: false
	}
]

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

const SearchScrape = () => {
	const is_cn = getLocale() === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [data, setData] = useState<SearchPageData | null>(null)
	const [assignment, setAssignment] = useState<SearchToolAssignment>({})
	const [savingAssignment, setSavingAssignment] = useState(false)

	const loadData = useCallback(async () => {
		const api = getSettingAPI()
		if (!api) return
		try {
			const resp = await api.GetSearchConfig()
			if (resp.data) {
				setData(resp.data)
				setAssignment(resp.data.tool_assignment)
			}
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
			const resp = await api.SaveSearchToolAssignment(assignment)
			if (resp.error) {
				message.error(resp.error?.error_description || (is_cn ? '保存失败' : 'Save failed'))
			} else {
				message.success(is_cn ? '默认工具已保存' : 'Default tools saved')
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
		const resp = await api.ToggleSearchProvider(presetKey, { enabled })
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
		const resp = await api.UpdateSearchProvider(presetKey, { field_values: fieldValues })
		if (resp.error) {
			message.error(resp.error?.error_description || (is_cn ? '保存失败' : 'Save failed'))
			throw resp.error
		}
		await loadData()
	}

	const buildToolOptions = useCallback((toolType: SearchToolType): PropertySchema => {
		if (!data) return { type: 'string', enum: [] }

		const options: EnumOption[] = []

		for (const provider of data.providers) {
			if (!provider.enabled) continue
			const preset = data.presets.find((p) => p.key === provider.preset_key)
			if (!preset || !preset.tools.includes(toolType)) continue

			const labelIdx = preset.tools.indexOf(toolType)
			const toolLabel = preset.tool_labels[labelIdx]
			options.push({
				label: `${preset.name} / ${is_cn ? toolLabel['zh-CN'] : toolLabel['en-US']}`,
				value: provider.preset_key
			})
		}

		return {
			type: 'string',
			enum: options,
			placeholder: is_cn ? '不选择（使用可用的服务）' : 'None (use any available)',
			allowClear: true
		}
	}, [data, is_cn])

	if (loading || !data) {
		return (
			<div className={styles.searchScrape}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '搜索与抓取' : 'Search & Scrape'}</h2>
						<p>{is_cn ? 'Agent 联网搜索和网页抓取使用的服务' : 'Services used by agents for web search and scraping'}</p>
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
		<div className={styles.searchScrape}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '搜索与抓取' : 'Search & Scrape'}</h2>
					<p>{is_cn ? 'Agent 联网搜索和网页抓取使用的服务' : 'Services used by agents for web search and scraping'}</p>
				</div>
			</div>

			{/* Default Tool Assignment */}
			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? '默认工具' : 'Default Tools'}</div>
				</div>

				<div className={styles.card}>
					{TOOL_ROLES.map((r) => (
						<div key={r.key} className={styles.roleRow}>
							<div className={styles.roleLabel}>
								<span className={styles.roleName}>{is_cn ? r.cn : r.en}</span>
								<span className={styles.roleOptional}>
									{is_cn ? '可选' : 'Optional'}
								</span>
							</div>
							<div className={styles.roleSelect}>
								<Select
									schema={buildToolOptions(r.key)}
									value={assignment[r.key]}
									onChange={(v) => setAssignment((prev) => ({
										...prev,
										[r.key]: v ? String(v) : undefined
									}))}
									allowClear
								/>
							</div>
						</div>
					))}

					<div className={styles.roleFooter}>
						<div className={styles.roleHint}>
							<Icon name='material-info' size={14} />
							<span>{is_cn ? '下拉只列出已启用服务中的可用工具' : 'Only tools from enabled providers are listed'}</span>
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
					<div className={styles.sectionTitle}>{is_cn ? '搜索服务' : 'Search Providers'}</div>
				</div>

				<div className={styles.providerList}>
					{data.presets.map((preset) => {
						const config = data.providers.find((p) => p.preset_key === preset.key)
						if (!config) return null
						return (
							<SearchProviderCard
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

export default SearchScrape
