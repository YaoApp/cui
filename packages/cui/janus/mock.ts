/**
 * janus（CUI V2）— Mock 数据 + Mock API
 *
 * 目的：原型阶段**全部走 Mock**，真实接口后续由 Yao 工程师实现（见 GAPS.md）。
 * 约定：所有"假接口"集中在本文件，后续替换成 @/openapi 的真实调用即可。
 */
import { MessageType } from '@/openapi'

import type { Message } from '@/openapi'

/** 右侧栏模式 */
export type PanelMode = 'design' | 'dev' | 'deploy'

/** 双面 */
export type FaceKind = 'human' | 'agent'

/** 任务（= 后端实体；看板与 BUILD 共用同一任务） */
export interface JTask {
	id: string
	title: string
	board: string
	board_id: string
	status: string
	updated_at: string
}

/** 应用（Apps 库条目） */
export interface JApp {
	id: string
	name: string
	desc: string
	glyph: string
	source: 'local' | 'cloud' | 'shared'
	status: 'draft' | 'published' | 'ready' | 'private'
	forms: string[] // H5 / PWA / MCP
	owner?: string
	updated_at: string
}

/** 能力（Skill / MCP） */
export interface JCapability {
	id: string
	kind: 'skill' | 'mcp'
	name: string
	desc: string
	enabled: boolean
	faces: FaceKind[] // 作用于哪一面
	tools?: string[]
}

/** 构建阶段（门禁） */
export interface JGate {
	key: string
	label: string
	status: 'pass' | 'fail' | 'running' | 'pending'
	detail?: string
}

/** 发布信息 */
export interface JDeploy {
	app_id: string
	forms: string[]
	backend: string
	hosting: string
	visibility: 'private' | 'public'
	steps: { label: string; status: 'done' | 'doing' | 'pending' }[]
}

/* ------------------------------------------------------------------ */
/* fixtures                                                            */
/* ------------------------------------------------------------------ */

export const task: JTask = {
	id: '128',
	title: 'Lucky 今日运势',
	board: 'Lucky 项目',
	board_id: 'lucky',
	status: '开发中',
	updated_at: '2 分钟前'
}

export const messages: Message[] = [
	{
		type: MessageType.USER_INPUT,
		ui_id: 'm1',
		props: { content: '把这个任务做成一个能分享的小应用：输入日期，出今日运势 + 一段文案', role: 'user' }
	},
	{
		type: MessageType.THINKING,
		ui_id: 'm2',
		props: { content: '先确认形态：人面用 H5（可分享），Agent 面用 A2UI 暴露给宿主。后端已有 lucky-server，无需新建。' }
	},
	{
		type: MessageType.PLAN,
		ui_id: 'm3',
		props: {
			semantic_type: 'plan',
			action: 'enter',
			tool: 'EnterPlanMode',
			status: 'completed',
			summary: '4 步：形态 → 骨架 → 页面 → 门禁'
		}
	},
	{
		type: MessageType.TODO,
		ui_id: 'm4',
		props: {
			semantic_type: 'todo',
			action: 'write',
			tool: 'TodoWrite',
			status: 'running',
			summary: '3/5',
			input: {
				todos: [
					{ content: '确认形态：H5（人面）+ Agent 面（MCP）', status: 'completed' },
					{ content: '用 dui 脚手架生成骨架（app.yaml）', status: 'completed' },
					{ content: '生成页面：首页 / 结果页', status: 'in_progress' },
					{ content: '接后端 lucky-server（Go）', status: 'pending' },
					{ content: '跑测试门禁 → Delivery Report', status: 'pending' }
				]
			}
		}
	},
	{
		type: MessageType.TOOL_CALL,
		ui_id: 'm5',
		props: { id: 'call_1', name: 'dui.new', arguments: '{"unit":"result-page","type":"detail"}' }
	},
	{
		type: MessageType.EXECUTE,
		ui_id: 'm6',
		props: {
			tool: 'Bash',
			tool_id: 'exec_1',
			runner: 'dui',
			status: 'completed',
			exit_code: 0,
			summary: '生成 src/human/pages/result（3 文件）',
			output: 'created: app.yaml, src/human/pages/result/index.tsx, src/human/pages/result/index.less'
		}
	},
	{
		type: MessageType.EXECUTE,
		ui_id: 'm7',
		props: {
			tool: 'dui.test',
			tool_id: 'exec_2',
			runner: 'dui',
			status: 'completed',
			exit_code: 0,
			summary: '门禁 6/9 通过 · 视觉回归 2 处差异'
		}
	},
	{
		type: MessageType.TEXT,
		ui_id: 'm8',
		props: {
			content:
				'页面已经生成好了。**视觉回归有 2 处差异**（间距、按钮圆角），要我按设计规范收敛吗？\n\n右侧 **Dev** 可以直接预览和看 diff。'
		}
	},
	{
		type: MessageType.QUESTION,
		ui_id: 'm9',
		props: {
			semantic_type: 'question',
			status: 'running',
			summary: '下一步？',
			input: {
				question: '这 2 处视觉差异怎么处理？',
				options: [
					{ label: '按设计规范自动收敛（推荐）', value: 'auto' },
					{ label: '保留当前，先接后端', value: 'keep' },
					{ label: '我自己在 Dev 里改', value: 'manual' }
				]
			}
		}
	}
]

export const gates: JGate[] = [
	{ key: 'typecheck', label: 'typecheck', status: 'pass' },
	{ key: 'lint', label: 'lint', status: 'pass' },
	{ key: 'unit', label: 'unit', status: 'pass' },
	{ key: 'contract', label: 'contract', status: 'pass', detail: '5 份契约' },
	{ key: 'route', label: 'route smoke', status: 'pass' },
	{ key: 'visual', label: 'visual', status: 'fail', detail: '2 处差异' },
	{ key: 'a11y', label: 'a11y', status: 'pending' },
	{ key: 'e2e', label: 'AI E2E', status: 'pending', detail: 'Web + 移动端' },
	{ key: 'report', label: 'Delivery Report', status: 'pending' }
]

export const deploy: JDeploy = {
	app_id: 'lucky-fortune',
	forms: ['H5', 'PWA', 'MCP'],
	backend: 'lucky-server（Go · 现成）',
	hosting: 'Yao hosting',
	visibility: 'private',
	steps: [
		{ label: '构建产物（static / PWA）', status: 'done' },
		{ label: '契约校验 + 门禁 6–9 层', status: 'doing' },
		{ label: '上传到 Yao hosting', status: 'pending' },
		{ label: '生成外部可用链接', status: 'pending' },
		{ label: '（可选）分享到云 / 上架', status: 'pending' }
	]
}

export const apps: JApp[] = [
	{ id: 'a1', name: 'Lucky 今日运势', desc: '输入日期，出运势与文案', glyph: '🔮', source: 'local', status: 'published', forms: ['H5'], updated_at: '2 分钟前' },
	{ id: 'a2', name: '古籍 OCR 校对', desc: '左右对照 + 逐行 diff', glyph: '📚', source: 'local', status: 'draft', forms: ['H5'], updated_at: '昨天' },
	{ id: 'a3', name: '客户跟进表', desc: '记录客户对话与提醒', glyph: '🗂️', source: 'cloud', status: 'ready', forms: ['H5'], updated_at: '官方示例' },
	{ id: 'a4', name: '报价计算器', desc: '按规则出报价单', glyph: '🧮', source: 'shared', status: 'published', forms: ['PWA'], owner: '@max', updated_at: '3 天前' },
	{ id: 'a5', name: '文案工作台', desc: '按调性生成多版文案', glyph: '✍️', source: 'cloud', status: 'ready', forms: ['H5', 'MCP'], updated_at: '官方示例' },
	{ id: 'a6', name: '分镜生成器', desc: '从脚本出分镜脚本', glyph: '🎬', source: 'local', status: 'private', forms: ['MCP'], updated_at: '3 天前' }
]

export const capabilities: JCapability[] = [
	{ id: 'c1', kind: 'skill', name: 'dui-scaffold', desc: '生成 dui 应用骨架（app.yaml + 目录）', enabled: true, faces: ['human', 'agent'], tools: ['dui.new', 'dui.build'] },
	{ id: 'c2', kind: 'skill', name: 'dui-test', desc: '9 层测试门禁 + Delivery Report', enabled: true, faces: ['agent'], tools: ['dui.test'] },
	{ id: 'c3', kind: 'mcp', name: 'lucky-server', desc: 'Lucky 业务后端（运势/计费）', enabled: true, faces: ['human', 'agent'], tools: ['fortune.get', 'order.create'] },
	{ id: 'c4', kind: 'mcp', name: 'filesystem', desc: '读写工作区文件', enabled: true, faces: ['agent'], tools: ['read', 'write', 'glob'] },
	{ id: 'c5', kind: 'mcp', name: 'browser', desc: '页面预览与 E2E 真点真滑', enabled: false, faces: ['agent'], tools: ['open', 'click', 'screenshot'] },
	{ id: 'c6', kind: 'skill', name: 'design-spec', desc: '契约五：HIG 式设计规范', enabled: false, faces: ['human'], tools: ['design.lint'] }
]

/* ------------------------------------------------------------------ */
/* Mock API（后续替换为 @/openapi 真实调用）                            */
/* ------------------------------------------------------------------ */

export const mockApi = {
	/** [缺口] 真实接口：chat 会话读取（已有 —— `@/openapi` Chat） */
	getTask: async (): Promise<JTask> => task,

	/** [缺口] 真实接口：chat 消息流（已有 —— `chunkProcessor` 解析） */
	getMessages: async (): Promise<Message[]> => messages,

	/** [缺口] 真实接口：门禁/构建状态（**待 Yao 工程师补**） */
	getGates: async (): Promise<JGate[]> => gates,

	/** [缺口] 真实接口：发布信息与步骤（**待补**） */
	getDeploy: async (): Promise<JDeploy> => deploy,

	/** [缺口] 真实接口：Apps 列表（**待补**：local/cloud/shared 三种来源） */
	listApps: async (): Promise<JApp[]> => apps,

	/** [缺口] 真实接口：能力（Skill/MCP）列表与启停（**待补**） */
	listCapabilities: async (): Promise<JCapability[]> => capabilities,
	setCapabilityEnabled: async (id: string, enabled: boolean): Promise<void> => {
		const c = capabilities.find((x) => x.id === id)
		if (c) c.enabled = enabled
	},

	/** [缺口] 真实接口：发布（**待补**，对应"Yao hosting 一键发布"） */
	publish: async (): Promise<{ url: string }> => ({ url: 'https://lucky-fortune.apps.yaoagents.com' })
}
