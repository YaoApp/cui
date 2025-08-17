import React, { useState, useEffect } from 'react'
import { Spin, Typography } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'

import { Segment } from '@/openapi/kb/types'
import styles from '../detail.less'
import localStyles from './index.less'

const { Text } = Typography

interface HitsData {
	totalHits: number
	hitsByScenario: {
		[key: string]: number
	}
}

interface HitsViewProps {
	segmentData: Segment
}

const HitsView: React.FC<HitsViewProps> = ({ segmentData }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [hitsData, setHitsData] = useState<HitsData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		loadHitsData()
	}, [segmentData.id])

	const loadHitsData = async () => {
		try {
			setLoading(true)
			// 模拟API请求延时
			await new Promise((resolve) => setTimeout(resolve, 100))

			// 模拟命中数据
			const mockData: HitsData = {
				totalHits: 156,
				hitsByScenario: {
					智能问答: 89,
					文档检索: 45,
					知识推荐: 22
				}
			}

			setHitsData(mockData)
		} catch (error) {
			console.error('Failed to load hits data:', error)
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
						{is_cn ? '总命中' : 'Total Hits'}{' '}
						<span className={localStyles.metaNumber}>{hitsData?.totalHits || 0}</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '场景数' : 'Scenarios'}{' '}
						<span className={localStyles.metaNumber}>
							{Object.keys(hitsData?.hitsByScenario || {}).length}
						</span>
					</span>
				</div>
			</div>

			{/* Body - 内容区域暂时留空 */}
			<div className={localStyles.hitsBody}>
				<div className={localStyles.hitsSection}>
					{loading ? (
						<div className={localStyles.loadingState}>
							<Icon name='material-hourglass_empty' size={32} />
							<Text>{is_cn ? '加载命中数据中...' : 'Loading hits data...'}</Text>
						</div>
					) : !hitsData ? (
						<div className={localStyles.emptyState}>
							<Icon name='material-target' size={48} />
							<Text type='secondary'>
								{is_cn ? '暂无命中数据' : 'No hits data available'}
							</Text>
						</div>
					) : (
						<div className={localStyles.contentPlaceholder}>
							<Text type='secondary'>
								{is_cn
									? '命中详情内容待实现...'
									: 'Hits details content coming soon...'}
							</Text>
						</div>
					)}
				</div>
			</div>

			{/* Footer - 暂时留空 */}
			<div className={localStyles.hitsFooter}>{/* 后续可添加操作按钮或其他信息 */}</div>
		</div>
	)
}

export default HitsView
