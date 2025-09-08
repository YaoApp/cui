import { useState, useEffect } from 'react'
import { Form, message, Modal } from 'antd'
import { getLocale } from '@umijs/max'
import { mockApi, Team as TeamType, TeamMember, TeamInvitation } from '../../mockData'
import { Button } from '@/components/ui'
import { Input, Select, Avatar } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import styles from './index.less'

const Team = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [form] = Form.useForm()

	const [loading, setLoading] = useState(true)
	const [team, setTeam] = useState<TeamType | null>(null)
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
		const loadTeamData = async () => {
			try {
				setLoading(true)
				// 先尝试获取团队信息
				const teamData = await mockApi.getTeam().catch(() => null)
				setTeam(teamData)

				// 如果有团队，再加载成员和邀请数据
				if (teamData) {
					const [membersData, invitationsData] = await Promise.all([
						mockApi.getTeamMembers(),
						mockApi.getTeamInvitations()
					])
					setMembers(membersData)
					setInvitations(invitationsData)
					teamForm.setFieldsValue(teamData)
				}
			} catch (error) {
				console.error('Failed to load team data:', error)
				message.error(is_cn ? '加载团队信息失败' : 'Failed to load team data')
			} finally {
				setLoading(false)
			}
		}

		loadTeamData()
	}, [is_cn, teamForm])

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
		try {
			setLoading(true)
			// Mock create team
			await new Promise((resolve) => setTimeout(resolve, 1000))
			const newTeam: TeamType = {
				id: '1',
				name: values.name,
				description: values.description,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				member_count: 1,
				invite_link: '',
				invite_link_enabled: false
			}
			// 更新团队成员数量
			newTeam.member_count = 5 // 包括owner在内的初始成员数量
			setTeam(newTeam)

			// 创建团队后，自动添加一些初始成员
			const initialMembers: TeamMember[] = [
				{
					id: '1',
					name: 'Alex Chen',
					email: 'alex@example.com',
					role: 'owner',
					status: 'active',
					joined_at: new Date().toISOString(),
					last_active: new Date().toISOString()
				},
				{
					id: '2',
					name: 'Sarah Wilson',
					email: 'sarah@example.com',
					avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=fde68a',
					role: 'admin',
					status: 'active',
					joined_at: new Date().toISOString(),
					last_active: new Date().toISOString()
				},
				{
					id: '3',
					name: 'David Kim',
					email: 'david@example.com',
					avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=c7d2fe',
					role: 'member',
					status: 'active',
					joined_at: new Date().toISOString(),
					last_active: new Date().toISOString()
				},
				{
					id: '4',
					name: 'Emily Rodriguez',
					email: 'emily@example.com',
					avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily&backgroundColor=fecaca',
					role: 'member',
					status: 'active',
					joined_at: new Date().toISOString(),
					last_active: new Date().toISOString()
				},
				{
					id: '5',
					name: 'James Thompson',
					email: 'james@example.com',
					role: 'member',
					status: 'pending',
					joined_at: new Date().toISOString()
				}
			]

			// 同时添加一些待处理邀请
			const initialInvitations: TeamInvitation[] = [
				{
					id: '1',
					email: 'alice.johnson@example.com',
					role: 'member',
					invited_by: 'Alex Chen',
					invited_at: new Date().toISOString(),
					expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后过期
					status: 'pending'
				},
				{
					id: '2',
					email: 'bob.smith@example.com',
					role: 'admin',
					invited_by: 'Alex Chen',
					invited_at: new Date().toISOString(),
					expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
					status: 'pending'
				}
			]

			setMembers(initialMembers)
			setInvitations(initialInvitations)
			message.success(
				is_cn ? '团队创建成功，已添加初始成员' : 'Team created successfully with initial members'
			)
		} catch (error) {
			message.error(is_cn ? '创建团队失败' : 'Failed to create team')
		} finally {
			setLoading(false)
		}
	}

	const handleUpdateTeam = async (values: { name: string; description?: string; avatar?: string }) => {
		try {
			setUpdatingTeam(true)
			// Mock update
			await new Promise((resolve) => setTimeout(resolve, 1000))
			setTeam((prev) => (prev ? { ...prev, ...values, updated_at: new Date().toISOString() } : null))
			setEditingTeam(false) // 保存后返回展示状态
			message.success(is_cn ? '团队信息已更新' : 'Team information updated')
		} catch (error) {
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
										<Button type='primary' htmlType='submit' loading={loading}>
											{is_cn ? '创建团队' : 'Create Team'}
										</Button>
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
									value={team?.avatar}
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
								{team?.avatar ? (
									<img src={team.avatar} alt={team.name} />
								) : (
									<div className={styles.avatarPlaceholder}>
										<Icon name='material-group' size={24} />
									</div>
								)}
							</div>
							<div className={styles.teamInfo}>
								<h3 className={styles.teamName}>{team?.name}</h3>
								<p className={styles.teamDescription}>
									{team?.description || (is_cn ? '暂无简介' : 'No description')}
								</p>
								<div className={styles.teamMeta}>
									<span>
										{team?.member_count} {is_cn ? '名成员' : 'members'}
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

			{/* 团队成员列表部分 */}
			<div className={styles.membersPanel}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionInfo}>
						<h4>
							{is_cn ? '团队成员' : 'Team Members'} ({members.length})
						</h4>
						<p>{is_cn ? '管理团队成员的权限和状态' : 'Manage member permissions and status'}</p>
					</div>
				</div>
				<div className={styles.sectionDivider} />

				<div className={styles.membersSection}>
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
										type='text'
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
				</div>

				{/* 待处理邀请 */}
				{invitations.length > 0 && (
					<>
						<div className={styles.sectionHeader}>
							<div className={styles.sectionInfo}>
								<h4>
									{is_cn ? '待处理邀请' : 'Pending Invitations'} (
									{invitations.length})
								</h4>
								<p>
									{is_cn
										? '等待接受的团队邀请'
										: 'Team invitations waiting to be accepted'}
								</p>
							</div>
						</div>
						<div className={styles.sectionDivider} />

						<div className={styles.invitationsSection}>
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
											type='text'
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
						</div>
					</>
				)}
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
