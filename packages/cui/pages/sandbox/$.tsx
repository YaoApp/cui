import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { getLocale, useParams } from '@umijs/max'
import { Spin, Alert, Button } from 'antd'
import { ReloadOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons'
import { VncScreen, VncScreenHandle } from 'react-vnc'
import { OpenAPI, Sandbox as SandboxAPI } from '@/openapi'
import styles from './index.less'

const Sandbox = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const params = useParams()
	const sandboxId = params['*'] || ''

	const vncRef = useRef<VncScreenHandle>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	// Initialize API client
	// Note: Yao OpenAPI uses /v1 as base path, not /api/v1
	const sandboxAPI = useMemo(() => {
		const api = new OpenAPI({ baseURL: '/v1' })
		return new SandboxAPI(api)
	}, [])

	const [status, setStatus] = useState<'loading' | 'connecting' | 'connected' | 'disconnected' | 'error'>('loading')
	const [errorMsg, setErrorMsg] = useState('')
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [retryCount, setRetryCount] = useState(0)
	const [wsUrl, setWsUrl] = useState<string | null>(null)

	const maxRetries = 30

	// Check VNC status API
	const checkStatus = useCallback(async (): Promise<boolean> => {
		if (!sandboxId) return false

		try {
			const vncStatus = await sandboxAPI.GetVNCStatus(sandboxId)
			if (!vncStatus) {
				return false
			}

			if (vncStatus.status === 'ready') {
				return true
			} else if (vncStatus.status === 'not_supported') {
				setStatus('error')
				setErrorMsg(is_cn ? '此 Sandbox 不支持可视化' : 'This sandbox does not support visualization')
				return false
			} else if (vncStatus.status === 'error') {
				setStatus('error')
				setErrorMsg(vncStatus.error || (is_cn ? '服务错误' : 'Service error'))
				return false
			}
			return false
		} catch (err) {
			console.error('Status check failed:', err)
			return false
		}
	}, [sandboxId, sandboxAPI, is_cn])

	// Poll for VNC ready status
	useEffect(() => {
		if (!sandboxId) return

		let cancelled = false
		let timeoutId: NodeJS.Timeout
		let currentRetry = 0

		const poll = async () => {
			if (cancelled) return

			const ready = await checkStatus()
			if (cancelled) return

			if (ready) {
				// Get WebSocket URL from API
				const url = sandboxAPI.GetVNCWebSocketURL(sandboxId)
				setWsUrl(url)
				setStatus('connecting')
			} else if (status !== 'error' && currentRetry < maxRetries) {
				currentRetry++
				setRetryCount(currentRetry)
				timeoutId = setTimeout(poll, 1000)
			} else if (status !== 'error') {
				setStatus('error')
				setErrorMsg(is_cn ? '连接超时，请稍后重试' : 'Connection timeout, please try again')
			}
		}

		setStatus('loading')
		setRetryCount(0)
		setWsUrl(null)
		poll()

		return () => {
			cancelled = true
			clearTimeout(timeoutId)
		}
	}, [sandboxId, checkStatus, sandboxAPI, is_cn])

	// Handle VNC events
	const handleConnect = useCallback(() => {
		console.log('VNC connected')
		setStatus('connected')
		setRetryCount(0)
	}, [])

	const handleDisconnect = useCallback(
		(e: any) => {
			console.log('VNC disconnected:', e?.detail)
			setStatus('disconnected')
			if (e?.detail && !e.detail.clean) {
				setErrorMsg(is_cn ? '连接已断开' : 'Connection lost')
			}
		},
		[is_cn]
	)

	const handleSecurityFailure = useCallback(
		(e: any) => {
			console.error('Security failure:', e?.detail)
			setStatus('error')
			setErrorMsg(is_cn ? '安全验证失败' : 'Security verification failed')
		},
		[is_cn]
	)

	// Handle fullscreen
	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			containerRef.current?.requestFullscreen()
			setIsFullscreen(true)
		} else {
			document.exitFullscreen()
			setIsFullscreen(false)
		}
	}

	// Handle reconnect
	const handleReconnect = useCallback(() => {
		setRetryCount(0)
		setStatus('loading')
		setErrorMsg('')
		setWsUrl(null)

		// Trigger re-poll by resetting state
		setTimeout(async () => {
			if (sandboxId) {
				const ready = await checkStatus()
				if (ready) {
					const url = sandboxAPI.GetVNCWebSocketURL(sandboxId)
					setWsUrl(url)
					setStatus('connecting')
				}
			}
		}, 100)
	}, [sandboxId, checkStatus, sandboxAPI])

	// Listen for fullscreen changes
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement)
		}
		document.addEventListener('fullscreenchange', handleFullscreenChange)
		return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
	}, [])

	if (!sandboxId) {
		return (
			<div className={styles.container}>
				<Alert
					type='warning'
					message={is_cn ? '缺少 Sandbox ID' : 'Missing Sandbox ID'}
					description={is_cn ? '请在 URL 中提供 Sandbox ID' : 'Please provide Sandbox ID in URL'}
				/>
			</div>
		)
	}

	return (
		<div className={styles.container} ref={containerRef}>
			{/* Toolbar */}
			<div className={styles.toolbar}>
				<div className={styles.title}>
					<span className={styles.label}>Sandbox</span>
					<span className={styles.id}>{sandboxId}</span>
				</div>
				<div className={styles.actions}>
					<Button
						type='text'
						icon={<ReloadOutlined />}
						onClick={handleReconnect}
						title={is_cn ? '重新连接' : 'Reconnect'}
					/>
					<Button
						type='text'
						icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
						onClick={toggleFullscreen}
						title={is_cn ? (isFullscreen ? '退出全屏' : '全屏') : isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
					/>
				</div>
			</div>

			{/* Screen */}
			<div className={styles.screenWrapper}>
				{/* Loading overlay */}
				{(status === 'loading' || status === 'connecting') && (
					<div className={styles.overlay}>
						<Spin size='large' />
						<div className={styles.statusText}>
							{status === 'loading'
								? is_cn
									? '正在连接 Sandbox...'
									: 'Connecting to Sandbox...'
								: is_cn
									? '正在初始化显示...'
									: 'Initializing display...'}
						</div>
						{retryCount > 0 && (
							<div className={styles.retryText}>
								{is_cn ? `重试 ${retryCount}/${maxRetries}` : `Retry ${retryCount}/${maxRetries}`}
							</div>
						)}
					</div>
				)}

				{/* Error overlay */}
				{status === 'error' && (
					<div className={styles.overlay}>
						<Alert
							type='error'
							message={is_cn ? '连接失败' : 'Connection Failed'}
							description={errorMsg}
							action={
								<Button size='small' onClick={handleReconnect}>
									{is_cn ? '重试' : 'Retry'}
								</Button>
							}
						/>
					</div>
				)}

				{/* Disconnected overlay */}
				{status === 'disconnected' && (
					<div className={styles.overlay}>
						<Alert
							type='warning'
							message={is_cn ? '连接已断开' : 'Disconnected'}
							description={errorMsg || (is_cn ? 'Sandbox 连接已关闭' : 'Sandbox connection closed')}
							action={
								<Button size='small' onClick={handleReconnect}>
									{is_cn ? '重新连接' : 'Reconnect'}
								</Button>
							}
						/>
					</div>
				)}

				{/* VNC Screen - only render when we have a URL */}
				{wsUrl && (
					<VncScreen
						ref={vncRef}
						url={wsUrl}
						scaleViewport
						resizeSession
						viewOnly={false}
						focusOnClick
						className={styles.vncScreen}
						style={{
							width: '100%',
							height: '100%',
							background: '#1e1e1e'
						}}
						onConnect={handleConnect}
						onDisconnect={handleDisconnect}
						onSecurityFailure={handleSecurityFailure}
						retryDuration={3000}
						debug={false}
					/>
				)}
			</div>
		</div>
	)
}

export default window.$app.memo(Sandbox)
