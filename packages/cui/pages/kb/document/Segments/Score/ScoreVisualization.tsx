import React, { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { getLocale } from '@umijs/max'
import { Typography } from 'antd'
import vars from '@/styles/preset/vars'
import styles from './ScoreVisualization.less'

const { Text } = Typography

// 获取主题相关颜色
const getThemeColors = () => {
	const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
	const theme = isDark ? vars.dark : vars.light

	return {
		primary: theme.color_primary,
		textPrimary: theme.color_text,
		textSecondary: theme.color_text_grey,
		bgCard: theme.color_bg_menu,
		borderCard: theme.color_border,
		lineColor: theme.color_text_grey
	}
}

interface ScoreStep {
	id: string
	name: string
	value: number
	weight: number
	weighted_value: number
	description: string
}

interface ScoreVisualizationProps {
	steps: ScoreStep[]
	finalScore: number
	className?: string
}

const ScoreVisualization: React.FC<ScoreVisualizationProps> = ({ steps, finalScore, className }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const containerRef = useRef<HTMLDivElement>(null)
	const chartRef = useRef<echarts.ECharts | null>(null)
	const [loading, setLoading] = useState(true)
	const [dimensions, setDimensions] = useState({ width: 800, height: 500 })

	// 监听容器尺寸变化
	useEffect(() => {
		if (!containerRef.current) return

		const updateDimensions = () => {
			if (containerRef.current) {
				const rect = containerRef.current.getBoundingClientRect()
				const { width, height } = rect

				if (width > 0 && height > 0) {
					setDimensions({ width, height })
				}
			}
		}

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

	// 初始化 ECharts
	useEffect(() => {
		if (!containerRef.current || !steps.length || dimensions.width === 0 || dimensions.height === 0) return

		// 销毁现有的图表实例
		if (chartRef.current) {
			chartRef.current.dispose()
			chartRef.current = null
		}

		const { width, height } = dimensions
		const themeColors = getThemeColors()

		// 创建 ECharts 实例
		const chart = echarts.init(containerRef.current, undefined, {
			width,
			height,
			renderer: 'canvas',
			devicePixelRatio: window.devicePixelRatio || 1
		})

		chartRef.current = chart

		// 生成渐变色
		const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272']

		// 响应式设计：根据容器大小调整
		const isSmall = width < 500 || height < 400
		const isMedium = width < 700 || height < 500

		// 动态字体大小
		const titleFontSize = isSmall ? 20 : isMedium ? 28 : 42
		const subtitleFontSize = isSmall ? 10 : isMedium ? 12 : 16
		const labelFontSize = isSmall ? 11 : isMedium ? 12 : 14

		// 动态圆环大小
		const innerRadius = isSmall ? '30%' : isMedium ? '28%' : '25%'
		const outerRadius = isSmall ? '45%' : isMedium ? '40%' : '35%'

		// 使用环形饼图展示评分结构
		const option: echarts.EChartsOption = {
			backgroundColor: 'transparent',
			animationDuration: 600,
			animationEasing: 'cubicOut',
			graphic: [
				{
					type: 'text',
					left: 'center',
					top: '37%',
					style: {
						text: finalScore.toFixed(2),
						fontSize: titleFontSize,
						fontWeight: 700,
						fill: themeColors.primary,
						fontFamily:
							'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
						textAlign: 'center'
					}
				},
				{
					type: 'text',
					left: 'center',
					top: '43%',
					style: {
						text: is_cn ? '综合评分' : 'Final Score',
						fontSize: subtitleFontSize,
						fontWeight: 500,
						fill: themeColors.textSecondary,
						textAlign: 'center'
					}
				}
			],
			tooltip: {
				trigger: 'item',
				formatter: (params: any) => {
					const step = steps.find((s) => s.name === params.name)
					if (step) {
						const percentage = ((step.weighted_value / finalScore) * 100).toFixed(1)
						return `${step.name}<br/>原始分数: ${step.value.toFixed(1)}<br/>权重: ${
							step.weight
						}<br/>加权分数: ${step.weighted_value.toFixed(2)}<br/>占比: ${percentage}%`
					}
					return params.name
				}
			},
			series: [
				{
					name: is_cn ? '评分结构' : 'Score Structure',
					type: 'pie',
					radius: [innerRadius, outerRadius], // 响应式尺寸
					center: ['50%', '40%'], // 向下移动到 40%
					avoidLabelOverlap: false,
					itemStyle: {
						borderRadius: 6,
						borderColor: '#fff',
						borderWidth: 2
					},
					label: {
						show: true,
						position: 'outside',
						formatter: (params: any) => {
							const step = steps.find((s) => s.name === params.name)
							if (step) {
								return `${step.name}\n${step.weighted_value.toFixed(2)}`
							}
							return params.name
						},
						fontSize: labelFontSize,
						color: themeColors.textPrimary,
						fontWeight: 500
					},
					emphasis: {
						label: {
							show: true,
							fontSize: labelFontSize + 2,
							fontWeight: 600
						},
						itemStyle: {
							shadowBlur: 8,
							shadowOffsetX: 0,
							shadowColor: 'rgba(0, 0, 0, 0.2)'
						}
					},
					labelLine: {
						show: true,
						lineStyle: {
							color: themeColors.borderCard
						}
					},
					data: steps.map((step, index) => ({
						value: step.weighted_value,
						name: step.name,
						itemStyle: {
							color: colors[index % colors.length]
						}
					}))
				}
			]
		}

		// 设置配置并渲染
		chart.setOption(option)

		// 图表渲染完成
		setLoading(false)

		return () => {
			chart.dispose()
		}
	}, [steps, finalScore, dimensions])

	// 响应式调整
	useEffect(() => {
		if (chartRef.current && dimensions.width > 0 && dimensions.height > 0) {
			chartRef.current.resize({
				width: dimensions.width,
				height: dimensions.height
			})
		}
	}, [dimensions])

	if (!steps.length) {
		return (
			<div className={styles.emptyScore}>
				<Text type='secondary'>{is_cn ? '暂无评分数据' : 'No score data'}</Text>
			</div>
		)
	}

	return (
		<div className={`${styles.scoreVisualization} ${className || ''}`}>
			<div ref={containerRef} className={styles.scoreContainer} />
			{loading && (
				<div className={styles.loadingOverlay}>
					<Text type='secondary'>{is_cn ? '正在生成评分图...' : 'Generating score chart...'}</Text>
				</div>
			)}
		</div>
	)
}

export default ScoreVisualization
