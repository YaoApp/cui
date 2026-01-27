import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Tooltip, message } from 'antd'
import { Input, Select, InputNumber, Switch, CheckboxGroup, InputPassword } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import { useRobots } from '@/hooks/useRobots'
import { Agent } from '@/openapi/agent/api'
import type { Agent as AgentType } from '@/openapi/agent/types'
import type { RobotState } from '../../../../../types'
import type { ConfigContextData } from '../index'
import styles from '../index.less'

interface AdvancedPanelProps {
	robot: RobotState
	formData: Record<string, any>
	onChange: (field: string, value: any) => void
	is_cn: boolean
	autonomousMode?: boolean
	onDelete?: () => void
	configData?: ConfigContextData
}

// Phase agents - for customizing which AI handles each execution phase
// inspiration phase is only available in autonomous mode
// run phase is not configurable (it's a built-in scheduler, not an agent)
// Each phase has a corresponding agent type for filtering (e.g., robot-goals, robot-tasks)
const PHASES = [
	{ key: 'inspiration', label_en: 'Inspiration', label_cn: '洞察发现', desc_en: 'Discover insights', desc_cn: '发现洞察', default: '__yao.inspiration', type: 'robot-inspiration', autonomousOnly: true },
	{ key: 'goals', label_en: 'Goals', label_cn: '目标规划', desc_en: 'Generate goals', desc_cn: '生成目标', default: '__yao.goals', type: 'robot-goals' },
	{ key: 'tasks', label_en: 'Tasks', label_cn: '任务拆解', desc_en: 'Split into tasks', desc_cn: '拆分任务', default: '__yao.tasks', type: 'robot-tasks' },
	// run phase is omitted - it's a built-in scheduler, not a replaceable agent
	{ key: 'validation', label_en: 'Validation', label_cn: '校验', desc_en: 'Validate results', desc_cn: '校验结果', default: '__yao.validation', type: 'robot-validation' },
	{ key: 'delivery', label_en: 'Delivery', label_cn: '交付', desc_en: 'Format & deliver', desc_cn: '格式化并交付', default: '__yao.delivery', type: 'robot-delivery' },
	{ key: 'learning', label_en: 'Learning', label_cn: '学习', desc_en: 'Extract insights', desc_cn: '提取经验', default: '__yao.learning', type: 'robot-learning' }
]

// Learn types
const LEARN_TYPES = [
	{ label: 'Execution history', label_cn: '执行记录', value: 'execution' },
	{ label: 'Feedback', label_cn: '反馈', value: 'feedback' },
	{ label: 'Insights', label_cn: '洞察', value: 'insight' }
]

/**
 * AdvancedPanel - Advanced settings (rarely changed)
 */
const AdvancedPanel: React.FC<AdvancedPanelProps> = ({ robot, formData, onChange, is_cn, autonomousMode = false, onDelete, configData }) => {
	// Robot API hook for delete
	const { deleteRobot, error: apiError } = useRobots()

	// Additional email recipients
	const [emailRecipients, setEmailRecipients] = useState<string[]>([])
	const [newEmail, setNewEmail] = useState('')
	const [emailError, setEmailError] = useState('')
	
	// Delete confirmation
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [deleteConfirmName, setDeleteConfirmName] = useState('')

	// Webhook targets (URL + optional secret)
	const [webhookTargets, setWebhookTargets] = useState<Array<{ url: string; secret?: string }>>([])
	const [newWebhook, setNewWebhook] = useState('')
	const [newWebhookSecret, setNewWebhookSecret] = useState('')
	const [webhookError, setWebhookError] = useState('')

	// Yao Processes
	const [processes, setProcesses] = useState<string[]>([])
	const [newProcess, setNewProcess] = useState('')

	// Phase agents loaded from API (keyed by phase type)
	const [phaseAgents, setPhaseAgents] = useState<Record<string, AgentType[]>>({})
	const phaseAgentsLoadedRef = useRef(false)

	// Load phase-specific agents when component mounts (single query with types IN)
	useEffect(() => {
		if (!window.$app?.openapi || phaseAgentsLoadedRef.current) return

		phaseAgentsLoadedRef.current = true

		const openapi = window.$app.openapi
		const agentAPI = new Agent(openapi)

		// Query all robot phase types in a single request using types (IN query)
		const phaseTypes = PHASES.map(p => p.type)
		const uniqueTypes = [...new Set(phaseTypes)]

		agentAPI.assistants
			.List({ types: uniqueTypes })
			.then(response => {
				if (!openapi.IsError(response)) {
					const data = openapi.GetData(response)
					const agents = data?.data || []
					
					// Group agents by type
					const agentsByType: Record<string, AgentType[]> = {}
					uniqueTypes.forEach(type => {
						agentsByType[type] = agents.filter((a: AgentType) => a.type === type)
					})
					setPhaseAgents(agentsByType)
				}
			})
			.catch(err => {
				console.error('Failed to load phase agents:', err)
				phaseAgentsLoadedRef.current = false
			})
	}, [])

	// Build agent options for each phase
	// Default system agent (__yao.*) is always first, then agents matching the phase type
	// Also includes current value if not in the list (to preserve saved selection)
	const getPhaseAgentOptions = useMemo(() => {
		return (phaseKey: string, phaseType: string, defaultAgent: string, currentValue?: string) => {
			// Start with the default system agent
			const options: Array<{ label: string; value: string }> = [
				{ label: `${defaultAgent} (${is_cn ? '默认' : 'default'})`, value: defaultAgent }
			]
			
			// Add agents that match the phase type from API query
			const agents = phaseAgents[phaseType] || []
			agents.forEach(agent => {
				// Skip if it's the default agent (already added)
				if (agent.assistant_id === defaultAgent) return
				
				options.push({
					label: agent.name || agent.assistant_id,
					value: agent.assistant_id
				})
			})
			
			// If current value exists and is not in options, add it
			// This preserves saved values that might not appear in the agent list
			if (currentValue && currentValue !== defaultAgent) {
				const exists = options.some(opt => opt.value === currentValue)
				if (!exists) {
					options.push({
						label: currentValue,
						value: currentValue
					})
				}
			}
			
			return options
		}
	}, [phaseAgents, is_cn])

	// Sync local state with formData when it changes
	useEffect(() => {
		// Initialize email recipients from formData
		const emailTargets = formData['delivery.email.targets'] || []
		const emails = emailTargets.map((t: any) => t.to?.[0] || t).filter(Boolean)
		setEmailRecipients(emails)

		// Initialize webhook targets from formData
		const webhookData = formData['delivery.webhook.targets'] || []
		const webhooks = webhookData.map((t: any) => ({
			url: t.url || '',
			secret: t.secret || ''
		})).filter((t: any) => t.url)
		setWebhookTargets(webhooks)

		// Initialize processes from formData
		const processTargets = formData['delivery.process.targets'] || []
		const procs = processTargets.map((t: any) => t.process || t).filter(Boolean)
		setProcesses(procs)
	}, [formData['delivery.email.targets'], formData['delivery.webhook.targets'], formData['delivery.process.targets']])

	// Handle field change
	const handleFieldChange = (field: string, value: any) => {
		onChange(field, value)
	}

	// Email validation
	const isValidEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(email)
	}

	// URL validation
	const isValidUrl = (url: string): boolean => {
		try {
			new URL(url)
			return url.startsWith('http://') || url.startsWith('https://')
		} catch {
			return false
		}
	}

	// Handle add email recipient
	const handleAddEmail = () => {
		const email = newEmail.trim()
		if (!email) {
			setEmailError(is_cn ? '请输入邮箱地址' : 'Please enter an email address')
			return
		}
		if (!isValidEmail(email)) {
			setEmailError(is_cn ? '邮箱格式不正确' : 'Invalid email format')
			return
		}
		if (emailRecipients.includes(email)) {
			setEmailError(is_cn ? '该邮箱已添加' : 'Email already added')
			return
		}
		const newRecipients = [...emailRecipients, email]
		setEmailRecipients(newRecipients)
		handleFieldChange('delivery.email.targets', newRecipients.map(e => ({ to: [e] })))
		setNewEmail('')
		setEmailError('')
	}

	// Handle remove email recipient
	const handleRemoveEmail = (index: number) => {
		const newRecipients = emailRecipients.filter((_, i) => i !== index)
		setEmailRecipients(newRecipients)
		handleFieldChange('delivery.email.targets', newRecipients.map(e => ({ to: [e] })))
	}

	// Handle add webhook
	const handleAddWebhook = () => {
		const url = newWebhook.trim()
		if (!url) {
			setWebhookError(is_cn ? '请输入 Webhook URL' : 'Please enter a Webhook URL')
			return
		}
		if (!isValidUrl(url)) {
			setWebhookError(is_cn ? 'URL 格式不正确，需以 http:// 或 https:// 开头' : 'Invalid URL, must start with http:// or https://')
			return
		}
		if (webhookTargets.some(t => t.url === url)) {
			setWebhookError(is_cn ? '该 URL 已添加' : 'URL already added')
			return
		}
		const newTarget = { url, secret: newWebhookSecret.trim() || undefined }
		const newTargets = [...webhookTargets, newTarget]
		setWebhookTargets(newTargets)
		handleFieldChange('delivery.webhook.targets', newTargets.map(t => ({ url: t.url, secret: t.secret })))
		handleFieldChange('delivery.webhook.enabled', true)
		setNewWebhook('')
		setNewWebhookSecret('')
		setWebhookError('')
	}

	// Handle remove webhook
	const handleRemoveWebhook = (index: number) => {
		const newTargets = webhookTargets.filter((_, i) => i !== index)
		setWebhookTargets(newTargets)
		handleFieldChange('delivery.webhook.targets', newTargets.map(t => ({ url: t.url, secret: t.secret })))
		if (newTargets.length === 0) {
			handleFieldChange('delivery.webhook.enabled', false)
		}
	}

	// Handle add process
	const handleAddProcess = () => {
		const process = newProcess.trim()
		if (!process) return
		if (processes.includes(process)) return
		const newProcesses = [...processes, process]
		setProcesses(newProcesses)
		handleFieldChange('delivery.process.targets', newProcesses.map(p => ({ process: p })))
		handleFieldChange('delivery.process.enabled', true)
		setNewProcess('')
	}

	// Handle remove process
	const handleRemoveProcess = (index: number) => {
		const newProcesses = processes.filter((_, i) => i !== index)
		setProcesses(newProcesses)
		handleFieldChange('delivery.process.targets', newProcesses.map(p => ({ process: p })))
		if (newProcesses.length === 0) {
			handleFieldChange('delivery.process.enabled', false)
		}
	}

	// Handle delete robot
	const handleDelete = async () => {
		if (!robot?.member_id) return

		setDeleting(true)
		try {
			const result = await deleteRobot(robot.member_id)
			if (result?.deleted) {
				message.success(is_cn ? '删除成功' : 'Deleted successfully')
				setShowDeleteConfirm(false)
				onDelete?.()
			} else {
				// Check for 409 conflict (robot is running)
				if (apiError?.includes('running') || apiError?.includes('conflict') || apiError?.includes('409')) {
					message.error(is_cn 
						? '该智能体正在执行任务，请等待任务完成后再删除' 
						: 'This agent is currently running tasks. Please wait for tasks to complete before deleting.'
					)
				} else {
					message.error(apiError || (is_cn ? '删除失败' : 'Failed to delete'))
				}
			}
		} catch (error: any) {
			console.error('Failed to delete:', error)
			// Handle 409 conflict error
			if (error?.status === 409 || error?.message?.includes('running')) {
				message.error(is_cn 
					? '该智能体正在执行任务，请等待任务完成后再删除' 
					: 'This agent is currently running tasks. Please wait for tasks to complete before deleting.'
				)
			} else {
				message.error(is_cn ? '删除失败' : 'Failed to delete')
			}
		} finally {
			setDeleting(false)
		}
	}

	return (
		<div className={styles.panelInner}>
			<div className={styles.panelTitle}>
				{is_cn ? '高级配置' : 'Advanced Settings'}
			</div>

			{/* ==================== Delivery Section ==================== */}
			<div className={styles.sectionTitle}>
				{is_cn ? '交付设置' : 'Delivery'}
			</div>
			<div className={styles.sectionHint}>
				{is_cn ? '执行结果默认发送给直属主管' : 'Results are sent to manager by default'}
			</div>

			{/* Additional Email Recipients */}
			<div className={styles.formItem}>
				<label className={styles.formLabel}>
					{is_cn ? '额外收件人' : 'Additional Recipients'}
				</label>
				{emailRecipients.length > 0 && (
					<div className={styles.tagList}>
						{emailRecipients.map((email, index) => (
							<div key={index} className={styles.tag}>
								<span>{email}</span>
								<div
									className={styles.tagRemove}
									onClick={() => handleRemoveEmail(index)}
								>
									<Icon name='material-close' size={12} />
								</div>
							</div>
						))}
					</div>
				)}
				<div className={styles.addItemRow}>
					<Input
						value={newEmail}
						onChange={(value) => {
							setNewEmail(String(value))
							if (emailError) setEmailError('')
						}}
						schema={{
							type: 'string',
							placeholder: is_cn ? '输入邮箱地址' : 'Enter email address'
						}}
						error={emailError}
						hasError={!!emailError}
					/>
					<div className={styles.addItemButton} onClick={handleAddEmail}>
						<Icon name='material-add' size={16} />
					</div>
				</div>
			</div>

			{/* Webhook */}
			<div className={styles.formItem}>
				<label className={styles.formLabel}>Webhook</label>
				{webhookTargets.length > 0 && (
					<div className={styles.webhookList}>
						{webhookTargets.map((target, index) => (
							<div key={index} className={styles.webhookItem}>
								<div className={styles.webhookUrl}>
									<span>{target.url}</span>
									{target.secret && (
										<span className={styles.webhookSecretBadge}>
											<Icon name='material-lock' size={12} />
											Secret
										</span>
									)}
								</div>
								<div
									className={styles.tagRemove}
									onClick={() => handleRemoveWebhook(index)}
								>
									<Icon name='material-close' size={12} />
								</div>
							</div>
						))}
					</div>
				)}
				<div className={styles.webhookInputRow}>
					<div className={styles.webhookInputs}>
						<Input
							value={newWebhook}
							onChange={(value) => {
								setNewWebhook(String(value))
								if (webhookError) setWebhookError('')
							}}
							schema={{
								type: 'string',
								placeholder: 'https://example.com/webhook'
							}}
							error={webhookError}
							hasError={!!webhookError}
						/>
						<InputPassword
							value={newWebhookSecret}
							onChange={(value) => setNewWebhookSecret(String(value))}
							schema={{
								type: 'string',
								placeholder: is_cn ? 'Secret（可选）' : 'Secret (optional)'
							}}
						/>
					</div>
					<div className={styles.addItemButton} onClick={handleAddWebhook}>
						<Icon name='material-add' size={16} />
					</div>
				</div>
			</div>

			{/* Yao Process */}
			<div className={styles.formItem}>
				<label className={styles.formLabel}>Yao Process</label>
				{processes.length > 0 && (
					<div className={styles.tagList}>
						{processes.map((process, index) => (
							<div key={index} className={styles.tag}>
								<span className={styles.tagCode}>{process}</span>
								<div
									className={styles.tagRemove}
									onClick={() => handleRemoveProcess(index)}
								>
									<Icon name='material-close' size={12} />
								</div>
							</div>
						))}
					</div>
				)}
				<div className={styles.addItemRow}>
					<Input
						value={newProcess}
						onChange={(value) => setNewProcess(String(value))}
						schema={{
							type: 'string',
							placeholder: is_cn ? '如 scripts.notify.Send' : 'e.g. scripts.notify.Send'
						}}
					/>
					<div className={styles.addItemButton} onClick={handleAddProcess}>
						<Icon name='material-add' size={16} />
					</div>
				</div>
			</div>

			{/* ==================== Concurrency Section ==================== */}
			<div className={styles.sectionTitle}>
				{is_cn ? '并发控制' : 'Concurrency'}
			</div>

			<div className={styles.concurrencyGrid}>
				{/* Row 1 */}
				<label className={styles.concurrencyLabel}>
					{is_cn ? '最大并发' : 'Max concurrent'}
				</label>
				<div className={styles.concurrencyInput}>
					<InputNumber
						value={formData['quota.max'] ?? 2}
						onChange={(value) => handleFieldChange('quota.max', value)}
						schema={{ type: 'integer', minimum: 1, maximum: 10 }}
					/>
				</div>
				<span className={styles.concurrencyUnit}>{is_cn ? '个任务' : 'tasks'}</span>

				<label className={styles.concurrencyLabel}>
					{is_cn ? '最大队列' : 'Max queue'}
				</label>
				<div className={styles.concurrencyInput}>
					<InputNumber
						value={formData['quota.queue'] ?? 10}
						onChange={(value) => handleFieldChange('quota.queue', value)}
						schema={{ type: 'integer', minimum: 1, maximum: 100 }}
					/>
				</div>
				<span className={styles.concurrencyUnit}>{is_cn ? '个等待' : 'pending'}</span>

				{/* Row 2 */}
				<label className={styles.concurrencyLabel}>
					{is_cn ? '优先级' : 'Priority'}
				</label>
				<div className={styles.concurrencyInput}>
					<InputNumber
						value={formData['quota.priority'] ?? 5}
						onChange={(value) => handleFieldChange('quota.priority', value)}
						schema={{ type: 'integer', minimum: 1, maximum: 10 }}
					/>
				</div>
				<span className={styles.concurrencyUnit}>(1-10)</span>

				<label className={styles.concurrencyLabel}>
					{is_cn ? '超时时间' : 'Timeout'}
				</label>
				<div className={styles.concurrencyInput}>
					<InputNumber
						value={formData['executor.timeout'] ?? 30}
						onChange={(value) => handleFieldChange('executor.timeout', value)}
						schema={{ type: 'integer', minimum: 1 }}
					/>
				</div>
				<span className={styles.concurrencyUnit}>{is_cn ? '分钟' : 'minutes'}</span>
			</div>

			{/* ==================== Testing Section ==================== */}
			<div className={styles.sectionTitle}>
				{is_cn ? '测试' : 'Testing'}
			</div>

			<div className={styles.formItem}>
				<div className={styles.switchRow}>
					<Switch
						value={formData['executor.mode'] === 'dryrun'}
						onChange={(value) => handleFieldChange('executor.mode', value ? 'dryrun' : 'standard')}
						schema={{ type: 'boolean' }}
					/>
					<span className={styles.switchLabel}>
						{is_cn ? '试运行模式' : 'Dry run mode'}
					</span>
					<span className={styles.switchHint}>
						{is_cn ? '（模拟执行，不实际操作）' : '(simulate without executing)'}
					</span>
				</div>
			</div>

			{/* ==================== Learning Section ==================== */}
			<div className={styles.sectionTitle}>
				{is_cn ? '学习' : 'Learning'}
			</div>

			<div className={styles.formItem}>
				<div className={styles.switchRow}>
					<Switch
						value={formData['learn.on'] || false}
						onChange={(value) => handleFieldChange('learn.on', value)}
						schema={{ type: 'boolean' }}
					/>
					<span className={styles.switchLabel}>
						{is_cn ? '从经验中学习' : 'Learn from experience'}
					</span>
				</div>

				{formData['learn.on'] && (
					<div className={styles.switchContent}>
						<div className={styles.learnOptions}>
							<label className={styles.formLabel}>
								{is_cn ? '学习内容' : 'Learn from'}
							</label>
							<CheckboxGroup
								value={formData['learn.types'] || ['execution', 'feedback', 'insight']}
								onChange={(value) => handleFieldChange('learn.types', value)}
								schema={{
									type: 'array',
									enum: LEARN_TYPES.map(t => ({
										label: is_cn ? t.label_cn : t.label,
										value: t.value
									}))
								}}
							/>
						</div>

						<div className={styles.learnKeep}>
							<label className={styles.formLabel}>
								{is_cn ? '保留时间' : 'Keep for'}
							</label>
							<div className={styles.keepRow}>
								<InputNumber
									value={formData['learn.keep'] ?? 90}
									onChange={(value) => handleFieldChange('learn.keep', value)}
									schema={{ type: 'integer', minimum: 0 }}
								/>
								<span className={styles.keepUnit}>
									{is_cn ? '天（0 = 永久保留）' : 'days (0 = forever)'}
								</span>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* ==================== Triggers Section ==================== */}
			<div className={styles.sectionTitle}>
				{is_cn ? '触发器' : 'Triggers'}
			</div>

			<div className={styles.formItem}>
				<div className={styles.switchRow}>
					<Switch
						value={formData['triggers.intervene.enabled'] ?? true}
						onChange={(value) => handleFieldChange('triggers.intervene.enabled', value)}
						schema={{ type: 'boolean' }}
					/>
					<span className={styles.switchLabel}>
						{is_cn ? '接受临时任务' : 'Accept ad-hoc tasks'}
					</span>
				</div>
			</div>

			<div className={styles.formItem}>
				<div className={styles.switchRow}>
					<Switch
						value={formData['triggers.event.enabled'] || false}
						onChange={(value) => handleFieldChange('triggers.event.enabled', value)}
						schema={{ type: 'boolean' }}
					/>
					<span className={styles.switchLabel}>
						{is_cn ? '事件触发' : 'Trigger on events'}
					</span>
					<span className={styles.switchHint}>
						{is_cn ? '（webhook / 数据库）' : '(webhook / database)'}
					</span>
				</div>
			</div>

			{/* ==================== Developer Options Section ==================== */}
			<div className={styles.sectionTitle}>
				{is_cn ? '开发者选项' : 'Developer Options'}
			</div>
			<div className={styles.sectionHint}>
				{is_cn 
					? '自定义各阶段的执行智能体，仅限开发者使用，通常无需修改' 
					: 'Customize execution agents, for developers only, usually no need to change'}
			</div>

			<div className={styles.phaseList}>
				{PHASES
					.filter(phase => !phase.autonomousOnly || autonomousMode)
					.map(phase => (
						<div key={phase.key} className={styles.phaseItem}>
							<div className={styles.phaseLabel}>
								{is_cn ? phase.label_cn : phase.label_en}
							</div>
							<div className={styles.phaseSelect}>
								<Select
									value={formData[`resources.phases.${phase.key}`] || phase.default}
									onChange={(value) => handleFieldChange(`resources.phases.${phase.key}`, value)}
									schema={{
										type: 'string',
										enum: getPhaseAgentOptions(
											phase.key, 
											phase.type, 
											phase.default, 
											formData[`resources.phases.${phase.key}`]
										)
									}}
								/>
							</div>
							<div className={styles.phaseDesc}>
								{is_cn ? phase.desc_cn : phase.desc_en}
							</div>
						</div>
					))}
			</div>

			{/* ==================== Danger Zone ==================== */}
			<div className={styles.dangerZone}>
				<div className={styles.dangerZoneTitle}>
					{is_cn ? '危险区域' : 'Danger Zone'}
				</div>
				<div className={styles.dangerZoneContent}>
					<div className={styles.dangerZoneItem}>
						<div className={styles.dangerZoneInfo}>
							<div className={styles.dangerZoneLabel}>
								{is_cn ? '删除智能体' : 'Delete Agent'}
							</div>
							<div className={styles.dangerZoneDesc}>
								{is_cn 
									? '删除后所有执行历史和配置将被永久清除，此操作不可撤销'
									: 'All execution history and configuration will be permanently deleted. This action cannot be undone.'}
							</div>
						</div>
						<button
							className={styles.dangerButton}
							onClick={() => setShowDeleteConfirm(true)}
						>
							<Icon name='material-delete_outline' size={16} />
							<span>{is_cn ? '删除' : 'Delete'}</span>
						</button>
					</div>
				</div>
			</div>

			{/* Delete Confirmation Dialog */}
			{showDeleteConfirm && (
				<div className={styles.deleteOverlay} onClick={() => !deleting && setShowDeleteConfirm(false)}>
					<div className={styles.deleteDialog} onClick={e => e.stopPropagation()}>
						<div className={styles.deleteDialogIcon}>
							<Icon name='material-warning' size={32} />
						</div>
						<h3 className={styles.deleteDialogTitle}>
							{is_cn ? '确认删除' : 'Confirm Delete'}
						</h3>
						<p className={styles.deleteDialogText}>
							{is_cn
								? `此操作不可撤销，所有执行历史和配置将被永久删除。`
								: `This action cannot be undone. All execution history and configuration will be permanently deleted.`
							}
						</p>
						<div className={styles.deleteDialogInput}>
							<label>
								{is_cn
									? <>请输入 <strong>{robot.display_name}</strong> 以确认删除</>
									: <>Type <strong>{robot.display_name}</strong> to confirm</>
								}
							</label>
							<input
								type='text'
								value={deleteConfirmName}
								onChange={e => setDeleteConfirmName(e.target.value)}
								placeholder={robot.display_name}
								autoFocus
							/>
						</div>
						<div className={styles.deleteDialogActions}>
							<button
								className={styles.deleteDialogCancel}
								onClick={() => {
									setShowDeleteConfirm(false)
									setDeleteConfirmName('')
								}}
								disabled={deleting}
							>
								{is_cn ? '取消' : 'Cancel'}
							</button>
							<button
								className={styles.deleteDialogConfirm}
								onClick={handleDelete}
								disabled={deleting || deleteConfirmName !== robot.display_name}
							>
								{deleting ? (
									<>
										<Icon name='material-hourglass_empty' size={14} />
										<span>{is_cn ? '删除中...' : 'Deleting...'}</span>
									</>
								) : (
									<span>{is_cn ? '确认删除' : 'Delete'}</span>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default AdvancedPanel
