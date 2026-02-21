import React, { useState } from 'react'
import { message, Checkbox, notification } from 'antd'
import { getLocale, history } from '@umijs/max'
import { useAsyncEffect } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { useIntl } from '@/hooks'
import { SocialLogin, Settings, AuthInput, AuthButton, OtpInput } from '../components'
import AuthLayout from '../components/AuthLayout'
import Captcha from '../components/Captcha'
import styles from './index.less'
import { User } from '@/openapi/user'
import { EntryConfig, SigninProvider, EntryVerificationStatus, LoginStatus } from '@/openapi/user/types'
import { AfterLogin } from '../auth'
import { getDefaultLogoUrl } from '@/services/wellknown'

// Note: This is the unified auth entry point
// Backend will determine if user is logging in or registering based on email existence

// Cookie 工具函数
const setCookie = (name: string, value: string) => {
	document.cookie = `${name}=${value};path=/;max-age=315360000`
}

const getUrlParam = (name: string): string | null => {
	const urlParams = new URLSearchParams(window.location.search)
	return urlParams.get(name)
}

// 浏览器语言检测工具函数
const getBrowserLanguage = (): string => {
	// 获取浏览器首选语言
	const browserLang = navigator.language || navigator.languages?.[0] || 'en'
	return browserLang
}

// 语言标准化函数 - 将浏览器语言映射到应用支持的语言
const normalizeLocale = (locale: string): string => {
	if (locale.startsWith('zh')) {
		return 'zh-CN'
	}
	if (locale.startsWith('en')) {
		return 'en-US'
	}
	return locale
}

const AuthEntry = () => {
	const messages = useIntl()
	const global = useGlobal()

	// 使用浏览器语言作为默认语言，fallback到当前locale
	const browserLang = getBrowserLanguage()
	const rawLocale = getLocale() || browserLang
	const currentLocale = normalizeLocale(rawLocale)

	const [loading, setLoading] = useState(false)
	const [verifying, setVerifying] = useState(false)
	const [formData, setFormData] = useState({
		email: '',
		captcha: '',
		password: '',
		confirmPassword: '',
		verificationCode: ''
	})
	const [config, setConfig] = useState<EntryConfig | null>(null)
	const [captchaData, setCaptchaData] = useState<{
		id: string
		image: string
	} | null>(null)
	const [captchaLoading, setCaptchaLoading] = useState(false)
	const [captchaReady, setCaptchaReady] = useState(false) // 标记验证码是否已准备好（CF）或已输入（图片）

	// Entry verification state
	const [verificationStatus, setVerificationStatus] = useState<EntryVerificationStatus | null>(null)
	const [isEmailVerified, setIsEmailVerified] = useState(false)
	const [accessToken, setAccessToken] = useState<string>('')
	const [otpId, setOtpId] = useState<string>('')
	const [rememberMe, setRememberMe] = useState(false)
	const [otpInputFocused, setOtpInputFocused] = useState(false)

	// 处理 redirect 参数 - 设置登录后的跳转地址
	useAsyncEffect(async () => {
		const redirectParam = getUrlParam('redirect')
		if (redirectParam && redirectParam.trim() !== '') {
			// 如果 URL 有 redirect 参数，使用它
			setCookie('login_redirect', redirectParam)
		} else {
			// 如果没有 redirect 参数，等待 config 加载后使用 success_url 作为默认值
			if (config?.success_url) {
				setCookie('login_redirect', config.success_url)
			}
		}
	}, [config?.success_url])

	// Load configuration using real API
	useAsyncEffect(async () => {
		try {
			if (!window.$app?.openapi) {
				console.error('OpenAPI not initialized')
				return
			}

			const user = new User(window.$app.openapi)
			const configRes = await user.auth.GetEntryConfig(currentLocale)

			if (!user.IsError(configRes) && configRes.data) {
				setConfig(configRes.data)
			} else {
				console.error('Failed to load entry config:', configRes.error || 'Unknown error')
				message.error('Failed to load configuration')
			}
		} catch (error) {
			console.error('Failed to load configuration:', error)
			message.error('Failed to load configuration')
		}
	}, [currentLocale, global.app_info])

	// Load captcha data for image captcha
	const loadCaptcha = async (refresh?: boolean) => {
		if (captchaLoading) {
			return
		}

		try {
			if (!window.$app?.openapi) {
				console.error('OpenAPI not initialized')
				return
			}

			setCaptchaLoading(true)

			const user = new User(window.$app.openapi)
			let response

			if (refresh && captchaData?.id) {
				response = await user.auth.RefreshCaptcha(captchaData.id)
			} else {
				response = await user.auth.GetCaptcha()
			}

			if (!user.IsError(response) && response.data) {
				setCaptchaData({
					id: response.data.captcha_id,
					image: response.data.captcha_image
				})
			} else {
				console.error('Failed to load captcha:', response.error)
				message.error('Failed to load captcha')
			}
		} catch (error) {
			console.error('Failed to load captcha:', error)
			message.error('Failed to load captcha')
		} finally {
			setCaptchaLoading(false)
		}
	}

	// Form validation
	const isFormValid = formData.email.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)

	const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value

		// 当用户输入email时，根据有效性处理验证码
		if (field === 'email') {
			const isValidEmail = newValue.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)
			if (isValidEmail) {
				// Email有效，更新email值
				setFormData((prev) => ({
					...prev,
					[field]: newValue
				}))
				// 加载图片验证码（CF验证码会自动显示）
				if (config?.form?.captcha && config.form.captcha.type === 'image' && !captchaData) {
					loadCaptcha()
				}
			} else {
				// Email无效，重置验证码状态
				setFormData((prev) => ({
					...prev,
					[field]: newValue,
					captcha: ''
				}))
				setCaptchaReady(false)
			}
		} else {
			// 其他字段正常更新
			setFormData((prev) => ({
				...prev,
				[field]: newValue
			}))
		}
	}

	const handleCaptchaChange = (value: string) => {
		setFormData((prev) => ({
			...prev,
			captcha: value
		}))
		// 标记验证码已输入/验证通过
		setCaptchaReady(value.trim() !== '')
	}

	// Verify email and determine if it's login or register
	const handleVerifyEmail = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!isFormValid) {
			message.warning('Please enter a valid email address')
			return
		}

		// Check captcha requirement
		if (config?.form?.captcha && !captchaReady) {
			message.warning('Please complete the captcha verification')
			return
		}

		setVerifying(true)
		try {
			if (!window.$app?.openapi) {
				message.error('API not initialized')
				return
			}

			const user = new User(window.$app.openapi)
			const result = await user.auth.EntryVerify({
				username: formData.email,
				captcha_id: captchaData?.id || undefined,
				captcha: formData.captcha || undefined,
				locale: currentLocale
			})

			if (!user.IsError(result) && result.data) {
				// Store access token and otp_id for next step
				setAccessToken(result.data.access_token)
				setVerificationStatus(result.data.status)
				setIsEmailVerified(true)

				// Store OTP ID if provided
				if (result.data.otp_id) {
					setOtpId(result.data.otp_id)
				}

				if (result.data.status === EntryVerificationStatus.Register && result.data.verification_sent) {
					notification.success({
						message: currentLocale === 'zh-CN' ? '验证码已发送' : 'Verification Code Sent',
						description:
							currentLocale === 'zh-CN'
								? '验证码已发送到您的邮箱，请查收'
								: 'A verification code has been sent to your email. Please check your inbox.',
						placement: 'topRight',
						duration: 8 // 8秒后自动关闭
					})
				}
			} else {
				const errorMsg = result.error?.error_description || 'Failed to verify email'
				message.error(errorMsg)
				console.error('Entry verify error:', result.error)

				// Refresh captcha on error
				if (config?.form?.captcha && config.form.captcha.type === 'image') {
					await loadCaptcha(true)
				}
			}
		} catch (error) {
			message.error('Failed to verify email')
			console.error('Entry verify error:', error)
		} finally {
			setVerifying(false)
		}
	}

	// Resend verification code for registration
	const handleResendCode = async () => {
		if (!window.$app?.openapi) {
			throw new Error('API not initialized')
		}

		const user = new User(window.$app.openapi)
		const result = await user.auth.SendOTP(accessToken, currentLocale)

		if (!user.IsError(result) && result.data) {
			// Update OTP ID with the new one
			if (result.data.otp_id) {
				setOtpId(result.data.otp_id)
			}

			notification.success({
				message: currentLocale === 'zh-CN' ? '验证码已重发' : 'Verification Code Resent',
				description:
					currentLocale === 'zh-CN'
						? '验证码已重新发送到您的邮箱，请查收'
						: 'A new verification code has been sent to your email. Please check your inbox.',
				placement: 'topRight',
				duration: 8
			})
		} else {
			throw new Error(result.error?.error_description || 'Failed to resend verification code')
		}
	}

	// Cookie 工具函数
	const getCookie = (name: string): string | null => {
		const value = `; ${document.cookie}`
		const parts = value.split(`; ${name}=`)
		if (parts.length === 2) return parts.pop()?.split(';').shift() || null
		return null
	}

	// Handle back to email input
	const handleBackToEmail = () => {
		setIsEmailVerified(false)
		setVerificationStatus(null)
		setAccessToken('')
		setOtpId('')
		setFormData((prev) => ({
			...prev,
			password: '',
			confirmPassword: '',
			verificationCode: '',
			captcha: ''
		}))
		setCaptchaReady(false)

		// Reload captcha if needed
		if (config?.form?.captcha && config.form.captcha.type === 'image') {
			loadCaptcha(true)
		} else {
			setCaptchaData(null)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Validate based on verification status
		if (verificationStatus === EntryVerificationStatus.Login) {
			if (!formData.password) {
				message.warning('Please enter your password')
				return
			}
		} else if (verificationStatus === EntryVerificationStatus.Register) {
			if (!formData.password) {
				message.warning('Please enter your password')
				return
			}
			if (!formData.confirmPassword) {
				message.warning(currentLocale === 'zh-CN' ? '请确认您的密码' : 'Please confirm your password')
				return
			}
			if (formData.password !== formData.confirmPassword) {
				message.warning(currentLocale === 'zh-CN' ? '两次输入的密码不一致' : 'Passwords do not match')
				return
			}
			if (!formData.verificationCode) {
				message.warning('Please enter the verification code')
				return
			}
		}

		setLoading(true)
		try {
			if (!window.$app?.openapi) {
				message.error('API not initialized')
				return
			}

			const user = new User(window.$app.openapi)

			// Handle login
			if (verificationStatus === EntryVerificationStatus.Login) {
				const loginResult = await user.auth.EntryLogin(
					{
						password: formData.password,
						remember_me: rememberMe,
						locale: currentLocale
					},
					accessToken
				)

				if (user.IsError(loginResult)) {
					const errorMsg = loginResult.error?.error_description || 'Login failed'
					message.error(errorMsg)
					return
				}

				// Handle different login statuses
				const status = loginResult.data?.status || LoginStatus.Success

				// Handle MFA required
				if (status === LoginStatus.MFARequired) {
					history.push('/auth/entry/mfa')
					return
				}

				// Handle team selection required
				if (status === LoginStatus.TeamSelectionRequired) {
					history.push('/team/select')
					return
				}

				// Handle invite verification required
				if (status === LoginStatus.InviteVerification) {
					// Store temporary access token for invite verification
					if (loginResult.data?.access_token) {
						sessionStorage.setItem('invite_access_token', loginResult.data.access_token)
					}
					history.push('/auth/entry/invite')
					return
				}

				// Login successful - validate ID token and setup user
				if (loginResult.data?.id_token) {
					const userInfo = await user.auth.ValidateIDToken(loginResult.data.id_token)

					// Get redirect URLs from cookies
					const loginRedirect =
						getCookie('login_redirect') || config?.success_url || '/auth/helloworld'
					const logoutRedirect = getCookie('logout_redirect') || '/'

					// Setup user info using AfterLogin
					const entry = await AfterLogin(global, {
						user: userInfo,
						entry: loginRedirect,
						logout_redirect: logoutRedirect
					})

					message.success(currentLocale === 'zh-CN' ? '登录成功！' : 'Login successful!')

					// Redirect to entry page
					setTimeout(() => {
						window.location.href = loginRedirect
					}, 500)
				}
			}
			// Handle registration
			else if (verificationStatus === EntryVerificationStatus.Register) {
				const registerResult = await user.auth.EntryRegister(
					{
						password: formData.password,
						confirm_password: formData.confirmPassword,
						otp_id: otpId,
						verification_code: formData.verificationCode,
						locale: currentLocale
					},
					accessToken
				)

				if (user.IsError(registerResult)) {
					const errorMsg = registerResult.error?.error_description || 'Registration failed'
					message.error(errorMsg)
					return
				}

				// Handle different registration outcomes
				const status = registerResult.data?.status

				// Handle invite verification required (check first, before checking id_token)
				if (status === LoginStatus.InviteVerification) {
					// Store temporary access token for invite verification
					if (registerResult.data?.access_token) {
						sessionStorage.setItem('invite_access_token', registerResult.data.access_token)
					}
					message.success(
						registerResult.data?.message ||
							(currentLocale === 'zh-CN'
								? '注册成功！请验证邀请码'
								: 'Registration successful! Please verify invitation code.')
					)
					history.push('/auth/entry/invite')
					return
				}

				// Handle MFA required (unlikely for new user but possible)
				if (status === LoginStatus.MFARequired) {
					history.push('/auth/entry/mfa')
					return
				}

				// Handle team selection required
				if (status === LoginStatus.TeamSelectionRequired) {
					history.push('/team/select')
					return
				}

				// If auto_login is false or no id_token, show success message
				if (!status || !registerResult.data?.id_token) {
					message.success(
						registerResult.data?.message ||
							(currentLocale === 'zh-CN' ? '注册成功！' : 'Registration successful!')
					)
					// Redirect to entry page to login
					setTimeout(() => {
						history.push('/auth/entry')
					}, 1500)
					return
				}

				// Auto-login successful - validate ID token and setup user
				if (registerResult.data?.id_token) {
					const userInfo = await user.auth.ValidateIDToken(registerResult.data.id_token)

					// Get redirect URLs from cookies
					const loginRedirect =
						getCookie('login_redirect') || config?.success_url || '/auth/helloworld'
					const logoutRedirect = getCookie('logout_redirect') || '/'

					// Setup user info using AfterLogin
					await AfterLogin(global, {
						user: userInfo,
						entry: loginRedirect,
						logout_redirect: logoutRedirect
					})

					message.success(
						currentLocale === 'zh-CN'
							? '注册并登录成功！'
							: 'Registration and login successful!'
					)

					// Redirect to entry page
					setTimeout(() => {
						window.location.href = loginRedirect
					}, 500)
				}
			}
		} catch (error) {
			message.error('Failed to submit')
			console.error('Submit error:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleThirdPartyClick = async (provider: SigninProvider) => {
		try {
			if (!window.$app?.openapi) {
				message.error('API not initialized')
				return
			}

			const user = new User(window.$app.openapi)
			const authUrl = await user.auth.GetOAuthAuthorizationUrl(provider.id)

			// 跳转到OAuth授权页面
			window.location.href = authUrl
		} catch (error) {
			console.error(`OAuth error for ${provider.title}:`, error)
			message.error(`Error connecting to ${provider.title}`)
		}
	}

	if (!config) {
		return (
			<div className={styles.container}>
				<div className={styles.loadingContainer}>
					<div className={styles.loadingSpinner}></div>
				</div>
			</div>
		)
	}

	return (
		<AuthLayout
			logo={global.app_info?.logo || getDefaultLogoUrl()}
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			{/* Entry Container */}
			<div className={styles.entryContainer}>
				<div className={styles.entryCard}>
					{/* Title Section */}
					<div className={styles.titleSection}>
						<h1 className={styles.appTitle}>{config.title || 'Welcome'}</h1>
						<p className={styles.appSubtitle}>
							{config.description || 'Enter your email to continue'}
						</p>
					</div>

					{/* Entry Form */}
					<form
						className={styles.entryForm}
						onSubmit={isEmailVerified ? handleSubmit : handleVerifyEmail}
					>
					{/* Email Input - readonly after verification */}
					<AuthInput
						id='email'
						placeholder={
							config.form?.username?.placeholder ||
							messages.entry?.form?.email_placeholder ||
							'Enter your email address'
						}
						prefix='material-mail_outline'
						value={formData.email}
						onChange={handleInputChange('email')}
						autoComplete='email'
						type='email'
						disabled={isEmailVerified}
						suffix={
							isEmailVerified ? (
								<span
									className={styles.changeEmailLink}
									onClick={handleBackToEmail}
								>
									{currentLocale === 'zh-CN' ? '修改' : 'Change'}
								</span>
							) : undefined
						}
					/>

						{/* Captcha Field - 只在email有效且未验证时显示 */}
						{!isEmailVerified && config.form?.captcha && isFormValid && (
							<Captcha
								config={config.form.captcha}
								value={formData.captcha}
								onChange={handleCaptchaChange}
								onCaptchaVerified={handleCaptchaChange}
								captchaImage={captchaData?.image}
								onRefresh={() => loadCaptcha(true)}
							/>
						)}

						{/* Password Input - only show after email verification */}
						{isEmailVerified && (
							<>
								<AuthInput.Password
									id='password'
									placeholder={
										config.form?.password?.placeholder ||
										(currentLocale === 'zh-CN'
											? '输入密码'
											: 'Enter your password')
									}
									prefix='material-lock'
									value={formData.password}
									onChange={handleInputChange('password')}
									autoComplete={
										verificationStatus === EntryVerificationStatus.Login
											? 'current-password'
											: 'new-password'
									}
								/>
								{/* Confirm Password - only show for registration */}
								{verificationStatus === EntryVerificationStatus.Register && (
									<AuthInput.Password
										id='confirm-password'
										placeholder={
											currentLocale === 'zh-CN'
												? '确认密码'
												: 'Confirm your password'
										}
										prefix='material-lock'
										value={formData.confirmPassword}
										onChange={handleInputChange('confirmPassword')}
										autoComplete='new-password'
									/>
								)}
							</>
						)}

						{/* Verification Code Input - only show for registration */}
						{isEmailVerified && verificationStatus === EntryVerificationStatus.Register && (
							<div className={styles.otpWrapper}>
								<OtpInput
									value={formData.verificationCode}
									onChange={(value) =>
										setFormData((prev) => ({
											...prev,
											verificationCode: value
										}))
									}
									onResend={handleResendCode}
									placeholder={currentLocale === 'zh-CN' ? '验证码' : 'Code'}
									resendText={currentLocale === 'zh-CN' ? '重发' : 'Resend'}
									sendingText={
										currentLocale === 'zh-CN' ? '发送中...' : 'Sending...'
									}
									resendInText={currentLocale === 'zh-CN' ? '{0}秒' : '{0}s'}
									interval={60}
									onFocus={() => setOtpInputFocused(true)}
									onBlur={() => setOtpInputFocused(false)}
								/>
								{otpInputFocused && (
									<div className={styles.otpHelper}>
										{currentLocale === 'zh-CN'
											? '💡 请查收您的邮箱获取验证码'
											: '💡 Please check your email for the verification code'}
									</div>
								)}
							</div>
						)}

						{/* Remember Me & Forgot Password - only show for login */}
						{isEmailVerified && verificationStatus === EntryVerificationStatus.Login && (
							<div className={styles.loginOptions}>
								{config.form?.remember_me && (
									<Checkbox
										checked={rememberMe}
										onChange={(e) => setRememberMe(e.target.checked)}
									>
										Remember me
									</Checkbox>
								)}
								{config.form?.forgot_password_link && (
									<a
										href='/auth/forgot-password'
										className={styles.forgotPasswordLink}
									>
										Forgot password?
									</a>
								)}
							</div>
						)}

						<AuthButton
							type='primary'
							loading={loading || verifying}
							disabled={
								loading ||
								verifying ||
								!isFormValid ||
								(!isEmailVerified && config?.form?.captcha && !captchaReady)
							}
							fullWidth
							onClick={isEmailVerified ? handleSubmit : handleVerifyEmail}
						>
							{loading || verifying
								? messages.entry?.form?.loading ||
								  (currentLocale === 'zh-CN' ? '处理中...' : 'Processing...')
								: isEmailVerified
								? verificationStatus === EntryVerificationStatus.Login
									? currentLocale === 'zh-CN'
										? '登录'
										: 'Log In'
									: currentLocale === 'zh-CN'
									? '注册'
									: 'Sign Up'
								: messages.entry?.form?.continue_button ||
								  (currentLocale === 'zh-CN' ? '继续' : 'Continue')}
						</AuthButton>
					</form>

					{/* Third Party Login */}
					{config.third_party?.providers && config.third_party.providers.length > 0 && (
						<div className={styles.socialSection}>
							<SocialLogin
								providers={config.third_party.providers}
								onProviderClick={handleThirdPartyClick}
								loading={loading}
							/>
						</div>
					)}

					{/* Terms Agreement */}
					{(config.form?.terms_of_service_link || config.form?.privacy_policy_link) && (
						<div className={styles.termsSection}>
							<p className={styles.termsText}>
								{messages.entry?.terms?.agreement || 'By continuing, you agree to our'}{' '}
								{config.form.terms_of_service_link && (
									<a
										href={config.form.terms_of_service_link}
										className={styles.termsLink}
										target='_blank'
										rel='noopener noreferrer'
									>
										{messages.entry?.terms?.terms || 'Terms of Service'}
									</a>
								)}
								{config.form.terms_of_service_link &&
									config.form.privacy_policy_link &&
									' ' + (messages.entry?.terms?.and || 'and') + ' '}
								{config.form.privacy_policy_link && (
									<a
										href={config.form.privacy_policy_link}
										className={styles.termsLink}
										target='_blank'
										rel='noopener noreferrer'
									>
										{messages.entry?.terms?.privacy || 'Privacy Policy'}
									</a>
								)}
							</p>
						</div>
					)}
				</div>
			</div>
		</AuthLayout>
	)
}

export default observer(AuthEntry)
