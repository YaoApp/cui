export interface TableColumn<T = any> {
	key: string
	title: string
	dataIndex: string
	width?: number | string
	minWidth?: number
	maxWidth?: number
	flex?: number // flex 布局权重
	align?: 'left' | 'center' | 'right'
	render?: (value: any, record: T, index: number) => React.ReactNode
	sorter?: boolean | ((a: T, b: T) => number)
	fixed?: 'left' | 'right'
	ellipsis?: boolean
	resizable?: boolean // 是否可拖拽调整宽度
}

// 列宽配置接口
export interface ColumnWidthConfig {
	[columnKey: string]: {
		width?: number | string
		minWidth?: number
		maxWidth?: number
		flex?: number
	}
}

// 预设的列宽配置
export const DEFAULT_COLUMN_WIDTHS = {
	compact: {
		scenario: { width: 80, minWidth: 60 },
		source: { width: 100, minWidth: 80 },
		query: { flex: 2, minWidth: 150 },
		context: { width: 100, minWidth: 80 },
		score: { width: 70, minWidth: 60 },
		created_at: { width: 130, minWidth: 120 },
		actions: { width: 80, minWidth: 60 }
	},
	normal: {
		scenario: { width: 100, minWidth: 80 },
		source: { width: 120, minWidth: 100 },
		query: { flex: 2, minWidth: 200 },
		context: { width: 120, minWidth: 100 },
		score: { width: 80, minWidth: 70 },
		created_at: { width: 150, minWidth: 130 },
		actions: { width: 100, minWidth: 80 }
	},
	wide: {
		scenario: { width: 120, minWidth: 100 },
		source: { width: 140, minWidth: 120 },
		query: { flex: 3, minWidth: 250 },
		context: { width: 140, minWidth: 120 },
		score: { width: 90, minWidth: 80 },
		created_at: { width: 180, minWidth: 150 },
		actions: { width: 120, minWidth: 100 }
	}
} as const

export type ColumnWidthPreset = keyof typeof DEFAULT_COLUMN_WIDTHS

export interface TableFilter {
	key: string
	label: string
	type: 'select' | 'search' | 'dateRange'
	options?: { label: string; value: any }[]
	placeholder?: string
	value?: any
	onChange?: (value: any) => void
}

export interface TableAction<T = any> {
	key: string
	label: string
	icon?: React.ReactNode
	type?: 'primary' | 'default' | 'text' | 'link' | 'ghost' | 'dashed'
	onClick?: (record: T, index: number) => void
	disabled?: (record: T) => boolean
	visible?: (record: T) => boolean
}

export interface DataTableProps<T = any> {
	// 数据相关
	data: T[] | null
	columns: TableColumn<T>[]
	loading?: boolean
	total?: number // 总记录数
	rowKey?: string | ((record: T, index: number) => string) // 行的唯一标识符

	// 列宽配置
	columnWidths?: ColumnWidthConfig
	columnWidthPreset?: ColumnWidthPreset
	autoFitColumns?: boolean // 是否自动适应容器宽度

	// 分页相关
	pagination?:
		| {
				current: number
				pageSize: number
				total: number
				showSizeChanger?: boolean
				showQuickJumper?: boolean
				showTotal?: boolean
				onChange?: (page: number, pageSize: number) => void
		  }
		| false

	// 筛选相关
	filters?: TableFilter[]
	searchPlaceholder?: string
	onSearch?: (value: string) => void
	extraActions?: React.ReactNode // 额外的操作按钮

	// 操作相关
	actions?: TableAction<T>[]
	rowSelection?: {
		type: 'checkbox' | 'radio'
		selectedRowKeys?: React.Key[]
		onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void
	}

	// 样式相关
	size?: 'small' | 'middle' | 'large'
	bordered?: boolean
	showHeader?: boolean

	// 事件相关
	onRow?: (record: T, index?: number) => React.HTMLAttributes<HTMLTableRowElement>

	// 响应式相关
	scroll?: {
		x?: number | string
		y?: number | string
	}

	// 无限滚动相关
	hasMore?: boolean // 是否还有更多数据
	onLoadMore?: () => void // 加载更多数据的回调
	loadingMore?: boolean // 是否正在加载更多

	// 空状态
	emptyText?: React.ReactNode
}
