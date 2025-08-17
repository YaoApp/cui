import React, { useState, useEffect } from 'react'
import { Typography, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { Segment } from '@/openapi/kb/types'
import ParentsViewer from './ParentsViewer'
import styles from '../detail.less'
import localStyles from './index.less'

const { Text } = Typography

// 使用与 List 接口一致的 Segment 数据结构
interface ParentsData {
	parents: Segment[]
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

			// Mock 数据 - 模拟第三层分段的情况（有两个父级分段）
			const mockData: ParentsData = {
				parents: [
					{
						id: 'segment_parent_1',
						text: '人工智能是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器，包括机器人、语言识别、图像识别、自然语言处理和专家系统等。人工智能从诞生以来，理论和技术日益成熟，应用领域也不断扩大。可以设想，未来人工智能带来的科技产品，将会是人类智慧的"容器"。人工智能可以对人的意识、思维的信息过程的模拟。',
						weight: 0.95,
						score: 8.7,
						vote: 12,
						created_at: '2024-01-15T08:30:00Z',
						updated_at: '2024-01-15T10:45:00Z',
						metadata: {
							chunk_details: {
								depth: 1,
								index: 0,
								source_file: 'ai_introduction.pdf',
								source_page: 1,
								source_line_start: 1,
								source_line_end: 15
							},
							document_id: 'doc_ai_intro_001',
							section_title: '第一章 人工智能概述',
							hit_count: 156,
							last_accessed: '2024-01-20T14:22:00Z'
						}
					},
					{
						id: 'segment_parent_2',
						text: '机器学习是人工智能的一个重要分支，它让计算机能够通过数据自动学习和改进，而无需明确编程。机器学习算法通过构建数学模型来基于训练数据进行预测或决策。它广泛应用于计算机视觉、自然语言处理、语音识别等领域。根据学习方式的不同，机器学习可以分为监督学习、无监督学习和强化学习三大类。监督学习使用带标签的训练数据，无监督学习从无标签数据中发现模式，强化学习通过与环境交互来学习最优策略。',
						weight: 0.88,
						score: 8.2,
						vote: 8,
						created_at: '2024-01-15T09:15:00Z',
						updated_at: '2024-01-15T11:20:00Z',
						metadata: {
							chunk_details: {
								depth: 2,
								index: 1,
								source_file: 'ai_introduction.pdf',
								source_page: 2,
								source_line_start: 45,
								source_line_end: 68
							},
							document_id: 'doc_ai_intro_001',
							section_title: '第二章 机器学习基础',
							hit_count: 89,
							last_accessed: '2024-01-20T16:18:00Z'
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
							<ParentsViewer
								parentsData={parentsData.parents}
								currentSegment={segmentData}
							/>
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
