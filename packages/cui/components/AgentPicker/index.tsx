import { useEffect, useMemo, useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { Modal, Spin, Button, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import UserAvatar from '@/widgets/UserAvatar'
import { Agent as AgentAPI } from '@/openapi/agent'
import { MCP } from '@/openapi/mcp'
import type { Agent } from '@/openapi/agent/types'
import type { MCPServer } from '@/openapi/mcp/types'
import type { AgentPickerProps, PickerItem } from './types'
import styles from './index.less'

const AgentPicker = (props: AgentPickerProps) => {
	const { visible, onClose, onConfirm, type, mode, value, expandTools = false, filter } = props

	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const defaultTitle = type === 'assistant'
		? (is_cn ? '选择助手' : 'Select Assistant')
		: (is_cn ? '选择工具' : 'Select Tools')
	const title = props.title || defaultTitle

	const SIDEBAR_KEY = 'agent-picker-sidebar'
	const readSidebar = () => {
		try { return localStorage.getItem(SIDEBAR_KEY) === 'true' } catch { return false }
	}
	const writeSidebar = (v: boolean) => {
		try { localStorage.setItem(SIDEBAR_KEY, String(v)) } catch {}
	}

	const [search, setSearch] = useState('')
	const [searchOpen, setSearchOpen] = useState(false)
	const [activeTag, setActiveTag] = useState('all')
	const [selected, setSelected] = useState<PickerItem[]>([])
	const [sidebarCollapsed, setSidebarCollapsedRaw] = useState(readSidebar)
	const setSidebarCollapsed = (v: boolean) => {
		setSidebarCollapsedRaw(v)
		writeSidebar(v)
	}
	const searchInputRef = useRef<HTMLInputElement>(null)
	const bodyRef = useRef<HTMLDivElement>(null)

	const [assistants, setAssistants] = useState<Agent[]>([])
	const [mcpServers, setMCPServers] = useState<MCPServer[]>([])
	const [loading, setLoading] = useState(false)
	const loadedRef = useRef(false)

	useEffect(() => {
		if (!visible) return
		setSearch('')
		setSearchOpen(false)
		setActiveTag('all')
		setSelected(value || [])
	}, [visible, value])

	useEffect(() => {
		if (!visible || loadedRef.current || !window.$app?.openapi) return
		loadedRef.current = true
		setLoading(true)

		if (type === 'assistant') {
			const api = new AgentAPI(window.$app.openapi)
			api.assistants
				.List({
					select: ['assistant_id', 'name', 'avatar', 'description', 'tags', 'connector', 'sandbox', 'built_in'],
					locale: is_cn ? 'zh-cn' : 'en-us',
					pagesize: 200,
					...filter
				})
				.then((res) => {
					if (!window.$app.openapi.IsError(res)) {
						const data = window.$app.openapi.GetData(res)
						if (data?.data) setAssistants(data.data)
					}
				})
				.finally(() => setLoading(false))
		} else {
			const api = new MCP(window.$app.openapi)
			api.ListServers()
				.then((servers) => {
					if (servers) setMCPServers(servers)
				})
				.finally(() => setLoading(false))
		}
	}, [visible, type, is_cn])

	useEffect(() => {
		if (!visible) {
			loadedRef.current = false
		}
	}, [visible])

	useEffect(() => {
		if (searchOpen && searchInputRef.current) {
			searchInputRef.current.focus()
		}
	}, [searchOpen])

	const items: PickerItem[] = useMemo(() => {
		if (type === 'assistant') {
			return assistants.map((a) => ({
				value: a.assistant_id,
				label: a.name || a.assistant_id,
				description: a.description,
				avatar: a.avatar,
				tags: a.tags
			}))
		}
		return mcpServers.map((s) => ({
			value: s.value || s.name,
			label: s.label || s.name,
			description: s.description,
			tags: s.builtin ? ['Built-in'] : ['Custom']
		}))
	}, [type, assistants, mcpServers])

	const tags = useMemo(() => {
		const tagMap: Record<string, number> = {}
		items.forEach((item) => {
			(item.tags || []).forEach((t) => {
				tagMap[t] = (tagMap[t] || 0) + 1
			})
		})
		return Object.entries(tagMap)
			.sort((a, b) => b[1] - a[1])
			.map(([name, count]) => ({ name, count }))
	}, [items])

	const filteredItems = useMemo(() => {
		let result = items
		if (activeTag !== 'all') {
			result = result.filter((item) => item.tags?.includes(activeTag))
		}
		if (search.trim()) {
			const kw = search.trim().toLowerCase()
			result = result.filter(
				(item) =>
					item.label.toLowerCase().includes(kw) ||
					item.description?.toLowerCase().includes(kw) ||
					item.value.toLowerCase().includes(kw)
			)
		}
		return result
	}, [items, activeTag, search])

	const isSelected = useMemoizedFn((itemValue: string) => {
		return selected.some((s) => s.value === itemValue)
	})

	const handleCardClick = useMemoizedFn((item: PickerItem) => {
		if (mode === 'single') {
			onConfirm([item])
			onClose()
			return
		}
		setSelected((prev) => {
			if (prev.some((s) => s.value === item.value)) {
				return prev.filter((s) => s.value !== item.value)
			}
			return [...prev, item]
		})
	})

	const handleRemove = useMemoizedFn((itemValue: string) => {
		setSelected((prev) => prev.filter((s) => s.value !== itemValue))
	})

	const handleConfirm = useMemoizedFn(() => {
		onConfirm(selected)
		onClose()
	})

	const searchOpenRef = useRef(false)
	searchOpenRef.current = searchOpen

	const handleCancel = useMemoizedFn(() => {
		if (searchOpenRef.current) {
			closeSearch()
			return
		}
		onClose()
	})

	const handleClose = useMemoizedFn(() => {
		onClose()
	})

	const handleSearchToggle = useMemoizedFn(() => {
		if (searchOpen) {
			closeSearch()
		} else {
			setSearchOpen(true)
		}
	})

	const closeSearch = useMemoizedFn(() => {
		setSearch('')
		setSearchOpen(false)
		requestAnimationFrame(() => bodyRef.current?.focus())
	})

	const handleSearchKeyDown = useMemoizedFn((e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			e.stopPropagation()
			closeSearch()
		}
	})

	const hasSidebar = type === 'assistant'

	const renderSidebar = () => {
		if (!hasSidebar || sidebarCollapsed) return null
		return (
			<div className={styles.sidebar}>
				<div className={styles.sidebarList}>
					<div
						className={`${styles.sidebarItem} ${activeTag === 'all' ? styles.active : ''}`}
						onClick={() => setActiveTag('all')}
					>
						<span className={styles.sidebarName}>{is_cn ? '全部' : 'All'}</span>
						<span className={styles.sidebarCount}>{items.length}</span>
					</div>
					{tags.map((tag) => (
						<div
							key={tag.name}
							className={`${styles.sidebarItem} ${activeTag === tag.name ? styles.active : ''}`}
							onClick={() => setActiveTag(tag.name)}
						>
							<span className={styles.sidebarName}>{tag.name}</span>
							<span className={styles.sidebarCount}>{tag.count}</span>
						</div>
					))}
				</div>
			</div>
		)
	}

	const renderSearchBar = () => {
		if (!searchOpen) return null
		return (
			<div className={styles.floatingSearch}>
				<div className={styles.searchBox}>
					<Icon name='icon-search' size={14} className={styles.searchIcon} />
					<input
						ref={searchInputRef}
						type='text'
						className={styles.searchInput}
						placeholder={is_cn ? '搜索...' : 'Search...'}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyDown={handleSearchKeyDown}
					/>
					<div className={styles.searchClose} onClick={handleSearchToggle}>
						<Icon name='icon-x' size={12} />
					</div>
				</div>
			</div>
		)
	}

	const renderCards = () => {
		if (loading) {
			return (
				<div className={styles.stateContainer}>
					<Spin />
					<span className={styles.stateText}>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			)
		}

		if (filteredItems.length === 0) {
			return (
				<div className={styles.stateContainer}>
					<Icon name='icon-inbox' size={40} />
					<span className={styles.stateTitle}>
						{search || activeTag !== 'all'
							? (is_cn ? '未找到匹配项' : 'No matches found')
							: (is_cn ? '暂无数据' : 'No data')}
					</span>
					{(search || activeTag !== 'all') && (
						<Button
							type='link'
							size='small'
							onClick={() => { setSearch(''); setActiveTag('all') }}
						>
							{is_cn ? '清除筛选' : 'Clear filters'}
						</Button>
					)}
				</div>
			)
		}

		return (
			<div className={styles.cardGrid}>
				{filteredItems.map((item) => {
					const checked = isSelected(item.value)
					return (
						<div
							key={item.value}
							className={`${styles.card} ${checked ? styles.cardSelected : ''}`}
							onClick={() => handleCardClick(item)}
						>
							<div className={styles.cardHeader}>
								<div className={styles.cardAvatar}>
									{type === 'assistant' ? (
										<UserAvatar
											size='sm'
											shape='circle'
											displayType='avatar'
											data={{
												id: item.value,
												name: item.label,
												avatar: item.avatar
											}}
										/>
									) : (
										<div className={styles.mcpIcon}>
											<Icon name='icon-server' size={18} />
										</div>
									)}
								</div>
								<div className={styles.cardInfo}>
									<div className={styles.cardName} title={item.label}>
										{item.label}
									</div>
									{item.description && (
										<div className={styles.cardDesc} title={item.description}>
											{item.description}
										</div>
									)}
								</div>
								<div className={styles.cardCheck}>
									{checked ? (
										<Icon name='icon-check-circle' size={18} />
									) : (
										<Icon name='icon-circle' size={18} />
									)}
								</div>
							</div>
						</div>
					)
				})}
			</div>
		)
	}

	const renderFooter = () => {
		if (mode === 'single') return null
		return (
			<div className={styles.footer}>
				<div className={styles.footerLeft}>
					{selected.length === 0 ? (
						<span className={styles.emptyText}>
							{is_cn ? '未选择任何项目' : 'No items selected'}
						</span>
					) : (
						<div className={styles.selectedChips}>
							{selected.map((item) => (
								<div key={item.value} className={styles.chip}>
									<span className={styles.chipLabel} title={item.label}>
										{item.label}
									</span>
									<Icon
										name='icon-x'
										size={12}
										className={styles.chipRemove}
										onClick={(e: React.MouseEvent) => {
											e.stopPropagation()
											handleRemove(item.value)
										}}
									/>
								</div>
							))}
						</div>
					)}
				</div>
				<div className={styles.footerRight}>
					<Button type='primary' onClick={handleConfirm} disabled={selected.length === 0}>
						{is_cn ? '确定' : 'Confirm'}
						{selected.length > 0 && ` (${selected.length})`}
					</Button>
				</div>
			</div>
		)
	}

	return (
		<Modal
			title={
				<div className={styles.header}>
					<div className={styles.headerLeft}>
						{hasSidebar && (
							<Tooltip title={sidebarCollapsed
								? (is_cn ? '展开分类' : 'Show categories')
								: (is_cn ? '收起分类' : 'Hide categories')
							}>
								<div
									className={styles.sidebarToggle}
									onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
								>
									<Icon name='icon-sidebar' size={16} />
								</div>
							</Tooltip>
						)}
						<span className={styles.title}>{title}</span>
					</div>
					<div className={styles.headerRight}>
						<Tooltip title={is_cn ? '搜索' : 'Search'}>
							<div
								className={`${styles.headerBtn} ${searchOpen ? styles.headerBtnActive : ''}`}
								onClick={handleSearchToggle}
							>
								<Icon name='icon-search' size={16} />
							</div>
						</Tooltip>
						<div className={styles.closeBtn} onClick={handleClose}>
							<Icon name='icon-x' size={16} />
						</div>
					</div>
				</div>
			}
			open={visible}
			onCancel={handleCancel}
			footer={renderFooter()}
			width={'85vw'}
			centered
			destroyOnClose
			closable={false}
			maskClosable
			wrapClassName={styles.pickerModalWrap}
			className={styles.pickerModal}
		>
			<div className={styles.body} ref={bodyRef} tabIndex={-1} style={{ outline: 'none' }}>
				{renderSidebar()}
				<div className={styles.contentPanel}>
					{renderSearchBar()}
					<div className={styles.content}>
						{renderCards()}
					</div>
				</div>
			</div>
		</Modal>
	)
}

export default AgentPicker
export type { AgentPickerProps, PickerItem } from './types'
