import { useState } from 'react'
import { Modal, Tooltip } from 'antd'
import { Button } from '@/components/ui'
import { Input, Select, TextArea, CheckboxGroup, RadioGroup, InputNumber } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import { TeamConfig } from '@/openapi/user/types'
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
}

export interface AIMemberValues {
	name: string
	email: string
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
	is_cn
}: AddAIMemberWizardProps) => {
	const [currentStep, setCurrentStep] = useState(0)
	const [formValues, setFormValues] = useState<Partial<AIMemberValues>>({
		role: config?.roles?.find((role) => role.default)?.role_id || 'team_member',
		llm: 'gpt-4-turbo',
		autonomous_mode: 'enabled',
		cost_limit: 100
	})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [generatingPrompt, setGeneratingPrompt] = useState(false)
	const [emailPrefix, setEmailPrefix] = useState('')
	const [emailDomain, setEmailDomain] = useState('@example.com')

	// Mock 邮箱域名列表 - 后续从配置读取
	const emailDomains = [
		{ label: 'example.com', value: '@example.com' },
		{ label: 'company.com', value: '@company.com' },
		{ label: 'yaoapp.com', value: '@yaoapp.com' }
	]

	// Mock 数据 - 后续对接后端
	const mockLLMs = [
		{ label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
		{ label: 'GPT-4', value: 'gpt-4' },
		{ label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
		{ label: 'Claude 3 Opus', value: 'claude-3-opus' },
		{ label: 'Claude 3 Sonnet', value: 'claude-3-sonnet' }
	]
	const mockAgents = [
		{ label: is_cn ? '数据分析助手' : 'Data Analysis Assistant', value: 'data-analyst' },
		{ label: is_cn ? '代码审查助手' : 'Code Review Assistant', value: 'code-reviewer' },
		{ label: is_cn ? '文档生成助手' : 'Documentation Assistant', value: 'doc-generator' },
		{ label: is_cn ? '测试助手' : 'Testing Assistant', value: 'tester' },
		{ label: is_cn ? '项目管理助手' : 'Project Manager', value: 'project-manager' }
	]
	const mockMCPTools = [
		{ label: is_cn ? '文件系统访问' : 'File System Access', value: 'filesystem' },
		{ label: is_cn ? '数据库查询' : 'Database Query', value: 'database' },
		{ label: is_cn ? 'API调用' : 'API Call', value: 'api' },
		{ label: is_cn ? 'Git操作' : 'Git Operations', value: 'git' },
		{ label: is_cn ? '终端命令' : 'Terminal Command', value: 'terminal' },
		{ label: is_cn ? '网络搜索' : 'Web Search', value: 'web-search' }
	]

	const roleOptions =
		config?.roles
			?.filter((role) => !role.hidden)
			.map((role) => ({
				label: role.label,
				value: role.role_id
			})) || []

	// 成员选项（用于汇报上级）
	const memberOptions = members
		.filter((member) => member.role_id !== 'team_owner' && member.id)
		.map((member) => {
			const memberDetail = member as any
			const userName =
				memberDetail.user_info?.name || member.user_id || (is_cn ? '未知用户' : 'Unknown User')
			const userEmail = memberDetail.user_info?.email || ''
			return {
				label: userEmail ? `${userName} (${userEmail})` : userName,
				value: member.id?.toString() || member.user_id || ''
			}
		})

	const handleClose = () => {
		setFormValues({
			role: config?.roles?.find((role) => role.default)?.role_id || 'team_member',
			llm: 'gpt-4-turbo',
			autonomous_mode: 'enabled',
			cost_limit: 100
		})
		setErrors({})
		setCurrentStep(0)
		setEmailPrefix('')
		setEmailDomain('@example.com')
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
				if (!formValues.llm) {
					newErrors.llm = is_cn ? '请选择语言模型' : 'Please select language model'
				}
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
				// 组合完整邮箱地址
				const fullEmail = emailPrefix + emailDomain
				await onAdd({ ...formValues, email: fullEmail } as AIMemberValues)
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
										setEmailPrefix(value)
										if (errors.email) {
											setErrors((prev) => {
												const newErrors = { ...prev }
												delete newErrors.email
												return newErrors
											})
										}
									}}
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
									onChange={(value) => setEmailDomain(value)}
									schema={{
										type: 'string',
										enum: emailDomains,
										placeholder: is_cn ? '选择域名' : 'Select domain'
									}}
									error=''
									hasError={false}
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
							<div className={styles.formItemThird}>
								<label className={styles.formLabel}>
									{is_cn ? '语言模型' : 'Language Model'}
									<span className={styles.required}>*</span>
								</label>
								<Select
									value={formValues.llm}
									onChange={(value) => handleFieldChange('llm', value)}
									schema={{
										type: 'string',
										enum: mockLLMs,
										placeholder: is_cn
											? '选择语言模型'
											: 'Select language model'
									}}
									error={errors.llm || ''}
									hasError={!!errors.llm}
								/>
							</div>

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
											: 'Set monthly cost limit',
										min: 0,
										max: 10000
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

						<div className={styles.formItem}>
							<label className={styles.formLabel}>
								{is_cn ? '可访问的智能体' : 'Accessible Agents'}
							</label>
							<CheckboxGroup
								value={formValues.agents}
								onChange={(value) => handleFieldChange('agents', value)}
								schema={{
									type: 'array',
									enum: mockAgents
								}}
								error=''
								hasError={false}
							/>
						</div>

						<div className={styles.formItem}>
							<label className={styles.formLabel}>
								{is_cn ? '可使用的工具' : 'Available Tools'}
							</label>
							<CheckboxGroup
								value={formValues.mcp_tools}
								onChange={(value) => handleFieldChange('mcp_tools', value)}
								schema={{
									type: 'array',
									enum: mockMCPTools
								}}
								error=''
								hasError={false}
							/>
						</div>
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
						<Button type='primary' onClick={handleNext} disabled={adding}>
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
