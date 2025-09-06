import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Avatar, Upload, message, Spin } from 'antd'
import { getLocale } from '@umijs/max'
import { mockApi, User } from '../../mockData'
import styles from './index.less'

const Profile = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [form] = Form.useForm()

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
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
			message.success(is_cn ? '保存成功' : 'Saved successfully')
		} catch (error) {
			message.error(is_cn ? '保存失败' : 'Save failed')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className={styles.loading}>
				<Spin size='large' />
				<span>{is_cn ? '加载中...' : 'Loading...'}</span>
			</div>
		)
	}

	return (
		<div className={styles.profile}>
			<div className={styles.header}>
				<h2>{is_cn ? '个人资料' : 'Profile'}</h2>
				<p>
					{is_cn
						? '管理您的个人信息和账户设置'
						: 'Manage your personal information and account settings'}
				</p>
			</div>

			<Card className={styles.card}>
				<Form form={form} layout='vertical' onFinish={handleSave} className={styles.form}>
					<div className={styles.avatarSection}>
						<Avatar src={user?.avatar} size={80} className={styles.avatar}>
							{user?.name?.charAt(0)?.toUpperCase() || 'U'}
						</Avatar>
						<Upload
							accept='image/*'
							showUploadList={false}
							beforeUpload={() => {
								message.info(is_cn ? '头像上传功能开发中' : 'Avatar upload coming soon')
								return false
							}}
						>
							<Button type='link' size='small'>
								{is_cn ? '更换头像' : 'Change Avatar'}
							</Button>
						</Upload>
					</div>

					<Form.Item
						name='name'
						label={is_cn ? '姓名' : 'Name'}
						rules={[{ required: true, message: is_cn ? '请输入姓名' : 'Please enter name' }]}
					>
						<Input placeholder={is_cn ? '请输入姓名' : 'Enter your name'} />
					</Form.Item>

					<Form.Item
						name='email'
						label={is_cn ? '邮箱' : 'Email'}
						rules={[
							{ required: true, message: is_cn ? '请输入邮箱' : 'Please enter email' },
							{ type: 'email', message: is_cn ? '邮箱格式不正确' : 'Invalid email format' }
						]}
					>
						<Input placeholder={is_cn ? '请输入邮箱' : 'Enter your email'} />
					</Form.Item>

					<Form.Item name='role' label={is_cn ? '角色' : 'Role'}>
						<Input disabled />
					</Form.Item>

					<Form.Item className={styles.actions}>
						<Button type='primary' htmlType='submit' loading={saving}>
							{is_cn ? '保存' : 'Save'}
						</Button>
					</Form.Item>
				</Form>
			</Card>
		</div>
	)
}

export default Profile
