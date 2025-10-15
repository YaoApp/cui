import React, { useState, useEffect, useRef } from 'react'
import { useIntl } from '@/hooks'
import { Icon } from '@/widgets'
import AuthInput from '../Input'
import styles from './index.less'

// Declare Cloudflare Turnstile types
declare global {
	interface Window {
		turnstile?: {
			render: (
				container: string | HTMLElement,
				options: {
					sitekey: string
					callback?: (token: string) => void
					'error-callback'?: () => void
					'expired-callback'?: () => void
					theme?: 'light' | 'dark' | 'auto'
					size?: 'normal' | 'compact'
				}
			) => string
			remove: (widgetId: string) => void
			reset: (widgetId?: string) => void
		}
	}
}

interface CaptchaConfig {
	type: 'image' | 'turnstile'
	options?: {
		sitekey?: string
		[key: string]: any
	}
}

interface CaptchaProps {
	config: CaptchaConfig
	value: string
	onChange: (value: string) => void
	onCaptchaVerified?: (token: string) => void
	// 以下 props 用于图片验证码
	captchaImage?: string
	onRefresh?: () => void | Promise<void>
}

const Captcha: React.FC<CaptchaProps> = ({ config, value, onChange, onCaptchaVerified, captchaImage, onRefresh }) => {
	// 根据配置自动判断验证码类型
	const type = config.type === 'turnstile' ? 'cloudflare' : config.type
	const siteKey = config.options?.sitekey || ''
	const messages = useIntl()
	const [loading, setLoading] = useState(false)
	const [focused, setFocused] = useState(false)
	const [turnstileLoaded, setTurnstileLoaded] = useState(false)
	const turnstileRef = useRef<HTMLDivElement>(null)
	const widgetIdRef = useRef<string>('')
	const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
	const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	const handleFocus = () => setFocused(true)
	const handleBlur = () => setFocused(false)

	// Load Cloudflare Turnstile script
	const loadTurnstileScript = () => {
		// 如果 window.turnstile 已经存在，说明脚本已完全加载
		if (window.turnstile) {
			setTurnstileLoaded(true)
			return
		}

		// 检查脚本标签是否存在
		const existingScript = document.querySelector('script[src*="turnstile"]')
		if (existingScript) {
			// 脚本标签存在但 window.turnstile 还不存在，说明脚本正在加载
			// 监听 window.turnstile 何时可用
			checkIntervalRef.current = setInterval(() => {
				if (window.turnstile) {
					if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
					if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current)
					setTurnstileLoaded(true)
				}
			}, 100)
			// 设置超时以防止无限等待
			checkTimeoutRef.current = setTimeout(() => {
				if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
				if (!window.turnstile) {
					console.error('Turnstile script loaded but window.turnstile not available')
				}
			}, 10000)
			return
		}

		// 脚本不存在，创建并加载
		const script = document.createElement('script')
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
		script.async = true
		script.defer = true
		script.onload = () => setTurnstileLoaded(true)
		script.onerror = () => console.error('Failed to load Cloudflare Turnstile')
		document.head.appendChild(script)
	}

	// Initialize Turnstile widget
	const initTurnstile = () => {
		if (!window.turnstile || !turnstileRef.current || !siteKey) return

		try {
			widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
				sitekey: siteKey,
				callback: (token: string) => {
					onChange(token)
					onCaptchaVerified?.(token)
				},
				'error-callback': () => {
					console.error('Turnstile error')
					onChange('')
				},
				'expired-callback': () => {
					console.warn('Turnstile expired')
					onChange('')
				},
				theme: 'auto',
				size: 'normal'
			})
		} catch (error) {
			console.error('Failed to initialize Turnstile:', error)
		}
	}

	// Load image captcha
	const loadImageCaptcha = async () => {
		if (type !== 'image' || !onRefresh) return

		setLoading(true)
		try {
			await onRefresh()
		} catch (error) {
			console.error('Failed to load captcha:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (type === 'cloudflare') {
			loadTurnstileScript()
		}
		// 图片验证码不再自动加载，由外部控制
	}, [type])

	useEffect(() => {
		if (type === 'cloudflare' && turnstileLoaded && window.turnstile) {
			// Small delay to ensure DOM is ready
			const timer = setTimeout(initTurnstile, 100)
			return () => clearTimeout(timer)
		}
	}, [type, turnstileLoaded, siteKey])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			// 清理定时器
			if (checkIntervalRef.current) {
				clearInterval(checkIntervalRef.current)
			}
			if (checkTimeoutRef.current) {
				clearTimeout(checkTimeoutRef.current)
			}
			// 清理 Turnstile widget
			if (widgetIdRef.current && window.turnstile) {
				try {
					window.turnstile.remove(widgetIdRef.current)
				} catch (error) {
					console.error('Failed to cleanup Turnstile:', error)
				}
			}
		}
	}, [])

	if (type === 'cloudflare') {
		return (
			<div className={`${styles.captchaContainer} ${styles.cloudflareType}`}>
				<div className={styles.cloudflareWidget}>
					{!turnstileLoaded ? (
						<div className={styles.loadingState}>
							<Icon name='loading' />
							<span>Loading verification...</span>
						</div>
					) : (
						<div ref={turnstileRef} className={styles.turnstileContainer} />
					)}
				</div>
			</div>
		)
	}

	if (type === 'image') {
		return (
			<div className={`${styles.captchaContainer} ${styles.imageType} ${focused ? styles.focused : ''}`}>
				<div className={styles.inputSection}>
					<div className={styles.inputPrefix}>
						<Icon name='shield-outline' />
					</div>
					<input
						type='text'
						placeholder={messages.login.form.captcha_placeholder}
						value={value}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
						onFocus={handleFocus}
						onBlur={handleBlur}
						className={styles.input}
					/>
				</div>
				<div className={styles.captchaSection}>
					{captchaImage && (
						<img
							src={captchaImage}
							alt='Captcha'
							className={styles.captchaImage}
							onClick={loadImageCaptcha}
						/>
					)}
				</div>
			</div>
		)
	}

	if (type === 'text') {
		return (
			<div className={styles.captchaContainer}>
				<AuthInput
					type='text'
					placeholder={messages.login.form.captcha_placeholder}
					value={value}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
					prefix='verified_user'
				/>
			</div>
		)
	}

	return null
}

export default Captcha
