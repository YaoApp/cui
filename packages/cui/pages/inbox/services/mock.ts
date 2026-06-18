import type { InboxMessage, InboxAPI } from '../types'

const now = Date.now()
const minutes = (n: number) => n * 60_000
const hours = (n: number) => n * 3600_000

const mockMessages: InboxMessage[] = [
	{
		id: 'inbox-1',
		type: 'task_input',
		source: { type: 'kanban', id: 'board-1', name: '业务工作台', task_title: '代码审查任务', task_number: 127 },
		priority: 'high',
		title: '代码审查任务需要确认',
		body: '发现一个潜在安全隐患：auth.ts 中的 token 验证缺少过期检查。是否需要我自动修复？',
		task_id: 'task-1',
		chat_id: 'chat-inbox-1',
		assistant_id: 'ast-research',
		read: false,
		archived: false,
		starred: false,
		created_at: now - minutes(3)
	},
	{
		id: 'inbox-2',
		type: 'task_input',
		source: { type: 'kanban', id: 'board-1', name: '业务工作台', task_title: '数据库方案选型', task_number: 128 },
		priority: 'high',
		title: '数据库方案选型',
		body: '请从三种方案中选择：PostgreSQL、MongoDB、MySQL。我已经分析了各自的优劣势，包括性能基准测试、运维成本和团队熟悉度。',
		task_id: 'task-3',
		chat_id: 'chat-inbox-2',
		assistant_id: 'ast-data',
		read: false,
		archived: false,
		starred: true,
		created_at: now - minutes(10)
	},
	{
		id: 'inbox-3',
		type: 'task_input',
		source: { type: 'kanban', id: 'board-1', name: '业务工作台', task_title: 'UI 设计稿确认', task_number: 130 },
		priority: 'medium',
		title: 'UI 设计稿确认',
		body: '请确认以下页面布局是否满足需求。我已按照设计规范完成了首页和设置页的高保真稿，包含响应式断点适配。',
		task_id: 'task-5',
		chat_id: 'chat-inbox-3',
		assistant_id: 'ast-content',
		read: false,
		archived: false,
		starred: false,
		created_at: now - minutes(30)
	},
	{
		id: 'inbox-4',
		type: 'task_completed',
		source: { type: 'kanban', id: 'board-1', name: '业务工作台', task_title: '部署任务完成', task_number: 125 },
		priority: 'low',
		title: '部署任务完成',
		body: '预发环境部署成功，所有测试通过。服务已在 :8080 端口运行，监控大盘已同步更新。',
		task_id: 'task-2',
		chat_id: 'chat-inbox-4',
		assistant_id: 'ast-data',
		read: true,
		archived: false,
		starred: false,
		created_at: now - hours(1),
		read_at: now - minutes(50)
	},
	{
		id: 'inbox-5',
		type: 'task_failed',
		source: { type: 'kanban', id: 'board-2', name: '技术项目', task_title: '数据导入任务', task_number: 89 },
		priority: 'medium',
		title: '数据导入失败',
		body: '连接超时：无法连接到目标数据库 (host: db-prod-02, port: 5432)。已重试 3 次均失败，请检查网络和防火墙配置。',
		task_id: 'task-8',
		chat_id: 'chat-inbox-5',
		assistant_id: 'ast-data',
		read: false,
		archived: false,
		starred: true,
		created_at: now - hours(2)
	},
	{
		id: 'inbox-6',
		type: 'task_input',
		source: { type: 'kanban', id: 'board-1', name: '业务工作台', task_title: 'API 接口文档', task_number: 131 },
		priority: 'medium',
		title: 'API 接口文档需要补充',
		body: '用户模块的 RESTful 接口文档已生成，但缺少错误码说明和请求示例。需要你确认是否补充 WebSocket 接口部分。',
		task_id: 'task-3',
		chat_id: 'chat-inbox-6',
		assistant_id: 'ast-research',
		read: true,
		archived: false,
		starred: false,
		created_at: now - hours(3),
		read_at: now - hours(2)
	},
	{
		id: 'inbox-7',
		type: 'task_completed',
		source: { type: 'kanban', id: 'board-2', name: '技术项目', task_title: '性能优化', task_number: 90 },
		priority: 'low',
		title: '首页性能优化完成',
		body: 'Lighthouse 分数从 62 提升到 94。主要优化：图片懒加载、代码分割、关键 CSS 内联。FCP 从 3.2s 降到 0.8s。',
		task_id: 'task-2',
		chat_id: 'chat-inbox-7',
		assistant_id: 'ast-data',
		read: true,
		archived: false,
		starred: false,
		created_at: now - hours(4),
		read_at: now - hours(3)
	},
	{
		id: 'inbox-8',
		type: 'task_input',
		source: { type: 'kanban', id: 'board-1', name: '业务工作台', task_title: '权限系统设计', task_number: 132 },
		priority: 'high',
		title: '权限系统设计方案确认',
		body: '基于 RBAC 模型设计了三级权限体系（组织→角色→资源）。需要确认：是否支持自定义角色？数据权限是行级还是字段级？',
		task_id: 'task-5',
		chat_id: 'chat-inbox-8',
		assistant_id: 'ast-research',
		read: false,
		archived: false,
		starred: true,
		created_at: now - hours(5)
	},
	{
		id: 'inbox-9',
		type: 'task_failed',
		source: { type: 'kanban', id: 'board-2', name: '技术项目', task_title: '邮件服务', task_number: 91 },
		priority: 'medium',
		title: '邮件发送服务异常',
		body: 'SMTP 连接被拒绝 (error: 550 sender rejected)。可能是发件域名 SPF 记录未配置，建议检查 DNS 设置。',
		task_id: 'task-8',
		chat_id: 'chat-inbox-9',
		assistant_id: 'ast-data',
		read: true,
		archived: false,
		starred: false,
		created_at: now - hours(6),
		read_at: now - hours(5)
	},
	{
		id: 'inbox-10',
		type: 'task_input',
		source: { type: 'kanban', id: 'board-1', name: '业务工作台', task_title: '国际化方案', task_number: 133 },
		priority: 'medium',
		title: '国际化方案选择',
		body: '目前有两种方案：1) react-intl 运行时切换；2) 编译时生成多语言包。前者灵活但包体积大，后者性能好但部署复杂。',
		task_id: 'task-1',
		chat_id: 'chat-inbox-10',
		assistant_id: 'ast-content',
		read: false,
		archived: false,
		starred: false,
		created_at: now - hours(8)
	},
	{
		id: 'inbox-11',
		type: 'task_completed',
		source: { type: 'kanban', id: 'board-2', name: '技术项目', task_title: '监控告警', task_number: 92 },
		priority: 'low',
		title: '监控告警系统上线',
		body: '已完成 Prometheus + Grafana 部署，配置了 CPU/内存/磁盘/请求延迟四项告警规则。飞书 Webhook 通知已联调通过。',
		task_id: 'task-2',
		chat_id: 'chat-inbox-11',
		assistant_id: 'ast-data',
		read: true,
		archived: false,
		starred: false,
		created_at: now - hours(12),
		read_at: now - hours(10)
	},
	{
		id: 'inbox-12',
		type: 'task_input',
		source: { type: 'kanban', id: 'board-1', name: '业务工作台', task_title: '支付集成', task_number: 134 },
		priority: 'high',
		title: '支付渠道接入确认',
		body: '已完成支付宝和微信支付的沙箱联调。生产环境的商户证书需要你提供，另外需要确认是否支持境外 Stripe 支付。',
		task_id: 'task-5',
		chat_id: 'chat-inbox-12',
		assistant_id: 'ast-data',
		read: false,
		archived: false,
		starred: false,
		created_at: now - hours(16)
	}
]

let messages = [...mockMessages]

async function delay(ms = 100) {
	return new Promise((r) => setTimeout(r, ms))
}

export const services: InboxAPI = {
	async getMessages() {
		await delay()
		return [...messages]
	},

	async markAsRead(id: string) {
		await delay(50)
		messages = messages.map((m) => (m.id === id ? { ...m, read: true, read_at: Date.now() } : m))
	},

	async markAllRead() {
		await delay(50)
		const now = Date.now()
		messages = messages.map((m) => (m.read ? m : { ...m, read: true, read_at: now }))
	},

	async archiveMessage(id: string) {
		await delay(50)
		messages = messages.map((m) => (m.id === id ? { ...m, archived: true } : m))
	},

	async starMessage(id: string) {
		await delay(50)
		messages = messages.map((m) => (m.id === id ? { ...m, starred: true } : m))
	},

	async unstarMessage(id: string) {
		await delay(50)
		messages = messages.map((m) => (m.id === id ? { ...m, starred: false } : m))
	}
}
