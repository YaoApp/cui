// SSE Mock 数据服务 - 模拟产品详情页开发场景

export interface MockNode {
	id: string
	type: 'start' | 'search' | 'query' | 'llm' | 'format' | 'complete'
	data: {
		label: string
		description: string
		type: string
		status: 'pending' | 'running' | 'success' | 'error'
		duration?: number
		error?: string
	}
}

export interface MockEdge {
	id: string
	source: string
	target: string
	animated?: boolean
	style?: any
	markerEnd?: any
}

export interface MockMemory {
	id: string
	type: 'context' | 'intent' | 'knowledge' | 'history' | 'custom'
	title: string
	content: string
	count: number
	items: string[]
}

export type SSEEventType =
	| 'init'
	| 'node_start'
	| 'node_update'
	| 'node_complete'
	| 'memory_add'
	| 'memory_update'
	| 'complete'

export interface SSEEvent {
	type: SSEEventType
	data: {
		node?: MockNode
		nodes?: MockNode[] // 支持批量节点（并发场景）
		edge?: MockEdge
		edges?: MockEdge[] // 支持批量边（并发场景）
		memory?: MockMemory
		memories?: MockMemory[] // 支持批量记忆（并发场景）
		nodeId?: string
	}
	delay?: number // 延迟时间（毫秒）
}

// Mock SSE 事件序列（带自定义延迟）
const mockSSEEvents: SSEEvent[] = [
	// 1. 初始化 - Start 节点开始
	{
		type: 'node_start',
		delay: 300, // 快速开始
		data: {
			node: {
				id: 'start',
				type: 'start',
				data: {
					label: 'Start',
					description: '开始执行',
					type: 'start',
					status: 'running',
					duration: undefined
				}
			}
		}
	},

	// 2. Start 节点完成
	{
		type: 'node_complete',
		delay: 200, // 快速完成
		data: {
			nodeId: 'start',
			node: {
				id: 'start',
				type: 'start',
				data: {
					label: 'Start',
					description: '开始执行',
					type: 'start',
					status: 'success',
					duration: 10
				}
			}
		}
	},

	// 3. 批量添加初始 Memory Cards（Context + Intent）
	{
		type: 'memory_add',
		delay: 400,
		data: {
			memories: [
				{
					id: 'mem-1',
					type: 'context',
					title: '当前任务上下文',
					content: '正在开发电商平台的产品详情页面，需要实现规格参数展示、SKU 选择器、价格计算、库存查询、购物车联动等核心功能模块',
					count: 3,
					items: [
						'正在开发电商平台的产品详情页面，需要实现规格参数展示、SKU 选择器、价格计算等核心功能',
						'用户需求包括：支持多规格组合选择（颜色/尺寸/版本），实时库存状态展示，动态价格计算',
						'技术栈使用 React + TypeScript + Ant Design，需要考虑移动端适配和性能优化'
					]
				},
				{
					id: 'mem-2',
					type: 'intent',
					title: '开发意图分析',
					content: '实现用户可交互的 SKU 选择组件，支持多规格组合（颜色、尺寸、版本），动态计算价格和库存状态，优化移动端触控体验',
					count: 1,
					items: ['核心目标：构建高性能、用户体验良好的 SKU 选择交互组件，支持复杂规格组合场景']
				}
			]
		}
	},

	// 4. Search 节点开始
	{
		type: 'node_start',
		delay: 500,
		data: {
			node: {
				id: 'search-1',
				type: 'search',
				data: {
					label: 'Search Data',
					description: '检索相关数据',
					type: 'search',
					status: 'running',
					duration: undefined
				}
			},
			edge: {
				id: 'e-start-search',
				source: 'start',
				target: 'search-1',
				animated: true,
				style: { stroke: 'var(--color_main)', strokeWidth: 2 },
				markerEnd: { type: 'ArrowClosed', color: 'var(--color_main)', width: 8, height: 8 }
			}
		}
	},

	// 5. Search 节点完成
	{
		type: 'node_complete',
		delay: 1200, // 搜索耗时较长
		data: {
			nodeId: 'search-1',
			node: {
				id: 'search-1',
				type: 'search',
				data: {
					label: 'Search Data',
					description: '检索相关数据',
					type: 'search',
					status: 'success',
					duration: 1200
				}
			},
			edge: {
				id: 'e-start-search',
				source: 'start',
				target: 'search-1',
				animated: false,
				style: { stroke: 'var(--color_success)', strokeWidth: 2 },
				markerEnd: { type: 'ArrowClosed', color: 'var(--color_success)', width: 8, height: 8 }
			}
		}
	},

	// 6. 三个 Query 节点并发开始（一个 SSE 消息包含三个节点）
	{
		type: 'node_start',
		delay: 300,
		data: {
			nodes: [
				{
					id: 'query-1',
					type: 'query',
					data: {
						label: 'Query Database',
						description: '查询产品信息',
						type: 'query',
						status: 'running',
						duration: undefined
					}
				},
				{
					id: 'query-2',
					type: 'query',
					data: {
						label: 'Query Specs',
						description: '查询规格参数',
						type: 'query',
						status: 'running',
						duration: undefined
					}
				},
				{
					id: 'query-3',
					type: 'query',
					data: {
						label: 'Query Cache',
						description: '查询缓存',
						type: 'query',
						status: 'running',
						duration: undefined
					}
				}
			],
			edges: [
				{
					id: 'e-search-query1',
					source: 'search-1',
					target: 'query-1',
					animated: true,
					style: { stroke: 'var(--color_main)', strokeWidth: 2 },
					markerEnd: { type: 'ArrowClosed', color: 'var(--color_main)', width: 8, height: 8 }
				},
				{
					id: 'e-search-query2',
					source: 'search-1',
					target: 'query-2',
					animated: true,
					style: { stroke: 'var(--color_main)', strokeWidth: 2 },
					markerEnd: { type: 'ArrowClosed', color: 'var(--color_main)', width: 8, height: 8 }
				},
				{
					id: 'e-search-query3',
					source: 'search-1',
					target: 'query-3',
					animated: true,
					style: { stroke: 'var(--color_main)', strokeWidth: 2 },
					markerEnd: { type: 'ArrowClosed', color: 'var(--color_main)', width: 8, height: 8 }
				}
			]
		}
	},

	// 7. 批量添加 Knowledge + History + Custom Memory Cards
	{
		type: 'memory_add',
		delay: 500,
		data: {
			memories: [
				{
					id: 'mem-3',
					type: 'knowledge',
					title: '相关技术文档',
					content: 'React Hooks 最佳实践、SKU 算法实现方案、Ant Design 表单组件文档、商品数据结构设计规范、库存服务 API 接口文档',
					count: 5,
					items: [
						'React Hooks 最佳实践：使用 useMemo 优化 SKU 计算性能，useCallback 避免不必要的重渲染',
						'SKU 算法实现方案：基于笛卡尔积生成所有规格组合，使用哈希表快速查找库存状态',
						'Ant Design 表单组件文档：Radio.Group 用于单选规格，Checkbox.Group 用于多选场景',
						'商品数据结构设计规范：包含 spuId、skuList、priceRange、stockStatus 等核心字段',
						'库存服务 API 接口文档：GET /api/stock/check 实时查询库存，支持批量查询和缓存策略'
					]
				},
				{
					id: 'mem-4',
					type: 'history',
					title: '历史开发记录',
					content: '上周完成了商品列表页的筛选功能和分页加载，本周聚焦详情页开发，团队反馈需要优化图片懒加载和首屏渲染性能',
					count: 2,
					items: [
						'上周完成：商品列表页筛选功能（价格区间、品牌、分类），虚拟滚动实现长列表优化',
						'本周计划：产品详情页 SKU 选择器开发，图片懒加载优化，首屏 LCP 性能提升至 2 秒内'
					]
				},
				{
					id: 'mem-5',
					type: 'custom',
					title: '性能指标要求',
					content: '首屏加载时间 < 2s，FCP < 1s，LCP < 2.5s，TTI < 3.5s，CLS < 0.1，满足 Core Web Vitals 标准',
					count: 4,
					items: [
						'首屏加载时间（FCP）：目标 < 1s，当前 1.8s，需要优化关键渲染路径',
						'最大内容绘制（LCP）：目标 < 2.5s，当前 3.2s，需要优化图片加载和代码分割',
						'交互时间（TTI）：目标 < 3.5s，当前 4.1s，需要减少主线程阻塞时间',
						'累积布局偏移（CLS）：目标 < 0.1，当前 0.15，需要为图片预留空间'
					]
				}
			]
		}
	},

	// 8. Query-1 完成（最慢，850ms）
	{
		type: 'node_complete',
		delay: 850,
		data: {
			nodeId: 'query-1',
			node: {
				id: 'query-1',
				type: 'query',
				data: {
					label: 'Query Database',
					description: '查询产品信息',
					type: 'query',
					status: 'success',
					duration: 850
				}
			},
			edge: {
				id: 'e-search-query1',
				source: 'search-1',
				target: 'query-1',
				animated: false,
				style: { stroke: 'var(--color_success)', strokeWidth: 2 },
				markerEnd: { type: 'ArrowClosed', color: 'var(--color_success)', width: 8, height: 8 }
			}
		}
	},

	// 9. Query-2 完成（稍快，200ms 后）
	{
		type: 'node_complete',
		delay: 200,
		data: {
			nodeId: 'query-2',
			node: {
				id: 'query-2',
				type: 'query',
				data: {
					label: 'Query Specs',
					description: '查询规格参数',
					type: 'query',
					status: 'success',
					duration: 920
				}
			},
			edge: {
				id: 'e-search-query2',
				source: 'search-1',
				target: 'query-2',
				animated: false,
				style: { stroke: 'var(--color_success)', strokeWidth: 2 },
				markerEnd: { type: 'ArrowClosed', color: 'var(--color_success)', width: 8, height: 8 }
			}
		}
	},

	// 10. Query-3 失败（最快，只需 150ms）
	{
		type: 'node_complete',
		delay: 100, // 比 Query-2 早完成
		data: {
			nodeId: 'query-3',
			node: {
				id: 'query-3',
				type: 'query',
				data: {
					label: 'Query Cache',
					description: '查询缓存失败',
					type: 'query',
					status: 'error',
					duration: 150,
					error: 'Connection timeout'
				}
			},
			edge: {
				id: 'e-search-query3',
				source: 'search-1',
				target: 'query-3',
				animated: false,
				style: { stroke: 'var(--color_danger)', strokeWidth: 2 },
				markerEnd: { type: 'ArrowClosed', color: 'var(--color_danger)', width: 8, height: 8 }
			}
		}
	},

	// 11. LLM 节点开始（包含两条输入边）
	{
		type: 'node_start',
		delay: 300,
		data: {
			node: {
				id: 'llm-1',
				type: 'llm',
				data: {
					label: 'LLM Processing',
					description: '大模型推理分析',
					type: 'llm',
					status: 'running',
					duration: undefined
				}
			},
			edges: [
				{
					id: 'e-query1-llm',
					source: 'query-1',
					target: 'llm-1',
					animated: true,
					style: { stroke: 'var(--color_main)', strokeWidth: 2 },
					markerEnd: { type: 'ArrowClosed', color: 'var(--color_main)', width: 8, height: 8 }
				},
				{
					id: 'e-query2-llm',
					source: 'query-2',
					target: 'llm-1',
					animated: true,
					style: { stroke: 'var(--color_main)', strokeWidth: 2 },
					markerEnd: { type: 'ArrowClosed', color: 'var(--color_main)', width: 8, height: 8 }
				}
			]
		}
	},

	// 12. LLM 节点完成（耗时较长，两条边同时变绿）
	{
		type: 'node_complete',
		delay: 2300,
		data: {
			nodeId: 'llm-1',
			node: {
				id: 'llm-1',
				type: 'llm',
				data: {
					label: 'LLM Processing',
					description: '大模型推理分析',
					type: 'llm',
					status: 'success',
					duration: 2300
				}
			},
			edges: [
				{
					id: 'e-query1-llm',
					source: 'query-1',
					target: 'llm-1',
					animated: false,
					style: { stroke: 'var(--color_success)', strokeWidth: 2 },
					markerEnd: { type: 'ArrowClosed', color: 'var(--color_success)', width: 8, height: 8 }
				},
				{
					id: 'e-query2-llm',
					source: 'query-2',
					target: 'llm-1',
					animated: false,
					style: { stroke: 'var(--color_success)', strokeWidth: 2 },
					markerEnd: { type: 'ArrowClosed', color: 'var(--color_success)', width: 8, height: 8 }
				}
			]
		}
	},

	// 13. 更新 Context Memory（数量和内容变化）
	{
		type: 'memory_update',
		delay: 400,
		data: {
			memory: {
				id: 'mem-1',
				type: 'context',
				title: '当前任务上下文',
				content: '产品详情页开发进入最后阶段，已完成 SKU 选择器核心逻辑，正在优化样式和交互细节，接下来需要集成购物车服务',
				count: 4,
				items: [
					'✅ 已完成：规格参数展示组件，支持多维度规格组合（颜色/尺寸/版本）',
					'✅ 已完成：SKU 选择器核心算法，基于笛卡尔积生成所有组合，实时计算可选状态',
					'🔄 进行中：样式优化和移动端触控体验调优，确保操作流畅性'
				]
			}
		}
	},

	// 14. Format 节点开始
	{
		type: 'node_start',
		delay: 300,
		data: {
			node: {
				id: 'format-1',
				type: 'format',
				data: {
					label: 'Format Result',
					description: '整理输出格式',
					type: 'format',
					status: 'running',
					duration: undefined
				}
			},
			edge: {
				id: 'e-llm-format',
				source: 'llm-1',
				target: 'format-1',
				animated: true,
				style: { stroke: 'var(--color_main)', strokeWidth: 2 },
				markerEnd: { type: 'ArrowClosed', color: 'var(--color_main)', width: 8, height: 8 }
			}
		}
	},

	// 15. 更新 Knowledge Memory（数量增加）
	{
		type: 'memory_update',
		delay: 300,
		data: {
			memory: {
				id: 'mem-3',
				type: 'knowledge',
				title: '相关技术文档',
				content: 'React Hooks 最佳实践、SKU 算法实现方案、Ant Design 表单组件文档、商品数据结构设计规范、库存服务 API 接口文档、购物车服务集成指南',
				count: 6,
				items: [
					'React Hooks 最佳实践：使用 useMemo 优化 SKU 计算性能，useCallback 避免不必要的重渲染',
					'SKU 算法实现方案：基于笛卡尔积生成所有规格组合，使用哈希表快速查找库存状态',
					'Ant Design 表单组件文档：Radio.Group 用于单选规格，Checkbox.Group 用于多选场景'
				]
			}
		}
	},

	// 16. Format 节点完成
	{
		type: 'node_complete',
		delay: 320,
		data: {
			nodeId: 'format-1',
			node: {
				id: 'format-1',
				type: 'format',
				data: {
					label: 'Format Result',
					description: '整理输出格式',
					type: 'format',
					status: 'success',
					duration: 320
				}
			},
			edge: {
				id: 'e-llm-format',
				source: 'llm-1',
				target: 'format-1',
				animated: false,
				style: { stroke: 'var(--color_success)', strokeWidth: 2 },
				markerEnd: { type: 'ArrowClosed', color: 'var(--color_success)', width: 8, height: 8 }
			}
		}
	},

	// 17. Complete 节点开始
	{
		type: 'node_start',
		delay: 200,
		data: {
			node: {
				id: 'complete',
				type: 'complete',
				data: {
					label: 'Complete',
					description: '执行完成',
					type: 'complete',
					status: 'running',
					duration: undefined
				}
			},
			edge: {
				id: 'e-format-complete',
				source: 'format-1',
				target: 'complete',
				animated: true,
				style: { stroke: 'var(--color_main)', strokeWidth: 2 },
				markerEnd: { type: 'ArrowClosed', color: 'var(--color_main)', width: 8, height: 8 }
			}
		}
	},

	// 18. Complete 节点完成
	{
		type: 'node_complete',
		delay: 100,
		data: {
			nodeId: 'complete',
			node: {
				id: 'complete',
				type: 'complete',
				data: {
					label: 'Complete',
					description: '执行完成',
					type: 'complete',
					status: 'success',
					duration: 5
				}
			},
			edge: {
				id: 'e-format-complete',
				source: 'format-1',
				target: 'complete',
				animated: false,
				style: { stroke: 'var(--color_success)', strokeWidth: 2 },
				markerEnd: { type: 'ArrowClosed', color: 'var(--color_success)', width: 8, height: 8 }
			}
		}
	},

	// 19. 完成
	{
		type: 'complete',
		delay: 500,
		data: {}
	}
]

// Mock SSE 连接类
export class MockSSEConnection {
	private callbacks: ((event: SSEEvent) => void)[] = []
	private currentIndex = 0
	private timeoutId: NodeJS.Timeout | null = null

	// 连接并开始发送事件（使用每个事件的自定义延迟）
	connect(onEvent: (event: SSEEvent) => void) {
		this.callbacks.push(onEvent)
		this.sendNextEvent()
	}

	// 发送下一个事件
	private sendNextEvent() {
		if (this.currentIndex >= mockSSEEvents.length) {
			this.disconnect()
			return
		}

		const event = mockSSEEvents[this.currentIndex]
		const delay = event.delay || 800 // 默认 800ms

		this.timeoutId = setTimeout(() => {
			this.callbacks.forEach((cb) => cb(event))
			this.currentIndex++
			this.sendNextEvent() // 递归发送下一个事件
		}, delay)
	}

	// 断开连接
	disconnect() {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId)
			this.timeoutId = null
		}
		this.callbacks = []
		this.currentIndex = 0
	}
}
