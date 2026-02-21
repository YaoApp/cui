import React, { useState, useEffect } from 'react'
import { message } from 'antd'
import { getLocale, history } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import AuthLayout from '../auth/components/AuthLayout'
import styles from '../auth/back/index.less'
import { User } from '@/openapi'
import type { UserInfo } from '@/openapi/user/types'
import { AfterLogin } from '../auth/auth'
import { getDefaultLogoUrl } from '@/services/wellknown'

const getBrowserLanguage = (): string => {
	return navigator.language || navigator.languages?.[0] || 'en'
}

const normalizeLocale = (locale: string): string => {
	if (locale.startsWith('zh')) return 'zh-CN'
	if (locale.startsWith('en')) return 'en-US'
	return locale
}

/**
 * Resolve redirect path (consistent with navigate action route types):
 * - $dashboard/xxx → /xxx (CUI Dashboard page, use React Router)
 * - /xxx           → direct navigation (SUI page or other, full page redirect)
 * - http(s)://     → external URL (full page redirect)
 */
const resolveRedirect = (redirect: string): { url: string; usePush: boolean } => {
	if (redirect.startsWith('$dashboard/')) {
		return { url: redirect.replace('$dashboard', ''), usePush: true }
	}
	return { url: redirect, usePush: false }
}

const OTPVerify = () => {
	const global = useGlobal()
	const rawLocale = getLocale() || getBrowserLanguage()
	const currentLocale = normalizeLocale(rawLocale)

	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string>('')

	useEffect(() => {
		const verify = async () => {
			if (!window.$app?.openapi) return

			const user = new User(window.$app.openapi)
			try {
				setLoading(true)

				// Extract code from URL path: /v/<code>
				const pathSegments = window.location.pathname.split('/')
				const vIndex = pathSegments.findIndex((s) => s === 'v')
				const code = vIndex !== -1 ? pathSegments[vIndex + 1] : ''

				if (!code) {
					setError(currentLocale.startsWith('zh') ? '缺少验证码' : 'Missing verification code')
					setLoading(false)
					return
				}

				// Call OTP login endpoint (smart: detects existing session)
				const res = await user.auth.OTPLogin(code, currentLocale)
				if (user.IsError(res)) {
					const errorMsg =
						res.error?.error_description ||
						(currentLocale.startsWith('zh') ? '验证失败' : 'Verification failed')
					setError(errorMsg)
					setLoading(false)
					return
				}

				const rawRedirect = res.data?.redirect || '/auth/helloworld'
				const status = res.data?.status
				const { url: redirect, usePush } = resolveRedirect(rawRedirect)

				if (status === 'already_logged_in') {
					if (usePush) {
						history.push(redirect)
					} else {
						window.location.href = redirect
					}
					return
				}

				// New session: fetch profile and run AfterLogin
				const profileRes = await user.profile.GetProfile({ team: true, member: true, type: true })
				if (!user.IsError(profileRes) && profileRes.data) {
					const profile = profileRes.data
					const userInfo = {
						user_id: (profile as any)['yao:user_id'] || profile.sub || '',
						name: profile.name,
						picture: profile.picture,
						email: profile.email,
						...profile
					} as UserInfo
					await AfterLogin(global, { user: userInfo, entry: redirect })
				}

				message.success(
					currentLocale.startsWith('zh')
						? '登录成功！正在跳转...'
						: 'Login successful! Redirecting...'
				)

				setTimeout(() => {
					if (usePush) {
						history.push(redirect)
					} else {
						window.location.href = redirect
					}
				}, 500)
			} catch (err) {
				console.error('OTP verification failed:', err)
				const errorMsg =
					err instanceof Error
						? err.message
						: currentLocale.startsWith('zh')
							? '验证失败'
							: 'Verification failed'
				setError(errorMsg)
			} finally {
				setLoading(false)
			}
		}

		verify()
	}, [window.$app?.openapi])

	const renderLoading = () => (
		<div className={styles.loginContainer}>
			<div className={styles.loginCard}>
				<div className={styles.titleSection}>
					<h1 className={styles.appTitle}>
						{currentLocale.startsWith('zh') ? '正在验证...' : 'Verifying...'}
					</h1>
					<p className={styles.appSubtitle}>
						{currentLocale.startsWith('zh')
							? '请稍候，正在处理您的登录请求'
							: 'Please wait while we verify your login'}
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
						{currentLocale.startsWith('zh') ? '验证失败' : 'Verification Failed'}
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
			logo={global.app_info?.logo || getDefaultLogoUrl()}
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			{error ? renderError() : renderLoading()}
		</AuthLayout>
	)
}

export default new window.$app.Handle(OTPVerify).by(observer).by(window.$app.memo).get()
