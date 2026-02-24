export interface PickerItem {
	value: string
	label: string
	description?: string
	avatar?: string
	tags?: string[]
	tools?: string[]
}

export interface AgentPickerFilter {
	types?: string[]
	automated?: boolean
	mentionable?: boolean
	built_in?: boolean
	sandbox?: boolean
	tags?: string[]
	connector?: string
}

export interface AgentPickerProps {
	visible: boolean
	onClose: () => void
	onConfirm: (selected: PickerItem[]) => void
	type: 'assistant' | 'mcp'
	mode: 'single' | 'multiple'
	value?: PickerItem[]
	expandTools?: boolean
	title?: string
	filter?: AgentPickerFilter
}
