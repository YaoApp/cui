import React, { useState, useEffect } from 'react'
import { AuthInput, AuthButton } from '../'
import styles from './index.less'

export interface OtpInputProps {
	value: string
	onChange: (value: string) => void
	onResend: () => Promise<void>
	placeholder?: string
	resendText?: string
	sendingText?: string
	resendInText?: string // e.g., "Resend in {0}s" where {0} will be replaced with countdown
	interval?: number // in seconds, default 60
	disabled?: boolean
	onFocus?: () => void
	onBlur?: () => void
}

const OtpInput: React.FC<OtpInputProps> = ({
	value,
	onChange,
	onResend,
	placeholder = 'Code',
	resendText = 'Resend',
	sendingText = 'Sending...',
	resendInText = '{0}s',
	interval = 60,
	disabled = false,
	onFocus,
	onBlur
}) => {
	const [countdown, setCountdown] = useState(0)
	const [resending, setResending] = useState(false)

	useEffect(() => {
		setCountdown(interval)
	}, [interval])

	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => {
				setCountdown(countdown - 1)
			}, 1000)
			return () => clearTimeout(timer)
		}
	}, [countdown])

	const handleResend = async () => {
		if (countdown > 0 || resending) return

		setResending(true)
		try {
			await onResend()
			setCountdown(interval)
		} catch (error) {
			console.error('Failed to resend verification code:', error)
		} finally {
			setResending(false)
		}
	}

	const canResend = countdown === 0 && !resending

	return (
		<div className={styles.container}>
			<div className={styles.inputWrapper}>
				<AuthInput
					id='verification-code'
					placeholder={placeholder}
					prefix='material-shield'
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onFocus={onFocus}
					onBlur={onBlur}
					disabled={disabled}
					type='text'
				/>
			</div>
			<div className={styles.resendWrapper}>
				<AuthButton
					type='link'
					onClick={handleResend}
					disabled={!canResend}
					className={styles.resendButton}
				>
					{resending
						? sendingText
						: countdown > 0
						? resendInText.replace('{0}', countdown.toString())
						: resendText}
				</AuthButton>
			</div>
		</div>
	)
}

export default OtpInput
