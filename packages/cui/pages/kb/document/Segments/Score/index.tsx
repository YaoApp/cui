import React, { useState, useEffect } from 'react'
import { Spin, Typography, Button, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'

import { Segment, SegmentScore, UpdateScoresRequest } from '@/openapi/kb/types'
import { KB } from '@/openapi'
import ScoreVisualization from './ScoreVisualization'
import styles from '../detail.less'
import localStyles from './index.less'

const { Text } = Typography

interface ScoreStep {
	id: string
	name: string
	value: number
	weight: number
	weighted_value: number
	description: string
}

interface ScoreData {
	final_score: number
	steps: ScoreStep[]
	formula: string
	description: string
}

interface ScoreViewProps {
	segmentData: Segment
	docID: string
}

const ScoreView: React.FC<ScoreViewProps> = ({ segmentData, docID }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [scoreData, setScoreData] = useState<ScoreData | null>(null)
	const [loading, setLoading] = useState(true)
	const [addingTestData, setAddingTestData] = useState(false)

	useEffect(() => {
		loadScoreData()
	}, [segmentData.id])

	// 生成随机测试数据
	const generateTestData = (): UpdateScoresRequest => {
		const dimensions = {
			relevance: Math.random() * 2 + 8, // 8-10
			quality: Math.random() * 2 + 7, // 7-9
			freshness: Math.random() * 3 + 6, // 6-9
			authority: Math.random() * 2 + 7, // 7-9
			coherence: Math.random() * 2 + 7.5 // 7.5-9.5
		}

		// Calculate weighted final score
		const finalScore =
			dimensions.relevance * 0.4 +
			dimensions.quality * 0.3 +
			dimensions.freshness * 0.2 +
			dimensions.authority * 0.1

		const testScore: SegmentScore = {
			id: segmentData.id,
			score: finalScore,
			dimensions: dimensions
		}

		return {
			scores: [testScore]
		}
	}

	// 添加测试数据
	const handleAddTestData = async () => {
		if (!window.$app?.openapi) {
			message.error(is_cn ? '系统未就绪' : 'System not ready')
			return
		}

		try {
			setAddingTestData(true)

			// 生成测试数据
			const testData = generateTestData()

			// 调用 UpdateScores API
			const kb = new KB(window.$app.openapi)
			const response = await kb.UpdateScores(docID, testData)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to add test data')
			}

			// 显示成功信息
			message.success(is_cn ? '测试数据添加成功！' : 'Test data added successfully!')

			// 刷新数据
			loadScoreData()
		} catch (error) {
			console.error('Failed to add test data:', error)
			const errorMsg =
				error instanceof Error ? error.message : is_cn ? '添加测试数据失败' : 'Failed to add test data'
			message.error({
				content: (
					<div>
						<div style={{ fontWeight: 'bold', marginBottom: 4 }}>
							{is_cn ? '添加失败' : 'Add Failed'}
						</div>
						<div style={{ fontSize: '12px', color: '#666' }}>{errorMsg}</div>
					</div>
				),
				duration: 8
			})
		} finally {
			setAddingTestData(false)
		}
	}

	// Helper functions for dimension names and descriptions
	const getDimensionNameCN = (key: string): string => {
		const names: Record<string, string> = {
			relevance: '相关性',
			quality: '质量',
			freshness: '时效性',
			authority: '权威性',
			coherence: '连贯性'
		}
		return names[key] || key
	}

	const getDimensionNameEN = (key: string): string => {
		const names: Record<string, string> = {
			relevance: 'Relevance',
			quality: 'Quality',
			freshness: 'Freshness',
			authority: 'Authority',
			coherence: 'Coherence'
		}
		return names[key] || key
	}

	const getDimensionDescriptionCN = (key: string): string => {
		const descriptions: Record<string, string> = {
			relevance: '内容与查询的相关程度',
			quality: '内容的整体质量评估',
			freshness: '内容的时效性和新鲜度',
			authority: '内容来源的权威性',
			coherence: '内容的逻辑连贯性'
		}
		return descriptions[key] || '评分维度'
	}

	const getDimensionDescriptionEN = (key: string): string => {
		const descriptions: Record<string, string> = {
			relevance: 'How relevant the content is to the query',
			quality: 'Overall quality assessment of the content',
			freshness: 'Timeliness and freshness of the content',
			authority: 'Authority of the content source',
			coherence: 'Logical coherence of the content'
		}
		return descriptions[key] || 'Score dimension'
	}

	const generateFormula = (steps: ScoreStep[]): string => {
		if (steps.length === 0) return ''
		const terms = steps.map((step) => `${step.name} × ${step.weight}`)
		return `Score = (${terms.join(') + (')})`
	}

	// Helper function to safely parse score dimensions
	const parseScoreDimensions = (data: any): Record<string, number> | undefined => {
		if (!data) return undefined

		// If it's already an object, return it
		if (typeof data === 'object' && !Array.isArray(data)) {
			return data as Record<string, number>
		}

		// If it's a string, try to parse it
		if (typeof data === 'string') {
			try {
				// Handle Go map string format: "map[key1:value1 key2:value2]"
				if (data.startsWith('map[') && data.endsWith(']')) {
					const mapContent = data.slice(4, -1) // Remove "map[" and "]"
					const pairs = mapContent.split(' ')
					const result: Record<string, number> = {}

					pairs.forEach((pair) => {
						const [key, valueStr] = pair.split(':')
						if (key && valueStr) {
							const value = parseFloat(valueStr)
							if (!isNaN(value)) {
								result[key] = value
							}
						}
					})

					return Object.keys(result).length > 0 ? result : undefined
				}

				// Try to parse as JSON
				const parsed = JSON.parse(data)
				return typeof parsed === 'object' ? parsed : undefined
			} catch (e) {
				console.warn('Failed to parse score_dimensions string:', data, e)
				return undefined
			}
		}

		return undefined
	}

	// Helper function to safely convert value to number
	const safeToNumber = (value: any, defaultValue: number = 0): number => {
		if (typeof value === 'number' && !isNaN(value)) {
			return value
		}
		if (typeof value === 'string') {
			const parsed = parseFloat(value)
			return isNaN(parsed) ? defaultValue : parsed
		}
		return defaultValue
	}

	const loadScoreData = async () => {
		try {
			setLoading(true)

			// Get score data - try both root field and metadata
			const score = safeToNumber(segmentData.score, 0)
			let scoreDimensions = parseScoreDimensions(segmentData.score_dimensions)

			// Fallback to metadata if root field is not available
			if (!scoreDimensions) {
				scoreDimensions = parseScoreDimensions(segmentData.metadata?.score_dimensions)
			}

			// If no score data, show default state with 0.00
			if (!score && !scoreDimensions) {
				setScoreData({
					final_score: 0.0,
					steps: [],
					formula: '',
					description: is_cn ? '暂无评分数据' : 'No score data available'
				})
				return
			}

			// Convert backend data to frontend format
			const steps: ScoreStep[] = []
			let calculatedScore = score

			if (scoreDimensions) {
				const dimensionWeights: Record<string, number> = {
					relevance: 0.4,
					quality: 0.3,
					freshness: 0.2,
					authority: 0.1,
					coherence: 0.05
				}

				calculatedScore = 0
				Object.entries(scoreDimensions).forEach(([key, value]) => {
					const safeValue = safeToNumber(value, 0)
					const weight = dimensionWeights[key] || 0.1
					const weightedValue = safeValue * weight
					calculatedScore += weightedValue

					steps.push({
						id: key,
						name: is_cn ? getDimensionNameCN(key) : getDimensionNameEN(key),
						value: safeValue,
						weight: weight,
						weighted_value: weightedValue,
						description: is_cn ? getDimensionDescriptionCN(key) : getDimensionDescriptionEN(key)
					})
				})
			}

			const scoreData: ScoreData = {
				final_score: calculatedScore,
				steps: steps,
				formula: generateFormula(steps),
				description: is_cn
					? '综合评分基于多个维度的加权计算'
					: 'Comprehensive score based on weighted calculation of multiple dimensions'
			}

			setScoreData(scoreData)
		} catch (error) {
			console.error('Failed to load score data:', error)
			setScoreData({
				final_score: 0.0,
				steps: [],
				formula: '',
				description: is_cn ? '评分数据加载失败' : 'Failed to load score data'
			})
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className={styles.tabContent}>
			{/* Header - 与其他组件一致的结构 */}
			<div className={`${styles.tabHeader} ${localStyles.cardHeader}`}>
				<div className={localStyles.chunkMeta}>
					<span className={localStyles.chunkNumber}>
						{segmentData.metadata?.chunk_details?.depth !== undefined &&
						segmentData.metadata?.chunk_details?.index !== undefined ? (
							<>
								<span className={localStyles.levelInfo}>
									<Icon name='material-account_tree' size={10} />
									{segmentData.metadata.chunk_details.depth}
								</span>
								<span>#{segmentData.metadata.chunk_details.index + 1}</span>
							</>
						) : (
							`#${segmentData.id.slice(-8)}`
						)}
					</span>
				</div>
				<div className={localStyles.metaInfo}>
					<span className={localStyles.metaItem}>
						{is_cn ? '综合评分' : 'Score'}{' '}
						<span className={localStyles.metaNumber}>
							{loading ? '--' : scoreData?.final_score?.toFixed(2) || '0.00'}
						</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '维度数' : 'Dimensions'}{' '}
						<span className={localStyles.metaNumber}>{scoreData?.steps?.length || 0}</span>
					</span>
					<Button
						type='primary'
						ghost
						size='small'
						loading={addingTestData}
						onClick={handleAddTestData}
						icon={<Icon name='material-add_circle' size={14} />}
					>
						{is_cn ? '添加测试数据' : 'Add Test Data'}
					</Button>
				</div>
			</div>

			{/* Body - 与Graph组件一致的结构 */}
			<div className={localStyles.scoreBody}>
				<div className={localStyles.scoreSection}>
					{loading ? (
						<div className={localStyles.loadingState}>
							<Icon name='material-hourglass_empty' size={32} />
							<Text>{is_cn ? '正在加载评分数据...' : 'Loading score data...'}</Text>
						</div>
					) : !scoreData || scoreData.steps.length === 0 ? (
						<div className={localStyles.emptyState}>
							<Icon name='material-star' size={48} />
							<Text type='secondary'>
								{scoreData?.final_score === 0
									? is_cn
										? `当前评分: ${scoreData.final_score.toFixed(
												2
										  )}，暂无维度信息`
										: `Current Score: ${scoreData.final_score.toFixed(
												2
										  )}, No dimension data available`
									: is_cn
									? '暂无评分数据'
									: 'No score data available'}
							</Text>
						</div>
					) : (
						<div className={localStyles.scoreContent}>
							{/* 评分可视化组件 */}
							<ScoreVisualization
								steps={scoreData.steps}
								finalScore={scoreData.final_score}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default ScoreView
