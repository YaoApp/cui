import type { Message } from '@/openapi'
import type { Board, BoardSummary, BoardTemplate, Column, KanbanTask, CreateTaskData, ServiceBinding } from '../types'

function userMsg(id: string, content: string): Message {
	return { type: 'user_input', props: { content }, ui_id: id }
}

function aiMsg(id: string, content: string): Message {
	return { type: 'text', props: { content }, ui_id: id }
}

const now = Date.now()
const hours = (n: number) => n * 3600_000
const minutes = (n: number) => n * 60_000

// ─── Board 1: 业务工作台 ─────────────────────────────────

const board1Columns: Column[] = [
	{ id: 'col-1', board_id: 'board-1', title: '市场调研', position: 0, icon: 'material-search', color: '#6366F1' },
	{ id: 'col-2', board_id: 'board-1', title: '数据报告', position: 1, icon: 'material-bar_chart', color: '#3B82F6' },
	{ id: 'col-3', board_id: 'board-1', title: '内容运营', position: 2, icon: 'material-edit_note', color: '#F59E0B' },
	{ id: 'col-4', board_id: 'board-1', title: '客户洞察', position: 3, icon: 'material-group', color: '#22C55E' }
]

const board1Tasks: KanbanTask[] = [
	{
		id: 'task-1',
		title: '调研东南亚市场准入政策',
		description: '整理越南、泰国、印尼三国的市场准入要求，包括本地化合规、支付牌照、数据本地化等关键政策。',
		status: 'running',
		column_id: 'col-1',
		position: 0,
		progress: 40,
		current_step: '正在整理印尼 OJK 金融监管要求',
		last_message: '越南和泰国部分已完成，正在分析印尼 OJK 金融科技监管框架...',
		workspace: { id: 'ws-market', name: 'sea-market-research', path: '/workspace/sea-market', node_name: 'node-sg-01', status: 'online' },
		tags: ['东南亚', '合规'],
		assistant_id: 'ast-research',
		assistant_name: '市场研究助手',
		connector_name: 'Claude 4 Opus',
		sandbox: { type: 'docker', cpu: 2, memory: '4GB' },
		secrets_count: 3,
		computer: { id: 'comp-a1b2c3', status: 'running', mode: 'sandbox' },
		skills: [
			{ id: 'skill-web-search', name: 'Web Search', description: '搜索互联网获取实时信息' },
			{ id: 'skill-pdf-reader', name: 'PDF Reader', description: '解析 PDF 文档内容' }
		],
		schedule: {
			enabled: true,
			cron: '0 9 * * 1-5',
			next_run: '2026-06-23 09:00 (Mon)',
			history: [
				{ time: '2026-06-20 09:00', status: 'success' },
				{ time: '2026-06-19 09:00', status: 'success' },
				{ time: '2026-06-18 09:00', status: 'failed' }
			]
		},
		inputs: [
			{ name: '东南亚市场概览.pdf', path: '/inputs/sea-overview.pdf', size: 2_450_000, type: 'application/pdf', created_at: now - hours(4) },
			{ name: '合规清单模板.xlsx', path: '/inputs/compliance-template.xlsx', size: 56_000, type: 'application/xlsx', created_at: now - hours(4) }
		],
		services: [
			{ name: 'Dev Server', port: 3000, protocol: 'http', status: 'running', pid: 12345 },
			{ name: 'WebSocket API', port: 8080, protocol: 'websocket', status: 'running', pid: 12346 }
		],
		pinned: true,
		started_at: now - hours(2),
		created_at: now - hours(3),
		updated_at: now - minutes(12)
	},
	{
		id: 'task-2',
		title: '竞品功能对比分析',
		description: '对比主要竞品最近 3 个月的新功能上线情况，整理成对比矩阵。',
		status: 'completed',
		column_id: 'col-1',
		position: 1,
		progress: 100,
		outputs: [
			{ name: '竞品对比矩阵.xlsx', path: '/outputs/competitor-matrix.xlsx', size: 85_000, type: 'application/xlsx', created_at: now - hours(6) },
			{ name: '分析要点.md', path: '/outputs/analysis-summary.md', size: 12_400, type: 'text/markdown', created_at: now - hours(6) }
		],
		workspace: { id: 'ws-market', name: 'sea-market-research', path: '/workspace/sea-market', status: 'online' },
		tags: ['竞品', '分析'],
		assistant_id: 'ast-research',
		assistant_name: '市场研究助手',
		duration: 2 * 3600,
		started_at: now - hours(8),
		completed_at: now - hours(6),
		created_at: now - hours(10),
		updated_at: now - hours(6)
	},
	{
		id: 'task-3',
		title: '用户行业分布趋势报告',
		description: '用行业标签重新分类现有用户，并和去年同期对比，找出增长最快的行业。',
		status: 'waiting_input',
		column_id: 'col-1',
		position: 2,
		last_message: '在分类过程中发现约 15% 的用户缺少行业标签。请确认：是按注册信息推断，还是先排除这部分用户？',
		workspace: { id: 'ws-analytics', name: 'user-analytics', path: '/workspace/user-analytics', status: 'online' },
		tags: ['用户分析'],
		assistant_id: 'ast-data',
		assistant_name: '数据分析助手',
		started_at: now - hours(1),
		created_at: now - hours(2),
		updated_at: now - minutes(30)
	},
	{
		id: 'task-4',
		title: '生成 6 月份营收周报',
		description: '汇总本周各产品线营收数据，与上周及去年同期对比，自动生成图表和摘要。',
		status: 'running',
		column_id: 'col-2',
		position: 0,
		progress: 65,
		current_step: '生成对比图表',
		last_message: '数据已汇总完成，正在生成环比/同比对比图表，预计 5 分钟内完成。',
		workspace: { id: 'ws-finance', name: 'finance-reports', path: '/workspace/finance', status: 'online' },
		tags: ['营收', '周报'],
		assistant_id: 'ast-data',
		assistant_name: '数据分析助手',
		connector_name: 'GPT-4o',
		sandbox: { type: 'vm', cpu: 4, memory: '8GB' },
		secrets_count: 1,
		computer: { id: 'comp-d4e5f6', status: 'running', mode: 'host' },
		skills: [
			{ id: 'skill-chart-gen', name: 'Chart Generator', description: '生成数据可视化图表' },
			{ id: 'skill-sql', name: 'SQL Query', description: '执行 SQL 数据查询' },
			{ id: 'skill-excel', name: 'Excel Processor', description: '处理 Excel 文件' }
		],
		inputs: [
			{ name: '财务原始数据.csv', path: '/inputs/finance-raw.csv', size: 890_000, type: 'text/csv', created_at: now - minutes(30) },
			{ name: '模板样式.json', path: '/inputs/chart-template.json', size: 4_200, type: 'application/json', created_at: now - minutes(30) },
			{ name: '去年同期数据.xlsx', path: '/inputs/last-year-data.xlsx', size: 156_000, type: 'application/xlsx', created_at: now - minutes(30) }
		],
		services: [
			{ name: 'Jupyter Notebook', port: 8888, protocol: 'http', status: 'running', pid: 23456 },
			{ name: 'API Server', port: 5000, protocol: 'http', status: 'running', pid: 23457 },
			{ name: 'Live Reload', port: 35729, protocol: 'websocket', status: 'running', pid: 23458 }
		],
		started_at: now - minutes(20),
		created_at: now - minutes(25),
		updated_at: now - minutes(3)
	},
	{
		id: 'task-5',
		title: '用户留存率深度分析',
		description: '按注册渠道、行业、公司规模分维度分析 30/60/90 天留存率，找出流失关键节点。',
		status: 'completed',
		column_id: 'col-2',
		position: 1,
		progress: 100,
		outputs: [
			{ name: '留存率分析报告.pdf', path: '/outputs/retention-report.pdf', size: 340_000, type: 'application/pdf', created_at: now - hours(4) },
			{ name: '原始数据.csv', path: '/outputs/retention-data.csv', size: 1_200_000, type: 'text/csv', created_at: now - hours(4) }
		],
		workspace: { id: 'ws-analytics', name: 'user-analytics', path: '/workspace/user-analytics', status: 'online' },
		tags: ['留存', '用户分析'],
		assistant_id: 'ast-data',
		assistant_name: '数据分析助手',
		duration: 3 * 3600,
		started_at: now - hours(7),
		completed_at: now - hours(4),
		created_at: now - hours(8),
		updated_at: now - hours(4)
	},
	{
		id: 'task-6',
		title: '每日运营数据看板刷新',
		description: '每天早上 8:00 自动拉取前一天的核心运营指标（DAU、新增、付费），更新数据看板。',
		status: 'completed',
		column_id: 'col-2',
		position: 2,
		progress: 100,
		workspace: { id: 'ws-ops', name: 'ops-dashboard', path: '/workspace/ops', status: 'online' },
		schedule: { enabled: true, mode: 'times', times: ['08:00'], timezone: 'Asia/Shanghai' },
		run_count: 42,
		last_run: {
			run_number: 42,
			status: 'completed',
			started_at: now - hours(4),
			completed_at: now - hours(3.8),
			duration: 720,
			summary: '已更新：昨日 DAU 12,340（+3.2%），新增用户 580，付费转化 2.1%'
		},
		tags: ['运营', '日报'],
		assistant_id: 'ast-data',
		assistant_name: '数据分析助手',
		duration: 720,
		started_at: now - hours(4),
		completed_at: now - hours(3.8),
		created_at: now - hours(1008),
		updated_at: now - hours(3.8)
	},
	{
		id: 'task-7',
		title: '撰写产品更新公告',
		description: '根据本周上线的功能列表，撰写面向用户的产品更新公告，中英双语，适合邮件和公众号发布。',
		status: 'waiting_input',
		column_id: 'col-3',
		position: 0,
		last_message: '初稿已完成。有两个功能的描述需要确认：\n1. 「智能推荐」功能——面向用户强调"个性化"还是"效率提升"？\n2. 定价调整部分是否需要在公告中提及？',
		workspace: { id: 'ws-content', name: 'blog-content', path: '/workspace/blog', status: 'online' },
		tags: ['公告', '内容'],
		assistant_id: 'ast-content',
		assistant_name: '内容运营助手',
		started_at: now - hours(3),
		created_at: now - hours(4),
		updated_at: now - hours(1)
	},
	{
		id: 'task-8',
		title: '生成 SEO 优化文章',
		description: '围绕"企业数据分析平台"关键词簇，生成 3 篇 SEO 友好的博客文章。',
		status: 'running',
		column_id: 'col-3',
		position: 1,
		progress: 33,
		current_step: '撰写第 1 篇：企业数据分析的 5 个常见误区',
		last_message: '关键词分析完成，确定了 3 个主题方向。正在撰写第一篇...',
		workspace: { id: 'ws-content', name: 'blog-content', path: '/workspace/blog', status: 'online' },
		tags: ['SEO', '博客'],
		assistant_id: 'ast-content',
		assistant_name: '内容运营助手',
		started_at: now - minutes(40),
		created_at: now - hours(1),
		updated_at: now - minutes(8)
	},
	{
		id: 'task-9',
		title: '社交媒体素材批量生成',
		description: '根据最近的产品亮点，生成一周的社交媒体配文（微博、小红书、LinkedIn），每个平台风格不同。',
		status: 'failed',
		column_id: 'col-3',
		position: 2,
		progress: 50,
		error_message: '生成 LinkedIn 英文配文时遇到问题：翻译服务响应超时。微博和小红书部分已完成。',
		last_message: '微博和小红书的素材已保存到工作区。LinkedIn 部分需要重试，建议检查翻译服务可用性。',
		workspace: { id: 'ws-social', name: 'social-media', path: '/workspace/social', status: 'online' },
		tags: ['社媒', '内容'],
		assistant_id: 'ast-content',
		assistant_name: '内容运营助手',
		started_at: now - hours(1.5),
		created_at: now - hours(2),
		updated_at: now - minutes(20)
	},
	{
		id: 'task-10',
		title: '分析本月客户投诉主题',
		description: '从客服工单系统导出本月所有投诉记录，用主题聚类找出 Top 5 问题类别和趋势变化。',
		status: 'running',
		column_id: 'col-4',
		position: 0,
		progress: 55,
		current_step: '对 1,247 条工单进行主题聚类',
		last_message: '已完成数据清洗和预处理，正在进行主题聚类分析。初步看到"响应速度"和"功能缺失"是高频主题。',
		workspace: { id: 'ws-customer', name: 'customer-insights', path: '/workspace/customer', status: 'online' },
		tags: ['客服', '投诉分析'],
		assistant_id: 'ast-data',
		assistant_name: '数据分析助手',
		started_at: now - minutes(35),
		created_at: now - hours(1),
		updated_at: now - minutes(5)
	},
	{
		id: 'task-11',
		title: '企业客户满意度回访整理',
		description: '整理上周 20 家企业客户的回访记录，提取关键需求和满意度评分，生成摘要。',
		status: 'pending',
		column_id: 'col-4',
		position: 1,
		workspace: { id: 'ws-customer', name: 'customer-insights', path: '/workspace/customer', status: 'online' },
		tags: ['客户回访', '满意度'],
		assistant_id: 'ast-research',
		assistant_name: '市场研究助手',
		created_at: now - hours(3),
		updated_at: now - hours(3)
	},
	{
		id: 'task-12',
		title: '客户流失预警监控',
		description: '每天扫描用户活跃数据，识别近 7 天活跃度显著下降的付费客户，输出预警名单。',
		status: 'running',
		column_id: 'col-4',
		position: 2,
		progress: 100,
		current_step: '等待下次调度（每日 9:00）',
		last_message: '今日扫描完成：发现 8 个高风险客户（活跃度下降 >50%），已输出预警名单。',
		workspace: { id: 'ws-customer', name: 'customer-insights', path: '/workspace/customer', status: 'online' },
		schedule: { enabled: true, mode: 'times', times: ['09:00'], timezone: 'Asia/Shanghai' },
		run_count: 28,
		last_run: {
			run_number: 28,
			status: 'completed',
			started_at: now - hours(3),
			completed_at: now - hours(2.8),
			duration: 720,
			summary: '扫描 2,100 个付费账户 → 8 个高风险预警，已推送至客户成功团队。'
		},
		tags: ['流失预警', '自动化'],
		assistant_id: 'ast-data',
		assistant_name: '数据分析助手',
		pinned: true,
		started_at: now - hours(672),
		created_at: now - hours(720),
		updated_at: now - hours(2.8)
	}
]

// ─── Board 2: 产品迭代 ──────────────────────────────────

const board2Columns: Column[] = [
	{ id: 'col-2-1', board_id: 'board-2', title: '需求评审', position: 0, icon: 'material-rate_review', color: '#8B5CF6' },
	{ id: 'col-2-2', board_id: 'board-2', title: '设计开发', position: 1, icon: 'material-code', color: '#3B82F6' },
	{ id: 'col-2-3', board_id: 'board-2', title: '测试验收', position: 2, icon: 'material-bug_report', color: '#F59E0B' },
	{ id: 'col-2-4', board_id: 'board-2', title: '已上线', position: 3, icon: 'material-rocket_launch', color: '#22C55E' }
]

const board2Tasks: KanbanTask[] = [
	{
		id: 'task-2-1',
		title: '用户权限模块重构',
		description: '重新设计 RBAC 权限体系，支持自定义角色和细粒度资源授权。',
		status: 'running',
		column_id: 'col-2-2',
		position: 0,
		progress: 60,
		current_step: '实现角色继承逻辑',
		last_message: '基础 RBAC 模型已完成，正在实现角色继承和权限传递...',
		workspace: { id: 'ws-rbac', name: 'rbac-redesign', path: '/workspace/rbac', status: 'online' },
		assistant_id: 'ast-dev',
		assistant_name: '开发助手',
		pinned: true,
		started_at: now - hours(8),
		created_at: now - hours(24),
		updated_at: now - minutes(15)
	},
	{
		id: 'task-2-2',
		title: '移动端适配优化',
		description: '针对 iPad 和手机端进行响应式布局调整，优化触控交互体验。',
		status: 'waiting_input',
		column_id: 'col-2-2',
		position: 1,
		last_message: '发现 iPad 横屏和竖屏的侧边栏行为不一致。请确认：横屏时是否默认展开侧边栏？',
		workspace: { id: 'ws-mobile', name: 'mobile-adapt', path: '/workspace/mobile', status: 'online' },
		assistant_id: 'ast-dev',
		assistant_name: '开发助手',
		started_at: now - hours(4),
		created_at: now - hours(12),
		updated_at: now - hours(1)
	},
	{
		id: 'task-2-3',
		title: 'V2.5 版本发布准备',
		description: '整合 V2.5 所有功能分支，执行发布前检查清单，准备 changelog。',
		status: 'pending',
		column_id: 'col-2-1',
		position: 0,
		workspace: { id: 'ws-release', name: 'release-v25', path: '/workspace/release', status: 'online' },
		assistant_id: 'ast-dev',
		assistant_name: '开发助手',
		created_at: now - hours(6),
		updated_at: now - hours(6)
	},
	{
		id: 'task-2-4',
		title: 'API 性能压测报告',
		description: '对核心 API 接口进行压力测试，输出 QPS、P99 延迟、错误率等指标报告。',
		status: 'completed',
		column_id: 'col-2-3',
		position: 0,
		progress: 100,
		workspace: { id: 'ws-perf', name: 'perf-testing', path: '/workspace/perf', status: 'online' },
		assistant_id: 'ast-data',
		assistant_name: '数据分析助手',
		duration: 1800,
		started_at: now - hours(5),
		completed_at: now - hours(4.5),
		created_at: now - hours(8),
		updated_at: now - hours(4.5)
	},
	{
		id: 'task-2-5',
		title: '数据库索引优化',
		description: '分析慢查询日志，识别缺失索引并生成优化建议。',
		status: 'running',
		column_id: 'col-2-2',
		position: 2,
		progress: 45,
		current_step: '分析 Top 20 慢查询',
		last_message: '已识别 12 条高频慢查询，正在分析索引覆盖情况...',
		workspace: { id: 'ws-db', name: 'db-optimization', path: '/workspace/db', status: 'online' },
		assistant_id: 'ast-dev',
		assistant_name: '开发助手',
		started_at: now - hours(2),
		created_at: now - hours(3),
		updated_at: now - minutes(10)
	},
	{
		id: 'task-2-6',
		title: '国际化文案校对',
		description: '校对英文、日文界面翻译的准确性和一致性，标注需要修正的条目。',
		status: 'completed',
		column_id: 'col-2-4',
		position: 0,
		progress: 100,
		workspace: { id: 'ws-i18n', name: 'i18n-review', path: '/workspace/i18n', status: 'online' },
		assistant_id: 'ast-content',
		assistant_name: '内容运营助手',
		duration: 3600,
		started_at: now - hours(48),
		completed_at: now - hours(47),
		created_at: now - hours(72),
		updated_at: now - hours(47)
	},
	{
		id: 'task-2-7',
		title: '单元测试覆盖率提升',
		description: '为核心业务模块补充单元测试，目标覆盖率从 65% 提升到 80%。',
		status: 'running',
		column_id: 'col-2-3',
		position: 1,
		progress: 30,
		current_step: '编写用户模块测试用例',
		last_message: '已完成 auth 模块测试（覆盖率 92%），正在处理 user 模块...',
		workspace: { id: 'ws-test', name: 'unit-tests', path: '/workspace/tests', status: 'online' },
		assistant_id: 'ast-dev',
		assistant_name: '开发助手',
		started_at: now - hours(3),
		created_at: now - hours(6),
		updated_at: now - minutes(20)
	}
]

// ─── Board 3: 客户成功 ──────────────────────────────────

const board3Columns: Column[] = [
	{ id: 'col-3-1', board_id: 'board-3', title: '客户对接', position: 0, icon: 'material-handshake', color: '#EC4899' },
	{ id: 'col-3-2', board_id: 'board-3', title: '方案交付', position: 1, icon: 'material-inventory', color: '#8B5CF6' },
	{ id: 'col-3-3', board_id: 'board-3', title: '培训支持', position: 2, icon: 'material-school', color: '#14B8A6' }
]

const board3Tasks: KanbanTask[] = [
	{
		id: 'task-3-1',
		title: 'XX企业定制化部署',
		description: '根据客户需求完成私有化部署方案设计，包括网络架构、数据迁移和安全合规。',
		status: 'running',
		column_id: 'col-3-2',
		position: 0,
		progress: 70,
		current_step: '配置安全网关和证书',
		last_message: '数据迁移脚本已完成验证，正在配置生产环境的安全网关和 SSL 证书...',
		workspace: { id: 'ws-deploy-xx', name: 'xx-enterprise-deploy', path: '/workspace/xx-deploy', status: 'online' },
		assistant_id: 'ast-deploy',
		assistant_name: '部署助手',
		pinned: true,
		started_at: now - hours(48),
		created_at: now - hours(72),
		updated_at: now - hours(1)
	},
	{
		id: 'task-3-2',
		title: '新客户 Onboarding 流程',
		description: '为本月 5 家新签客户准备 onboarding 资料包，包括操作指南、最佳实践和 FAQ。',
		status: 'completed',
		column_id: 'col-3-1',
		position: 0,
		progress: 100,
		workspace: { id: 'ws-onboard', name: 'client-onboarding', path: '/workspace/onboarding', status: 'online' },
		assistant_id: 'ast-content',
		assistant_name: '内容运营助手',
		duration: 7200,
		started_at: now - hours(24),
		completed_at: now - hours(22),
		created_at: now - hours(48),
		updated_at: now - hours(22)
	},
	{
		id: 'task-3-3',
		title: '季度客户满意度调研',
		description: '设计并发送 Q2 客户满意度问卷，收集反馈数据并生成分析报告。',
		status: 'running',
		column_id: 'col-3-1',
		position: 1,
		progress: 40,
		current_step: '收集问卷回复（已收到 34/80）',
		last_message: '问卷已发送至 80 家核心客户，目前收回 34 份。初步 NPS 分数 72，高于上季度。',
		workspace: { id: 'ws-survey', name: 'customer-survey', path: '/workspace/survey', status: 'online' },
		schedule: { enabled: true, mode: 'interval', interval_value: 720, interval_unit: 'minutes', timezone: 'Asia/Shanghai' },
		run_count: 3,
		assistant_id: 'ast-research',
		assistant_name: '市场研究助手',
		started_at: now - hours(72),
		created_at: now - hours(168),
		updated_at: now - hours(2)
	},
	{
		id: 'task-3-4',
		title: '产品培训课件更新',
		description: '根据 V2.4 新功能更新培训课件和演示视频脚本。',
		status: 'waiting_input',
		column_id: 'col-3-3',
		position: 0,
		last_message: '课件初稿已完成。请确认以下两点：\n1. 新的数据看板功能是否需要录制单独的视频教程？\n2. 高级 API 部分是否对所有客户开放？',
		workspace: { id: 'ws-training', name: 'training-materials', path: '/workspace/training', status: 'online' },
		assistant_id: 'ast-content',
		assistant_name: '内容运营助手',
		started_at: now - hours(6),
		created_at: now - hours(12),
		updated_at: now - hours(3)
	},
	{
		id: 'task-3-5',
		title: '客户技术支持周报',
		description: '汇总本周技术支持工单，分析高频问题并提出产品改进建议。',
		status: 'pending',
		column_id: 'col-3-3',
		position: 1,
		workspace: { id: 'ws-support', name: 'tech-support', path: '/workspace/support', status: 'online' },
		assistant_id: 'ast-data',
		assistant_name: '数据分析助手',
		created_at: now - hours(2),
		updated_at: now - hours(2)
	}
]

// ─── All Boards ──────────────────────────────────────────

interface MockBoard {
	board: Board
	columns: Column[]
	tasks: KanbanTask[]
}

const mockBoards: Record<string, MockBoard> = {
	'board-1': {
		board: {
			id: 'board-1',
			title: '业务工作台',
			icon: 'material-work',
			color: '#6366F1',
			columns: board1Columns,
			created_at: now - hours(720),
			updated_at: now - minutes(15)
		},
		columns: board1Columns,
		tasks: board1Tasks
	},
	'board-2': {
		board: {
			id: 'board-2',
			title: '产品迭代',
			icon: 'material-rocket_launch',
			color: '#3B82F6',
			columns: board2Columns,
			created_at: now - hours(360),
			updated_at: now - hours(1)
		},
		columns: board2Columns,
		tasks: board2Tasks
	},
	'board-3': {
		board: {
			id: 'board-3',
			title: '客户成功',
			icon: 'material-support_agent',
			color: '#22C55E',
			columns: board3Columns,
			created_at: now - hours(180),
			updated_at: now - hours(2)
		},
		columns: board3Columns,
		tasks: board3Tasks
	}
}

// ─── Templates ───────────────────────────────────────────

const mockTemplates: BoardTemplate[] = [
	{
		id: 'tpl-market',
		title: '市场调研',
		description: '竞品分析、用户调研与行业报告管理，含每周行业动态定时任务',
		icon: 'material-query_stats',
		color: '#6366F1',
		preview_columns: ['竞品分析', '用户调研', '行业报告', '数据整理']
	},
	{
		id: 'tpl-product',
		title: '产品迭代',
		description: '从需求池到发布的全流程管理',
		icon: 'material-rocket_launch',
		color: '#3B82F6',
		preview_columns: ['需求池', '设计开发', '测试验收', '已发布']
	},
	{
		id: 'tpl-content',
		title: '内容运营',
		description: '选题策划、内容创作与发布管理，含每日数据看板刷新定时任务',
		icon: 'material-edit_note',
		color: '#F59E0B',
		preview_columns: ['选题策划', '内容创作', '审核发布', '效果追踪']
	},
	{
		id: 'tpl-customer',
		title: '客户成功',
		description: '客户对接、方案交付与培训支持全流程',
		icon: 'material-support_agent',
		color: '#22C55E',
		preview_columns: ['客户对接', '方案交付', '培训支持', '满意度跟踪']
	}
]

// ─── Template → Board generation config ──────────────────

const templateColumnConfigs: Record<string, { title: string; icon: string; color: string }[]> = {
	'tpl-market': [
		{ title: '竞品分析', icon: 'material-compare', color: '#6366F1' },
		{ title: '用户调研', icon: 'material-person_search', color: '#8B5CF6' },
		{ title: '行业报告', icon: 'material-summarize', color: '#3B82F6' },
		{ title: '数据整理', icon: 'material-folder_open', color: '#22C55E' }
	],
	'tpl-product': [
		{ title: '需求池', icon: 'material-lightbulb', color: '#8B5CF6' },
		{ title: '设计开发', icon: 'material-code', color: '#3B82F6' },
		{ title: '测试验收', icon: 'material-bug_report', color: '#F59E0B' },
		{ title: '已发布', icon: 'material-rocket_launch', color: '#22C55E' }
	],
	'tpl-content': [
		{ title: '选题策划', icon: 'material-tips_and_updates', color: '#F59E0B' },
		{ title: '内容创作', icon: 'material-edit_note', color: '#3B82F6' },
		{ title: '审核发布', icon: 'material-fact_check', color: '#8B5CF6' },
		{ title: '效果追踪', icon: 'material-trending_up', color: '#22C55E' }
	],
	'tpl-customer': [
		{ title: '客户对接', icon: 'material-handshake', color: '#EC4899' },
		{ title: '方案交付', icon: 'material-inventory', color: '#8B5CF6' },
		{ title: '培训支持', icon: 'material-school', color: '#14B8A6' },
		{ title: '满意度跟踪', icon: 'material-sentiment_satisfied', color: '#22C55E' }
	]
}

const templatePresetTasks: Record<string, { title: string; description: string; colIndex: number; schedule?: KanbanTask['schedule'] }[]> = {
	'tpl-market': [
		{
			title: '每周行业动态抓取',
			description: '每周一自动抓取行业新闻和竞品动态，整理成简报。',
			colIndex: 2,
			schedule: { enabled: true, mode: 'times', times: ['09:00'], days: ['mon'], timezone: 'Asia/Shanghai' }
		}
	],
	'tpl-content': [
		{
			title: '每日数据看板刷新',
			description: '每天早上 8:00 自动拉取前一天的内容运营数据。',
			colIndex: 3,
			schedule: { enabled: true, mode: 'times', times: ['08:00'], timezone: 'Asia/Shanghai' }
		}
	]
}

// ─── Messages ─────────────────────────────────────────────

const mockMessages: Record<string, Message[]> = {
	'task-1': [
		userMsg('msg-1-1', '帮我调研东南亚三个国家的市场准入政策，重点关注金融科技领域。'),
		aiMsg('msg-1-2', '收到，我会按国家逐一调研：\n1. 越南 — SBV 监管框架\n2. 泰国 — BOT 沙盒政策\n3. 印尼 — OJK 金融科技监管\n\n每个国家会整理：准入条件、牌照要求、数据本地化政策、本地合作伙伴要求。\n\n开始调研越南...'),
		aiMsg('msg-1-3', '越南部分完成：\n- 需要与本地银行合作\n- 数据必须存储在越南境内\n- SBV 要求注册资本不低于 500 亿越南盾\n\n泰国部分也已完成，正在处理印尼...')
	],
	'task-4': [
		userMsg('msg-4-1', '生成本周营收周报，跟上周和去年同期对比。'),
		aiMsg('msg-4-2', '好的，开始汇总数据：\n- 产品线 A：本周 ¥128.5 万\n- 产品线 B：本周 ¥86.2 万\n- 产品线 C：本周 ¥45.8 万\n\n总计 ¥260.5 万，环比 +4.2%，同比 +18.7%\n\n正在生成对比图表...')
	],
	'task-7': [
		userMsg('msg-7-1', '根据这周上线的功能清单，写一份产品更新公告，要中英双语。'),
		aiMsg('msg-7-2', '已收到功能清单，共 5 项更新。初稿已完成，但有两个点需要确认：\n\n1. **智能推荐功能**：面向用户的描述应该强调"个性化体验"还是"效率提升"？两个角度都有道理\n2. **定价调整**：基础版月费从 ¥99 调整到 ¥129，这个变化需要在公告中提及吗？还是单独通知？\n\n请告知方向，我来调整最终版本。')
	],
	'task-10': [
		userMsg('msg-10-1', '分析一下这个月的客户投诉，看看主要问题是什么。'),
		aiMsg('msg-10-2', '好的，我从客服系统导出了本月 1,247 条投诉工单。\n\n数据清洗后有效记录 1,183 条，开始主题聚类分析...\n\n初步结果显示前三大类别：\n1. 响应速度慢（占 28%）\n2. 功能缺失/建议（占 22%）\n3. 账单相关问题（占 15%）\n\n正在细化每个类别的具体问题点...')
	]
}

// ─── Helpers ──────────────────────────────────────────────

function delay(ms?: number): Promise<void> {
	const t = ms ?? 300 + Math.random() * 500
	return new Promise((resolve) => setTimeout(resolve, t))
}

let nextId = 100

function genId(prefix: string): string {
	return `${prefix}-${++nextId}`
}

function cloneTask(task: KanbanTask): KanbanTask {
	return JSON.parse(JSON.stringify(task))
}

function cloneBoard(board: Board): Board {
	return JSON.parse(JSON.stringify(board))
}

function getBoardData(boardId: string): MockBoard {
	const data = mockBoards[boardId]
	if (!data) throw new Error(`Board ${boardId} not found`)
	return data
}

// ─── Board API ────────────────────────────────────────────

export async function getBoards(): Promise<BoardSummary[]> {
	await delay()
	return Object.values(mockBoards).map((b) => ({
		id: b.board.id,
		title: b.board.title,
		icon: b.board.icon,
		color: b.board.color,
		task_count: b.tasks.length,
		created_at: b.board.created_at
	}))
}

export async function getBoard(boardId: string): Promise<Board> {
	await delay()
	const data = getBoardData(boardId)
	return cloneBoard({ ...data.board, columns: [...data.columns] })
}

export async function createBoard(input: { title: string; icon?: string; color?: string }): Promise<Board> {
	await delay()
	const id = genId('board')
	const defaultCol: Column = {
		id: genId('col'),
		board_id: id,
		title: '待办',
		position: 0,
		icon: 'material-inbox',
		color: '#6366F1'
	}
	const board: Board = {
		id,
		title: input.title,
		icon: input.icon,
		color: input.color,
		columns: [defaultCol],
		created_at: Date.now(),
		updated_at: Date.now()
	}
	mockBoards[id] = { board, columns: [defaultCol], tasks: [] }
	return cloneBoard(board)
}

export async function updateBoard(boardId: string, data: Partial<Board>): Promise<Board> {
	await delay()
	const bd = getBoardData(boardId)
	const { columns: _c, id: _id, ...safe } = data as any
	Object.assign(bd.board, safe, { updated_at: Date.now() })
	return cloneBoard(bd.board)
}

export async function deleteBoard(boardId: string): Promise<void> {
	await delay()
	if (!mockBoards[boardId]) throw new Error(`Board ${boardId} not found`)
	delete mockBoards[boardId]
}

export async function getBoardTemplates(): Promise<BoardTemplate[]> {
	await delay()
	return JSON.parse(JSON.stringify(mockTemplates))
}

export async function createBoardFromTemplate(templateId: string, title?: string): Promise<Board> {
	await delay()
	const tpl = mockTemplates.find((t) => t.id === templateId)
	if (!tpl) throw new Error(`Template ${templateId} not found`)

	const boardId = genId('board')
	const colConfigs = templateColumnConfigs[templateId] ?? []
	const columns: Column[] = colConfigs.map((cfg, i) => ({
		id: genId('col'),
		board_id: boardId,
		title: cfg.title,
		position: i,
		icon: cfg.icon,
		color: cfg.color
	}))

	const board: Board = {
		id: boardId,
		title: title || tpl.title,
		icon: tpl.icon,
		color: tpl.color,
		columns,
		created_at: Date.now(),
		updated_at: Date.now()
	}

	const tasks: KanbanTask[] = []
	const presetTasks = templatePresetTasks[templateId] ?? []
	for (const pt of presetTasks) {
		const col = columns[pt.colIndex]
		if (!col) continue
		tasks.push({
			id: genId('task'),
			title: pt.title,
			description: pt.description,
			status: pt.schedule ? 'running' : 'pending',
			column_id: col.id,
			position: tasks.filter((t) => t.column_id === col.id).length,
			schedule: pt.schedule,
			workspace: { id: genId('ws'), name: 'auto-workspace', status: 'online' },
			assistant_id: 'ast-data',
			assistant_name: '数据分析助手',
			created_at: Date.now(),
			updated_at: Date.now()
		})
	}

	mockBoards[boardId] = { board, columns, tasks }
	return cloneBoard(board)
}

// ─── Task API ─────────────────────────────────────────────

export async function getTasks(boardId: string): Promise<KanbanTask[]> {
	await delay()
	const data = getBoardData(boardId)
	return data.tasks.map(cloneTask)
}

export async function getTaskDetail(taskId: string): Promise<KanbanTask> {
	await delay()
	for (const bd of Object.values(mockBoards)) {
		const task = bd.tasks.find((t) => t.id === taskId)
		if (task) return cloneTask(task)
	}
	throw new Error(`Task ${taskId} not found`)
}

export async function getTaskMessages(taskId: string): Promise<Message[]> {
	await delay()
	return JSON.parse(JSON.stringify(mockMessages[taskId] ?? []))
}

export async function createTask(data: CreateTaskData): Promise<KanbanTask> {
	await delay()
	const bd = Object.values(mockBoards).find((b) => b.columns.some((c) => c.id === data.column_id))
	if (!bd) throw new Error(`Column ${data.column_id} not found in any board`)

	const task: KanbanTask = {
		id: genId('task'),
		title: data.title,
		description: data.description,
		status: data.execute_immediately ? 'running' : 'pending',
		column_id: data.column_id,
		position: bd.tasks.filter((t) => t.column_id === data.column_id).length,
		chat_id: data.chat_id || genId('chat'),
		tags: data.tags,
		schedule: data.schedule,
		assistant_id: data.assistant_id,
		created_at: Date.now(),
		updated_at: Date.now(),
		started_at: data.execute_immediately ? Date.now() : undefined
	}
	bd.tasks.push(task)
	return cloneTask(task)
}

export async function updateTask(taskId: string, data: Partial<KanbanTask>): Promise<KanbanTask> {
	await delay()
	for (const bd of Object.values(mockBoards)) {
		const idx = bd.tasks.findIndex((t) => t.id === taskId)
		if (idx !== -1) {
			Object.assign(bd.tasks[idx], data, { updated_at: Date.now() })
			return cloneTask(bd.tasks[idx])
		}
	}
	throw new Error(`Task ${taskId} not found`)
}

export async function moveTask(taskId: string, columnId: string, position: number): Promise<void> {
	for (const bd of Object.values(mockBoards)) {
		const task = bd.tasks.find((t) => t.id === taskId)
		if (task) {
			const oldColumnId = task.column_id
			const isSameColumn = oldColumnId === columnId

			if (isSameColumn) {
				const colTasks = bd.tasks
					.filter((t) => t.column_id === columnId)
					.sort((a, b) => a.position - b.position)
				const without = colTasks.filter((t) => t.id !== taskId)
				without.splice(position, 0, task)
				without.forEach((t, i) => { t.position = i })
			} else {
				const sourceTasks = bd.tasks
					.filter((t) => t.column_id === oldColumnId && t.id !== taskId)
					.sort((a, b) => a.position - b.position)
				sourceTasks.forEach((t, i) => { t.position = i })

				task.column_id = columnId

				const targetTasks = bd.tasks
					.filter((t) => t.column_id === columnId && t.id !== taskId)
					.sort((a, b) => a.position - b.position)
				targetTasks.splice(position, 0, task)
				targetTasks.forEach((t, i) => { t.position = i })
			}

			task.updated_at = Date.now()
			await delay()
			return
		}
	}
	throw new Error(`Task ${taskId} not found`)
}

export async function deleteTask(taskId: string): Promise<void> {
	await delay()
	for (const bd of Object.values(mockBoards)) {
		const idx = bd.tasks.findIndex((t) => t.id === taskId)
		if (idx !== -1) {
			bd.tasks.splice(idx, 1)
			delete mockMessages[taskId]
			return
		}
	}
	throw new Error(`Task ${taskId} not found`)
}

export async function sendMessage(taskId: string, content: string): Promise<Message> {
	await delay()
	const msg = userMsg(genId('msg'), content)
	if (!mockMessages[taskId]) mockMessages[taskId] = []
	mockMessages[taskId].push(msg)
	return JSON.parse(JSON.stringify(msg))
}

// ─── Column API ───────────────────────────────────────────

export async function createColumn(boardId: string, data: Partial<Column>): Promise<Column> {
	await delay()
	const bd = getBoardData(boardId)
	const col: Column = {
		id: genId('col'),
		board_id: boardId,
		title: data.title ?? '新分组',
		position: bd.columns.length,
		icon: data.icon,
		color: data.color,
		wip_limit: data.wip_limit,
		collapsed: data.collapsed,
		auto_move: data.auto_move
	}
	bd.columns.push(col)
	bd.board.columns = [...bd.columns]
	bd.board.updated_at = Date.now()
	return JSON.parse(JSON.stringify(col))
}

export async function updateColumn(columnId: string, data: Partial<Column>): Promise<Column> {
	await delay()
	for (const bd of Object.values(mockBoards)) {
		const col = bd.columns.find((c) => c.id === columnId)
		if (col) {
			Object.assign(col, data)
			bd.board.columns = [...bd.columns]
			bd.board.updated_at = Date.now()
			return JSON.parse(JSON.stringify(col))
		}
	}
	throw new Error(`Column ${columnId} not found`)
}

export async function deleteColumn(columnId: string): Promise<void> {
	await delay()
	for (const bd of Object.values(mockBoards)) {
		const idx = bd.columns.findIndex((c) => c.id === columnId)
		if (idx !== -1) {
			bd.columns.splice(idx, 1)
			bd.board.columns = [...bd.columns]
			bd.board.updated_at = Date.now()
			return
		}
	}
	throw new Error(`Column ${columnId} not found`)
}

export async function reorderColumns(boardId: string, columnIds: string[]): Promise<void> {
	const bd = getBoardData(boardId)
	columnIds.forEach((id, i) => {
		const col = bd.columns.find((c) => c.id === id)
		if (col) col.position = i
	})
	bd.columns.sort((a, b) => a.position - b.position)
	bd.board.columns = [...bd.columns]
	bd.board.updated_at = Date.now()
	await delay()
}

// ==================== Task Files Mock ====================

export interface TaskFileEntry {
	name: string
	is_dir: boolean
	size: number
	mod_time?: string
}

const mockFileTree: Record<string, TaskFileEntry[]> = {
	'/': [
		{ name: 'reports', is_dir: true, size: 0, mod_time: '2026-06-15T10:30:00Z' },
		{ name: 'scripts', is_dir: true, size: 0, mod_time: '2026-06-14T08:20:00Z' },
		{ name: 'data', is_dir: true, size: 0, mod_time: '2026-06-13T16:45:00Z' },
		{ name: 'README.md', is_dir: false, size: 2048, mod_time: '2026-06-15T11:00:00Z' },
		{ name: 'config.yaml', is_dir: false, size: 512, mod_time: '2026-06-14T09:15:00Z' },
		{ name: '.env', is_dir: false, size: 128, mod_time: '2026-06-12T14:00:00Z' }
	],
	'/reports': [
		{ name: '月度投诉分析.pdf', is_dir: false, size: 1048576, mod_time: '2026-06-15T10:30:00Z' },
		{ name: '趋势报告.docx', is_dir: false, size: 524288, mod_time: '2026-06-14T15:20:00Z' },
		{ name: '数据摘要.csv', is_dir: false, size: 32768, mod_time: '2026-06-13T09:00:00Z' },
		{ name: 'charts', is_dir: true, size: 0, mod_time: '2026-06-15T10:00:00Z' }
	],
	'/reports/charts': [
		{ name: 'trend_chart.png', is_dir: false, size: 204800, mod_time: '2026-06-15T10:00:00Z' },
		{ name: 'category_pie.png', is_dir: false, size: 153600, mod_time: '2026-06-15T09:45:00Z' }
	],
	'/scripts': [
		{ name: 'analyze.py', is_dir: false, size: 4096, mod_time: '2026-06-14T08:20:00Z' },
		{ name: 'fetch_data.sh', is_dir: false, size: 1024, mod_time: '2026-06-13T17:30:00Z' },
		{ name: 'transform.ts', is_dir: false, size: 3072, mod_time: '2026-06-14T07:50:00Z' }
	],
	'/data': [
		{ name: 'complaints_raw.json', is_dir: false, size: 2097152, mod_time: '2026-06-13T16:45:00Z' },
		{ name: 'complaints_cleaned.csv', is_dir: false, size: 819200, mod_time: '2026-06-14T10:00:00Z' },
		{ name: 'categories.json', is_dir: false, size: 8192, mod_time: '2026-06-13T17:00:00Z' }
	]
}

export async function getTaskFiles(taskId: string, path: string): Promise<TaskFileEntry[]> {
	await delay()
	const normalized = path === '' ? '/' : path
	const entries = mockFileTree[normalized] || []
	return [...entries].sort((a, b) => {
		if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
		return a.name.localeCompare(b.name)
	})
}

export async function getTaskFileName(taskId: string): Promise<string> {
	await delay()
	const allTasks = Object.values(mockBoards).flatMap((bd) =>
		bd.columns.flatMap((col) => col.tasks || [])
	)
	const task = allTasks.find((t) => t?.id === taskId)
	return task?.title || taskId
}

// ==================== Task Services Mock ====================

const defaultMockServices: ServiceBinding[] = [
	{ name: 'Dev Server', port: 3000, protocol: 'http', status: 'running', pid: 12345, alias: '开发服务器' },
	{ name: 'WebSocket API', port: 8080, protocol: 'websocket', status: 'running', pid: 12346 },
	{ name: 'Database Proxy', port: 5432, protocol: 'tcp', status: 'running', pid: 12347 },
	{ name: 'Hot Reload', port: 35729, protocol: 'websocket', status: 'stopped', pid: undefined }
]

export async function getTaskServices(taskId: string): Promise<ServiceBinding[]> {
	await delay()
	const allTasks = Object.values(mockBoards).flatMap((bd) =>
		bd.columns.flatMap((col) => col.tasks || [])
	)
	const task = allTasks.find((t) => t?.id === taskId)
	return task?.services?.length ? task.services : defaultMockServices
}

// ==================== Task Activity Monitor Mock ====================

export interface TaskProcess {
	pid: number
	name: string
	cpu: number
	memory: number
	status: 'running' | 'sleeping' | 'stopped'
	port?: number
	user?: string
	started?: string
	command?: string
}

const mockProcesses: TaskProcess[] = [
	{ pid: 1, name: 'node', cpu: 12.3, memory: 256, status: 'running', port: 3000, user: 'app', started: '10:30', command: 'node dist/server.js' },
	{ pid: 24, name: 'python3', cpu: 8.7, memory: 512, status: 'running', user: 'app', started: '10:31', command: 'python3 analyze.py --input data.csv' },
	{ pid: 56, name: 'postgres', cpu: 3.2, memory: 128, status: 'running', port: 5432, user: 'postgres', started: '10:30', command: 'postgres: writer process' },
	{ pid: 78, name: 'nginx', cpu: 0.1, memory: 32, status: 'running', port: 80, user: 'root', started: '10:30', command: 'nginx: master process' },
	{ pid: 79, name: 'nginx', cpu: 0.3, memory: 24, status: 'sleeping', user: 'www', started: '10:30', command: 'nginx: worker process' },
	{ pid: 102, name: 'redis-server', cpu: 1.5, memory: 64, status: 'running', port: 6379, user: 'redis', started: '10:30', command: 'redis-server *:6379' },
	{ pid: 145, name: 'chromium', cpu: 22.1, memory: 1024, status: 'running', port: 9222, user: 'app', started: '10:35', command: 'chromium --headless --remote-debugging-port=9222' },
	{ pid: 201, name: 'ts-node', cpu: 5.4, memory: 180, status: 'running', user: 'app', started: '10:32', command: 'ts-node scripts/transform.ts' },
	{ pid: 310, name: 'esbuild', cpu: 0.0, memory: 48, status: 'sleeping', user: 'app', started: '10:33', command: 'esbuild --watch src/index.ts' },
	{ pid: 402, name: 'tail', cpu: 0.0, memory: 4, status: 'sleeping', user: 'app', started: '10:34', command: 'tail -f /var/log/app.log' },
	{ pid: 500, name: 'cron', cpu: 0.0, memory: 8, status: 'stopped', user: 'root', started: '10:30', command: 'cron -f' }
]

export async function getTaskProcesses(taskId: string): Promise<TaskProcess[]> {
	await delay()
	return mockProcesses
}
