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
import { FormValues } from '@/pages/login/types'
import styles from './index.less'
import { Signin, SigninConfig, SigninProvider } from '@/openapi'

// 浏览器语言检测工具函数
const getBrowserLanguage = (): string => {
	// 获取浏览器首选语言
	const browserLang = navigator.language || navigator.languages?.[0] || 'en'

	return browserLang
}

const ResponsiveLogin = () => {
	const messages = useIntl()
	const global = useGlobal()

	// 使用浏览器语言作为默认语言，fallback到当前locale
	const browserLang = getBrowserLanguage()
	const currentLocale = getLocale() || browserLang

	const [loading, setLoading] = useState(false)
	const [formData, setFormData] = useState({
		mobile: '',
		password: '',
		code: '',
		captcha: '',
		remember_me: false
	})
	const [config, setConfig] = useState<SigninConfig | null>(null)

	// Load configuration using real API
	useAsyncEffect(async () => {
		try {
			if (!window.$app?.openapi) {
				console.error('OpenAPI not initialized')
				return
			}

			const signin = new Signin(window.$app.openapi)
			const configRes = await signin.GetConfig(currentLocale)

			if (!signin.IsError(configRes) && configRes.data) {
				setConfig(configRes.data)
			} else {
				console.error('Failed to load signin config:', configRes.error || 'Unknown error')
				message.error('Failed to load configuration')
			}
		} catch (error) {
			console.error('Failed to load configuration:', error)
			message.error('Failed to load configuration')
		}
	}, [currentLocale, global.app_info])

	// Form validation
	const isFormValid = formData.mobile.trim() !== '' && formData.password.trim() !== ''

	const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({
			...prev,
			[field]: field === 'remember_me' ? e.target.checked : e.target.value
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
			message.warning('Please fill in all required fields')
			return
		}

		setLoading(true)
		try {
			if (!window.$app?.openapi) {
				message.error('API not initialized')
				return
			}

			const signin = new Signin(window.$app.openapi)
			const result = await signin.SigninWithPassword({
				username: formData.mobile,
				password: formData.password,
				remember: formData.remember_me,
				captcha_code: formData.captcha || undefined,
				captcha_id: undefined // TODO: 如果需要验证码ID，需要从验证码组件获取
			})

			if (!signin.IsError(result) && result.data) {
				message.success('Login successful!')
				console.log('Login successful:', result.data)

				// TODO: 处理登录成功后的逻辑，如跳转、存储token等
				// 这里可能需要根据具体业务逻辑调用全局状态更新方法
			} else {
				const errorMsg = result.error?.error_description || 'Login failed'
				message.error(errorMsg)
				console.error('Login error:', result.error)
			}
		} catch (error) {
			message.error('Login failed')
			console.error('Login error:', error)
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

			const signin = new Signin(window.$app.openapi)
			const authUrl = await signin.GetOAuthAuthorizationUrl(
				provider.id,
				undefined, // 使用默认重定向URI
				undefined, // 自动生成state
				undefined // 使用默认scope
			)

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
			{/* Login Container */}
			<div className={styles.loginContainer}>
				<div className={styles.loginCard}>
					{/* Title Section */}
					<div className={styles.titleSection}>
						<h1 className={styles.appTitle}>{config.title || 'Auth'}</h1>
						<p className={styles.appSubtitle}>
							{config.description || 'Please sign in to continue'}
						</p>
					</div>

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

					{/* Login Form */}
					<form className={styles.loginForm} onSubmit={handleSubmit}>
						<AuthInput
							id='mobile'
							placeholder={
								config.form?.username?.placeholder ||
								messages.login.form.username_placeholder
							}
							prefix='person-outline'
							value={formData.mobile}
							onChange={handleInputChange('mobile')}
							autoComplete='username'
							type='email'
						/>

						<AuthInput.Password
							id='password'
							placeholder={
								config.form?.password?.placeholder ||
								messages.login.form.password_placeholder
							}
							prefix='lock-outline'
							value={formData.password}
							onChange={handleInputChange('password')}
							autoComplete='current-password'
						/>

						{/* Captcha Field - Conditional based on config */}
						{config.form?.captcha && (
							<Captcha
								type={config.form.captcha.type === 'turnstile' ? 'cloudflare' : 'image'}
								endpoint='/api/captcha'
								siteKey={config.form.captcha.options?.sitekey || ''}
								value={formData.captcha}
								onChange={handleCaptchaChange}
								onCaptchaVerified={handleCaptchaChange}
							/>
						)}

						<div className={styles.formOptions}>
							{config.form?.remember_me && (
								<label className={styles.rememberCheckbox}>
									<input
										type='checkbox'
										checked={formData.remember_me}
										onChange={handleInputChange('remember_me')}
									/>
									<span>{messages.login.form.remember_me}</span>
								</label>
							)}
							{config.form?.forgot_password_link && (
								<a href='#' className={styles.forgotLink}>
									{messages.login.form.forgot_password}
								</a>
							)}
						</div>

						<AuthButton
							type='primary'
							loading={loading}
							disabled={!isFormValid || loading}
							fullWidth
							onClick={handleSubmit}
						>
							{loading ? messages.login.form.loading : messages.login.form.login_button}
						</AuthButton>

						{/* Register Link */}
						{config.form?.register_link && (
							<div className={styles.registerSection}>
								<span className={styles.noAccount}>
									{messages.login.form.no_account}
								</span>
								<a
									href={config.form.register_link}
									className={styles.registerLink}
									target='_blank'
									rel='noopener noreferrer'
								>
									{messages.login.form.register}
								</a>
							</div>
						)}

						{/* Terms Agreement */}
						{(config.form?.terms_of_service_link || config.form?.privacy_policy_link) && (
							<div className={styles.termsSection}>
								<p className={styles.termsText}>
									{messages.login.terms.agreement}{' '}
									{config.form.terms_of_service_link && (
										<a
											href={config.form.terms_of_service_link}
											className={styles.termsLink}
											target='_blank'
											rel='noopener noreferrer'
										>
											{messages.login.terms.terms}
										</a>
									)}
									{config.form.terms_of_service_link &&
										config.form.privacy_policy_link &&
										' ' + messages.login.terms.and + ' '}
									{config.form.privacy_policy_link && (
										<a
											href={config.form.privacy_policy_link}
											className={styles.termsLink}
											target='_blank'
											rel='noopener noreferrer'
										>
											{messages.login.terms.privacy}
										</a>
									)}
								</p>
							</div>
						)}
					</form>
				</div>
			</div>
		</AuthLayout>
	)
}

export default observer(ResponsiveLogin)
