import { useState, useEffect, useRef } from 'react'
import { Modal, Tooltip } from 'antd'
import { Button } from '@/components/ui'
import { Input, Select, TextArea, CheckboxGroup, RadioGroup, InputNumber } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import { TeamConfig, TeamMember } from '@/openapi/user/types'
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

interface EditAIMemberProps {
	visible: boolean
	onClose: () => void
	onUpdate: (memberId: string, values: AIMemberValues) => Promise<void>
	member: TeamMember | null
	config: TeamConfig | null
	configLoading: boolean
	updating: boolean
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

const EditAIMember = ({
	visible,
	onClose,
	onUpdate,
	member,
	config,
	configLoading,
	updating,
	members,
	is_cn,
	teamId
}: EditAIMemberProps) => {
	const [activeTab, setActiveTab] = useState('profile')
	const [formValues, setFormValues] = useState<Partial<AIMemberValues>>({})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [emailPrefix, setEmailPrefix] = useState('')
	const [emailDomain, setEmailDomain] = useState('')

	// API data states
	const [agents, setAgents] = useState<AgentType[]>([])
	const [agentsLoading, setAgentsLoading] = useState(false)
	const [mcpServers, setMCPServers] = useState<MCPServer[]>([])
	const [mcpLoading, setMCPLoading] = useState(false)
	const [llmProviders, setLLMProviders] = useState<LLMProvider[]>([])
	const [llmLoading, setLLMLoading] = useState(false)
	const [userMembers, setUserMembers] = useState<any[]>([])
	const [userMembersLoading, setUserMembersLoading] = useState(false)

	// Use refs to track if data has been loaded
	const agentsLoadedRef = useRef(false)
	const mcpLoadedRef = useRef(false)
	const llmLoadedRef = useRef(false)
	const userMembersLoadedRef = useRef(false)

	// Load member detail data when modal opens
	useEffect(() => {
		const loadMemberDetail = async () => {
			if (!visible || !member || !teamId || !window.$app?.openapi) {
				return
			}

			try {
				const openapi = window.$app.openapi
				const auth = new UserAuth(openapi)
				const teamsAPI = new UserTeams(openapi, auth)

				// 调用详情 API 获取完整数据
				const response = await teamsAPI.GetMember(teamId, member.member_id)

				if (openapi.IsError(response)) {
					console.error('Failed to load member detail:', response)
					return
				}

				const memberDetail = response.data as any

				// Debug: 打印数据结构以便调试
				console.log('Loading member detail:', { memberDetail })

				// 拆分机器人邮箱为前缀和域名（机器人必须使用 robot_email 字段）
				const robotEmail = memberDetail.robot_email || ''
				const atIndex = robotEmail.indexOf('@')
				if (atIndex > 0) {
					setEmailPrefix(robotEmail.substring(0, atIndex))
					setEmailDomain(`@${robotEmail.substring(atIndex + 1)}`)
				} else {
					setEmailPrefix('')
					setEmailDomain(
						config?.robot?.email_domains?.[0]?.domain
							? `@${config.robot.email_domains[0].domain}`
							: '@example.com'
					)
				}

				setFormValues({
					name: memberDetail.display_name || '',
					robot_email: memberDetail.robot_email || '', // Use robot_email as the primary field
					email: memberDetail.email || '', // Display-only email (optional)
					bio: memberDetail.bio || '',
					role: memberDetail.role_id || '',
					report_to: memberDetail.manager_id || '',
					prompt: memberDetail.system_prompt || '',
					llm: memberDetail.language_model || config?.robot?.defaults?.llm || '',
					agents: memberDetail.agents || [],
					mcp_tools: memberDetail.mcp_servers || [],
					autonomous_mode: memberDetail.autonomous_mode ? 'enabled' : 'disabled',
					cost_limit: memberDetail.cost_limit || config?.robot?.defaults?.cost_limit || 100
				})
			} catch (error) {
				console.error('Error loading member detail:', error)
			}
		}

		loadMemberDetail()
	}, [visible, member, teamId, config])

	// Load API data when modal opens
	useEffect(() => {
		if (visible && window.$app?.openapi) {
			const openapi = window.$app.openapi

			// Initialize API instances
			const agentAPI = new Agent(openapi)
			const mcpAPI = new MCP(openapi)
			const llmAPI = new LLM(openapi)

			// Load agents
			if (!agentsLoadedRef.current && !agentsLoading) {
				agentsLoadedRef.current = true
				setAgentsLoading(true)
				agentAPI.assistants
					.List({})
					.then((response) => {
						if (response?.data) {
							setAgents(response.data)
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

			// Load MCP servers
			if (!mcpLoadedRef.current && !mcpLoading) {
				mcpLoadedRef.current = true
				setMCPLoading(true)
				mcpAPI.ListServers()
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

			// Load LLM providers
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
						llmLoadedRef.current = false
					})
					.finally(() => {
						setLLMLoading(false)
					})
			}
		}
	}, [visible])

	// Load user members when modal opens
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

	// Reset loaded flags when modal closes
	useEffect(() => {
		if (!visible) {
			agentsLoadedRef.current = false
			mcpLoadedRef.current = false
			llmLoadedRef.current = false
			userMembersLoadedRef.current = false
		}
	}, [visible])

	// Email domains from config
	const emailDomains =
		config?.robot?.email_domains?.map((domain) => ({
			label: domain.domain || '',
			value: `@${domain.domain || ''}`
		})) || []

	// Transform data to select options
	const llmOptions = (llmProviders || []).map((provider) => ({
		label: provider.label,
		value: provider.value
	}))

	const agentOptions = (agents || []).map((agent) => ({
		label: agent.name || agent.assistant_id,
		value: agent.assistant_id
	}))

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

	const memberOptions = userMembers
		.filter((m) => m.member_type === 'user' && m.status === 'active')
		.map((m) => {
			const userName = m.display_name || m.email || m.user_id || (is_cn ? '未知用户' : 'Unknown User')
			const userEmail = m.email || ''
			return {
				label: userEmail ? `${userName} (${userEmail})` : userName,
				value: m.member_id || m.user_id || ''
			}
		})

	const handleClose = () => {
		setFormValues({})
		setErrors({})
		setActiveTab('profile')
		setEmailPrefix('')
		setEmailDomain('')
		setAgents([])
		setMCPServers([])
		setLLMProviders([])
		setUserMembers([])
		onClose()
	}

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {}

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
		if (!formValues.prompt?.trim()) {
			newErrors.prompt = is_cn ? '请输入身份设定' : 'Please enter identity and role'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async () => {
		if (validateForm() && member) {
			try {
				// 组合完整邮箱地址 - robot_email 是必填的
				const fullEmail = emailPrefix + emailDomain
				// 只设置 robot_email（全局唯一），不自动补充 email
				await onUpdate(member.member_id, {
					...formValues,
					robot_email: fullEmail
				} as AIMemberValues)
				handleClose()
			} catch (error) {
				console.error('Submit failed:', error)
			}
		}
	}

	const handleFieldChange = (field: string, value: any) => {
		setFormValues((prev) => ({ ...prev, [field]: value }))
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

		// 如果机器人邮箱没有改变，不需要检查（机器人只使用 robot_email）
		if (fullEmail === member?.robot_email) {
			return
		}

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

	const renderProfileTab = () => {
		return (
			<div className={styles.tabContent}>
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
							getPopupContainer={(trigger) => trigger.parentElement || document.body}
						>
							<span className={styles.helpIconWrapper}>
								<Icon name='material-help' size={14} className={styles.helpIcon} />
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
					{errors.email && <div className={commonStyles.errorMessage}>{errors.email}</div>}
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
								getPopupContainer={(trigger) => trigger.parentElement || document.body}
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
	}

	const renderIdentityTab = () => {
		return (
			<div className={styles.tabContent}>
				<div className={styles.formItem}>
					<label className={styles.formLabel}>
						<span className={styles.required}>*</span>
						{is_cn ? '身份设定' : 'Identity & Role'}
					</label>
					<TextArea
						value={formValues.prompt}
						onChange={(value) => handleFieldChange('prompt', value)}
						schema={{
							type: 'string',
							placeholder: is_cn
								? '描述 AI 成员的身份、工作职责和目标任务...'
								: "Describe the AI member's identity, responsibilities and key tasks...",
							rows: 12
						}}
						error={errors.prompt || ''}
						hasError={!!errors.prompt}
					/>
				</div>
			</div>
		)
	}

	const renderSettingsTab = () => {
		return (
			<div className={styles.tabContent}>
				<div className={styles.formRowThree}>
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
									placeholder: is_cn ? '选择语言模型' : 'Select language model'
								}}
								error=''
								hasError={false}
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
								placeholder: is_cn ? '设置每月消费上限' : 'Set monthly cost limit'
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
								getPopupContainer={(trigger) => trigger.parentElement || document.body}
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
	}

	const tabs = [
		{
			key: 'profile',
			label: is_cn ? '成员资料' : 'Profile'
		},
		{
			key: 'identity',
			label: is_cn ? '身份设定' : 'Identity'
		},
		{
			key: 'settings',
			label: is_cn ? 'AI 配置' : 'AI Settings'
		}
	]

	const renderTabContent = () => {
		switch (activeTab) {
			case 'profile':
				return renderProfileTab()
			case 'identity':
				return renderIdentityTab()
			case 'settings':
				return renderSettingsTab()
			default:
				return renderProfileTab()
		}
	}

	const renderFooter = () => {
		return (
			<div className={styles.modalFooter}>
				<div className={styles.footerLeft}>
					<Button onClick={handleClose} disabled={updating}>
						{is_cn ? '取消' : 'Cancel'}
					</Button>
				</div>
				<div className={styles.footerRight}>
					<Button type='primary' onClick={handleSubmit} loading={updating} disabled={updating}>
						{is_cn ? '保存更改' : 'Save Changes'}
					</Button>
				</div>
			</div>
		)
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.titleSection}>
						<Icon name='material-edit' size={16} className={styles.titleIcon} />
						<span className={styles.modalTitle}>
							{is_cn ? '编辑 AI 成员' : 'Edit AI Member'}
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
			className={styles.editModal}
			destroyOnClose
			closable={false}
			maskClosable={false}
			keyboard={false}
		>
			<div className={styles.modalContent}>
				<div className={styles.tabsContainer}>
					<div className={styles.tabsNav}>
						{tabs.map((tab) => (
							<div
								key={tab.key}
								className={`${styles.tabItem} ${
									activeTab === tab.key ? styles.tabActive : ''
								}`}
								onClick={() => setActiveTab(tab.key)}
							>
								{tab.label}
							</div>
						))}
					</div>
				</div>
				<div className={styles.tabsContent}>{renderTabContent()}</div>
			</div>
		</Modal>
	)
}

export default EditAIMember
