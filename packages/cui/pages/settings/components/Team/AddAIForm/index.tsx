import { useState } from 'react'
import { Form, Modal } from 'antd'
import { Button } from '@/components/ui'
import { Input, Select, TextArea, CheckboxGroup, RadioGroup, InputNumber } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import { TeamConfig } from '@/openapi/user/types'
import styles from './index.less'

interface AddAIFormProps {
	visible: boolean
	onClose: () => void
	onAdd: (values: AIMemberValues) => Promise<void>
	config: TeamConfig | null
	configLoading: boolean
	adding: boolean
	members: any[] // 用于汇报上级选择
	is_cn: boolean
}

export interface AIMemberValues {
	name: string
	email: string
	role: string
	report_to?: string
	prompt: string
	llm?: string
	agents?: string[]
	mcp_tools?: string[]
	autonomous_mode?: string
	cost_limit?: number
}

const AddAIForm = ({ visible, onClose, onAdd, config, configLoading, adding, members, is_cn }: AddAIFormProps) => {
	const [form] = Form.useForm()

	// Mock 数据 - 后续对接后端
	const mockAgents = [
		{ label: is_cn ? '数据分析助手' : 'Data Analysis Agent', value: 'data_analysis' },
		{ label: is_cn ? '代码审查助手' : 'Code Review Agent', value: 'code_review' },
		{ label: is_cn ? '文档生成助手' : 'Documentation Agent', value: 'documentation' },
		{ label: is_cn ? '测试助手' : 'Testing Agent', value: 'testing' },
		{ label: is_cn ? '项目管理助手' : 'Project Management Agent', value: 'project_management' }
	]

	const mockMCPTools = [
		{ label: is_cn ? '文件系统访问' : 'File System Access', value: 'filesystem' },
		{ label: is_cn ? '数据库查询' : 'Database Query', value: 'database' },
		{ label: is_cn ? 'API调用' : 'API Calls', value: 'api' },
		{ label: is_cn ? 'Git操作' : 'Git Operations', value: 'git' },
		{ label: is_cn ? '终端命令' : 'Terminal Commands', value: 'terminal' },
		{ label: is_cn ? '网络搜索' : 'Web Search', value: 'web_search' }
	]

	const mockLLMs = [
		{ label: 'GPT-4', value: 'gpt-4' },
		{ label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
		{ label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
		{ label: 'Claude 3 Opus', value: 'claude-3-opus' },
		{ label: 'Claude 3 Sonnet', value: 'claude-3-sonnet' },
		{ label: 'Claude 3 Haiku', value: 'claude-3-haiku' },
		{ label: 'Gemini Pro', value: 'gemini-pro' }
	]

	// 从配置中获取角色选项（过滤掉隐藏的角色）
	const roleOptions =
		config?.roles
			?.filter((role) => !role.hidden)
			.map((role) => ({
				label: role.label,
				value: role.role_id
			})) || []

	// 获取默认角色
	const defaultRole = config?.roles?.find((role) => role.default)?.role_id || 'team_member'

	// 成员选项（用于汇报上级）
	const memberOptions = members
		.filter((member) => member.role_id !== 'team_owner' && member.id) // 过滤掉没有 id 的成员
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
		onClose()
		form.resetFields()
	}

	const handleSubmit = async (values: AIMemberValues) => {
		await onAdd(values)
		handleClose()
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
			footer={
				<div className={styles.modalFooter}>
					<Button onClick={handleClose} disabled={adding}>
						{is_cn ? '取消' : 'Cancel'}
					</Button>
					<Button type='primary' htmlType='submit' loading={adding} disabled={adding} onClick={() => form.submit()}>
						{is_cn ? '添加' : 'Add'}
					</Button>
				</div>
			}
			width={960}
			className={styles.addAIModal}
			destroyOnClose
			closable={false}
		>
			<div className={styles.modalContent}>
				<Form
					form={form}
					layout='vertical'
					onFinish={handleSubmit}
					initialValues={{
						role: defaultRole,
						llm: 'gpt-4-turbo',
						autonomous_mode: 'enabled',
						cost_limit: 100
					}}
				>
					{/* 基本信息 */}
					<div className={styles.formSection}>
						<h4 className={styles.sectionTitle}>{is_cn ? '基本信息' : 'Basic Information'}</h4>

						<div className={styles.formRow}>
							<Form.Item
								name='name'
								label={is_cn ? 'AI 成员名称' : 'AI Member Name'}
								className={styles.formItemHalf}
								rules={[
									{
										required: true,
										message: is_cn
											? '请输入 AI 成员名称'
											: 'Please enter AI member name'
									}
								]}
							>
								<Input
									schema={{
										type: 'string',
										placeholder: is_cn
											? '例如：技术助手'
											: 'e.g., Technical Assistant'
									}}
									error=''
									hasError={false}
								/>
							</Form.Item>

							<Form.Item
								name='role'
								label={is_cn ? '角色' : 'Role'}
								className={styles.formItemHalf}
								rules={[
									{
										required: true,
										message: is_cn ? '请选择角色' : 'Please select role'
									}
								]}
							>
								<Select
									schema={{
										type: 'string',
										enum: roleOptions,
										placeholder: is_cn ? '选择角色' : 'Select role'
									}}
									error=''
									hasError={false}
								/>
							</Form.Item>
						</div>

						<div className={styles.formRow}>
							<Form.Item
								name='email'
								label={is_cn ? '邮箱地址' : 'Email Address'}
								className={styles.formItemHalf}
								rules={[
									{
										required: true,
										message: is_cn
											? '请输入邮箱地址'
											: 'Please enter email address'
									},
									{
										type: 'email',
										message: is_cn
											? '请输入有效的邮箱地址'
											: 'Please enter a valid email address'
									}
								]}
							>
								<Input
									schema={{
										type: 'string',
										placeholder: is_cn
											? '例如：ai-assistant@example.com'
											: 'e.g., ai-assistant@example.com'
									}}
									error=''
									hasError={false}
								/>
							</Form.Item>

							<Form.Item
								name='report_to'
								label={is_cn ? '汇报上级' : 'Report To'}
								className={styles.formItemHalf}
							>
								<Select
									schema={{
										type: 'string',
										enum: memberOptions,
										placeholder: is_cn ? '选择汇报上级' : 'Select supervisor'
									}}
									error=''
									hasError={false}
								/>
							</Form.Item>
						</div>
					</div>

					{/* AI 配置 */}
					<div className={styles.formSection}>
						<h4 className={styles.sectionTitle}>{is_cn ? 'AI 配置' : 'AI Configuration'}</h4>

						<div className={styles.formRowThree}>
							<Form.Item
								name='llm'
								label={is_cn ? '语言模型' : 'Language Model'}
								className={styles.formItemThird}
								rules={[
									{
										required: true,
										message: is_cn
											? '请选择语言模型'
											: 'Please select language model'
									}
								]}
							>
								<Select
									schema={{
										type: 'string',
										enum: mockLLMs,
										placeholder: is_cn
											? '选择语言模型'
											: 'Select language model'
									}}
									error=''
									hasError={false}
								/>
							</Form.Item>

							<Form.Item
								name='cost_limit'
								label={is_cn ? '消费上限（美元/月）' : 'Cost Limit (USD/month)'}
								className={styles.formItemThird}
							>
								<InputNumber
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
							</Form.Item>

							<Form.Item
								name='autonomous_mode'
								label={is_cn ? '自主模式' : 'Autonomous Mode'}
								className={styles.formItemThird}
								tooltip={
									is_cn
										? '开启后，AI 成员会像真人一样主动思考、主动寻找需要处理的事项并自主完成'
										: 'When enabled, AI members will proactively think, identify tasks to handle, and complete them autonomously like a real person'
								}
							>
								<RadioGroup
									schema={{
										type: 'string',
										enum: [
											{
												label: is_cn ? '开启' : 'Enabled',
												value: 'enabled'
											},
											{
												label: is_cn ? '关闭' : 'Disabled',
												value: 'disabled'
											}
										]
									}}
									error=''
									hasError={false}
								/>
							</Form.Item>
						</div>

						<Form.Item
							name='prompt'
							label={is_cn ? '身份设定' : 'Identity & Role'}
							rules={[
								{
									required: true,
									message: is_cn
										? '请输入身份设定'
										: 'Please enter identity and role'
								}
							]}
						>
							<TextArea
								schema={{
									type: 'string',
									placeholder: is_cn
										? '描述 AI 成员的身份、工作职责和目标任务。例如：\n\n你是一位资深的前端开发工程师，负责审查前端代码质量、优化性能问题。主要工作包括：\n1. 每日检查代码提交，发现潜在问题\n2. 提供技术方案和最佳实践建议\n3. 维护组件库文档和示例代码'
										: "Describe the AI member's identity, responsibilities and key tasks. For example:\n\nYou are a senior frontend developer responsible for reviewing code quality and optimizing performance. Main responsibilities include:\n1. Daily code review to identify potential issues\n2. Provide technical solutions and best practice recommendations\n3. Maintain component library documentation and examples",
									rows: 4
								}}
								error=''
								hasError={false}
							/>
						</Form.Item>

						<Form.Item name='agents' label={is_cn ? '可访问的智能体' : 'Accessible Agents'}>
							<CheckboxGroup
								schema={{
									type: 'array',
									enum: mockAgents
								}}
								error=''
								hasError={false}
							/>
						</Form.Item>

						<Form.Item name='mcp_tools' label={is_cn ? '可使用的工具' : 'Available Tools'}>
							<CheckboxGroup
								schema={{
									type: 'array',
									enum: mockMCPTools
								}}
								error=''
								hasError={false}
							/>
						</Form.Item>
					</div>
				</Form>
			</div>
		</Modal>
	)
}

export default AddAIForm
