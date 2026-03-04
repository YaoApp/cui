import React, { useState, useEffect, useRef } from 'react'
import { message } from 'antd'
import { getLocale } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { AuthInput, AuthButton } from '../components'
import AuthLayout from '../components/AuthLayout'
import { Icon } from '@/widgets'
import { User } from '@/openapi'
import { getDefaultLogoUrl } from '@/services/wellknown'
import styles from './index.less'

const getBrowserLanguage = (): string => {
	const browserLang = navigator.language || navigator.languages?.[0] || 'en'
	return browserLang
}

const normalizeLocale = (locale: string): string => {
	if (locale.startsWith('zh')) return 'zh-CN'
	if (locale.startsWith('en')) return 'en-US'
	return locale
}

type DevicePageStatus = 'input' | 'submitting' | 'success' | 'error'

const DeviceAuthorize = () => {
	const global = useGlobal()

	const rawLocale = getLocale() || getBrowserLanguage()
	const currentLocale = normalizeLocale(rawLocale)
	const isZh = currentLocale.startsWith('zh')

	const [userCode, setUserCode] = useState('')
	const [status, setStatus] = useState<DevicePageStatus>('input')
	const [loading, setLoading] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const code = params.get('user_code') || ''
		if (code) setUserCode(code.toUpperCase())
	}, [])

	const formatCode = (raw: string): string => {
		const clean = raw.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8)
		if (clean.length > 4) return clean.slice(0, 4) + '-' + clean.slice(4)
		return clean
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUserCode(formatCode(e.target.value))
	}

	const isFormValid = userCode.replace(/-/g, '').length === 8

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault()

		if (!isFormValid) {
			message.warning(isZh ? '请输入完整的设备码' : 'Please enter a complete device code')
			return
		}

		setLoading(true)
		setStatus('submitting')

		try {
			if (!window.$app?.openapi) {
				message.error(isZh ? 'API 未初始化' : 'API not initialized')
				setStatus('error')
				return
			}

			const user = new User(window.$app.openapi)
			const result = await user.auth.AuthorizeDevice(userCode)
			if (user.IsError(result)) {
				const desc = (result as any)?.error?.error_description
				throw new Error(desc || (isZh ? '授权失败' : 'Authorization failed'))
			}

			setStatus('success')
		} catch (error: any) {
			setStatus('error')
			message.error(error?.message || (isZh ? '授权失败，请重试' : 'Authorization failed, please try again'))
		} finally {
			setLoading(false)
		}
	}

	const handleRetry = () => {
		setUserCode('')
		setStatus('input')
		setTimeout(() => inputRef.current?.focus(), 100)
	}

	const renderInput = () => (
		<>
			<div className={styles.titleSection}>
				<h1 className={styles.appTitle}>{isZh ? '设备授权' : 'Device Authorization'}</h1>
				<p className={styles.appSubtitle}>
					{isZh
						? '请输入终端上显示的设备码以完成登录'
						: 'Enter the code displayed on your device to sign in'}
				</p>
			</div>

			<form className={styles.deviceForm} onSubmit={handleSubmit}>
				<AuthInput
					ref={inputRef}
					id='user-code'
					placeholder={isZh ? '例如 XKFM-9R2N' : 'e.g. XKFM-9R2N'}
					prefix='devices-outline'
					value={userCode}
					onChange={handleInputChange}
					autoComplete='off'
					type='text'
				/>

				<AuthButton
					type='primary'
					loading={loading}
					disabled={!isFormValid || loading}
					fullWidth
					onClick={handleSubmit}
				>
					{loading ? (isZh ? '授权中...' : 'Authorizing...') : isZh ? '授权设备' : 'Authorize Device'}
				</AuthButton>
			</form>

			<div className={styles.helpSection}>
				<p className={styles.helpText}>
					{isZh
						? '在您的终端运行 yao login 后会看到此设备码'
						: 'You will see this code after running yao login in your terminal'}
				</p>
			</div>
		</>
	)

	const renderSuccess = () => (
		<>
			<div className={styles.titleSection}>
				<div className={styles.statusIcon}>
					<Icon name='check_circle-outline' size={48} />
				</div>
				<h1 className={styles.appTitle}>{isZh ? '授权成功' : 'Device Authorized'}</h1>
				<p className={styles.appSubtitle}>
					{isZh ? '您现在可以返回终端继续操作' : 'You can now return to your terminal'}
				</p>
			</div>
			<div className={styles.helpSection}>
				<p className={styles.helpText}>
					{isZh ? '此页面可以安全关闭' : 'You may safely close this page'}
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
				<h1 className={styles.appTitle}>{isZh ? '授权失败' : 'Authorization Failed'}</h1>
				<p className={styles.appSubtitle}>
					{isZh ? '设备码无效或已过期，请重新尝试' : 'The device code is invalid or expired, please try again'}
				</p>
			</div>

			<div className={styles.deviceForm}>
				<AuthButton type='primary' fullWidth onClick={handleRetry}>
					{isZh ? '重新输入' : 'Try Again'}
				</AuthButton>
			</div>
		</>
	)

	return (
		<AuthLayout
			logo={global.app_info?.logo || getDefaultLogoUrl()}
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			<div className={styles.container}>
				<div className={styles.deviceContainer}>
					<div className={styles.deviceCard}>
						{status === 'input' || status === 'submitting' ? renderInput() : null}
						{status === 'success' ? renderSuccess() : null}
						{status === 'error' ? renderError() : null}
					</div>
				</div>
			</div>
		</AuthLayout>
	)
}

export default new window.$app.Handle(DeviceAuthorize).by(observer).by(window.$app.memo).get()
