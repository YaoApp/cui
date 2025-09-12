import { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { message, Modal } from 'antd'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface TOTPSetupProps {
	visible: boolean
	onCancel: () => void
	onSuccess: (secret: string, backupCodes: string[]) => void
}

const TOTPSetup: React.FC<TOTPSetupProps> = ({ visible, onCancel, onSuccess }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup')
	const [secret, setSecret] = useState('')
	const [qrCodeUrl, setQrCodeUrl] = useState('')
	const [verificationCode, setVerificationCode] = useState('')
	const [backupCodes, setBackupCodes] = useState<string[]>([])
	const [loading, setLoading] = useState(false)

	// 生成 TOTP 密钥和二维码
	useEffect(() => {
		if (visible) {
			generateTOTPSecret()
		}
	}, [visible])

	const generateTOTPSecret = async () => {
		try {
			// Mock TOTP secret generation
			const mockSecret = 'JBSWY3DPEHPK3PXP'
			const appName = 'YaoApp'
			const userEmail = 'user@example.com'
			const issuer = 'YaoApp'

			const otpauthUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(
				userEmail
			)}?secret=${mockSecret}&issuer=${encodeURIComponent(issuer)}`

			setSecret(mockSecret)
			setQrCodeUrl(otpauthUrl)
		} catch (error) {
			message.error(is_cn ? '生成TOTP密钥失败' : 'Failed to generate TOTP secret')
		}
	}

	const handleVerifyCode = async () => {
		if (!verificationCode || verificationCode.length !== 6) {
			message.error(is_cn ? '请输入6位验证码' : 'Please enter 6-digit code')
			return
		}

		try {
			setLoading(true)
			// Mock verification
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Generate backup codes
			const mockBackupCodes = [
				'1234-5678',
				'9876-5432',
				'1111-2222',
				'3333-4444',
				'5555-6666',
				'7777-8888',
				'9999-0000',
				'1357-2468'
			]

			setBackupCodes(mockBackupCodes)
			setStep('backup')
		} catch (error) {
			message.error(is_cn ? '验证码错误' : 'Invalid verification code')
		} finally {
			setLoading(false)
		}
	}

	const handleComplete = () => {
		onSuccess(secret, backupCodes)
		handleReset()
	}

	const handleReset = () => {
		setStep('setup')
		setSecret('')
		setQrCodeUrl('')
		setVerificationCode('')
		setBackupCodes([])
		setLoading(false)
	}

	const handleCancel = () => {
		onCancel()
		handleReset()
	}

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
		message.success(is_cn ? '已复制到剪贴板' : 'Copied to clipboard')
	}

	const downloadBackupCodes = () => {
		const content = backupCodes.join('\n')
		const blob = new Blob([content], { type: 'text/plain' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'totp-backup-codes.txt'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	return (
		<Modal
			title={is_cn ? '设置双因素认证' : 'Set up Two-Factor Authentication'}
			open={visible}
			onCancel={handleCancel}
			footer={null}
			width={500}
			centered
			className={styles.totpModal}
		>
			<div className={styles.totpSetup}>
				{step === 'setup' && (
					<div className={styles.setupStep}>
						<div className={styles.stepHeader}>
							<Icon name='material-security' size={24} className={styles.stepIcon} />
							<div className={styles.stepTitle}>
								{is_cn ? '扫描二维码' : 'Scan QR Code'}
							</div>
							<div className={styles.stepDescription}>
								{is_cn
									? '使用身份验证器应用（如 Google Authenticator、Authy）扫描下方二维码'
									: 'Use an authenticator app (like Google Authenticator, Authy) to scan the QR code below'}
							</div>
						</div>

						<div className={styles.qrCodeContainer}>
							{qrCodeUrl && (
								<div className={styles.qrCodePlaceholder}>
									<Icon name='material-qr_code_2' size={120} />
									<div className={styles.qrCodeText}>
										{is_cn
											? '请使用身份验证器扫描此二维码'
											: 'Scan this QR code with your authenticator'}
									</div>
									<div className={styles.qrCodeUrl}>
										<code>{qrCodeUrl}</code>
									</div>
								</div>
							)}
						</div>

						<div className={styles.manualEntry}>
							<div className={styles.manualTitle}>
								{is_cn ? '手动输入密钥' : 'Manual Entry'}
							</div>
							<div className={styles.secretCode}>
								<code>{secret}</code>
								<Button
									size='small'
									icon={<Icon name='material-content_copy' size={12} />}
									onClick={() => copyToClipboard(secret)}
								>
									{is_cn ? '复制' : 'Copy'}
								</Button>
							</div>
						</div>

						<div className={styles.stepActions}>
							<Button onClick={handleCancel}>{is_cn ? '取消' : 'Cancel'}</Button>
							<Button type='primary' onClick={() => setStep('verify')}>
								{is_cn ? '下一步' : 'Next'}
							</Button>
						</div>
					</div>
				)}

				{step === 'verify' && (
					<div className={styles.verifyStep}>
						<div className={styles.stepHeader}>
							<Icon name='material-verified_user' size={24} className={styles.stepIcon} />
							<div className={styles.stepTitle}>{is_cn ? '验证设置' : 'Verify Setup'}</div>
							<div className={styles.stepDescription}>
								{is_cn
									? '输入身份验证器应用中显示的6位验证码'
									: 'Enter the 6-digit code from your authenticator app'}
							</div>
						</div>

						<div className={styles.verificationForm}>
							<Input
								schema={{
									type: 'string',
									placeholder: is_cn ? '输入6位验证码' : 'Enter 6-digit code',
									maxLength: 6
								}}
								value={verificationCode}
								onChange={setVerificationCode}
								error=''
								hasError={false}
							/>
						</div>

						<div className={styles.stepActions}>
							<Button onClick={() => setStep('setup')}>{is_cn ? '上一步' : 'Back'}</Button>
							<Button
								type='primary'
								onClick={handleVerifyCode}
								loading={loading}
								disabled={!verificationCode || verificationCode.length !== 6}
							>
								{is_cn ? '验证' : 'Verify'}
							</Button>
						</div>
					</div>
				)}

				{step === 'backup' && (
					<div className={styles.backupStep}>
						<div className={styles.stepHeader}>
							<Icon name='material-backup' size={24} className={styles.stepIcon} />
							<div className={styles.stepTitle}>
								{is_cn ? '保存恢复代码' : 'Save Recovery Codes'}
							</div>
							<div className={styles.stepDescription}>
								{is_cn
									? '请保存这些恢复代码，当您无法使用身份验证器时可以使用它们登录'
									: "Please save these recovery codes. You can use them to sign in when you can't use your authenticator"}
							</div>
						</div>

						<div className={styles.backupCodes}>
							<div className={styles.codesGrid}>
								{backupCodes.map((code, index) => (
									<div key={index} className={styles.backupCode}>
										<code>{code}</code>
									</div>
								))}
							</div>
							<div className={styles.backupActions}>
								<Button
									icon={<Icon name='material-content_copy' size={12} />}
									onClick={() => copyToClipboard(backupCodes.join('\n'))}
								>
									{is_cn ? '复制全部' : 'Copy All'}
								</Button>
								<Button
									icon={<Icon name='material-download' size={12} />}
									onClick={downloadBackupCodes}
								>
									{is_cn ? '下载' : 'Download'}
								</Button>
							</div>
						</div>

						<div className={styles.warning}>
							<Icon name='material-warning' size={16} />
							<span>
								{is_cn
									? '请将恢复代码保存在安全的地方，每个代码只能使用一次'
									: 'Please store these codes in a safe place. Each code can only be used once'}
							</span>
						</div>

						<div className={styles.stepActions}>
							<Button type='primary' onClick={handleComplete}>
								{is_cn ? '完成设置' : 'Complete Setup'}
							</Button>
						</div>
					</div>
				)}
			</div>
		</Modal>
	)
}

export default TOTPSetup
