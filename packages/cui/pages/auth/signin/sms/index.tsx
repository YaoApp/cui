import React, { useState, useEffect } from 'react'
import { message } from 'antd'
import { getLocale } from '@umijs/max'
import { useAsyncEffect } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { useIntl } from '@/hooks'
import { loginMockService } from '@/services/loginMock'
import { AuthInput, AuthButton, CountryCodeSelect, CaptchaModal, InputGroup } from '../../components'
import AuthLayout from '../../components/AuthLayout'
import { FormValues, LoginConfig } from '@/pages/login/types'
import styles from '../index.less' // 复用登录页面的样式

interface SmsFormData {
	countryCode: string
	mobile: string
	smsCode: string
}

const SmsLogin = () => {
	const messages = useIntl()
	const global = useGlobal()
	const locale = getLocale()

	const [loading, setLoading] = useState(false)
	const [smsLoading, setSmsLoading] = useState(false)
	const [countdown, setCountdown] = useState(0)
	const [showCaptchaModal, setShowCaptchaModal] = useState(false)
	const [formData, setFormData] = useState<SmsFormData>({
		countryCode: '+86',
		mobile: '',
		smsCode: ''
	})
	const [config, setConfig] = useState<LoginConfig | null>(null)

	// Load configuration
	useAsyncEffect(async () => {
		try {
			const configRes = await loginMockService.getLoginConfig()
			if (configRes.success && configRes.data) {
				setConfig(configRes.data)
			}
		} catch (error) {
			console.error('Failed to load configuration:', error)
		}
	}, [])

	// 倒计时效果
	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
			return () => clearTimeout(timer)
		}
	}, [countdown])

	// Form validation
	const isFormValid = formData.mobile.trim() !== '' && formData.smsCode.trim() !== ''
	const isMobileValid =
		formData.countryCode === '+86' ? /^1[3-9]\d{9}$/.test(formData.mobile) : formData.mobile.trim().length >= 6 // 其他国家号码简单验证

	const handleInputChange = (field: keyof SmsFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({
			...prev,
			[field]: e.target.value
		}))
	}

	const handleCountryCodeChange = (countryCode: string) => {
		setFormData((prev) => ({
			...prev,
			countryCode
		}))
	}

	// 点击获取验证码 - 先显示验证码模态框
	const handleSendSmsClick = () => {
		if (!isMobileValid) {
			message.warning('请输入正确的手机号码')
			return
		}

		// 如果启用了验证码，显示模态框；否则直接发送
		if (config?.captcha.enabled) {
			setShowCaptchaModal(true)
		} else {
			handleSendSms('')
		}
	}

	// 实际发送短信验证码
	const handleSendSms = async (captchaValue: string) => {
		setSmsLoading(true)
		try {
			// 发送短信API
			const result = await loginMockService.sendSmsCode({
				mobile: `${formData.countryCode}${formData.mobile}`,
				captcha: captchaValue
			})

			if (result.success) {
				message.success('验证码已发送')
				setCountdown(60) // 60秒倒计时
				setShowCaptchaModal(false) // 关闭模态框
			} else {
				message.error(result.message || '发送失败')
			}
		} catch (error) {
			message.error('发送验证码失败')
			console.error('Send SMS error:', error)
		} finally {
			setSmsLoading(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!isFormValid) {
			message.warning('请填写完整信息')
			return
		}

		setLoading(true)
		try {
			const result = await loginMockService.smsLogin({
				mobile: `${formData.countryCode}${formData.mobile}`,
				smsCode: formData.smsCode,
				locale: locale
			})

			if (result.success) {
				message.success('登录成功!')
				console.log('SMS login successful:', result.data)
			} else {
				message.error(result.message || '登录失败')
			}
		} catch (error) {
			message.error('登录失败')
			console.error('SMS login error:', error)
		} finally {
			setLoading(false)
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
			{/* SMS Login Container */}
			<div className={styles.loginContainer}>
				<div className={styles.loginCard}>
					{/* Title Section */}
					<div className={styles.titleSection}>
						<h1 className={styles.appTitle}>短信验证登录</h1>
						<p className={styles.appSubtitle}>请输入手机号码获取验证码</p>
					</div>

					{/* SMS Login Form */}
					<form className={styles.loginForm} onSubmit={handleSubmit}>
						{/* 手机号输入 - 带国家代码选择 */}
						<InputGroup>
							<CountryCodeSelect
								value={formData.countryCode}
								onChange={handleCountryCodeChange}
							/>
							<AuthInput
								id='mobile'
								placeholder='请输入手机号码'
								prefix='call-outline'
								value={formData.mobile}
								onChange={handleInputChange('mobile')}
								autoComplete='tel'
								type='tel'
							/>
						</InputGroup>

						{/* 短信验证码输入 */}
						<InputGroup>
							<AuthInput
								id='smsCode'
								placeholder='请输入短信验证码'
								prefix='chatbox-outline'
								value={formData.smsCode}
								onChange={handleInputChange('smsCode')}
								autoComplete='one-time-code'
								type='text'
							/>
							<AuthButton
								type='default'
								loading={smsLoading}
								disabled={!isMobileValid || countdown > 0 || smsLoading}
								onClick={handleSendSmsClick}
							>
								{countdown > 0 ? `${countdown}s` : '获取验证码'}
							</AuthButton>
						</InputGroup>

						<AuthButton
							type='primary'
							loading={loading}
							disabled={!isFormValid || loading}
							fullWidth
							onClick={handleSubmit}
						>
							{loading ? '登录中...' : '登录'}
						</AuthButton>

						{/* 返回登录链接 */}
						<div className={styles.registerSection}>
							<span className={styles.noAccount}>已有密码？</span>
							<a href='/auth/login' className={styles.registerLink}>
								密码登录
							</a>
						</div>

						{/* Terms Agreement - 与登录页面保持一致 */}
						<div className={styles.termsSection}>
							<p className={styles.termsText}>
								登录即表示同意{' '}
								<a
									href='#'
									className={styles.termsLink}
									target='_blank'
									rel='noopener noreferrer'
								>
									服务条款
								</a>{' '}
								和{' '}
								<a
									href='#'
									className={styles.termsLink}
									target='_blank'
									rel='noopener noreferrer'
								>
									隐私政策
								</a>
							</p>
						</div>
					</form>
				</div>
			</div>

			{/* 验证码模态框 */}
			<CaptchaModal
				visible={showCaptchaModal}
				onClose={() => setShowCaptchaModal(false)}
				onConfirm={handleSendSms}
				captchaConfig={config.captcha}
				loading={smsLoading}
			/>
		</AuthLayout>
	)
}

export default observer(SmsLogin)
