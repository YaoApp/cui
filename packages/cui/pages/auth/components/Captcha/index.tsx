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

interface CaptchaProps {
	type: 'image' | 'text' | 'cloudflare'
	endpoint?: string
	siteKey?: string
	value: string
	onChange: (value: string) => void
	onCaptchaVerified?: (token: string) => void
	onRefresh?: () => void | Promise<void>
}

const Captcha: React.FC<CaptchaProps> = ({
	type,
	endpoint,
	siteKey,
	value,
	onChange,
	onCaptchaVerified,
	onRefresh
}) => {
	const messages = useIntl()
	const [captchaImage, setCaptchaImage] = useState<string>('')
	const [loading, setLoading] = useState(false)
	const [focused, setFocused] = useState(false)
	const [turnstileLoaded, setTurnstileLoaded] = useState(false)
	const turnstileRef = useRef<HTMLDivElement>(null)
	const widgetIdRef = useRef<string>('')

	const handleFocus = () => setFocused(true)
	const handleBlur = () => setFocused(false)

	// Load Cloudflare Turnstile script
	const loadTurnstileScript = () => {
		if (document.querySelector('script[src*="turnstile"]')) {
			setTurnstileLoaded(true)
			return
		}

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
		if (type !== 'image') return

		setLoading(true)
		try {
			if (onRefresh) {
				// Use the provided onRefresh callback for API-based captcha
				await onRefresh()
			} else if (endpoint) {
				// Fallback to original behavior for endpoint-based captcha
				const timestamp = Date.now()
				setCaptchaImage(`${endpoint}?t=${timestamp}`)
			}
		} catch (error) {
			console.error('Failed to load captcha:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (type === 'cloudflare') {
			loadTurnstileScript()
		} else if (type === 'image' && !onRefresh && endpoint) {
			// Only auto-load for traditional endpoint-based captcha, not API-based
			loadImageCaptcha()
		}
	}, [type, onRefresh])

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
					{(endpoint || captchaImage) && (
						<img
							src={endpoint || captchaImage}
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
