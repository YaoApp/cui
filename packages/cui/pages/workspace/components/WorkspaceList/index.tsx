import { useState, useMemo } from 'react'
import { Input, Spin, Tooltip, Popconfirm } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import type { Workspace } from '../../types'
import styles from './index.less'

interface WorkspaceListProps {
	workspaces: Workspace[]
	loading: boolean
	onSelect: (ws: Workspace) => void
	onDelete: (ws: Workspace) => void
	onCreate: () => void
}

const envColors: Record<string, string> = {
	production: 'var(--color_success)',
	staging: 'var(--color_warning)',
	development: 'var(--color_info)',
	testing: 'var(--color_mission_accent_purple)'
}

const WorkspaceList = ({ workspaces, loading, onSelect, onDelete, onCreate }: WorkspaceListProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [search, setSearch] = useState('')

	const filtered = useMemo(() => {
		if (!search.trim()) return workspaces
		const q = search.toLowerCase()
		return workspaces.filter(
			(ws) =>
				ws.name.toLowerCase().includes(q) ||
				ws.id.toLowerCase().includes(q) ||
				ws.node.toLowerCase().includes(q) ||
				Object.values(ws.labels).some((v) => v.toLowerCase().includes(q))
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
		if (diffMin < 60) return is_cn ? `${diffMin} 分钟前` : `${diffMin}m ago`
		if (diffHour < 24) return is_cn ? `${diffHour} 小时前` : `${diffHour}h ago`
		if (diffDay < 7) return is_cn ? `${diffDay} 天前` : `${diffDay}d ago`
		return d.toLocaleDateString()
	}

	return (
		<div className={styles.wrapper}>
			<div className={styles.header}>
				<div className={styles.titleContainer}>
					<div className={styles.titleWithIcon}>
						<Icon name='material-workspaces' size={24} style={{ color: 'var(--color_page_title)' }} />
						<h1 className={styles.title}>{is_cn ? '工作空间' : 'Workspaces'}</h1>
					</div>
					<Button
						type='primary'
						size='small'
						icon={<Icon name='material-add' size={12} />}
						onClick={onCreate}
					>
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
						className={styles.search}
						allowClear
					/>
				</div>
			</div>

			<div className={styles.content}>
				{loading && workspaces.length === 0 ? (
					<div className={styles.loading}>
						<Spin />
						<span>{is_cn ? '加载中...' : 'Loading...'}</span>
					</div>
				) : filtered.length === 0 ? (
					<div className={styles.empty}>
						<Icon name='material-folder_off' size={64} />
						<div className={styles.emptyTitle}>
							{search
								? is_cn ? '未找到匹配的工作空间' : 'No matching workspaces found'
								: is_cn ? '暂无工作空间' : 'No workspaces'}
						</div>
						<div className={styles.emptyDesc}>
							{search
								? is_cn ? '尝试调整搜索关键词' : 'Try adjusting your search keywords'
								: is_cn ? '创建您的第一个工作空间开始吧' : 'Create your first workspace to get started'}
						</div>
					</div>
				) : (
					<div className={styles.grid}>
						{filtered.map((ws) => {
							const env = ws.labels.env || null
							const labelEntries = Object.entries(ws.labels).filter(([k]) => k !== 'env')

							return (
								<div key={ws.id} className={styles.gridItem}>
									<div className={styles.card} onClick={() => onSelect(ws)}>
										<div className={styles.cardTop}>
											<div className={styles.cardIcon}>
												<Icon name='material-deployed_code' size={28} />
											</div>
											<div className={styles.cardMeta}>
												{env && (
													<span
														className={styles.envTag}
														style={{ color: envColors[env] || 'var(--color_text_grey)' }}
													>
														{env}
													</span>
												)}
											</div>
										</div>

										<div className={styles.cardBody}>
											<h3 className={styles.cardTitle}>{ws.name}</h3>
											<div className={styles.cardId}>
												<Icon name='material-tag' size={12} />
												<span>{ws.id}</span>
											</div>
										</div>

										<div className={styles.cardLabels}>
											{labelEntries.slice(0, 3).map(([k, v]) => (
												<Tooltip key={k} title={`${k}: ${v}`}>
													<span className={styles.label}>{v}</span>
												</Tooltip>
											))}
											{labelEntries.length > 3 && (
												<span className={styles.labelMore}>+{labelEntries.length - 3}</span>
											)}
										</div>

										<div className={styles.cardFooter}>
											<div className={styles.footerLeft}>
												<Tooltip title={ws.node}>
													<span className={styles.nodeChip}>
														<Icon name='material-dns' size={12} />
														{ws.node}
													</span>
												</Tooltip>
											</div>
											<div className={styles.footerRight}>
												<span className={styles.updateTime}>
													{formatDate(ws.updated_at)}
												</span>
												<Popconfirm
													title={
														is_cn
															? '确定要删除这个工作空间吗？此操作不可恢复！'
															: 'Delete this workspace? This action cannot be undone!'
													}
													onConfirm={(e) => {
														e?.stopPropagation()
														onDelete(ws)
													}}
													onCancel={(e) => e?.stopPropagation()}
													okText={is_cn ? '确认' : 'Confirm'}
													cancelText={is_cn ? '取消' : 'Cancel'}
												>
													<div className={styles.deleteAction} onClick={(e) => e.stopPropagation()}>
														<Icon name='material-delete' size={14} />
													</div>
												</Popconfirm>
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
