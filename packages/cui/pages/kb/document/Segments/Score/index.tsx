import React, { useState, useEffect } from 'react'
import { Spin, Typography } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'

import { Segment } from '@/openapi/kb/types'
import styles from '../detail.less'
import localStyles from './index.less'

const { Text } = Typography

interface ScoreData {
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
			{/* Header - 与Editor一致的结构 */}
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
						{is_cn ? '计算公式' : 'Formula'}{' '}
						<span className={localStyles.metaNumber} style={{ fontFamily: 'monospace' }}>
							{scoreData?.formula || 'N/A'}
						</span>
					</span>
				</div>
			</div>

			{/* Body - 内容区域暂时留空 */}
			<div className={localStyles.scoreBody}>
				<div className={localStyles.scoreSection}>
					{loading ? (
						<div className={localStyles.loadingState}>
							<Icon name='material-hourglass_empty' size={32} />
							<Text>{is_cn ? '加载评分数据中...' : 'Loading score data...'}</Text>
						</div>
					) : !scoreData ? (
						<div className={localStyles.emptyState}>
							<Icon name='material-star' size={48} />
							<Text type='secondary'>
								{is_cn ? '暂无评分数据' : 'No score data available'}
							</Text>
						</div>
					) : (
						<div className={localStyles.contentPlaceholder}>
							<Text type='secondary'>
								{is_cn
									? '评分详情内容待实现...'
									: 'Score details content coming soon...'}
							</Text>
						</div>
					)}
				</div>
			</div>

			{/* Footer - 暂时留空 */}
			<div className={localStyles.scoreFooter}>{/* 后续可添加操作按钮或其他信息 */}</div>
		</div>
	)
}

export default ScoreView
