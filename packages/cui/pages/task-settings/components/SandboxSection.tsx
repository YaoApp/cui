import { useState, useEffect, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import { Button } from '@/components/ui'
import { Select, Input } from '@/components/ui/inputs'
import { getRunners, getImages } from '../../kanban/services/api'
import type { TaskConfig, SetConfigRequest, RunnerInfo, PresetImage } from '@/openapi/agent/tasks'
import type { KanbanTask } from '../../kanban/types'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'

interface Props {
	task: KanbanTask
	taskId: string
	config: TaskConfig | null
	onConfigSave: (req: SetConfigRequest) => Promise<void>
}

const SandboxSection = ({ task, taskId, config, onConfigSave }: Props) => {
	const is_cn = getLocale() === 'zh-CN'

	const [availableRunners, setAvailableRunners] = useState<RunnerInfo[]>([])
	const [availableImages, setAvailableImages] = useState<PresetImage[]>([])
	const [selectedRunner, setSelectedRunner] = useState<string>(config?.setting?.runner || '')
	const [selectedImage, setSelectedImage] = useState<string>(config?.setting?.image || '')
	const [customImage, setCustomImage] = useState('')
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		getRunners().then(setAvailableRunners).catch(() => {})
		getImages().then(setAvailableImages).catch(() => {})
	}, [])

	useEffect(() => {
		if (config?.setting) {
			setSelectedRunner(config.setting.runner || '')
			setSelectedImage(config.setting.image || '')
		}
	}, [config])

	const runnerSource = config?._resolved_from?.runner || 'default'
	const imageSource = config?._resolved_from?.image || 'default'

	const sourceTag = (level: string) => {
		const labels: Record<string, string> = {
			task: is_cn ? '任务' : 'Task',
			agent: is_cn ? 'AI 专家' : 'AI Expert',
			'system/team/user': is_cn ? '默认' : 'Default',
			default: is_cn ? '默认' : 'Default'
		}
		const colors: Record<string, string> = {
			task: '#1890ff',
			agent: '#722ed1',
			'system/team/user': '#8c8c8c',
			default: '#8c8c8c'
		}
		return (
			<span style={{
				fontSize: 11,
				padding: '1px 6px',
				borderRadius: 4,
				background: `${colors[level] || '#8c8c8c'}15`,
				color: colors[level] || '#8c8c8c',
				fontWeight: 500,
				marginLeft: 8
			}}>
				{labels[level] || level}
			</span>
		)
	}

	const runnerOptions = [
		{ label: is_cn ? '自动 (继承上层配置)' : 'Auto (inherit)', value: '' },
		...availableRunners.map((r) => ({
			label: `${r.name}${r.available ? '' : (is_cn ? ' (不可用)' : ' (unavailable)')}`,
			value: r.name
		}))
	]

	const imageOptions = useMemo(() => [
		{ label: is_cn ? '继承上层配置' : 'Inherit from parent', value: '' },
		...availableImages.map((img) => ({
			label: img.name + (img.tag ? `:${img.tag}` : ''),
			value: img.name + (img.tag ? `:${img.tag}` : '')
		})),
		{ label: is_cn ? '自定义镜像...' : 'Custom image...', value: '__custom__' }
	], [availableImages, is_cn])

	const handleSave = async () => {
		setSaving(true)
		try {
			const req: SetConfigRequest = {}
			const effectiveImage = selectedImage === '__custom__' ? customImage : selectedImage
			req.runner = selectedRunner || undefined
			req.image = effectiveImage || undefined
			await onConfigSave(req)
			message.success(is_cn ? '保存成功' : 'Saved successfully')
		} catch {
			message.error(is_cn ? '保存失败' : 'Save failed')
		} finally {
			setSaving(false)
		}
	}

	const handleReset = async () => {
		setSaving(true)
		try {
			await onConfigSave({ runner: '', image: '' })
			setSelectedRunner('')
			setSelectedImage('')
			setCustomImage('')
			message.success(is_cn ? '已恢复默认' : 'Reset to default')
		} catch {
			message.error(is_cn ? '重置失败' : 'Reset failed')
		} finally {
			setSaving(false)
		}
	}

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
							{sourceTag(selectedRunner ? 'task' : runnerSource)}
						</div>
						<div className={viewStyles.settingDesc}>
							{is_cn
								? '选择此任务使用的 Runner。"自动"将继承上层配置。'
								: 'Select runner for this task. "Auto" inherits from parent config.'}
						</div>
					</div>
					<div className={viewStyles.settingControl}>
						<Select
							schema={{
								type: 'string',
								enum: runnerOptions,
								placeholder: is_cn ? '选择 Runner' : 'Select runner'
							}}
							value={selectedRunner || undefined}
							onChange={(val) => setSelectedRunner((val as string) || '')}
						/>
					</div>
				</div>

				<div className={viewStyles.settingRow}>
					<div className={viewStyles.settingHeader}>
						<div className={viewStyles.settingName}>
							{is_cn ? '镜像 (Image)' : 'Image'}
							{sourceTag(selectedImage ? 'task' : imageSource)}
						</div>
						<div className={viewStyles.settingDesc}>
							{is_cn
								? '指定容器镜像。不选则继承上层配置。'
								: 'Specify the container image. Leave empty to inherit from parent.'}
						</div>
					</div>
					<div className={viewStyles.settingControl}>
						<Select
							schema={{
								type: 'string',
								placeholder: is_cn ? '继承上层配置' : 'Inherit from parent',
								enum: imageOptions,
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
		</div>
	)
}

export default SandboxSection
