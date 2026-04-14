import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Tooltip, message } from 'antd'
import { Select, MarkdownEditor } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import AgentPicker from '@/components/AgentPicker'
import AIGenerator from '@/components/AIGenerator'
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
	const global = useGlobal()

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

	return (
		<div className={styles.panelInner}>
			<div className={styles.panelTitle}>
				<span>{is_cn ? '身份设定' : 'Identity & Resources'}</span>
				{global?.agent_uses?.robot_prompt && (
					<AIGenerator
						assistantId={global.agent_uses.robot_prompt}
						context={() => {
							const agentNames = selectedAgentItems.map(a => a.label).join(', ')
							const mcpNames = selectedMcpItems.map(s => s.label).join(', ')
							const llmLabel = llmOptions.find(o => o.value === formData.language_model)?.label || ''
							const snapshot = {
								display_name: formData.display_name || robot?.name || '',
								description: robot?.description || '',
								email: formData.robot_email || '',
								bio: formData.bio || '',
								autonomous_mode: formData.autonomous_mode ?? false,
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

			{/* Role & Responsibilities */}
			<div className={styles.formItem}>
				<label className={styles.formLabel}>
					<span className={styles.required}>*</span>
					{is_cn ? '职责说明' : 'Role & Responsibilities'}
				</label>
			<MarkdownEditor
				value={formData.system_prompt}
				onChange={(value) => handleFieldChange('system_prompt', value)}
				schema={{
					type: 'string',
					placeholder: is_cn
						? '描述这个任务智能体的身份、职责和工作方式...'
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
					{is_cn ? '可协作的专家' : 'Accessible AI Experts'}
					<Tooltip
						title={is_cn
							? '选择该任务智能体可以协作的 AI 专家'
							: 'Select AI experts this task agent can work with'
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
							? '选择该任务智能体可以使用的 MCP 工具'
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
