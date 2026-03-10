import { useState, useEffect } from 'react'
import { Spin } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { NodesAPI } from '@/openapi/nodes'
import type { NodeInfo } from '../../types'
import styles from './index.less'

const formatMemory = (bytes?: number): string => {
	if (!bytes) return '—'
	const gb = bytes / (1024 * 1024 * 1024)
	if (gb >= 1) return `${gb.toFixed(1)} GB`
	const mb = bytes / (1024 * 1024)
	return `${mb.toFixed(0)} MB`
}

const NodeList = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [nodes, setNodes] = useState<NodeInfo[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			try {
				const api = window.$app?.openapi ? new NodesAPI(window.$app.openapi) : null
				if (!api) return
				const resp = await api.List()
				if (!window.$app.openapi.IsError(resp)) {
					setNodes(window.$app.openapi.GetData(resp) || [])
				}
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [])

	if (loading) {
		return (
			<div className={styles.loading}>
				<Spin />
				<span>{is_cn ? '加载中...' : 'Loading...'}</span>
			</div>
		)
	}

	const online = nodes.filter((n) => n.status === 'online')
	const offline = nodes.filter((n) => n.status !== 'online')

	return (
		<div className={styles.wrapper}>
			<div className={styles.stats}>
				<div className={styles.statCard}>
					<div className={styles.statValue}>{nodes.length}</div>
					<div className={styles.statLabel}>{is_cn ? '总节点' : 'Total Nodes'}</div>
				</div>
				<div className={styles.statCard}>
					<div className={`${styles.statValue} ${styles.online}`}>{online.length}</div>
					<div className={styles.statLabel}>{is_cn ? '在线' : 'Online'}</div>
				</div>
				<div className={styles.statCard}>
					<div className={`${styles.statValue} ${styles.offline}`}>{offline.length}</div>
					<div className={styles.statLabel}>{is_cn ? '离线' : 'Offline'}</div>
				</div>
			</div>

			<div className={styles.nodeGrid}>
				{nodes.map((node) => {
					const isOnline = node.status === 'online'
					const displayName = node.display_name || node.system.hostname || node.tai_id
					return (
						<div key={node.tai_id} className={`${styles.nodeCard} ${isOnline ? '' : styles.nodeOffline}`}>
							<div className={styles.nodeHeader}>
								<div className={styles.nodeIcon}>
									<Icon name='material-dns' size={22} />
								</div>
								<span className={`${styles.statusDot} ${isOnline ? styles.dotOnline : styles.dotOffline}`} />
							</div>
							<div className={styles.nodeBody}>
								<h3 className={styles.nodeName}>{displayName}</h3>
								<div className={styles.nodeAddr}>
									<Icon name='material-memory' size={12} />
									<span>{node.system.os}/{node.system.arch} · {node.system.num_cpu} CPU · {formatMemory(node.system.total_mem)}</span>
								</div>
								{node.addr && (
									<div className={styles.nodeAddr}>
										<Icon name='material-link' size={12} />
										<span>{node.addr}</span>
									</div>
								)}
							</div>
							<div className={styles.nodeFooter}>
								<span className={`${styles.statusBadge} ${isOnline ? styles.badgeOnline : styles.badgeOffline}`}>
									{isOnline
										? is_cn ? '在线' : 'Online'
										: is_cn ? '离线' : 'Offline'}
								</span>
								<span className={styles.statusBadge}>{node.mode}</span>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}

export default NodeList
