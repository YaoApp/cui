import React, { useState, useEffect } from 'react'
import { message } from 'antd'
import { getLocale, history } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import AuthLayout from '../components/AuthLayout'
import styles from '../back/index.less'
import { User, UserInfo } from '@/openapi'
import { EntryConfig } from '@/openapi/user/types'
import { AfterLogin } from '../auth'
import { getDefaultLogoUrl } from '@/services/wellknown'

const setCookie = (name: string, value: string) => {
	document.cookie = `${name}=${value};path=/;max-age=315360000`
}

const getCookie = (name: string): string | null => {
	const value = `; ${document.cookie}`
	const parts = value.split(`; ${name}=`)
	if (parts.length === 2) return parts.pop()?.split(';').shift() || null
	return null
}

const deleteCookie = (name: string) => {
	document.cookie = `${name}=;path=/;max-age=0`
}

const getBrowserLanguage = (): string => {
	return navigator.language || navigator.languages?.[0] || 'en'
}

const normalizeLocale = (locale: string): string => {
	if (locale.startsWith('zh')) return 'zh-CN'
	if (locale.startsWith('en')) return 'en-US'
	return locale
}

const AuthToken = () => {
	const global = useGlobal()
	const browserLang = getBrowserLanguage()
	const rawLocale = getLocale() || browserLang
	const currentLocale = normalizeLocale(rawLocale)
	const isZh = currentLocale.startsWith('zh')

	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string>('')

	useEffect(() => {
		const initTokenLogin = async () => {
			if (!window.$app?.openapi) return

			const user = new User(window.$app.openapi)
			try {
				setLoading(true)

				const urlParams = new URLSearchParams(window.location.search)

				// Load entry config from API (same as /auth/entry)
				let config: EntryConfig | null = null
				try {
					const configRes = await user.auth.GetEntryConfig(currentLocale)
					if (!user.IsError(configRes) && configRes.data) {
						config = configRes.data
					}
				} catch {
					// Config is optional; proceed without it
				}

				// Set redirect cookies: URL param > config.success_url (same as /auth/entry)
				const redirectParam = urlParams.get('redirect')
				if (redirectParam && redirectParam.trim() !== '') {
					setCookie('login_redirect', redirectParam)
				} else if (config?.success_url) {
					setCookie('login_redirect', config.success_url)
				}

				if (config?.logout_redirect) {
					setCookie('logout_redirect', config.logout_redirect)
				}

				// Read token from URL query: ?token=<base64-encoded access_token>
				const tokenParam = urlParams.get('token')
				if (!tokenParam) {
					setError(isZh ? '缺少 token 参数' : 'Missing token parameter')
					setLoading(false)
					return
				}

				let accessToken: string
				try {
					accessToken = atob(tokenParam)
				} catch {
					accessToken = tokenParam
				}

				// Call POST /user/token/login with the access token
				const loginRes = await window.$app.openapi.Post<{
					status: string
					id_token: string
					user: any
				}>('/user/token/login', { token: accessToken })

				if (window.$app.openapi.IsError(loginRes)) {
					const errorMsg =
						(loginRes as any).error?.error_description || (isZh ? '令牌登录失败' : 'Token login failed')
					setError(errorMsg)
					message.error(errorMsg)
					setLoading(false)
					return
				}

				// Try to validate id_token for full OIDC user info;
				// fall back to the user object from the response if JWKS is unavailable.
				let userInfo: UserInfo
				const idToken = loginRes.data?.id_token
				if (idToken) {
					try {
						userInfo = await user.auth.ValidateIDToken(idToken)
					} catch {
						userInfo = loginRes.data?.user as UserInfo
					}
				} else {
					userInfo = loginRes.data?.user as UserInfo
				}

				if (!userInfo) {
					setError(isZh ? '无法获取用户信息' : 'Failed to get user info')
					setLoading(false)
					return
				}

				const loginRedirect = getCookie('login_redirect') || '/'
				const logoutRedirect = getCookie('logout_redirect') || '/'

				await AfterLogin(global, {
					user: userInfo,
					entry: loginRedirect,
					logout_redirect: logoutRedirect
				})

				message.success(isZh ? '登录成功！正在跳转...' : 'Login successful! Redirecting...')
				deleteCookie('login_redirect')
				deleteCookie('logout_redirect')
				setTimeout(() => {
					window.location.href = loginRedirect
				}, 500)
			} catch (err) {
				console.error('Token login failed:', err)
				const errorMsg = err instanceof Error ? err.message : (isZh ? '令牌登录失败' : 'Token login failed')
				setError(errorMsg)
				message.error(errorMsg)
			} finally {
				setLoading(false)
			}
		}

		initTokenLogin()
	}, [window.$app?.openapi])

	const renderLoading = () => (
		<div className={styles.loginContainer}>
			<div className={styles.loginCard}>
				<div className={styles.titleSection}>
					<h1 className={styles.appTitle}>{isZh ? '正在验证...' : 'Authenticating...'}</h1>
					<p className={styles.appSubtitle}>
						{isZh ? '请稍候，正在处理您的登录请求' : 'Please wait while we process your login request'}
					</p>
				</div>
				<div className={styles.loadingContainer}>
					<div className={styles.loadingSpinner}></div>
				</div>
			</div>
		</div>
	)

	const renderError = () => (
		<div className={styles.loginContainer}>
			<div className={styles.loginCard}>
				<div className={styles.titleSection}>
					<h1 className={`${styles.appTitle} ${styles.appTitleError}`}>
						{isZh ? '验证失败' : 'Authentication Failed'}
					</h1>
					<p className={`${styles.appSubtitle} ${styles.appSubtitleError}`}>{error}</p>
				</div>
				<div className={styles.authbackActions}>
					<button
						className={`${styles.backButton} ${styles.backButtonError}`}
						onClick={() => history.push('/auth/entry')}
					>
						{isZh ? '返回登录' : 'Back to Login'}
					</button>
				</div>
			</div>
		</div>
	)

	return (
		<AuthLayout
			logo={global.app_info?.logo || getDefaultLogoUrl()}
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			{error ? renderError() : renderLoading()}
		</AuthLayout>
	)
}

export default new window.$app.Handle(AuthToken).by(observer).by(window.$app.memo).get()
