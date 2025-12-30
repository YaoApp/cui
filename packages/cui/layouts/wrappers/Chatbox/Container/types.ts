/**
 * Sidebar Tabs 类型定义
 */

/** Sidebar Tab */
export interface SidebarTab {
	/** 唯一标识 (nanoid) */
	id: string
	/** 页面 URL */
	url: string
	/** Tab 显示标题 */
	title: string
	/** 可选图标 */
	icon?: string
	/** 打开时间 */
	timestamp: number
}

/** Sidebar History Item */
export interface SidebarHistoryItem {
	/** 页面 URL */
	url: string
	/** 页面标题 */
	title: string
	/** 可选图标 */
	icon?: string
	/** 最后访问时间戳 */
	lastVisited: number
}

/** Sidebar Tabs 状态 */
export interface SidebarTabsState {
	/** Tab 列表 */
	tabs: SidebarTab[]
	/** 当前激活的 Tab ID */
	activeTabId: string | null
}

/** Header 组件 Props */
export interface SidebarHeaderProps {
	/** Tab 列表 */
	tabs: SidebarTab[]
	/** 当前激活的 Tab ID */
	activeTabId: string | null
	/** Tab 切换回调 */
	onTabChange: (tabId: string) => void
	/** Tab 关闭回调 */
	onTabClose: (tabId: string) => void
	/** History 按钮点击回调 */
	onHistoryClick: () => void
	/** History 是否打开 */
	historyOpen: boolean
	/** 关闭 Sidebar 回调 */
	onClose: () => void
	/** 是否最大化 */
	isMaximized?: boolean
	/** 最大化切换回调 */
	onToggleMaximize?: () => void
	/** 是否隐藏 Chatbox 相关 UI */
	noChatbox?: boolean
}

/** History 组件 Props */
export interface SidebarHistoryProps {
	/** 是否打开 */
	open: boolean
	/** 历史记录列表 */
	items: SidebarHistoryItem[]
	/** 当前激活的 Tab ID（用于高亮） */
	activeTabId: string | null
	/** 选择历史项回调 */
	onSelect: (item: SidebarHistoryItem) => void
	/** 删除历史项回调 */
	onDelete: (url: string) => void
	/** 清空历史回调 */
	onClear: () => void
	/** 关闭 History Panel 回调 */
	onClose: () => void
	/** 是否覆盖模式（窄屏时） */
	overlay?: boolean
}

/** Empty 组件 Props */
export interface SidebarEmptyProps {
	/** 自定义提示文字 */
	message?: string
}

/** Container 组件 Props（新增的 tabs 相关） */
export interface ContainerTabsProps {
	/** Tab 列表 */
	tabs: SidebarTab[]
	/** 当前激活的 Tab ID */
	activeTabId: string | null
	/** Tab 切换回调 */
	onTabChange: (tabId: string) => void
	/** Tab 关闭回调 */
	onTabClose: (tabId: string) => void
	/** History 相关 */
	historyOpen: boolean
	historyItems: SidebarHistoryItem[]
	onHistoryClick: () => void
	onHistoryClose: () => void
	onHistorySelect: (item: SidebarHistoryItem) => void
	onHistoryDelete: (url: string) => void
	onHistoryClear: () => void
}

