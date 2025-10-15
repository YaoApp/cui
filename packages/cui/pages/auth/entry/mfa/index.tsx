import React, { useState } from 'react'
import { message } from 'antd'
import { getLocale, history } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { useIntl } from '@/hooks'
import { AuthInput, AuthButton } from '../../components'
import AuthLayout from '../../components/AuthLayout'
import styles from './index.less'
import { User } from '@/openapi'

// Browser language detection
const getBrowserLanguage = (): string => {
	const browserLang = navigator.language || navigator.languages?.[0] || 'en'
	return browserLang
}

// Language normalization
const normalizeLocale = (locale: string): string => {
	if (locale.startsWith('zh')) {
		return 'zh-CN'
	}
	if (locale.startsWith('en')) {
		return 'en-US'
	}
	return locale
}

const MFAVerification = () => {
	const messages = useIntl()
	const global = useGlobal()

	// Language setup
	const browserLang = getBrowserLanguage()
	const rawLocale = getLocale() || browserLang
	const currentLocale = normalizeLocale(rawLocale)

	const [loading, setLoading] = useState(false)
	const [totpCode, setTotpCode] = useState('')

	// Form validation
	const isFormValid = totpCode.trim() !== '' && totpCode.length === 6

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// Only allow numbers and limit to 6 digits
		const value = e.target.value.replace(/\D/g, '').slice(0, 6)
		setTotpCode(value)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!isFormValid) {
			message.warning(
				currentLocale.startsWith('zh') ? '请输入6位验证码' : 'Please enter a 6-digit verification code'
			)
			return
		}

		setLoading(true)
		try {
			if (!window.$app?.openapi) {
				message.error('API not initialized')
				return
			}

			const user = new User(window.$app.openapi)

			// TODO: Call MFA verification API
			// const result = await user.auth.VerifyMFA({
			// 	code: totpCode
			// })

			// Placeholder for now
			console.log('Verifying MFA code:', totpCode)

			// Simulate success
			await new Promise((resolve) => setTimeout(resolve, 1000))
			message.success(currentLocale.startsWith('zh') ? '验证成功！' : 'Verification successful!')

			// TODO: Handle successful MFA verification
			// Redirect to the entry page or continue OAuth flow
			history.push('/auth/helloworld')
		} catch (error) {
			message.error(
				currentLocale.startsWith('zh') ? '验证失败，请重试' : 'Verification failed, please try again'
			)
			console.error('MFA verification error:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleRecover = () => {
		// TODO: Navigate to recovery page or show recovery dialog
		history.push('/auth/recover')
	}

	return (
		<AuthLayout
			logo={global.app_info?.logo || '/api/__yao/app/icons/app.png'}
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			<div className={styles.container}>
				<div className={styles.loginContainer}>
					<div className={styles.loginCard}>
						{/* Title Section */}
						<div className={styles.titleSection}>
							<h1 className={styles.appTitle}>
								{currentLocale.startsWith('zh')
									? '多因素认证'
									: 'Multi-Factor Authentication'}
							</h1>
							<p className={styles.appSubtitle}>
								{currentLocale.startsWith('zh')
									? '请输入您的动态验证码'
									: 'Please enter your authentication code'}
							</p>
						</div>

						{/* MFA Form */}
						<form className={styles.loginForm} onSubmit={handleSubmit}>
							<AuthInput
								id='totp-code'
								placeholder={
									currentLocale.startsWith('zh') ? '6位验证码' : '6-digit code'
								}
								prefix='shield-outline'
								value={totpCode}
								onChange={handleInputChange}
								autoComplete='one-time-code'
								type='text'
							/>

							<AuthButton
								type='primary'
								loading={loading}
								disabled={!isFormValid || loading}
								fullWidth
								onClick={handleSubmit}
							>
								{loading
									? currentLocale.startsWith('zh')
										? '验证中...'
										: 'Verifying...'
									: currentLocale.startsWith('zh')
									? '验证'
									: 'Verify'}
							</AuthButton>
						</form>

						{/* Help Text */}
						<div className={styles.termsSection}>
							<p className={styles.termsText}>
								{currentLocale.startsWith('zh')
									? '请打开您的身份验证器应用查看验证码'
									: 'Open your authenticator app to view the code'}
							</p>
							<p className={styles.termsText}>
								{currentLocale.startsWith('zh') ? (
									<>
										无法访问您的验证器应用？{' '}
										<a onClick={handleRecover} className={styles.termsLink}>
											恢复账号
										</a>
									</>
								) : (
									<>
										Can't access your authenticator app?{' '}
										<a onClick={handleRecover} className={styles.termsLink}>
											Recover
										</a>
									</>
								)}
							</p>
						</div>
					</div>
				</div>
			</div>
		</AuthLayout>
	)
}

export default new window.$app.Handle(MFAVerification).by(observer).by(window.$app.memo).get()
