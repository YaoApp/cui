import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Typography, Empty, Spin } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import ActionButton from '../ActionButton'
import { PaginatedTableProps, TableColumn, TableAction } from './types'
import styles from './index.less'

const { Text } = Typography

function PaginatedTable<T extends Record<string, any>>({
	data,
	columns,
	loading = false,
	total = 0,
	current = 1,
	pageSize = 10,
	onPageChange,
	onPageSizeChange,
	showSizeChanger = true,
	showQuickJumper = false,
	showTotal = true,
	actions = [],
	emptyText,
	size = 'middle',
	rowKey
}: PaginatedTableProps<T>) {
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

	// 增强列定义，添加操作列
	const enhancedColumns = useMemo(() => {
		const cols = [...columns]

		// 添加操作列
		if (actions.length > 0) {
			cols.push({
				key: 'actions',
				title: is_cn ? '操作' : 'Actions',
				dataIndex: 'actions',
				width: Math.max(100, actions.length * 40),
				align: 'center' as const,
				render: (_: any, record: T, index: number) => (
					<div className={styles.actionsCell}>
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
					</div>
				)
			})
		}

		return cols
	}, [columns, actions, is_cn])

	// 渲染表格单元格内容
	const renderCellContent = useCallback((column: TableColumn<T>, record: T, index: number) => {
		if (column.render) {
			return column.render(record[column.dataIndex], record, index)
		}
		return record[column.dataIndex]
	}, [])

	// 处理分页变化
	const handlePageChange = useCallback(
		(page: number, size?: number) => {
			onPageChange?.(page, size || pageSize)
		},
		[onPageChange, pageSize]
	)

	// 处理页面大小变化
	const handlePageSizeChange = useCallback(
		(newPageSize: number) => {
			onPageSizeChange?.(1, newPageSize) // 改变页面大小时回到第一页
		},
		[onPageSizeChange]
	)

	// 自定义下拉选择状态
	const [isSelectOpen, setIsSelectOpen] = useState(false)
	const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down')
	const selectRef = useRef<HTMLDivElement>(null)

	// 点击外部关闭下拉菜单
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
				setIsSelectOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	// 计算下拉菜单弹出方向
	const calculateDropdownDirection = useCallback(() => {
		if (!selectRef.current) return

		const rect = selectRef.current.getBoundingClientRect()
		const viewportHeight = window.innerHeight
		const dropdownHeight = 4 * 28 + 8 // 4个选项 * 28px高度 + 一些边距
		const spaceBelow = viewportHeight - rect.bottom
		const spaceAbove = rect.top

		// 如果下方空间不够，且上方空间更充足，则向上弹出
		if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
			setDropdownDirection('up')
		} else {
			setDropdownDirection('down')
		}
	}, [])

	// 处理下拉菜单开关
	const handleSelectToggle = useCallback(() => {
		if (!isSelectOpen) {
			calculateDropdownDirection()
		}
		setIsSelectOpen(!isSelectOpen)
	}, [isSelectOpen, calculateDropdownDirection])

	// 自定义空状态
	const customEmpty = emptyText || (
		<Empty
			image={<Icon name='material-inbox' size={48} />}
			description={<Text type='secondary'>{is_cn ? '暂无数据' : 'No data available'}</Text>}
		/>
	)

	if (loading && safeData.length === 0) {
		return (
			<div className={styles.paginatedTableContainer}>
				<div className={styles.loadingContainer}>
					<Spin size='large' />
					<Text type='secondary' style={{ marginTop: 16 }}>
						{is_cn ? '加载中...' : 'Loading...'}
					</Text>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.paginatedTableContainer}>
			<div className={styles.customTable}>
				{/* 表头 */}
				<div className={styles.tableHeader}>
					{enhancedColumns.map((column) => (
						<div
							key={column.key}
							className={styles.headerCell}
							style={{
								width: column.width,
								minWidth: column.minWidth,
								textAlign: column.align || 'left'
							}}
						>
							{column.title}
						</div>
					))}
				</div>

				{/* 表体 */}
				<div className={styles.tableBody}>
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
											textAlign: column.align || 'left'
										}}
									>
										{renderCellContent(column, record, rowIndex)}
									</div>
								))}
							</div>
						))
					)}

					{/* 加载状态 */}
					{loading && safeData.length > 0 && (
						<div className={styles.loadingOverlay}>
							<Spin size='small' />
							<Text type='secondary' style={{ marginLeft: 8 }}>
								{is_cn ? '加载中...' : 'Loading...'}
							</Text>
						</div>
					)}
				</div>
			</div>

			{/* 自定义分页器 */}
			{total > 0 && (
				<div className={styles.paginationContainer}>
					{/* 分页信息 */}
					<div className={styles.paginationInfo}>
						{showTotal &&
							total > 0 &&
							(() => {
								const start = (current - 1) * pageSize + 1
								const end = Math.min(current * pageSize, total)
								return is_cn
									? `共 ${total.toLocaleString()} 条，第 ${start.toLocaleString()}-${end.toLocaleString()} 条`
									: `${start.toLocaleString()}-${end.toLocaleString()} of ${total.toLocaleString()} items`
							})()}
					</div>

					{/* 分页控制 */}
					<div className={styles.paginationControls}>
						{/* 每页条数选择 */}
						{showSizeChanger && (
							<div className={styles.pageSizeSelector}>
								<span className={styles.sizeLabel}>{is_cn ? '每页' : 'Show'}</span>
								<div className={styles.customSelect} ref={selectRef}>
									<div
										className={`${styles.selectButton} ${
											isSelectOpen ? styles.open : ''
										}`}
										onClick={handleSelectToggle}
									>
										{pageSize}
									</div>
									{isSelectOpen && (
										<div
											className={`${styles.selectDropdown} ${styles[dropdownDirection]}`}
										>
											{['10', '20', '50', '100'].map((size) => (
												<div
													key={size}
													className={`${styles.selectOption} ${
														Number(size) === pageSize
															? styles.selected
															: ''
													}`}
													onClick={() => {
														handlePageSizeChange(Number(size))
														setIsSelectOpen(false)
													}}
												>
													{size}
												</div>
											))}
										</div>
									)}
								</div>
								<span className={styles.sizeLabel}>{is_cn ? '条' : 'entries'}</span>
							</div>
						)}

						{/* 页码导航 */}
						<div className={styles.pageNavigation}>
							{/* 上一页 */}
							<Icon
								name='material-chevron_left'
								size={20}
								className={`${styles.navIcon} ${current <= 1 ? styles.disabled : ''}`}
								onClick={() => current > 1 && handlePageChange(current - 1, pageSize)}
							/>

							{/* 页码按钮 */}
							{(() => {
								const totalPages = Math.ceil(total / pageSize)
								const pages: JSX.Element[] = []

								// 简单的分页逻辑：显示当前页前后各2页
								let startPage = Math.max(1, current - 2)
								let endPage = Math.min(totalPages, current + 2)

								// 如果总页数很少，显示所有页码
								if (totalPages <= 7) {
									startPage = 1
									endPage = totalPages
								}

								// 第一页
								if (startPage > 1) {
									pages.push(
										<div
											key={1}
											className={`${styles.navButton} ${
												current === 1 ? styles.active : ''
											}`}
											onClick={() => handlePageChange(1, pageSize)}
										>
											1
										</div>
									)
									if (startPage > 2) {
										pages.push(
											<div key='ellipsis1' className={styles.pageEllipsis}>
												...
											</div>
										)
									}
								}

								// 中间页码
								for (let i = startPage; i <= endPage; i++) {
									pages.push(
										<div
											key={i}
											className={`${styles.navButton} ${
												current === i ? styles.active : ''
											}`}
											onClick={() => handlePageChange(i, pageSize)}
										>
											{i}
										</div>
									)
								}

								// 最后一页
								if (endPage < totalPages) {
									if (endPage < totalPages - 1) {
										pages.push(
											<div key='ellipsis2' className={styles.pageEllipsis}>
												...
											</div>
										)
									}
									pages.push(
										<div
											key={totalPages}
											className={`${styles.navButton} ${
												current === totalPages ? styles.active : ''
											}`}
											onClick={() => handlePageChange(totalPages, pageSize)}
										>
											{totalPages}
										</div>
									)
								}

								return pages
							})()}

							{/* 下一页 */}
							<Icon
								name='material-chevron_right'
								size={20}
								className={`${styles.navIcon} ${
									current >= Math.ceil(total / pageSize) ? styles.disabled : ''
								}`}
								onClick={() =>
									current < Math.ceil(total / pageSize) &&
									handlePageChange(current + 1, pageSize)
								}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default PaginatedTable
