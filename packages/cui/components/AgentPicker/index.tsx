import { useEffect, useMemo, useRef, useState } from 'react'
import { useMemoizedFn, useDebounceFn } from 'ahooks'
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

const PAGE_SIZE = 50

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
	const [keywords, setKeywords] = useState('')
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
	const contentRef = useRef<HTMLDivElement>(null)

	const [assistants, setAssistants] = useState<Agent[]>([])
	const [mcpServers, setMCPServers] = useState<MCPServer[]>([])
	const [loading, setLoading] = useState(false)
	const [loadingMore, setLoadingMore] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [total, setTotal] = useState(0)
	const [hasMore, setHasMore] = useState(true)

	const [tags, setTags] = useState<{ name: string; count?: number }[]>([])
	const [tagsLoading, setTagsLoading] = useState(false)

	const filterKey = useMemo(() => JSON.stringify(filter || {}), [filter])

	useEffect(() => {
		if (!visible) return
		setSearch('')
		setKeywords('')
		setSearchOpen(false)
		setActiveTag('all')
		setSelected(value || [])
	}, [visible, value])

	const buildListFilter = useMemoizedFn((page: number, extraKeywords?: string, extraTag?: string) => {
		const params: Record<string, any> = {
			select: ['assistant_id', 'name', 'avatar', 'description', 'tags', 'connector', 'sandbox', 'built_in'],
			locale: is_cn ? 'zh-cn' : 'en-us',
			pagesize: PAGE_SIZE,
			page,
			...filter
		}
		if (extraKeywords) params.keywords = extraKeywords
		if (extraTag && extraTag !== 'all') params.tags = [extraTag]
		return params
	})

	const loadAssistants = useMemoizedFn(async (page: number, append: boolean) => {
		if (!window.$app?.openapi) return

		const isFirstPage = page === 1
		if (isFirstPage) setLoading(true)
		else setLoadingMore(true)

		try {
			const api = new AgentAPI(window.$app.openapi)
			const res = await api.assistants.List(buildListFilter(page, keywords, activeTag))
			if (window.$app.openapi.IsError(res)) return

			const data = window.$app.openapi.GetData(res)
			const newItems: Agent[] = Array.isArray(data?.data) ? data.data : []
			const serverTotal = typeof data?.total === 'number' ? data.total : 0

			if (append) {
				setAssistants((prev) => [...prev, ...newItems])
			} else {
				setAssistants(newItems)
			}
			setTotal(serverTotal)
			setCurrentPage(page)

			const loadedCount = append ? assistants.length + newItems.length : newItems.length
			setHasMore(loadedCount < serverTotal)
		} finally {
			if (isFirstPage) setLoading(false)
			else setLoadingMore(false)
		}
	})

	const loadTags = useMemoizedFn(async () => {
		if (!window.$app?.openapi || type !== 'assistant') return

		setTagsLoading(true)
		try {
			const api = new AgentAPI(window.$app.openapi)
			const tagsFilter: Record<string, any> = {
				locale: is_cn ? 'zh-cn' : 'en-us',
				...filter
			}
			if (keywords) tagsFilter.keywords = keywords

			const res = await api.tags.List(tagsFilter)
			if (window.$app.openapi.IsError(res)) return

			const tagsData = window.$app.openapi.GetData(res)
			if (!Array.isArray(tagsData)) return

			const formatted: { name: string }[] = tagsData.map((tag: any) => {
				if (typeof tag === 'string') return { name: tag }
				if (tag && typeof tag === 'object' && 'value' in tag) return { name: tag.label || tag.value }
				return { name: String(tag) }
			})
			setTags(formatted)
		} finally {
			setTagsLoading(false)
		}
	})

	const loadMCPServers = useMemoizedFn(async () => {
		if (!window.$app?.openapi) return

		setLoading(true)
		try {
			const api = new MCP(window.$app.openapi)
			const servers = await api.ListServers()
			if (servers) setMCPServers(servers)
		} finally {
			setLoading(false)
		}
	})

	// Load data when visible or filter conditions change
	useEffect(() => {
		if (!visible || !window.$app?.openapi) return

		if (type === 'assistant') {
			setAssistants([])
			setCurrentPage(1)
			setHasMore(true)
			loadAssistants(1, false)
			loadTags()
		} else {
			loadMCPServers()
		}
	}, [visible, type, is_cn, filterKey, keywords, activeTag])

	// Scroll to load more
	useEffect(() => {
		const container = contentRef.current
		if (!container || type !== 'assistant') return

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container
			if (scrollHeight - scrollTop - clientHeight < 50 && !loadingMore && hasMore) {
				loadAssistants(currentPage + 1, true)
			}
		}

		container.addEventListener('scroll', handleScroll)
		return () => container.removeEventListener('scroll', handleScroll)
	}, [loadingMore, hasMore, currentPage, type])

	// Large screen: fill viewport if first page doesn't produce a scrollbar
	useEffect(() => {
		if (
			type !== 'assistant' ||
			assistants.length === 0 ||
			loading ||
			loadingMore ||
			!hasMore ||
			assistants.length >= total
		) return

		const container = contentRef.current
		if (!container) return

		requestAnimationFrame(() => {
			const { scrollHeight, clientHeight } = container
			if (scrollHeight <= clientHeight) {
				loadAssistants(currentPage + 1, true)
			}
		})
	}, [assistants.length, loading, loadingMore, hasMore, total])

	// Reset loaded state when invisible
	useEffect(() => {
		if (visible) return
		setAssistants([])
		setMCPServers([])
		setTags([])
		setTotal(0)
		setCurrentPage(1)
		setHasMore(true)
	}, [visible])

	useEffect(() => {
		if (searchOpen && searchInputRef.current) {
			searchInputRef.current.focus()
		}
	}, [searchOpen])

	const { run: debouncedSetKeywords } = useDebounceFn(
		(val: string) => setKeywords(val),
		{ wait: 300 }
	)

	const handleSearchChange = useMemoizedFn((val: string) => {
		setSearch(val)
		debouncedSetKeywords(val.trim())
	})

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
			tags: s.tags
		}))
	}, [type, assistants, mcpServers])

	// MCP servers still use client-side filtering (no server-side support)
	const filteredItems = useMemo(() => {
		if (type === 'assistant') return items
		let result = items
		if (search.trim()) {
			const kw = search.trim().toLowerCase()
			result = result.filter(
				(item) =>
					item.label.toLowerCase().includes(kw) ||
					item.description?.toLowerCase().includes(kw) ||
					item.value.toLowerCase().includes(kw) ||
					item.tags?.some((t) => t.toLowerCase().includes(kw))
			)
		}
		return result
	}, [type, items, search])

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
		debouncedSetKeywords('')
		setKeywords('')
		setSearchOpen(false)
		requestAnimationFrame(() => bodyRef.current?.focus())
	})

	const handleSearchKeyDown = useMemoizedFn((e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			e.stopPropagation()
			closeSearch()
		}
	})

	const handleTagClick = useMemoizedFn((tag: string) => {
		setActiveTag(tag)
	})

	const hasSidebar = true

	const renderSidebar = () => {
		if (!hasSidebar || sidebarCollapsed) return null
		return (
			<div className={styles.sidebar}>
				<div className={styles.sidebarList}>
					<div
						className={`${styles.sidebarItem} ${activeTag === 'all' ? styles.active : ''}`}
						onClick={() => handleTagClick('all')}
					>
						<span className={styles.sidebarName}>{is_cn ? '全部' : 'All'}</span>
						<span className={styles.sidebarCount}>{total}</span>
					</div>
					{tagsLoading && tags.length === 0 ? (
						<div className={styles.sidebarItem}>
							<Spin size='small' />
						</div>
					) : (
						tags.map((tag) => (
							<div
								key={tag.name}
								className={`${styles.sidebarItem} ${activeTag === tag.name ? styles.active : ''}`}
								onClick={() => handleTagClick(tag.name)}
							>
								<span className={styles.sidebarName}>{tag.name}</span>
							</div>
						))
					)}
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
						onChange={(e) => handleSearchChange(e.target.value)}
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
		if (loading && assistants.length === 0 && mcpServers.length === 0) {
			return (
				<div className={styles.stateContainer}>
					<Spin />
					<span className={styles.stateText}>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			)
		}

		if (filteredItems.length === 0 && !loading) {
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
							onClick={() => {
								setSearch('')
								debouncedSetKeywords('')
								setKeywords('')
								setActiveTag('all')
							}}
						>
							{is_cn ? '清除筛选' : 'Clear filters'}
						</Button>
					)}
				</div>
			)
		}

		return (
			<>
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
				{loadingMore && (
					<div className={styles.stateContainer} style={{ minHeight: 60, height: 'auto' }}>
						<Spin size='small' />
					</div>
				)}
			</>
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
					<div className={styles.content} ref={contentRef}>
						{renderCards()}
					</div>
				</div>
			</div>
		</Modal>
	)
}

export default AgentPicker
export type { AgentPickerProps, PickerItem } from './types'
