import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { getLocale, useParams, useNavigate } from '@umijs/max'
import { Spin } from 'antd'
import { ReloadOutlined, ExpandOutlined, CompressOutlined, LoadingOutlined } from '@ant-design/icons'
import { VncScreen, VncScreenHandle } from 'react-vnc'
import { ComputerAPI, type ComputerOption } from '@/openapi/computer'
import { brandIcons } from '@/assets/icons/brands'
import Icon from '@/widgets/Icon'
import styles from './index.less'

type DisplayStatus = 'connecting' | 'connected' | 'closed' | 'error'

const Computer = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const params = useParams()
	const navigate = useNavigate()

	const raw = params['*'] || ''
	const parts = raw.replace(/\/$/, '').split('/')
	const taiID = parts[0] || ''
	const containerID = parts.length > 2 ? parts.slice(2).join('/') : undefined

	const vncRef = useRef<VncScreenHandle>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const screenRef = useRef<HTMLDivElement>(null)

	const computerAPI = useMemo(() => {
		if (!window.$app?.openapi) return null
		return new ComputerAPI(window.$app.openapi)
	}, [])

	const [displayStatus, setDisplayStatus] = useState<DisplayStatus>('connecting')
	const [isMaximized, setIsMaximized] = useState(false)
	const [nodeInfo, setNodeInfo] = useState<ComputerOption | null>(null)
	const [vncKey, setVncKey] = useState(0)

	useEffect(() => {
		if (!computerAPI || !taiID) return
		computerAPI.Options().then((res) => {
			const list = res?.data || res || []
			if (!Array.isArray(list)) return
			const node = list.find((n: ComputerOption) => n.id === taiID)
			if (node) setNodeInfo(node)
		})
	}, [computerAPI, taiID])

	const wsUrl = useMemo(() => {
		if (!taiID || !computerAPI) return null
		return computerAPI.GetVNCWebSocketURL(taiID, containerID)
	}, [taiID, containerID, computerAPI])

	const handleConnect = useCallback(() => {
		setDisplayStatus('connected')
	}, [])

	const handleDisconnect = useCallback(() => {
		setDisplayStatus('closed')
	}, [])

	const handleSecurityFailure = useCallback(() => {
		setDisplayStatus('error')
	}, [])

	const toggleMaximize = useCallback(() => {
		setIsMaximized((v) => !v)
		setTimeout(() => {
			window.dispatchEvent(new Event('resize'))
		}, 100)
	}, [])

	const handleReconnect = useCallback(() => {
		setDisplayStatus('connecting')
		setVncKey((k) => k + 1)
	}, [])

	useEffect(() => {
		const el = screenRef.current
		if (!el) return
		const ro = new ResizeObserver(() => {
			window.dispatchEvent(new Event('resize'))
		})
		ro.observe(el)
		return () => ro.disconnect()
	}, [])

	const displayName = nodeInfo?.display_name || taiID
	const os = (nodeInfo?.system?.os || '').toLowerCase()
	const osSvg = nodeInfo?.kind === 'box' ? brandIcons['linux'] : (brandIcons[os] || null)
	const hostname = nodeInfo?.system?.hostname || ''

	if (!taiID) {
		return (
			<div className={styles.container}>
				<div className={styles.overlay}>
					<div className={styles.statusCard}>
						<div className={styles.statusMessage}>
							{is_cn ? '缺少 Computer ID' : 'Missing Computer ID'}
						</div>
					</div>
				</div>
			</div>
		)
	}

	const getStatusMessage = () => {
		switch (displayStatus) {
			case 'connecting':
				return is_cn ? '正在连接...' : 'Connecting...'
			case 'closed':
				return is_cn ? '连接已断开' : 'Connection closed'
			case 'error':
				return is_cn ? '连接失败' : 'Connection failed'
			default:
				return ''
		}
	}

	return (
		<div
			className={`${styles.container} ${isMaximized ? styles.maximized : ''}`}
			ref={containerRef}
		>
			<div className={styles.screenWrapper} ref={screenRef}>
				{displayStatus !== 'connected' && (
					<div className={styles.overlay}>
						<div className={styles.statusCard}>
							{displayStatus === 'connecting' && (
								<Spin indicator={<LoadingOutlined className={styles.statusIcon} spin />} />
							)}
							<div className={styles.statusMessage}>{getStatusMessage()}</div>
						</div>
					</div>
				)}

				{wsUrl && (
					<VncScreen
						key={vncKey}
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

			<div className={styles.toolbar}>
				<div className={styles.title}>
					<div className={styles.backBtn} onClick={() => navigate('/computers')}>
						<Icon name='material-arrow_back' size={16} />
					</div>
					{osSvg && (
						<img className={styles.osIcon} src={osSvg} alt={os} />
					)}
					<span className={styles.label}>{displayName}</span>
					{hostname && <span className={styles.hostname}>{hostname}</span>}
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
						onClick={toggleMaximize}
						title={
							is_cn
								? isMaximized ? '还原' : '最大化'
								: isMaximized ? 'Restore' : 'Maximize'
						}
					>
						{isMaximized ? <CompressOutlined /> : <ExpandOutlined />}
					</button>
				</div>
			</div>
		</div>
	)
}

export default window.$app.memo(Computer)
