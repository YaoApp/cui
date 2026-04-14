import React, { useState, useEffect, useRef, useCallback } from 'react'
import { message } from 'antd'
import { getLocale, history } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { SocialLogin } from '../components'
import AuthLayout from '../components/AuthLayout'
import { AuthButton } from '../components'
import { AfterLogin, IsLoggedIn } from '../auth'
import { Icon } from '@/widgets'
import { User } from '@/openapi'
import { getDefaultLogoUrl } from '@/services/wellknown'
import type { EntryConfig, SigninProvider, LoginStatus } from '@/openapi/user/types'
import type { ThirdPartyProvider } from '@/pages/login/types'
import styles from './index.less'

const getBrowserLanguage = (): string => {
	return navigator.language || navigator.languages?.[0] || 'en'
}

const normalizeLocale = (locale: string): string => {
	if (locale.startsWith('zh')) return 'zh-CN'
	if (locale.startsWith('en')) return 'en-US'
	return locale
}

type PageStatus = 'providers' | 'polling' | 'success' | 'error'

const DeviceFlowConnect = () => {
	const global = useGlobal()
	const rawLocale = getLocale() || getBrowserLanguage()
	const currentLocale = normalizeLocale(rawLocale)
	const isZh = currentLocale.startsWith('zh')

	const [status, setStatus] = useState<PageStatus>('providers')
	const [config, setConfig] = useState<EntryConfig | null>(null)
	const [loading, setLoading] = useState(true)
	const [userCode, setUserCode] = useState('')
	const [deviceCode, setDeviceCode] = useState('')
	const [providerId, setProviderId] = useState('')
	const [interval, setInterval_] = useState(5)
	const [expiresAt, setExpiresAt] = useState(0)
	const [remaining, setRemaining] = useState(0)
	const [errorMsg, setErrorMsg] = useState('')

	const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const abortedRef = useRef(false)

	useEffect(() => {
		if (IsLoggedIn()) {
			const entry = global.app_info?.login?.entry?.['admin'] || '/'
			history.push(entry)
			return
		}
		loadConfig()
		return () => stopPolling()
	}, [])

	const loadConfig = async () => {
		try {
			if (!window.$app?.openapi) return
			const user = new User(window.$app.openapi)
			const res = await user.auth.GetEntryConfig(currentLocale)
			if (!user.IsError(res) && res.data) {
				setConfig(res.data)
			}
		} catch (err) {
			console.error('Failed to load entry config:', err)
		} finally {
			setLoading(false)
		}
	}

	const stopPolling = () => {
		abortedRef.current = true
		if (pollingRef.current) {
			clearTimeout(pollingRef.current)
			pollingRef.current = null
		}
		if (countdownRef.current) {
			clearInterval(countdownRef.current)
			countdownRef.current = null
		}
	}

	const startCountdown = (expiresIn: number) => {
		const deadline = Date.now() + expiresIn * 1000
		setExpiresAt(deadline)
		setRemaining(expiresIn)

		if (countdownRef.current) clearInterval(countdownRef.current)
		countdownRef.current = setInterval(() => {
			const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
			setRemaining(left)
			if (left <= 0 && countdownRef.current) {
				clearInterval(countdownRef.current)
				countdownRef.current = null
			}
		}, 1000)
	}

	const pollToken = useCallback(
		async (provider: string, devCode: string, pollInterval: number) => {
			if (abortedRef.current) return
			if (!window.$app?.openapi) return

			const user = new User(window.$app.openapi)
			try {
				const res = await user.auth.DeviceFlowToken(provider, devCode, currentLocale)

				if (abortedRef.current) return

				if (user.IsError(res)) {
					throw new Error((res as any)?.error?.error_description || 'Token polling failed')
				}

				const data = res.data
				if (!data) return

				switch (data.status) {
					case 'pending':
						pollingRef.current = setTimeout(
							() => pollToken(provider, devCode, pollInterval),
							pollInterval * 1000
						)
						break

					case 'slow_down':
						pollInterval += 5
						setInterval_(pollInterval)
						pollingRef.current = setTimeout(
							() => pollToken(provider, devCode, pollInterval),
							pollInterval * 1000
						)
						break

					case 'success':
						stopPolling()
						await handleLoginSuccess(data.id_token || '', user)
						break

					case 'expired':
						stopPolling()
						setErrorMsg(isZh ? '授权已超时，请重试' : 'Authorization timed out, please try again')
						setStatus('error')
						break

					case 'denied':
						stopPolling()
						setErrorMsg(isZh ? '授权被拒绝' : 'Authorization was denied')
						setStatus('error')
						break

					default:
						stopPolling()
						setErrorMsg(isZh ? '未知状态' : 'Unknown status')
						setStatus('error')
				}
			} catch (err: any) {
				if (abortedRef.current) return
				stopPolling()
				setErrorMsg(err?.message || (isZh ? '轮询失败' : 'Polling failed'))
				setStatus('error')
			}
		},
		[currentLocale, isZh]
	)

	const handleLoginSuccess = async (idToken: string, userClient: InstanceType<typeof User>) => {
		try {
			const userInfo = await userClient.auth.ValidateIDToken(idToken)
			const entry = await AfterLogin(global, { user: userInfo })
			setStatus('success')
			setTimeout(() => {
				window.location.href = entry || '/'
			}, 500)
		} catch (err: any) {
			setErrorMsg(err?.message || (isZh ? '登录处理失败' : 'Login processing failed'))
			setStatus('error')
		}
	}

	const handleProviderClick = async (provider: ThirdPartyProvider) => {
		if (!window.$app?.openapi) {
			message.error(isZh ? 'API 未初始化' : 'API not initialized')
			return
		}

		const user = new User(window.$app.openapi)
		try {
			const res = await user.auth.DeviceFlowAuthorize(provider.id)
			if (user.IsError(res)) {
				const desc = (res as any)?.error?.error_description
				throw new Error(desc || (isZh ? '设备授权请求失败' : 'Device authorization request failed'))
			}

			const data = res.data
			if (!data?.device_code || !data?.user_code) {
				throw new Error(isZh ? '返回数据不完整' : 'Incomplete response from server')
			}

			setProviderId(provider.id)
			setDeviceCode(data.device_code)
			setUserCode(data.user_code)
			setInterval_(data.interval || 5)
			setStatus('polling')

			startCountdown(data.expires_in || 900)

			const verifyUrl = data.verification_uri_complete || data.verification_uri
			if (verifyUrl) {
				window.open(verifyUrl, '_blank')
			}

			abortedRef.current = false
			pollingRef.current = setTimeout(
				() => pollToken(provider.id, data.device_code, data.interval || 5),
				(data.interval || 5) * 1000
			)
		} catch (err: any) {
			message.error(err?.message || (isZh ? '请求失败' : 'Request failed'))
		}
	}

	const handleRetry = () => {
		stopPolling()
		abortedRef.current = false
		setStatus('providers')
		setUserCode('')
		setDeviceCode('')
		setProviderId('')
		setErrorMsg('')
	}

	const formatRemaining = (seconds: number): string => {
		const m = Math.floor(seconds / 60)
		const s = seconds % 60
		return `${m}:${s.toString().padStart(2, '0')}`
	}

	// Filter providers: only show those with device_authorization support
	// EntryConfig providers come from the server; the server includes all providers.
	// We show all of them on the Device Flow page since the backend will reject
	// providers without device_authorization configured.
	const providers = config?.third_party?.providers || []

	const renderProviders = () => (
		<>
			<div className={styles.titleSection}>
				<h1 className={styles.appTitle}>
					{isZh ? '登录' : 'Sign In'}
				</h1>
				<p className={styles.appSubtitle}>
					{isZh
						? '选择登录方式以继续'
						: 'Choose a sign-in method to continue'}
				</p>
			</div>

			{providers.length > 0 && (
				<div className={styles.socialSection}>
					<SocialLogin
						providers={providers as ThirdPartyProvider[]}
						onProviderClick={handleProviderClick}
						loading={false}
					/>
				</div>
			)}

			{providers.length === 0 && !loading && (
				<div className={styles.helpSection}>
					<p className={styles.helpText}>
						{isZh
							? '暂无可用的登录方式'
							: 'No sign-in methods available'}
					</p>
				</div>
			)}
		</>
	)

	const renderPolling = () => (
		<>
			<div className={styles.titleSection}>
				<h1 className={styles.appTitle}>
					{isZh ? '完成授权' : 'Complete Authorization'}
				</h1>
				<p className={styles.appSubtitle}>
					{isZh
						? '请在浏览器中确认授权'
						: 'Please confirm authorization in your browser'}
				</p>
			</div>

			<div className={styles.pollingSection}>
				<p className={styles.userCodeLabel}>
					{isZh ? '验证码' : 'Verification Code'}
				</p>
				<p className={styles.userCode}>{userCode}</p>

				<div className={styles.pollingStatus}>
					<span className={styles.pollingDot}></span>
					<span>{isZh ? '等待授权中...' : 'Waiting for authorization...'}</span>
				</div>

				{remaining > 0 && (
					<p className={styles.countdown}>
						{isZh ? `${formatRemaining(remaining)} 后过期` : `Expires in ${formatRemaining(remaining)}`}
					</p>
				)}
			</div>

			<div className={styles.retrySection}>
				<AuthButton type='default' fullWidth onClick={handleRetry}>
					{isZh ? '取消' : 'Cancel'}
				</AuthButton>
			</div>
		</>
	)

	const renderSuccess = () => (
		<>
			<div className={styles.titleSection}>
				<div className={styles.statusIcon}>
					<Icon name='check_circle-outline' size={48} />
				</div>
				<h1 className={styles.appTitle}>{isZh ? '登录成功' : 'Sign In Successful'}</h1>
				<p className={styles.appSubtitle}>
					{isZh ? '正在跳转...' : 'Redirecting...'}
				</p>
			</div>
		</>
	)

	const renderError = () => (
		<>
			<div className={styles.titleSection}>
				<div className={`${styles.statusIcon} ${styles.statusError}`}>
					<Icon name='error-outline' size={48} />
				</div>
				<h1 className={styles.appTitle}>{isZh ? '登录失败' : 'Sign In Failed'}</h1>
				<p className={styles.appSubtitle}>{errorMsg}</p>
			</div>

			<div className={styles.retrySection}>
				<AuthButton type='primary' fullWidth onClick={handleRetry}>
					{isZh ? '重试' : 'Try Again'}
				</AuthButton>
			</div>
		</>
	)

	if (loading) {
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
			<div className={styles.container}>
				<div className={styles.connectContainer}>
					<div className={styles.connectCard}>
						{status === 'providers' && renderProviders()}
						{status === 'polling' && renderPolling()}
						{status === 'success' && renderSuccess()}
						{status === 'error' && renderError()}
					</div>
				</div>
			</div>
		</AuthLayout>
	)
}

export default new window.$app.Handle(DeviceFlowConnect).by(observer).by(window.$app.memo).get()
