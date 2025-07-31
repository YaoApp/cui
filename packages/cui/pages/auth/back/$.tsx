import React, { useState, useEffect } from 'react'
import { message } from 'antd'
import { getLocale } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { useIntl } from '@/hooks'
import AuthLayout from '../components/AuthLayout'
import styles from './index.less'

// OAuth回调参数接口
interface OAuthCallbackParams {
	code?: string
	state?: string
	error?: string
	error_description?: string
	provider?: string
	[key: string]: any
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
	const messages = useIntl()
	const global = useGlobal()

	// 语言设置
	const browserLang = getBrowserLanguage()
	const rawLocale = getLocale() || browserLang
	const currentLocale = normalizeLocale(rawLocale)

	const [loading, setLoading] = useState(true)
	const [oauthParams, setOauthParams] = useState<OAuthCallbackParams>({})
	const [error, setError] = useState<string>('')

	// 解析URL参数
	const parseURLParams = (): OAuthCallbackParams => {
		const params: OAuthCallbackParams = {}
		const urlParams = new URLSearchParams(window.location.search)

		// 常见的OAuth参数
		const oauthParamKeys = ['code', 'state', 'error', 'error_description', 'provider']

		// 解析所有URL参数
		urlParams.forEach((value, key) => {
			params[key] = value
		})

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
				if (!params.code) {
					const errorMsg = 'Missing authorization code'
					setError(errorMsg)
					message.error(errorMsg)
					setLoading(false)
					return
				}

				console.log('OAuth callback initialized successfully:', params)

				// 这里后续会调用AuthBack API
				// TODO: 调用 AuthBack API 获取 JWT
			} catch (error) {
				console.error('Failed to initialize auth back:', error)
				const errorMsg = 'Failed to process OAuth callback'
				setError(errorMsg)
				message.error(errorMsg)
			} finally {
				setLoading(false)
			}
		}

		initAuthBack()
	}, [])

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

	// 渲染错误状态
	const renderError = () => (
		<div className={styles.loginContainer}>
			<div className={styles.loginCard}>
				<div className={styles.titleSection}>
					<h1 className={`${styles.appTitle} ${styles.appTitleError}`}>
						{currentLocale.startsWith('zh') ? '验证失败' : 'Authentication Failed'}
					</h1>
					<p className={styles.appSubtitle}>{error}</p>
				</div>

				<div className={styles.authbackActions}>
					<button className={styles.backButton} onClick={() => window.history.back()}>
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
			{error ? renderError() : renderLoading()}
		</AuthLayout>
	)
}

export default new window.$app.Handle(AuthBack).by(observer).by(window.$app.memo).get()
