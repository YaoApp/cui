import React, { useState } from 'react'
import { message } from 'antd'
import { getLocale, history } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { useIntl } from '@/hooks'
import { AuthInput, AuthButton } from '../../components'
import AuthLayout from '../../components/AuthLayout'
import styles from './index.less'
import { User, UserInfo, LoginStatus } from '@/openapi'
import { AfterLogin } from '../../auth'

// Cookie 工具函数
const getCookie = (name: string): string | null => {
	const value = `; ${document.cookie}`
	const parts = value.split(`; ${name}=`)
	if (parts.length === 2) return parts.pop()?.split(';').shift() || null
	return null
}

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

const InviteVerification = () => {
	const messages = useIntl()
	const global = useGlobal()

	// Language setup
	const browserLang = getBrowserLanguage()
	const rawLocale = getLocale() || browserLang
	const currentLocale = normalizeLocale(rawLocale)

	const [loading, setLoading] = useState(false)
	const [inviteCode, setInviteCode] = useState('')

	// Form validation
	const isFormValid = inviteCode.trim() !== '' && inviteCode.length >= 6

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// Allow alphanumeric characters
		const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
		setInviteCode(value)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!isFormValid) {
			message.warning(
				currentLocale.startsWith('zh') ? '请输入有效的邀请码' : 'Please enter a valid invitation code'
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

			// TODO: Call invite verification API
			// const result = await user.auth.VerifyInvite({
			// 	code: inviteCode
			// })

			// Placeholder for now
			console.log('Verifying invite code:', inviteCode)

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Simulate successful verification
			message.success(currentLocale.startsWith('zh') ? '邀请码验证成功！' : 'Invitation code verified!')

			// After successful invite verification, the backend should return new tokens
			// Then we need to validate the ID token and setup user session

			// For now, redirect to entry page
			// TODO: Replace with actual token handling logic
			setTimeout(() => {
				history.push('/auth/helloworld')
			}, 500)
		} catch (error) {
			message.error(
				currentLocale.startsWith('zh')
					? '邀请码验证失败，请重试'
					: 'Invitation verification failed, please try again'
			)
			console.error('Invite verification error:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleBack = () => {
		// Go back to login page
		history.push('/auth/entry')
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
									? '验证邀请码'
									: 'Verify Invitation Code'}
							</h1>
							<p className={styles.appSubtitle}>
								{currentLocale.startsWith('zh')
									? '请输入您收到的邀请码以完成注册'
									: 'Please enter the invitation code you received to complete registration'}
							</p>
						</div>

						{/* Invite Form */}
						<form className={styles.loginForm} onSubmit={handleSubmit}>
							<AuthInput
								id='invite-code'
								placeholder={
									currentLocale.startsWith('zh') ? '邀请码' : 'Invitation Code'
								}
								prefix='mail-outline'
								value={inviteCode}
								onChange={handleInputChange}
								autoComplete='off'
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
									? '邀请码已发送到您的邮箱，请查收'
									: 'The invitation code has been sent to your email'}
							</p>
							<p className={styles.termsText}>
								{currentLocale.startsWith('zh') ? (
									<>
										没有收到邀请码？{' '}
										<a onClick={handleBack} className={styles.termsLink}>
											返回登录
										</a>
									</>
								) : (
									<>
										Didn't receive the code?{' '}
										<a onClick={handleBack} className={styles.termsLink}>
											Back to Login
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

export default new window.$app.Handle(InviteVerification).by(observer).by(window.$app.memo).get()
