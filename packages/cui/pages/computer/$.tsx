import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { getLocale, useParams, useNavigate } from '@umijs/max'
import { Spin, Tooltip, Popover } from 'antd'
import {
	ReloadOutlined, ExpandOutlined, CompressOutlined, LoadingOutlined,
	GlobalOutlined, ArrowRightOutlined
} from '@ant-design/icons'
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
	const sandboxId = parts.length > 2 ? parts.slice(2).join('/') : undefined

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
	const [visitOpen, setVisitOpen] = useState(false)
	const [visitAddr, setVisitAddr] = useState('')

	useEffect(() => {
		if (!computerAPI || !taiID) return
		computerAPI.Options().then((res) => {
			const list = res?.data || res || []
			if (!Array.isArray(list)) return
			const node = sandboxId
				? (list.find((n: ComputerOption) => n.id === sandboxId) || list.find((n: ComputerOption) => n.node_id === taiID))
				: list.find((n: ComputerOption) => n.id === taiID)
			if (node) setNodeInfo(node)
		})
	}, [computerAPI, taiID, sandboxId])

	const nodeID = useMemo(() => nodeInfo?.node_id || taiID, [nodeInfo, taiID])
	const containerID = useMemo(() => {
		if (nodeInfo?.kind === 'box') return nodeInfo.container_id || sandboxId
		return '__host__'
	}, [nodeInfo, sandboxId])

	const wsUrl = useMemo(() => {
		if (!taiID || !computerAPI || !nodeInfo) return null
		return computerAPI.GetVNCWebSocketURL(nodeID, containerID)
	}, [taiID, computerAPI, nodeInfo, nodeID, containerID])

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

	const buildProxyURL = useCallback((addr: string): string | null => {
		if (!computerAPI || !nodeInfo || !containerID) return null

		let url: URL
		try {
			const normalized = addr.match(/^https?:\/\//) ? addr : `http://${addr}`
			url = new URL(normalized)
		} catch {
			return null
		}

		const port = url.port || (url.protocol === 'https:' ? '443' : '80')
		const path = url.pathname + url.search + url.hash

		// @ts-ignore
		const baseURL: string = computerAPI['baseURL'] || '/api/v1'
		return `${baseURL}/tai/${nodeID}/proxy/${containerID}:${port}${path}`
	}, [computerAPI, nodeInfo, nodeID, containerID])

	const handleVisitOpen = useCallback(() => {
		const proxyURL = buildProxyURL(visitAddr)
		if (proxyURL) {
			window.open(proxyURL, '_blank')
			setVisitOpen(false)
			setVisitAddr('')
		}
	}, [visitAddr, buildProxyURL])

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
					<Tooltip title={is_cn ? '返回' : 'Back'}>
						<div className={styles.backBtn} onClick={() => navigate('/computers')}>
							<Icon name='material-arrow_back' size={16} />
						</div>
					</Tooltip>
					{osSvg && (
						<img className={styles.osIcon} src={osSvg} alt={os} />
					)}
					<Tooltip title={displayName} placement="top">
						<span className={styles.label}>{displayName}</span>
					</Tooltip>
					{hostname && (
						<Tooltip title={hostname} placement="top">
							<span className={styles.hostname}>{hostname}</span>
						</Tooltip>
					)}
				</div>
				<div className={styles.actions}>
					{nodeInfo && (
						<Popover
							open={visitOpen}
							onOpenChange={(v) => { setVisitOpen(v); if (!v) setVisitAddr('') }}
							trigger="click"
							placement="topRight"
							overlayInnerStyle={{ padding: 0 }}
							content={
								<div className={styles.visitPopover}>
									<input
										className={styles.visitInput}
										placeholder={is_cn ? '例如 localhost:8080' : 'e.g. localhost:8080'}
										value={visitAddr}
										onChange={(e) => setVisitAddr(e.target.value)}
										onKeyDown={(e) => { if (e.key === 'Enter' && visitAddr.trim() && buildProxyURL(visitAddr)) handleVisitOpen() }}
										autoFocus
									/>
									<button
										className={styles.visitGoBtn}
										disabled={!visitAddr.trim() || !buildProxyURL(visitAddr)}
										onClick={handleVisitOpen}
									>
										<ArrowRightOutlined />
									</button>
								</div>
							}
						>
							<Tooltip title={is_cn ? '访问' : 'Visit'} open={visitOpen ? false : undefined}>
								<button className={`${styles.actionBtn} ${visitOpen ? styles.actionBtnActive : ''}`}>
									<GlobalOutlined />
								</button>
							</Tooltip>
						</Popover>
					)}
					<Tooltip title={is_cn ? '重新连接' : 'Reconnect'}>
						<button
							className={styles.actionBtn}
							onClick={handleReconnect}
						>
							<ReloadOutlined />
						</button>
					</Tooltip>
					<Tooltip title={is_cn ? (isMaximized ? '还原' : '最大化') : (isMaximized ? 'Restore' : 'Maximize')}>
						<button
							className={styles.actionBtn}
							onClick={toggleMaximize}
						>
							{isMaximized ? <CompressOutlined /> : <ExpandOutlined />}
						</button>
					</Tooltip>
				</div>
			</div>
		</div>
	)
}

export default window.$app.memo(Computer)
