import { useState, useEffect, useCallback } from 'react'
import { history, getLocale } from '@umijs/max'
import { message, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import { Setting } from '@/openapi/setting'
import { local } from '@yaoapp/storex'
import { getSetupRedirectUrl, refreshSetupStatus } from '../redirect'
import type { SearchPageData } from '@/pages/settings/types'
import SearchProviderCard from '@/pages/settings/components/SearchScrape/SearchProviderCard'
import SetupLayout from '../components/SetupLayout'
import SandboxModal, { hasPendingSandboxWork } from '../components/SandboxModal'
import styles from '../index.less'

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

const ByokSearch = () => {
	const is_cn = getLocale() === 'zh-CN'

	const byokSteps = [
		{ label: is_cn ? '模型服务' : 'Providers' },
		{ label: is_cn ? '角色分配' : 'Roles' },
		{ label: is_cn ? '搜索配置' : 'Search' }
	]

	const [loading, setLoading] = useState(true)
	const [data, setData] = useState<SearchPageData | null>(null)
	const [finishing, setFinishing] = useState(false)
	const [showSandboxModal, setShowSandboxModal] = useState(false)
	const [redirectUrl, setRedirectUrl] = useState<string>('')

	const loadData = useCallback(async () => {
		const api = getSettingAPI()
		if (!api) return
		try {
			const resp = await api.GetSearchConfig()
			if (resp.data) {
				setData(resp.data)
			}
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadData()
	}, [loadData])

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

	const handleFinish = async () => {
		if (finishing) return
		setFinishing(true)
		try {
			const api = getSettingAPI()
			if (api && data) {
				const assignment: Record<string, string | null> = {}
				const isConnected = (key: string) =>
					data.providers.some((p) => p.preset_key === key && p.enabled && p.status === 'connected')

				if (isConnected('serper')) {
					assignment.web_search = 'serper'
				} else if (isConnected('tavily')) {
					assignment.web_search = 'tavily'
				}
				if (isConnected('brightdata')) {
					assignment.web_scrape = 'brightdata'
				}

				if (assignment.web_search || assignment.web_scrape) {
					await api.SaveSearchToolAssignment(assignment)
				}
			}

			window.$app?.Event?.emit('models/changed')
			await refreshSetupStatus()
			const url = await getSetupRedirectUrl()
			if (hasPendingSandboxWork(local.setup_status)) {
				setRedirectUrl(url)
				setShowSandboxModal(true)
			} else {
				window.location.href = url
			}
		} catch {
			setFinishing(false)
			message.error(is_cn ? '操作失败，请重试' : 'Operation failed, please retry')
		}
	}

	const nonCloudPresets = data?.presets.filter((p) => !p.is_cloud) ?? []

	return (
		<SetupLayout
			showBack
			backLabel={is_cn ? '切换使用 Tao Service' : 'Switch to Tao Service'}
			onBack={() => history.push('/setup/tao')}
			steps={byokSteps}
			currentStep={2}
		>
			<div className={styles.byokCard}>
				<h2 className={styles.byokTitle}>
					{is_cn ? '配置搜索服务' : 'Configure Search Providers'}
				</h2>
				<p className={styles.byokSubtitle}>
					{is_cn ? '让 AI 助手可以联网搜索' : 'Enable your AI assistant to search the web'}
				</p>

				{loading || !data ? (
					<div className={styles.loadingWrap}>
						<Spin size='small' />
					</div>
				) : (
					<>
						<div className={styles.byokSearchList}>
							{nonCloudPresets.map((preset) => {
								const config = data.providers.find(
									(p) => p.preset_key === preset.key
								)
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

						<div className={styles.byokSearchHint}>
							<Icon name='material-info' size={14} />
							<span>
								{is_cn
									? '跳过此步骤后仍可在设置中配置'
									: 'You can still configure this later in Settings'}
							</span>
						</div>

						<div className={styles.byokFooter}>
							<button
								className={styles.byokSkipBtn}
								type='button'
								onClick={() => history.push('/setup/byok/models')}
							>
								{is_cn ? '上一步' : 'Previous'}
							</button>
							<button
								className={styles.byokNextBtn}
								type='button'
								disabled={finishing}
								onClick={handleFinish}
							>
								{finishing
									? (is_cn ? '正在完成...' : 'Finishing...')
									: (is_cn ? '完成配置 →' : 'Finish Setup →')}
							</button>
						</div>
					</>
				)}
			</div>
			<SandboxModal
				open={showSandboxModal}
				onClose={() => {
					setShowSandboxModal(false)
					if (redirectUrl) {
						window.location.href = redirectUrl
					}
				}}
				onGoSetup={() => {
					setShowSandboxModal(false)
					history.push('/settings/sandbox')
				}}
			/>
		</SetupLayout>
	)
}

export default ByokSearch
