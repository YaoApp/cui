import { useState } from 'react'
import { Modal, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { InputPassword } from '@/components/ui/inputs'
import Button from '@/components/ui/Button'
import { User } from '@/openapi/user'
import styles from './index.less'

interface ChangePasswordModalProps {
	visible: boolean
	onClose: () => void
}

interface FormErrors {
	current_password?: string
	new_password?: string
	confirm_password?: string
}

const ChangePasswordModal = ({ visible, onClose }: ChangePasswordModalProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [errors, setErrors] = useState<FormErrors>({})
	const [loading, setLoading] = useState(false)

	const resetForm = () => {
		setCurrentPassword('')
		setNewPassword('')
		setConfirmPassword('')
		setErrors({})
		setLoading(false)
	}

	const handleClose = () => {
		resetForm()
		onClose()
	}

	const validate = (): boolean => {
		const newErrors: FormErrors = {}

		if (!currentPassword) {
			newErrors.current_password = is_cn ? '请输入当前密码' : 'Current password is required'
		}

		if (!newPassword) {
			newErrors.new_password = is_cn ? '请输入新密码' : 'New password is required'
		} else if (newPassword.length < 8) {
			newErrors.new_password = is_cn
				? '密码至少需要8个字符'
				: 'Password must be at least 8 characters'
		} else if (!/[a-zA-Z]/.test(newPassword)) {
			newErrors.new_password = is_cn
				? '密码必须包含至少一个字母'
				: 'Password must contain at least one letter'
		} else if (!/[0-9]/.test(newPassword)) {
			newErrors.new_password = is_cn
				? '密码必须包含至少一个数字'
				: 'Password must contain at least one number'
		}

		if (!confirmPassword) {
			newErrors.confirm_password = is_cn ? '请确认新密码' : 'Please confirm your new password'
		} else if (newPassword && confirmPassword !== newPassword) {
			newErrors.confirm_password = is_cn ? '两次输入的密码不一致' : 'Passwords do not match'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async () => {
		if (!validate()) return

		try {
			setLoading(true)

			if (!window.$app?.openapi) {
				throw new Error(is_cn ? 'API 未初始化' : 'API not initialized')
			}

			const user = new User(window.$app.openapi)
			const response = await user.account.ChangePassword({
				current_password: currentPassword,
				new_password: newPassword,
				confirm_password: confirmPassword
			})

			if (user.IsError(response)) {
				const errorMsg =
					(response as any)?.error_description ||
					(response as any)?.message ||
					(is_cn ? '修改密码失败' : 'Failed to change password')
				throw new Error(errorMsg)
			}

			message.success(is_cn ? '密码修改成功' : 'Password changed successfully')
			handleClose()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)

			// Check for specific error messages from backend
			if (
				errorMessage.toLowerCase().includes('current password') ||
				errorMessage.toLowerCase().includes('incorrect')
			) {
				setErrors({ current_password: is_cn ? '当前密码不正确' : 'Current password is incorrect' })
			} else {
				message.error(errorMessage)
			}
		} finally {
			setLoading(false)
		}
	}

	const renderHeader = () => (
		<div className={styles.modalHeader}>
			<div className={styles.titleSection}>
				<Icon name='material-lock' size={16} />
				<span className={styles.modalTitle}>
					{is_cn ? '修改密码' : 'Change Password'}
				</span>
			</div>
			<div className={styles.closeButton} onClick={handleClose}>
				<Icon name='material-close' size={16} />
			</div>
		</div>
	)

	const renderFooter = () => (
		<div className={styles.modalFooter}>
			<div />
			<div className={styles.footerRight}>
				<Button size='small' onClick={handleClose} disabled={loading}>
					{is_cn ? '取消' : 'Cancel'}
				</Button>
				<Button type='primary' size='small' onClick={handleSubmit} loading={loading}>
					{is_cn ? '确认修改' : 'Confirm'}
				</Button>
			</div>
		</div>
	)

	return (
		<Modal
			open={visible}
			onCancel={handleClose}
			title={renderHeader()}
			footer={renderFooter()}
			width={480}
			className={styles.changePasswordModal}
			destroyOnClose
			closable={false}
			maskClosable={false}
			keyboard={false}
		>
			<div className={styles.modalContent}>
				<p className={styles.description}>
					{is_cn
						? '请输入当前密码和新密码。新密码至少需要8个字符，包含字母和数字。'
						: 'Enter your current password and a new password. New password must be at least 8 characters with letters and numbers.'}
				</p>

				<div className={styles.fieldsContainer}>
					{/* Current Password */}
					<div className={styles.fieldItem}>
						<div className={styles.fieldLabel}>
							{is_cn ? '当前密码' : 'Current Password'}
						</div>
						<div className={styles.fieldInput}>
							<InputPassword
								schema={{
									type: 'string',
									title: '',
									placeholder: is_cn
										? '请输入当前密码'
										: 'Enter current password'
								}}
								value={currentPassword}
								onChange={(val) => {
									setCurrentPassword(String(val || ''))
									if (errors.current_password) {
										setErrors((prev) => ({
											...prev,
											current_password: undefined
										}))
									}
								}}
								error={errors.current_password}
								hasError={!!errors.current_password}
							/>
						</div>
					</div>

					{/* New Password */}
					<div className={styles.fieldItem}>
						<div className={styles.fieldLabel}>
							{is_cn ? '新密码' : 'New Password'}
						</div>
						<div className={styles.fieldInput}>
							<InputPassword
								schema={{
									type: 'string',
									title: '',
									placeholder: is_cn
										? '请输入新密码'
										: 'Enter new password'
								}}
								value={newPassword}
								onChange={(val) => {
									setNewPassword(String(val || ''))
									if (errors.new_password) {
										setErrors((prev) => ({
											...prev,
											new_password: undefined
										}))
									}
								}}
								error={errors.new_password}
								hasError={!!errors.new_password}
							/>
						</div>
					</div>

					{/* Confirm Password */}
					<div className={styles.fieldItem}>
						<div className={styles.fieldLabel}>
							{is_cn ? '确认新密码' : 'Confirm New Password'}
						</div>
						<div className={styles.fieldInput}>
							<InputPassword
								schema={{
									type: 'string',
									title: '',
									placeholder: is_cn
										? '请再次输入新密码'
										: 'Confirm new password'
								}}
								value={confirmPassword}
								onChange={(val) => {
									setConfirmPassword(String(val || ''))
									if (errors.confirm_password) {
										setErrors((prev) => ({
											...prev,
											confirm_password: undefined
										}))
									}
								}}
								error={errors.confirm_password}
								hasError={!!errors.confirm_password}
							/>
						</div>
					</div>
				</div>
			</div>
		</Modal>
	)
}

export default ChangePasswordModal
