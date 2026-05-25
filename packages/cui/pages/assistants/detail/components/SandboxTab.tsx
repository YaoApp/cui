import { useEffect, useState } from 'react'
import { Alert, Spin, message } from 'antd'
import { getLocale } from '@umijs/max'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import { CheckboxGroup, Select, Input } from '@/components/ui/inputs'
import { Setting } from '@/openapi/setting'
import type { AgentSettingPageData, SandboxPageData } from '@/openapi/setting/types'
import styles from './View/index.less'

interface SandboxTabProps {
	assistantId: string
}

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

const AUTO_VALUE = '__auto__'

const SandboxTab = ({ assistantId }: SandboxTabProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [loadError, setLoadError] = useState(false)
	const [agentData, setAgentData] = useState<AgentSettingPageData | null>(null)
	const [sandboxData, setSandboxData] = useState<SandboxPageData | null>(null)
	const [selectedRunners, setSelectedRunners] = useState<string[]>([])
	const [selectedImage, setSelectedImage] = useState<string>('')
	const [customImage, setCustomImage] = useState('')

	useEffect(() => {
		const load = async () => {
			const api = getSettingAPI()
			if (!api) {
				setLoading(false)
				return
			}
			try {
				const [agentRes, sandboxRes] = await Promise.all([
					api.GetAgentSetting(assistantId),
					api.GetSandboxConfig(locale)
				])

				if (!window.$app?.openapi?.IsError(agentRes)) {
					const data = window.$app.openapi.GetData(agentRes)
					setAgentData(data)
					if (data?.setting?.runners && data.setting.runners.length > 0) {
						setSelectedRunners(data.setting.runners)
					} else {
						setSelectedRunners([AUTO_VALUE])
					}
					setSelectedImage(data?.setting?.image || '')
				} else {
					setLoadError(true)
					setSelectedRunners([AUTO_VALUE])
				}

				if (!window.$app?.openapi?.IsError(sandboxRes)) {
					setSandboxData(window.$app.openapi.GetData(sandboxRes))
				}
			} catch (err) {
				console.error('[SandboxTab] load failed:', err)
				setLoadError(true)
				setSelectedRunners([AUTO_VALUE])
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [assistantId])

	const handleSave = async () => {
		const api = getSettingAPI()
		if (!api) return
		setSaving(true)
		try {
			const runners = selectedRunners.includes(AUTO_VALUE) ? [] : selectedRunners
			const image = selectedImage === '__custom__' ? customImage : selectedImage
			const res = await api.UpdateAgentSetting(assistantId, { runners, image })
			if (!window.$app?.openapi?.IsError(res)) {
				message.success(is_cn ? '保存成功' : 'Saved successfully')
				const agentRes = await api.GetAgentSetting(assistantId)
				if (!window.$app?.openapi?.IsError(agentRes)) {
					setAgentData(window.$app.openapi.GetData(agentRes))
				}
			} else {
				message.error(is_cn ? '保存失败' : 'Save failed')
			}
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className={styles.emptyState}>
				<Spin />
			</div>
		)
	}

	const supportedRunners = agentData?.supported_runners || []
	const sandboxSupports = agentData?.sandbox_config?.runner?.supports || []
	const defaultRunner = agentData?.sandbox_config?.runner?.name || ''

	const activeRunners = selectedRunners.includes(AUTO_VALUE)
		? supportedRunners
		: selectedRunners

	const allImages: string[] = []
	if (sandboxData?.images) {
		Object.values(sandboxData.images).forEach((imgs) => {
			imgs.forEach((img) => {
				const fullName = img.tag ? `${img.image_name}:${img.tag}` : img.image_name
				if (allImages.includes(fullName)) return
				if (activeRunners.length > 0) {
					const matchesRunner = activeRunners.some((r) =>
						fullName.toLowerCase().includes(r.toLowerCase())
					)
					if (!matchesRunner) {
						const isGeneric = !supportedRunners.some((r) =>
							fullName.toLowerCase().includes(r.toLowerCase())
						)
						if (!isGeneric) return
					}
				}
				allImages.push(fullName)
			})
		})
	}

	const handleRunnerChange = (values: unknown) => {
		const vals = values as string[]
		if (vals.includes(AUTO_VALUE) && !selectedRunners.includes(AUTO_VALUE)) {
			setSelectedRunners([AUTO_VALUE])
		} else if (vals.length > 1 && vals.includes(AUTO_VALUE)) {
			setSelectedRunners(vals.filter((v) => v !== AUTO_VALUE))
		} else if (vals.length === 0) {
			setSelectedRunners([AUTO_VALUE])
		} else {
			setSelectedRunners(vals)
		}
	}

	const runnerLabels: Record<string, string> = {
		claude: 'Claude Code',
		opencode: 'OpenCode',
		tai: 'Tai Code (Remote / Local)',
		yaocode: 'Yao Code (Local)'
	}

	const runnerOrder = ['claude', 'opencode', 'tai', 'yaocode']
	const sortedRunners = [...supportedRunners].sort(
		(a, b) => (runnerOrder.indexOf(a) === -1 ? 99 : runnerOrder.indexOf(a)) -
			(runnerOrder.indexOf(b) === -1 ? 99 : runnerOrder.indexOf(b))
	)

	const runnerEnumOptions = [
		{ label: is_cn ? '自动 (推荐)' : 'Auto (Recommended)', value: AUTO_VALUE },
		...sortedRunners.map((r) => {
			const isDisabled = sandboxSupports.length > 0 && !sandboxSupports.includes(r)
			const label = runnerLabels[r] || r.charAt(0).toUpperCase() + r.slice(1)
			return {
				label: isDisabled ? `${label} (${is_cn ? '不支持' : 'unsupported'})` : label,
				value: r
			}
		})
	]

	const imageEnumOptions = [
		...allImages.map((img) => ({ label: img, value: img })),
		{ label: is_cn ? '自定义镜像...' : 'Custom image...', value: '__custom__' }
	]

	return (
		<div className={styles.sectionContent}>

			{loadError && (
				<Alert
					type='warning'
					showIcon
					message={
						is_cn
							? '无法加载助手设置，保存后将创建新设置。'
							: 'Could not load agent settings. Saving will create new settings.'
					}
					style={{ marginBottom: 16 }}
				/>
			)}

			<div className={styles.card}>
				<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
					<div>
						<div className={styles.cardTitle}>{is_cn ? '沙箱配置' : 'Sandbox Config'}</div>
						<div className={styles.cardDesc}>
							{is_cn
								? '配置 Runner 偏好和容器镜像，影响助手运行时的沙箱环境。'
								: 'Configure runner preference and container image for the sandbox environment.'}
						</div>
					</div>
					<div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
						<Button
							size='small'
							onClick={() => {
								setSelectedRunners([AUTO_VALUE])
								setSelectedImage('')
								setCustomImage('')
							}}
						>
							{is_cn ? '恢复默认' : 'Reset'}
						</Button>
						<Button size='small' type='primary' loading={saving} onClick={handleSave}>
							{is_cn ? '保存' : 'Save'}
						</Button>
					</div>
				</div>
				<div className={styles.settingRow}>
					<div className={styles.settingHeader}>
						<div className={styles.settingName}>
							{is_cn ? 'Runner 偏好' : 'Runner Preference'}
						</div>
						<div className={styles.settingDesc}>
							{is_cn
								? '选择此助手可使用的 Runner。不选择则自动分配。'
								: 'Select which runners this assistant can use. Leave as "Auto" for automatic assignment.'}
						</div>
					</div>
					<div className={styles.settingControl}>
						<CheckboxGroup
							schema={{
								type: 'array',
								enum: runnerEnumOptions
							}}
							value={selectedRunners}
							onChange={handleRunnerChange}
						/>
					</div>
				</div>

				<div className={styles.settingRow}>
					<div className={styles.settingHeader}>
						<div className={styles.settingName}>{is_cn ? '镜像 (Image)' : 'Image'}</div>
						<div className={styles.settingDesc}>
							{is_cn
								? '可选。指定 Box 模式使用的容器镜像，不选则使用 Agent 配置。'
								: 'Optional. Specify the container image for Box mode. Leave empty to use the agent default.'}
						</div>
					</div>
					<div className={styles.settingControl}>
						<Select
							schema={{
								type: 'string',
								placeholder: is_cn
									? '默认 (来自 Agent 配置)'
									: 'Default (from agent config)',
								enum: imageEnumOptions,
								allowClear: true
							}}
							value={selectedImage || undefined}
							onChange={(val) => {
								setSelectedImage((val as string) || '')
								if (val !== '__custom__') setCustomImage('')
							}}
						/>
						{selectedImage === '__custom__' && (
							<div style={{ marginTop: 8 }}>
								<Input
									schema={{
										type: 'string',
										placeholder: is_cn
											? '输入镜像名称 (如 ubuntu:22.04)'
											: 'Enter image name (e.g. ubuntu:22.04)'
									}}
									value={customImage}
									onChange={(v) => setCustomImage(v as string)}
								/>
							</div>
						)}
					</div>
				</div>
			</div>

			{sandboxSupports.length > 0 && (
				<div className={styles.noticeCard}>
					<Icon name='material-info' size={16} className={styles.noticeIcon} />
					<div>
						<div style={{ fontWeight: 500, marginBottom: 4 }}>
							{is_cn ? 'sandbox.yao 支持的 Runner:' : 'Supported runners (sandbox.yao):'}
						</div>
						<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
							{sandboxSupports.map((r) => (
								<span key={r} className={styles.tag}>
									{r}
								</span>
							))}
						</div>
					</div>
				</div>
			)}

		</div>
	)
}

export default SandboxTab
