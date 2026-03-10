import { useState, useEffect } from 'react'
import { Modal, Spin } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { NodesAPI } from '@/openapi/nodes'
import type { NodeInfo } from '@/pages/workspace/types'
import styles from './index.less'

interface NodeConfigModalProps {
	open: boolean
	onCancel: () => void
}

const formatMemory = (bytes?: number): string => {
	if (!bytes) return '—'
	const gb = bytes / (1024 * 1024 * 1024)
	if (gb >= 1) return `${gb.toFixed(1)} GB`
	const mb = bytes / (1024 * 1024)
	return `${mb.toFixed(0)} MB`
}

const NodeConfigModal = ({ open, onCancel }: NodeConfigModalProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [nodes, setNodes] = useState<NodeInfo[]>([])
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (!open) return
		setLoading(true)
		const api = window.$app?.openapi ? new NodesAPI(window.$app.openapi) : null
		if (!api) {
			setLoading(false)
			return
		}
		api.List().then((resp) => {
			if (!window.$app.openapi.IsError(resp)) {
				setNodes(window.$app.openapi.GetData(resp) || [])
			}
			setLoading(false)
		})
	}, [open])

	const online = nodes.filter((n) => n.status === 'online')

	return (
		<Modal
			open={open}
			onCancel={onCancel}
			footer={null}
			width={600}
			destroyOnClose
			style={{ top: '12vh' }}
			className={styles.modal}
		>
			<div className={styles.wrapper}>
				<div className={styles.formHeader}>
					<div className={styles.formIcon}>
						<Icon name='material-dns' size={24} />
					</div>
					<div>
						<h3 className={styles.formTitle}>
							{is_cn ? '节点状态' : 'Node Status'}
						</h3>
						<p className={styles.formDesc}>
							{is_cn
								? `${online.length}/${nodes.length} 个节点在线。节点通过 Tai 协议自动注册。`
								: `${online.length}/${nodes.length} nodes online. Nodes register automatically via Tai protocol.`}
						</p>
					</div>
				</div>

				<div className={styles.nodeList}>
					{loading ? (
						<div className={styles.nodeLoading}><Spin size='small' /></div>
					) : nodes.length === 0 ? (
						<div className={styles.nodeEmpty}>
							{is_cn ? '暂无节点' : 'No nodes registered'}
						</div>
					) : (
						nodes.map((node) => {
							const isOnline = node.status === 'online'
							return (
								<div key={node.tai_id} className={styles.nodeItem}>
									<div className={styles.nodeLeft}>
										<span className={`${styles.nodeDot} ${isOnline ? styles.online : styles.offline}`} />
										<div className={styles.nodeInfo}>
											<span className={styles.nodeName}>
												{node.display_name || node.system.hostname || node.tai_id}
											</span>
											<span className={styles.nodeAddr}>
												{node.system.os}/{node.system.arch} · {node.system.num_cpu} CPU · {formatMemory(node.system.total_mem)}
											</span>
										</div>
									</div>
									<div className={styles.nodeRight}>
										<span className={styles.nodeStat}>
											{node.mode}
										</span>
									</div>
								</div>
							)
						})
					)}
				</div>
			</div>
		</Modal>
	)
}

export default NodeConfigModal
