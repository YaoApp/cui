import { useState, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { Spin } from 'antd'
import { LinkOutlined, DisconnectOutlined, PlusOutlined, CloseOutlined, LoadingOutlined, CheckOutlined } from '@ant-design/icons'
import styles from './index.less'

// ─── Types ───────────────────────────────────────────

export interface ServiceItem {
	label: string
	port: number
	bound: boolean
	host_port?: number
	status?: string
}

export interface TemporaryBinding {
	host_port: number
	target_port: number
	label: string
	status: string
}

export interface AssistantGroup {
	assistant_id: string
	name: string
	services: ServiceItem[]
}

export interface TargetGroup {
	target_id: string
	kind: 'box' | 'host'
	assistants: AssistantGroup[]
	temporary: TemporaryBinding[]
}

export interface BindingsGroupedResponse {
	domain: string
	prefix: string
	protocol?: string
	targets: TargetGroup[]
}

export interface ServiceListProps {
	taiId: string
	targetId: string
	baseURL?: string
	variant?: 'popover' | 'inline'
	onOpenTab?: (url: string, title: string, newWindowUrl?: string) => void
}

export interface ServiceListRef {
	refresh: () => void
}

export type ServiceListHandle = ServiceListRef

// ─── Component ───────────────────────────────────────

const ServiceList = forwardRef<ServiceListRef, ServiceListProps>(({ taiId, targetId, baseURL = '/v1', variant = 'popover', onOpenTab }, ref) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const isInline = variant === 'inline'

	const [loading, setLoading] = useState(false)
	const [domain, setDomain] = useState('')
	const [prefix, setPrefix] = useState('p')
	const [protocol, setProtocol] = useState('http')
	const [assistants, setAssistants] = useState<AssistantGroup[]>([])
	const [temporary, setTemporary] = useState<TemporaryBinding[]>([])
	const [manualPort, setManualPort] = useState('')
	const [manualLabel, setManualLabel] = useState('')
	const [showAddForm, setShowAddForm] = useState(false)

	const applyResponse = useCallback((data: BindingsGroupedResponse) => {
		setDomain(data.domain || '')
		setPrefix(data.prefix || 'p')
		setProtocol(data.protocol || 'http')
		const target = data.targets?.[0]
		if (target) {
			setAssistants(target.assistants || [])
			setTemporary(target.temporary || [])
		} else {
			setAssistants([])
			setTemporary([])
		}
	}, [])

	const loadBindings = useCallback(async () => {
		if (!taiId || !targetId) return
		setLoading(true)
		try {
			const resp = await fetch(
				`${baseURL}/tai/${taiId}/webproxy/bindings?target_id=${encodeURIComponent(targetId)}`,
				{ credentials: 'include', headers: { 'Accept-Language': locale } }
			)
			if (resp.ok) {
				applyResponse(await resp.json())
			}
		} catch (e) {
			console.error('[ServiceList] loadBindings failed:', e)
		} finally {
			setLoading(false)
		}
	}, [taiId, targetId, baseURL, locale, applyResponse])

	useEffect(() => {
		loadBindings()
	}, [loadBindings])

	useImperativeHandle(ref, () => ({ refresh: loadBindings }), [loadBindings])

	const connectService = useCallback(async (port: number, label: string) => {
		if (!taiId || !targetId) return
		try {
			const resp = await fetch(`${baseURL}/tai/${taiId}/webproxy/bindings`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json', 'Accept-Language': locale },
				body: JSON.stringify({ target_id: targetId, port, label })
			})
			if (resp.ok) applyResponse(await resp.json())
		} catch (e) {
			console.error('[ServiceList] connect failed:', e)
		}
	}, [taiId, targetId, baseURL, locale, applyResponse])

	const disconnectService = useCallback(async (hostPort: number) => {
		if (!taiId) return
		try {
			const resp = await fetch(
				`${baseURL}/tai/${taiId}/webproxy/bindings/${hostPort}?target_id=${encodeURIComponent(targetId)}`,
				{ method: 'DELETE', credentials: 'include', headers: { 'Accept-Language': locale } }
			)
			if (resp.ok) applyResponse(await resp.json())
		} catch (e) {
			console.error('[ServiceList] disconnect failed:', e)
		}
	}, [taiId, targetId, baseURL, locale, applyResponse])

	const buildURL = useCallback((hostPort: number): string => {
		if (domain) {
			return `${protocol}://${prefix}${hostPort}.${domain}`
		}
		const scheme = window.location.protocol === 'https:' ? 'https' : 'http'
		return `${scheme}://${window.location.hostname}:${hostPort}`
	}, [domain, prefix, protocol])

	const handleOpenTab = useCallback(async (hostPort: number, targetPort: number, title: string) => {
		if (!onOpenTab) return
		const url = buildURL(hostPort)
		let authUrl: string | undefined
		try {
			const resp = await fetch(`${baseURL}/tai/${taiId}/webproxy/bindings`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ target_id: targetId, port: targetPort, label: title })
			})
			if (resp.ok) {
				const data = await resp.json()
				if (data.token) {
					authUrl = `${url}/.auth?token=${encodeURIComponent(data.token)}`
				}
			}
		} catch {}
		onOpenTab(authUrl || url, title, authUrl)
	}, [onOpenTab, buildURL, baseURL, taiId, targetId])

	const getLabel = (svc: ServiceItem, idx: number) => {
		if (svc.label) return svc.label
		return is_cn ? `服务 ${idx + 1}` : `Service ${idx + 1}`
	}

	const handleAddPort = () => {
		if (!manualPort) return
		connectService(parseInt(manualPort), manualLabel)
		setManualPort('')
		setManualLabel('')
		setShowAddForm(false)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') handleAddPort()
		if (e.key === 'Escape') { setShowAddForm(false); setManualPort(''); setManualLabel('') }
	}

	const allServices = assistants.flatMap((a) => a.services)
	const hasContent = allServices.length > 0 || temporary.length > 0

	const rootClass = isInline ? styles.serviceListInline : styles.serviceList

	if (loading) {
		return (
			<div className={rootClass}>
				<div className={styles.loading}>
					<Spin indicator={<LoadingOutlined spin />} />
				</div>
			</div>
		)
	}

	const renderServiceRow = (svc: ServiceItem, idx: number, groupId: string) => (
		<div
			key={`${groupId}-${svc.port}`}
			className={`${styles.serviceItem} ${!svc.bound ? styles.serviceItemDisabled : ''}`}
			onClick={() => {
				if (svc.bound && svc.host_port && onOpenTab) {
					handleOpenTab(svc.host_port, svc.port, getLabel(svc, idx))
				}
			}}
		>
			{svc.bound ? (
				<LinkOutlined className={styles.iconBound} />
			) : (
				<DisconnectOutlined className={styles.iconUnbound} />
			)}
			<span className={styles.label}>{getLabel(svc, idx)}</span>
			<span className={styles.port}>:{svc.port}</span>
			{svc.bound ? (
				<button
					className={`${styles.textBtn} ${styles.disconnectBtn}`}
					onClick={(e) => {
						e.stopPropagation()
						if (svc.host_port) disconnectService(svc.host_port)
					}}
				>
					{is_cn ? '断开' : 'Off'}
				</button>
			) : (
				<button
					className={`${styles.textBtn} ${styles.connectBtn}`}
					onClick={(e) => {
						e.stopPropagation()
						connectService(svc.port, svc.label)
					}}
				>
					{is_cn ? '连接' : 'On'}
				</button>
			)}
		</div>
	)

	const renderTemporaryRow = (t: TemporaryBinding) => (
		<div
			key={t.host_port}
			className={styles.serviceItem}
			onClick={() => handleOpenTab(t.host_port, t.target_port, t.label || `:${t.target_port}`)}
		>
			<LinkOutlined className={styles.iconBound} />
			<span className={styles.label}>{t.label || `:${t.target_port}`}</span>
			<span className={styles.port}>:{t.target_port}</span>
			<button
				className={styles.closeBtn}
				title={is_cn ? '删除' : 'Remove'}
				onClick={(e) => {
					e.stopPropagation()
					disconnectService(t.host_port)
				}}
			>
				<CloseOutlined />
			</button>
		</div>
	)

	const renderAddForm = () => {
		if (showAddForm) {
			return (
				<div className={`${styles.addRow} ${!isInline && hasContent ? styles.sectionBorder : ''}`}>
					<input
						className={styles.input}
						placeholder={is_cn ? '端口' : 'Port'}
						value={manualPort}
						onChange={(e) => setManualPort(e.target.value.replace(/\D/g, ''))}
						onKeyDown={handleKeyDown}
						autoFocus
						style={{ width: 72 }}
					/>
					<input
						className={styles.input}
						placeholder={is_cn ? '名称 (可选)' : 'Name (optional)'}
						value={manualLabel}
						onChange={(e) => setManualLabel(e.target.value)}
						onKeyDown={handleKeyDown}
						style={{ flex: 1 }}
					/>
					<button className={styles.addBtn} disabled={!manualPort} onClick={handleAddPort}>
						<CheckOutlined />
					</button>
					<button className={styles.addBtn} onClick={() => { setShowAddForm(false); setManualPort(''); setManualLabel('') }}>
						<CloseOutlined />
					</button>
				</div>
			)
		}
		return (
			<div className={`${styles.addTrigger} ${!isInline && hasContent ? styles.sectionBorder : ''}`}>
				<button className={styles.addTriggerBtn} onClick={() => setShowAddForm(true)}>
					<PlusOutlined />
					<span>{is_cn ? '添加服务' : 'Add service'}</span>
				</button>
			</div>
		)
	}

	return (
		<div className={rootClass}>
			{assistants.map((group) => (
				<div key={group.assistant_id} className={isInline ? styles.assistantCard : undefined}>
					{(assistants.length > 1 || isInline) && (
						<div className={styles.groupHeader}>{group.name || group.assistant_id}</div>
					)}
					{group.services.length > 0 && (
						<div className={styles.section}>
							{group.services.map((svc, idx) => renderServiceRow(svc, idx, group.assistant_id))}
						</div>
					)}
				</div>
			))}

			{temporary.length > 0 && (
				<div className={isInline ? styles.tempSection : `${styles.section} ${allServices.length > 0 ? styles.sectionBorder : ''}`}>
					{isInline && (
						<div className={styles.groupHeader}>{is_cn ? '临时端口' : 'Temporary'}</div>
					)}
					{temporary.map(renderTemporaryRow)}
				</div>
			)}

			{!hasContent && (
				<div className={styles.empty}>
					{is_cn ? '暂无服务' : 'No services'}
				</div>
			)}

			{renderAddForm()}
		</div>
	)
})

ServiceList.displayName = 'ServiceList'

export default ServiceList
