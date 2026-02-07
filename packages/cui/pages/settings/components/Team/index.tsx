import { useState, useEffect } from 'react'
import { Form, message } from 'antd'
import { getLocale } from '@umijs/max'
import { useGlobal } from '@/context/app'
import { local } from '@yaoapp/storex'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import UserAvatar from '@/widgets/UserAvatar'
import { User } from '@/openapi/user'
import { CreateTeamRequest, UserTeamDetail, TeamMember, TeamInvitation, TeamConfig } from '@/openapi/user/types'
import { Can } from '@/pages/auth/auth'
import MemberList from './MemberList'
import InviteForm from './InviteForm'
import TeamEditForm from './TeamEditForm'
import CreateTeamForm from './CreateTeamForm'
// TODO: Re-enable AI member management when moved back from Mission Control
// import AddAIMemberWizard from './AddAIMemberWizard'
// import EditAIMember from './EditAIMember'
// import type { AIMemberValues } from './AddAIMemberWizard'
import styles from './index.less'

// Team feature permissions domain and feature keys
const TEAM_DOMAIN = 'user/team'
const TEAM_FEATURES = {
	EDIT: 'team:edit',
	INVITE: 'team:member:invite',
	ROBOT_CREATE: 'team:member:robot:create',
	ROBOT_EDIT: 'team:member:robot:edit',
	MEMBER_REMOVE: 'team:member:remove'
} as const

const Team = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()

	const [loading, setLoading] = useState(true)
	const [configLoading, setConfigLoading] = useState(true)
	const [team, setTeam] = useState<UserTeamDetail | null>(null)
	const [apiClient, setApiClient] = useState<User | null>(null)
	const [config, setConfig] = useState<TeamConfig | null>(null)
	const [members, setMembers] = useState<TeamMember[]>([])
	const [inviteModalVisible, setInviteModalVisible] = useState(false)
	const [inviting, setInviting] = useState(false)
	const [addAIModalVisible, setAddAIModalVisible] = useState(false)
	const [addingAI, setAddingAI] = useState(false)
	const [editAIModalVisible, setEditAIModalVisible] = useState(false)
	const [editingAIMember, setEditingAIMember] = useState<TeamMember | null>(null)
	const [updatingAI, setUpdatingAI] = useState(false)
	const [editingTeam, setEditingTeam] = useState(false)
	const [updatingTeam, setUpdatingTeam] = useState(false)
	const [teamForm] = Form.useForm()
	const [inviteLink, setInviteLink] = useState('')
	const [generatingLink, setGeneratingLink] = useState(false)

	// Team permissions state
	const [permissions, setPermissions] = useState({
		canEditTeam: false,
		canInviteMembers: false,
		canCreateRobot: false,
		canEditRobot: false,
		canRemoveMembers: false
	})

	useEffect(() => {
		const initializeAPI = async () => {
			if (window.$app?.openapi) {
				const client = new User(window.$app.openapi)
				setApiClient(client)

				try {
					setConfigLoading(true)

					// Load team configuration and permissions in parallel
					const [configResponse, features] = await Promise.all([
						client.teams.GetConfig(locale),
						Can(Object.values(TEAM_FEATURES), TEAM_DOMAIN)
					])

					// Handle config response
					if (!client.IsError(configResponse) && configResponse.data) {
						setConfig(configResponse.data)
					} else {
						console.error('Failed to load team config:', configResponse.error)
					}

					// Handle permissions
					if (typeof features === 'object') {
						setPermissions({
							canEditTeam: features[TEAM_FEATURES.EDIT] || false,
							canInviteMembers: features[TEAM_FEATURES.INVITE] || false,
							canCreateRobot: features[TEAM_FEATURES.ROBOT_CREATE] || false,
							canEditRobot: features[TEAM_FEATURES.ROBOT_EDIT] || false,
							canRemoveMembers: features[TEAM_FEATURES.MEMBER_REMOVE] || false
						})
					}
				} catch (error) {
					console.error('Failed to load team config or permissions:', error)
				} finally {
					setConfigLoading(false)
				}
			} else {
				console.error('OpenAPI not initialized')
				message.error(is_cn ? 'API未初始化' : 'API not initialized')
				setConfigLoading(false)
			}
		}

		initializeAPI()
	}, [locale, is_cn])

	useEffect(() => {
		const loadTeamData = async () => {
			if (!apiClient) return

			try {
				setLoading(true)
				// 直接获取当前用户的团队
				const teamResponse = await apiClient.teams.GetCurrentTeam()

				// 如果返回 404，说明用户还没有团队
				if (apiClient.IsError(teamResponse)) {
					if (teamResponse.status === 404) {
						// 用户还没有团队
						setTeam(null)
						setMembers([])
					} else {
						console.error('Failed to load current team:', teamResponse.error)
						message.error(is_cn ? '加载团队信息失败' : 'Failed to load team data')
						setTeam(null)
						setMembers([])
					}
				} else if (teamResponse.data) {
					// 用户已有团队，设置团队信息
					setTeam(teamResponse.data)

					// 加载成员数据（包括待处理的邀请）
					try {
						const membersResponse = await apiClient.teams.GetMembers(
							teamResponse.data.team_id,
							{
								page: 1,
								pagesize: 100,
								locale: locale
							}
						)

						if (!apiClient.IsError(membersResponse) && membersResponse.data) {
							setMembers(membersResponse.data.data || [])
						} else {
							console.error('Failed to load members:', membersResponse.error)
							setMembers([])
						}
					} catch (error) {
						console.error('Failed to load members:', error)
						setMembers([])
					}
				}
			} catch (error) {
				// 只记录错误到控制台，不显示用户消息
				// 因为 404（用户没有团队）已经在上面正确处理了
				console.error('Failed to load team data:', error)
			} finally {
				setLoading(false)
			}
		}

		if (apiClient) {
			loadTeamData()
		}
	}, [apiClient, is_cn])

	const handleInviteMember = async (values: { email: string; role: string }) => {
		if (!apiClient || !team) {
			message.error(is_cn ? 'API未初始化或团队不存在' : 'API not initialized or team does not exist')
			return
		}

		try {
			setInviting(true)

			// 创建邀请请求，使用配置中的过期时间
			const invitationRequest = {
				email: values.email,
				role_id: values.role,
				send_email: true, // 发送邀请邮件
				expiry: config?.invite?.expiry, // 使用配置中的过期时间
				locale: locale // 指定语言，用于发送对应语言的邮件模板
			}

			const response = await apiClient.teams.CreateInvitation(team.team_id, invitationRequest)

			if (apiClient.IsError(response)) {
				console.error('Failed to create invitation:', response.error)
				const errorMsg = response.error?.error_description || response.error?.error || 'Unknown error'
				message.error(is_cn ? `邀请发送失败: ${errorMsg}` : `Failed to send invitation: ${errorMsg}`)
				return
			}

			const newInvitation = response.data
			if (newInvitation) {
				// 重新加载成员列表以包含新邀请
				if (team.team_id) {
					const membersResponse = await apiClient.teams.GetMembers(team.team_id, {
						page: 1,
						pagesize: 100,
						locale: locale
					})
					if (!apiClient.IsError(membersResponse) && membersResponse.data) {
						setMembers(membersResponse.data.data || [])
					}
				}
				setInviteModalVisible(false)
				message.success(is_cn ? '邀请发送成功' : 'Invitation sent successfully')
			}
		} catch (error) {
			console.error('Error sending invitation:', error)
			message.error(is_cn ? '邀请发送失败' : 'Failed to send invitation')
		} finally {
			setInviting(false)
		}
	}

	const handleCreateTeam = async (values: { name: string; description?: string }) => {
		if (!apiClient) {
			message.error(is_cn ? 'API未初始化' : 'API not initialized')
			return
		}

		try {
			setLoading(true)

			// 创建团队请求数据
			const createTeamRequest: CreateTeamRequest = {
				name: values.name,
				description: values.description || undefined,
				locale: locale // 传递 locale 以便后端使用正确的配置
			}

			// 调用真实的团队创建API
			const createResponse = await apiClient.teams.CreateTeam(createTeamRequest)

			if (apiClient.IsError(createResponse)) {
				console.error('Failed to create team:', createResponse.error)
				const errorMsg =
					createResponse.error?.error_description || createResponse.error?.error || 'Unknown error'
				message.error(is_cn ? `创建团队失败: ${errorMsg}` : `Failed to create team: ${errorMsg}`)
				return
			}

			const newTeam = createResponse.data
			if (newTeam) {
				// 获取团队详细信息
				const teamDetailResponse = await apiClient.teams.GetTeam(newTeam.team_id)

				if (!apiClient.IsError(teamDetailResponse) && teamDetailResponse.data) {
					setTeam(teamDetailResponse.data)
				} else {
					// 如果获取详情失败，使用基本信息构造UserTeamDetail类型
					setTeam({
						...newTeam,
						settings: undefined
					})
				}

				// 加载成员数据（包括待处理的邀请）
				try {
					const membersResponse = await apiClient.teams.GetMembers(newTeam.team_id, {
						page: 1,
						pagesize: 100,
						locale: locale
					})

					if (!apiClient.IsError(membersResponse) && membersResponse.data) {
						setMembers(membersResponse.data.data || [])
					} else {
						setMembers([])
					}
				} catch (error) {
					console.error('Failed to load members:', error)
					setMembers([])
				}

				message.success(is_cn ? '团队创建成功' : 'Team created successfully')
			}
		} catch (error) {
			console.error('Error creating team:', error)
			message.error(is_cn ? '创建团队失败' : 'Failed to create team')
		} finally {
			setLoading(false)
		}
	}

	const handleUpdateTeam = async (values: { name: string; description?: string; avatar?: string }) => {
		if (!apiClient || !team) {
			message.error(is_cn ? 'API未初始化或团队不存在' : 'API not initialized or team does not exist')
			return
		}

		try {
			setUpdatingTeam(true)

			// 构建更新请求数据
			const updateTeamRequest = {
				name: values.name,
				description: values.description || undefined,
				logo: values.avatar || undefined // avatar 字段映射到 logo
			}

			// 调用真实的团队更新API
			const updateResponse = await apiClient.teams.UpdateTeam(team.team_id, updateTeamRequest)

			if (apiClient.IsError(updateResponse)) {
				console.error('Failed to update team:', updateResponse.error)
				const errorMsg =
					updateResponse.error?.error_description || updateResponse.error?.error || 'Unknown error'
				message.error(is_cn ? `更新团队失败: ${errorMsg}` : `Failed to update team: ${errorMsg}`)
				return
			}

			const updatedTeam = updateResponse.data
			if (updatedTeam) {
				// 构造UserTeamDetail类型
				const updatedTeamDetail: UserTeamDetail = {
					...updatedTeam,
					settings: team?.settings
				}
				setTeam(updatedTeamDetail)
				setEditingTeam(false) // 保存后返回展示状态

				// Update global user info if user is part of this team
				if (global.user && global.user.team_id === updatedTeam.team_id) {
					// Update App.User in global state and localStorage
					global.user = {
						...global.user,
						team: {
							...global.user.team,
							team_id: updatedTeam.team_id,
							name: updatedTeam.name,
							logo: updatedTeam.logo,
							description: updatedTeam.description,
							owner_id: updatedTeam.owner_id
						}
					}
					local.user = global.user

					// Update UserInfo (OIDC format) in global state
					if (global.userInfo && global.userInfo['yao:team']) {
						global.setUserInfo({
							...global.userInfo,
							'yao:team': {
								...global.userInfo['yao:team'],
								team_id: updatedTeam.team_id,
								name: updatedTeam.name,
								logo: updatedTeam.logo,
								description: updatedTeam.description,
								owner_id: updatedTeam.owner_id
							}
						})
					}
				}

				message.success(is_cn ? '团队信息已更新' : 'Team information updated')
			}
		} catch (error) {
			console.error('Error updating team:', error)
			message.error(is_cn ? '更新团队信息失败' : 'Failed to update team information')
		} finally {
			setUpdatingTeam(false)
		}
	}

	const handleGenerateInviteLink = async (role: string) => {
		if (!apiClient || !team) {
			message.error(is_cn ? 'API未初始化或团队不存在' : 'API not initialized or team does not exist')
			return
		}

		try {
			setGeneratingLink(true)

			// 创建通用邀请链接（不指定 email 和 user_id）
			const invitationRequest = {
				role_id: role,
				send_email: false, // 不发送邮件，只生成链接
				expiry: config?.invite?.expiry, // 使用配置中的过期时间
				locale: locale // 指定语言，保持数据一致性
			}

			const response = await apiClient.teams.CreateInvitation(team.team_id, invitationRequest)

			if (apiClient.IsError(response)) {
				console.error('Failed to generate invite link:', response.error)
				const errorMsg = response.error?.error_description || response.error?.error || 'Unknown error'
				message.error(
					is_cn ? `生成邀请链接失败: ${errorMsg}` : `Failed to generate invite link: ${errorMsg}`
				)
				return
			}

			const invitation = response.data
			if (invitation && invitation.invitation_link) {
				// 直接使用后端返回的完整邀请链接
				setInviteLink(invitation.invitation_link)
				// 重新加载成员列表以包含新邀请
				if (team.team_id) {
					const membersResponse = await apiClient.teams.GetMembers(team.team_id, {
						page: 1,
						pagesize: 100,
						locale: locale
					})
					if (!apiClient.IsError(membersResponse) && membersResponse.data) {
						setMembers(membersResponse.data.data || [])
					}
				}
				message.success(is_cn ? '邀请链接已生成' : 'Invite link generated')
			} else {
				message.error(
					is_cn
						? '生成邀请链接失败：未返回链接'
						: 'Failed to generate invite link: no link returned'
				)
			}
		} catch (error) {
			console.error('Error generating invite link:', error)
			message.error(is_cn ? '生成邀请链接失败' : 'Failed to generate invite link')
		} finally {
			setGeneratingLink(false)
		}
	}

	const handleRemoveMember = async (memberId: string) => {
		if (!apiClient || !team) {
			message.error(is_cn ? 'API未初始化或团队不存在' : 'API not initialized or team does not exist')
			return
		}

		try {
			const response = await apiClient.teams.DeleteMember(team.team_id, memberId)

			if (apiClient.IsError(response)) {
				console.error('Failed to remove member:', response.error)
				const errorMsg = response.error?.error_description || response.error?.error || 'Unknown error'
				message.error(is_cn ? `移除成员失败: ${errorMsg}` : `Failed to remove member: ${errorMsg}`)
				return
			}

			setMembers((prev) => prev.filter((member) => member.member_id !== memberId))
			message.success(is_cn ? '成员已移除' : 'Member removed')
		} catch (error) {
			console.error('Error removing member:', error)
			message.error(is_cn ? '移除成员失败' : 'Failed to remove member')
		}
	}

	const handleResendInvitation = async (invitationId: string) => {
		if (!apiClient || !team) {
			message.error(is_cn ? 'API未初始化或团队不存在' : 'API not initialized or team does not exist')
			return
		}

		try {
			const response = await apiClient.teams.ResendInvitation(team.team_id, invitationId, locale)

			if (apiClient.IsError(response)) {
				console.error('Failed to resend invitation:', response.error)
				const errorMsg = response.error?.error_description || response.error?.error || 'Unknown error'
				message.error(is_cn ? `重发邀请失败: ${errorMsg}` : `Failed to resend invitation: ${errorMsg}`)
				return
			}

			message.success(is_cn ? '邀请邮件已重新发送' : 'Invitation email resent successfully')
		} catch (error) {
			console.error('Error resending invitation:', error)
			message.error(is_cn ? '重发邮请失败' : 'Failed to resend invitation')
		}
	}

	const getRoleDisplayName = (roleId: string) => {
		// 从 config 中查找角色名称
		if (config?.roles) {
			const role = config.roles.find((r) => r.role_id === roleId)
			if (role) {
				return role.label
			}
		}

		// 如果没有配置，使用默认名称
		switch (roleId) {
			case 'owner':
				return is_cn ? '所有者' : 'Owner'
			case 'admin':
				return is_cn ? '管理员' : 'Admin'
			case 'member':
				return is_cn ? '成员' : 'Member'
			default:
				return roleId
		}
	}

	const getStatusDisplayName = (status: string) => {
		switch (status) {
			case 'active':
				return is_cn ? '活跃' : 'Active'
			case 'pending':
				return is_cn ? '待加入' : 'Pending'
			case 'suspended':
				return is_cn ? '已暂停' : 'Suspended'
			default:
				return status
		}
	}

	const handleAddAIMember = async (values: AIMemberValues) => {
		if (!apiClient || !team) {
			message.error(is_cn ? 'API未初始化或团队不存在' : 'API not initialized or team does not exist')
			return
		}

		try {
			setAddingAI(true)

			// Call real API to create robot member
			const response = await apiClient.teams.CreateRobotMember(team.team_id, values)

			if (apiClient.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to create robot member')
			}

			message.success(is_cn ? 'AI 成员添加成功' : 'AI member added successfully')

			// Reload members list
			if (team.team_id) {
				const membersResponse = await apiClient.teams.GetMembers(team.team_id, {
					page: 1,
					pagesize: 100,
					locale: locale
				})
				if (!apiClient.IsError(membersResponse) && membersResponse.data?.data) {
					setMembers(membersResponse.data.data)
				}
			}
		} catch (error: any) {
			console.error('Error adding AI member:', error)
			message.error(
				is_cn
					? `添加 AI 成员失败: ${error.message || '未知错误'}`
					: `Failed to add AI member: ${error.message || 'Unknown error'}`
			)
		} finally {
			setAddingAI(false)
		}
	}

	const handleEditAIMember = (memberId: string) => {
		const member = members.find((m) => m.member_id === memberId)
		if (member) {
			setEditingAIMember(member)
			setEditAIModalVisible(true)
		}
	}

	const handleUpdateAIMember = async (memberId: string, values: AIMemberValues) => {
		if (!apiClient || !team) {
			message.error(is_cn ? 'API未初始化或团队不存在' : 'API not initialized or team does not exist')
			return
		}

		try {
			setUpdatingAI(true)

			// Call real API to update robot member
			const response = await apiClient.teams.UpdateRobotMember(team.team_id, memberId, {
				name: values.name,
				robot_email: values.robot_email, // Globally unique robot email (required)
				email: values.email, // Display-only email (optional)
				bio: values.bio,
				role: values.role,
				report_to: values.report_to,
				prompt: values.prompt,
				llm: values.llm,
				agents: values.agents,
				mcp_tools: values.mcp_tools,
				autonomous_mode: values.autonomous_mode,
				cost_limit: values.cost_limit
			})

			if (apiClient.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to update robot member')
			}

			message.success(is_cn ? 'AI 成员更新成功' : 'AI member updated successfully')

			// Reload members list
			if (team.team_id) {
				const membersResponse = await apiClient.teams.GetMembers(team.team_id, {
					page: 1,
					pagesize: 100,
					locale: locale
				})
				if (!apiClient.IsError(membersResponse) && membersResponse.data?.data) {
					setMembers(membersResponse.data.data)
				}
			}

			setEditAIModalVisible(false)
			setEditingAIMember(null)
		} catch (error: any) {
			console.error('Error updating AI member:', error)
			message.error(
				is_cn
					? `更新 AI 成员失败: ${error.message || '未知错误'}`
					: `Failed to update AI member: ${error.message || 'Unknown error'}`
			)
		} finally {
			setUpdatingAI(false)
		}
	}

	/**
	 * 更新 AI 成员头像
	 * @param memberId - 成员 ID
	 * @param avatar - 头像地址（wrapper 格式，如 __yao.attachment://file123）
	 */
	const handleUpdateAvatar = async (memberId: string, avatar: string) => {
		if (!apiClient || !team) {
			throw new Error(is_cn ? 'API未初始化或团队不存在' : 'API not initialized or team does not exist')
		}

		try {
			// Find the member to verify it's a robot member
			const member = members.find((m) => m.member_id === memberId)
			if (!member || member.member_type !== 'robot') {
				throw new Error(is_cn ? '成员不存在或不是 AI 成员' : 'Member not found or not an AI member')
			}

			// Call API to update only avatar (avatar is in wrapper format: {uploaderID}://{fileID})
			const response = await apiClient.teams.UpdateRobotMember(team.team_id, memberId, {
				avatar: avatar
			})

			if (apiClient.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to update avatar')
			}

			// Reload members list to reflect the change
			if (team.team_id) {
				const membersResponse = await apiClient.teams.GetMembers(team.team_id, {
					page: 1,
					pagesize: 100,
					locale: locale
				})
				if (!apiClient.IsError(membersResponse) && membersResponse.data?.data) {
					setMembers(membersResponse.data.data)
				}
			}
		} catch (error: any) {
			console.error('Error updating avatar:', error)
			throw error
		}
	}

	/**
	 * 更新团队头像
	 * @param avatar - 头像地址（wrapper 格式，如 __yao.attachment://file123）
	 * @param fileId - 文件 ID
	 */
	const handleUpdateTeamAvatar = async (fileId: string, avatar: string) => {
		if (!apiClient || !team) {
			throw new Error(is_cn ? 'API未初始化或团队不存在' : 'API not initialized or team does not exist')
		}

		try {
			// Call API to update team logo (avatar is in wrapper format: {uploaderID}://{fileID})
			const response = await apiClient.teams.UpdateTeam(team.team_id, {
				logo: avatar
			})

			if (apiClient.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to update team logo')
			}

			// Update local team state
			if (response.data) {
				setTeam((prevTeam) => ({
					...prevTeam!,
					logo: avatar
				}))
			}

			message.success(is_cn ? '团队头像更新成功' : 'Team avatar updated successfully')
		} catch (error: any) {
			console.error('Error updating team avatar:', error)
			message.error(is_cn ? '团队头像更新失败' : 'Failed to update team avatar')
			throw error
		}
	}

	if (loading) {
		return (
			<div className={styles.team}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '团队' : 'Team'}</h2>
						<p>
							{is_cn
								? '管理您的团队成员和邀请设置'
								: 'Manage your team members and invitation settings'}
						</p>
					</div>
				</div>
				<div className={styles.panel}>
					<div className={styles.panelContent}>
						<div className={styles.loadingState}>
							<Icon
								name='material-hourglass_empty'
								size={32}
								className={styles.loadingIcon}
							/>
							<span>{is_cn ? '加载中...' : 'Loading...'}</span>
						</div>
					</div>
				</div>
			</div>
		)
	}

	// 如果没有团队，显示创建团队界面（与 ApiKeys 2FA 界面一样，没有 Header）
	if (!loading && !team) {
		return (
			<div className={styles.team}>
				<CreateTeamForm
					onFinish={handleCreateTeam}
					loading={loading}
					configLoading={configLoading}
					is_cn={is_cn}
				/>
			</div>
		)
	}

	return (
		<div className={styles.team}>
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '团队' : 'Team'}</h2>
					<p>
						{is_cn
							? '管理您的团队成员和邀请设置'
							: 'Manage your team members and invitation settings'}
					</p>
				</div>
				<div className={styles.headerActions}>
					{/* TODO: Re-enable AI member management when moved back from Mission Control */}
					{permissions.canInviteMembers && (
						<Button
							type='primary'
							size='small'
							icon={<Icon name='material-person_add' size={12} />}
							onClick={() => setInviteModalVisible(true)}
							disabled={!team || loading || configLoading}
						>
							{is_cn ? '邀请成员' : 'Invite Member'}
						</Button>
					)}
				</div>
			</div>

			{/* 团队基本信息部分 */}
			<div className={styles.teamInfoPanel}>
				<div className={styles.teamInfoSection}>
					{/* 编辑按钮区域 */}
					{permissions.canEditTeam && (
						<div className={styles.editActions}>
							{editingTeam ? (
								<>
									<Button
										type='primary'
										size='small'
										icon={<Icon name='icon-check' size={12} />}
										onClick={() => teamForm.submit()}
										loading={updatingTeam}
										disabled={updatingTeam}
									>
										{is_cn ? '保存' : 'Save'}
									</Button>
									<Button
										size='small'
										icon={<Icon name='icon-x' size={12} />}
										onClick={() => setEditingTeam(false)}
										disabled={updatingTeam}
									>
										{is_cn ? '取消' : 'Cancel'}
									</Button>
								</>
							) : (
								<Button
									type='default'
									size='small'
									icon={<Icon name='material-edit' size={12} />}
									onClick={() => setEditingTeam(true)}
									disabled={loading || configLoading}
								>
									{is_cn ? '编辑' : 'Edit'}
								</Button>
							)}
						</div>
					)}

					{editingTeam ? (
						<TeamEditForm
							form={teamForm}
							team={team}
							onFinish={handleUpdateTeam}
							is_cn={is_cn}
						/>
					) : (
						<div className={styles.teamHeader}>
							<div className={styles.teamAvatar}>
								<UserAvatar
									size='xl'
									shape='circle'
									displayType='avatar'
									data={{
										id: team?.team_id || '',
										avatar: team?.logo,
										name: team?.name || 'Team'
									}}
									onUploadSuccess={
										permissions.canEditTeam ? handleUpdateTeamAvatar : undefined
									}
								/>
							</div>
							<div className={styles.teamInfo}>
								<h3 className={styles.teamName}>{team?.name}</h3>
								<p className={styles.teamDescription}>
									{team?.description || (is_cn ? '暂无简介' : 'No description')}
								</p>
								<div className={styles.teamMeta}>
									<span>
										{members.length} {is_cn ? '名成员' : 'members'}
									</span>
									<span>•</span>
									<span>
										{is_cn ? '创建于' : 'Created'}{' '}
										{team?.created_at
											? new Date(team.created_at).toLocaleDateString()
											: '-'}
									</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* 团队成员和邀请列表部分 */}
			<div className={styles.membersPanel}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionInfo}>
						<h4>
							{is_cn ? '团队成员' : 'Team Members'} ({members.length})
						</h4>
						<p>{is_cn ? '管理团队成员的权限和状态' : 'Manage member permissions and status'}</p>
					</div>
				</div>

				<div className={styles.unifiedMembersList}>
					{/* TODO: Re-enable onEditAIMember when AI member management moved back from Mission Control */}
					<MemberList
						members={members}
						is_cn={is_cn}
						getRoleDisplayName={getRoleDisplayName}
						onRemoveMember={permissions.canRemoveMembers ? handleRemoveMember : undefined}
						onResendInvitation={
							permissions.canInviteMembers ? handleResendInvitation : undefined
						}
						baseInviteURL={window.location.origin + '/invite'}
						onAvatarUpdate={handleUpdateAvatar}
					/>
				</div>
			</div>

			{/* 邀请成员弹窗 */}
			<InviteForm
				visible={inviteModalVisible}
				onClose={() => setInviteModalVisible(false)}
				onInvite={handleInviteMember}
				onGenerateLink={handleGenerateInviteLink}
				inviteLink={inviteLink}
				setInviteLink={setInviteLink}
				generatingLink={generatingLink}
				inviting={inviting}
				config={config}
				configLoading={configLoading}
				is_cn={is_cn}
				locale={locale}
			/>

			{/* TODO: Re-enable AI member management when moved back from Mission Control */}
			{/* <AddAIMemberWizard
				visible={addAIModalVisible}
				onClose={() => setAddAIModalVisible(false)}
				onAdd={handleAddAIMember}
				config={config}
				configLoading={configLoading}
				adding={addingAI}
				members={members}
				is_cn={is_cn}
				teamId={team?.team_id}
			/>

			<EditAIMember
				visible={editAIModalVisible}
				onClose={() => {
					setEditAIModalVisible(false)
					setEditingAIMember(null)
				}}
				onUpdate={handleUpdateAIMember}
				member={editingAIMember}
				config={config}
				configLoading={configLoading}
				updating={updatingAI}
				members={members}
				is_cn={is_cn}
				teamId={team?.team_id}
			/> */}
		</div>
	)
}

export default Team
