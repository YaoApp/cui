import React, { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { getLocale } from '@umijs/max'
import { Typography } from 'antd'
import vars from '@/styles/preset/vars'
import styles from './GraphVisualization.less'

const { Text } = Typography

// 获取主题相关颜色
const getThemeColors = () => {
	const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
	const theme = isDark ? vars.dark : vars.light

	return {
		// 主色 - 实体节点颜色
		primary: theme.color_primary,
		// 文本颜色 - 实体标签
		textPrimary: theme.color_text,
		textSecondary: theme.color_text_grey,
		// 背景颜色 - 关系标签背景
		bgCard: theme.color_bg_menu,
		// 边框颜色 - 关系标签边框
		borderCard: theme.color_border,
		// 连线颜色
		lineColor: theme.color_text_grey
	}
}

interface EntityNode {
	id: string
	name: string
	type: 'person' | 'organization' | 'location' | 'concept' | 'event' | 'object'
	level?: number // 1-3 级别
	properties?: Record<string, any>
}

interface RelationEdge {
	id: string
	source: string
	target: string
	relation: string
	weight: number
}

interface GraphVisualizationProps {
	nodes: EntityNode[]
	edges: RelationEdge[]
	className?: string
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({ nodes, edges, className }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const containerRef = useRef<HTMLDivElement>(null)
	const chartRef = useRef<echarts.ECharts | null>(null)
	const [loading, setLoading] = useState(true)
	const [dimensions, setDimensions] = useState({ width: 800, height: 500 })

	// 转换数据为 ECharts Graph 格式
	const transformDataForECharts = () => {
		const themeColors = getThemeColors()

		// 数据验证和清理
		if (!Array.isArray(nodes) || !Array.isArray(edges)) {
			console.warn('Invalid nodes or edges data:', { nodes, edges })
			return { nodes: [], links: [] }
		}

		// 去重节点 - 使用 Map 来确保 ID 唯一
		const nodeMap = new Map<string, EntityNode>()
		nodes.forEach((node) => {
			if (node && node.id && node.name) {
				nodeMap.set(node.id, node)
			}
		})
		const uniqueNodes = Array.from(nodeMap.values())

		// 创建节点ID集合用于验证边
		const nodeIds = new Set(uniqueNodes.map((node) => node.id))

		// 转换节点数据
		const chartNodes = uniqueNodes.map((node) => {
			const level = node.level || 1
			const sizeMap = {
				1: { symbolSize: 80, fontSize: 15 }, // L1 最大 - 从60增加到80
				2: { symbolSize: 65, fontSize: 13 }, // L2 中等 - 从45增加到65
				3: { symbolSize: 50, fontSize: 11 } // L3 最小 - 从30增加到50
			}
			const size = sizeMap[level as keyof typeof sizeMap] || sizeMap[1]

			return {
				id: node.id,
				name: node.name,
				symbolSize: size.symbolSize,
				category: level - 1, // ECharts 分类从0开始
				label: {
					show: true,
					fontSize: size.fontSize,
					fontWeight: 500,
					color: themeColors.primary // 使用主题主色
				},
				itemStyle: {
					borderColor: themeColors.primary,
					borderWidth: 1.5,
					color: themeColors.bgCard // 使用主题背景色
				},
				// 存储原始数据
				originalData: node
			}
		})

		// 过滤和转换边数据 - 只保留有效的边
		const validEdges = edges.filter((edge) => {
			if (!edge || !edge.id || !edge.source || !edge.target) {
				console.warn('Invalid edge data:', edge)
				return false
			}
			// 检查源节点和目标节点是否存在
			if (!nodeIds.has(edge.source)) {
				console.warn(`Edge source node not found: ${edge.source}`, edge)
				return false
			}
			if (!nodeIds.has(edge.target)) {
				console.warn(`Edge target node not found: ${edge.target}`, edge)
				return false
			}
			return true
		})

		const chartLinks = validEdges.map((edge) => {
			return {
				id: edge.id,
				source: edge.source,
				target: edge.target,
				name: edge.relation || 'unknown', // 这是显示在连线上的文字
				value: edge.weight || 1, // 使用权重作为数值
				lineStyle: {
					color: themeColors.lineColor,
					width: Math.max(0.8, (edge.weight || 1) * 1.5),
					curveness: 0.2 // 曲线效果
				},
				label: {
					show: true,
					fontSize: 9,
					color: themeColors.textSecondary,
					backgroundColor: themeColors.bgCard,
					borderColor: themeColors.borderCard,
					borderWidth: 0.5,
					borderRadius: 3,
					padding: [2, 4],
					formatter: (params: any) => params.data.name // 显示关系名称
				},
				// 存储原始数据
				originalData: edge
			}
		})

		console.log('Transformed data:', {
			originalNodes: nodes.length,
			uniqueNodes: chartNodes.length,
			originalEdges: edges.length,
			validEdges: chartLinks.length
		})

		return { nodes: chartNodes, links: chartLinks }
	}

	// 监听容器尺寸变化
	useEffect(() => {
		if (!containerRef.current) return

		const updateDimensions = () => {
			if (containerRef.current) {
				const rect = containerRef.current.getBoundingClientRect()
				const { width, height } = rect

				// 确保获取到有效的尺寸
				if (width > 0 && height > 0) {
					setDimensions({ width, height })
				}
			}
		}

		// 延迟获取尺寸，确保容器已完全渲染
		const timer = setTimeout(updateDimensions, 100)

		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0]
			if (entry) {
				const { width, height } = entry.contentRect
				if (width > 0 && height > 0) {
					setDimensions({ width, height })
				}
			}
		})

		resizeObserver.observe(containerRef.current)

		return () => {
			clearTimeout(timer)
			resizeObserver.disconnect()
		}
	}, [])

	// 初始化 ECharts 图谱
	useEffect(() => {
		if (!containerRef.current || !nodes.length || dimensions.width === 0 || dimensions.height === 0) return

		// 销毁现有的图表实例
		if (chartRef.current) {
			chartRef.current.dispose()
			chartRef.current = null
		}

		const { width, height } = dimensions

		try {
			const { nodes: chartNodes, links: chartLinks } = transformDataForECharts()

			// 如果没有有效的节点数据，不进行渲染
			if (!chartNodes.length) {
				console.warn('No valid nodes to render')
				setLoading(false)
				return
			}

			const themeColors = getThemeColors()

			// 创建 ECharts 实例
			const chart = echarts.init(containerRef.current, undefined, {
				width,
				height,
				renderer: 'canvas', // 使用 canvas 渲染器以提高性能
				devicePixelRatio: window.devicePixelRatio || 1
			})

			chartRef.current = chart

			// 配置图谱选项
			const option: echarts.EChartsOption = {
				backgroundColor: 'transparent',
				animationDuration: 300,
				animationEasingUpdate: 'quinticInOut',
				// 确保没有任何内置边距
				graphic: [],
				series: [
					{
						type: 'graph',
						layout: 'force',
						data: chartNodes,
						links: chartLinks,
						categories: [
							{ name: 'Level 1', itemStyle: { color: themeColors.primary } },
							{ name: 'Level 2', itemStyle: { color: themeColors.primary } },
							{ name: 'Level 3', itemStyle: { color: themeColors.primary } }
						],
						roam: true, // 启用缩放和平移
						draggable: true, // 启用拖拽
						focusNodeAdjacency: true, // 鼠标悬停时高亮相邻节点
						// 让图表充满整个区域 - 使用负值进一步扩展
						left: -10,
						right: -10,
						top: -10,
						bottom: -10,
						force: {
							// 力导向布局配置 - 节点增大后需要更多空间
							repulsion: [250, 400], // 进一步增加节点间斥力，适应更大的节点
							gravity: 0.015, // 进一步减少向中心的引力
							edgeLength: [100, 180], // 增加边的长度，给更大的节点更多空间
							layoutAnimation: true,
							friction: 0.6 // 增加摩擦力，让布局更稳定
						},
						label: {
							show: true,
							position: 'inside',
							formatter: '{b}' // 显示节点名称
						},
						edgeLabel: {
							show: true,
							fontSize: 9,
							color: themeColors.textSecondary,
							backgroundColor: themeColors.bgCard,
							borderColor: themeColors.borderCard,
							borderWidth: 0.5,
							borderRadius: 3,
							padding: [2, 4],
							formatter: (params: any) => params.data.name // 显示边的关系名称
						},
						lineStyle: {
							opacity: 0.7,
							curveness: 0.2
						},
						emphasis: {
							focus: 'adjacency',
							lineStyle: {
								width: 3,
								opacity: 1
							},
							itemStyle: {
								borderWidth: 3
							}
						}
					}
				]
			}

			// 设置配置并渲染
			chart.setOption(option)

			// 添加交互事件
			chart.on('click', (params) => {
				if (params.dataType === 'node') {
					const nodeData = params.data as any
					console.log('Node clicked:', nodeData.originalData)
				} else if (params.dataType === 'edge') {
					const edgeData = params.data as any
					console.log('Edge clicked:', edgeData.originalData)
				}
			})

			// 图表渲染完成
			setLoading(false)

			return () => {
				if (chart && !chart.isDisposed()) {
					chart.dispose()
				}
			}
		} catch (error) {
			console.error('Error initializing ECharts graph:', error)
			setLoading(false)
			// 可以在这里设置一个错误状态来显示错误信息
		}
	}, [nodes, edges, dimensions])

	// 响应式调整
	useEffect(() => {
		if (chartRef.current && dimensions.width > 0 && dimensions.height > 0) {
			chartRef.current.resize({
				width: dimensions.width,
				height: dimensions.height
			})
		}
	}, [dimensions])

	if (!nodes.length) {
		return (
			<div className={styles.emptyGraph}>
				<Text type='secondary'>{is_cn ? '暂无图谱数据' : 'No graph data'}</Text>
			</div>
		)
	}

	return (
		<div className={`${styles.graphVisualization} ${className || ''}`}>
			<div ref={containerRef} className={styles.graphContainer} />
			{loading && (
				<div className={styles.loadingOverlay}>
					<Text type='secondary'>{is_cn ? '正在生成图谱...' : 'Generating graph...'}</Text>
				</div>
			)}
		</div>
	)
}

export default GraphVisualization
