import React, { useState, useEffect, useRef, useCallback } from 'react'
import { message, Checkbox, notification } from 'antd'
import { getLocale, history } from '@umijs/max'
import { useAsyncEffect } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { useIntl } from '@/hooks'
import { SocialLogin, Settings, AuthInput, AuthButton, OtpInput } from '../components'
import AuthLayout from '../components/AuthLayout'
import Captcha from '../components/Captcha'
import { AfterLogin, IsLoggedIn } from '../auth'
import { Icon } from '@/widgets'
import { User } from '@/openapi'
import { getDefaultLogoUrl } from '@/services/wellknown'
import type { EntryConfig, SigninProvider, EntryVerificationStatus, LoginStatus } from '@/openapi/user/types'
import type { ThirdPartyProvider } from '@/pages/login/types'
import styles from './index.less'

const setCookie = (name: string, value: string) => {
	document.cookie = `${name}=${value};path=/;max-age=315360000`
}

const deleteCookie = (name: string) => {
	document.cookie = `${name}=;path=/;max-age=0`
}

const getCookie = (name: string): string | null => {
	const value = `; ${document.cookie}`
	const parts = value.split(`; ${name}=`)
	if (parts.length === 2) return parts.pop()?.split(';').shift() || null
	return null
}

const getUrlParam = (name: string): string | null => {
	const urlParams = new URLSearchParams(window.location.search)
	return urlParams.get(name)
}

const getBrowserLanguage = (): string => {
	return navigator.language || navigator.languages?.[0] || 'en'
}

const normalizeLocale = (locale: string): string => {
	if (locale.startsWith('zh')) return 'zh-CN'
	if (locale.startsWith('en')) return 'en-US'
	return locale
}

type DeviceFlowStatus = 'idle' | 'polling' | 'success' | 'error'

const AuthConnect = () => {
	const messages = useIntl()
	const global = useGlobal()
	const rawLocale = getLocale() || getBrowserLanguage()
	const currentLocale = normalizeLocale(rawLocale)
	const isZh = currentLocale.startsWith('zh')

	// --- Entry form state (mirrors auth/entry) ---
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
	const [captchaData, setCaptchaData] = useState<{ id: string; image: string } | null>(null)
	const [captchaLoading, setCaptchaLoading] = useState(false)
	const [captchaReady, setCaptchaReady] = useState(false)
	const [verificationStatus, setVerificationStatus] = useState<EntryVerificationStatus | null>(null)
	const [isEmailVerified, setIsEmailVerified] = useState(false)
	const [accessToken, setAccessToken] = useState<string>('')
	const [otpId, setOtpId] = useState<string>('')
	const [rememberMe, setRememberMe] = useState(false)
	const [otpInputFocused, setOtpInputFocused] = useState(false)

	// --- Device Flow state ---
	const [deviceStatus, setDeviceStatus] = useState<DeviceFlowStatus>('idle')
	const [userCode, setUserCode] = useState('')
	const [deviceCode, setDeviceCode] = useState('')
	const [verifyUrl, setVerifyUrl] = useState('')
	const [pollInterval, setPollInterval] = useState(5)
	const [remaining, setRemaining] = useState(0)
	const [errorMsg, setErrorMsg] = useState('')

	const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const abortedRef = useRef(false)

	// --- Init ---
	useEffect(() => {
		if (IsLoggedIn()) {
			const entry = global.app_info?.login?.entry?.['admin'] || '/'
			history.push(entry)
		}
		return () => stopPolling()
	}, [])

	useAsyncEffect(async () => {
		const redirectParam = getUrlParam('redirect')
		if (redirectParam && redirectParam.trim() !== '') {
			setCookie('login_redirect', redirectParam)
		} else if (config?.success_url) {
			setCookie('login_redirect', config.success_url)
		}
	}, [config?.success_url])

	useAsyncEffect(async () => {
		try {
			if (!window.$app?.openapi) return
			const user = new User(window.$app.openapi)
			const configRes = await user.auth.GetEntryConfig(currentLocale)
			if (!user.IsError(configRes) && configRes.data) {
				setConfig(configRes.data)
			} else {
				message.error('Failed to load configuration')
			}
		} catch (error) {
			console.error('Failed to load configuration:', error)
			message.error('Failed to load configuration')
		}
	}, [currentLocale, global.app_info])

	// --- Captcha ---
	const loadCaptcha = async (refresh?: boolean) => {
		if (captchaLoading) return
		try {
			if (!window.$app?.openapi) return
			setCaptchaLoading(true)
			const user = new User(window.$app.openapi)
			const response = refresh && captchaData?.id
				? await user.auth.RefreshCaptcha(captchaData.id)
				: await user.auth.GetCaptcha()
			if (!user.IsError(response) && response.data) {
				setCaptchaData({ id: response.data.captcha_id, image: response.data.captcha_image })
			}
		} catch (error) {
			console.error('Failed to load captcha:', error)
		} finally {
			setCaptchaLoading(false)
		}
	}

	const isFormValid = formData.email.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)

	const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value
		if (field === 'email') {
			const isValidEmail = newValue.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)
			if (isValidEmail) {
				setFormData((prev) => ({ ...prev, [field]: newValue }))
				if (config?.form?.captcha && config.form.captcha.type === 'image' && !captchaData) {
					loadCaptcha()
				}
			} else {
				setFormData((prev) => ({ ...prev, [field]: newValue, captcha: '' }))
				setCaptchaReady(false)
			}
		} else {
			setFormData((prev) => ({ ...prev, [field]: newValue }))
		}
	}

	const handleCaptchaChange = (value: string) => {
		setFormData((prev) => ({ ...prev, captcha: value }))
		setCaptchaReady(value.trim() !== '')
	}

	// --- Email verify (Entry flow) ---
	const handleVerifyEmail = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!isFormValid) {
			message.warning(isZh ? '请输入有效的邮箱地址' : 'Please enter a valid email address')
			return
		}
		if (config?.form?.captcha && !captchaReady) {
			message.warning(isZh ? '请完成验证码' : 'Please complete the captcha verification')
			return
		}
		setVerifying(true)
		try {
			if (!window.$app?.openapi) return
			const user = new User(window.$app.openapi)
			const result = await user.auth.EntryVerify({
				username: formData.email,
				captcha_id: captchaData?.id || undefined,
				captcha: formData.captcha || undefined,
				locale: currentLocale
			})
			if (!user.IsError(result) && result.data) {
				setAccessToken(result.data.access_token)
				setVerificationStatus(result.data.status)
				setIsEmailVerified(true)
				if (result.data.otp_id) setOtpId(result.data.otp_id)
				if (result.data.status === 'register' as EntryVerificationStatus && result.data.verification_sent) {
					notification.success({
						message: isZh ? '验证码已发送' : 'Verification Code Sent',
						description: isZh ? '验证码已发送到您的邮箱，请查收' : 'A verification code has been sent to your email.',
						placement: 'topRight',
						duration: 8
					})
				}
			} else {
				message.error(result.error?.error_description || 'Failed to verify email')
				if (config?.form?.captcha && config.form.captcha.type === 'image') await loadCaptcha(true)
			}
		} catch (error) {
			message.error('Failed to verify email')
		} finally {
			setVerifying(false)
		}
	}

	const handleResendCode = async () => {
		if (!window.$app?.openapi) throw new Error('API not initialized')
		const user = new User(window.$app.openapi)
		const result = await user.auth.SendOTP(accessToken, currentLocale)
		if (!user.IsError(result) && result.data) {
			if (result.data.otp_id) setOtpId(result.data.otp_id)
			notification.success({
				message: isZh ? '验证码已重发' : 'Verification Code Resent',
				description: isZh ? '验证码已重新发送到您的邮箱' : 'A new verification code has been sent to your email.',
				placement: 'topRight',
				duration: 8
			})
		} else {
			throw new Error(result.error?.error_description || 'Failed to resend verification code')
		}
	}

	const handleBackToEmail = () => {
		setIsEmailVerified(false)
		setVerificationStatus(null)
		setAccessToken('')
		setOtpId('')
		setFormData((prev) => ({ ...prev, password: '', confirmPassword: '', verificationCode: '', captcha: '' }))
		setCaptchaReady(false)
		if (config?.form?.captcha && config.form.captcha.type === 'image') {
			loadCaptcha(true)
		} else {
			setCaptchaData(null)
		}
	}

	// --- Submit login/register (Entry flow) ---
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (verificationStatus === ('login' as EntryVerificationStatus)) {
			if (!formData.password) { message.warning(isZh ? '请输入密码' : 'Please enter your password'); return }
		} else if (verificationStatus === ('register' as EntryVerificationStatus)) {
			if (!formData.password) { message.warning(isZh ? '请输入密码' : 'Please enter your password'); return }
			if (!formData.confirmPassword) { message.warning(isZh ? '请确认密码' : 'Please confirm your password'); return }
			if (formData.password !== formData.confirmPassword) { message.warning(isZh ? '两次输入的密码不一致' : 'Passwords do not match'); return }
			if (!formData.verificationCode) { message.warning(isZh ? '请输入验证码' : 'Please enter the verification code'); return }
		}

		setLoading(true)
		try {
			if (!window.$app?.openapi) return
			const user = new User(window.$app.openapi)

			if (verificationStatus === ('login' as EntryVerificationStatus)) {
				const loginResult = await user.auth.EntryLogin(
					{ password: formData.password, remember_me: rememberMe, locale: currentLocale },
					accessToken
				)
				if (user.IsError(loginResult)) {
					message.error(loginResult.error?.error_description || 'Login failed')
					return
				}
				const status = loginResult.data?.status || ('ok' as LoginStatus)
				if (status === ('mfa_required' as LoginStatus)) { history.push('/auth/entry/mfa'); return }
				if (status === ('team_selection_required' as LoginStatus)) { history.push('/team/select'); return }
				if (status === ('invite_verification_required' as LoginStatus)) {
					if (loginResult.data?.access_token) sessionStorage.setItem('invite_access_token', loginResult.data.access_token)
					history.push('/auth/entry/invite')
					return
				}
				if (loginResult.data?.id_token) {
					await completeLogin(loginResult.data.id_token, user)
				}
			} else if (verificationStatus === ('register' as EntryVerificationStatus)) {
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
					message.error(registerResult.error?.error_description || 'Registration failed')
					return
				}
				const status = registerResult.data?.status
				if (status === ('invite_verification_required' as LoginStatus)) {
					if (registerResult.data?.access_token) sessionStorage.setItem('invite_access_token', registerResult.data.access_token)
					message.success(isZh ? '注册成功！请验证邀请码' : 'Registration successful! Please verify invitation code.')
					history.push('/auth/entry/invite')
					return
				}
				if (status === ('mfa_required' as LoginStatus)) { history.push('/auth/entry/mfa'); return }
				if (status === ('team_selection_required' as LoginStatus)) { history.push('/team/select'); return }
				if (!status || !registerResult.data?.id_token) {
					message.success(isZh ? '注册成功！' : 'Registration successful!')
					setTimeout(() => history.push('/auth/connect'), 1500)
					return
				}
				if (registerResult.data?.id_token) {
					await completeLogin(registerResult.data.id_token, user)
				}
			}
		} catch (error) {
			message.error('Failed to submit')
		} finally {
			setLoading(false)
		}
	}

	const completeLogin = async (idToken: string, userClient: InstanceType<typeof User>) => {
		const userInfo = await userClient.auth.ValidateIDToken(idToken)
		const loginRedirect = getCookie('login_redirect') || config?.success_url || '/'
		const logoutRedirect = getCookie('logout_redirect') || '$dashboard/auth/connect'
		await AfterLogin(global, { user: userInfo, entry: loginRedirect, logout_redirect: logoutRedirect })
		message.success(isZh ? '登录成功！' : 'Login successful!')
		deleteCookie('login_redirect')
		deleteCookie('logout_redirect')
		setTimeout(() => { window.location.href = loginRedirect }, 500)
	}

	// --- Device Flow ---
	const stopPolling = () => {
		abortedRef.current = true
		if (pollingRef.current) { clearTimeout(pollingRef.current); pollingRef.current = null }
		if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
	}

	const startCountdown = (expiresIn: number) => {
		const deadline = Date.now() + expiresIn * 1000
		setRemaining(expiresIn)
		if (countdownRef.current) clearInterval(countdownRef.current)
		countdownRef.current = setInterval(() => {
			const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
			setRemaining(left)
			if (left <= 0 && countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
		}, 1000)
	}

	const pollToken = useCallback(
		async (provider: string, devCode: string, interval: number) => {
			if (abortedRef.current) return
			if (!window.$app?.openapi) return
			const user = new User(window.$app.openapi)
			try {
				const res = await user.auth.DeviceFlowToken(provider, devCode, currentLocale)
				if (abortedRef.current) return
				if (user.IsError(res)) throw new Error((res as any)?.error?.error_description || 'Token polling failed')
				const data = res.data
				if (!data) return

				switch (data.status) {
					case 'pending':
						pollingRef.current = setTimeout(() => pollToken(provider, devCode, interval), interval * 1000)
						break
					case 'slow_down':
						interval += 5
						setPollInterval(interval)
						pollingRef.current = setTimeout(() => pollToken(provider, devCode, interval), interval * 1000)
						break
					case 'success':
						stopPolling()
						if (data.id_token) {
							await completeLogin(data.id_token, user)
						}
						setDeviceStatus('success')
						break
					case 'expired':
						stopPolling()
						setErrorMsg(isZh ? '授权已超时，请重试' : 'Authorization timed out, please try again')
						setDeviceStatus('error')
						break
					case 'denied':
						stopPolling()
						setErrorMsg(isZh ? '授权被拒绝' : 'Authorization was denied')
						setDeviceStatus('error')
						break
					default:
						stopPolling()
						setErrorMsg(isZh ? '未知状态' : 'Unknown status')
						setDeviceStatus('error')
				}
			} catch (err: any) {
				if (abortedRef.current) return
				stopPolling()
				setErrorMsg(err?.message || (isZh ? '轮询失败' : 'Polling failed'))
				setDeviceStatus('error')
			}
		},
		[currentLocale, isZh, config]
	)

	const handleThirdPartyClick = async (provider: ThirdPartyProvider) => {
		if (!window.$app?.openapi) {
			message.error(isZh ? 'API 未初始化' : 'API not initialized')
			return
		}
		const user = new User(window.$app.openapi)
		try {
			const res = await user.auth.DeviceFlowAuthorize(provider.id)
			if (user.IsError(res)) {
				throw new Error((res as any)?.error?.error_description || (isZh ? '设备授权请求失败' : 'Device authorization request failed'))
			}
			const data = res.data
			if (!data?.device_code || !data?.user_code) {
				throw new Error(isZh ? '返回数据不完整' : 'Incomplete response from server')
			}
		setDeviceCode(data.device_code)
		setUserCode(data.user_code)
		setPollInterval(data.interval || 5)
		const url = data.verification_uri_complete || data.verification_uri || data.verification_url || ''
		setVerifyUrl(url)
		setDeviceStatus('polling')
		startCountdown(data.expires_in || 900)

			abortedRef.current = false
			pollingRef.current = setTimeout(
				() => pollToken(provider.id, data.device_code, data.interval || 5),
				(data.interval || 5) * 1000
			)
		} catch (err: any) {
			message.error(err?.message || (isZh ? '请求失败' : 'Request failed'))
		}
	}

	const handleDeviceRetry = () => {
		stopPolling()
		abortedRef.current = false
		setDeviceStatus('idle')
		setUserCode('')
		setDeviceCode('')
		setVerifyUrl('')
		setErrorMsg('')
	}

	const formatRemaining = (seconds: number): string => {
		const m = Math.floor(seconds / 60)
		const s = seconds % 60
		return `${m}:${s.toString().padStart(2, '0')}`
	}

	// --- Render ---
	if (!config) {
		return (
			<div className={styles.container}>
				<div className={styles.loadingContainer}>
					<div className={styles.loadingSpinner}></div>
				</div>
			</div>
		)
	}

	// Device Flow polling/success/error overlay
	if (deviceStatus === 'polling' || deviceStatus === 'success' || deviceStatus === 'error') {
		return (
			<AuthLayout
				logo={global.app_info?.logo || getDefaultLogoUrl()}
				theme={global.theme}
				onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
			>
				<div className={styles.connectContainer}>
					<div className={styles.connectCard}>
						{deviceStatus === 'polling' && (
							<>
								<div className={styles.titleSection}>
									<h1 className={styles.appTitle}>
										{isZh ? '完成授权' : 'Complete Authorization'}
									</h1>
									<p className={styles.appSubtitle}>
										{isZh ? '点击下方按钮在浏览器中完成授权' : 'Click the button below to authorize in your browser'}
									</p>
								</div>
								<div className={styles.pollingSection}>
									<p className={styles.userCodeLabel}>{isZh ? '验证码（点击复制）' : 'Verification Code (click to copy)'}</p>
									<p
										className={styles.userCode}
										style={{ cursor: 'pointer' }}
										onClick={() => {
											navigator.clipboard.writeText(userCode).then(() => {
												message.success(isZh ? '已复制验证码' : 'Code copied')
											})
										}}
										title={isZh ? '点击复制' : 'Click to copy'}
									>{userCode}</p>
									{verifyUrl && (
										<AuthButton type='primary' fullWidth onClick={() => window.open(verifyUrl, '_blank')}>
											{isZh ? '打开浏览器授权' : 'Open Browser to Authorize'}
										</AuthButton>
									)}
									<div className={styles.pollingStatus}>
										<span className={styles.pollingDot}></span>
										<span>{isZh ? '等待授权中...' : 'Waiting for authorization...'}</span>
									</div>
									{remaining > 0 && (
										<p className={styles.countdown}>
											{isZh ? `${formatRemaining(remaining)} 后过期` : `Expires in ${formatRemaining(remaining)}`}
										</p>
									)}
									<span className={styles.cancelLink} onClick={handleDeviceRetry}>
										{isZh ? '取消' : 'Cancel'}
									</span>
								</div>
							</>
						)}
						{deviceStatus === 'success' && (
							<div className={styles.titleSection}>
								<div className={styles.statusIcon}>
									<Icon name='check_circle-outline' size={48} />
								</div>
								<h1 className={styles.appTitle}>{isZh ? '登录成功' : 'Sign In Successful'}</h1>
								<p className={styles.appSubtitle}>{isZh ? '正在跳转...' : 'Redirecting...'}</p>
							</div>
						)}
						{deviceStatus === 'error' && (
							<>
								<div className={styles.titleSection}>
									<div className={`${styles.statusIcon} ${styles.statusError}`}>
										<Icon name='error-outline' size={48} />
									</div>
									<h1 className={styles.appTitle}>{isZh ? '登录失败' : 'Sign In Failed'}</h1>
									<p className={styles.appSubtitle}>{errorMsg}</p>
								</div>
								<div className={styles.retrySection}>
									<AuthButton type='primary' fullWidth onClick={handleDeviceRetry}>
										{isZh ? '重试' : 'Try Again'}
									</AuthButton>
								</div>
							</>
						)}
					</div>
				</div>
			</AuthLayout>
		)
	}

	// Main page: Entry form + Device Flow social login
	const providers = config?.third_party?.providers || []

	return (
		<AuthLayout
			logo={global.app_info?.logo || getDefaultLogoUrl()}
			logoLink='/'
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			<div className={styles.entryContainer}>
				<div className={styles.entryCard}>
					<div className={styles.titleSection}>
						<h1 className={styles.appTitle}>{config.title || 'Welcome'}</h1>
						<p className={styles.appSubtitle}>
							{config.description || (isZh ? '输入邮箱以继续' : 'Enter your email to continue')}
						</p>
					</div>

					<form
						className={styles.entryForm}
						onSubmit={isEmailVerified ? handleSubmit : handleVerifyEmail}
					>
						<AuthInput
							id='email'
							placeholder={
								config.form?.username?.placeholder ||
								messages.entry?.form?.email_placeholder ||
								(isZh ? '输入邮箱地址' : 'Enter your email address')
							}
							prefix='material-mail_outline'
							value={formData.email}
							onChange={handleInputChange('email')}
							autoComplete='email'
							type='email'
							disabled={isEmailVerified}
							suffix={
								isEmailVerified ? (
									<span className={styles.changeEmailLink} onClick={handleBackToEmail}>
										{isZh ? '修改' : 'Change'}
									</span>
								) : undefined
							}
						/>

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

						{isEmailVerified && (
							<>
								<AuthInput.Password
									id='password'
									placeholder={
										config.form?.password?.placeholder ||
										(isZh ? '输入密码' : 'Enter your password')
									}
									prefix='material-lock'
									value={formData.password}
									onChange={handleInputChange('password')}
									autoComplete={
										verificationStatus === ('login' as EntryVerificationStatus)
											? 'current-password'
											: 'new-password'
									}
								/>
								{verificationStatus === ('register' as EntryVerificationStatus) && (
									<AuthInput.Password
										id='confirm-password'
										placeholder={isZh ? '确认密码' : 'Confirm your password'}
										prefix='material-lock'
										value={formData.confirmPassword}
										onChange={handleInputChange('confirmPassword')}
										autoComplete='new-password'
									/>
								)}
							</>
						)}

						{isEmailVerified && verificationStatus === ('register' as EntryVerificationStatus) && (
							<div className={styles.otpWrapper}>
								<OtpInput
									value={formData.verificationCode}
									onChange={(value) => setFormData((prev) => ({ ...prev, verificationCode: value }))}
									onResend={handleResendCode}
									placeholder={isZh ? '验证码' : 'Code'}
									resendText={isZh ? '重发' : 'Resend'}
									sendingText={isZh ? '发送中...' : 'Sending...'}
									resendInText={isZh ? '{0}秒' : '{0}s'}
									interval={60}
									onFocus={() => setOtpInputFocused(true)}
									onBlur={() => setOtpInputFocused(false)}
								/>
								{otpInputFocused && (
									<div className={styles.otpHelper}>
										{isZh ? '请查收您的邮箱获取验证码' : 'Please check your email for the verification code'}
									</div>
								)}
							</div>
						)}

						{isEmailVerified && verificationStatus === ('login' as EntryVerificationStatus) && (
							<div className={styles.loginOptions}>
								{config.form?.remember_me && (
									<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}>
										{isZh ? '记住我' : 'Remember me'}
									</Checkbox>
								)}
								{config.form?.forgot_password_link && (
									<a href='/auth/forgot-password' className={styles.forgotPasswordLink}>
										{isZh ? '忘记密码？' : 'Forgot password?'}
									</a>
								)}
							</div>
						)}

						<AuthButton
							type='primary'
							loading={loading || verifying}
							disabled={
								loading || verifying || !isFormValid ||
								(!isEmailVerified && config?.form?.captcha && !captchaReady)
							}
							fullWidth
							onClick={isEmailVerified ? handleSubmit : handleVerifyEmail}
						>
							{loading || verifying
								? (isZh ? '处理中...' : 'Processing...')
								: isEmailVerified
									? verificationStatus === ('login' as EntryVerificationStatus)
										? (isZh ? '登录' : 'Log In')
										: (isZh ? '注册' : 'Sign Up')
									: (isZh ? '继续' : 'Continue')}
						</AuthButton>
					</form>

					{providers.length > 0 && (
						<div className={styles.socialSection}>
							<SocialLogin
								providers={providers as ThirdPartyProvider[]}
								onProviderClick={handleThirdPartyClick}
								loading={loading}
							/>
						</div>
					)}

					{(config.form?.terms_of_service_link || config.form?.privacy_policy_link) && (
						<div className={styles.termsSection}>
							<p className={styles.termsText}>
								{isZh ? '继续即表示您同意我们的' : 'By continuing, you agree to our'}{' '}
								{config.form.terms_of_service_link && (
									<a href={config.form.terms_of_service_link} className={styles.termsLink} target='_blank' rel='noopener noreferrer'>
										{isZh ? '服务条款' : 'Terms of Service'}
									</a>
								)}
								{config.form.terms_of_service_link && config.form.privacy_policy_link && (isZh ? '和' : ' and ')}
								{config.form.privacy_policy_link && (
									<a href={config.form.privacy_policy_link} className={styles.termsLink} target='_blank' rel='noopener noreferrer'>
										{isZh ? '隐私政策' : 'Privacy Policy'}
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

export default observer(AuthConnect)
