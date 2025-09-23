import { useState, useEffect } from 'react'
import { Form, message, Modal } from 'antd'
import { getLocale } from '@umijs/max'
import { mockApi, Team as TeamType, TeamMember, TeamInvitation } from '../../mockData'
import { Button } from '@/components/ui'
import { Input, Select, Avatar } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import { User } from '@/openapi/user'
import { UserTeam, CreateTeamRequest, UserTeamDetail } from '@/openapi/user/types'
import styles from './index.less'

const Team = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [form] = Form.useForm()

	const [loading, setLoading] = useState(true)
	const [team, setTeam] = useState<UserTeamDetail | null>(null)
	const [apiClient, setApiClient] = useState<User | null>(null)
	const [members, setMembers] = useState<TeamMember[]>([])
	const [invitations, setInvitations] = useState<TeamInvitation[]>([])
	const [inviteModalVisible, setInviteModalVisible] = useState(false)
	const [inviting, setInviting] = useState(false)
	const [editingTeam, setEditingTeam] = useState(false)
	const [updatingTeam, setUpdatingTeam] = useState(false)
	const [teamForm] = Form.useForm()
	const [inviteLink, setInviteLink] = useState('')
	const [generatingLink, setGeneratingLink] = useState(false)

	useEffect(() => {
		const initializeAPI = () => {
			if (window.$app?.openapi) {
				const client = new User(window.$app.openapi)
				setApiClient(client)
			} else {
				console.error('OpenAPI not initialized')
				message.error(is_cn ? 'API未初始化' : 'API not initialized')
			}
		}

		initializeAPI()
	}, [])

	useEffect(() => {
		const loadTeamData = async () => {
			if (!apiClient) return

			try {
				setLoading(true)
				// 先尝试获取用户的团队列表
				const teamsResponse = await apiClient.teams.GetTeams({ page: 1, pagesize: 1 })

				if (apiClient.IsError(teamsResponse)) {
					console.error('Failed to load teams:', teamsResponse.error)
					// 如果获取失败，可能是还没有团队，不显示错误
					setTeam(null)
				} else {
					const teamsData = teamsResponse.data
					if (teamsData && teamsData.data && teamsData.data.length > 0) {
						// 用户已有团队，获取第一个团队的详细信息
						const firstTeam = teamsData.data[0]
						const teamDetailResponse = await apiClient.teams.GetTeam(firstTeam.team_id)

						if (!apiClient.IsError(teamDetailResponse) && teamDetailResponse.data) {
							setTeam(teamDetailResponse.data)
							teamForm.setFieldsValue({
								name: teamDetailResponse.data.name,
								description: teamDetailResponse.data.description
							})

							// TODO: 加载成员和邀请数据（后续实现）
							// const [membersData, invitationsData] = await Promise.all([
							//     apiClient.teams.GetTeamMembers(firstTeam.team_id),
							//     apiClient.teams.GetTeamInvitations(firstTeam.team_id)
							// ])
							// setMembers(membersData)
							// setInvitations(invitationsData)
						} else {
							console.error('Failed to load team details:', teamDetailResponse.error)
							// 使用基本信息构造UserTeamDetail类型
							setTeam({
								...firstTeam,
								settings: undefined
							})
						}
					} else {
						// 用户还没有团队
						setTeam(null)
					}
				}
			} catch (error) {
				console.error('Failed to load team data:', error)
				message.error(is_cn ? '加载团队信息失败' : 'Failed to load team data')
			} finally {
				setLoading(false)
			}
		}

		if (apiClient) {
			loadTeamData()
		}
	}, [apiClient, is_cn, teamForm])

	const handleInviteMember = async (values: { email: string; role: string }) => {
		try {
			setInviting(true)
			// Mock invite
			await new Promise((resolve) => setTimeout(resolve, 1000))
			const newInvitation: TeamInvitation = {
				id: Date.now().toString(),
				email: values.email,
				role: values.role as 'admin' | 'member',
				invited_by: 'Max Zhang',
				invited_at: new Date().toISOString(),
				expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
				status: 'pending'
			}
			setInvitations((prev) => [...prev, newInvitation])
			setInviteModalVisible(false)
			form.resetFields()
			message.success(is_cn ? '邀请发送成功' : 'Invitation sent successfully')
		} catch (error) {
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
				description: values.description || undefined
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
					teamForm.setFieldsValue({
						name: teamDetailResponse.data.name,
						description: teamDetailResponse.data.description
					})
				} else {
					// 如果获取详情失败，使用基本信息构造UserTeamDetail类型
					setTeam({
						...newTeam,
						settings: undefined
					})
					teamForm.setFieldsValue({
						name: newTeam.name,
						description: newTeam.description
					})
				}

				// TODO: 后续实现成员和邀请管理
				// 现在先使用mock数据来保持界面完整性
				const initialMembers: TeamMember[] = [
					{
						id: '1',
						name: 'Team Owner',
						email: 'owner@example.com',
						role: 'owner',
						status: 'active',
						joined_at: new Date().toISOString(),
						last_active: new Date().toISOString()
					}
				]
				setMembers(initialMembers)
				setInvitations([])

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
				description: values.description || undefined
				// TODO: 后续支持avatar更新
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
		try {
			setGeneratingLink(true)
			// Mock generate invite link
			await new Promise((resolve) => setTimeout(resolve, 1000))
			const newLink = `https://app.example.com/team/invite/${Math.random()
				.toString(36)
				.substring(2, 15)}?role=${role}`
			setInviteLink(newLink)
			message.success(is_cn ? '邀请链接已生成' : 'Invite link generated')
		} catch (error) {
			message.error(is_cn ? '生成邀请链接失败' : 'Failed to generate invite link')
		} finally {
			setGeneratingLink(false)
		}
	}

	const copyInviteLink = () => {
		if (inviteLink) {
			navigator.clipboard.writeText(inviteLink).then(() => {
				message.success(is_cn ? '邀请链接已复制到剪贴板' : 'Invite link copied to clipboard')
			})
		}
	}

	const handleRemoveMember = async (memberId: string) => {
		try {
			// Mock remove
			await new Promise((resolve) => setTimeout(resolve, 500))
			setMembers((prev) => prev.filter((member) => member.id !== memberId))
			message.success(is_cn ? '成员已移除' : 'Member removed')
		} catch (error) {
			message.error(is_cn ? '移除成员失败' : 'Failed to remove member')
		}
	}

	const handleCancelInvitation = async (invitationId: string) => {
		try {
			// Mock cancel
			await new Promise((resolve) => setTimeout(resolve, 500))
			setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
			message.success(is_cn ? '邀请已取消' : 'Invitation cancelled')
		} catch (error) {
			message.error(is_cn ? '取消邀请失败' : 'Failed to cancel invitation')
		}
	}

	const getRoleDisplayName = (role: string) => {
		switch (role) {
			case 'owner':
				return is_cn ? '所有者' : 'Owner'
			case 'admin':
				return is_cn ? '管理员' : 'Admin'
			case 'member':
				return is_cn ? '成员' : 'Member'
			default:
				return role
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

	const roleOptions = [
		{ label: is_cn ? '成员' : 'Member', value: 'member' },
		{ label: is_cn ? '管理员' : 'Admin', value: 'admin' }
	]

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
				<div className={styles.promptPanel}>
					<div className={styles.promptContainer}>
						<div className={styles.promptContent}>
							<div className={styles.promptIcon}>
								<Icon name='material-group_add' size={48} />
							</div>
							<h3 className={styles.promptTitle}>
								{is_cn ? '创建您的团队' : 'Create Your Team'}
							</h3>
							<p className={styles.promptDescription}>
								{is_cn
									? '设置团队名称和简介，开始与他人协作'
									: 'Set up your team name and description to start collaborating'}
							</p>
							<div className={styles.promptActions}>
								<Form
									onFinish={handleCreateTeam}
									layout='vertical'
									className={styles.createTeamForm}
								>
									<Form.Item
										name='name'
										label={is_cn ? '团队名称' : 'Team Name'}
										rules={[
											{
												required: true,
												message: is_cn
													? '请输入团队名称'
													: 'Please enter team name'
											}
										]}
									>
										<Input
											schema={{
												type: 'string',
												placeholder: is_cn
													? '请输入团队名称'
													: 'Enter team name'
											}}
											error=''
											hasError={false}
										/>
									</Form.Item>
									<Form.Item
										name='description'
										label={is_cn ? '团队简介' : 'Team Description'}
									>
										<Input
											schema={{
												type: 'string',
												placeholder: is_cn
													? '请输入团队简介'
													: 'Enter team description'
											}}
											error=''
											hasError={false}
										/>
									</Form.Item>
									<div className={styles.createTeamActions}>
										<button
											type='submit'
											className='ant-btn ant-btn-primary'
											disabled={loading}
										>
											{loading && (
												<span className='ant-btn-loading-icon'></span>
											)}
											{is_cn ? '创建团队' : 'Create Team'}
										</button>
									</div>
								</Form>
							</div>
						</div>
					</div>
				</div>
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
					<Button
						type='primary'
						size='small'
						icon={<Icon name='material-person_add' size={12} />}
						onClick={() => setInviteModalVisible(true)}
						disabled={!team}
					>
						{is_cn ? '邀请成员' : 'Invite Member'}
					</Button>
				</div>
			</div>

			{/* 团队基本信息部分 */}
			<div className={styles.teamInfoPanel}>
				<div className={styles.teamInfoSection}>
					{/* 编辑按钮区域 */}
					<div className={styles.editActions}>
						{editingTeam ? (
							<>
								<Button
									type='primary'
									size='small'
									icon={<Icon name='icon-check' size={12} />}
									onClick={() => teamForm.submit()}
									loading={updatingTeam}
								>
									{is_cn ? '保存' : 'Save'}
								</Button>
								<Button
									size='small'
									icon={<Icon name='icon-x' size={12} />}
									onClick={() => {
										setEditingTeam(false)
										teamForm.setFieldsValue(team)
									}}
								>
									{is_cn ? '取消' : 'Cancel'}
								</Button>
							</>
						) : (
							<Button
								type='default'
								size='small'
								icon={<Icon name='material-edit' size={12} />}
								onClick={() => {
									teamForm.setFieldsValue(team)
									setEditingTeam(true)
								}}
							>
								{is_cn ? '编辑' : 'Edit'}
							</Button>
						)}
					</div>

					{editingTeam ? (
						<div className={styles.editTeamContainer}>
							{/* Avatar Section - Always Centered */}
							<div className={styles.avatarSection}>
								<Avatar
									schema={{
										type: 'string',
										variant: 'large',
										userName: team?.name || '',
										placeholder: is_cn ? '更换团队头像' : 'Change Team Avatar',
										readOnly: false
									}}
									value={undefined}
									onChange={(value) => {
										teamForm.setFieldsValue({ avatar: value })
									}}
									error=''
									hasError={false}
								/>
							</div>

							{/* Profile Fields */}
							<Form form={teamForm} onFinish={handleUpdateTeam}>
								<div className={styles.fieldsContainer}>
									{/* Team Name Field */}
									<div className={styles.fieldItem}>
										<div className={styles.fieldIcon}>
											<Icon name='material-group' size={20} />
										</div>
										<div className={styles.fieldContent}>
											<div className={styles.fieldLabel}>
												{is_cn ? '团队名称' : 'Team Name'}
											</div>
											<Form.Item name='name' style={{ margin: 0 }}>
												<Input
													schema={{
														type: 'string',
														placeholder: is_cn
															? '请输入团队名称'
															: 'Enter team name'
													}}
													error=''
													hasError={false}
												/>
											</Form.Item>
										</div>
									</div>

									{/* Team Description Field */}
									<div className={styles.fieldItem}>
										<div className={styles.fieldIcon}>
											<Icon name='material-description' size={20} />
										</div>
										<div className={styles.fieldContent}>
											<div className={styles.fieldLabel}>
												{is_cn ? '团队简介' : 'Team Description'}
											</div>
											<Form.Item name='description' style={{ margin: 0 }}>
												<Input
													schema={{
														type: 'string',
														placeholder: is_cn
															? '请输入团队简介'
															: 'Enter team description'
													}}
													error=''
													hasError={false}
												/>
											</Form.Item>
										</div>
									</div>

									{/* Hidden avatar field */}
									<Form.Item name='avatar' style={{ display: 'none' }} />
								</div>
							</Form>
						</div>
					) : (
						<div className={styles.teamHeader}>
							<div className={styles.teamAvatar}>
								<div className={styles.avatarPlaceholder}>
									<Icon name='material-group' size={24} />
								</div>
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
					{/* 团队成员列表 */}
					{members.map((member) => (
						<div key={member.id} className={styles.memberCard}>
							<div className={styles.memberInfo}>
								<div className={styles.memberAvatar}>
									{member.avatar ? (
										<img src={member.avatar} alt={member.name} />
									) : (
										<div className={styles.avatarPlaceholder}>
											{member.name.charAt(0).toUpperCase()}
										</div>
									)}
								</div>
								<div className={styles.memberDetails}>
									<div className={styles.memberName}>{member.name}</div>
									<div className={styles.memberEmail}>{member.email}</div>
									<div className={styles.memberMeta}>
										<span className={styles.memberRole} data-role={member.role}>
											{getRoleDisplayName(member.role)}
										</span>
										<span
											className={styles.memberStatus}
											data-status={member.status}
										>
											{getStatusDisplayName(member.status)}
										</span>
										{member.last_active && (
											<span className={styles.memberLastActive}>
												{is_cn ? '最后活跃：' : 'Last active: '}
												{new Date(
													member.last_active
												).toLocaleDateString()}
											</span>
										)}
									</div>
								</div>
							</div>
							<div className={styles.memberActions}>
								{member.role !== 'owner' && (
									<Button
										type='default'
										size='small'
										className={styles.actionButton}
										onClick={() => {
											Modal.confirm({
												title: is_cn
													? '确认移除成员'
													: 'Confirm Remove Member',
												content: is_cn
													? `确定要移除 ${member.name} 吗？`
													: `Are you sure to remove ${member.name}?`,
												okText: is_cn ? '移除' : 'Remove',
												cancelText: is_cn ? '取消' : 'Cancel',
												okType: 'danger',
												onOk: () => handleRemoveMember(member.id)
											})
										}}
									>
										{is_cn ? '移除' : 'Remove'}
									</Button>
								)}
							</div>
						</div>
					))}

					{/* 待处理邀请 */}
					{invitations.length > 0 && (
						<>
							<div className={styles.sectionSeparator}>
								<h5 className={styles.separatorTitle}>
									{is_cn ? '待处理邀请' : 'Pending Invitations'}
								</h5>
							</div>
							{invitations.map((invitation) => (
								<div key={invitation.id} className={styles.invitationCard}>
									<div className={styles.invitationInfo}>
										<div className={styles.invitationAvatar}>
											<Icon name='material-mail_outline' size={20} />
										</div>
										<div className={styles.invitationDetails}>
											<div className={styles.invitationEmail}>
												{invitation.email}
											</div>
											<div className={styles.invitationMeta}>
												<span className={styles.invitationRole}>
													{getRoleDisplayName(invitation.role)}
												</span>
												<span>
													{is_cn ? '邀请人：' : 'Invited by: '}
													{invitation.invited_by}
												</span>
												<span>
													{is_cn ? '过期时间：' : 'Expires: '}
													{new Date(
														invitation.expires_at
													).toLocaleDateString()}
												</span>
											</div>
										</div>
									</div>
									<div className={styles.invitationActions}>
										<Button
											type='default'
											size='small'
											className={styles.actionButton}
											onClick={() => {
												Modal.confirm({
													title: is_cn
														? '确认取消邀请'
														: 'Confirm Cancel Invitation',
													content: is_cn
														? `确定要取消对 ${invitation.email} 的邀请吗？`
														: `Are you sure to cancel the invitation to ${invitation.email}?`,
													okText: is_cn
														? '取消邀请'
														: 'Cancel Invitation',
													cancelText: is_cn ? '保留' : 'Keep',
													okType: 'danger',
													onOk: () =>
														handleCancelInvitation(
															invitation.id
														)
												})
											}}
										>
											{is_cn ? '取消' : 'Cancel'}
										</Button>
									</div>
								</div>
							))}
						</>
					)}
				</div>
			</div>

			{/* 邀请成员弹窗 */}
			<Modal
				title={
					<div className={styles.modalHeader}>
						<div className={styles.titleSection}>
							<Icon name='material-person_add' size={16} className={styles.titleIcon} />
							<span className={styles.modalTitle}>
								{is_cn ? '邀请团队成员' : 'Invite Team Member'}
							</span>
						</div>
						<div
							className={styles.closeButton}
							onClick={() => {
								setInviteModalVisible(false)
								form.resetFields()
							}}
						>
							<Icon name='material-close' size={16} className={styles.closeIcon} />
						</div>
					</div>
				}
				open={inviteModalVisible}
				onCancel={() => {
					setInviteModalVisible(false)
					form.resetFields()
				}}
				footer={null}
				width={480}
				className={styles.inviteModal}
				destroyOnClose
				closable={false}
			>
				<div className={styles.modalContent}>
					<div className={styles.inviteOptions}>
						{/* 邮箱邀请方式 */}
						<div className={styles.inviteSection}>
							<h5>{is_cn ? '通过邮箱邀请' : 'Invite by Email'}</h5>
							<Form form={form} layout='vertical' onFinish={handleInviteMember}>
								<Form.Item
									name='email'
									label={is_cn ? '邮箱地址' : 'Email Address'}
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
												? '请输入邮箱地址'
												: 'Enter email address'
										}}
										error=''
										hasError={false}
									/>
								</Form.Item>

								<Form.Item
									name='role'
									label={is_cn ? '角色权限' : 'Role'}
									initialValue='member'
									rules={[
										{
											required: true,
											message: is_cn
												? '请选择角色权限'
												: 'Please select role'
										}
									]}
								>
									<Select
										schema={{
											type: 'string',
											enum: roleOptions,
											placeholder: is_cn ? '选择角色权限' : 'Select role'
										}}
										error=''
										hasError={false}
									/>
								</Form.Item>

								<div className={styles.emailInviteActions}>
									<button
										type='submit'
										className={styles.submitButton}
										disabled={inviting}
									>
										{inviting && (
											<Icon
												name='material-refresh'
												size={12}
												className={styles.buttonLoadingIcon}
											/>
										)}
										{is_cn ? '发送邀请' : 'Send Invitation'}
									</button>
								</div>
							</Form>
						</div>

						<div className={styles.divider}>
							<span>{is_cn ? '或' : 'OR'}</span>
						</div>

						{/* 邀请链接方式 */}
						<div className={styles.inviteSection}>
							<h5>{is_cn ? '生成邀请链接' : 'Generate Invite Link'}</h5>
							<p className={styles.linkDescription}>
								{is_cn
									? '生成一个邀请链接，可以分享给多个人使用'
									: 'Generate an invite link that can be shared with multiple people'}
							</p>

							<div className={styles.linkGenerate}>
								<Select
									schema={{
										type: 'string',
										enum: roleOptions,
										placeholder: is_cn ? '选择角色权限' : 'Select role'
									}}
									value={form.getFieldValue('role') || 'member'}
									onChange={(value) => form.setFieldsValue({ role: value })}
									error=''
									hasError={false}
								/>
								<Button
									type='primary'
									onClick={() =>
										handleGenerateInviteLink(
											form.getFieldValue('role') || 'member'
										)
									}
									loading={generatingLink}
									icon={<Icon name='material-link' size={14} />}
								>
									{is_cn ? '生成链接' : 'Generate Link'}
								</Button>
							</div>

							{inviteLink && (
								<div className={styles.generatedLink}>
									<div className={styles.linkDisplay}>
										<code className={styles.linkText}>{inviteLink}</code>
									</div>
									<div className={styles.linkFooter}>
										<p className={styles.linkNote}>
											{is_cn
												? '此链接将在7天后过期'
												: 'This link will expire in 7 days'}
										</p>
										<div className={styles.linkActions}>
											<Button
												type='default'
												size='small'
												onClick={copyInviteLink}
											>
												{is_cn ? '复制' : 'Copy'}
											</Button>
											<Button
												type='default'
												size='small'
												onClick={() => setInviteLink('')}
											>
												{is_cn ? '取消' : 'Cancel'}
											</Button>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>

					<div className={styles.modalActions}>
						<Button
							onClick={() => {
								setInviteModalVisible(false)
								form.resetFields()
								setInviteLink('')
							}}
							disabled={inviting || generatingLink}
						>
							{is_cn ? '关闭' : 'Close'}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default Team
