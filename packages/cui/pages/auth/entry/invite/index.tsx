import React, { useState, useEffect } from 'react'
import { message } from 'antd'
import { getLocale, history } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { useIntl } from '@/hooks'
import { AuthInput, AuthButton } from '../../components'
import AuthLayout from '../../components/AuthLayout'
import styles from './index.less'
import { User, UserInfo, LoginStatus, EntryConfig } from '@/openapi'
import { AfterLogin } from '../../auth'
import { getDefaultLogoUrl } from '@/services/wellknown'

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
	const [config, setConfig] = useState<EntryConfig | null>(null)

	// Load entry config
	useEffect(() => {
		const loadConfig = async () => {
			try {
				if (!window.$app?.openapi) return
				const user = new User(window.$app.openapi)
				const response = await user.auth.GetEntryConfig(currentLocale)
				if (response.data) {
					setConfig(response.data)
				}
			} catch (error) {
				console.error('Failed to load entry config:', error)
			}
		}
		loadConfig()
	}, [currentLocale])

	// Form validation
	const isFormValid = inviteCode.trim() !== '' && inviteCode.length >= 6

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// Allow alphanumeric characters
		const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
		setInviteCode(value)
	}

	// Get access token from URL or sessionStorage
	const getAccessToken = (): string | null => {
		// Try to get from URL parameters first
		const urlParams = new URLSearchParams(window.location.search)
		const urlToken = urlParams.get('token')
		if (urlToken) {
			// Store in sessionStorage for future use
			sessionStorage.setItem('invite_access_token', urlToken)
			return urlToken
		}

		// Try sessionStorage
		const storedToken = sessionStorage.getItem('invite_access_token')
		if (storedToken) {
			return storedToken
		}

		return null
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!isFormValid) {
			message.warning(
				currentLocale.startsWith('zh') ? '请输入有效的邀请码' : 'Please enter a valid invitation code'
			)
			return
		}

		// Get access token
		const accessToken = getAccessToken()
		if (!accessToken) {
			message.error(
				currentLocale.startsWith('zh')
					? '缺少访问令牌，请重新登录'
					: 'Missing access token, please login again'
			)
			setTimeout(() => {
				history.push('/auth/entry')
			}, 1500)
			return
		}

		setLoading(true)
		try {
			if (!window.$app?.openapi) {
				message.error('API not initialized')
				return
			}

			const user = new User(window.$app.openapi)

			// Call invite verification API
			const result = await user.auth.VerifyInvite(inviteCode, accessToken)

			if (user.IsError(result)) {
				const errorMsg = result.error?.error_description || 'Invitation verification failed'
				message.error(errorMsg)
				return
			}

			// Clear the temporary token
			sessionStorage.removeItem('invite_access_token')

			// Handle different login statuses
			const status = result.data?.status || LoginStatus.Success

			// Handle MFA required
			if (status === LoginStatus.MFARequired) {
				message.success(
					currentLocale.startsWith('zh') ? '邀请码验证成功！' : 'Invitation code verified!'
				)
				history.push('/auth/entry/mfa')
				return
			}

			// Handle team selection required
			if (status === LoginStatus.TeamSelectionRequired) {
				message.success(
					currentLocale.startsWith('zh') ? '邀请码验证成功！' : 'Invitation code verified!'
				)
				history.push('/team/select')
				return
			}

			// Verification successful - validate ID token and setup user
			if (result.data?.id_token) {
				const userInfo = await user.auth.ValidateIDToken(result.data.id_token)

				// Get redirect URLs from cookies
				const loginRedirect = getCookie('login_redirect') || config?.success_url || '/auth/helloworld'
				const logoutRedirect = getCookie('logout_redirect') || '/'

				// Setup user info using AfterLogin
				await AfterLogin(global, {
					user: userInfo,
					entry: loginRedirect,
					logout_redirect: logoutRedirect
				})

				message.success(
					currentLocale.startsWith('zh')
						? '邀请码验证成功，欢迎使用！'
						: 'Invitation verified successfully, welcome!'
				)

				// Redirect to entry page
				setTimeout(() => {
					window.location.href = loginRedirect
				}, 500)
			} else {
				// No ID token returned (unexpected)
				message.error(
					currentLocale.startsWith('zh')
						? '验证成功但未收到登录凭证，请重新登录'
						: 'Verification successful but login credentials not received, please login again'
				)
				setTimeout(() => {
					history.push('/auth/entry')
				}, 1500)
			}
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
		// Go back to entry page to switch account
		history.push('/auth/entry')
	}

	// Get invite config from entry config
	const inviteConfig = config?.invite
	const pageTitle = inviteConfig?.title || (currentLocale.startsWith('zh') ? '输入邀请码' : 'Enter Invitation Code')
	const pageDescription =
		inviteConfig?.description ||
		(currentLocale.startsWith('zh')
			? '当前为公测阶段，需要官方邀请码才能使用'
			: 'We are currently in beta testing. An official invitation code is required.')
	const placeholder = inviteConfig?.placeholder || (currentLocale.startsWith('zh') ? '邀请码' : 'Invitation Code')
	const applyLink = inviteConfig?.apply_link
	const applyPrompt =
		inviteConfig?.apply_prompt ||
		(currentLocale.startsWith('zh') ? '没有邀请码？' : "Don't have an invitation code?")
	const applyText = inviteConfig?.apply_text || (currentLocale.startsWith('zh') ? '申请邀请码' : 'Apply for one')

	return (
		<AuthLayout
			logo={global.app_info?.logo || getDefaultLogoUrl()}
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			<div className={styles.container}>
				<div className={styles.loginContainer}>
					<div className={styles.loginCard}>
						{/* Title Section */}
						<div className={styles.titleSection}>
							<h1 className={styles.appTitle}>{pageTitle}</h1>
							<p className={styles.appSubtitle}>{pageDescription}</p>
						</div>

						{/* Invite Form */}
						<form className={styles.loginForm} onSubmit={handleSubmit}>
							<AuthInput
								id='invite-code'
								placeholder={placeholder}
								prefix='card-giftcard-outline'
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
										? '正在处理...'
										: 'Processing...'
									: currentLocale.startsWith('zh')
									? '继续'
									: 'Continue'}
							</AuthButton>
						</form>

						{/* Help Text */}
						<div className={styles.termsSection}>
							{applyLink && (
								<p className={styles.termsText}>
									{applyPrompt}{' '}
									<a
										href={applyLink}
										target='_blank'
										rel='noopener noreferrer'
										className={styles.termsLink}
									>
										{applyText}
									</a>
								</p>
							)}
							<p className={styles.termsText}>
								<a onClick={handleBack} className={styles.termsLink}>
									{currentLocale.startsWith('zh') ? '切换账号' : 'Switch Account'}
								</a>
							</p>
						</div>
					</div>
				</div>
			</div>
		</AuthLayout>
	)
}

export default new window.$app.Handle(InviteVerification).by(observer).by(window.$app.memo).get()
