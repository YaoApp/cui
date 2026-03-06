import { useState, useMemo } from 'react'
import { Input, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import type { BoxInfo, LifecyclePolicy } from '../../types'
import styles from './index.less'

interface ComputerListProps {
	boxes: BoxInfo[]
	loading: boolean
	onSelect: (box: BoxInfo) => void
	onStart: (box: BoxInfo) => void
	onStop: (box: BoxInfo) => void
	onRemove: (box: BoxInfo) => void
	onNodeConfig: () => void
	onVNC: (box: BoxInfo) => void
}

const policyLabel: Record<LifecyclePolicy, { cn: string; en: string; icon: string }> = {
	persistent: { cn: '持久', en: 'Persistent', icon: 'material-all_inclusive' },
	longrunning: { cn: '长程', en: 'Long-running', icon: 'material-schedule' },
	session: { cn: '会话', en: 'Session', icon: 'material-timer' },
	oneshot: { cn: '一次性', en: 'One-shot', icon: 'material-bolt' }
}

type FilterTab = 'running' | 'stopped' | 'all'

const ComputerList = ({ boxes, loading, onSelect, onStart, onStop, onRemove, onNodeConfig, onVNC }: ComputerListProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [search, setSearch] = useState('')
	const [activeTab, setActiveTab] = useState<FilterTab>('running')

	const counts = useMemo(
		() => ({
			running: boxes.filter((b) => b.status === 'running' || b.status === 'creating').length,
			stopped: boxes.filter((b) => b.status === 'stopped').length,
			all: boxes.length
		}),
		[boxes]
	)

	const tabItems: { key: FilterTab; label: string }[] = [
		{ key: 'running', label: is_cn ? '运行中' : 'Running' },
		{ key: 'stopped', label: is_cn ? '已停止' : 'Stopped' },
		{ key: 'all', label: is_cn ? '全部' : 'All' }
	]

	const filtered = useMemo(() => {
		let result = boxes
		if (activeTab === 'running') result = result.filter((b) => b.status === 'running' || b.status === 'creating')
		else if (activeTab === 'stopped') result = result.filter((b) => b.status === 'stopped')
		if (search.trim()) {
			const q = search.toLowerCase()
			result = result.filter(
				(b) =>
					b.id.toLowerCase().includes(q) ||
					b.image.toLowerCase().includes(q) ||
					b.pool.toLowerCase().includes(q) ||
					(b.workspace_id && b.workspace_id.toLowerCase().includes(q)) ||
					Object.values(b.labels).some((v) => v.toLowerCase().includes(q))
			)
		}
		return result
	}, [boxes, activeTab, search])

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

	const isOneShot = (box: BoxInfo) => box.policy === 'oneshot'

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<div className={styles.titleContainer}>
					<div className={styles.titleGroup}>
						<Icon name='material-computer' size={24} />
						<h1 className={styles.title}>{is_cn ? '电脑' : 'Computers'}</h1>
					</div>
					<Button size='small' icon={<Icon name='material-dns' size={12} />} onClick={onNodeConfig}>
						{is_cn ? '节点管理' : 'Nodes'}
					</Button>
				</div>

				<div className={styles.tabs}>
					{tabItems.map((t) => (
						<div
							key={t.key}
							className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
							onClick={() => setActiveTab(t.key)}
						>
							{t.label}
							<span className={styles.tabCount}>{counts[t.key]}</span>
						</div>
					))}
				</div>

				<div className={styles.searchWrapper}>
					<Input
						prefix={<SearchOutlined style={{ color: 'var(--color_text_grey)', fontSize: 16 }} />}
						placeholder={is_cn ? '搜索电脑名称、镜像、标签...' : 'Search name, image, labels...'}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className={styles.searchInput}
						allowClear
					/>
				</div>
			</div>

			<div className={styles.content}>
				{loading && boxes.length === 0 ? (
					<div className={styles.empty}>
						<Spin />
						<span>{is_cn ? '加载中...' : 'Loading...'}</span>
					</div>
				) : filtered.length === 0 ? (
					<div className={styles.empty}>
						<Icon name='material-desktop_access_disabled' size={48} />
						<div className={styles.emptyTitle}>
							{search
								? is_cn ? '未找到匹配结果' : 'No matches'
								: activeTab === 'running'
									? is_cn ? '没有运行中的电脑' : 'No running computers'
									: is_cn ? '暂无电脑' : 'No computers'}
						</div>
					</div>
				) : (
					<div className={styles.grid}>
						{filtered.map((box) => {
							const pol = policyLabel[box.policy]
							const canVNC = box.vnc && box.status === 'running' && !isOneShot(box)

							return (
								<div key={box.id} className={styles.gridItem}>
									<div className={`${styles.card} ${box.status === 'stopped' ? styles.cardDim : ''}`}>
										{/* Hover overlay */}
										<div className={styles.overlay}>
											{canVNC && (
												<div className={styles.overlayBtn} onClick={(e) => { e.stopPropagation(); onVNC(box) }}>
													<Icon name='material-desktop_windows' size={20} />
													<span>{is_cn ? '打开桌面' : 'Desktop'}</span>
												</div>
											)}
											<div className={styles.overlayBtn} onClick={(e) => { e.stopPropagation(); onSelect(box) }}>
												<Icon name='material-info' size={20} />
												<span>{is_cn ? '详情' : 'Details'}</span>
											</div>
										</div>

										<div className={styles.cardInner} onClick={() => onSelect(box)}>
											{/* ── HEADER: icon + name + status ── */}
											<div className={styles.cardHeader}>
												<div className={styles.cardIcon}>
													<Icon name='material-computer' size={22} />
												</div>
												<div className={styles.headerRight}>
													<div className={styles.nameRow}>
														<span className={styles.cardName}>{box.id}</span>
														<div className={`${styles.statusPill} ${styles[`st_${box.status}`]}`}>
															<span className={styles.statusDot} />
															{is_cn
																? box.status === 'running' ? '运行中' : box.status === 'stopped' ? '已停止' : '创建中'
																: box.status === 'running' ? 'Running' : box.status === 'stopped' ? 'Stopped' : 'Creating'}
														</div>
													</div>
													<span className={styles.imageLine}>{box.image}</span>
												</div>
											</div>

											{/* ── FOOTER: workspace + meta + time ── */}
											<div className={styles.cardFooter}>
												<div className={styles.footLeft}>
													<span className={styles.chip}>
														<Icon name='material-dns' size={11} />
														{box.pool}
													</span>
													<span className={styles.chip}>
													<Icon name={pol.icon} size={11} />
													{is_cn ? pol.cn : pol.en}
												</span>
													{box.workspace_name && (
														<span className={styles.chip}>
															<Icon name='material-workspaces' size={11} />
															{box.workspace_name}
														</span>
													)}
												</div>
												<span className={styles.footTime}>{formatDate(box.last_active)}</span>
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

export default ComputerList
