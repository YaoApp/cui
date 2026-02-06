import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { getLocale, useParams } from '@umijs/max'
import { Spin } from 'antd'
import { ReloadOutlined, ExpandOutlined, CompressOutlined, LoadingOutlined } from '@ant-design/icons'
import { VncScreen, VncScreenHandle } from 'react-vnc'
import { OpenAPI, Sandbox as SandboxAPI } from '@/openapi'
import styles from './index.less'

// VNC status from backend API
type VNCStatusType = 'ready' | 'starting' | 'not_supported' | 'unavailable'

// Frontend display status
type DisplayStatus = 'checking' | 'waiting' | 'connecting' | 'connected' | 'closed'

// Polling intervals
const POLL_INTERVAL_FAST = 2000 // 2s when waiting for container to start
const POLL_INTERVAL_SLOW = 10000 // 10s heartbeat when closed/disconnected

const Sandbox = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const params = useParams()
	const sandboxId = params['*'] || ''

	const vncRef = useRef<VncScreenHandle>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	// Initialize API client
	const sandboxAPI = useMemo(() => {
		const api = new OpenAPI({ baseURL: '/v1' })
		return new SandboxAPI(api)
	}, [])

	const [displayStatus, setDisplayStatus] = useState<DisplayStatus>('checking')
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [wsUrl, setWsUrl] = useState<string | null>(null)
	const pollRef = useRef<NodeJS.Timeout | null>(null)
	const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

	// Clear all timers
	const clearTimers = useCallback(() => {
		if (pollRef.current) {
			clearTimeout(pollRef.current)
			pollRef.current = null
		}
		if (heartbeatRef.current) {
			clearTimeout(heartbeatRef.current)
			heartbeatRef.current = null
		}
	}, [])

	// Check VNC status from API
	const checkStatus = useCallback(async (): Promise<VNCStatusType | null> => {
		if (!sandboxId) return null

		try {
			const result = await sandboxAPI.GetVNCStatus(sandboxId)
			if (!result) return null
			return result.status
		} catch (err) {
			console.error('Status check failed:', err)
			return 'unavailable'
		}
	}, [sandboxId, sandboxAPI])

	// Start heartbeat - periodically check if container becomes available
	const startHeartbeat = useCallback(() => {
		// Clear existing heartbeat
		if (heartbeatRef.current) {
			clearTimeout(heartbeatRef.current)
			heartbeatRef.current = null
		}

		const heartbeat = async () => {
			const status = await checkStatus()

			if (status === 'ready') {
				// Container is ready now, connect!
				const url = sandboxAPI.GetVNCWebSocketURL(sandboxId)
				setWsUrl(url)
				setDisplayStatus('connecting')
			} else if (status === 'starting') {
				// Container is starting, show waiting and poll faster
				setDisplayStatus('waiting')
				heartbeatRef.current = setTimeout(heartbeat, POLL_INTERVAL_FAST)
			} else {
				// Still unavailable, keep heartbeat going
				heartbeatRef.current = setTimeout(heartbeat, POLL_INTERVAL_SLOW)
			}
		}

		// Start heartbeat
		heartbeatRef.current = setTimeout(heartbeat, POLL_INTERVAL_SLOW)
	}, [sandboxId, checkStatus, sandboxAPI])

	// Start initial check and polling
	const startPolling = useCallback(() => {
		clearTimers()
		setDisplayStatus('checking')
		setWsUrl(null)

		const poll = async (isFirstCheck: boolean = false) => {
			const status = await checkStatus()

			if (status === 'ready') {
				// VNC is ready, connect
				const url = sandboxAPI.GetVNCWebSocketURL(sandboxId)
				setWsUrl(url)
				setDisplayStatus('connecting')
			} else if (status === 'starting') {
				// Container is starting, show waiting status and continue polling
				setDisplayStatus('waiting')
				pollRef.current = setTimeout(() => poll(false), POLL_INTERVAL_FAST)
			} else if (status === 'unavailable' || status === 'not_supported') {
				// Container not available
				if (isFirstCheck) {
					// First check failed, show closed and start heartbeat
					setDisplayStatus('closed')
					startHeartbeat()
				} else {
					// Was waiting but now unavailable, show closed
					setDisplayStatus('closed')
					startHeartbeat()
				}
			} else {
				// Unknown status, keep polling
				pollRef.current = setTimeout(() => poll(false), POLL_INTERVAL_FAST)
			}
		}

		// Start with first check
		poll(true)
	}, [sandboxId, checkStatus, sandboxAPI, clearTimers, startHeartbeat])

	// Initial load and ID change
	useEffect(() => {
		if (!sandboxId) return

		startPolling()

		return () => {
			clearTimers()
		}
	}, [sandboxId, startPolling, clearTimers])

	// Handle VNC events
	const handleConnect = useCallback(() => {
		console.log('VNC connected')
		clearTimers() // Stop any polling when connected
		setDisplayStatus('connected')
	}, [clearTimers])

	const handleDisconnect = useCallback(() => {
		console.log('VNC disconnected')
		setDisplayStatus('closed')
		setWsUrl(null)
		// Start heartbeat to check if container becomes available again
		startHeartbeat()
	}, [startHeartbeat])

	const handleSecurityFailure = useCallback(
		(e: any) => {
			console.error('Security failure:', e?.detail)
			setDisplayStatus('closed')
			setWsUrl(null)
			startHeartbeat()
		},
		[startHeartbeat]
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

	// Handle manual reconnect
	const handleReconnect = useCallback(() => {
		startPolling()
	}, [startPolling])

	// Listen for fullscreen changes
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement)
		}
		document.addEventListener('fullscreenchange', handleFullscreenChange)
		return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
	}, [])

	// Get status message based on display status
	const getStatusMessage = () => {
		switch (displayStatus) {
			case 'checking':
				return is_cn ? '正在尝试连接...' : 'Trying to connect...'
			case 'waiting':
				return is_cn ? '等待准备沙箱环境' : 'Preparing Sandbox environment'
			case 'connecting':
				return is_cn ? '正在连接...' : 'Connecting...'
			case 'closed':
				return is_cn ? '沙箱已关闭' : 'Sandbox closed'
			default:
				return ''
		}
	}

	if (!sandboxId) {
		return (
			<div className={styles.container}>
				<div className={styles.overlay}>
					<div className={styles.statusCard}>
						<div className={styles.statusMessage}>{is_cn ? '缺少沙箱 ID' : 'Missing Sandbox ID'}</div>
					</div>
				</div>
			</div>
		)
	}

	// Show loading spinner for checking/waiting/connecting states
	const showSpinner = displayStatus === 'checking' || displayStatus === 'waiting' || displayStatus === 'connecting'

	return (
		<div className={styles.container} ref={containerRef}>
			{/* Screen */}
			<div className={styles.screenWrapper}>
				{/* Status overlay - show when not connected */}
				{displayStatus !== 'connected' && (
					<div className={styles.overlay}>
						<div className={styles.statusCard}>
							{showSpinner && <Spin indicator={<LoadingOutlined className={styles.statusIcon} spin />} />}
							<div className={styles.statusMessage}>{getStatusMessage()}</div>
						</div>
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
						onConnect={handleConnect}
						onDisconnect={handleDisconnect}
						onSecurityFailure={handleSecurityFailure}
						retryDuration={3000}
						debug={false}
					/>
				)}
			</div>

			{/* Toolbar - moved to bottom */}
			<div className={styles.toolbar}>
				<div className={styles.title}>
					<span className={styles.label}>{is_cn ? '沙箱' : 'Sandbox'}</span>
					<span className={styles.id}>{sandboxId}</span>
				</div>
				<div className={styles.actions}>
					<button
						className={styles.actionBtn}
						onClick={handleReconnect}
						title={is_cn ? '重新连接' : 'Reconnect'}
					>
						<ReloadOutlined />
					</button>
					<button
						className={styles.actionBtn}
						onClick={toggleFullscreen}
						title={is_cn ? (isFullscreen ? '退出全屏' : '全屏') : isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
					>
						{isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
					</button>
				</div>
			</div>
		</div>
	)
}

export default window.$app.memo(Sandbox)
