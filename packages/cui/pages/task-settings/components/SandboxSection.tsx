import { useState, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import { CheckboxGroup, Select, Input } from '@/components/ui/inputs'
import type { KanbanTask } from '../../kanban/types'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'

const AUTO_VALUE = '__auto__'

const MOCK_SUPPORTED_RUNNERS = ['claude', 'opencode', 'tai', 'yaocode']
const MOCK_IMAGES = [
	'node:20-slim',
	'node:18-slim',
	'python:3.12-slim',
	'ubuntu:22.04',
	'debian:bookworm-slim'
]

const RUNNER_LABELS: Record<string, string> = {
	claude: 'Claude Code',
	opencode: 'OpenCode',
	tai: 'Tai Code (Remote / Local)',
	yaocode: 'Yao Code (Local)'
}

interface OverrideSource {
	runners: 'task' | 'agent' | 'default'
	image: 'task' | 'agent' | 'default'
}

const SandboxSection = ({ task }: { task: KanbanTask }) => {
	const is_cn = getLocale() === 'zh-CN'

	const agentRunners = ['claude', 'opencode']
	const agentImage = 'node:20-slim'

	const [selectedRunners, setSelectedRunners] = useState<string[]>(
		task.sandbox?.runners?.length ? task.sandbox.runners : [AUTO_VALUE]
	)
	const [selectedImage, setSelectedImage] = useState<string>(task.sandbox?.image || '')
	const [customImage, setCustomImage] = useState('')
	const [saving, setSaving] = useState(false)

	const source: OverrideSource = useMemo(() => ({
		runners: selectedRunners.includes(AUTO_VALUE)
			? 'default'
			: task.sandbox?.runners?.length
				? 'task'
				: 'agent',
		image: selectedImage
			? 'task'
			: agentImage
				? 'agent'
				: 'default'
	}), [selectedRunners, selectedImage, task])

	const effectiveRunners = useMemo(() => {
		if (!selectedRunners.includes(AUTO_VALUE)) return selectedRunners
		return agentRunners.length ? agentRunners : MOCK_SUPPORTED_RUNNERS
	}, [selectedRunners])

	const effectiveImage = selectedImage || agentImage || ''

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

	const handleSave = async () => {
		setSaving(true)
		await new Promise((r) => setTimeout(r, 500))
		setSaving(false)
		message.success(is_cn ? '保存成功' : 'Saved successfully')
	}

	const handleReset = () => {
		setSelectedRunners([AUTO_VALUE])
		setSelectedImage('')
		setCustomImage('')
	}

	const sourceTag = (level: 'task' | 'agent' | 'default') => {
		const labels = {
			task: is_cn ? '任务' : 'Task',
			agent: is_cn ? 'AI 专家' : 'AI Expert',
			default: is_cn ? '默认' : 'Default'
		}
		const colors = { task: '#1890ff', agent: '#722ed1', default: '#8c8c8c' }
		return (
			<span style={{
				fontSize: 11,
				padding: '1px 6px',
				borderRadius: 4,
				background: `${colors[level]}15`,
				color: colors[level],
				fontWeight: 500,
				marginLeft: 8
			}}>
				{labels[level]}
			</span>
		)
	}

	const runnerEnumOptions = [
		{ label: is_cn ? '自动 (推荐)' : 'Auto (Recommended)', value: AUTO_VALUE },
		...MOCK_SUPPORTED_RUNNERS.map((r) => ({
			label: RUNNER_LABELS[r] || r.charAt(0).toUpperCase() + r.slice(1),
			value: r
		}))
	]

	const imageEnumOptions = [
		...MOCK_IMAGES.map((img) => ({ label: img, value: img })),
		{ label: is_cn ? '自定义镜像...' : 'Custom image...', value: '__custom__' }
	]

	return (
		<div className={viewStyles.sectionContent}>
			<div className={viewStyles.card}>
				<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
					<div>
						<div className={viewStyles.cardTitle}>{is_cn ? '沙箱配置' : 'Sandbox Config'}</div>
						<div className={viewStyles.cardDesc}>
							{is_cn
								? '任务级别覆盖。优先级：任务 > AI 专家 > 默认。'
								: 'Task-level override. Priority: Task > AI Expert > Default.'}
						</div>
					</div>
					<div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
						<Button size='small' onClick={handleReset}>
							{is_cn ? '恢复默认' : 'Reset'}
						</Button>
						<Button size='small' type='primary' loading={saving} onClick={handleSave}>
							{is_cn ? '保存' : 'Save'}
						</Button>
					</div>
				</div>

				<div className={viewStyles.settingRow}>
					<div className={viewStyles.settingHeader}>
						<div className={viewStyles.settingName}>
							{is_cn ? 'Runner 偏好' : 'Runner Preference'}
							{sourceTag(source.runners)}
						</div>
						<div className={viewStyles.settingDesc}>
							{is_cn
								? '选择此任务可使用的 Runner。"自动"将继承 AI 专家配置。'
								: 'Select runners for this task. "Auto" inherits from AI Expert config.'}
						</div>
					</div>
					<div className={viewStyles.settingControl}>
						<CheckboxGroup
							schema={{
								type: 'array',
								enum: runnerEnumOptions
							}}
							value={selectedRunners}
							onChange={handleRunnerChange}
						/>
						{selectedRunners.includes(AUTO_VALUE) && agentRunners.length > 0 && (
							<div style={{ marginTop: 6, fontSize: 12, color: 'var(--color_neo_text_secondary)' }}>
								{is_cn ? '继承自 AI 专家: ' : 'Inherited from AI Expert: '}
								{agentRunners.map((r) => RUNNER_LABELS[r] || r).join(', ')}
							</div>
						)}
					</div>
				</div>

				<div className={viewStyles.settingRow}>
					<div className={viewStyles.settingHeader}>
						<div className={viewStyles.settingName}>
							{is_cn ? '镜像 (Image)' : 'Image'}
							{sourceTag(source.image)}
						</div>
						<div className={viewStyles.settingDesc}>
							{is_cn
								? '指定容器镜像。不选则继承 AI 专家配置。'
								: 'Specify the container image. Leave empty to inherit from AI Expert.'}
						</div>
					</div>
					<div className={viewStyles.settingControl}>
						<Select
							schema={{
								type: 'string',
								placeholder: is_cn
									? `继承 AI 专家 (${agentImage})`
									: `Inherit from AI Expert (${agentImage})`,
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
						{!selectedImage && agentImage && (
							<div style={{ marginTop: 6, fontSize: 12, color: 'var(--color_neo_text_secondary)' }}>
								{is_cn ? '当前生效: ' : 'Effective: '}
								<span style={{ fontFamily: 'monospace' }}>{effectiveImage}</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default SandboxSection
