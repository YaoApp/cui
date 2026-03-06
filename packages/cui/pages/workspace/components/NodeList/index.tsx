import { useState, useEffect } from 'react'
import { Spin } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { mockApi } from '../../mockData'
import type { NodeInfo } from '../../types'
import styles from './index.less'

const NodeList = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [nodes, setNodes] = useState<NodeInfo[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			try {
				const data = await mockApi.getNodes()
				setNodes(data)
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

	const online = nodes.filter((n) => n.online)
	const offline = nodes.filter((n) => !n.online)

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
				{nodes.map((node) => (
					<div key={node.name} className={`${styles.nodeCard} ${node.online ? '' : styles.nodeOffline}`}>
						<div className={styles.nodeHeader}>
							<div className={styles.nodeIcon}>
								<Icon name='material-dns' size={22} />
							</div>
							<span className={`${styles.statusDot} ${node.online ? styles.dotOnline : styles.dotOffline}`} />
						</div>
						<div className={styles.nodeBody}>
							<h3 className={styles.nodeName}>{node.name}</h3>
							<div className={styles.nodeAddr}>
								<Icon name='material-link' size={12} />
								<span>{node.addr}</span>
							</div>
						</div>
						<div className={styles.nodeFooter}>
							<span className={`${styles.statusBadge} ${node.online ? styles.badgeOnline : styles.badgeOffline}`}>
								{node.online
									? is_cn ? '在线' : 'Online'
									: is_cn ? '离线' : 'Offline'}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default NodeList
