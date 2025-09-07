import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Input, Select, Button, Space, Typography, Tooltip, Empty, Spin } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import ActionButton from '../ActionButton'
import { DataTableProps, TableFilter, DEFAULT_COLUMN_WIDTHS, ColumnWidthConfig } from './types'
import styles from './index.less'

const { Search } = Input
const { Option } = Select
const { Text } = Typography

function DataTable<T extends Record<string, any>>({
	data,
	columns,
	loading = false,
	loadingMore = false,
	hasMore = false,
	onLoadMore,
	total,
	filters,
	searchPlaceholder,
	onSearch,
	extraActions,
	actions = [],
	emptyText,
	size = 'middle',
	columnWidths,
	columnWidthPreset = 'normal',
	autoFitColumns = false,
	rowKey
}: DataTableProps<T>) {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 将 null 转换为空数组，空值是正常的业务状态
	const safeData = data ?? []

	// 获取行的唯一key
	const getRowKey = (record: T, index: number): string => {
		if (typeof rowKey === 'function') {
			return rowKey(record, index)
		}
		if (typeof rowKey === 'string') {
			return record[rowKey] || `row-${index}`
		}
		// 默认使用 id 字段，如果没有则使用索引
		return record.id || `row-${index}`
	}

	const [searchValue, setSearchValue] = useState('')
	const [filterValues, setFilterValues] = useState<Record<string, any>>({})
	const tableRef = useRef<HTMLDivElement>(null)
	const tableBodyRef = useRef<HTMLDivElement>(null)
	const tableHeaderRef = useRef<HTMLDivElement>(null)

	// 合并列宽配置
	const columnWidthConfig = useMemo((): ColumnWidthConfig => {
		const preset = DEFAULT_COLUMN_WIDTHS[columnWidthPreset] || DEFAULT_COLUMN_WIDTHS.normal
		return { ...preset, ...columnWidths }
	}, [columnWidthPreset, columnWidths])

	// 应用列宽配置到列定义，并自动分配剩余宽度
	const enhancedColumns = useMemo(() => {
		const cols = columns.map((col) => {
			const widthConfig = columnWidthConfig[col.key as keyof ColumnWidthConfig]
			return {
				...col,
				width: col.width || widthConfig?.width,
				minWidth: col.minWidth || widthConfig?.minWidth,
				maxWidth: col.maxWidth || widthConfig?.maxWidth,
				flex: col.flex || widthConfig?.flex
			}
		})

		// 添加操作列
		if (actions.length > 0) {
			const actionsWidthConfig = columnWidthConfig.actions
			cols.push({
				key: 'actions',
				title: is_cn ? '操作' : 'Actions',
				dataIndex: 'actions',
				width: actionsWidthConfig?.width ?? Math.max(80, actions.length * 40),
				minWidth: actionsWidthConfig?.minWidth,
				maxWidth: actionsWidthConfig?.maxWidth,
				flex: actionsWidthConfig?.flex,
				align: 'center' as const,
				render: (_: any, record: T, index: number) => (
					<Space size='small'>
						{actions
							.filter((action) => (action.visible ? action.visible(record) : true))
							.map((action) => (
								<ActionButton
									key={action.key}
									icon={action.icon}
									iconSize={14}
									title={action.label}
									disabled={action.disabled ? action.disabled(record) : false}
									onClick={() => action.onClick?.(record, index)}
									danger={action.key === 'delete'}
								/>
							))}
					</Space>
				)
			})
		}

		// 自动分配宽度：如果有列没有设置宽度，给它们分配剩余空间
		const totalFixedWidth = cols.reduce((sum, col) => sum + (col.width ? Number(col.width) : 0), 0)
		const flexColumns = cols.filter((col) => !col.width)

		if (flexColumns.length > 0) {
			// 为没有固定宽度的列设置flex: 1，让它们平分剩余空间
			flexColumns.forEach((col) => {
				col.flex = col.flex || 1
			})
		}

		return cols
	}, [columns, actions, columnWidthConfig, is_cn])

	// 使用 Intersection Observer 监听最后一行的可见性
	useEffect(() => {
		if (!hasMore || !onLoadMore || loadingMore || safeData.length === 0) return

		let observer: IntersectionObserver | null = null

		// 延迟查找表格容器，确保DOM已渲染
		const timer = setTimeout(() => {
			const tableBody = tableBodyRef.current
			if (!tableBody) return

			// 获取所有表格行
			const allRows = tableBody.querySelectorAll(`.${styles.tableRow}`)

			// 获取最后一行
			const lastRow = allRows[allRows.length - 1]
			if (!lastRow || allRows.length === 0) {
				return
			}

			// 创建 Intersection Observer
			observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						// 当最后一行进入视口时触发加载
						if (entry.isIntersecting && !loadingMore) {
							onLoadMore()
						}
					})
				},
				{
					root: tableBody, // 使用表格体作为观察根元素
					rootMargin: '50px', // 提前50px触发加载
					threshold: 0 // 只要有一点点可见就触发
				}
			)

			observer.observe(lastRow)
		}, 100)

		return () => {
			clearTimeout(timer)
			if (observer) {
				observer.disconnect()
			}
		}
	}, [hasMore, onLoadMore, loadingMore, safeData.length])

	// 同步表头和表体的横向滚动
	useEffect(() => {
		const tableBody = tableBodyRef.current
		const tableHeader = tableHeaderRef.current

		if (!tableBody || !tableHeader) return

		const handleScroll = (event: Event) => {
			const scrollLeft = (event.target as HTMLElement).scrollLeft

			// 尝试直接设置scrollLeft
			tableHeader.scrollLeft = scrollLeft
			const newScrollLeft = tableHeader.scrollLeft

			// 如果scrollLeft无效，使用transform方法
			if (newScrollLeft === 0 && scrollLeft > 0) {
				tableHeader.style.transform = `translateX(-${scrollLeft}px)`
			} else {
				tableHeader.style.transform = ''
			}
		}

		tableBody.addEventListener('scroll', handleScroll)

		return () => {
			tableBody.removeEventListener('scroll', handleScroll)
		}
	}, [safeData.length])

	// 处理搜索
	const handleSearch = (value: string) => {
		setSearchValue(value)
		onSearch?.(value)
	}

	// 处理筛选
	const handleFilterChange = (key: string, value: any) => {
		setFilterValues((prev) => ({ ...prev, [key]: value }))
		// 这里可以添加筛选逻辑或回调
	}

	// 渲染筛选器
	const renderFilters = () => {
		if (!filters || filters.length === 0) return null

		return (
			<div className={styles.filtersContainer}>
				<div className={styles.filtersLeft}>
					{searchPlaceholder && (
						<Input
							placeholder={searchPlaceholder}
							value={searchValue}
							onChange={(e) => setSearchValue(e.target.value)}
							onPressEnter={() => handleSearch(searchValue)}
							style={{ width: 200 }}
							allowClear
						/>
					)}
					{filters.map((filter) => (
						<div key={filter.key} className={styles.filterItem}>
							{filter.type === 'select' && (
								<Select
									placeholder={filter.label}
									value={filterValues[filter.key]}
									onChange={(value) => {
										handleFilterChange(filter.key, value)
										filter.onChange?.(value)
									}}
									style={{ width: 140 }}
									allowClear
								>
									{filter.options?.map((option) => (
										<Option key={option.value} value={option.value}>
											{option.label}
										</Option>
									))}
								</Select>
							)}
							{filter.type === 'search' && (
								<Input
									placeholder={filter.placeholder || filter.label}
									value={filterValues[filter.key]}
									onChange={(e) => handleFilterChange(filter.key, e.target.value)}
									style={{ width: 150 }}
									allowClear
								/>
							)}
						</div>
					))}
					{searchPlaceholder && (
						<Button
							type='primary'
							onClick={() => handleSearch(searchValue)}
							className={styles.searchButton}
						>
							{is_cn ? '搜索' : 'Search'}
						</Button>
					)}
				</div>
				<div className={styles.filtersRight}>
					{extraActions && <div className={styles.extraActions}>{extraActions}</div>}
					<Text type='secondary' className={styles.totalText}>
						{is_cn
							? `共 ${total || safeData.length} 条`
							: `Total ${total || safeData.length} items`}
					</Text>
				</div>
			</div>
		)
	}

	// 渲染表格单元格内容
	const renderCellContent = useCallback((column: any, record: T, index: number) => {
		if (column.render) {
			return column.render(record[column.dataIndex], record, index)
		}
		return record[column.dataIndex]
	}, [])

	// 自定义空状态
	const customEmpty = emptyText || (
		<Empty
			image={<Icon name='material-inbox' size={48} />}
			description={<Text type='secondary'>{is_cn ? '暂无数据' : 'No data available'}</Text>}
		/>
	)

	if (loading && safeData.length === 0) {
		return (
			<div className={styles.dataTableContainer}>
				{renderFilters()}
				<div className={styles.loadingContainer}>
					<Icon name='material-hourglass_empty' size={32} />
					<Text type='secondary'>{is_cn ? '加载中...' : 'Loading...'}</Text>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.dataTableContainer} ref={tableRef}>
			{renderFilters()}
			<div className={styles.customTable}>
				{/* 表头 */}
				<div className={styles.tableHeader} ref={tableHeaderRef}>
					{enhancedColumns.map((column) => (
						<div
							key={column.key}
							className={styles.headerCell}
							style={{
								width: column.width,
								minWidth: column.minWidth,
								maxWidth: column.maxWidth,
								flex: column.flex,
								textAlign: column.align || 'left'
							}}
						>
							{column.title}
						</div>
					))}
				</div>

				{/* 表体 */}
				<div className={styles.tableBody} ref={tableBodyRef}>
					{safeData.length === 0 ? (
						<div className={styles.emptyContainer}>{customEmpty}</div>
					) : (
						safeData.map((record, rowIndex) => (
							<div key={getRowKey(record, rowIndex)} className={styles.tableRow}>
								{enhancedColumns.map((column) => (
									<div
										key={column.key}
										className={styles.bodyCell}
										style={{
											width: column.width,
											minWidth: column.minWidth,
											maxWidth: column.maxWidth,
											flex: column.flex,
											textAlign: column.align || 'left'
										}}
									>
										{renderCellContent(column, record, rowIndex)}
									</div>
								))}
							</div>
						))
					)}

					{/* 加载更多指示器 */}
					{loadingMore && (
						<div className={styles.loadingMore}>
							<Spin size='small' />
							<Text type='secondary' style={{ marginLeft: 8 }}>
								{is_cn ? '加载更多...' : 'Loading more...'}
							</Text>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default DataTable
