// Mock data for Trace page
import { TraceData, CallStackNode, MemoryGroup, SSEEvent } from '../types'

// Mock 初始数据
export const mockInitialData: TraceData = {
	id: 'trace_123456',
	agentName: 'Product Query Agent',
	status: 'running',
	startTime: new Date().toISOString(),
	totalDuration: 0,
	currentStep: '开始执行',
	progress: {
		current: 0,
		total: 5
	},
	callStack: [],
	memory: [
		{
			type: 'context',
			label: 'Context',
			icon: 'material-description',
			count: 0,
			items: []
		},
		{
			type: 'intent',
			label: 'Intent',
			icon: 'material-psychology',
			count: 0,
			items: []
		},
		{
			type: 'knowledge',
			label: 'Knowledge',
			icon: 'material-menu_book',
			count: 0,
			items: []
		},
		{
			type: 'history',
			label: 'History',
			icon: 'material-history',
			count: 0,
			items: []
		}
	]
}

// Mock SSE 事件序列
export const mockSSEEvents: SSEEvent[] = [
	// 1. 初始化
	{
		type: 'init',
		timestamp: new Date().toISOString(),
		data: {
			traceId: 'trace_123456',
			agentName: 'Product Query Agent'
		}
	},
	
	// 2. Start 节点开始
	{
		type: 'node_start',
		timestamp: new Date(Date.now() + 100).toISOString(),
		data: {
			node: {
				id: 'node_1',
				name: 'Start',
				type: 'start',
				status: 'running',
				description: '初始化任务',
				startTime: new Date(Date.now() + 100).toISOString()
			}
		}
	},
	
	// 3. Memory - 添加 context
	{
		type: 'memory_add',
		timestamp: new Date(Date.now() + 300).toISOString(),
		data: {
			type: 'context',
			item: {
				id: 'mem_1',
				type: 'context',
				title: 'User Query',
				content: '查询最新的智能手机产品信息，重点关注价格和配置',
				timestamp: new Date(Date.now() + 300).toISOString(),
				importance: 'high'
			}
		}
	},
	
	// 4. Memory - 添加 intent
	{
		type: 'memory_add',
		timestamp: new Date(Date.now() + 400).toISOString(),
		data: {
			type: 'intent',
			item: {
				id: 'mem_2',
				type: 'intent',
				title: 'User Intent',
				content: '用户意图：产品查询、价格比较',
				timestamp: new Date(Date.now() + 400).toISOString(),
				importance: 'high'
			}
		}
	},
	
	// 5. Start 节点完成
	{
		type: 'node_complete',
		timestamp: new Date(Date.now() + 500).toISOString(),
		data: {
			nodeId: 'node_1',
			status: 'success',
			endTime: new Date(Date.now() + 500).toISOString(),
			duration: 400
		}
	},
	
	// 6. Search 节点开始
	{
		type: 'node_start',
		timestamp: new Date(Date.now() + 600).toISOString(),
		data: {
			node: {
				id: 'node_2',
				name: 'Search Data',
				type: 'search',
				status: 'running',
				description: '搜索产品数据库',
				startTime: new Date(Date.now() + 600).toISOString(),
				parentId: 'node_1'
			}
		}
	},
	
	// 7. Memory - 添加 knowledge
	{
		type: 'memory_add',
		timestamp: new Date(Date.now() + 800).toISOString(),
		data: {
			type: 'knowledge',
			item: {
				id: 'mem_3',
				type: 'knowledge',
				title: 'Product Database',
				content: '产品数据库: 包含 1250 个产品记录',
				timestamp: new Date(Date.now() + 800).toISOString(),
				importance: 'medium'
			}
		}
	},
	
	// 8. Search 节点完成
	{
		type: 'node_complete',
		timestamp: new Date(Date.now() + 1500).toISOString(),
		data: {
			nodeId: 'node_2',
			status: 'success',
			endTime: new Date(Date.now() + 1500).toISOString(),
			duration: 900,
			output: {
				found: 15,
				items: ['Product A', 'Product B', 'Product C']
			}
		}
	},
	
	// 9. 并发查询 Query1 开始
	{
		type: 'node_start',
		timestamp: new Date(Date.now() + 1600).toISOString(),
		data: {
			node: {
				id: 'node_3',
				name: 'Query Price',
				type: 'query',
				status: 'running',
				description: '查询价格信息',
				startTime: new Date(Date.now() + 1600).toISOString(),
				parentId: 'node_2'
			}
		}
	},
	
	// 10. 并发查询 Query2 开始
	{
		type: 'node_start',
		timestamp: new Date(Date.now() + 1650).toISOString(),
		data: {
			node: {
				id: 'node_4',
				name: 'Query Specs',
				type: 'query',
				status: 'running',
				description: '查询配置信息',
				startTime: new Date(Date.now() + 1650).toISOString(),
				parentId: 'node_2'
			}
		}
	},
	
	// 11. Memory - 添加 context
	{
		type: 'memory_add',
		timestamp: new Date(Date.now() + 1800).toISOString(),
		data: {
			type: 'context',
			item: {
				id: 'mem_4',
				type: 'context',
				title: 'Price Range',
				content: '价格区间: ¥2000 - ¥8000',
				timestamp: new Date(Date.now() + 1800).toISOString(),
				importance: 'medium'
			}
		}
	},
	
	// 12. Query1 完成
	{
		type: 'node_complete',
		timestamp: new Date(Date.now() + 2400).toISOString(),
		data: {
			nodeId: 'node_3',
			status: 'success',
			endTime: new Date(Date.now() + 2400).toISOString(),
			duration: 800
		}
	},
	
	// 13. Query2 完成
	{
		type: 'node_complete',
		timestamp: new Date(Date.now() + 2800).toISOString(),
		data: {
			nodeId: 'node_4',
			status: 'success',
			endTime: new Date(Date.now() + 2800).toISOString(),
			duration: 1150
		}
	},
	
	// 14. LLM Reasoning 开始
	{
		type: 'node_start',
		timestamp: new Date(Date.now() + 2900).toISOString(),
		data: {
			node: {
				id: 'node_5',
				name: 'LLM Reasoning',
				type: 'llm',
				status: 'running',
				description: '分析并生成回答',
				startTime: new Date(Date.now() + 2900).toISOString(),
				parentId: 'node_2'
			}
		}
	},
	
	// 15. Memory - 添加 context (推理过程)
	{
		type: 'memory_add',
		timestamp: new Date(Date.now() + 3500).toISOString(),
		data: {
			type: 'context',
			item: {
				id: 'mem_5',
				type: 'context',
				title: 'Reasoning Context',
				content: '正在分析用户需求和产品数据的匹配度...',
				timestamp: new Date(Date.now() + 3500).toISOString(),
				importance: 'low'
			}
		}
	},
	
	// 16. LLM Reasoning 完成
	{
		type: 'node_complete',
		timestamp: new Date(Date.now() + 5200).toISOString(),
		data: {
			nodeId: 'node_5',
			status: 'success',
			endTime: new Date(Date.now() + 5200).toISOString(),
			duration: 2300
		}
	},
	
	// 17. Format 节点开始
	{
		type: 'node_start',
		timestamp: new Date(Date.now() + 5300).toISOString(),
		data: {
			node: {
				id: 'node_6',
				name: 'Format Result',
				type: 'format',
				status: 'running',
				description: '整理输出结果',
				startTime: new Date(Date.now() + 5300).toISOString(),
				parentId: 'node_5'
			}
		}
	},
	
	// 18. Format 节点完成
	{
		type: 'node_complete',
		timestamp: new Date(Date.now() + 5800).toISOString(),
		data: {
			nodeId: 'node_6',
			status: 'success',
			endTime: new Date(Date.now() + 5800).toISOString(),
			duration: 500
		}
	},
	
	// 19. Complete 节点开始
	{
		type: 'node_start',
		timestamp: new Date(Date.now() + 5900).toISOString(),
		data: {
			node: {
				id: 'node_7',
				name: 'Complete',
				type: 'complete',
				status: 'running',
				description: '任务完成',
				startTime: new Date(Date.now() + 5900).toISOString(),
				parentId: 'node_6'
			}
		}
	},
	
	// 20. Complete 节点完成
	{
		type: 'node_complete',
		timestamp: new Date(Date.now() + 6000).toISOString(),
		data: {
			nodeId: 'node_7',
			status: 'success',
			endTime: new Date(Date.now() + 6000).toISOString(),
			duration: 100
		}
	},
	
	// 21. 整个 Trace 完成
	{
		type: 'complete',
		timestamp: new Date(Date.now() + 6100).toISOString(),
		data: {
			traceId: 'trace_123456',
			status: 'completed',
			totalDuration: 6000
		}
	}
]

// SSE 模拟器
export class MockSSEConnection {
	private eventIndex = 0
	private intervalId: NodeJS.Timeout | null = null
	private callbacks: ((event: SSEEvent) => void)[] = []

	constructor(private events: SSEEvent[] = mockSSEEvents) {}

	// 开始发送事件
	start(intervalMs: number = 500) {
		this.intervalId = setInterval(() => {
			if (this.eventIndex < this.events.length) {
				const event = this.events[this.eventIndex]
				this.callbacks.forEach(callback => callback(event))
				this.eventIndex++
			} else {
				this.stop()
			}
		}, intervalMs)
	}

	// 停止发送事件
	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId)
			this.intervalId = null
		}
	}

	// 订阅事件
	onMessage(callback: (event: SSEEvent) => void) {
		this.callbacks.push(callback)
	}

	// 重置
	reset() {
		this.stop()
		this.eventIndex = 0
	}
}

