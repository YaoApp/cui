import { useState } from 'react'
import { getLocale } from '@umijs/max'
import { message, Modal, Switch } from 'antd'
import { Button } from '@/components/ui'
import { RadioGroup } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import TOTPSetup from '@/components/TOTP'
import { TwoFactorMethod, SecurityData } from '../../../mockData'
import styles from './TwoFactorAuth.less'

interface TwoFactorAuthProps {
	data: {
		enabled: boolean
		primary_method?: 'sms' | 'totp'
		methods: TwoFactorMethod[]
	}
	onUpdate: (data: SecurityData) => void
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ data, onUpdate }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(false)
	const [showTOTPSetup, setShowTOTPSetup] = useState(false)

	const smsMethod = data.methods.find((m) => m.type === 'sms')
	const totpMethod = data.methods.find((m) => m.type === 'totp')

	const handleToggle2FA = async (enabled: boolean) => {
		if (!enabled) {
			// 关闭2FA需要确认
			Modal.confirm({
				title: is_cn ? '确认关闭双因素认证' : 'Confirm Disable Two-Factor Authentication',
				content: is_cn
					? '关闭双因素认证会降低您账户的安全性。您确定要继续吗？'
					: 'Disabling two-factor authentication will reduce your account security. Are you sure you want to continue?',
				okText: is_cn ? '确认关闭' : 'Disable',
				cancelText: is_cn ? '取消' : 'Cancel',
				okType: 'danger',
				onOk: async () => {
					try {
						setLoading(true)
						// Mock API call
						await new Promise((resolve) => setTimeout(resolve, 1000))

						message.success(is_cn ? '双因素认证已关闭' : 'Two-factor authentication disabled')
					} catch (error) {
						message.error(is_cn ? '操作失败' : 'Operation failed')
					} finally {
						setLoading(false)
					}
				}
			})
		} else {
			// 开启2FA，需要至少设置一种方法
			if (!smsMethod?.enabled && !totpMethod?.enabled) {
				message.warning(
					is_cn
						? '请先设置至少一种验证方法'
						: 'Please set up at least one authentication method first'
				)
				return
			}

			try {
				setLoading(true)
				// Mock API call
				await new Promise((resolve) => setTimeout(resolve, 1000))

				message.success(is_cn ? '双因素认证已开启' : 'Two-factor authentication enabled')
			} catch (error) {
				message.error(is_cn ? '操作失败' : 'Operation failed')
			} finally {
				setLoading(false)
			}
		}
	}

	const handleSetupSMS = async () => {
		try {
			setLoading(true)
			// Mock API call
			await new Promise((resolve) => setTimeout(resolve, 1000))

			message.success(is_cn ? '短信验证已设置' : 'SMS verification set up')
		} catch (error) {
			message.error(is_cn ? '设置失败' : 'Setup failed')
		} finally {
			setLoading(false)
		}
	}

	const handleDisableSMS = () => {
		Modal.confirm({
			title: is_cn ? '确认关闭短信验证' : 'Confirm Disable SMS Verification',
			content: is_cn
				? '关闭短信验证后，您将无法通过短信接收验证码。'
				: "After disabling SMS verification, you won't be able to receive verification codes via SMS.",
			okText: is_cn ? '确认关闭' : 'Disable',
			cancelText: is_cn ? '取消' : 'Cancel',
			okType: 'danger',
			onOk: async () => {
				try {
					setLoading(true)
					// Mock API call
					await new Promise((resolve) => setTimeout(resolve, 1000))

					message.success(is_cn ? '短信验证已关闭' : 'SMS verification disabled')
				} catch (error) {
					message.error(is_cn ? '操作失败' : 'Operation failed')
				} finally {
					setLoading(false)
				}
			}
		})
	}

	const handleSetupTOTP = () => {
		setShowTOTPSetup(true)
	}

	const handleTOTPSetupSuccess = async (secret: string, backupCodes: string[]) => {
		try {
			setLoading(true)
			// Mock API call to save TOTP setup
			await new Promise((resolve) => setTimeout(resolve, 1000))

			message.success(is_cn ? 'TOTP验证器已设置' : 'TOTP authenticator set up')
			setShowTOTPSetup(false)
		} catch (error) {
			message.error(is_cn ? '设置失败' : 'Setup failed')
		} finally {
			setLoading(false)
		}
	}

	const handleDisableTOTP = () => {
		Modal.confirm({
			title: is_cn ? '确认关闭TOTP验证器' : 'Confirm Disable TOTP Authenticator',
			content: is_cn
				? '关闭TOTP验证器后，您将无法使用身份验证器应用生成验证码。'
				: "After disabling TOTP authenticator, you won't be able to use authenticator apps to generate verification codes.",
			okText: is_cn ? '确认关闭' : 'Disable',
			cancelText: is_cn ? '取消' : 'Cancel',
			okType: 'danger',
			onOk: async () => {
				try {
					setLoading(true)
					// Mock API call
					await new Promise((resolve) => setTimeout(resolve, 1000))

					message.success(is_cn ? 'TOTP验证器已关闭' : 'TOTP authenticator disabled')
				} catch (error) {
					message.error(is_cn ? '操作失败' : 'Operation failed')
				} finally {
					setLoading(false)
				}
			}
		})
	}

	const handlePrimaryMethodChange = async (method: 'sms' | 'totp') => {
		try {
			setLoading(true)
			// Mock API call
			await new Promise((resolve) => setTimeout(resolve, 1000))

			message.success(is_cn ? '主要验证方式已更新' : 'Primary authentication method updated')
		} catch (error) {
			message.error(is_cn ? '更新失败' : 'Update failed')
		} finally {
			setLoading(false)
		}
	}

	const methodOptions = [
		{
			label: is_cn ? '短信验证码' : 'SMS Code',
			value: 'sms',
			disabled: !smsMethod?.enabled
		},
		{
			label: is_cn ? 'TOTP验证器' : 'TOTP Authenticator',
			value: 'totp',
			disabled: !totpMethod?.enabled
		}
	]

	return (
		<div className={styles.twoFactorAuthCard}>
			<div className={styles.cardHeader}>
				<div className={styles.cardTitle}>
					<Icon name='material-security' size={16} className={styles.cardIcon} />
					<h3>{is_cn ? '双因素认证' : 'Two-Factor Authentication'}</h3>
				</div>
				<div className={styles.cardActions}></div>
			</div>
			<div className={styles.cardContent}>
				{/* 2FA 总开关 */}
				<div className={styles.mainToggle}>
					<div className={styles.toggleContent}>
						<div className={styles.toggleInfo}>
							<div className={styles.toggleTitle}>
								{is_cn ? '启用双因素认证' : 'Enable Two-Factor Authentication'}
							</div>
							<div className={styles.toggleDescription}>
								{is_cn
									? '使用 TOTP 验证器作为主要方法，SMS 作为备用方法'
									: 'Use TOTP authenticator as primary method, with SMS as backup'}
							</div>
						</div>
						<Switch checked={data.enabled} onChange={handleToggle2FA} loading={loading} />
					</div>
				</div>

				{/* 验证方法设置 */}
				<div className={styles.methodsSection}>
					{/* TOTP 验证器 - 主要方法放在前面 */}
					<div className={styles.methodItem}>
						<div className={styles.methodIcon}>
							<Icon name='material-security' size={20} />
						</div>
						<div className={styles.methodContent}>
							<div className={styles.methodInfo}>
								<div className={styles.methodName}>
									{is_cn
										? 'TOTP验证器（主要方法）'
										: 'TOTP Authenticator (Primary)'}
								</div>
								<div className={styles.methodDescription}>
									{is_cn
										? '推荐使用的主要验证方式，更安全可靠'
										: 'Recommended primary verification method, more secure and reliable'}
								</div>
								{totpMethod?.enabled && totpMethod.enabled_at && (
									<div className={styles.methodDetails}>
										{is_cn ? '设置于：' : 'Set up on: '}
										{new Date(totpMethod.enabled_at).toLocaleDateString()}
									</div>
								)}
							</div>
							<div className={styles.methodActions}>
								{totpMethod?.enabled ? (
									<>
										<span className={styles.enabledBadge}>
											<Icon name='material-check_circle' size={14} />
											{is_cn ? '已启用' : 'Enabled'}
										</span>
										<Button
											size='small'
											type='danger'
											icon={<Icon name='material-close' size={12} />}
											onClick={handleDisableTOTP}
											loading={loading}
										>
											{is_cn ? '关闭' : 'Disable'}
										</Button>
									</>
								) : (
									<Button
										size='small'
										type='primary'
										icon={<Icon name='material-settings' size={12} />}
										onClick={handleSetupTOTP}
										loading={loading}
									>
										{is_cn ? '设置' : 'Setup'}
									</Button>
								)}
							</div>
						</div>
					</div>

					{/* SMS 验证 - 备用方法放在后面 */}
					<div className={styles.methodItem}>
						<div className={styles.methodIcon}>
							<Icon name='material-sms' size={20} />
						</div>
						<div className={styles.methodContent}>
							<div className={styles.methodInfo}>
								<div className={styles.methodName}>
									{is_cn ? '短信验证码（备用方法）' : 'SMS Verification (Backup)'}
								</div>
								<div className={styles.methodDescription}>
									{is_cn
										? '当 TOTP 验证器不可用时的备用验证方式'
										: 'Backup verification method when TOTP authenticator is unavailable'}
									{!totpMethod?.enabled && (
										<div className={styles.methodNote}>
											{is_cn
												? '需要先设置 TOTP 验证器才能启用 SMS 备用'
												: 'TOTP authenticator must be set up first before enabling SMS backup'}
										</div>
									)}
								</div>
								{smsMethod?.enabled && smsMethod.phone && (
									<div className={styles.methodDetails}>
										{is_cn ? '手机号：' : 'Phone: '}
										{smsMethod.phone}
									</div>
								)}
							</div>
							<div className={styles.methodActions}>
								{smsMethod?.enabled ? (
									<>
										<span className={styles.enabledBadge}>
											<Icon name='material-check_circle' size={14} />
											{is_cn ? '已启用' : 'Enabled'}
										</span>
										<Button
											size='small'
											type='danger'
											icon={<Icon name='material-close' size={12} />}
											onClick={handleDisableSMS}
											loading={loading}
										>
											{is_cn ? '关闭' : 'Disable'}
										</Button>
									</>
								) : (
									<Button
										size='small'
										type='primary'
										icon={<Icon name='material-settings' size={12} />}
										onClick={handleSetupSMS}
										loading={loading}
										disabled={!totpMethod?.enabled}
									>
										{is_cn ? '设置' : 'Setup'}
									</Button>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* 主要验证方式选择 */}
				{data.enabled && (smsMethod?.enabled || totpMethod?.enabled) && (
					<div className={styles.primaryMethodSection}>
						<div className={styles.sectionTitle}>
							{is_cn ? '主要验证方式' : 'Primary Authentication Method'}
						</div>
						<div className={styles.primaryMethodDescription}>
							{is_cn
								? '选择您首选的双因素认证方式'
								: 'Choose your preferred two-factor authentication method'}
						</div>
						<RadioGroup
							schema={{
								type: 'string',
								enum: methodOptions
							}}
							value={data.primary_method}
							onChange={handlePrimaryMethodChange}
							error=''
							hasError={false}
						/>
					</div>
				)}
			</div>

			{/* TOTP 设置弹窗 */}
			<TOTPSetup
				visible={showTOTPSetup}
				onCancel={() => setShowTOTPSetup(false)}
				onSuccess={handleTOTPSetupSuccess}
			/>
		</div>
	)
}

export default TwoFactorAuth
