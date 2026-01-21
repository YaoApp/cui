import React, { useState, useEffect, useRef } from 'react'
import { Tooltip } from 'antd'
import { Select, TextArea, InputNumber, CheckboxGroup } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import type { RobotState } from '../../../../../types'
import styles from '../index.less'

interface IdentityPanelProps {
	robot: RobotState
	formData: Record<string, any>
	onChange: (field: string, value: any) => void
	is_cn: boolean
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
const IdentityPanel: React.FC<IdentityPanelProps> = ({ robot, formData, onChange, is_cn }) => {
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [generatingPrompt, setGeneratingPrompt] = useState(false)

	// API data states - TODO: Load from actual APIs
	const [llmProviders, setLLMProviders] = useState<Array<{ label: string; value: string }>>([])
	const [agents, setAgents] = useState<Array<{ label: string; value: string }>>([])
	const [mcpServers, setMCPServers] = useState<Array<{ label: string; value: string }>>([])
	const [kbCollections, setKBCollections] = useState<Array<{ label: string; value: string }>>([])
	const [dbModels, setDBModels] = useState<Array<{ label: string; value: string }>>([])
	
	const [loading, setLoading] = useState({
		llm: false,
		agents: false,
		mcp: false,
		kb: false,
		db: false
	})

	// Use ref to track if data has been loaded
	const dataLoadedRef = useRef(false)

	// Initialize form data from robot
	useEffect(() => {
		if (robot && !dataLoadedRef.current) {
			dataLoadedRef.current = true
			// TODO: Load actual data from robot config
		}
	}, [robot])

	// Mock data - TODO: Replace with API calls
	useEffect(() => {
		// Mock LLM providers
		setLLMProviders([
			{ label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
			{ label: 'GPT-4o', value: 'gpt-4o' },
			{ label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
			{ label: 'Claude 3 Opus', value: 'claude-3-opus' }
		])

		// Mock agents
		setAgents([
			{ label: is_cn ? '报告生成器' : 'Report Writer', value: 'report-writer' },
			{ label: is_cn ? '图表生成器' : 'Chart Generator', value: 'chart-generator' },
			{ label: is_cn ? '邮件发送器' : 'Email Sender', value: 'email-sender' },
			{ label: is_cn ? '数据分析师' : 'Data Analyst', value: 'data-analyst' }
		])

		// Mock MCP servers/tools
		setMCPServers([
			{ label: is_cn ? '数据库查询' : 'Database Query', value: 'db-query' },
			{ label: is_cn ? '网络搜索' : 'Web Search', value: 'web-search' },
			{ label: is_cn ? '文件管理' : 'File Manager', value: 'file-manager' },
			{ label: is_cn ? '代码执行' : 'Code Runner', value: 'code-runner' }
		])

		// Mock KB collections
		setKBCollections([
			{ label: is_cn ? '销售知识库' : 'Sales KB', value: 'sales-kb' },
			{ label: is_cn ? '产品文档' : 'Product Docs', value: 'product-docs' },
			{ label: is_cn ? '公司政策' : 'Company Policies', value: 'company-policies' }
		])

		// Mock DB models
		setDBModels([
			{ label: is_cn ? '销售数据' : 'Sales', value: 'sales' },
			{ label: is_cn ? '客户数据' : 'Customers', value: 'customers' },
			{ label: is_cn ? '订单数据' : 'Orders', value: 'orders' },
			{ label: is_cn ? '产品数据' : 'Products', value: 'products' }
		])
	}, [is_cn])

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
			await new Promise(resolve => setTimeout(resolve, 5000)) // 5 seconds for demo

			const mockPrompt = is_cn
				? `你是一位专业的销售数据分析师。

你的主要职责：
1. 每日分析销售数据，识别趋势和异常
2. 生成周度和月度销售报告
3. 当关键指标出现显著变化时及时预警
4. 为销售策略提供数据支持和建议

工作原则：
- 保持数据准确性和客观性
- 主动发现问题并提出解决方案
- 定期向主管汇报工作进展`
				: `You are a professional Sales Data Analyst.

Your main responsibilities:
1. Analyze daily sales data and identify trends and anomalies
2. Generate weekly and monthly sales reports
3. Alert the team when key metrics change significantly
4. Provide data-driven insights for sales strategy

Work principles:
- Maintain data accuracy and objectivity
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
							? '描述这个智能体的身份、职责和工作方式...\n\n例如：\n你是一位销售数据分析师。\n\n你的主要职责：\n1. 分析每日销售数据\n2. 生成销售报告\n3. 发现异常并预警'
							: 'Describe this agent\'s role, responsibilities, and how it should work...\n\nExample:\nYou are a Sales Data Analyst.\n\nYour responsibilities:\n1. Analyze daily sales data\n2. Generate sales reports\n3. Identify anomalies and alert',
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
			{agents.length > 0 && (
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
							enum: agents
						}}
					/>
				</div>
			)}

			{/* Accessible Tools */}
			{mcpServers.length > 0 && (
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
							enum: mcpServers
						}}
					/>
				</div>
			)}

			{/* Accessible Knowledge */}
			{kbCollections.length > 0 && (
				<div className={styles.formItem}>
					<label className={styles.formLabel}>
						{is_cn ? '可查阅的知识库' : 'Accessible Knowledge'}
						<Tooltip
							title={is_cn
								? '选择该智能体可以查阅的知识库'
								: 'Select knowledge bases this agent can access'
							}
						>
							<span className={styles.helpIconWrapper}>
								<Icon name='material-help' size={14} className={styles.helpIcon} />
							</span>
						</Tooltip>
					</label>
					<CheckboxGroup
						value={formData['robot_config.kb.collections'] || []}
						onChange={(value) => handleFieldChange('robot_config.kb.collections', value)}
						schema={{
							type: 'array',
							enum: kbCollections
						}}
					/>
				</div>
			)}

			{/* Accessible Data */}
			{dbModels.length > 0 && (
				<div className={styles.formItem}>
					<label className={styles.formLabel}>
						{is_cn ? '可访问的数据' : 'Accessible Data'}
						<Tooltip
							title={is_cn
								? '选择该智能体可以访问的数据表'
								: 'Select database models this agent can access'
							}
						>
							<span className={styles.helpIconWrapper}>
								<Icon name='material-help' size={14} className={styles.helpIcon} />
							</span>
						</Tooltip>
					</label>
					<CheckboxGroup
						value={formData['robot_config.db.models'] || []}
						onChange={(value) => handleFieldChange('robot_config.db.models', value)}
						schema={{
							type: 'array',
							enum: dbModels
						}}
					/>
				</div>
			)}
		</div>
	)
}

export default IdentityPanel
