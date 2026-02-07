import { useState, useEffect } from 'react'
import { Form, message } from 'antd'
import { getLocale } from '@umijs/max'
import { GetCurrentUser, IsTeamMember } from '@/pages/auth/auth'
import { useGlobal } from '@/context/app'
import { local } from '@yaoapp/storex'
import Icon from '@/widgets/Icon'
import UserAvatar from '@/widgets/UserAvatar'
import { Input, RadioGroup } from '@/components/ui/inputs'
import Button from '@/components/ui/Button'
import { User } from '@/openapi/user'
import type { SigninProvider } from '@/openapi/user/types'
import ChangePasswordModal from './ChangePasswordModal'
import styles from './index.less'

interface PersonalProfile {
	name?: string
	gender?: string
	website?: string
	picture?: string
}

interface MemberProfile {
	display_name?: string
	bio?: string
	avatar?: string
	email?: string
}

const Profile = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [form] = Form.useForm()
	const global = useGlobal()

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [editing, setEditing] = useState(false)
	const [isTeamMember, setIsTeamMember] = useState(false)
	const [profileData, setProfileData] = useState<PersonalProfile | MemberProfile | null>(null)
	const [teamId, setTeamId] = useState<string | undefined>(undefined)
	const [userId, setUserId] = useState<string | undefined>(undefined)
	const [apiClient, setApiClient] = useState<User | null>(null)
	const [passwordModalVisible, setPasswordModalVisible] = useState(false)
	const [authProvider, setAuthProvider] = useState<SigninProvider | null>(null)

	// 监听表单的头像字段变化
	const formAvatar = Form.useWatch('avatar', form)
	const formPicture = Form.useWatch('picture', form)

	// Initialize API client
	useEffect(() => {
		const initializeAPI = async () => {
			if (window.$app?.openapi) {
				const client = new User(window.$app.openapi)
				setApiClient(client)
			} else {
				console.error('OpenAPI not initialized')
				message.error(is_cn ? 'API未初始化' : 'API not initialized')
			}
		}

		initializeAPI()
	}, [is_cn])

	// Load auth provider info for third-party login display
	useEffect(() => {
		const authSource = global.userInfo?.['yao:auth_source']
		if (!apiClient || !authSource || authSource === 'password') return

		const loadProvider = async () => {
			try {
				const configRes = await apiClient.auth.GetEntryConfig(locale)
				if (!apiClient.IsError(configRes) && configRes.data?.third_party?.providers) {
					const provider = configRes.data.third_party.providers.find(
						(p) => p.id === authSource
					)
					if (provider) setAuthProvider(provider)
				}
			} catch (error) {
				console.error('Failed to load auth provider:', error)
			}
		}
		loadProvider()
	}, [apiClient, locale, global.userInfo])

	// Load profile data
	useEffect(() => {
		const loadProfile = async () => {
			if (!apiClient) return

			try {
				setLoading(true)

				// Check if user is a team member
				const currentUser = GetCurrentUser()
				if (!currentUser) {
					message.error(is_cn ? '未登录' : 'Not logged in')
					return
				}

				const isMember = IsTeamMember()
				setIsTeamMember(isMember)
				setUserId(String(currentUser.id))

				if (isMember) {
					// Load team member profile
					setTeamId(currentUser.team_id)

					const response = await apiClient.teams.GetMemberProfile(
						currentUser.team_id!,
						String(currentUser.id)
					)

					if (apiClient.IsError(response)) {
						throw new Error(
							`Failed to load member profile: ${
								response.error?.error_description || 'Unknown error'
							}`
						)
					}

					const memberProfile: MemberProfile = {
						display_name: response.data?.display_name || '',
						bio: response.data?.bio || '',
						avatar: response.data?.avatar || '',
						email: response.data?.email || ''
					}

					setProfileData(memberProfile)
				} else {
					// Load personal profile
					const response = await apiClient.profile.GetProfile()

					if (apiClient.IsError(response)) {
						throw new Error(
							`Failed to load profile: ${
								response.error?.error_description || 'Unknown error'
							}`
						)
					}

					const personalProfile: PersonalProfile = {
						name: response.data?.name || '',
						gender: response.data?.gender || '',
						website: response.data?.website || '',
						picture: response.data?.picture || ''
					}

					setProfileData(personalProfile)
				}
			} catch (error) {
				console.error('Failed to load profile data:', error)
				const errorMessage = error instanceof Error ? error.message : 'Unknown error'
				message.error(
					is_cn
						? `加载个人资料失败: ${errorMessage}`
						: `Failed to load profile data: ${errorMessage}`
				)
			} finally {
				setLoading(false)
			}
		}

		loadProfile()
	}, [apiClient, is_cn])

	// Sync form values after loading completes and Form is mounted
	useEffect(() => {
		if (!loading && profileData) {
			form.setFieldsValue(profileData)
		}
	}, [loading, profileData, form])

	const handleSave = async (values: PersonalProfile | MemberProfile) => {
		if (!apiClient) {
			message.error(is_cn ? 'API未初始化' : 'API not initialized')
			return
		}

		try {
			setSaving(true)

			if (isTeamMember && teamId && userId) {
				// Update team member profile
				const response = await apiClient.teams.UpdateMemberProfile(
					teamId,
					userId,
					values as MemberProfile
				)

				if (apiClient.IsError(response)) {
					throw new Error('Failed to update member profile')
				}

				setProfileData(values as MemberProfile)

				// Update global user info for team members
				const memberValues = values as MemberProfile
				if (global.user) {
					// Update App.User in global state and localStorage
					global.user = {
						...global.user,
						member: {
							...global.user.member,
							display_name: memberValues.display_name,
							bio: memberValues.bio,
							avatar: memberValues.avatar,
							email: memberValues.email
						}
					}
					local.user = global.user
				}

				// Update UserInfo (OIDC format) in global state
				if (global.userInfo) {
					global.setUserInfo({
						...global.userInfo,
						'yao:member': {
							member_id: global.userInfo['yao:member']?.member_id || '',
							display_name: memberValues.display_name,
							bio: memberValues.bio,
							avatar: memberValues.avatar,
							email: memberValues.email
						}
					})
				}
			} else {
				// Update personal profile
				const response = await apiClient.profile.UpdateProfile(values as PersonalProfile)

				if (apiClient.IsError(response)) {
					throw new Error('Failed to update profile')
				}

				setProfileData(values as PersonalProfile)

				// Update global user info for personal users
				const personalValues = values as PersonalProfile
				if (global.user) {
					// Update App.User in global state and localStorage
					global.user = {
						...global.user,
						name: personalValues.name || global.user.name,
						avatar: personalValues.picture || global.user.avatar
					}
					local.user = global.user
				}

				// Update UserInfo (OIDC format) in global state
				if (global.userInfo) {
					global.setUserInfo({
						...global.userInfo,
						name: personalValues.name,
						gender: personalValues.gender,
						website: personalValues.website,
						picture: personalValues.picture
					})
				}
			}

			setEditing(false)
			message.success(is_cn ? '保存成功' : 'Saved successfully')
		} catch (error) {
			console.error('Failed to save profile:', error)
			message.error(is_cn ? '保存失败' : 'Save failed')
		} finally {
			setSaving(false)
		}
	}

	const handleEdit = () => {
		setEditing(true)
	}

	const handleCancel = () => {
		form.resetFields()
		if (profileData) form.setFieldsValue(profileData)
		setEditing(false)
	}

	const handleAvatarUploadSuccess = (fileId: string, avatarWrapper: string) => {
		// avatarWrapper 是 wrapper 格式，如 __yao.attachment://file123
		// Update the appropriate field based on user type
		if (isTeamMember) {
			form.setFieldsValue({ avatar: avatarWrapper })
		} else {
			form.setFieldsValue({ picture: avatarWrapper })
		}
	}

	if (loading) {
		return (
			<div className={styles.profile}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '个人资料' : 'Profile'}</h2>
						<p>
							{is_cn
								? '管理您的个人信息和账户设置'
								: 'Manage your personal information and account settings'}
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

	// Get current user for avatar display
	const currentUser = GetCurrentUser()
	const avatarData = currentUser
		? {
				id: String(currentUser.id),
				name: isTeamMember
					? (profileData as MemberProfile)?.display_name || currentUser.name
					: (profileData as PersonalProfile)?.name || currentUser.name,
				avatar: isTeamMember
					? formAvatar || (profileData as MemberProfile)?.avatar || currentUser.avatar
					: formPicture || (profileData as PersonalProfile)?.picture || currentUser.avatar,
				team:
					currentUser.team && currentUser.team.team_id
						? {
								team_id: currentUser.team.team_id,
								logo: currentUser.team.logo,
								name: currentUser.team.name
						  }
						: undefined
		  }
		: undefined

	return (
		<div className={styles.profile}>
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '个人资料' : 'Profile'}</h2>
					<p>
						{is_cn
							? isTeamMember
								? '管理您的团队成员资料'
								: '管理您的个人信息和账户设置'
							: isTeamMember
							? 'Manage your team member profile'
							: 'Manage your personal information and account settings'}
					</p>
				</div>
				<div className={styles.headerActions}>
					{editing ? (
						<>
							<Button
								type='primary'
								size='small'
								icon={<Icon name='icon-check' size={12} />}
								onClick={() => form.submit()}
								loading={saving}
							>
								{is_cn ? '保存' : 'Save'}
							</Button>
							<Button
								size='small'
								icon={<Icon name='icon-x' size={12} />}
								onClick={handleCancel}
								disabled={saving}
							>
								{is_cn ? '取消' : 'Cancel'}
							</Button>
						</>
				) : (
					<>
						{/* Only show Change Password for password-registered users */}
						{global.userInfo?.['yao:auth_source'] === 'password' && (
							<Button
								size='small'
								icon={<Icon name='material-lock' size={12} />}
								onClick={() => setPasswordModalVisible(true)}
							>
								{is_cn ? '修改密码' : 'Change Password'}
							</Button>
						)}
						<Button
							size='small'
							icon={<Icon name='icon-edit-2' size={12} />}
							onClick={handleEdit}
						>
							{is_cn ? '编辑' : 'Edit'}
						</Button>
					</>
				)}
				</div>
			</div>

			<div className={styles.panel}>
				<div className={styles.panelContent}>
					{/* Avatar Section - Always Centered */}
					<div className={styles.avatarSection}>
						<UserAvatar
							mode={editing ? 'form' : 'default'}
							size='xl'
							shape='circle'
							displayType='avatar'
							buttonText={is_cn ? '更换头像' : 'Change Avatar'}
							modalTitle={is_cn ? '设置头像' : 'Set Avatar'}
							data={avatarData}
							uploader={editing ? '__yao.attachment' : undefined}
							onUploadSuccess={editing ? handleAvatarUploadSuccess : undefined}
						/>
					</div>

					{/* Profile Fields */}
					<Form form={form} onFinish={handleSave}>
						<div className={styles.fieldsContainer}>
							{isTeamMember ? (
							<>
								{/* Team Member Fields */}
								{/* Account Field (read-only, for all auth sources) */}
								{global.userInfo?.['yao:auth_source'] &&
									global.userInfo?.email && (
										<div className={styles.fieldItem}>
											<div className={styles.fieldIcon}>
												{authProvider?.logo ? (
													<img
														src={authProvider.logo}
														alt={authProvider.label}
														style={{
															width: 20,
															height: 20,
															objectFit: 'contain',
															filter: 'brightness(0) saturate(100%) invert(0.6)'
														}}
													/>
												) : (
													<Icon name='material-fingerprint' size={20} />
												)}
											</div>
											<div className={styles.fieldContent}>
												<div className={styles.fieldLabel}>
													{authProvider
														? authProvider.label
														: is_cn
														? '账号'
														: 'Account'}
												</div>
												<div className={styles.fieldValue}>
													{global.userInfo.email}
												</div>
											</div>
										</div>
									)}

								{/* Display Name Field */}
								<div className={styles.fieldItem}>
									<div className={styles.fieldIcon}>
										<Icon name='material-person' size={20} />
									</div>
									<div className={styles.fieldContent}>
										<div className={styles.fieldLabel}>
											{is_cn ? '团队昵称' : 'Team Nickname'}
										</div>
										{editing ? (
											<Form.Item
												name='display_name'
												style={{ margin: 0 }}
											>
												<Input
													schema={{
														type: 'string',
														placeholder: is_cn
															? '请输入你在团队中的昵称'
															: 'Enter your nickname in this team'
													}}
													error=''
													hasError={false}
												/>
											</Form.Item>
										) : (
											<div className={styles.fieldValue}>
												{(profileData as MemberProfile)
													?.display_name || '-'}
											</div>
										)}
									</div>
								</div>

								{/* Email Field */}
								<div className={styles.fieldItem}>
									<div className={styles.fieldIcon}>
										<Icon name='material-email' size={20} />
									</div>
									<div className={styles.fieldContent}>
										<div className={styles.fieldLabel}>
											{is_cn ? '邮箱' : 'Email'}
										</div>
										{editing ? (
											<Form.Item name='email' style={{ margin: 0 }}>
												<Input
													schema={{
														type: 'string',
														placeholder: is_cn
															? '请输入邮箱'
															: 'Enter your email'
													}}
													error=''
													hasError={false}
												/>
											</Form.Item>
										) : (
											<div className={styles.fieldValue}>
												{(profileData as MemberProfile)?.email ||
													'-'}
											</div>
										)}
									</div>
								</div>

									{/* Bio Field */}
									<div className={styles.fieldItem}>
										<div className={styles.fieldIcon}>
											<Icon name='material-description' size={20} />
										</div>
										<div className={styles.fieldContent}>
											<div className={styles.fieldLabel}>
												{is_cn ? '简介' : 'Bio'}
											</div>
											{editing ? (
												<Form.Item name='bio' style={{ margin: 0 }}>
													<Input
														schema={{
															type: 'string',
															placeholder: is_cn
																? '请输入简介'
																: 'Enter your bio'
														}}
														error=''
														hasError={false}
													/>
												</Form.Item>
											) : (
												<div className={styles.fieldValue}>
													{(profileData as MemberProfile)?.bio ||
														'-'}
												</div>
											)}
										</div>
									</div>

									{/* Hidden avatar field */}
									<Form.Item name='avatar' hidden noStyle>
										<input type='hidden' />
									</Form.Item>
								</>
							) : (
								<>
									{/* Personal User Fields */}
									{/* Name Field */}
									<div className={styles.fieldItem}>
										<div className={styles.fieldIcon}>
											<Icon name='material-person' size={20} />
										</div>
										<div className={styles.fieldContent}>
											<div className={styles.fieldLabel}>
												{is_cn ? '姓名' : 'Name'}
											</div>
											{editing ? (
												<Form.Item name='name' style={{ margin: 0 }}>
													<Input
														schema={{
															type: 'string',
															placeholder: is_cn
																? '请输入姓名'
																: 'Enter your name'
														}}
														error=''
														hasError={false}
													/>
												</Form.Item>
											) : (
												<div className={styles.fieldValue}>
													{(profileData as PersonalProfile)?.name ||
														'-'}
												</div>
											)}
										</div>
									</div>

									{/* Gender Field */}
									<div className={styles.fieldItem}>
										<div className={styles.fieldIcon}>
											<Icon name='material-wc' size={20} />
										</div>
										<div className={styles.fieldContent}>
											<div className={styles.fieldLabel}>
												{is_cn ? '性别' : 'Gender'}
											</div>
											{editing ? (
												<Form.Item name='gender' style={{ margin: 0 }}>
													<RadioGroup
														schema={{
															type: 'string',
															enum: [
																{
																	label: is_cn
																		? '男'
																		: 'Male',
																	value: 'male'
																},
																{
																	label: is_cn
																		? '女'
																		: 'Female',
																	value: 'female'
																},
																{
																	label: is_cn
																		? '其他'
																		: 'Other',
																	value: 'other'
																}
															],
															allowClear: true
														}}
														error=''
														hasError={false}
													/>
												</Form.Item>
											) : (
												<div className={styles.fieldValue}>
													{(() => {
														const gender = (
															profileData as PersonalProfile
														)?.gender
														if (gender === 'male')
															return is_cn ? '男' : 'Male'
														if (gender === 'female')
															return is_cn ? '女' : 'Female'
														if (gender === 'other')
															return is_cn
																? '其他'
																: 'Other'
														return '-'
													})()}
												</div>
											)}
										</div>
									</div>

									{/* Link Field */}
									<div className={styles.fieldItem}>
										<div className={styles.fieldIcon}>
											<Icon name='material-link' size={20} />
										</div>
										<div className={styles.fieldContent}>
											<div className={styles.fieldLabel}>
												{is_cn ? '链接' : 'Link'}
											</div>
											{editing ? (
												<Form.Item name='website' style={{ margin: 0 }}>
													<Input
														schema={{
															type: 'string',
															placeholder: is_cn
																? '请输入链接地址'
																: 'Enter your link URL'
														}}
														error=''
														hasError={false}
													/>
												</Form.Item>
											) : (
												<div className={styles.fieldValue}>
													{(profileData as PersonalProfile)
														?.website ? (
														<a
															href={
																(
																	profileData as PersonalProfile
																).website
															}
															target='_blank'
															rel='noopener noreferrer'
															className={styles.websiteLink}
														>
															{
																(
																	profileData as PersonalProfile
																).website
															}
														</a>
													) : (
														'-'
													)}
												</div>
											)}
										</div>
									</div>

									{/* Hidden picture field */}
									<Form.Item name='picture' hidden noStyle>
										<input type='hidden' />
									</Form.Item>
								</>
							)}
						</div>
					</Form>
				</div>
			</div>

			{/* Change Password Modal */}
			<ChangePasswordModal
				visible={passwordModalVisible}
				onClose={() => setPasswordModalVisible(false)}
			/>
		</div>
	)
}

export default Profile
