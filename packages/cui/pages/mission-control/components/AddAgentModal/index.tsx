import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Modal, message, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import { Input, Select, RadioGroup, MarkdownEditor } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import AgentPicker from '@/components/AgentPicker'
import AIGenerator from '@/components/AIGenerator'
import type { PickerItem } from '@/components/AgentPicker/types'
import { useRobots } from '@/hooks/useRobots'
import { useWorkspace } from '@/hooks/useComputerWorkspace'
import { useGlobal } from '@/context/app'
import { Agent } from '@/openapi/agent/api'
import { MCP } from '@/openapi/mcp/api'
import { LLM } from '@/openapi'
import type { LLMProvider } from '@/openapi/llm/types'
import { UserAuth } from '@/openapi/user/auth'
import { UserTeams } from '@/openapi/user/teams'
import type { Agent as AgentType } from '@/openapi/agent/types'
import type { MCPServer } from '@/openapi/mcp/types'
import type { TeamConfig } from '@/openapi/user/types'
import styles from './index.less'

interface AddAgentModalProps {
	visible: boolean
	onClose: () => void
	onCreated?: () => void
}

type StepType = 1 | 2

/**
 * AddAgentModal - Create Agent (Two-Step Wizard)
 * 
 * Step 1: Basic Info
 * - display_name (Name)
 * - manager_id (Manager)
 * - autonomous_mode (Work Mode)
 * - workspace (Workspace)
 * 
 * Step 2: Identity
 * - system_prompt (Role & Responsibilities)
 * - language_model (AI Model)
 * - agents (AI Assistants)
 * - mcp_servers (MCP Tools)
 */
const AddAgentModal: React.FC<AddAgentModalProps> = ({ visible, onClose, onCreated }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()

	// Robot API hook
	const { createRobot, error: apiError } = useRobots()

	// Step state
	const [currentStep, setCurrentStep] = useState<StepType>(1)

	// Form state
	const [formData, setFormData] = useState<Record<string, any>>({
		display_name: '',
		role_id: '',
		manager_id: '',
		autonomous_mode: false,
		system_prompt: '',
		agents: [],
		mcp_servers: []
	})

	// UI state
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [submitting, setSubmitting] = useState(false)
	const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

	// API data state
	const [teamConfig, setTeamConfig] = useState<TeamConfig | null>(null)
	const [configLoading, setConfigLoading] = useState(false)
	const [userMembers, setUserMembers] = useState<any[]>([])
	const [userMembersLoading, setUserMembersLoading] = useState(false)
	const [agents, setAgents] = useState<AgentType[]>([])
	const [agentsLoading, setAgentsLoading] = useState(false)
	const [mcpServers, setMCPServers] = useState<MCPServer[]>([])
	const [mcpLoading, setMCPLoading] = useState(false)
	const [llmProviders, setLlmProviders] = useState<LLMProvider[]>([])
	const [llmLoading, setLlmLoading] = useState(false)

	// Workspace hook
	const { loading: workspaceLoading, fetchWorkspaces, workspaceOptionsGrouped } = useWorkspace()

	// Picker visibility state
	const [agentPickerVisible, setAgentPickerVisible] = useState(false)
	const [mcpPickerVisible, setMcpPickerVisible] = useState(false)

	// Refs to track data loading
	const configLoadedRef = useRef(false)
	const userMembersLoadedRef = useRef(false)
	const agentsLoadedRef = useRef(false)
	const mcpLoadedRef = useRef(false)
	const llmLoadedRef = useRef(false)

	// Get team ID
	const teamId = global.user?.team_id || String(global.user?.id || '')

	// Load team config when modal opens
	useEffect(() => {
		if (visible && teamId && window.$app?.openapi && !configLoadedRef.current && !configLoading) {
			configLoadedRef.current = true
			setConfigLoading(true)

			const openapi = window.$app.openapi
			const auth = new UserAuth(openapi)
			const teamsAPI = new UserTeams(openapi, auth)

			teamsAPI
				.GetConfig(teamId)
				.then((response) => {
					if (openapi.IsError(response)) {
						console.error('Failed to load team config:', response)
						configLoadedRef.current = false
						return
					}
					if (response.data) {
						setTeamConfig(response.data)
					}
				})
				.catch((error) => {
					console.error('Failed to load team config:', error)
					configLoadedRef.current = false
				})
				.finally(() => {
					setConfigLoading(false)
				})
		}
	}, [visible, teamId])

	// Load user members (for manager selection)
	useEffect(() => {
		if (visible && teamId && window.$app?.openapi && !userMembersLoadedRef.current && !userMembersLoading) {
			userMembersLoadedRef.current = true
			setUserMembersLoading(true)

			const openapi = window.$app.openapi
			const auth = new UserAuth(openapi)
			const teamsAPI = new UserTeams(openapi, auth)

			teamsAPI
				.GetMembers(teamId, {
					member_type: 'user',
					status: 'active',
					fields: ['member_id', 'display_name', 'email', 'member_type', 'status', 'user_id']
				})
				.then((response) => {
					if (response?.data?.data && Array.isArray(response.data.data)) {
						setUserMembers(response.data.data)
					}
				})
				.catch((error) => {
					console.error('Failed to load user members:', error)
					userMembersLoadedRef.current = false
				})
				.finally(() => {
					setUserMembersLoading(false)
				})
		}
	}, [visible, teamId])

	// Load agents when entering step 2
	useEffect(() => {
		if (visible && currentStep === 2 && window.$app?.openapi && !agentsLoadedRef.current && !agentsLoading) {
			agentsLoadedRef.current = true
			setAgentsLoading(true)

			const openapi = window.$app.openapi
			const agentAPI = new Agent(openapi)

			agentAPI.assistants
				.List({})
				.then((response) => {
					if (openapi.IsError(response)) {
						console.error('Failed to load agents:', response.error)
						agentsLoadedRef.current = false
						return
					}
					const data = openapi.GetData(response)
					if (data?.data) {
						setAgents(data.data)
					}
				})
				.catch((error) => {
					console.error('Failed to load agents:', error)
					agentsLoadedRef.current = false
				})
				.finally(() => {
					setAgentsLoading(false)
				})
		}
	}, [visible, currentStep])

	// Load MCP servers when entering step 2
	useEffect(() => {
		if (visible && currentStep === 2 && window.$app?.openapi && !mcpLoadedRef.current && !mcpLoading) {
			mcpLoadedRef.current = true
			setMCPLoading(true)

			const openapi = window.$app.openapi
			const mcpAPI = new MCP(openapi)

			mcpAPI
				.ListServers()
				.then((servers) => {
					if (servers) {
						setMCPServers(servers)
					}
				})
				.catch((error) => {
					console.error('Failed to load MCP servers:', error)
					mcpLoadedRef.current = false
				})
				.finally(() => {
					setMCPLoading(false)
				})
		}
	}, [visible, currentStep])

	// Load LLM providers when entering step 2
	useEffect(() => {
		if (visible && currentStep === 2 && window.$app?.openapi && !llmLoadedRef.current && !llmLoading) {
			llmLoadedRef.current = true
			setLlmLoading(true)

			const llmAPI = new LLM(window.$app.openapi)
			llmAPI.ListProviders({ capabilities: ['tool_calls'] })
				.then((providers) => setLlmProviders(providers || []))
				.catch((err) => {
					console.error('Failed to load LLM providers:', err)
					llmLoadedRef.current = false
				})
				.finally(() => setLlmLoading(false))
		}
	}, [visible, currentStep])

	useEffect(() => {
		if (visible) {
			fetchWorkspaces()
		}
	}, [visible])

	// Reset when modal closes
	useEffect(() => {
		if (!visible) {
			configLoadedRef.current = false
			userMembersLoadedRef.current = false
			agentsLoadedRef.current = false
			mcpLoadedRef.current = false
			llmLoadedRef.current = false
		}
	}, [visible])

	// Role options from team config
	const roleOptions = useMemo(() => {
		return teamConfig?.roles
			?.filter((role: any) => !role.hidden)
			.map((role: any) => ({
				label: role.label,
				value: role.role_id
			})) || []
	}, [teamConfig])

	// Default role from config
	const defaultRoleId = useMemo(() => {
		return teamConfig?.roles?.find((role: any) => role.default)?.role_id || ''
	}, [teamConfig])

	// Manager options
	const managerOptions = useMemo(() => {
		return userMembers
			.filter((m) => m.member_type === 'user' && m.status === 'active')
			.map((m) => {
				const userName = m.display_name || m.email || m.user_id || (is_cn ? '未知用户' : 'Unknown User')
				const userEmail = m.email || ''
				return {
					label: userEmail ? `${userName} (${userEmail})` : userName,
					value: m.member_id || m.user_id || ''
				}
			})
	}, [userMembers, is_cn])

	// Agent options
	const agentOptions = useMemo(() => {
		return (agents || []).map((agent) => ({
			label: agent.name || agent.assistant_id,
			value: agent.assistant_id
		}))
	}, [agents])

	// MCP server options
	const mcpOptions = useMemo(() => {
		return (mcpServers || []).map((server) => ({
			label: server.label || server.name,
			value: server.value || server.name
		}))
	}, [mcpServers])

	// LLM provider options
	const llmOptions = useMemo(() =>
		llmProviders.map((p) => ({ label: p.label, value: p.value })),
		[llmProviders]
	)

	// Selected items as PickerItem[] for AgentPicker value
	const selectedAgentItems: PickerItem[] = useMemo(() => {
		return (formData.agents || []).map((id: string) => {
			const agent = agentOptions.find((a) => a.value === id)
			return { value: id, label: agent?.label || id }
		})
	}, [formData.agents, agentOptions])

	const selectedMcpItems: PickerItem[] = useMemo(() => {
		return (formData.mcp_servers || []).map((id: string) => {
			const server = mcpOptions.find((s) => s.value === id)
			return { value: id, label: server?.label || id }
		})
	}, [formData.mcp_servers, mcpOptions])

	// Reset form when modal opens
	useEffect(() => {
		if (visible) {
			setCurrentStep(1)
			setFormData({
				display_name: '',
				role_id: defaultRoleId,
				manager_id: '',
				autonomous_mode: false,
				system_prompt: '',
				language_model: '',
				workspace: '',
				agents: [],
				mcp_servers: []
			})
			setErrors({})
			setSubmitting(false)
		}
	}, [visible, teamConfig])

	// Check if form is dirty
	const isDirty = useMemo(() => {
		return !!(
			formData.display_name ||
			formData.system_prompt ||
			formData.agents?.length > 0
		)
	}, [formData])

	// Handle field change
	const handleFieldChange = (field: string, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }))
		// Clear error when field is modified
		if (errors[field]) {
			setErrors(prev => {
				const next = { ...prev }
				delete next[field]
				return next
			})
		}
	}

	// Validate step 1
	const validateStep1 = (): boolean => {
		const newErrors: Record<string, string> = {}

		if (!formData.display_name?.trim()) {
			newErrors.display_name = is_cn ? '请输入名称' : 'Name is required'
		}

		if (!formData.role_id) {
			newErrors.role_id = is_cn ? '请选择身份' : 'Role is required'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Validate step 2
	const validateStep2 = (): boolean => {
		const newErrors: Record<string, string> = {}

		if (!formData.system_prompt?.trim()) {
			newErrors.system_prompt = is_cn ? '请输入角色与职责' : 'Role & Responsibilities is required'
		}

		if (!formData.language_model) {
			newErrors.language_model = is_cn ? '请选择 AI 模型' : 'AI Model is required'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Handle next step
	const handleNext = () => {
		if (validateStep1()) {
			setCurrentStep(2)
		}
	}

	// Handle previous step
	const handlePrev = () => {
		setCurrentStep(1)
		setErrors({})
	}

	// Handle form submit
	const handleSubmit = async () => {
		if (!validateStep2()) return

		setSubmitting(true)
		try {
			// Call API to create robot (member_id auto-generated by backend)
			const result = await createRobot({
				team_id: teamId,
				display_name: formData.display_name,
				role_id: formData.role_id || undefined,
				manager_id: formData.manager_id || undefined,
				autonomous_mode: formData.autonomous_mode,
				system_prompt: formData.system_prompt,
				language_model: formData.language_model || undefined,
				workspace: formData.workspace || undefined,
				agents: formData.agents?.length > 0 ? formData.agents : undefined,
				mcp_servers: formData.mcp_servers?.length > 0 ? formData.mcp_servers : undefined,
				status: 'active',
				robot_status: 'idle'
			})

			if (result) {
				onCreated?.()
				onClose()
			} else {
				message.error(apiError || (is_cn ? '创建失败，请重试' : 'Failed to create, please try again'))
			}
		} catch (error) {
			console.error('Failed to create agent:', error)
			message.error(is_cn ? '创建失败，请重试' : 'Failed to create, please try again')
		} finally {
			setSubmitting(false)
		}
	}

	// Handle close with confirmation
	const handleClose = () => {
		if (isDirty && !submitting) {
			setShowDiscardConfirm(true)
			return
		}
		onClose()
	}

	// Confirm discard
	const handleConfirmDiscard = () => {
		setShowDiscardConfirm(false)
		onClose()
	}

	// Cancel discard
	const handleCancelDiscard = () => {
		setShowDiscardConfirm(false)
	}

	// Step indicator
	const steps = [
		{ key: 1, label: is_cn ? '基本信息' : 'Basic Info' },
		{ key: 2, label: is_cn ? '身份设定' : 'Identity' }
	]

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.titleSection}>
						<Icon name='material-person_add' size={20} className={styles.titleIcon} />
						<span className={styles.modalTitle}>
							{is_cn ? '创建任务智能体' : 'Create Task Agent'}
						</span>
					</div>
					<div className={styles.steps}>
						{steps.map((step, index) => (
							<React.Fragment key={step.key}>
								<div 
									className={`${styles.stepItem} ${currentStep === step.key ? styles.stepActive : ''} ${currentStep > step.key ? styles.stepCompleted : ''}`}
								>
									<div className={styles.stepNumber}>
										{currentStep > step.key ? (
											<Icon name='material-check' size={14} />
										) : (
											step.key
										)}
									</div>
									<span className={styles.stepLabel}>{step.label}</span>
								</div>
								{index < steps.length - 1 && (
									<div className={`${styles.stepConnector} ${currentStep > step.key ? styles.stepConnectorActive : ''}`} />
								)}
							</React.Fragment>
						))}
					</div>
					<div className={styles.headerActions}>
						<button className={styles.iconButton} onClick={handleClose}>
							<Icon name='material-close' size={18} />
						</button>
					</div>
				</div>
			}
			open={visible}
			onCancel={handleClose}
			footer={null}
			width={880}
			style={{
				top: '10vh',
				paddingBottom: 0
			}}
			bodyStyle={{
				padding: 0
			}}
			destroyOnClose
			closable={false}
			className={styles.addAgentModal}
			maskClosable={!isDirty}
		>
			<div className={styles.modalBody}>
				<div className={styles.modalContent}>
					{/* Step 1: Basic Info */}
					{currentStep === 1 && (
						<div className={styles.stepContent}>
							<div className={styles.stepTitle}>
								{is_cn ? '设置基本信息' : 'Set up basic information'}
							</div>
						<div className={styles.stepDescription}>
							{is_cn 
								? '为任务智能体设置名称和工作模式' 
								: 'Configure name and work mode for your AI teammate'}
						</div>

							<div className={styles.formContent}>
								{/* Name */}
								<div className={styles.formItem}>
									<label className={styles.formLabel}>
										{is_cn ? '名称' : 'Name'}
										<span className={styles.required}>*</span>
									</label>
									<Input
										value={formData.display_name}
										onChange={(value) => handleFieldChange('display_name', value)}
										schema={{
											type: 'string',
											placeholder: is_cn ? '如：销售分析师' : 'e.g., Sales Analyst'
										}}
										error={errors.display_name}
										hasError={!!errors.display_name}
									/>
								</div>

								{/* Workspace */}
								<div className={styles.formItem}>
									<label className={styles.formLabel}>
										{is_cn ? '工作空间' : 'Workspace'}
										<Tooltip
											title={is_cn
												? '将任务智能体绑定到指定的工作空间环境'
												: 'Bind the agent to a specific workspace environment'
											}
											placement='top'
										>
											<span className={styles.helpIconWrapper}>
												<Icon name='material-help' size={14} className={styles.helpIcon} />
											</span>
										</Tooltip>
										{workspaceLoading && (
											<span className={styles.loadingHint}>
												{is_cn ? ' (加载中...)' : ' (Loading...)'}
											</span>
										)}
									</label>
									<Select
										value={formData.workspace || undefined}
										onChange={(value) => handleFieldChange('workspace', value || '')}
										schema={{
											type: 'string',
											enum: workspaceOptionsGrouped,
											placeholder: is_cn ? '选择工作空间（可选）' : 'Select workspace (optional)',
											searchable: true,
											allowClear: true
										}}
									/>
								</div>

							{/* Role and Manager - Two columns */}
								<div className={styles.formRow}>
									<div className={styles.formItemHalf}>
										<label className={styles.formLabel}>
											{is_cn ? '身份' : 'Role'}
											<span className={styles.required}>*</span>
										</label>
										<Select
											value={formData.role_id}
											onChange={(value) => handleFieldChange('role_id', value)}
											schema={{
												type: 'string',
												enum: roleOptions,
												placeholder: is_cn ? '选择身份' : 'Select role'
											}}
											error={errors.role_id}
											hasError={!!errors.role_id}
										/>
									</div>

									<div className={styles.formItemHalf}>
										<label className={styles.formLabel}>
											{is_cn ? '直属主管' : 'Manager'}
											<Tooltip
												title={
													is_cn
														? 'AI 成员会定期向直接主管发送工作总结和进度报告'
														: 'AI member will regularly send work summaries and progress reports to the direct manager'
												}
												placement='top'
											>
												<span className={styles.helpIconWrapper}>
													<Icon name='material-help' size={14} className={styles.helpIcon} />
												</span>
											</Tooltip>
											{userMembersLoading && (
												<span className={styles.loadingHint}>
													{is_cn ? ' (加载中...)' : ' (Loading...)'}
												</span>
											)}
										</label>
										<Select
											value={formData.manager_id}
											onChange={(value) => handleFieldChange('manager_id', value)}
											schema={{
												type: 'string',
												enum: managerOptions,
												placeholder: is_cn ? '选择主管（可选）' : 'Select manager (optional)'
											}}
											error={errors.manager_id}
											hasError={!!errors.manager_id}
										/>
										<div className={styles.fieldHint}>
											{is_cn ? '执行结果将发送给直属主管' : 'Results will be sent to the manager'}
										</div>
									</div>
								</div>

								{/* Work Mode */}
								<div className={styles.formItem}>
									<label className={styles.formLabel}>
										{is_cn ? '工作模式' : 'Work Mode'}
										<span className={styles.required}>*</span>
									</label>
									<RadioGroup
										value={String(formData.autonomous_mode)}
										onChange={(value) => handleFieldChange('autonomous_mode', value === 'true')}
										schema={{
											type: 'string',
											enum: [
												{ label: is_cn ? '自主模式' : 'Autonomous', value: 'true' },
												{ label: is_cn ? '按需模式' : 'On Demand', value: 'false' }
											]
										}}
									/>
									<div className={styles.fieldHint}>
										{formData.autonomous_mode 
											? (is_cn ? '按计划自主执行任务' : 'Executes tasks on schedule automatically')
											: (is_cn ? '等待手动指派任务' : 'Waits for manually assigned tasks')}
									</div>
								</div>
							</div>
						</div>
					)}

				{/* Step 2: Identity */}
				{currentStep === 2 && (
					<div className={styles.stepContent}>
						<div className={styles.stepTitleRow}>
							<div>
								<div className={styles.stepTitle}>
									{is_cn ? '设置身份信息' : 'Set up identity'}
								</div>
								<div className={styles.stepDescription}>
									{is_cn 
										? '定义任务智能体的角色职责和可用的专家' 
										: 'Define the role, responsibilities and available assistants'}
								</div>
							</div>
							{global?.agent_uses?.robot_prompt && (
								<AIGenerator
									assistantId={global.agent_uses.robot_prompt}
									context={() => {
										const agentNames = selectedAgentItems.map(a => a.label).join(', ')
										const mcpNames = selectedMcpItems.map(s => s.label).join(', ')
									const llmLabel = llmOptions.find(o => o.value === formData.language_model)?.label || ''
									const managerLabel = managerOptions.find(o => o.value === formData.manager_id)?.label || ''
									const snapshot = {
										display_name: formData.display_name || '',
											manager: formData.manager_id ? managerLabel : '',
											autonomous_mode: formData.autonomous_mode || false,
											system_prompt: formData.system_prompt || '',
											language_model: formData.language_model ? `${llmLabel} (${formData.language_model})` : '',
											agents: agentNames || '',
											mcp_servers: mcpNames || '',
											available_agents: agentOptions.map(a => `${a.label} (${a.value})`).join(', '),
											available_mcp_servers: mcpOptions.map(s => `${s.label} (${s.value})`).join(', '),
											available_language_models: llmOptions.map(o => `${o.label} (${o.value})`).join(', ')
										}
										return [{
											role: 'system',
											content: `Current robot configuration:\n${JSON.stringify(snapshot, null, 2)}`
										}]
									}}
									outputFormat="json"
									onStart={() => {}}
									onStream={(text, parsed) => {
										if (parsed?.system_prompt) handleFieldChange('system_prompt', parsed.system_prompt)
										if (parsed?.language_model) handleFieldChange('language_model', parsed.language_model)
										if (parsed?.agents) handleFieldChange('agents', parsed.agents)
										if (parsed?.mcp_servers) handleFieldChange('mcp_servers', parsed.mcp_servers)
									}}
									onComplete={(text, parsed) => {
										if (parsed) {
											if (parsed.system_prompt) handleFieldChange('system_prompt', parsed.system_prompt)
											if (parsed.language_model) handleFieldChange('language_model', parsed.language_model)
											if (parsed.agents) handleFieldChange('agents', parsed.agents)
											if (parsed.mcp_servers) handleFieldChange('mcp_servers', parsed.mcp_servers)
										} else {
											handleFieldChange('system_prompt', text)
											message.warning(is_cn ? 'AI 返回格式异常，仅回填了职责说明' : 'AI output format error, only prompt was filled')
										}
									}}
									onCancel={(text, parsed) => {
										if (parsed?.system_prompt) handleFieldChange('system_prompt', parsed.system_prompt)
									}}
									onError={(err) => {
										console.error('AI generate failed:', err)
										message.error(is_cn ? '生成失败' : 'Generation failed')
									}}
									placeholder={is_cn
										? '描述你需要什么样的任务智能体...\n\nCtrl+Enter 发送'
										: 'Describe what kind of agent you need...\n\nCtrl+Enter to send'
									}
									size="small"
								/>
							)}
						</div>

						<div className={styles.formContent}>
							{/* Role & Responsibilities */}
							<div className={styles.formItem}>
								<label className={styles.formLabel}>
									{is_cn ? '角色与职责' : 'Role & Responsibilities'}
									<span className={styles.required}>*</span>
								</label>
								<MarkdownEditor
									value={formData.system_prompt}
									onChange={(value) => handleFieldChange('system_prompt', value)}
									schema={{
										type: 'string',
										placeholder: is_cn 
											? '描述任务智能体的角色定位和主要职责...' 
											: 'Describe the role and responsibilities of this AI teammate...',
										rows: 6
									}}
									error={errors.system_prompt}
									hasError={!!errors.system_prompt}
									/>
								</div>

								{/* AI Model */}
								<div className={styles.formItem}>
									<label className={styles.formLabel}>
										{is_cn ? 'AI 模型' : 'AI Model'}
										<span className={styles.required}>*</span>
										{llmLoading && (
											<span className={styles.loadingHint}>
												{is_cn ? ' (加载中...)' : ' (Loading...)'}
											</span>
										)}
									</label>
									<Select
										value={formData.language_model}
										onChange={(value) => handleFieldChange('language_model', value)}
										schema={{
											type: 'string',
											enum: llmOptions,
											placeholder: is_cn ? '选择 AI 模型' : 'Select AI model',
											searchable: true
										}}
										error={errors.language_model}
										hasError={!!errors.language_model}
									/>
								</div>

							{/* Accessible AI Assistants */}
							<div className={styles.formItem}>
								<label className={styles.formLabel}>
									{is_cn ? '可协作的专家' : 'Accessible AI Experts'}
										{agentsLoading && (
											<span className={styles.loadingHint}>
												{is_cn ? ' (加载中...)' : ' (Loading...)'}
											</span>
										)}
									</label>
									<div className={styles.pickerTrigger}>
										{selectedAgentItems.length > 0 && (
											<div className={styles.pickerChips}>
												{selectedAgentItems.map((item) => (
													<div key={item.value} className={styles.pickerChip}>
														<span className={styles.pickerChipLabel}>{item.label}</span>
														<Icon
															name='material-close'
															size={12}
															className={styles.pickerChipRemove}
															onClick={() => handleFieldChange('agents', formData.agents.filter((id: string) => id !== item.value))}
														/>
													</div>
												))}
											</div>
										)}
										<button
											type='button'
											className={styles.pickerAddButton}
											onClick={() => setAgentPickerVisible(true)}
										>
											<Icon name='material-add' size={14} />
											<span>{is_cn ? '添加' : 'Add'}</span>
										</button>
									</div>
									{errors.agents && <div className={styles.fieldError}>{errors.agents}</div>}
									<AgentPicker
										visible={agentPickerVisible}
										onClose={() => setAgentPickerVisible(false)}
										onConfirm={(selected) => handleFieldChange('agents', selected.map((s) => s.value))}
										type='assistant'
										mode='multiple'
										value={selectedAgentItems}
										filter={{ types: ['assistant', 'robot'], automated: true }}
									/>
								</div>

								{/* MCP Tools */}
								<div className={styles.formItem}>
									<label className={styles.formLabel}>
										{is_cn ? '可使用的工具' : 'Available Tools'}
										{mcpLoading && (
											<span className={styles.loadingHint}>
												{is_cn ? ' (加载中...)' : ' (Loading...)'}
											</span>
										)}
									</label>
									<div className={styles.pickerTrigger}>
										{selectedMcpItems.length > 0 && (
											<div className={styles.pickerChips}>
												{selectedMcpItems.map((item) => (
													<div key={item.value} className={styles.pickerChip}>
														<span className={styles.pickerChipLabel}>{item.label}</span>
														<Icon
															name='material-close'
															size={12}
															className={styles.pickerChipRemove}
															onClick={() => handleFieldChange('mcp_servers', formData.mcp_servers.filter((id: string) => id !== item.value))}
														/>
													</div>
												))}
											</div>
										)}
										<button
											type='button'
											className={styles.pickerAddButton}
											onClick={() => setMcpPickerVisible(true)}
										>
											<Icon name='material-add' size={14} />
											<span>{is_cn ? '添加' : 'Add'}</span>
										</button>
									</div>
									<AgentPicker
										visible={mcpPickerVisible}
										onClose={() => setMcpPickerVisible(false)}
										onConfirm={(selected) => handleFieldChange('mcp_servers', selected.map((s) => s.value))}
										type='mcp'
										mode='multiple'
										value={selectedMcpItems}
									/>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className={styles.modalFooter}>
					{currentStep === 1 ? (
						<>
							<button className={styles.cancelButton} onClick={handleClose}>
								{is_cn ? '取消' : 'Cancel'}
							</button>
						<button 
							className={styles.nextButton} 
							onClick={handleNext}
						>
								<span>{is_cn ? '下一步' : 'Next'}</span>
								<Icon name='material-arrow_forward' size={16} />
							</button>
						</>
					) : (
						<>
							<button className={styles.prevButton} onClick={handlePrev}>
								<Icon name='material-arrow_back' size={16} />
								<span>{is_cn ? '上一步' : 'Back'}</span>
							</button>
							<button 
								className={styles.submitButton} 
								onClick={handleSubmit}
								disabled={submitting}
							>
								{submitting ? (
									<>
										<Icon name='material-hourglass_empty' size={16} />
										<span>{is_cn ? '创建中...' : 'Creating...'}</span>
									</>
								) : (
									<>
										<Icon name='material-check' size={16} />
										<span>{is_cn ? '创建任务智能体' : 'Create Task Agent'}</span>
									</>
								)}
							</button>
						</>
					)}
				</div>

				{/* Discard Confirmation Dialog */}
				{showDiscardConfirm && (
					<div className={styles.confirmOverlay} onClick={handleCancelDiscard}>
						<div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
							<div className={styles.confirmIcon}>
								<Icon name='material-warning' size={24} />
							</div>
							<div className={styles.confirmTitle}>
								{is_cn ? '放弃更改？' : 'Discard changes?'}
							</div>
							<div className={styles.confirmContent}>
								{is_cn 
									? '您填写的内容尚未保存，确定要放弃吗？' 
									: 'Your changes have not been saved. Are you sure you want to discard them?'}
							</div>
							<div className={styles.confirmActions}>
								<button className={styles.confirmCancelBtn} onClick={handleCancelDiscard}>
									{is_cn ? '继续编辑' : 'Keep Editing'}
								</button>
								<button className={styles.confirmDiscardBtn} onClick={handleConfirmDiscard}>
									{is_cn ? '放弃' : 'Discard'}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</Modal>
	)
}

export default AddAgentModal
