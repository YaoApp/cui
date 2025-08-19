import React, { useState, useEffect } from 'react'
import { Spin, Typography } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'

import { Segment } from '@/openapi/kb/types'
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
}

const ScoreView: React.FC<ScoreViewProps> = ({ segmentData }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [scoreData, setScoreData] = useState<ScoreData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		loadScoreData()
	}, [segmentData.id])

	const loadScoreData = async () => {
		try {
			setLoading(true)
			// 模拟API请求延时
			await new Promise((resolve) => setTimeout(resolve, 100))

			// 模拟评分计算公式数据
			const mockData: ScoreData = {
				final_score: 8.6,
				steps: [
					{
						id: 'relevance',
						name: is_cn ? '相关性' : 'Relevance',
						value: 9.2,
						weight: 0.4,
						weighted_value: 3.68,
						description: is_cn
							? '内容与查询的相关程度'
							: 'How relevant the content is to the query'
					},
					{
						id: 'quality',
						name: is_cn ? '质量' : 'Quality',
						value: 8.5,
						weight: 0.3,
						weighted_value: 2.55,
						description: is_cn
							? '内容的整体质量评估'
							: 'Overall quality assessment of the content'
					},
					{
						id: 'freshness',
						name: is_cn ? '时效性' : 'Freshness',
						value: 7.8,
						weight: 0.2,
						weighted_value: 1.56,
						description: is_cn
							? '内容的时效性和新鲜度'
							: 'Timeliness and freshness of the content'
					},
					{
						id: 'authority',
						name: is_cn ? '权威性' : 'Authority',
						value: 8.1,
						weight: 0.1,
						weighted_value: 0.81,
						description: is_cn ? '内容来源的权威性' : 'Authority of the content source'
					}
				],
				formula: 'Score = (Relevance × 0.4) + (Quality × 0.3) + (Freshness × 0.2) + (Authority × 0.1)',
				description: is_cn
					? '综合评分基于相关性、质量、时效性和权威性四个维度计算'
					: 'Comprehensive score calculated based on relevance, quality, freshness, and authority'
			}

			setScoreData(mockData)
		} catch (error) {
			console.error('Failed to load score data:', error)
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
							{loading ? '--' : scoreData?.final_score?.toFixed(2) || 'N/A'}
						</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '维度数' : 'Dimensions'}{' '}
						<span className={localStyles.metaNumber}>{scoreData?.steps?.length || 0}</span>
					</span>
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
					) : !scoreData ? (
						<div className={localStyles.emptyState}>
							<Icon name='material-star' size={48} />
							<Text type='secondary'>
								{is_cn ? '暂无评分数据' : 'No score data available'}
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
