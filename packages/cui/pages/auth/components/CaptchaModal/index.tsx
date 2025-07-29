import React, { useState, useEffect } from 'react'
import { Icon } from '@/widgets'
import { AuthButton } from '../'
import Captcha from '../Captcha'
import styles from './index.less'

interface CaptchaModalProps {
	visible: boolean
	onClose: () => void
	onConfirm: (captchaValue: string) => void
	captchaConfig: {
		enabled: boolean
		type: 'image' | 'text' | 'cloudflare'
		endpoint?: string
		siteKey?: string
	}
	loading?: boolean
}

const CaptchaModal: React.FC<CaptchaModalProps> = ({ visible, onClose, onConfirm, captchaConfig, loading = false }) => {
	const [captchaValue, setCaptchaValue] = useState('')

	// 重置验证码值当模态框显示/隐藏时
	useEffect(() => {
		if (visible) {
			setCaptchaValue('')
		}
	}, [visible])

	// ESC键关闭模态框
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && visible) {
				onClose()
			}
		}

		document.addEventListener('keydown', handleEscape)
		return () => document.removeEventListener('keydown', handleEscape)
	}, [visible, onClose])

	// 阻止背景滚动
	useEffect(() => {
		if (visible) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}

		return () => {
			document.body.style.overflow = ''
		}
	}, [visible])

	const handleCaptchaChange = (value: string) => {
		setCaptchaValue(value)
	}

	const handleConfirm = () => {
		if (!captchaValue.trim()) {
			return
		}
		onConfirm(captchaValue)
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		handleConfirm()
	}

	if (!visible) return null

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modalHeader}>
					<h3 className={styles.modalTitle}>安全验证</h3>
					<button type='button' className={styles.closeButton} onClick={onClose} disabled={loading}>
						<Icon name='close' />
					</button>
				</div>

				<div className={styles.modalBody}>
					<p className={styles.description}>为了您的账户安全，请完成以下验证后获取短信验证码</p>

					<form onSubmit={handleSubmit} className={styles.captchaForm}>
						{captchaConfig.enabled && (
							<Captcha
								type={captchaConfig.type}
								endpoint={captchaConfig.endpoint}
								siteKey={captchaConfig.siteKey}
								value={captchaValue}
								onChange={handleCaptchaChange}
								onCaptchaVerified={handleCaptchaChange}
							/>
						)}

						<div className={styles.modalActions}>
							<AuthButton
								type='default'
								onClick={onClose}
								disabled={loading}
								className={styles.cancelButton}
							>
								取消
							</AuthButton>
							<AuthButton
								type='primary'
								loading={loading}
								disabled={!captchaValue.trim() || loading}
								onClick={handleConfirm}
								className={styles.confirmButton}
							>
								{loading ? '发送中...' : '获取验证码'}
							</AuthButton>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default CaptchaModal
