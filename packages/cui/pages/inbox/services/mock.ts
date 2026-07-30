import type { InboxMessage, InboxAPI, InboxStatsData } from '../types'

const now = Date.now()
const minutes = (n: number) => n * 60_000
const hours = (n: number) => n * 3600_000

const mockMessages: InboxMessage[] = [
	{
		id: 'inbox-1',
		type: 'input',
		source: { type: 'kanban', id: 'board-1', name: '业务工作台', task_title: '代码审查任务', task_number: 127 },
		priority: 'high',
		title: '代码审查任务需要确认',
		body: '发现一个潜在安全隐患：auth.ts 中的 token 验证缺少过期检查。是否需要我自动修复？',
		task_id: 'task-1',
		chat_id: 'chat-inbox-1',
		assistant_id: 'ast-research',
		bookmarked: false,
		inbox_pinned: true,
		has_unread: true,
		created_at: now - minutes(3)
	},
	{
		id: 'inbox-2',
		type: 'input',
		source: { type: 'kanban', id: 'board-1', name: '业务工作台', task_title: '数据库方案选型', task_number: 128 },
		priority: 'high',
		title: '数据库方案选型',
		body: '请从三种方案中选择：PostgreSQL、MongoDB、MySQL。我已经分析了各自的优劣势。',
		task_id: 'task-3',
		chat_id: 'chat-inbox-2',
		assistant_id: 'ast-data',
		bookmarked: true,
		inbox_pinned: false,
		has_unread: true,
		created_at: now - minutes(10)
	},
	{
		id: 'inbox-3',
		type: 'input',
		source: { type: 'kanban', id: 'board-1', name: '业务工作台', task_title: 'UI 设计稿确认', task_number: 130 },
		priority: 'medium',
		title: 'UI 设计稿确认',
		body: '请确认以下页面布局是否满足需求。',
		task_id: 'task-5',
		chat_id: 'chat-inbox-3',
		assistant_id: 'ast-content',
		bookmarked: false,
		inbox_pinned: false,
		has_unread: true,
		created_at: now - minutes(30)
	},
	{
		id: 'inbox-4',
		type: 'completed',
		source: { type: 'kanban', id: 'board-1', name: '业务工作台', task_title: '部署任务完成', task_number: 125 },
		priority: 'low',
		title: '部署任务完成',
		body: '预发环境部署成功，所有测试通过。',
		task_id: 'task-2',
		chat_id: 'chat-inbox-4',
		assistant_id: 'ast-data',
		bookmarked: false,
		inbox_pinned: false,
		has_unread: false,
		inbox_read_at: now - minutes(50),
		created_at: now - hours(1)
	},
	{
		id: 'inbox-5',
		type: 'failed',
		source: { type: 'kanban', id: 'board-2', name: '技术项目', task_title: '数据导入任务', task_number: 89 },
		priority: 'medium',
		title: '数据导入失败',
		body: '连接超时：无法连接到目标数据库。',
		task_id: 'task-8',
		chat_id: 'chat-inbox-5',
		assistant_id: 'ast-data',
		bookmarked: true,
		inbox_pinned: true,
		has_unread: true,
		created_at: now - hours(2)
	}
]

let messages = [...mockMessages]

async function delay(ms = 100) {
	return new Promise((r) => setTimeout(r, ms))
}

export const services: InboxAPI = {
	async getStats(): Promise<InboxStatsData> {
		await delay()
		return {
			all: messages.length,
			bookmarked: messages.filter((m) => m.bookmarked).length,
			input: messages.filter((m) => m.type === 'input').length,
			completed: messages.filter((m) => m.type === 'completed').length,
			failed: messages.filter((m) => m.type === 'failed').length,
			archived: 0
		}
	},

	async getMessages() {
		await delay()
		return { items: [...messages], total: messages.length }
	},

	async viewTask(chatId: string) {
		await delay(50)
		messages = messages.map((m) => (m.chat_id === chatId ? { ...m, has_unread: false, inbox_read_at: Date.now() } : m))
	},

	async markAllRead() {
		await delay(50)
		const now = Date.now()
		messages = messages.map((m) => (m.has_unread ? { ...m, has_unread: false, inbox_read_at: now } : m))
	},

	async bookmarkTask(chatId: string) {
		await delay(50)
		messages = messages.map((m) => (m.chat_id === chatId ? { ...m, bookmarked: true } : m))
	},

	async unbookmarkTask(chatId: string) {
		await delay(50)
		messages = messages.map((m) => (m.chat_id === chatId ? { ...m, bookmarked: false } : m))
	},

	async pinTask(chatId: string) {
		await delay(50)
		messages = messages.map((m) => (m.chat_id === chatId ? { ...m, inbox_pinned: true } : m))
	},

	async unpinTask(chatId: string) {
		await delay(50)
		messages = messages.map((m) => (m.chat_id === chatId ? { ...m, inbox_pinned: false } : m))
	},

	async archiveTask(_chatId: string) {
		await delay(50)
	},

	async unarchiveTask(_chatId: string, _columnId: string) {
		await delay(50)
	},

	async deleteGroup(_chatId: string) {
		await delay(50)
	}
}
