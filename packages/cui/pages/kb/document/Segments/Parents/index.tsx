import React, { useState, useEffect } from 'react'
import { Typography, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { Segment } from '@/openapi/kb/types'
import styles from '../detail.less'
import localStyles from './index.less'

const { Text } = Typography

interface ParentSegment {
	id: string
	text: string
	depth: number
	weight: number
	score?: number
	metadata?: {
		chunk_details?: {
			depth?: number
			index?: number
		}
	}
}

interface ParentsData {
	parents: ParentSegment[]
	total_count: number
}

interface ParentsViewProps {
	segmentData: Segment
}

const ParentsView: React.FC<ParentsViewProps> = ({ segmentData }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [parentsData, setParentsData] = useState<ParentsData | null>(null)

	// 模拟加载父级分段数据
	const loadParentsData = async () => {
		setLoading(true)
		try {
			// TODO: 实际的 API 调用
			// if (window.$app?.openapi) {
			// 	const kb = new KB(window.$app.openapi)
			// 	const response = await kb.GetSegmentParents(segmentData.id)
			// 	if (!window.$app.openapi.IsError(response)) {
			// 		setParentsData(response)
			// 		return
			// 	}
			// }

			// 模拟 API 延迟
			await new Promise((resolve) => setTimeout(resolve, 1500))

			// Mock 数据 - 模拟当前分段的父级分段
			const mockData: ParentsData = {
				parents: [
					{
						id: 'parent_1',
						text: '人工智能是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。',
						depth: 1,
						weight: 0.95,
						score: 8.7,
						metadata: {
							chunk_details: {
								depth: 1,
								index: 0
							}
						}
					},
					{
						id: 'parent_2',
						text: '机器学习是人工智能的一个重要分支，它让计算机能够通过数据自动学习和改进，而无需明确编程。',
						depth: 2,
						weight: 0.88,
						score: 8.2,
						metadata: {
							chunk_details: {
								depth: 2,
								index: 1
							}
						}
					}
				],
				total_count: 2
			}

			setParentsData(mockData)
		} catch (error) {
			console.error('Failed to load parents data:', error)
			message.error(is_cn ? '加载父级分段失败' : 'Failed to load parent segments')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadParentsData()
	}, [segmentData.id])

	return (
		<div className={styles.tabContent}>
			{/* Header - 与 Editor/Graph 一致的头部风格，但没有中间指标和操作按钮 */}
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
				{/* 没有中间指标和操作按钮 */}
			</div>

			{/* Body - 内容区域暂时留空，背景色与 Graph 一致 */}
			<div className={localStyles.parentsBody}>
				<div className={localStyles.parentsSection}>
					{loading ? (
						<div className={localStyles.loadingState}>
							<Icon name='material-hourglass_empty' size={48} />
							<Text>{is_cn ? '加载父级分段中...' : 'Loading parent segments...'}</Text>
						</div>
					) : parentsData && parentsData.parents.length > 0 ? (
						<div className={localStyles.parentsContent}>
							{/* 内容区域暂时留空，后续优化 */}
							<div className={localStyles.placeholderContent}>
								<Icon name='material-account_tree' size={48} />
								<Text style={{ fontSize: 16, fontWeight: 500 }}>
									{is_cn ? '层级结构' : 'Hierarchy Structure'}
								</Text>
								<Text style={{ color: 'var(--color_neo_text_secondary)' }}>
									{is_cn
										? `找到 ${parentsData.total_count} 个父级分段，内容展示功能开发中...`
										: `Found ${parentsData.total_count} parent segments, content display feature in development...`}
								</Text>
							</div>
						</div>
					) : (
						<div className={localStyles.emptyState}>
							<Icon name='material-account_tree' size={48} />
							<Text>{is_cn ? '没有找到父级分段' : 'No parent segments found'}</Text>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default ParentsView
