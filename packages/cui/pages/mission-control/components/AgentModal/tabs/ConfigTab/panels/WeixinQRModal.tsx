import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Modal } from 'antd'
import { QRCodeSVG } from 'qrcode.react'
import Icon from '@/widgets/Icon'
import styles from '../index.less'

interface WeixinQRModalProps {
	open: boolean
	is_cn: boolean
	onClose: () => void
	onSuccess: (data: { bot_token: string; account_id: string; base_url?: string }) => void
}

type QRStatus = 'loading' | 'waiting' | 'scanned' | 'confirmed' | 'expired' | 'error'

const POLL_INTERVAL = 3000
const SESSION_TIMEOUT = 5 * 60 * 1000

const WeixinQRModal: React.FC<WeixinQRModalProps> = ({ open, is_cn, onClose, onSuccess }) => {
	const [status, setStatus] = useState<QRStatus>('loading')
	const [qrcodeImg, setQrcodeImg] = useState<string>('')
	const [errorMsg, setErrorMsg] = useState('')
	const sessionKeyRef = useRef<string>('')
	const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const activeRef = useRef(false)
	const abortRef = useRef<AbortController | null>(null)
	const onSuccessRef = useRef(onSuccess)
	onSuccessRef.current = onSuccess

	const stopPolling = useCallback(() => {
		if (pollingRef.current) {
			clearInterval(pollingRef.current)
			pollingRef.current = null
		}
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}
		if (abortRef.current) {
			abortRef.current.abort()
			abortRef.current = null
		}
	}, [])

	const createSession = useCallback(async () => {
		setStatus('loading')
		setErrorMsg('')
		setQrcodeImg('')
		stopPolling()

		const abort = new AbortController()
		abortRef.current = abort

		try {
			const { Agent } = await import('@/openapi/agent')
			if (abort.signal.aborted) return

			if (!window.$app?.openapi) throw new Error('OpenAPI not available')
			const agent = new Agent(window.$app.openapi)

			const resp = await agent.robots.WeixinQRCodeCreate()
			if (abort.signal.aborted) return

			const data = resp.data ?? (resp as any)
			if (!data?.session_key) throw new Error('Invalid response')

			sessionKeyRef.current = data.session_key
			setQrcodeImg(data.qrcode_img || data.qrcode_url || '')
			setStatus('waiting')

			pollingRef.current = setInterval(async () => {
				if (abort.signal.aborted) return
				try {
					const pollResp = await agent.robots.WeixinQRCodePoll(sessionKeyRef.current)
					if (abort.signal.aborted) return

					const pollData = pollResp.data ?? (pollResp as any)
					const st = pollData?.status

					if (st === 'scanned') {
						setStatus('scanned')
					} else if (st === 'confirmed') {
						stopPolling()
						setStatus('confirmed')
						onSuccessRef.current({
							bot_token: pollData.bot_token || '',
							account_id: pollData.account_id || '',
							base_url: pollData.base_url
						})
					} else if (st === 'expired') {
						stopPolling()
						setStatus('expired')
					}
				} catch {
					// Ignore transient poll errors
				}
			}, POLL_INTERVAL)

			timeoutRef.current = setTimeout(() => {
				stopPolling()
				if (!abort.signal.aborted) setStatus('expired')
			}, SESSION_TIMEOUT)
		} catch (err: any) {
			if (abort.signal.aborted) return
			setStatus('error')
			setErrorMsg(err?.message || 'Failed to create QR session')
		}
	}, [stopPolling])

	useEffect(() => {
		if (open) {
			activeRef.current = true
			createSession()
		} else {
			activeRef.current = false
			stopPolling()
			setStatus('loading')
			setQrcodeImg('')
			sessionKeyRef.current = ''
		}
		return () => {
			activeRef.current = false
			stopPolling()
		}
	}, [open, createSession, stopPolling])

	const statusText = (() => {
		switch (status) {
			case 'loading':
				return is_cn ? '正在生成二维码...' : 'Generating QR code...'
			case 'waiting':
				return is_cn ? '请使用微信扫描二维码' : 'Scan QR code with WeChat'
			case 'scanned':
				return is_cn ? '已扫描，请在手机上确认' : 'Scanned, please confirm on your phone'
			case 'confirmed':
				return is_cn ? '连接成功' : 'Connected successfully'
			case 'expired':
				return is_cn ? '二维码已过期' : 'QR code expired'
			case 'error':
				return errorMsg || (is_cn ? '生成失败' : 'Failed')
		}
	})()

	const isUrl = qrcodeImg.startsWith('http://') || qrcodeImg.startsWith('https://')

	return (
		<Modal
			open={open}
			title={is_cn ? '微信扫码连接' : 'WeChat QR Login'}
			onCancel={onClose}
			footer={null}
			width={400}
			centered
			destroyOnClose
			className={styles.weixinQrModal}
		>
			<div className={styles.weixinQrContent}>
				<div className={styles.weixinQrImageWrap}>
					{status === 'loading' ? (
						<div className={styles.weixinQrLoading}>
							<Icon name='material-hourglass_empty' size={32} />
						</div>
					) : qrcodeImg ? (
						<>
							{isUrl ? (
								<QRCodeSVG
									value={qrcodeImg}
									size={216}
									level='M'
									includeMargin
									bgColor='#ffffff'
									fgColor='#000000'
								/>
							) : (
								<img
									src={qrcodeImg.startsWith('data:') ? qrcodeImg : `data:image/png;base64,${qrcodeImg}`}
									alt='WeChat QR Code'
									className={styles.weixinQrImage}
								/>
							)}
							{(status === 'expired' || status === 'error') && (
								<div className={styles.weixinQrOverlay}>
									<button
										className={styles.weixinQrRefreshBtn}
										onClick={createSession}
									>
										<Icon name='material-refresh' size={20} />
										<span>{is_cn ? '刷新' : 'Refresh'}</span>
									</button>
								</div>
							)}
							{status === 'scanned' && (
								<div className={styles.weixinQrScannedOverlay}>
									<Icon name='material-check_circle' size={40} />
								</div>
							)}
						</>
					) : (
						<div className={styles.weixinQrLoading}>
							<Icon name='material-error_outline' size={32} />
						</div>
					)}
				</div>

				<div className={`${styles.weixinQrStatus} ${
					status === 'confirmed' ? styles.weixinQrStatusSuccess
					: status === 'expired' || status === 'error' ? styles.weixinQrStatusError
					: status === 'scanned' ? styles.weixinQrStatusScanned
					: ''
				}`}>
					{statusText}
				</div>

				{(status === 'expired' || status === 'error') && (
					<button className={styles.weixinQrRetryBtn} onClick={createSession}>
						<Icon name='material-refresh' size={14} />
						<span>{is_cn ? '重新生成' : 'Regenerate'}</span>
					</button>
				)}
			</div>
		</Modal>
	)
}

export default WeixinQRModal
