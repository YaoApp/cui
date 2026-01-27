import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
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
import type { RobotState } from '../../../../types'
import type { Robot, RobotUpdateRequest } from '@/openapi/agent/robot'
import CreatureLoading from '../../../CreatureLoading'
import BasicPanel from './panels/BasicPanel'
import IdentityPanel from './panels/IdentityPanel'
import SchedulePanel from './panels/SchedulePanel'
import AdvancedPanel from './panels/AdvancedPanel'
import styles from './index.less'

interface ConfigTabProps {
	robot: RobotState
	onDelete?: () => void
	onUpdated?: () => void
}

type MenuKey = 'basic' | 'identity' | 'schedule' | 'advanced'

interface MenuItem {
	key: MenuKey
	label: string
	icon: string
	visible?: boolean
}

// Context for sharing loaded API data across panels
export interface ConfigContextData {
	teamConfig: TeamConfig | null
	emailDomains: Array<{ label: string; value: string }>
	managers: Array<{ label: string; value: string }>
	roles: Array<{ label: string; value: string }>
	agents: AgentType[]
	mcpServers: MCPServer[]
	loading: boolean
}

const ConfigTab: React.FC<ConfigTabProps> = ({ robot, onDelete, onUpdated }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()

	// Robot API hook
	const { getRobot, updateRobot, deleteRobot, error: apiError } = useRobots()

	const [activeMenu, setActiveMenu] = useState<MenuKey>('basic')
	const [formData, setFormData] = useState<Record<string, any>>({})
	const [saving, setSaving] = useState(false)
	const [loadingRobot, setLoadingRobot] = useState(false)

	// Shared API data state
	const [configData, setConfigData] = useState<ConfigContextData>({
		teamConfig: null,
		emailDomains: [],
		managers: [],
		roles: [],
		agents: [],
		mcpServers: [],
		loading: true
	})

	// Refs to track data loading
	const robotLoadedRef = useRef(false)
	const configLoadedRef = useRef(false)
	const managersLoadedRef = useRef(false)
	const agentsLoadedRef = useRef(false)
	const mcpLoadedRef = useRef(false)

	// Get team ID
	const teamId = global.user?.team_id || global.user?.user_id || ''

	// Load robot details from API
	const loadRobotDetails = useCallback(async () => {
		if (!robot?.member_id || robotLoadedRef.current) return

		robotLoadedRef.current = true
		setLoadingRobot(true)

		try {
			const robotDetail = await getRobot(robot.member_id)
			if (robotDetail) {
				// Parse robot_config sub-objects
				const robotConfig = robotDetail.robot_config || {}
				const clock = robotConfig.clock || {}
				const delivery = robotConfig.delivery || {}
				const quota = robotConfig.quota || {}
				const executor = robotConfig.executor || {}
				const learn = robotConfig.learn || {}
				const triggers = robotConfig.triggers || {}
				const resources = robotConfig.resources || {}
				
				const data: Record<string, any> = {
					// Basic fields
					display_name: robotDetail.display_name || '',
					bio: robotDetail.bio || '',
					robot_email: robotDetail.robot_email || '',
					role_id: robotDetail.role_id || '',
					manager_id: robotDetail.manager_id || '',
					autonomous_mode: robotDetail.autonomous_mode || false,
					system_prompt: robotDetail.system_prompt || '',
					agents: robotDetail.agents || [],
					mcp_servers: robotDetail.mcp_servers || [],
					language_model: robotDetail.language_model || '',
					cost_limit: robotDetail.cost_limit || 100,
					
					// Clock configuration (Schedule panel)
					'clock.mode': clock.mode || 'times',
					'clock.times': clock.times || ['09:00'],
					'clock.days': clock.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
					'clock.every': clock.every || '30m',
					'clock.tz': clock.tz || 'Asia/Shanghai',
					
					// Delivery configuration (Advanced panel)
					'delivery.email.targets': delivery.email?.targets || [],
					'delivery.webhook.enabled': delivery.webhook?.enabled || false,
					'delivery.webhook.targets': delivery.webhook?.targets || [],
					'delivery.process.enabled': delivery.process?.enabled || false,
					'delivery.process.targets': delivery.process?.targets || [],
					
					// Quota/Concurrency configuration (Advanced panel)
					'quota.max': quota.max ?? 2,
					'quota.queue': quota.queue ?? 10,
					'quota.priority': quota.priority ?? 5,
					
					// Executor configuration (Advanced panel)
					'executor.timeout': executor.timeout ?? 30,
					'executor.mode': executor.mode || 'standard',
					
					// Learning configuration (Advanced panel)
					'learn.on': learn.on || false,
					'learn.types': learn.types || ['execution', 'feedback', 'insight'],
					'learn.keep': learn.keep ?? 90,
					
					// Triggers configuration (Advanced panel)
					'triggers.intervene.enabled': triggers.intervene?.enabled ?? true,
					'triggers.event.enabled': triggers.event?.enabled || false,
					
					// Resources/Phases configuration (Advanced panel - Developer options)
					'resources.phases.inspiration': resources.phases?.inspiration || '__yao.inspiration',
					'resources.phases.goals': resources.phases?.goals || '__yao.goals',
					'resources.phases.tasks': resources.phases?.tasks || '__yao.tasks',
					'resources.phases.validation': resources.phases?.validation || '__yao.validation',
					'resources.phases.delivery': resources.phases?.delivery || '__yao.delivery',
					'resources.phases.learning': resources.phases?.learning || '__yao.learning'
				}
				setFormData(data)
			}
		} catch (err) {
			console.error('Failed to load robot details:', err)
		} finally {
			setLoadingRobot(false)
		}
	}, [robot?.member_id, getRobot])

	// Load team config
	useEffect(() => {
		if (!teamId || !window.$app?.openapi || configLoadedRef.current) return

		configLoadedRef.current = true

		const openapi = window.$app.openapi
		const auth = new UserAuth(openapi)
		const teamsAPI = new UserTeams(openapi, auth)

		teamsAPI
			.GetConfig(teamId)
			.then((response) => {
				if (!openapi.IsError(response) && response.data) {
					const config = response.data
					setConfigData(prev => ({
						...prev,
						teamConfig: config,
						emailDomains: config.robot?.email_domains?.map((d: any) => ({
							label: d.domain,
							value: `@${d.domain}`
						})) || [],
						roles: config.roles
							?.filter((r: any) => !r.hidden)
							.map((r: any) => ({
								label: r.label,
								value: r.role_id
							})) || []
					}))
				}
			})
			.catch((err) => {
				console.error('Failed to load team config:', err)
				configLoadedRef.current = false
			})
	}, [teamId])

	// Load managers (human team members)
	useEffect(() => {
		if (!teamId || !window.$app?.openapi || managersLoadedRef.current) return

		managersLoadedRef.current = true

		const openapi = window.$app.openapi
		const auth = new UserAuth(openapi)
		const teamsAPI = new UserTeams(openapi, auth)

		teamsAPI
			.GetMembers(teamId, {
				member_type: 'user',
				status: 'active',
				fields: ['member_id', 'display_name', 'email', 'user_id']
			})
			.then((response) => {
				if (response?.data?.data && Array.isArray(response.data.data)) {
					setConfigData(prev => ({
						...prev,
						managers: response.data.data.map((m: any) => {
							const name = m.display_name || m.email || m.user_id || (is_cn ? '未知' : 'Unknown')
							const email = m.email || ''
							return {
								label: email ? `${name} (${email})` : name,
								value: m.member_id || m.user_id || ''
							}
						})
					}))
				}
			})
			.catch((err) => {
				console.error('Failed to load managers:', err)
				managersLoadedRef.current = false
			})
	}, [teamId, is_cn])

	// Load agents
	useEffect(() => {
		if (!window.$app?.openapi || agentsLoadedRef.current) return

		agentsLoadedRef.current = true

		const openapi = window.$app.openapi
		const agentAPI = new Agent(openapi)

		agentAPI.assistants
			.List({})
			.then((response) => {
				if (!openapi.IsError(response)) {
					const data = openapi.GetData(response)
					if (data?.data) {
						setConfigData(prev => ({ ...prev, agents: data.data }))
					}
				}
			})
			.catch((err) => {
				console.error('Failed to load agents:', err)
				agentsLoadedRef.current = false
			})
	}, [])

	// Load MCP servers
	useEffect(() => {
		if (!window.$app?.openapi || mcpLoadedRef.current) return

		mcpLoadedRef.current = true

		const openapi = window.$app.openapi
		const mcpAPI = new MCP(openapi)

		mcpAPI
			.ListServers()
			.then((servers) => {
				if (servers) {
					setConfigData(prev => ({ ...prev, mcpServers: servers }))
				}
			})
			.catch((err) => {
				console.error('Failed to load MCP servers:', err)
				mcpLoadedRef.current = false
			})
			.finally(() => {
				setConfigData(prev => ({ ...prev, loading: false }))
			})
	}, [])

	// Load robot details on mount
	useEffect(() => {
		loadRobotDetails()
	}, [loadRobotDetails])

	// Reset refs when robot changes
	useEffect(() => {
		robotLoadedRef.current = false
	}, [robot?.member_id])

	// Current autonomous mode from form data
	const autonomousMode = formData.autonomous_mode ?? false

	// Menu items - schedule only visible when autonomous_mode is true
	const menuItems: MenuItem[] = useMemo(() => [
		{
			key: 'basic',
			label: is_cn ? '基本信息' : 'Basic',
			icon: 'material-person'
		},
		{
			key: 'identity',
			label: is_cn ? '身份设定' : 'Identity',
			icon: 'material-badge'
		},
		{
			key: 'schedule',
			label: is_cn ? '工作日程' : 'Schedule',
			icon: 'material-schedule',
			visible: autonomousMode
		},
		{
			key: 'advanced',
			label: is_cn ? '高级配置' : 'Advanced',
			icon: 'material-tune'
		}
	], [is_cn, autonomousMode])

	const visibleMenuItems = menuItems.filter(item => item.visible !== false)

	// Handle field change
	const handleFieldChange = (field: string, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }))
	}

	// Handle save
	const handleSave = async () => {
		if (!robot?.member_id || saving) return

		setSaving(true)
		try {
			// Build robot_config with all nested configurations
			const robotConfig: Record<string, any> = {
				// Clock/Schedule settings
				clock: {
					mode: formData['clock.mode'] || 'times',
					times: formData['clock.times'] || ['09:00'],
					days: formData['clock.days'] || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
					every: formData['clock.every'] || '30m',
					tz: formData['clock.tz'] || 'Asia/Shanghai'
				},
				// Delivery settings
				delivery: {
					email: {
						targets: formData['delivery.email.targets'] || []
					},
					webhook: {
						enabled: formData['delivery.webhook.enabled'] || false,
						targets: formData['delivery.webhook.targets'] || []
					},
					process: {
						enabled: formData['delivery.process.enabled'] || false,
						targets: formData['delivery.process.targets'] || []
					}
				},
				// Quota/Concurrency settings
				quota: {
					max: formData['quota.max'] ?? 2,
					queue: formData['quota.queue'] ?? 10,
					priority: formData['quota.priority'] ?? 5
				},
				// Executor settings
				executor: {
					timeout: formData['executor.timeout'] ?? 30,
					mode: formData['executor.mode'] || 'standard'
				},
				// Learning settings
				learn: {
					on: formData['learn.on'] || false,
					types: formData['learn.types'] || ['execution', 'feedback', 'insight'],
					keep: formData['learn.keep'] ?? 90
				},
				// Triggers settings
				triggers: {
					intervene: {
						enabled: formData['triggers.intervene.enabled'] ?? true
					},
					event: {
						enabled: formData['triggers.event.enabled'] || false
					}
				},
				// Resources/Phases settings (Developer options)
				resources: {
					phases: {
						inspiration: formData['resources.phases.inspiration'] || '__yao.inspiration',
						goals: formData['resources.phases.goals'] || '__yao.goals',
						tasks: formData['resources.phases.tasks'] || '__yao.tasks',
						validation: formData['resources.phases.validation'] || '__yao.validation',
						delivery: formData['resources.phases.delivery'] || '__yao.delivery',
						learning: formData['resources.phases.learning'] || '__yao.learning'
					}
				}
			}

			// Build update request
			const updateData: RobotUpdateRequest = {
				display_name: formData.display_name,
				bio: formData.bio,
				robot_email: formData.robot_email,
				role_id: formData.role_id,
				manager_id: formData.manager_id || undefined,
				autonomous_mode: formData.autonomous_mode,
				system_prompt: formData.system_prompt,
				agents: formData.agents?.length > 0 ? formData.agents : undefined,
				mcp_servers: formData.mcp_servers?.length > 0 ? formData.mcp_servers : undefined,
				language_model: formData.language_model || undefined,
				cost_limit: formData.cost_limit,
				robot_config: robotConfig
			}

			const result = await updateRobot(robot.member_id, updateData)
			if (result) {
				message.success(is_cn ? '保存成功' : 'Saved successfully')
				onUpdated?.()
			} else {
				message.error(apiError || (is_cn ? '保存失败' : 'Failed to save'))
			}
		} catch (error) {
			console.error('Failed to save:', error)
			message.error(is_cn ? '保存失败' : 'Failed to save')
		} finally {
			setSaving(false)
		}
	}

	// Render active panel
	const renderPanel = () => {
		const panelProps = {
			robot,
			formData,
			onChange: handleFieldChange,
			is_cn,
			configData
		}

		switch (activeMenu) {
			case 'basic':
				return <BasicPanel {...panelProps} />
			case 'identity':
				return <IdentityPanel {...panelProps} />
			case 'schedule':
				return <SchedulePanel {...panelProps} />
			case 'advanced':
				return <AdvancedPanel {...panelProps} autonomousMode={autonomousMode} onDelete={onDelete} />
			default:
				return null
		}
	}

	return (
		<div className={styles.configTab}>
			{/* Left Menu */}
			<div className={styles.menuSidebar}>
				<div className={styles.menuList}>
					{visibleMenuItems.map(item => (
						<div
							key={item.key}
							className={`${styles.menuItem} ${activeMenu === item.key ? styles.menuItemActive : ''}`}
							onClick={() => setActiveMenu(item.key)}
						>
							<Icon name={item.icon} size={16} />
							<span>{item.label}</span>
						</div>
					))}
				</div>
			</div>

			{/* Right Panel */}
			<div className={styles.panelContainer}>
				<div className={styles.panelContent}>
				{loadingRobot ? (
					<CreatureLoading size="medium" />
				) : (
						renderPanel()
					)}
				</div>

				{/* Save Button */}
				<div className={styles.panelFooter}>
					<button
						className={`${styles.saveButton} ${saving ? styles.saveButtonDisabled : ''}`}
						onClick={handleSave}
						disabled={saving}
					>
						{saving ? (
							<>
								<Icon name='material-hourglass_empty' size={16} />
								<span>{is_cn ? '保存中...' : 'Saving...'}</span>
							</>
						) : (
							<>
								<Icon name='material-save' size={16} />
								<span>{is_cn ? '保存更改' : 'Save Changes'}</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}

export default ConfigTab
