import { useState, useEffect, useMemo, useCallback } from 'react'
import { getLocale } from '@umijs/max'
import { Spin } from 'antd'
import Icon from '@/widgets/Icon'
import { Setting } from '@/openapi/setting/api'
import type { SandboxPageData } from '@/openapi/setting/types'
import ComputerCard from './ComputerCard'
import ImageList from './ImageList'
import DockerMissing from './DockerMissing'
import styles from './index.less'

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

function toBackendLocale(locale: string): string {
	return locale.toLowerCase()
}

const Sandbox = () => {
	const is_cn = getLocale() === 'zh-CN'
	const backendLocale = toBackendLocale(getLocale())
	const [data, setData] = useState<SandboxPageData | null>(null)
	const [loading, setLoading] = useState(true)
	const [selectedNodeId, setSelectedNodeId] = useState<string>('')

	const loadData = async (silent = false) => {
		const api = getSettingAPI()
		if (!api) return
		if (!silent) setLoading(true)
		try {
			const resp = await api.GetSandboxConfig(backendLocale)
			if (resp.data) {
				setData(resp.data)
				if (!selectedNodeId && resp.data.nodes.length > 0) {
					const local = resp.data.nodes.find((n) => n.kind === 'local')
					setSelectedNodeId(local ? local.node_id : resp.data.nodes[0].node_id)
				}
			}
		} catch {
			// Silently ignore fetch errors during polling
		} finally {
			if (!silent) setLoading(false)
		}
	}

	useEffect(() => { loadData() }, [])

	const sortedNodes = useMemo(
		() =>
			data?.nodes
				? [...data.nodes].sort((a, b) => {
						if (a.kind === 'local' && b.kind !== 'local') return -1
						if (a.kind !== 'local' && b.kind === 'local') return 1
						return (a.display_name || '').localeCompare(b.display_name || '')
				  })
				: [],
		[data]
	)

	const selectedNode = useMemo(
		() => sortedNodes.find((n) => n.node_id === selectedNodeId),
		[sortedNodes, selectedNodeId]
	)

	const isMultiNode = sortedNodes.length > 1
	const isSingleNode = sortedNodes.length === 1
	const dockerInstalled = selectedNode?.docker_version != null

	const currentImages = useMemo(
		() => (selectedNodeId && data?.images[selectedNodeId]) || [],
		[data, selectedNodeId]
	)

	const updateImageStatus = useCallback((imageId: string, status: string) => {
		setData((prev) => {
			if (!prev || !selectedNodeId) return prev
			const imgs = prev.images[selectedNodeId]
			if (!imgs) return prev
			const updated = imgs.map((img) =>
				img.id === imageId ? { ...img, status, progress: status === 'downloading' ? 0 : img.progress } : img
			)
			return { ...prev, images: { ...prev.images, [selectedNodeId]: updated } }
		})
	}, [selectedNodeId])

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
				<div className={styles.headerLeft}>
					<div className={styles.icon}>
						<Icon name='material-desktop_mac' size={20} />
					</div>
					<div>
						<h2>{is_cn ? '沙箱配置' : 'Sandbox'}</h2>
						<p>{is_cn ? '管理计算节点、Docker 环境和沙箱镜像' : 'Manage compute nodes, Docker environment and sandbox images'}</p>
					</div>
				</div>
				<a
					className={styles.helpLink}
					href={is_cn
						? 'https://yaoagents.com/docs/zh-cn/settings/docker-setting?source=yao-setting'
						: 'https://yaoagents.com/docs/en-us/settings/docker-setting?source=yao-setting'}
					target='_blank'
					rel='noopener noreferrer'
				>
					<Icon name='material-help_outline' size={14} />
					{is_cn ? '帮助文档' : 'Docs'}
				</a>
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
						{sortedNodes.map((node) => (
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

			{/* Section 2: Images */}
			{dockerInstalled && (
				<div className={styles.section}>
					<ImageList
						nodeId={selectedNodeId}
						nodeName={isMultiNode ? selectedNode?.display_name : undefined}
						images={currentImages}
						onReload={() => loadData(true)}
						onOptimisticUpdate={updateImageStatus}
					/>
				</div>
			)}
		</div>
	)
}

export default Sandbox
