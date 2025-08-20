import React from 'react'

export interface DetailField {
	key: string
	label: string
	value: any
	render?: (value: any, record: any) => React.ReactNode
	span?: number // 栅格占位，1-24
	type?: 'text' | 'tag' | 'time' | 'json' | 'custom'
	copyable?: boolean
}

export interface DetailSection {
	title?: string
	fields: DetailField[]
	collapsible?: boolean
	defaultCollapsed?: boolean
}

export interface DetailAction {
	key: string
	label: string
	icon?: React.ReactNode
	type?: 'primary' | 'default' | 'text' | 'link' | 'ghost' | 'dashed'
	danger?: boolean
	onClick?: (record: any) => void
	disabled?: (record: any) => boolean
	visible?: (record: any) => boolean
}

export interface DetailModalProps<T = any> {
	// 基础属性
	visible: boolean
	onClose: () => void
	title?: string
	width?: number | string

	// 数据相关
	data: T | null
	loading?: boolean

	// 内容配置
	sections?: DetailSection[]
	actions?: DetailAction[]

	// 样式配置
	size?: 'small' | 'middle' | 'large'
	bodyStyle?: React.CSSProperties

	// 自定义内容
	children?: React.ReactNode

	// 事件回调
	onRefresh?: () => void
}
