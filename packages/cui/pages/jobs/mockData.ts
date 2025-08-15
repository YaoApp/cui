import { ListResponse, DetailResponse, Task, Catgory, TaskLog } from './types'

// 模拟请求延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 模拟分类数据
const mockCategories: Catgory[] = [
	{
		id: 'assistant',
		name: 'AI 智能体',
		icon: 'material-assistant',
		description: '智能体相关任务',
		sort: 1
	},
	{
		id: 'knowledge',
		name: '知识库',
		icon: 'material-menu_book',
		description: '知识库处理任务',
		sort: 2
	},
	{
		id: 'workflow',
		name: '工作流',
		icon: 'material-account_tree',
		description: '工作流执行任务',
		sort: 3
	},
	{
		id: 'schedule',
		name: '定时任务',
		icon: 'material-schedule',
		description: '定时执行任务',
		sort: 4
	}
]

// 生成模拟日志
const generateMockLogs = (taskId: string, status: string): TaskLog[] => {
	const logs: TaskLog[] = [
		{
			timestamp: new Date(Date.now() - 300000).toISOString(),
			message: `Task ${taskId} initialized`,
			level: 'info'
		},
		{
			timestamp: new Date(Date.now() - 240000).toISOString(),
			message: 'Loading required resources...',
			level: 'info'
		},
		{
			timestamp: new Date(Date.now() - 180000).toISOString(),
			message: 'Processing data batch 1/5',
			level: 'info'
		}
	]

	if (status === 'running') {
		logs.push({
			timestamp: new Date(Date.now() - 120000).toISOString(),
			message: 'Processing data batch 2/5',
			level: 'info'
		})
		logs.push({
			timestamp: new Date(Date.now() - 60000).toISOString(),
			message: 'Current progress: 40%',
			level: 'info'
		})
	} else if (status === 'completed') {
		logs.push({
			timestamp: new Date(Date.now() - 120000).toISOString(),
			message: 'Processing data batch 2/5',
			level: 'info'
		})
		logs.push({
			timestamp: new Date(Date.now() - 90000).toISOString(),
			message: 'Processing data batch 3/5',
			level: 'info'
		})
		logs.push({
			timestamp: new Date(Date.now() - 60000).toISOString(),
			message: 'Processing data batch 4/5',
			level: 'info'
		})
		logs.push({
			timestamp: new Date(Date.now() - 30000).toISOString(),
			message: 'Processing data batch 5/5',
			level: 'info'
		})
		logs.push({
			timestamp: new Date().toISOString(),
			message: 'Task completed successfully',
			level: 'info'
		})
	} else if (status === 'failed') {
		logs.push({
			timestamp: new Date(Date.now() - 120000).toISOString(),
			message: 'Processing data batch 2/5',
			level: 'info'
		})
		logs.push({
			timestamp: new Date(Date.now() - 60000).toISOString(),
			message: 'Connection timeout, retrying...',
			level: 'retry'
		})
		logs.push({
			timestamp: new Date().toISOString(),
			message: 'Max retry attempts exceeded. Task failed.',
			level: 'error'
		})
	}

	return logs
}

// 模拟任务数据
const mockTasks: Task[] = [
	{
		id: 'task_001',
		name: '智能体模型训练',
		icon: 'material-model_training',
		description: '训练新的AI智能体模型，用于客户服务场景',
		category: 'assistant',
		status: 'running',
		created_at: new Date(Date.now() - 3600000).toISOString(),
		updated_at: new Date(Date.now() - 1800000).toISOString(),
		created_by: 'user123',
		sort: 1,
		started_at: new Date(Date.now() - 3000000).toISOString(),
		result: null
	},
	{
		id: 'task_002',
		name: '知识库文档索引',
		icon: 'material-auto_fix_high',
		description: '为新上传的技术文档创建索引，优化搜索性能',
		category: 'knowledge',
		status: 'completed',
		created_at: new Date(Date.now() - 7200000).toISOString(),
		updated_at: new Date(Date.now() - 3600000).toISOString(),
		created_by: 'user456',
		sort: 2,
		started_at: new Date(Date.now() - 6600000).toISOString(),
		ended_at: new Date(Date.now() - 3600000).toISOString(),
		result: {
			indexed_documents: 1250,
			processing_time: '45m 32s'
		}
	},
	{
		id: 'task_003',
		name: '工作流自动化部署',
		icon: 'material-rocket_launch',
		description: '部署新版本的自动化工作流到生产环境',
		category: 'workflow',
		status: 'pending',
		created_at: new Date(Date.now() - 1800000).toISOString(),
		updated_at: new Date(Date.now() - 1800000).toISOString(),
		created_by: 'user789',
		sort: 3,
		result: null
	},
	{
		id: 'task_004',
		name: '每日数据备份',
		icon: 'material-backup',
		description: '执行系统数据的每日自动备份任务',
		category: 'schedule',
		status: 'completed',
		created_at: new Date(Date.now() - 86400000).toISOString(),
		updated_at: new Date(Date.now() - 86400000 + 1800000).toISOString(),
		created_by: 'system',
		sort: 4,
		started_at: new Date(Date.now() - 86400000).toISOString(),
		ended_at: new Date(Date.now() - 86400000 + 1800000).toISOString(),
		result: {
			backup_size: '2.4 GB',
			files_count: 15680
		}
	},
	{
		id: 'task_005',
		name: '智能体性能优化',
		icon: 'material-speed',
		description: '优化智能体响应速度和准确性',
		category: 'assistant',
		status: 'failed',
		created_at: new Date(Date.now() - 5400000).toISOString(),
		updated_at: new Date(Date.now() - 3600000).toISOString(),
		created_by: 'user101',
		sort: 5,
		started_at: new Date(Date.now() - 4800000).toISOString(),
		ended_at: new Date(Date.now() - 3600000).toISOString(),
		result: null
	},
	{
		id: 'task_006',
		name: '知识库内容更新',
		icon: 'material-update',
		description: '更新产品文档和FAQ内容',
		category: 'knowledge',
		status: 'running',
		created_at: new Date(Date.now() - 2700000).toISOString(),
		updated_at: new Date(Date.now() - 900000).toISOString(),
		created_by: 'user202',
		sort: 6,
		started_at: new Date(Date.now() - 2400000).toISOString(),
		result: null
	},
	{
		id: 'task_007',
		name: '报表生成工作流',
		icon: 'material-assessment',
		description: '生成月度业务分析报表',
		category: 'workflow',
		status: 'completed',
		created_at: new Date(Date.now() - 10800000).toISOString(),
		updated_at: new Date(Date.now() - 7200000).toISOString(),
		created_by: 'user303',
		sort: 7,
		started_at: new Date(Date.now() - 10800000).toISOString(),
		ended_at: new Date(Date.now() - 7200000).toISOString(),
		result: {
			report_pages: 45,
			charts_generated: 12
		}
	},
	{
		id: 'task_008',
		name: '系统监控检查',
		icon: 'material-monitor_heart',
		description: '定时检查系统健康状态和性能指标',
		category: 'schedule',
		status: 'completed',
		created_at: new Date(Date.now() - 3600000).toISOString(),
		updated_at: new Date(Date.now() - 3300000).toISOString(),
		created_by: 'system',
		sort: 8,
		started_at: new Date(Date.now() - 3600000).toISOString(),
		ended_at: new Date(Date.now() - 3300000).toISOString(),
		result: {
			checks_performed: 25,
			issues_found: 0
		}
	},
	{
		id: 'task_009',
		name: '多模态智能体训练',
		icon: 'material-psychology',
		description: '训练支持文本、图像和语音的多模态智能体',
		category: 'assistant',
		status: 'pending',
		created_at: new Date(Date.now() - 900000).toISOString(),
		updated_at: new Date(Date.now() - 900000).toISOString(),
		created_by: 'user404',
		sort: 9,
		result: null
	},
	{
		id: 'task_010',
		name: '知识图谱构建',
		icon: 'material-share',
		description: '基于企业文档构建知识图谱',
		category: 'knowledge',
		status: 'running',
		created_at: new Date(Date.now() - 5400000).toISOString(),
		updated_at: new Date(Date.now() - 1800000).toISOString(),
		created_by: 'user505',
		sort: 10,
		started_at: new Date(Date.now() - 4800000).toISOString(),
		result: null
	}
]

// 模拟获取任务列表API
export const mockFetchTasks = async (): Promise<ListResponse> => {
	await delay(300) // 模拟300ms延迟

	return {
		tasks: mockTasks,
		categories: mockCategories,
		total: mockTasks.length
	}
}

// 模拟获取任务详情API
export const mockFetchTaskDetail = async (taskId: string): Promise<DetailResponse> => {
	await delay(300) // 模拟300ms延迟

	const task = mockTasks.find((t) => t.id === taskId)

	if (!task) {
		return {
			message: `Task with id ${taskId} not found`,
			code: 404
		}
	}

	// 为详情添加日志数据
	const taskWithLogs: Task = {
		...task,
		logs: generateMockLogs(taskId, task.status)
	}

	return taskWithLogs
}
