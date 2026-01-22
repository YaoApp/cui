import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Modal, message, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import { Input, Select, TextArea, RadioGroup, CheckboxGroup } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import { useRobots } from '@/hooks/useRobots'
import { useGlobal } from '@/context/app'
import { Agent } from '@/openapi/agent/api'
import { MCP } from '@/openapi/mcp/api'
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
 * - robot_email (Email + domain)
 * - manager_id (Manager)
 * - autonomous_mode (Work Mode)
 * 
 * Step 2: Identity
 * - system_prompt (Role & Responsibilities)
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
		robot_email_prefix: '',
		robot_email_domain: '',
		manager_id: '',
		autonomous_mode: false,
		system_prompt: '',
		agents: [],
		mcp_servers: []
	})

	// UI state
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [submitting, setSubmitting] = useState(false)
	const [generatingPrompt, setGeneratingPrompt] = useState(false)
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

	// Refs to track data loading
	const configLoadedRef = useRef(false)
	const userMembersLoadedRef = useRef(false)
	const agentsLoadedRef = useRef(false)
	const mcpLoadedRef = useRef(false)

	// Get team ID
	const teamId = global.user?.team_id || global.user?.user_id || ''

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
						// Set default email domain
						if (response.data.robot?.email_domains?.[0]?.domain) {
							setFormData(prev => ({
								...prev,
								robot_email_domain: response.data.robot.email_domains[0].domain
							}))
						}
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

	// Reset when modal closes
	useEffect(() => {
		if (!visible) {
			configLoadedRef.current = false
			userMembersLoadedRef.current = false
			agentsLoadedRef.current = false
			mcpLoadedRef.current = false
		}
	}, [visible])

	// Email domains from config
	const emailDomains = useMemo(() => {
		return teamConfig?.robot?.email_domains?.map((domain) => ({
			label: `@${domain.domain}`,
			value: domain.domain || ''
		})) || []
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

	// Reset form when modal opens
	useEffect(() => {
		if (visible) {
			setCurrentStep(1)
			setFormData({
				display_name: '',
				robot_email_prefix: '',
				robot_email_domain: teamConfig?.robot?.email_domains?.[0]?.domain || '',
				manager_id: '',
				autonomous_mode: false,
				system_prompt: '',
				agents: [],
				mcp_servers: []
			})
			setErrors({})
			setSubmitting(false)
			setGeneratingPrompt(false)
		}
	}, [visible, teamConfig])

	// Check if form is dirty
	const isDirty = useMemo(() => {
		return !!(
			formData.display_name ||
			formData.robot_email_prefix ||
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

		if (!formData.robot_email_prefix?.trim()) {
			newErrors.robot_email_prefix = is_cn ? '请输入邮箱' : 'Email is required'
		} else if (!/^[a-zA-Z0-9._-]+$/.test(formData.robot_email_prefix)) {
			newErrors.robot_email_prefix = is_cn ? '邮箱格式不正确' : 'Invalid email format'
		}

		// Keep existing email error if any (from blur check)
		if (errors.robot_email_prefix && formData.robot_email_prefix?.trim()) {
			newErrors.robot_email_prefix = errors.robot_email_prefix
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

		// Agents are optional now
		// if (!formData.agents?.length) {
		// 	newErrors.agents = is_cn ? '请至少选择一个可协作的智能体' : 'Select at least one AI Assistant'
		// }

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Handle email blur - check uniqueness
	const handleEmailBlur = async () => {
		if (!formData.robot_email_prefix?.trim() || !teamId || !window.$app?.openapi) {
			return
		}

		const fullEmail = `${formData.robot_email_prefix}@${formData.robot_email_domain}`

		try {
			const openapi = window.$app.openapi
			const auth = new UserAuth(openapi)
			const teamsAPI = new UserTeams(openapi, auth)
			const response = await teamsAPI.CheckRobotEmail(teamId, fullEmail)

			if (openapi.IsError(response)) {
				console.error('Failed to check robot email:', response)
				return
			}

			if (response.data?.exists) {
				setErrors(prev => ({
					...prev,
					robot_email_prefix: is_cn ? '该机器人邮箱已被使用' : 'This robot email is already in use'
				}))
			} else {
				setErrors(prev => {
					const newErrors = { ...prev }
					delete newErrors.robot_email_prefix
					return newErrors
				})
			}
		} catch (error) {
			console.error('Failed to check robot email:', error)
		}
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

	// Handle AI generate prompt
	const handleGeneratePrompt = async () => {
		if (generatingPrompt) return

		setGeneratingPrompt(true)
		try {
			// Mock: Generate based on name
			await new Promise(resolve => setTimeout(resolve, 1500))
			
			const name = formData.display_name || (is_cn ? '智能体' : 'Agent')
			const mockPrompt = is_cn
				? `你是 ${name}，一位专业的智能体。\n\n你的主要职责包括：\n- 分析数据并生成报告\n- 提供专业建议和见解\n- 协助团队完成各项任务\n\n请保持专业、准确、高效的工作态度。`
				: `You are ${name}, a professional AI teammate.\n\nYour primary responsibilities include:\n- Analyze data and generate reports\n- Provide professional advice and insights\n- Assist the team in completing various tasks\n\nPlease maintain a professional, accurate, and efficient work attitude.`

			handleFieldChange('system_prompt', mockPrompt)
		} finally {
			setGeneratingPrompt(false)
		}
	}

	// Handle form submit
	const handleSubmit = async () => {
		if (!validateStep2()) return

		setSubmitting(true)
		try {
			// Generate member_id from email prefix
			const memberId = formData.robot_email_prefix.toLowerCase().replace(/[^a-z0-9]/g, '-')

			// Call API to create robot
			const result = await createRobot({
				member_id: memberId,
				team_id: teamId,
				display_name: formData.display_name,
				robot_email: `${formData.robot_email_prefix}@${formData.robot_email_domain}`,
				manager_id: formData.manager_id || undefined,
				autonomous_mode: formData.autonomous_mode,
				system_prompt: formData.system_prompt,
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
							{is_cn ? '创建智能体' : 'Create Agent'}
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
									? '为智能体设置名称、邮箱和工作模式' 
									: 'Configure name, email and work mode for your AI teammate'}
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

								{/* Email */}
								<div className={styles.formItem}>
									<label className={styles.formLabel}>
										{is_cn ? '邮箱' : 'Email'}
										<span className={styles.required}>*</span>
										<Tooltip
											title={
												is_cn
													? 'AI 成员可通过此邮箱接收和发送邮件'
													: 'The AI member can receive and send emails through this address'
											}
											placement='top'
										>
											<span className={styles.helpIconWrapper}>
												<Icon name='material-help' size={14} className={styles.helpIcon} />
											</span>
										</Tooltip>
									</label>
									<div className={styles.emailInput}>
										<Input
											value={formData.robot_email_prefix}
											onChange={(value) => handleFieldChange('robot_email_prefix', value)}
											onBlur={handleEmailBlur}
											schema={{
												type: 'string',
												placeholder: is_cn ? '邮箱前缀' : 'email prefix'
											}}
											error={errors.robot_email_prefix}
											hasError={!!errors.robot_email_prefix}
										/>
										<span className={styles.emailAt}>@</span>
										<Select
											value={formData.robot_email_domain}
											onChange={(value) => {
												handleFieldChange('robot_email_domain', value)
												// Re-check email when domain changes
												if (formData.robot_email_prefix?.trim()) {
													setTimeout(handleEmailBlur, 100)
												}
											}}
											schema={{
												type: 'string',
												enum: emailDomains,
												placeholder: is_cn ? '选择域名' : 'Select domain'
											}}
										/>
									</div>
								</div>

								{/* Manager */}
								<div className={styles.formItem}>
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

								{/* Work Mode */}
								<div className={styles.formItem}>
									<label className={styles.formLabel}>
										{is_cn ? '工作模式' : 'Work Mode'}
										<span className={styles.required}>*</span>
									</label>
									<RadioGroup
										value={formData.autonomous_mode}
										onChange={(value) => handleFieldChange('autonomous_mode', value)}
										schema={{
											type: 'boolean',
											enum: [
												{ label: is_cn ? '自主模式' : 'Autonomous', value: true },
												{ label: is_cn ? '按需模式' : 'On Demand', value: false }
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
							<div className={styles.stepTitle}>
								{is_cn ? '设置身份信息' : 'Set up identity'}
							</div>
							<div className={styles.stepDescription}>
								{is_cn 
									? '定义智能体的角色职责和可用的助手' 
									: 'Define the role, responsibilities and available assistants'}
							</div>

							<div className={styles.formContent}>
								{/* Role & Responsibilities */}
								<div className={styles.formItem}>
									<div className={styles.labelWithAction}>
										<label className={styles.formLabel}>
											{is_cn ? '角色与职责' : 'Role & Responsibilities'}
											<span className={styles.required}>*</span>
										</label>
										<div
											className={`${styles.generateButton} ${generatingPrompt ? styles.generating : ''}`}
											onClick={generatingPrompt ? undefined : handleGeneratePrompt}
										>
											<Icon name={generatingPrompt ? 'material-hourglass_empty' : 'material-auto_awesome'} size={14} />
											<span>{generatingPrompt ? (is_cn ? '生成中...' : 'Generating...') : (is_cn ? '生成' : 'Generate')}</span>
										</div>
									</div>
									<TextArea
										value={formData.system_prompt}
										onChange={(value) => handleFieldChange('system_prompt', value)}
										schema={{
											type: 'string',
											placeholder: is_cn 
												? '描述智能体的角色定位和主要职责...' 
												: 'Describe the role and responsibilities of this AI teammate...',
											rows: 6
										}}
										error={errors.system_prompt}
										hasError={!!errors.system_prompt}
									/>
								</div>

								{/* Accessible AI Assistants */}
								{agentOptions.length > 0 && (
									<div className={styles.formItem}>
										<label className={styles.formLabel}>
											{is_cn ? '可协作的智能体' : 'Accessible AI Assistants'}
											{agentsLoading && (
												<span className={styles.loadingHint}>
													{is_cn ? ' (加载中...)' : ' (Loading...)'}
												</span>
											)}
										</label>
										<CheckboxGroup
											value={formData.agents}
											onChange={(value) => handleFieldChange('agents', value)}
											schema={{
												type: 'array',
												enum: agentOptions
											}}
											error={errors.agents}
											hasError={!!errors.agents}
										/>
									</div>
								)}

								{/* MCP Tools */}
								{mcpOptions.length > 0 && (
									<div className={styles.formItem}>
										<label className={styles.formLabel}>
											{is_cn ? '可使用的工具' : 'Available Tools'}
											{mcpLoading && (
												<span className={styles.loadingHint}>
													{is_cn ? ' (加载中...)' : ' (Loading...)'}
												</span>
											)}
										</label>
										<CheckboxGroup
											value={formData.mcp_servers}
											onChange={(value) => handleFieldChange('mcp_servers', value)}
											schema={{
												type: 'array',
												enum: mcpOptions
											}}
										/>
									</div>
								)}
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
								disabled={!!errors.robot_email_prefix}
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
										<span>{is_cn ? '创建智能体' : 'Create Agent'}</span>
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
