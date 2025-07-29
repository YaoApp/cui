import React, { useState } from 'react'
import { message } from 'antd'
import { getLocale } from '@umijs/max'
import { useAsyncEffect } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { useIntl } from '@/hooks'
import { loginMockService } from '@/services/loginMock'
import { SocialLogin, Settings, AuthInput, AuthButton } from '../components'
import AuthLayout from '../components/AuthLayout'
import Captcha from '../components/Captcha'
import { FormValues, LoginConfig, ThirdPartyProvider } from '@/pages/login/types'
import styles from './index.less'

const ResponsiveLogin = () => {
	const messages = useIntl()
	const global = useGlobal()
	const locale = getLocale()

	const [loading, setLoading] = useState(false)
	const [formData, setFormData] = useState({
		mobile: '',
		password: '',
		code: '',
		captcha: '',
		remember_me: false
	})
	const [config, setConfig] = useState<LoginConfig | null>(null)
	const [providers, setProviders] = useState<ThirdPartyProvider[]>([])

	// Load configuration
	useAsyncEffect(async () => {
		try {
			const [configRes, providersRes] = await Promise.all([
				loginMockService.getLoginConfig(),
				loginMockService.getThirdPartyProviders()
			])

			if (configRes.success && configRes.data) {
				setConfig(configRes.data)
			}

			if (providersRes.success && providersRes.data) {
				setProviders(providersRes.data)
			}
		} catch (error) {
			console.error('Failed to load configuration:', error)
		}
	}, [])

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
			const result = await loginMockService.login({
				mobile: formData.mobile,
				password: formData.password,
				code: formData.code,
				locale: locale
			})

			if (result.success) {
				message.success('Login successful!')
				console.log('Login successful:', result.data)
			} else {
				message.error(result.message || 'Login failed')
			}
		} catch (error) {
			message.error('Login failed')
			console.error('Login error:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleThirdPartyClick = async (provider: ThirdPartyProvider) => {
		try {
			const response = await loginMockService.handleThirdPartyAuth(provider.id)
			if (response.success && response.data?.url) {
				window.location.href = response.data.url
			} else {
				message.error(`Failed to authenticate with ${provider.name}`)
			}
		} catch (error) {
			message.error(`Error connecting to ${provider.name}`)
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
			logo={config.page?.logo || '/api/__yao/app/icons/app.png'}
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			{/* Login Container */}
			<div className={styles.loginContainer}>
				<div className={styles.loginCard}>
					{/* Title Section */}
					<div className={styles.titleSection}>
						<h1 className={styles.appTitle}>{config.page?.title || 'Auth'}</h1>
						<p className={styles.appSubtitle}>
							{config.page?.subtitle || 'Please sign in to continue'}
						</p>
					</div>

					{/* Third Party Login */}
					{providers.length > 0 && (
						<div className={styles.socialSection}>
							<SocialLogin
								providers={providers}
								onProviderClick={handleThirdPartyClick}
								loading={loading}
							/>
						</div>
					)}

					{/* Login Form */}
					<form className={styles.loginForm} onSubmit={handleSubmit}>
						<AuthInput
							id='mobile'
							placeholder={messages.login.form.username_placeholder}
							prefix='person-outline'
							value={formData.mobile}
							onChange={handleInputChange('mobile')}
							autoComplete='username'
							type='email'
						/>

						<AuthInput.Password
							id='password'
							placeholder={messages.login.form.password_placeholder}
							prefix='lock-outline'
							value={formData.password}
							onChange={handleInputChange('password')}
							autoComplete='current-password'
						/>

						{/* Captcha Field - Conditional based on config */}
						{config.captcha.enabled && (
							<Captcha
								type={config.captcha.type}
								endpoint={config.captcha.endpoint}
								siteKey={config.captcha.siteKey}
								value={formData.captcha}
								onChange={handleCaptchaChange}
								onCaptchaVerified={handleCaptchaChange}
							/>
						)}

						<div className={styles.formOptions}>
							<label className={styles.rememberCheckbox}>
								<input
									type='checkbox'
									checked={formData.remember_me}
									onChange={handleInputChange('remember_me')}
								/>
								<span>{messages.login.form.remember_me}</span>
							</label>
							<a href='#' className={styles.forgotLink}>
								{messages.login.form.forgot_password}
							</a>
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
						<div className={styles.registerSection}>
							<span className={styles.noAccount}>{messages.login.form.no_account}</span>
							<a href='#' className={styles.registerLink}>
								{messages.login.form.register}
							</a>
						</div>

						{/* Terms Agreement */}
						<div className={styles.termsSection}>
							<p className={styles.termsText}>
								{messages.login.terms.agreement}{' '}
								<a
									href='#'
									className={styles.termsLink}
									target='_blank'
									rel='noopener noreferrer'
								>
									{messages.login.terms.terms}
								</a>{' '}
								{messages.login.terms.and}{' '}
								<a
									href='#'
									className={styles.termsLink}
									target='_blank'
									rel='noopener noreferrer'
								>
									{messages.login.terms.privacy}
								</a>
							</p>
						</div>
					</form>
				</div>
			</div>
		</AuthLayout>
	)
}

export default observer(ResponsiveLogin)
