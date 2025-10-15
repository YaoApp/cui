import React, { useState } from 'react'
import { message } from 'antd'
import { getLocale } from '@umijs/max'
import { useAsyncEffect } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { useIntl } from '@/hooks'
import { SocialLogin, Settings, AuthInput, AuthButton } from '../components'
import AuthLayout from '../components/AuthLayout'
import Captcha from '../components/Captcha'
import styles from './index.less'
import { User } from '@/openapi/user'
import { EntryConfig, SigninProvider } from '@/openapi/user/types'

// Note: This is the unified auth entry point
// Backend will determine if user is logging in or registering based on email existence

// Cookie 工具函数
const setCookie = (name: string, value: string, days: number = 7) => {
	const expires = new Date()
	expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
	document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
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
	const [formData, setFormData] = useState({
		email: '',
		captcha: ''
	})
	const [config, setConfig] = useState<EntryConfig | null>(null)
	const [captchaData, setCaptchaData] = useState<{
		id: string
		image: string
	} | null>(null)
	const [captchaLoading, setCaptchaLoading] = useState(false)

	// 处理 redirect 参数 - 设置注册后的跳转地址
	useAsyncEffect(async () => {
		const redirectParam = getUrlParam('redirect')
		if (redirectParam && redirectParam.trim() !== '') {
			// 如果 URL 有 redirect 参数，使用它
			setCookie('register_redirect', redirectParam)
		} else {
			// 如果没有 redirect 参数，等待 config 加载后使用 success_url 作为默认值
			if (config?.success_url) {
				setCookie('register_redirect', config.success_url)
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

	// Load captcha when needed (only for image type)
	useAsyncEffect(async () => {
		if (config?.form?.captcha && config.form.captcha.type === 'image' && !captchaData) {
			await loadCaptcha()
		}
	}, [config?.form?.captcha?.type, captchaData])

	// Form validation
	const isFormValid = formData.email.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)

	const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({
			...prev,
			[field]: e.target.value
		}))
	}

	const handleCaptchaChange = (value: string) => {
		setFormData((prev) => ({
			...prev,
			captcha: value
		}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!isFormValid) {
			message.warning('Please enter a valid email address')
			return
		}

		setLoading(true)
		try {
			if (!window.$app?.openapi) {
				message.error('API not initialized')
				return
			}

			const user = new User(window.$app.openapi)
			const result = await user.auth.Entry({
				email: formData.email,
				captcha_code: formData.captcha || undefined,
				captcha_id: captchaData?.id || undefined,
				locale: currentLocale
			})

			if (!user.IsError(result) && result.data) {
				message.success(result.data.message || 'Success! Please check your email.')
				console.log('Entry successful:', result.data)

				// 如果需要邮箱验证，显示提示信息
				if (result.data.verification_required) {
					message.info('A verification email has been sent to your inbox.')
				}

				// 根据返回的 next_step 或 success_url 进行跳转
				if (result.data.next_step) {
					window.location.href = result.data.next_step
				} else if (config?.success_url) {
					setTimeout(() => {
						window.location.href = config.success_url
					}, 2000)
				}
			} else {
				const errorMsg = result.error?.error_description || 'Failed to continue'
				message.error(errorMsg)
				console.error('Entry error:', result.error)

				// 刷新验证码
				if (config?.form?.captcha && config.form.captcha.type === 'image') {
					await loadCaptcha(true)
				}
			}
		} catch (error) {
			message.error('Failed to continue')
			console.error('Entry error:', error)
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
			logo={global.app_info?.logo || '/api/__yao/app/icons/app.png'}
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
					<form className={styles.entryForm} onSubmit={handleSubmit}>
						<AuthInput
							id='email'
							placeholder={
								config.form?.username?.placeholder ||
								messages.entry?.form?.email_placeholder ||
								'Enter your email address'
							}
							prefix='mail-outline'
							value={formData.email}
							onChange={handleInputChange('email')}
							autoComplete='email'
							type='email'
						/>

						{/* Captcha Field - Conditional based on config */}
						{config.form?.captcha && (
							<Captcha
								type={config.form.captcha.type === 'turnstile' ? 'cloudflare' : 'image'}
								endpoint={captchaData?.image || ''}
								siteKey={config.form.captcha.options?.sitekey || ''}
								value={formData.captcha}
								onChange={handleCaptchaChange}
								onCaptchaVerified={handleCaptchaChange}
								onRefresh={() => loadCaptcha(true)}
							/>
						)}

						<AuthButton
							type='primary'
							loading={loading}
							disabled={!isFormValid || loading}
							fullWidth
							onClick={handleSubmit}
						>
							{loading
								? messages.entry?.form?.loading || 'Processing...'
								: messages.entry?.form?.continue_button || 'Continue'}
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
