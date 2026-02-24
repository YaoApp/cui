import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Tooltip, message } from 'antd'
import { getLocale } from '@umijs/max'
import { Select, TextArea } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import AgentPicker from '@/components/AgentPicker'
import type { PickerItem } from '@/components/AgentPicker/types'
import { LLM } from '@/openapi'
import type { LLMProvider } from '@/openapi/llm/types'
import { useGlobal } from '@/context/app'
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
	const global = useGlobal()
	const locale = getLocale()
	const generatedPromptRef = useRef('')

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

	const [llmProviders, setLlmProviders] = useState<LLMProvider[]>([])
	const [llmLoading, setLlmLoading] = useState(false)
	const llmLoadedRef = useRef(false)

	useEffect(() => {
		if (llmLoadedRef.current || !window.$app?.openapi) return
		llmLoadedRef.current = true
		setLlmLoading(true)

		const llmAPI = new LLM(window.$app.openapi)
		llmAPI.ListProviders({ capabilities: ['tool_calls'] })
			.then((providers) => setLlmProviders(providers || []))
			.catch((err) => console.error('Failed to fetch LLM providers:', err))
			.finally(() => setLlmLoading(false))
	}, [])

	const llmOptions = useMemo(() =>
		llmProviders.map((p) => ({ label: p.label, value: p.value })),
		[llmProviders]
	)

	const [agentPickerVisible, setAgentPickerVisible] = useState(false)
	const [mcpPickerVisible, setMcpPickerVisible] = useState(false)

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

	// Handle AI generate prompt - streaming call to robot_prompt agent
	const handleGeneratePrompt = async () => {
		if (generatingPrompt) return

		// Check if we have the necessary dependencies
		if (!window.$app?.openapi) {
			console.warn('OpenAPI not initialized')
			message.error(is_cn ? 'API 未初始化' : 'API not initialized')
			return
		}

		const robotPromptAgentId = global?.agent_uses?.robot_prompt
		if (!robotPromptAgentId) {
			console.warn('Robot prompt agent not configured in global.agent_uses.robot_prompt')
			message.error(is_cn ? '未配置职责生成助手' : 'Robot prompt agent not configured')
			return
		}

		setGeneratingPrompt(true)
		generatedPromptRef.current = ''

		try {
			const { Chat, IsEventMessage, IsStreamEndEvent } = await import('@/openapi')
			const chatClient = new Chat(window.$app.openapi)

			// Build context from form data
			const name = formData.display_name || (is_cn ? '智能体' : 'Agent')
			const currentPrompt = formData.system_prompt || ''
			
			// Language hint
			const languageHint = is_cn ? '请用中文生成。' : 'Please generate in English.'

			// Build user message - if there's existing content, optimize it; otherwise generate new
			const userMessage = currentPrompt.trim()
				? `${languageHint}\n\n请优化以下 Robot 的职责说明，使其更加专业、清晰、全面：\n\n名称：${name}\n\n当前职责说明：\n${currentPrompt}`
				: `${languageHint}\n\n请为名为"${name}"的 Robot 生成一份专业的职责说明（System Prompt）。`

			// Stream generation
			chatClient.StreamCompletion(
				{
					assistant_id: robotPromptAgentId,
					messages: [
						{
							role: 'user',
							content: userMessage
						}
					],
					locale,
					skip: {
						history: true,
						trace: true
					}
				},
				(chunk) => {
					// Check for stream end event
					if (IsEventMessage(chunk) && IsStreamEndEvent(chunk)) {
						setGeneratingPrompt(false)
						return
					}

					// Accumulate and update in real-time
					if (chunk.type === 'text' && chunk.props?.content) {
						if (chunk.delta) {
							generatedPromptRef.current += chunk.props.content
						} else {
							generatedPromptRef.current = chunk.props.content
						}

						// Real-time update the form field
						if (generatedPromptRef.current.trim()) {
							handleFieldChange('system_prompt', generatedPromptRef.current.trim())
						}
					}
				},
				(error) => {
					console.error('Failed to generate prompt:', error)
					message.error(is_cn ? '生成职责说明失败' : 'Failed to generate prompt')
					setGeneratingPrompt(false)
				}
			)
		} catch (error) {
			console.error('Error generating prompt:', error)
			message.error(is_cn ? '生成职责说明失败' : 'Failed to generate prompt')
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

			{/* AI Model */}
			<div className={styles.formItem}>
				<label className={styles.formLabel}>
					{is_cn ? 'AI 模型' : 'AI Model'}
					<Tooltip
						title={is_cn
							? '仅显示支持工具调用的模型'
							: 'Only models that support tool calling are shown'
						}
					>
						<span className={styles.helpIconWrapper}>
							<Icon name='material-help' size={14} className={styles.helpIcon} />
						</span>
					</Tooltip>
					{llmLoading && (
						<span className={styles.loadingHint}>{is_cn ? ' (加载中...)' : ' (Loading...)'}</span>
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
				/>
			</div>

			{/* Accessible AI Assistants */}
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
										onClick={() => handleFieldChange('agents', (formData.agents || []).filter((id: string) => id !== item.value))}
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

			{/* Accessible Tools */}
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
										onClick={() => handleFieldChange('mcp_servers', (formData.mcp_servers || []).filter((id: string) => id !== item.value))}
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
	)
}

export default IdentityPanel
