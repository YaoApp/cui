import { useState, useEffect } from 'react'
import { Form, message } from 'antd'
import { getLocale } from '@umijs/max'
import { mockApi, User } from '../../mockData'
import ActionButton from '@/components/ui/ActionButton'
import Button from '@/components/ui/Button'
import Icon from '@/widgets/Icon'
import { Input, Select, TextArea, Avatar, RadioGroup } from '@/components/ui/inputs'
import { timezoneOptions } from '@/constants/timezones'
import styles from './index.less'

const Profile = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [form] = Form.useForm()

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [editing, setEditing] = useState(false)
	const [user, setUser] = useState<User | null>(null)

	useEffect(() => {
		const loadUser = async () => {
			try {
				setLoading(true)
				const userData = await mockApi.getUser()
				setUser(userData)
				form.setFieldsValue(userData)
			} catch (error) {
				console.error('Failed to load user data:', error)
				message.error(is_cn ? '加载用户信息失败' : 'Failed to load user data')
			} finally {
				setLoading(false)
			}
		}

		loadUser()
	}, [form, is_cn])

	const handleSave = async (values: any) => {
		try {
			setSaving(true)
			// Mock save
			await new Promise((resolve) => setTimeout(resolve, 1000))
			setUser({ ...user, ...values })
			setEditing(false)
			message.success(is_cn ? '保存成功' : 'Saved successfully')
		} catch (error) {
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
		if (user) form.setFieldsValue(user)
		setEditing(false)
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

	// Gender options
	const genderOptions = [
		{ label: is_cn ? '男' : 'Male', value: 'male' },
		{ label: is_cn ? '女' : 'Female', value: 'female' }
	]

	// Locale options
	const localeOptions = [
		{ label: 'English (US)', value: 'en-US' },
		{ label: '中文 (简体)', value: 'zh-CN' },
		{ label: 'English (UK)', value: 'en-GB' },
		{ label: 'Français', value: 'fr-FR' },
		{ label: 'Deutsch', value: 'de-DE' },
		{ label: '日本語', value: 'ja-JP' },
		{ label: '한국어', value: 'ko-KR' }
	]

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
						<Button
							size='small'
							icon={<Icon name='icon-edit-2' size={12} />}
							onClick={handleEdit}
						>
							{is_cn ? '编辑' : 'Edit'}
						</Button>
					)}
				</div>
			</div>

			<div className={styles.panel}>
				<div className={styles.panelContent}>
					{/* Avatar Section - Always Centered */}
					<div className={styles.avatarSection}>
						<Avatar
							schema={{
								type: 'string',
								variant: 'large',
								userName: user?.name || '',
								placeholder: is_cn ? '更换头像' : 'Change Avatar',
								readOnly: !editing
							}}
							value={user?.picture}
							onChange={(value) => {
								form.setFieldsValue({ picture: value })
							}}
							error=''
							hasError={false}
						/>
					</div>

					{/* Profile Fields */}
					<Form form={form} onFinish={handleSave}>
						<div className={styles.fieldsContainer}>
							{/* Username/Name Field */}
							<div className={styles.fieldItem}>
								<div className={styles.fieldIcon}>
									<svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
										<path
											d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'
											stroke='currentColor'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
										<circle
											cx='12'
											cy='7'
											r='4'
											stroke='currentColor'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
									</svg>
								</div>
								<div className={styles.fieldContent}>
									<div className={styles.fieldLabel}>{is_cn ? '姓名' : 'Name'}</div>
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
										<div className={styles.fieldValue}>{user?.name || '-'}</div>
									)}
								</div>
							</div>

							{/* Gender Field */}
							<div className={styles.fieldItem}>
								<div className={styles.fieldIcon}>
									<svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
										<circle
											cx='12'
											cy='8'
											r='3'
											stroke='currentColor'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
										<path
											d='M12 14v7'
											stroke='currentColor'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
										<path
											d='M15 17l-6 0'
											stroke='currentColor'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
									</svg>
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
													enum: genderOptions,
													allowClear: true
												}}
												error=''
												hasError={false}
											/>
										</Form.Item>
									) : (
										<div className={styles.fieldValue}>
											{genderOptions.find((g) => g.value === user?.gender)
												?.label || '-'}
										</div>
									)}
								</div>
							</div>

							{/* Timezone Field */}
							<div className={styles.fieldItem}>
								<div className={styles.fieldIcon}>
									<svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
										<circle
											cx='12'
											cy='12'
											r='10'
											stroke='currentColor'
											strokeWidth='2'
										/>
										<polyline
											points='12,6 12,12 16,14'
											stroke='currentColor'
											strokeWidth='2'
										/>
									</svg>
								</div>
								<div className={styles.fieldContent}>
									<div className={styles.fieldLabel}>
										{is_cn ? '时区' : 'Timezone'}
									</div>
									{editing ? (
										<Form.Item name='zoneinfo' style={{ margin: 0 }}>
											<Select
												schema={{
													type: 'string',
													enum: timezoneOptions,
													placeholder: is_cn
														? '选择时区'
														: 'Select timezone',
													searchable: true
												}}
												error=''
												hasError={false}
											/>
										</Form.Item>
									) : (
										<div className={styles.fieldValue}>
											{timezoneOptions.find(
												(tz) => tz.value === user?.zoneinfo
											)?.label ||
												user?.zoneinfo ||
												'-'}
										</div>
									)}
								</div>
							</div>

							{/* Link Field */}
							<div className={styles.fieldItem}>
								<div className={styles.fieldIcon}>
									<svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
										<path
											d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'
											stroke='currentColor'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
										<path
											d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'
											stroke='currentColor'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
									</svg>
								</div>
								<div className={styles.fieldContent}>
									<div className={styles.fieldLabel}>{is_cn ? '链接' : 'Link'}</div>
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
											{user?.website ? (
												<a
													href={user.website}
													target='_blank'
													rel='noopener noreferrer'
													className={styles.websiteLink}
												>
													{user.website}
												</a>
											) : (
												'-'
											)}
										</div>
									)}
								</div>
							</div>

							{/* Hidden picture field */}
							<Form.Item name='picture' style={{ display: 'none' }} />
						</div>
					</Form>
				</div>
			</div>
		</div>
	)
}

export default Profile
