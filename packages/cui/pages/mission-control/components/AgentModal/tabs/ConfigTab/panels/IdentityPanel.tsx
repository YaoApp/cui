import React, { useState, useMemo } from 'react'
import { Tooltip } from 'antd'
import { Select, TextArea, InputNumber, CheckboxGroup } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import type { RobotState } from '../../../../../types'
import type { ConfigContextData } from '../index'
import styles from '../index.less'

interface IdentityPanelProps {
	robot: RobotState
	formData: Record<string, any>
	onChange: (field: string, value: any) => void
	is_cn: boolean
	configData?: ConfigContextData
}

/**
 * IdentityPanel - Identity and resources settings
 * 
 * Fields from `__yao.member`:
 * - system_prompt: Role & Responsibilities
 * - language_model: AI Model
 * - cost_limit: Monthly Budget
 * - agents: Accessible AI Assistants
 * - mcp_servers: Accessible Tools
 * 
 * Fields from `robot_config`:
 * - kb.collections: Accessible Knowledge
 * - db.models: Accessible Data
 */
const IdentityPanel: React.FC<IdentityPanelProps> = ({ robot, formData, onChange, is_cn, configData }) => {
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [generatingPrompt, setGeneratingPrompt] = useState(false)

	// Get options from configData
	const agentOptions = useMemo(() => 
		(configData?.agents || []).map(agent => ({
			label: agent.name || agent.assistant_id,
			value: agent.assistant_id
		})),
		[configData?.agents]
	)

	const mcpOptions = useMemo(() =>
		(configData?.mcpServers || []).map(server => ({
			label: server.label || server.name,
			value: server.value || server.name
		})),
		[configData?.mcpServers]
	)

	// Mock LLM providers - TODO: Load from LLM API
	const llmProviders = useMemo(() => [
		{ label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
		{ label: 'GPT-4o', value: 'gpt-4o' },
		{ label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
		{ label: 'Claude 3 Opus', value: 'claude-3-opus' },
		{ label: 'DeepSeek V3', value: 'deepseek-v3' }
	], [])

	// Handle field change
	const handleFieldChange = (field: string, value: any) => {
		onChange(field, value)
		if (errors[field]) {
			setErrors(prev => {
				const newErrors = { ...prev }
				delete newErrors[field]
				return newErrors
			})
		}
	}

	// Handle AI generate prompt
	const handleGeneratePrompt = async () => {
		if (generatingPrompt) return

		setGeneratingPrompt(true)
		try {
			// TODO: Call AI API to generate prompt
			await new Promise(resolve => setTimeout(resolve, 2000))

			const name = formData.display_name || (is_cn ? '智能体' : 'Agent')
			const mockPrompt = is_cn
				? `你是 ${name}，一位专业的智能体。

你的主要职责：
1. 分析数据并生成报告
2. 提供专业建议和见解
3. 协助团队完成各项任务

工作原则：
- 保持专业、准确、高效
- 主动发现问题并提出解决方案
- 定期向主管汇报工作进展`
				: `You are ${name}, a professional AI teammate.

Your responsibilities:
1. Analyze data and generate reports
2. Provide professional advice and insights
3. Assist the team in completing various tasks

Work principles:
- Be professional, accurate, and efficient
- Proactively identify issues and propose solutions
- Regularly report progress to your manager`

			handleFieldChange('system_prompt', mockPrompt)
		} catch (error) {
			console.error('Failed to generate prompt:', error)
		} finally {
			setGeneratingPrompt(false)
		}
	}

	return (
		<div className={styles.panelInner}>
			<div className={styles.panelTitle}>
				{is_cn ? '身份设定' : 'Identity & Resources'}
			</div>

			{/* Role & Responsibilities */}
			<div className={styles.formItem}>
				<div className={styles.labelWithAction}>
					<label className={styles.formLabel}>
						<span className={styles.required}>*</span>
						{is_cn ? '职责说明' : 'Role & Responsibilities'}
					</label>
					<Tooltip title={is_cn ? '使用 AI 生成职责说明' : 'Generate with AI'}>
						<div
							className={`${styles.generateButton} ${generatingPrompt ? styles.generating : ''}`}
							onClick={generatingPrompt ? undefined : handleGeneratePrompt}
						>
							<Icon name='material-auto_awesome' size={14} />
							<span>{generatingPrompt 
								? (is_cn ? '生成中...' : 'Generating...') 
								: (is_cn ? '生成' : 'Generate')
							}</span>
						</div>
					</Tooltip>
				</div>
				<TextArea
					value={formData.system_prompt}
					onChange={(value) => handleFieldChange('system_prompt', value)}
					schema={{
						type: 'string',
						placeholder: is_cn
							? '描述这个智能体的身份、职责和工作方式...'
							: 'Describe this agent\'s role, responsibilities, and how it should work...',
						rows: 10
					}}
					error={errors.system_prompt || ''}
					hasError={!!errors.system_prompt}
				/>
			</div>

			{/* Section: Resources */}
			<div className={styles.sectionTitle}>
				{is_cn ? '资源配置' : 'Resources'}
			</div>

			{/* AI Model and Budget */}
			<div className={styles.formRow}>
				<div className={styles.formItemHalf}>
					<label className={styles.formLabel}>
						{is_cn ? 'AI 模型' : 'AI Model'}
					</label>
					<Select
						value={formData.language_model}
						onChange={(value) => handleFieldChange('language_model', value)}
						schema={{
							type: 'string',
							enum: llmProviders,
							placeholder: is_cn ? '选择 AI 模型' : 'Select AI model'
						}}
					/>
				</div>

				<div className={styles.formItemHalf}>
					<label className={styles.formLabel}>
						{is_cn ? '月度预算 (USD)' : 'Monthly Budget (USD)'}
						<Tooltip
							title={is_cn
								? '设置该智能体每月可使用的 API 费用上限'
								: 'Set the monthly API cost limit for this agent'
							}
						>
							<span className={styles.helpIconWrapper}>
								<Icon name='material-help' size={14} className={styles.helpIcon} />
							</span>
						</Tooltip>
					</label>
					<InputNumber
						value={formData.cost_limit}
						onChange={(value) => handleFieldChange('cost_limit', value)}
						schema={{
							type: 'number',
							placeholder: '100',
							minimum: 0
						}}
					/>
				</div>
			</div>

			{/* Accessible AI Assistants */}
			{agentOptions.length > 0 && (
				<div className={styles.formItem}>
					<label className={styles.formLabel}>
						{is_cn ? '可协作的智能体' : 'Accessible AI Assistants'}
						<Tooltip
							title={is_cn
								? '选择该智能体可以调用协作的其他智能体'
								: 'Select other agents this agent can work with'
							}
						>
							<span className={styles.helpIconWrapper}>
								<Icon name='material-help' size={14} className={styles.helpIcon} />
							</span>
						</Tooltip>
					</label>
					<CheckboxGroup
						value={formData.agents || []}
						onChange={(value) => handleFieldChange('agents', value)}
						schema={{
							type: 'array',
							enum: agentOptions
						}}
					/>
				</div>
			)}

			{/* Accessible Tools */}
			{mcpOptions.length > 0 && (
				<div className={styles.formItem}>
					<label className={styles.formLabel}>
						{is_cn ? '可使用的工具' : 'Accessible Tools'}
						<Tooltip
							title={is_cn
								? '选择该智能体可以使用的 MCP 工具'
								: 'Select MCP tools this agent can use'
							}
						>
							<span className={styles.helpIconWrapper}>
								<Icon name='material-help' size={14} className={styles.helpIcon} />
							</span>
						</Tooltip>
					</label>
					<CheckboxGroup
						value={formData.mcp_servers || []}
						onChange={(value) => handleFieldChange('mcp_servers', value)}
						schema={{
							type: 'array',
							enum: mcpOptions
						}}
					/>
				</div>
			)}
		</div>
	)
}

export default IdentityPanel
