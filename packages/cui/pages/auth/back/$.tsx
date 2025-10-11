import React, { useState, useEffect } from 'react'
import { message, Button, Avatar } from 'antd'
import { getLocale, history } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { useIntl } from '@/hooks'
import AuthLayout from '../components/AuthLayout'
import styles from './index.less'
import { OAuthAuthbackParams, User, UserInfo, OAuthAuthResult, LoginStatus } from '@/openapi'
import { AfterLogin } from '../auth'

// Required parameters for OAuth callback
const requiredParams = ['code', 'state', 'provider']

// Cookie 工具函数
const getCookie = (name: string): string | null => {
	const value = `; ${document.cookie}`
	const parts = value.split(`; ${name}=`)
	if (parts.length === 2) return parts.pop()?.split(';').shift() || null
	return null
}

// 浏览器语言检测工具函数
const getBrowserLanguage = (): string => {
	const browserLang = navigator.language || navigator.languages?.[0] || 'en'
	return browserLang
}

// 语言标准化函数
const normalizeLocale = (locale: string): string => {
	if (locale.startsWith('zh')) {
		return 'zh-CN'
	}
	if (locale.startsWith('en')) {
		return 'en-US'
	}
	return locale
}

const AuthBack = () => {
	const global = useGlobal()

	// 语言设置
	const browserLang = getBrowserLanguage()
	const rawLocale = getLocale() || browserLang
	const currentLocale = normalizeLocale(rawLocale)

	const [loading, setLoading] = useState(true)
	const [success, setSuccess] = useState(false)
	const [entry, setEntry] = useState<string>('')
	const [authResult, setAuthResult] = useState<OAuthAuthResult | null>(null)
	const [countdown, setCountdown] = useState(20)
	const [oauthParams, setOauthParams] = useState<OAuthAuthbackParams>({
		code: '',
		state: '',
		provider: ''
	})
	const [error, setError] = useState<string>('')

	// 解析URL参数
	const parseURLParams = (): OAuthAuthbackParams => {
		const params: OAuthAuthbackParams = { code: '', state: '', provider: '' }
		const urlParams = new URLSearchParams(window.location.search)

		// 解析所有URL参数
		urlParams.forEach((value, key) => (params[key] = value))

		// 从路径中提取provider信息（如果有的话）
		const pathSegments = window.location.pathname.split('/')
		const backIndex = pathSegments.findIndex((segment) => segment === 'back')
		if (backIndex !== -1 && pathSegments[backIndex + 1]) {
			params.provider = pathSegments[backIndex + 1]
		}

		console.log('Parsed OAuth callback params:', params)
		return params
	}

	// 初始化页面
	useEffect(() => {
		const initAuthBack = async () => {
			if (!window.$app?.openapi) {
				return
			}

			const user = new User(window.$app.openapi)
			try {
				setLoading(true)

				// 解析URL参数
				const params = parseURLParams()
				setOauthParams(params)

				// 检查是否有错误参数
				if (params.error) {
					const errorMsg = params.error_description || params.error || 'OAuth authentication failed'
					setError(errorMsg)
					message.error(errorMsg)
					setLoading(false)
					return
				}

				// 检查必要参数
				for (const param of requiredParams) {
					if (!params[param] || params[param] === '') {
						const errorMsg = `Missing required parameter: ${param}`
						setError(errorMsg)
						message.error(errorMsg)
						setLoading(false)
						return
					}
				}

				// AuthBack Signin
				const signinRes = await user.auth.OAuthCallback(params.provider, params)

				if (user.IsError(signinRes)) {
					const errorMsg = signinRes.error?.error_description || 'OAuth authentication failed'
					setError(errorMsg)
					message.error(errorMsg)
					setLoading(false)
					return
				}

				// Check login status and handle accordingly
				const status = signinRes.data?.status

				// Handle MFA required
				if (status === LoginStatus.MFARequired) {
					history.push('/auth/signin/mfa')
					return
				}

				// Handle team selection required
				if (status === LoginStatus.TeamSelectionRequired) {
					history.push('/team/select')
					return
				}

				// Login successful (status === LoginStatus.Success)
				// console.log('AuthBack success:', signinRes.data)

				// Save user info to global state
				if (signinRes.data?.user) {
					// console.log('userInfo', signinRes.data.user)
					global.setUserInfo(signinRes.data.user)
				}

				// Set success state
				setAuthResult(signinRes.data || null)

				// After Login - 直接读取 cookie 中预设的跳转地址
				try {
					// 读取 cookie 中预设的跳转地址
					const loginRedirect = getCookie('login_redirect') || '/auth/helloworld'
					const logoutRedirect = getCookie('logout_redirect') || '/'

					const entry = await AfterLogin(global, {
						user: signinRes.data?.user || ({} as UserInfo),
						entry: loginRedirect,
						logout_redirect: logoutRedirect
					})
					setEntry(entry)

					// 直接跳转
					message.success('Login successful! Redirecting...')
					setTimeout(() => {
						window.location.href = loginRedirect
					}, 500)
				} catch (error) {
					console.error('Failed to setup user info:', error)
					message.error('Failed to setup user info, please try again')
					setError('Failed to setup user info, please try again')
					return
				}

				setLoading(false)
				setSuccess(true)
			} catch (error) {
				console.error('Failed to initialize auth back:', error)
				const errorMsg = error instanceof Error ? error.message : 'Failed to process OAuth callback'
				setError(errorMsg)
				message.error(errorMsg)
			} finally {
				setLoading(false)
			}
		}

		initAuthBack()
	}, [window.$app?.openapi])

	// 倒计时跳转逻辑
	// useEffect(() => {
	// 	if (success && countdown > 0) {
	// 		const timer = setTimeout(() => {
	// 			setCountdown(countdown - 1)
	// 		}, 1000)
	// 		return () => clearTimeout(timer)
	// 	} else if (success && countdown === 0) {
	// 		// 跳转到 /helloworld
	// 		history.push(entry || '/auth/helloworld')
	// 	}
	// }, [success, countdown])

	// 手动跳转
	const handleNavigate = () => {
		history.push(entry || '/auth/helloworld')
	}

	// 渲染加载状态
	const renderLoading = () => (
		<div className={styles.loginContainer}>
			<div className={styles.loginCard}>
				<div className={styles.titleSection}>
					<h1 className={styles.appTitle}>
						{currentLocale.startsWith('zh') ? '正在验证...' : 'Authenticating...'}
					</h1>
					<p className={styles.appSubtitle}>
						{currentLocale.startsWith('zh')
							? '请稍候，正在处理您的登录请求'
							: 'Please wait while we process your login request'}
					</p>
				</div>

				<div className={styles.loadingContainer}>
					<div className={styles.loadingSpinner}></div>
				</div>
			</div>
		</div>
	)

	// 渲染成功状态
	const renderSuccess = () => (
		<div className={styles.loginContainer}>
			<div className={styles.loginCard}>
				<div className={styles.titleSection}>
					<h1 className={styles.appTitle}>
						{currentLocale.startsWith('zh') ? '登录成功！' : 'Login Successful!'}
					</h1>
					<p className={styles.appSubtitle}>
						{currentLocale.startsWith('zh')
							? '欢迎回来，正在为您准备工作空间...'
							: 'Welcome back! Preparing your workspace...'}
					</p>
				</div>

				{authResult?.user && (
					<div className={styles.userInfoSection}>
						<Avatar size={64} src={authResult.user.picture} className={styles.userAvatar}>
							{authResult.user.name?.[0]?.toUpperCase() || 'U'}
						</Avatar>
						<div className={styles.userDetails}>
							<h3 className={styles.userName}>
								{authResult.user.name || authResult.user.user_id}
							</h3>
							<p className={styles.userProvider}>
								{currentLocale.startsWith('zh') ? '通过' : 'via'} {oauthParams.provider}
							</p>
							<p> {authResult.user.mfa_enabled ? 'MFA 已启用' : 'MFA 未启用'}</p>
						</div>
					</div>
				)}

				<div className={styles.authbackActions}>
					<p className={styles.countdownText}>
						{currentLocale.startsWith('zh')
							? `${countdown} 秒后自动跳转...`
							: `Redirecting in ${countdown} seconds...`}
					</p>
					<Button
						type='primary'
						size='large'
						onClick={handleNavigate}
						className={styles.continueButton}
					>
						{currentLocale.startsWith('zh') ? '立即进入' : 'Continue Now'}
					</Button>
				</div>
			</div>
		</div>
	)

	// 渲染错误状态
	const renderError = () => (
		<div className={styles.loginContainer}>
			<div className={styles.loginCard}>
				<div className={styles.titleSection}>
					<h1 className={`${styles.appTitle} ${styles.appTitleError}`}>
						{currentLocale.startsWith('zh') ? '验证失败' : 'Authentication Failed'}
					</h1>
					<p className={`${styles.appSubtitle} ${styles.appSubtitleError}`}>{error}</p>
				</div>

				<div className={styles.authbackActions}>
					<button
						className={`${styles.backButton} ${styles.backButtonError}`}
						onClick={() => window.history.back()}
					>
						{currentLocale.startsWith('zh') ? '返回' : 'Go Back'}
					</button>
				</div>
			</div>
		</div>
	)

	return (
		<AuthLayout
			logo={global.app_info?.logo || '/api/__yao/app/icons/app.png'}
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			{error ? renderError() : success ? renderSuccess() : renderLoading()}
		</AuthLayout>
	)
}

export default new window.$app.Handle(AuthBack).by(observer).by(window.$app.memo).get()
