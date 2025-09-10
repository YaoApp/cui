import React from 'react'

export interface TableColumn<T = any> {
	key: string
	title: string
	dataIndex: string
	width?: number | string
	minWidth?: number
	align?: 'left' | 'center' | 'right'
	render?: (value: any, record: T, index: number) => React.ReactNode
}

export interface TableAction<T = any> {
	key: string
	label: string
	icon?: React.ReactNode
	onClick?: (record: T, index: number) => void
	disabled?: (record: T) => boolean
	visible?: (record: T) => boolean
}

export interface PaginatedTableProps<T = any> {
	// 数据相关
	data: T[] | null
	columns: TableColumn<T>[]
	loading?: boolean
	total?: number
	rowKey?: string | ((record: T, index: number) => string)

	// 分页相关
	current?: number
	pageSize?: number
	onPageChange?: (page: number, pageSize: number) => void
	onPageSizeChange?: (current: number, size: number) => void
	showSizeChanger?: boolean
	showQuickJumper?: boolean
	showTotal?: boolean

	// 操作相关
	actions?: TableAction<T>[]

	// 样式相关
	size?: 'small' | 'middle' | 'large'

	// 空状态
	emptyText?: React.ReactNode
}
