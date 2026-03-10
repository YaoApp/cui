import { useState, useMemo } from 'react'
import { Input, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { resolveNodeAddr, type Workspace, type NodeInfo } from '../../types'
import styles from './index.less'

interface WorkspaceListProps {
	workspaces: Workspace[]
	nodeMap?: Record<string, NodeInfo>
	loading: boolean
	onSelect: (ws: Workspace) => void
	onDelete: (ws: Workspace) => void
	onCreate: () => void
}

const envLabel: Record<string, { cn: string; en: string }> = {
	production: { cn: '生产', en: 'Production' },
	staging: { cn: '预发布', en: 'Staging' },
	development: { cn: '开发', en: 'Development' },
	testing: { cn: '测试', en: 'Testing' }
}

const envColors: Record<string, string> = {
	production: 'var(--color_success)',
	staging: 'var(--color_warning)',
	development: 'var(--color_info)',
	testing: 'var(--color_mission_accent_purple)'
}

const WorkspaceList = ({ workspaces, nodeMap, loading, onSelect, onDelete, onCreate }: WorkspaceListProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [search, setSearch] = useState('')

	// suppress unused lint — onDelete will be used in detail page
	void onDelete

	const filtered = useMemo(() => {
		if (!search.trim()) return workspaces
		const q = search.toLowerCase()
		return workspaces.filter(
			(ws) =>
				ws.name.toLowerCase().includes(q) ||
				ws.id.toLowerCase().includes(q) ||
				ws.node.toLowerCase().includes(q) ||
				Object.values(ws.labels || {}).some((v) => v.toLowerCase().includes(q))
		)
	}, [workspaces, search])

	const formatDate = (dateStr: string) => {
		const d = new Date(dateStr)
		const now = new Date()
		const diffMs = now.getTime() - d.getTime()
		const diffMin = Math.floor(diffMs / 60000)
		const diffHour = Math.floor(diffMin / 60)
		const diffDay = Math.floor(diffHour / 24)
		if (diffMin < 1) return is_cn ? '刚刚' : 'Just now'
		if (diffMin < 60) return is_cn ? `${diffMin}分钟前` : `${diffMin}m ago`
		if (diffHour < 24) return is_cn ? `${diffHour}小时前` : `${diffHour}h ago`
		if (diffDay < 7) return is_cn ? `${diffDay}天前` : `${diffDay}d ago`
		return d.toLocaleDateString()
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<div className={styles.titleContainer}>
					<div className={styles.titleGroup}>
						<Icon name='material-workspaces' size={24} />
						<h1 className={styles.title}>{is_cn ? '工作空间' : 'Workspaces'}</h1>
					</div>
					<Button type='primary' size='small' icon={<Icon name='material-add' size={12} />} onClick={onCreate}>
						{is_cn ? '创建' : 'Create'}
					</Button>
				</div>

				<div className={styles.searchWrapper}>
					<Input
						size='large'
						prefix={<SearchOutlined />}
						placeholder={is_cn ? '搜索工作空间...' : 'Search workspaces...'}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className={styles.searchInput}
						allowClear
					/>
				</div>
			</div>

			<div className={styles.content}>
				{loading && workspaces.length === 0 ? (
					<div className={styles.empty}>
						<Spin />
						<span>{is_cn ? '加载中...' : 'Loading...'}</span>
					</div>
				) : filtered.length === 0 ? (
					<div className={styles.empty}>
						<Icon name='material-folder_off' size={48} />
						<div className={styles.emptyTitle}>
							{search
								? is_cn ? '未找到匹配的工作空间' : 'No matching workspaces'
								: is_cn ? '暂无工作空间' : 'No workspaces'}
						</div>
					</div>
				) : (
					<div className={styles.grid}>
						{filtered.map((ws) => {
							const env = ws.labels?.env || null
							const envInfo = env ? envLabel[env] : null

							return (
								<div key={ws.id} className={styles.gridItem}>
									<div className={styles.card} onClick={() => onSelect(ws)}>
										<div className={styles.cardInner}>
											{/* ── HEADER: icon + two rows ── */}
											<div className={styles.cardHeader}>
												<div className={styles.cardIcon}>
													<Icon name='material-folder' size={22} />
												</div>
												<div className={styles.headerRight}>
													<div className={styles.nameRow}>
														<span className={styles.cardName}>{ws.name}</span>
														{envInfo && (
															<span className={styles.envPill} style={{ color: envColors[env!] }}>
																{is_cn ? envInfo.cn : envInfo.en}
															</span>
														)}
														{nodeMap?.[ws.node]?.system && (
															<span className={styles.hostLabel}>
																{nodeMap[ws.node].system.os}/{nodeMap[ws.node].system.arch}
															</span>
														)}
													</div>
													<span className={styles.subLine}>
														{nodeMap?.[ws.node]?.system?.hostname || ws.id}
													</span>
												</div>
											</div>

											{/* ── FOOTER: addr + id + time ── */}
											<div className={styles.cardFooter}>
												<div className={styles.footLeft}>
													<span className={styles.chip}>
														<Icon name='material-dns' size={11} />
														{resolveNodeAddr(ws.node, nodeMap)}
													</span>
												</div>
												<span className={styles.footTime}>{formatDate(ws.updated_at)}</span>
											</div>
										</div>
									</div>
								</div>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}

export default WorkspaceList
