import { useState } from 'react'
import { getLocale } from '@umijs/max'
import { message, Modal, Switch } from 'antd'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import { ContactInfo as ContactInfoType, SecurityData } from '../../../mockData'
import styles from './ContactInfo.less'

interface ContactInfoProps {
	data: ContactInfoType
	onUpdate: (data: SecurityData) => void
}

const ContactInfo: React.FC<ContactInfoProps> = ({ data, onUpdate }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [editingField, setEditingField] = useState<'email' | 'phone' | null>(null)
	const [newValue, setNewValue] = useState('')
	const [loading, setLoading] = useState(false)
	// 临时状态：模拟 TOTP 开启/关闭
	const [mockTOTPEnabled, setMockTOTPEnabled] = useState(false)

	const handleEdit = (field: 'email' | 'phone') => {
		setEditingField(field)
		setNewValue(data[field] || '')
	}

	const handleCancel = () => {
		setEditingField(null)
		setNewValue('')
	}

	const handleSave = async () => {
		if (!editingField) return

		try {
			setLoading(true)

			// 检查是否开启了 TOTP（使用临时状态进行测试）
			const hasTOTP = mockTOTPEnabled

			if (hasTOTP) {
				// 如果开启了 TOTP，需要验证 TOTP 码
				Modal.confirm({
					title: is_cn ? '验证身份' : 'Verify Identity',
					content: (
						<div style={{ marginTop: 16 }}>
							<p>
								{is_cn
									? '请输入 TOTP 验证码以确认身份：'
									: 'Please enter TOTP code to verify identity:'}
							</p>
							{/* 这里应该有一个输入框组件 */}
						</div>
					),
					okText: is_cn ? '确认' : 'Confirm',
					cancelText: is_cn ? '取消' : 'Cancel',
					onOk: async () => {
						// 验证 TOTP 码
						await new Promise((resolve) => setTimeout(resolve, 1000))
						message.success(
							is_cn
								? `${editingField === 'email' ? '邮箱' : '手机号'}更新成功`
								: `${editingField === 'email' ? 'Email' : 'Phone'} updated successfully`
						)
						setEditingField(null)
						setNewValue('')
					}
				})
			} else {
				// 如果未开启 TOTP，向原邮箱发送验证码
				const currentEmail = data.email || 'user@example.com'
				Modal.confirm({
					title: is_cn ? '验证身份' : 'Verify Identity',
					content: is_cn
						? `我们将向您的邮箱 ${currentEmail} 发送验证码，请确认继续。`
						: `We will send a verification code to your email ${currentEmail}, please confirm to continue.`,
					okText: is_cn ? '发送验证码' : 'Send Code',
					cancelText: is_cn ? '取消' : 'Cancel',
					onOk: async () => {
						// 发送验证码到原邮箱
						await new Promise((resolve) => setTimeout(resolve, 1000))
						message.success(
							is_cn
								? `验证码已发送到 ${currentEmail}，请查收并输入验证码完成更换`
								: `Verification code sent to ${currentEmail}, please check and enter the code to complete the change`
						)
						// 这里应该跳转到验证码输入页面或显示验证码输入框
						setEditingField(null)
						setNewValue('')
					}
				})
			}
		} catch (error) {
			message.error(is_cn ? '操作失败' : 'Operation failed')
		} finally {
			setLoading(false)
		}
	}

	const handleVerify = async (field: 'email' | 'phone') => {
		try {
			setLoading(true)
			// Mock API call
			await new Promise((resolve) => setTimeout(resolve, 1000))

			message.success(
				is_cn
					? `验证码已发送到您的${field === 'email' ? '邮箱' : '手机'}`
					: `Verification code sent to your ${field}`
			)
		} catch (error) {
			message.error(is_cn ? '发送失败' : 'Send failed')
		} finally {
			setLoading(false)
		}
	}

	const getProviderIcon = (provider: string) => {
		const iconMap: Record<string, string> = {
			email: 'material-email',
			phone: 'material-smartphone'
		}
		return iconMap[provider] || 'material-account_circle'
	}

	return (
		<div className={styles.contactInfoCard}>
			<div className={styles.cardHeader}>
				<div className={styles.cardTitle}>
					<Icon name='material-account_circle' size={16} className={styles.cardIcon} />
					<h3>{is_cn ? '登录账号' : 'Login Accounts'}</h3>
				</div>
				<div className={styles.cardActions}>
					{/* 临时测试开关 */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							fontSize: '12px',
							color: '#666'
						}}
					>
						<span>Mock TOTP:</span>
						<Switch size='small' checked={mockTOTPEnabled} onChange={setMockTOTPEnabled} />
					</div>
				</div>
			</div>
			<div className={styles.cardContent}>
				{/* Email Section */}
				<div className={styles.contactItem}>
					<div className={styles.contactIcon}>
						<Icon name={getProviderIcon('email')} size={20} />
					</div>
					<div className={styles.contactContent}>
						<div className={styles.contactInfo}>
							<div className={styles.contactLabel}>
								{is_cn ? '邮箱' : 'Email'}
								{data.email && (
									<Icon
										name={
											data.email_verified
												? 'material-verified'
												: 'material-warning'
										}
										size={14}
										className={`${styles.verificationIcon} ${
											data.email_verified
												? styles.verified
												: styles.unverified
										}`}
										title={
											data.email_verified
												? is_cn
													? '已验证'
													: 'Verified'
												: is_cn
												? '未验证'
												: 'Unverified'
										}
									/>
								)}
							</div>
							{editingField === 'email' ? (
								<div className={styles.editForm}>
									<Input
										schema={{
											type: 'string',
											placeholder: is_cn
												? '请输入邮箱地址'
												: 'Enter email address'
										}}
										value={newValue}
										onChange={(value) => setNewValue(String(value))}
										error=''
										hasError={false}
									/>
									<div className={styles.editActions}>
										<Button
											type='primary'
											size='small'
											onClick={handleSave}
											loading={loading}
										>
											{is_cn ? '保存' : 'Save'}
										</Button>
										<Button
											size='small'
											onClick={handleCancel}
											disabled={loading}
										>
											{is_cn ? '取消' : 'Cancel'}
										</Button>
									</div>
								</div>
							) : (
								<div className={styles.contactValue}>
									<span className={styles.contactText}>
										{data.email || (is_cn ? '未设置' : 'Not set')}
									</span>
								</div>
							)}
						</div>
						<div className={styles.contactActions}>
							{editingField !== 'email' && (
								<>
									<Button
										type='default'
										size='small'
										icon={<Icon name='material-edit' size={12} />}
										onClick={() => handleEdit('email')}
									>
										{is_cn ? '更换' : 'Change'}
									</Button>
									{data.email && !data.email_verified && (
										<Button
											size='small'
											type='primary'
											icon={<Icon name='material-verified' size={12} />}
											onClick={() => handleVerify('email')}
											loading={loading}
										>
											{is_cn ? '验证' : 'Verify'}
										</Button>
									)}
								</>
							)}
						</div>
					</div>
				</div>

				{/* Phone Section */}
				<div className={styles.contactItem}>
					<div className={styles.contactIcon}>
						<Icon name={getProviderIcon('phone')} size={20} />
					</div>
					<div className={styles.contactContent}>
						<div className={styles.contactInfo}>
							<div className={styles.contactLabel}>
								{is_cn ? '手机号' : 'Mobile'}
								{data.phone && (
									<Icon
										name={
											data.phone_verified
												? 'material-verified'
												: 'material-warning'
										}
										size={14}
										className={`${styles.verificationIcon} ${
											data.phone_verified
												? styles.verified
												: styles.unverified
										}`}
										title={
											data.phone_verified
												? is_cn
													? '已验证'
													: 'Verified'
												: is_cn
												? '未验证'
												: 'Unverified'
										}
									/>
								)}
							</div>
							{editingField === 'phone' ? (
								<div className={styles.editForm}>
									<Input
										schema={{
											type: 'string',
											placeholder: is_cn
												? '请输入手机号码'
												: 'Enter phone number'
										}}
										value={newValue}
										onChange={(value) => setNewValue(String(value))}
										error=''
										hasError={false}
									/>
									<div className={styles.editActions}>
										<Button
											type='primary'
											size='small'
											onClick={handleSave}
											loading={loading}
										>
											{is_cn ? '保存' : 'Save'}
										</Button>
										<Button
											size='small'
											onClick={handleCancel}
											disabled={loading}
										>
											{is_cn ? '取消' : 'Cancel'}
										</Button>
									</div>
								</div>
							) : (
								<div className={styles.contactValue}>
									<span className={styles.contactText}>
										{data.phone || (is_cn ? '未设置' : 'Not set')}
									</span>
								</div>
							)}
						</div>
						<div className={styles.contactActions}>
							{editingField !== 'phone' && (
								<>
									<Button
										type='default'
										size='small'
										icon={<Icon name='material-edit' size={12} />}
										onClick={() => handleEdit('phone')}
									>
										{is_cn ? '更换' : 'Change'}
									</Button>
									{data.phone && !data.phone_verified && (
										<Button
											size='small'
											type='primary'
											icon={<Icon name='material-verified' size={12} />}
											onClick={() => handleVerify('phone')}
											loading={loading}
										>
											{is_cn ? '验证' : 'Verify'}
										</Button>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ContactInfo
