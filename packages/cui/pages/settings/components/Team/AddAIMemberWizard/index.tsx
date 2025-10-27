import { useState, useEffect, useRef } from 'react'
import { Modal, Tooltip } from 'antd'
import { Button } from '@/components/ui'
import { Input, Select, TextArea, CheckboxGroup, RadioGroup, InputNumber } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import { TeamConfig } from '@/openapi/user/types'
import { Agent as AgentType } from '@/openapi/agent/types'
import { MCPServer } from '@/openapi/mcp/types'
import { LLMProvider } from '@/openapi/llm/types'
import { Agent } from '@/openapi/agent/api'
import { MCP } from '@/openapi/mcp/api'
import { LLM } from '@/openapi/llm/api'
import { OpenAPI } from '@/openapi/openapi'
import { UserAuth } from '@/openapi/user/auth'
import { UserTeams } from '@/openapi/user/teams'
import styles from './index.less'
import commonStyles from '@/components/ui/inputs/common.less'

interface AddAIMemberWizardProps {
	visible: boolean
	onClose: () => void
	onAdd: (values: AIMemberValues) => Promise<void>
	config: TeamConfig | null
	configLoading: boolean
	adding: boolean
	members: any[]
	is_cn: boolean
	teamId?: string
}

export interface AIMemberValues {
	name: string
	email?: string // Display-only email for robot (optional)
	robot_email: string // Globally unique robot email (required)
	bio?: string
	role: string
	report_to?: string
	prompt: string
	llm?: string
	agents?: string[]
	mcp_tools?: string[]
	autonomous_mode?: string
	cost_limit?: number
}

const AddAIMemberWizard = ({
	visible,
	onClose,
	onAdd,
	config,
	configLoading,
	adding,
	members,
	is_cn,
	teamId
}: AddAIMemberWizardProps) => {
	// Get default values from config
	const defaultLLM = config?.robot?.defaults?.llm || 'gpt-4-turbo'
	const defaultAutonomousMode = config?.robot?.defaults?.autonomous_mode ? 'enabled' : 'disabled'
	const defaultCostLimit = config?.robot?.defaults?.cost_limit || 100
	const defaultEmailDomain = config?.robot?.email_domains?.[0]?.domain
		? `@${config.robot.email_domains[0].domain}`
		: '@example.com'

	const [currentStep, setCurrentStep] = useState(0)
	const [formValues, setFormValues] = useState<Partial<AIMemberValues>>({
		role: config?.roles?.find((role) => role.default)?.role_id || 'team_member',
		llm: defaultLLM,
		autonomous_mode: defaultAutonomousMode,
		cost_limit: defaultCostLimit
	})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [generatingPrompt, setGeneratingPrompt] = useState(false)
	const [emailPrefix, setEmailPrefix] = useState('')
	const [emailDomain, setEmailDomain] = useState(defaultEmailDomain)

	// API data states
	const [agents, setAgents] = useState<AgentType[]>([])
	const [agentsLoading, setAgentsLoading] = useState(false)
	const [mcpServers, setMCPServers] = useState<MCPServer[]>([])
	const [mcpLoading, setMCPLoading] = useState(false)
	const [llmProviders, setLLMProviders] = useState<LLMProvider[]>([])
	const [llmLoading, setLLMLoading] = useState(false)
	const [userMembers, setUserMembers] = useState<any[]>([])
	const [userMembersLoading, setUserMembersLoading] = useState(false)

	// Use refs to track if data has been loaded to avoid infinite loops
	const agentsLoadedRef = useRef(false)
	const mcpLoadedRef = useRef(false)
	const llmLoadedRef = useRef(false)
	const userMembersLoadedRef = useRef(false)

	// Update form defaults when config changes
	useEffect(() => {
		if (config) {
			setFormValues((prev) => ({
				...prev,
				role: config.roles?.find((role) => role.default)?.role_id || prev.role,
				llm: config.robot?.defaults?.llm || prev.llm,
				autonomous_mode: config.robot?.defaults?.autonomous_mode ? 'enabled' : 'disabled',
				cost_limit: config.robot?.defaults?.cost_limit || prev.cost_limit
			}))

			if (config.robot?.email_domains?.[0]?.domain) {
				setEmailDomain(`@${config.robot.email_domains[0].domain}`)
			}
		}
	}, [config])

	// Load API data when user navigates to step 3 (AI Settings)
	useEffect(() => {
		if (currentStep === 2 && visible && window.$app?.openapi) {
			const openapi = window.$app.openapi

			// Initialize API instances
			const agentAPI = new Agent(openapi)
			const mcpAPI = new MCP(openapi)
			const llmAPI = new LLM(openapi)

			// Load agents - only once
			if (!agentsLoadedRef.current && !agentsLoading) {
				agentsLoadedRef.current = true
				setAgentsLoading(true)
				agentAPI
					.List({})
					.then((response) => {
						console.log('Agents loaded:', response)
						if (response?.data) {
							setAgents(response.data)
						}
					})
					.catch((error) => {
						console.error('Failed to load agents:', error)
						agentsLoadedRef.current = false // Allow retry on error
					})
					.finally(() => {
						setAgentsLoading(false)
					})
			}

			// Load MCP servers - only once
			if (!mcpLoadedRef.current && !mcpLoading) {
				mcpLoadedRef.current = true
				setMCPLoading(true)
				mcpAPI.ListServers()
					.then((servers) => {
						console.log('MCP servers loaded:', servers)
						if (servers) {
							setMCPServers(servers)
						}
					})
					.catch((error) => {
						console.error('Failed to load MCP servers:', error)
						mcpLoadedRef.current = false // Allow retry on error
					})
					.finally(() => {
						setMCPLoading(false)
					})
			}

			// Load LLM providers - only once
			if (!llmLoadedRef.current && !llmLoading) {
				llmLoadedRef.current = true
				setLLMLoading(true)
				llmAPI.ListProviders()
					.then((providers) => {
						if (providers && Array.isArray(providers)) {
							setLLMProviders(providers)
						}
					})
					.catch((error) => {
						console.error('Failed to load LLM providers:', error)
						llmLoadedRef.current = false // Allow retry on error
					})
					.finally(() => {
						setLLMLoading(false)
					})
			}
		}
	}, [currentStep, visible])

	// Load user members when modal opens (for direct manager selection)
	useEffect(() => {
		if (visible && teamId && window.$app?.openapi && !userMembersLoadedRef.current && !userMembersLoading) {
			userMembersLoadedRef.current = true
			setUserMembersLoading(true)

			const openapi = window.$app.openapi
			const auth = new UserAuth(openapi)
			const teamsAPI = new UserTeams(openapi, auth)

			teamsAPI
				.GetMembers(teamId, {
					member_type: 'user', // Only get human members
					status: 'active', // Only get active members
					fields: ['member_id', 'display_name', 'email', 'member_type', 'status', 'user_id'] // Only request necessary fields
				})
				.then((response) => {
					console.log('User members loaded:', response)
					if (response?.data?.data && Array.isArray(response.data.data)) {
						setUserMembers(response.data.data)
					}
				})
				.catch((error) => {
					console.error('Failed to load user members:', error)
					userMembersLoadedRef.current = false // Allow retry on error
				})
				.finally(() => {
					setUserMembersLoading(false)
				})
		}
	}, [visible, teamId])

	// Reset loaded flag when modal closes
	useEffect(() => {
		if (!visible) {
			userMembersLoadedRef.current = false
		}
	}, [visible])

	// Email domains from config
	const emailDomains =
		config?.robot?.email_domains?.map((domain) => ({
			label: domain.domain || '',
			value: `@${domain.domain || ''}`
		})) || []

	// Transform LLM providers to select options
	const llmOptions = (llmProviders || []).map((provider) => ({
		label: provider.label,
		value: provider.value
	}))

	// Transform agents to select options
	const agentOptions = (agents || []).map((agent) => ({
		label: agent.name,
		value: agent.assistant_id
	}))

	// Transform MCP servers to select options
	const mcpOptions = (mcpServers || []).map((server) => ({
		label: server.label || server.name,
		value: server.value || server.name
	}))

	const roleOptions =
		config?.roles
			?.filter((role) => !role.hidden)
			.map((role) => ({
				label: role.label,
				value: role.role_id
			})) || []

	// 成员选项（用于汇报上级）- 只显示人类成员
	const memberOptions = userMembers
		.filter((member) => member.member_type === 'user' && member.status === 'active')
		.map((member) => {
			const userName =
				member.display_name || member.email || member.user_id || (is_cn ? '未知用户' : 'Unknown User')
			const userEmail = member.email || ''
			return {
				label: userEmail ? `${userName} (${userEmail})` : userName,
				value: member.member_id || member.user_id || ''
			}
		})

	const handleClose = () => {
		setFormValues({
			role: config?.roles?.find((role) => role.default)?.role_id || 'team_member',
			llm: defaultLLM,
			autonomous_mode: defaultAutonomousMode,
			cost_limit: defaultCostLimit
		})
		setErrors({})
		setCurrentStep(0)
		setEmailPrefix('')
		setEmailDomain(defaultEmailDomain)
		// Reset API data
		setAgents([])
		setMCPServers([])
		setLLMProviders([])
		// Reset loaded refs
		agentsLoadedRef.current = false
		mcpLoadedRef.current = false
		llmLoadedRef.current = false
		onClose()
	}

	const validateStep = (step: number): boolean => {
		const newErrors: Record<string, string> = {}

		switch (step) {
			case 0:
				if (!formValues.name?.trim()) {
					newErrors.name = is_cn ? '请输入名称' : 'Please enter name'
				}
				if (!emailPrefix.trim()) {
					newErrors.email = is_cn ? '请输入邮箱前缀' : 'Please enter email prefix'
				}
				// 如果已经有邮箱错误（通过 onBlur 检查得到的），保留该错误
				if (errors.email && emailPrefix.trim()) {
					newErrors.email = errors.email
				}
				if (!formValues.role) {
					newErrors.role = is_cn ? '请选择角色' : 'Please select a role'
				}
				break
			case 1:
				if (!formValues.prompt?.trim()) {
					newErrors.prompt = is_cn ? '请输入身份设定' : 'Please enter identity and role'
				}
				break
			case 2:
				// LLM is optional, no validation needed
				break
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleNext = () => {
		if (validateStep(currentStep)) {
			setCurrentStep(currentStep + 1)
		}
	}

	const handlePrev = () => {
		setCurrentStep(currentStep - 1)
		setErrors({})
	}

	const handleSubmit = async () => {
		if (validateStep(currentStep)) {
			try {
				// 组合完整邮箱地址 - robot_email 是必填的
				const fullEmail = emailPrefix + emailDomain
				// 只设置 robot_email（全局唯一），不自动补充 email
				await onAdd({ ...formValues, robot_email: fullEmail } as AIMemberValues)
				handleClose()
			} catch (error) {
				console.error('Submit failed:', error)
			}
		}
	}

	const handleFieldChange = (field: string, value: any) => {
		setFormValues((prev) => ({ ...prev, [field]: value }))
		// 清除该字段的错误
		if (errors[field]) {
			setErrors((prev) => {
				const newErrors = { ...prev }
				delete newErrors[field]
				return newErrors
			})
		}
	}

	const handleEmailBlur = async () => {
		// 只有当邮箱前缀不为空时才检查
		if (!emailPrefix.trim()) {
			return
		}

		// 需要 teamId 才能检查
		if (!teamId) {
			return
		}

		// 需要 window.$app?.openapi 才能调用 API
		if (!window.$app?.openapi) {
			console.warn('OpenAPI not initialized')
			return
		}

		const fullEmail = emailPrefix + emailDomain

		try {
			const openapi = new OpenAPI(window.$app.openapi.config)
			const auth = new UserAuth(openapi)
			const userTeams = new UserTeams(openapi, auth)
			// 使用新的 CheckRobotEmail 方法检查全局唯一性
			const response = await userTeams.CheckRobotEmail(teamId, fullEmail)

			if (openapi.IsError(response)) {
				// API 错误，不显示为邮箱错误
				console.error('Failed to check robot email:', response)
				return
			}

			if (response.data?.exists) {
				setErrors((prev) => ({
					...prev,
					email: is_cn ? '该机器人邮箱已被使用' : 'This robot email is already in use'
				}))
			} else {
				// 清除邮箱错误（如果有的话）
				setErrors((prev) => {
					const newErrors = { ...prev }
					delete newErrors.email
					return newErrors
				})
			}
		} catch (error) {
			console.error('Failed to check robot email:', error)
		}
	}

	const handleGeneratePrompt = async () => {
		// 检查是否填写了必要信息
		if (!formValues.name || !formValues.role) {
			// TODO: 显示提示信息
			return
		}

		setGeneratingPrompt(true)
		try {
			// TODO: 调用 AI 接口生成身份设定
			// 这里先用 mock 数据演示
			await new Promise((resolve) => setTimeout(resolve, 1500))

			const roleLabel = config?.roles?.find((r) => r.role_id === formValues.role)?.label || formValues.role
			const mockPrompt = is_cn
				? `你是 ${formValues.name}，担任团队${roleLabel}。你的主要职责包括：

1. 协助团队成员完成日常工作任务
2. 提供专业建议和技术支持
3. 定期向直接主管汇报工作进展
4. 保持积极主动的工作态度，发现问题并及时解决

在工作中，你应该保持专业、高效、负责的态度，与团队成员保持良好沟通。`
				: `You are ${formValues.name}, serving as a ${roleLabel} in the team. Your main responsibilities include:

1. Assist team members with daily work tasks
2. Provide professional advice and technical support
3. Regularly report work progress to direct manager
4. Maintain a proactive work attitude, identify and solve problems promptly

In your work, you should maintain a professional, efficient, and responsible attitude, and communicate well with team members.`

			handleFieldChange('prompt', mockPrompt)
		} catch (error) {
			console.error('Failed to generate prompt:', error)
		} finally {
			setGeneratingPrompt(false)
		}
	}

	const steps = [
		{ title: is_cn ? '成员资料' : 'Profile', icon: 'material-person' },
		{ title: is_cn ? '身份设定' : 'Identity', icon: 'material-badge' },
		{ title: is_cn ? 'AI 配置' : 'AI Settings', icon: 'material-tune' }
	]

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<div className={styles.stepContent}>
						<div className={styles.formItem}>
							<label className={styles.formLabel}>
								<span className={styles.required}>*</span>
								{is_cn ? '邮箱地址' : 'Email Address'}
								<Tooltip
									title={
										is_cn
											? 'AI 成员可通过此邮箱接收和发送邮件。你可以向该邮箱发送需求或转发待处理的邮件，AI 成员会自动处理并回复。同时，AI 成员也会使用此邮箱向主管或其他成员发送工作邮件。'
											: 'The AI member can receive and send emails through this address. You can send requests or forward emails to it for automatic processing and reply. The AI member will also use this email to send work emails to managers or other members.'
									}
									placement='top'
									overlayStyle={{ maxWidth: 350 }}
									getPopupContainer={(trigger) =>
										trigger.parentElement || document.body
									}
								>
									<span className={styles.helpIconWrapper}>
										<Icon
											name='material-help'
											size={14}
											className={styles.helpIcon}
										/>
									</span>
								</Tooltip>
							</label>
							<div className={styles.emailInput}>
								<Input
									value={emailPrefix}
									onChange={(value) => {
										setEmailPrefix(String(value))
										if (errors.email) {
											setErrors((prev) => {
												const newErrors = { ...prev }
												delete newErrors.email
												return newErrors
											})
										}
									}}
									onBlur={handleEmailBlur}
									schema={{
										type: 'string',
										placeholder: is_cn ? '请输入邮箱前缀' : 'Enter email prefix'
									}}
									error=''
									hasError={false}
								/>
								<span className={styles.emailAt}>@</span>
								<Select
									value={emailDomain}
									onChange={(value) => {
										setEmailDomain(String(value))
										// 清除邮箱错误（如果有的话）
										if (errors.email) {
											setErrors((prev) => {
												const newErrors = { ...prev }
												delete newErrors.email
												return newErrors
											})
										}
										// 当域名改变时，如果已有邮箱前缀，重新检查
										if (emailPrefix.trim()) {
											// 延迟执行，确保 emailDomain 已更新
											setTimeout(handleEmailBlur, 100)
										}
									}}
									schema={{
										type: 'string',
										enum: emailDomains,
										placeholder: is_cn ? '选择域名' : 'Select domain'
									}}
									error=''
									hasError={false}
									tabIndex={-1}
								/>
							</div>
							{errors.email && (
								<div className={commonStyles.errorMessage}>{errors.email}</div>
							)}
						</div>

						<div className={styles.formItem}>
							<label className={styles.formLabel}>
								<span className={styles.required}>*</span>
								{is_cn ? '名称' : 'Name'}
							</label>
							<Input
								value={formValues.name}
								onChange={(value) => handleFieldChange('name', value)}
								schema={{
									type: 'string',
									placeholder: is_cn ? '请输入名称' : 'Enter name'
								}}
								error={errors.name || ''}
								hasError={!!errors.name}
							/>
						</div>

						<div className={styles.formItem}>
							<label className={styles.formLabel}>{is_cn ? '简介' : 'Bio'}</label>
							<Input
								value={formValues.bio}
								onChange={(value) => handleFieldChange('bio', value)}
								schema={{
									type: 'string',
									placeholder: is_cn
										? '简要介绍这个 AI 成员的特点'
										: 'Brief introduction about this AI member'
								}}
								error=''
								hasError={false}
							/>
						</div>

						<div className={styles.formRowTwo}>
							<div className={styles.formItemHalf}>
								<label className={styles.formLabel}>
									<span className={styles.required}>*</span>
									{is_cn ? '角色' : 'Role'}
								</label>
								<Select
									value={formValues.role}
									onChange={(value) => handleFieldChange('role', value)}
									schema={{
										type: 'string',
										enum: roleOptions,
										placeholder: is_cn ? '选择角色' : 'Select a role'
									}}
									error={errors.role || ''}
									hasError={!!errors.role}
								/>
							</div>

							<div className={styles.formItemHalf}>
								<label className={styles.formLabel}>
									{is_cn ? '直接主管' : 'Direct Manager'}
									<Tooltip
										title={
											is_cn
												? 'AI 成员会定期向直接主管发送工作总结和进度报告'
												: 'AI member will regularly send work summaries and progress reports to the direct manager'
										}
										getPopupContainer={(trigger) =>
											trigger.parentElement || document.body
										}
									>
										<span className={styles.helpIconWrapper}>
											<Icon
												name='material-help'
												size={14}
												className={styles.helpIcon}
											/>
										</span>
									</Tooltip>
								</label>
								<Select
									value={formValues.report_to}
									onChange={(value) => handleFieldChange('report_to', value)}
									schema={{
										type: 'string',
										enum: memberOptions,
										placeholder: is_cn
											? '选择直接主管（可选）'
											: 'Select manager (optional)'
									}}
									error=''
									hasError={false}
								/>
							</div>
						</div>
					</div>
				)

			case 1:
				return (
					<div className={styles.stepContent}>
						<div className={styles.formItem}>
							<div className={styles.labelWithAction}>
								<label className={styles.formLabel}>
									<span className={styles.required}>*</span>
									{is_cn ? '身份设定' : 'Identity & Role'}
								</label>
								<div className={styles.generateContainer}>
									{generatingPrompt && (
										<span className={styles.generatingText}>
											{is_cn ? '生成中...' : 'Generating...'}
										</span>
									)}
									<Tooltip
										title={is_cn ? '使用 AI 生成身份设定' : 'Generate with AI'}
									>
										<div
											className={`${styles.generateButton} ${
												generatingPrompt ||
												!formValues.name ||
												!formValues.role
													? styles.disabled
													: ''
											}`}
											onClick={() => {
												if (
													!generatingPrompt &&
													formValues.name &&
													formValues.role
												) {
													handleGeneratePrompt()
												}
											}}
										>
											<Icon
												name='material-auto_awesome'
												size={16}
												className={styles.generateIcon}
											/>
										</div>
									</Tooltip>
								</div>
							</div>
							<TextArea
								value={formValues.prompt}
								onChange={(value) => handleFieldChange('prompt', value)}
								schema={{
									type: 'string',
									placeholder: is_cn
										? '描述 AI 成员的身份、工作职责和目标任务。例如：\n\n你是一位资深的前端开发工程师，负责审查前端代码质量、优化性能问题。主要工作包括：\n1. 每日检查代码提交，发现潜在问题\n2. 提供技术方案和最佳实践建议\n3. 维护组件库文档和示例代码'
										: "Describe the AI member's identity, responsibilities and key tasks. For example:\n\nYou are a senior frontend developer responsible for reviewing code quality and optimizing performance. Main responsibilities include:\n1. Daily code review to identify potential issues\n2. Provide technical solutions and best practice recommendations\n3. Maintain component library documentation and examples",
									rows: 8
								}}
								error={errors.prompt || ''}
								hasError={!!errors.prompt}
							/>
						</div>
					</div>
				)

			case 2:
				return (
					<div className={styles.stepContent}>
						<div className={styles.formRowThree}>
							{/* Only show LLM selector if there are providers available */}
							{llmOptions.length > 0 && (
								<div className={styles.formItemThird}>
									<label className={styles.formLabel}>
										{is_cn ? '语言模型' : 'Language Model'}
										{llmLoading && (
											<span className={styles.loadingHint}>
												{is_cn ? ' (加载中...)' : ' (Loading...)'}
											</span>
										)}
									</label>
									<Select
										value={formValues.llm}
										onChange={(value) => handleFieldChange('llm', value)}
										schema={{
											type: 'string',
											enum: llmOptions,
											placeholder: is_cn
												? '选择语言模型'
												: 'Select language model'
										}}
										error={errors.llm || ''}
										hasError={!!errors.llm}
									/>
								</div>
							)}

							<div className={styles.formItemThird}>
								<label className={styles.formLabel}>
									{is_cn ? '消费上限（美元/月）' : 'Cost Limit (USD/month)'}
								</label>
								<InputNumber
									value={formValues.cost_limit}
									onChange={(value) => handleFieldChange('cost_limit', value)}
									schema={{
										type: 'number',
										placeholder: is_cn
											? '设置每月消费上限'
											: 'Set monthly cost limit'
									}}
									error=''
									hasError={false}
								/>
							</div>

							<div className={styles.formItemThird}>
								<label className={styles.formLabel}>
									{is_cn ? '自主模式' : 'Autonomous Mode'}
									<Tooltip
										title={
											is_cn
												? '开启后，AI 成员会像真人一样主动思考、主动寻找需要处理的事项并自主完成'
												: 'When enabled, AI members will proactively think, identify tasks to handle, and complete them autonomously like a real person'
										}
										getPopupContainer={(trigger) =>
											trigger.parentElement || document.body
										}
									>
										<span className={styles.helpIconWrapper}>
											<Icon
												name='material-help'
												size={14}
												className={styles.helpIcon}
											/>
										</span>
									</Tooltip>
								</label>
								<RadioGroup
									value={formValues.autonomous_mode}
									onChange={(value) => handleFieldChange('autonomous_mode', value)}
									schema={{
										type: 'string',
										enum: [
											{
												label: is_cn ? '开启' : 'On',
												value: 'enabled'
											},
											{
												label: is_cn ? '关闭' : 'Off',
												value: 'disabled'
											}
										]
									}}
									error=''
									hasError={false}
								/>
							</div>
						</div>

						{/* Only show Agents selector if there are agents available */}
						{agentOptions.length > 0 && (
							<div className={styles.formItem}>
								<label className={styles.formLabel}>
									{is_cn ? '可访问的智能体' : 'Accessible Agents'}
									{agentsLoading && (
										<span className={styles.loadingHint}>
											{is_cn ? ' (加载中...)' : ' (Loading...)'}
										</span>
									)}
								</label>
								<CheckboxGroup
									value={formValues.agents}
									onChange={(value) => handleFieldChange('agents', value)}
									schema={{
										type: 'array',
										enum: agentOptions
									}}
									error=''
									hasError={false}
								/>
							</div>
						)}

						{/* Only show Tools selector if there are MCP servers available */}
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
									value={formValues.mcp_tools}
									onChange={(value) => handleFieldChange('mcp_tools', value)}
									schema={{
										type: 'array',
										enum: mcpOptions
									}}
									error=''
									hasError={false}
								/>
							</div>
						)}
					</div>
				)

			default:
				return null
		}
	}

	const renderFooter = () => {
		return (
			<div className={styles.wizardFooter}>
				<div className={styles.footerLeft}>
					<Button onClick={handleClose} disabled={adding}>
						{is_cn ? '取消' : 'Cancel'}
					</Button>
				</div>
				<div className={styles.footerRight}>
					{currentStep > 0 && (
						<Button onClick={handlePrev} disabled={adding}>
							{is_cn ? '上一步' : 'Previous'}
						</Button>
					)}
					{currentStep < steps.length - 1 ? (
						<Button
							type='primary'
							onClick={handleNext}
							disabled={adding || (currentStep === 0 && !!errors.email)}
						>
							{is_cn ? '下一步' : 'Next'}
						</Button>
					) : (
						<Button type='primary' onClick={handleSubmit} loading={adding} disabled={adding}>
							{is_cn ? '完成创建' : 'Complete'}
						</Button>
					)}
				</div>
			</div>
		)
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.titleSection}>
						<Icon name='material-psychology' size={16} className={styles.titleIcon} />
						<span className={styles.modalTitle}>
							{is_cn ? '添加 AI 成员' : 'Add AI Member'}
						</span>
					</div>
					<div className={styles.closeButton} onClick={handleClose}>
						<Icon name='material-close' size={16} className={styles.closeIcon} />
					</div>
				</div>
			}
			open={visible}
			onCancel={handleClose}
			footer={renderFooter()}
			width={680}
			className={styles.wizardModal}
			destroyOnClose
			closable={false}
			maskClosable={false}
			keyboard={false}
		>
			<div className={styles.wizardContent}>
				<div className={styles.stepsContainer}>
					<div className={styles.customSteps}>
						{steps.map((step, index) => (
							<div
								key={index}
								className={`${styles.stepItem} ${
									index === currentStep
										? styles.stepActive
										: index < currentStep
										? styles.stepCompleted
										: ''
								}`}
							>
								<div className={styles.stepIcon}>
									{index < currentStep ? '✓' : index + 1}
								</div>
								<div className={styles.stepTitle}>{step.title}</div>
								{index < steps.length - 1 && <div className={styles.stepLine} />}
							</div>
						))}
					</div>
				</div>

				{renderStepContent()}
			</div>
		</Modal>
	)
}

export default AddAIMemberWizard
