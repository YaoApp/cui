import { useState, useEffect, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import { Spin } from 'antd'
import Icon from '@/widgets/Icon'
import type { SandboxPageData } from '../../types'
import { mockApi } from '../../mockApi'
import ComputerCard from './ComputerCard'
import RegistryPanel from './RegistryPanel'
import ImageList from './ImageList'
import DockerMissing from './DockerMissing'
import styles from './index.less'

const Sandbox = () => {
	const is_cn = getLocale() === 'zh-CN'
	const [data, setData] = useState<SandboxPageData | null>(null)
	const [loading, setLoading] = useState(true)
	const [selectedNodeId, setSelectedNodeId] = useState<string>('')

	const loadData = async (silent = false) => {
		if (!silent) setLoading(true)
		try {
			const result = await mockApi.getSandboxPageData()
			setData(result)
			if (!selectedNodeId && result.nodes.length > 0) {
				setSelectedNodeId(result.nodes[0].node_id)
			}
		} finally {
			if (!silent) setLoading(false)
		}
	}

	useEffect(() => { loadData() }, [])

	const selectedNode = useMemo(
		() => data?.nodes.find((n) => n.node_id === selectedNodeId),
		[data, selectedNodeId]
	)

	const isMultiNode = (data?.nodes.length ?? 0) > 1
	const isSingleNode = (data?.nodes.length ?? 0) === 1
	const dockerInstalled = selectedNode?.docker_version != null

	const currentImages = useMemo(
		() => (selectedNodeId && data?.images[selectedNodeId]) || [],
		[data, selectedNodeId]
	)

	if (loading || !data) {
		return (
			<div className={styles.container}>
				<div className={styles.header}>
					<div className={styles.icon}>
					<Icon name='material-desktop_mac' size={20} />
				</div>
				<div>
					<h2>{is_cn ? '沙箱配置' : 'Sandbox'}</h2>
					<p>{is_cn ? '管理计算节点、Docker 环境和沙箱镜像' : 'Manage compute nodes, Docker environment and sandbox images'}</p>
				</div>
			</div>
			<div className={styles.loadingState}>
					<Spin />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.container}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.icon}>
					<Icon name='material-desktop_mac' size={20} />
				</div>
				<div>
					<h2>{is_cn ? '沙箱配置' : 'Sandbox'}</h2>
					<p>{is_cn ? '管理计算节点、Docker 环境和沙箱镜像' : 'Manage compute nodes, Docker environment and sandbox images'}</p>
				</div>
			</div>

			{/* Section 1: Computer list or single-node info */}
			{isMultiNode && (
				<div className={styles.section}>
					<div className={styles.sectionHeader}>
						<span className={styles.sectionTitle}>
							{is_cn ? '电脑列表' : 'COMPUTERS'}
						</span>
					</div>
					<div className={styles.computerGrid}>
						{data.nodes.map((node) => (
							<ComputerCard
								key={node.node_id}
								node={node}
								selected={node.node_id === selectedNodeId}
								onClick={() => setSelectedNodeId(node.node_id)}
							/>
						))}
					</div>
				</div>
			)}

			{isSingleNode && selectedNode && dockerInstalled && (
				<div className={styles.singleNodeInfo}>
					<div className={styles.singleNodeRow}>
						<span className={styles.singleNodeLabel}>
							<Icon name='material-check_circle' size={14} />
							Docker {selectedNode.docker_version}
						</span>
						<span className={styles.singleNodeSys}>
							{selectedNode.os} {selectedNode.arch} · {selectedNode.cpu} CPU · {selectedNode.memory_gb} GB
						</span>
						<span className={styles.singleNodeSandbox}>
							{selectedNode.running_sandboxes} {is_cn ? '个沙箱运行中' : 'running'}
						</span>
					</div>
				</div>
			)}

			{/* Docker not installed scenario */}
			{selectedNode && !dockerInstalled && (
				<DockerMissing
					nodeId={selectedNodeId}
					onDockerDetected={() => loadData()}
				/>
			)}

			{/* Section 2: Registry (always show if docker installed) */}
			{dockerInstalled && (
				<div className={styles.section}>
					<RegistryPanel
						registry={data.registry}
						onSaved={(reg) => setData((prev) => prev ? { ...prev, registry: reg } : prev)}
					/>
				</div>
			)}

			{/* Section 3: Images */}
			{dockerInstalled && (
				<div className={styles.section}>
					<ImageList
						nodeId={selectedNodeId}
						nodeName={isMultiNode ? selectedNode?.display_name : undefined}
						images={currentImages}
						onReload={() => loadData(true)}
					/>
				</div>
			)}
		</div>
	)
}

export default Sandbox
