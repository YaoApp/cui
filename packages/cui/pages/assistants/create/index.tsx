import { useState, useEffect } from 'react'
import { history, getLocale } from '@umijs/max'
import { Breadcrumb, Modal, message } from 'antd'
import { Button } from '@/components/ui'
import { ChatBox, ChatBoxFile, Input, Select, TextArea, CheckboxGroup } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import { Agent as AgentType } from '@/openapi/agent/types'
import { MCPServer } from '@/openapi/mcp/types'
import { Agent } from '@/openapi/agent/api'
import { MCP } from '@/openapi/mcp/api'
import useAIChat from '@/chatbox/hooks/useAIChat'
import { useGlobal } from '@/context/app'
import { IsTeamMember } from '@/pages/auth/auth'
import ProgressTimeline, { TimelineStep } from './components/ProgressTimeline'
import AssistantPreview from './components/AssistantPreview'
import styles from './index.less'

interface AssistantConfig {
	name: string
	description: string
	connector: string
	prompt: string
	agents?: string[]
	mcp_tools?: string[]
	tags?: string[]
	share?: 'private' | 'team'
}

const AssistantCreate = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()
	const { connectors } = global
	const { saveAssistant } = useAIChat({})
	const isTeamMember = IsTeamMember()

	// Wizard state
	const [currentStep, setCurrentStep] = useState(0)
	const [requirement, setRequirement] = useState<string>('')
	const [files, setFiles] = useState<ChatBoxFile[]>([])
	const [generating, setGenerating] = useState(false)
	const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([])
	const [hasError, setHasError] = useState(false)
	const [lastRequirement, setLastRequirement] = useState<{ msg: string; files: ChatBoxFile[] } | null>(null)
	const [abortController, setAbortController] = useState<AbortController | null>(null)
	const [config, setConfig] = useState<AssistantConfig>({
		name: '',
		description: '',
		connector: '',
		prompt: '',
		agents: [],
		mcp_tools: [],
		tags: [],
		share: 'team'
	})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [creating, setCreating] = useState(false)
	const [createdAssistantId, setCreatedAssistantId] = useState<string>('')

	// API data states
	const [agents, setAgents] = useState<AgentType[]>([])
	const [agentsLoading, setAgentsLoading] = useState(false)
	const [mcpServers, setMCPServers] = useState<MCPServer[]>([])
	const [mcpLoading, setMCPLoading] = useState(false)

	// Load agents and MCP tools when component mounts
	useEffect(() => {
		if (window.$app?.openapi) {
			const openapi = window.$app.openapi

			// Load agents
			const agentAPI = new Agent(openapi)
			setAgentsLoading(true)
			agentAPI.assistants
				.List({})
				.then((response) => {
					if (openapi.IsError(response)) {
						console.error('Failed to load agents:', response.error)
						return
					}
					const data = openapi.GetData(response)
					if (data?.data) {
						setAgents(data.data)
					}
				})
				.catch((error) => {
					console.error('Failed to load agents:', error)
				})
				.finally(() => {
					setAgentsLoading(false)
				})

			// Load MCP servers
			const mcpAPI = new MCP(openapi)
			setMCPLoading(true)
			mcpAPI.ListServers()
				.then((servers) => {
					if (servers) {
						setMCPServers(servers)
					}
				})
				.catch((error) => {
					console.error('Failed to load MCP servers:', error)
				})
				.finally(() => {
					setMCPLoading(false)
				})
		}
	}, [])

	const handleBack = () => {
		history.push('/assistants')
	}

	const steps = [
		{ title: is_cn ? '描述需求' : 'Describe Requirements', icon: 'material-chat' },
		{ title: is_cn ? '配置详情' : 'Configure Details', icon: 'material-tune' }
	]

	// Mock SSE API call to create assistant with real-time progress
	const generateConfig = async (
		requirement: string,
		files: ChatBoxFile[],
		signal?: AbortSignal
	): Promise<AssistantConfig> => {
		// TODO: Replace with actual SSE API call
		// Example: const eventSource = new EventSource('/api/assistant/create')

		const steps: Array<{ id: string; title: string; description?: string; delay: number }> = [
			{
				id: 'analyze',
				title: is_cn ? '分析需求' : 'Analyzing requirements',
				description: is_cn ? '理解和分析您的需求描述' : 'Understanding and analyzing your requirements',
				delay: 800
			},
			{
				id: 'generate_config',
				title: is_cn ? '生成配置' : 'Generating configuration',
				description: is_cn ? '创建智能体基础配置' : 'Creating assistant base configuration',
				delay: 1000
			},
			{
				id: 'generate_prompt',
				title: is_cn ? '生成提示词' : 'Generating prompts',
				description: is_cn
					? '根据需求定制系统提示词'
					: 'Customizing system prompts based on requirements',
				delay: 1200
			},
			{
				id: 'select_tools',
				title: is_cn ? '选择工具' : 'Selecting tools',
				description: is_cn ? '匹配合适的智能体和工具' : 'Matching appropriate agents and tools',
				delay: 800
			},
			{
				id: 'complete',
				title: is_cn ? '完成' : 'Completed',
				description: is_cn ? '智能体配置已生成' : 'Assistant configuration generated',
				delay: 500
			}
		]

		// Check if requirement contains "error" (case insensitive) to simulate error
		const shouldSimulateError = requirement.toLowerCase().includes('error')
		const errorStepIndex = shouldSimulateError ? Math.floor(steps.length / 2) : -1

		// Simulate SSE progress updates
		for (let i = 0; i < steps.length; i++) {
			// Check if aborted
			if (signal?.aborted) {
				throw new Error('Request aborted')
			}

			const step = steps[i]

			// Set current step to loading
			setTimelineSteps((prev) => [
				...prev.filter((s) => s.id !== step.id),
				{
					id: step.id,
					title: step.title,
					description: step.description,
					status: 'loading',
					timestamp: Date.now()
				}
			])

			// Wait with abort support
			await new Promise((resolve, reject) => {
				const timer = setTimeout(resolve, step.delay)

				// Listen for abort signal
				if (signal) {
					signal.addEventListener('abort', () => {
						clearTimeout(timer)
						reject(new Error('Request aborted'))
					})
				}
			})

			// Check if aborted after delay
			if (signal?.aborted) {
				throw new Error('Request aborted')
			}

			// Simulate error at the error step
			if (i === errorStepIndex) {
				setTimelineSteps((prev) =>
					prev.map((s) =>
						s.id === step.id
							? {
									...s,
									status: 'error',
									timestamp: Date.now(),
									description: is_cn
										? '创建过程中发生错误，请重试'
										: 'An error occurred during creation, please retry'
							  }
							: s
					)
				)
				throw new Error('Simulated error')
			}

			// Mark step as completed
			setTimelineSteps((prev) =>
				prev.map((s) => (s.id === step.id ? { ...s, status: 'completed', timestamp: Date.now() } : s))
			)
		}

		const defaultConnector = Object.keys(connectors.mapping || {})[0] || 'gpt-4-turbo'

		// Mock: randomly select some agents and tools (TODO: replace with AI selection)
		const selectedAgents =
			agents.length > 0 ? agents.slice(0, Math.min(2, agents.length)).map((a) => a.assistant_id) : []

		const selectedTools =
			mcpServers.length > 0
				? mcpServers.slice(0, Math.min(3, mcpServers.length)).map((s) => s.value || s.name)
				: []

		return {
			name: is_cn ? '智能助手' : 'Smart Assistant',
			description: requirement.substring(0, 100),
			connector: defaultConnector,
			prompt: is_cn
				? `你是一个智能助手，专门负责：\n\n${requirement}\n\n请始终保持专业、高效的工作态度，积极响应用户的需求。`
				: `You are a smart assistant specializing in:\n\n${requirement}\n\nPlease always maintain a professional and efficient work attitude and actively respond to user needs.`,
			agents: selectedAgents,
			mcp_tools: selectedTools,
			tags: []
		}
	}

	const handleGenerate = async (msg: string, files: ChatBoxFile[]) => {
		if (!msg.trim()) return

		// Create new abort controller
		const controller = new AbortController()
		setAbortController(controller)

		setGenerating(true)
		setTimelineSteps([])
		setHasError(false)
		setCurrentStep(0.5) // Intermediate step for timeline
		setLastRequirement({ msg, files })

		try {
			const generatedConfig = await generateConfig(msg, files, controller.signal)

			// Check if aborted
			if (controller.signal.aborted) {
				return
			}

			setConfig(generatedConfig)

			// Automatically create the assistant
			await handleCreate()

			// Small delay before showing preview
			await new Promise((resolve) => setTimeout(resolve, 500))
			setCurrentStep(1)
		} catch (error: any) {
			// Check if it was an abort
			if (error?.message === 'Request aborted') {
				console.log('Request aborted by user')
				return
			}

			console.error('Failed to generate:', error)
			setHasError(true)
			// Don't reset to step 0, stay on timeline view to show error
		} finally {
			setGenerating(false)
			setAbortController(null)
		}
	}

	const handleRetry = () => {
		if (lastRequirement) {
			handleGenerate(lastRequirement.msg, lastRequirement.files)
		}
	}

	const handleEditPrompt = () => {
		setCurrentStep(0)
		setHasError(false)
		setTimelineSteps([])
	}

	const handleStop = () => {
		// Abort the request
		if (abortController) {
			abortController.abort()
		}

		setGenerating(false)
		setCurrentStep(0)
		setTimelineSteps([])
		setHasError(false)
		message.info(is_cn ? '已停止创建' : 'Creation stopped')
	}

	const validateStep = (step: number): boolean => {
		const newErrors: Record<string, string> = {}

		if (step === 1) {
			if (!config.name?.trim()) {
				newErrors.name = is_cn ? '请输入名称' : 'Please enter name'
			}
			if (!config.description?.trim()) {
				newErrors.description = is_cn ? '请输入描述' : 'Please enter description'
			}
			if (!config.connector) {
				newErrors.connector = is_cn ? '请选择 AI 连接器' : 'Please select AI connector'
			}
			if (!config.prompt?.trim()) {
				newErrors.prompt = is_cn ? '请输入提示词' : 'Please enter prompt'
			}
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleCreate = async () => {
		setCreating(true)
		try {
			// Generate a default avatar
			const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`

			// Prepare the assistant data
			const assistantData = {
				...config,
				avatar: avatarUrl,
				type: 'assistant',
				mentionable: true,
				automated: true,
				built_in: false,
				readonly: false,
				prompts: [
					{
						role: 'system' as const,
						content: config.prompt
					}
				],
				placeholder: {
					title: is_cn ? '新对话' : 'New Chat',
					description: is_cn
						? `你好，我是${config.name}，${config.description}`
						: `Hello, I'm ${config.name}, ${config.description}`
				}
			}

			const result = await saveAssistant(assistantData)

			if (result && result.assistant_id) {
				setCreatedAssistantId(result.assistant_id)
				// Stay on preview, don't auto-redirect
			} else {
				throw new Error('No assistant ID returned')
			}
		} catch (error) {
			console.error('Error creating assistant:', error)
			message.error(is_cn ? '创建智能体失败' : 'Failed to create assistant')
		} finally {
			setCreating(false)
		}
	}

	const handleChat = () => {
		if (createdAssistantId) {
			// TODO: Navigate to chat page with assistant
			history.push(`/assistants/chat/${createdAssistantId}`)
		}
	}

	const handleViewDetail = () => {
		if (createdAssistantId) {
			history.push(`/assistants/detail/${createdAssistantId}`)
		}
	}

	const updateField = (field: string, value: any) => {
		setConfig((prev) => ({ ...prev, [field]: value }))
		if (errors[field]) {
			setErrors((prev) => {
				const newErrors = { ...prev }
				delete newErrors[field]
				return newErrors
			})
		}
	}

	const handlePrev = () => {
		setCurrentStep(0)
		setErrors({})
	}

	// Transform agents to select options
	const agentOptions = (agents || []).map((agent) => ({
		label: agent.name || agent.assistant_id,
		value: agent.assistant_id
	}))

	// Transform MCP servers to select options
	const mcpOptions = (mcpServers || []).map((server) => ({
		label: server.label || server.name,
		value: server.value || server.name
	}))

	// Connector options
	const connectorOptions = Object.keys(connectors.mapping || {}).map((key) => ({
		label: connectors.mapping[key],
		value: key
	}))

	return (
		<div className={styles.container}>
			<div className={styles.breadcrumbContainer}>
				<Breadcrumb>
					<Breadcrumb.Item>
						<a
							href='/assistants'
							onClick={(e) => {
								e.preventDefault()
								handleBack()
							}}
						>
							{is_cn ? '智能体列表' : 'Assistants'}
						</a>
					</Breadcrumb.Item>
					<Breadcrumb.Item>{is_cn ? '创建智能体' : 'Create Assistant'}</Breadcrumb.Item>
				</Breadcrumb>
			</div>

			{currentStep === 0.5 ? (
				<div className={styles.timelineSection}>
					<ProgressTimeline
						steps={timelineSteps}
						is_cn={is_cn}
						hasError={hasError}
						isGenerating={generating}
						requirement={lastRequirement?.msg}
						onRetry={handleRetry}
						onEditPrompt={handleEditPrompt}
						onStop={handleStop}
					/>
				</div>
			) : currentStep === 0 ? (
				<div className={styles.heroSection}>
					<div className={styles.heroContent}>
						<h1 className={styles.heroTitle}>{is_cn ? '创建智能体' : 'Create Assistant'}</h1>
						<p className={styles.heroDesc}>
							{is_cn
								? '描述你的需求，AI 将为你创建智能体'
								: 'Describe your needs, AI will create an assistant for you'}
						</p>
						<div className={styles.chatBoxWrapper}>
							<ChatBox
								schema={{
									type: 'string',
									placeholder: is_cn
										? '例如：我需要一个客服助手，能够回答产品相关问题，处理用户投诉...'
										: 'e.g., I need a customer service assistant that can answer product questions, handle complaints...'
								}}
								value={requirement}
								onChange={(value) => setRequirement(String(value))}
								onSend={handleGenerate}
								onFilesChange={setFiles}
								files={files}
								maxFiles={5}
								sendButtonText={is_cn ? '创建' : 'Create'}
								disabled={generating}
								loading={generating}
								error=''
								hasError={false}
							/>

							{/* Share Visibility - Only show for team members */}
							{isTeamMember && (
								<div className={styles.shareField}>
									<button
										type='button'
										className={`${styles.shareOption} ${
											config.share === 'team' ? styles.active : ''
										}`}
										onClick={() =>
											setConfig((prev) => ({ ...prev, share: 'team' }))
										}
										disabled={generating}
									>
										<span className={styles.radioCircle}>
											{config.share === 'team' && (
												<span className={styles.radioDot} />
											)}
										</span>
										<span>
											{is_cn ? '团队成员可见' : 'Visible to team members'}
										</span>
									</button>
									<button
										type='button'
										className={`${styles.shareOption} ${
											config.share === 'private' ? styles.active : ''
										}`}
										onClick={() =>
											setConfig((prev) => ({ ...prev, share: 'private' }))
										}
										disabled={generating}
									>
										<span className={styles.radioCircle}>
											{config.share === 'private' && (
												<span className={styles.radioDot} />
											)}
										</span>
										<span>{is_cn ? '仅自己可见' : 'Private (only me)'}</span>
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			) : (
				<AssistantPreview
					data={{
						name: config.name,
						description: config.description,
						avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${config.name}`,
						agents: config.agents,
						mcp_tools: config.mcp_tools,
						agentNames: agents.reduce((acc, agent) => {
							acc[agent.assistant_id] = agent.name || agent.assistant_id
							return acc
						}, {} as Record<string, string>),
						mcpToolNames: mcpServers.reduce((acc, server) => {
							const serverId = server.value || server.name
							acc[serverId] = server.label || server.name
							return acc
						}, {} as Record<string, string>)
					}}
					is_cn={is_cn}
					onChat={handleChat}
					onViewDetail={handleViewDetail}
					loading={false}
				/>
			)}
		</div>
	)
}

export default AssistantCreate
