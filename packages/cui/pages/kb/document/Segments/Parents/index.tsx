import React, { useState, useEffect } from 'react'
import { Typography, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { Segment, SegmentTree } from '@/openapi/kb/types'
import { KB } from '@/openapi/kb/api'
import ParentsViewer from './ParentsViewer'
import styles from '../detail.less'
import localStyles from './index.less'

const { Text } = Typography

interface ParentsViewProps {
	segmentData: Segment
}

const ParentsView: React.FC<ParentsViewProps> = ({ segmentData }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [segmentTree, setSegmentTree] = useState<SegmentTree | null>(null)
	const [selectedSegment, setSelectedSegment] = useState<Segment>(segmentData)
	const [parentsArray, setParentsArray] = useState<Segment[]>([]) // 用于向后兼容现有的 ParentsViewer

	// 将树结构转换为数组（从根到当前段的路径）
	const convertTreeToArray = (tree: SegmentTree): Segment[] => {
		const parents: Segment[] = []
		let current = tree.parent

		while (current) {
			parents.unshift(current.segment) // 添加到数组开头，保持从根到叶的顺序
			current = current.parent
		}

		return parents
	}

	// 加载父级分段数据
	const loadParentsData = async () => {
		setLoading(true)
		try {
			if (window.$app?.openapi) {
				const kb = new KB(window.$app.openapi)
				const response = await kb.GetSegmentParents(segmentData.document_id, segmentData.id, {
					include_metadata: true
				})

				if (!window.$app.openapi.IsError(response) && response.data) {
					const tree = response.data.tree
					setSegmentTree(tree)

					// 转换为数组格式以兼容现有的 ParentsViewer
					const parents = convertTreeToArray(tree)
					setParentsArray(parents)
					return
				} else {
					console.error('API Error:', response)
					message.error(is_cn ? '加载父级分段失败' : 'Failed to load parent segments')
				}
			} else {
				message.error(is_cn ? 'API 未初始化' : 'API not initialized')
			}
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

				{/* 面包屑导航 - 显示所有层级（父级+当前） */}
				{parentsArray.length > 0 && (
					<div className={localStyles.breadcrumbPath}>
						{[...parentsArray, segmentData].map((segment, index) => {
							const depth = segment.metadata?.chunk_details?.depth || 0
							const segmentIndex = segment.metadata?.chunk_details?.index || 0
							const isSelected = segment.id === selectedSegment.id
							const isLast = index === parentsArray.length

							return (
								<div key={segment.id} className={localStyles.breadcrumbItem}>
									<span
										className={`${localStyles.levelIndexInfo} ${
											isSelected ? localStyles.current : ''
										}`}
										onClick={() => setSelectedSegment(segment)}
									>
										<Icon name='material-account_tree' size={10} />L{depth}.
										{segmentIndex + 1}
									</span>
									{!isLast && (
										<Icon
											name='material-chevron_right'
											size={12}
											className={localStyles.breadcrumbSeparator}
										/>
									)}
								</div>
							)
						})}
					</div>
				)}

				{/* 统计信息 */}
				<div className={localStyles.metaInfo}>
					<span className={localStyles.metaItem}>
						{is_cn ? '权重' : 'Weight'}{' '}
						<span className={localStyles.metaNumber}>
							{selectedSegment.weight?.toFixed(2) || '0.00'}
						</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '评分' : 'Score'}{' '}
						<span className={localStyles.metaNumber}>
							{selectedSegment.score?.toFixed(2) || '0.00'}
						</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '命中' : 'Hits'}{' '}
						<span className={localStyles.metaNumber}>{selectedSegment.hit || 0}</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '投票' : 'Votes'}{' '}
						<span className={localStyles.metaNumber}>
							+{selectedSegment.positive || 0}/-{selectedSegment.negative || 0}
						</span>
					</span>
				</div>
			</div>

			{/* Body - 内容区域暂时留空，背景色与 Graph 一致 */}
			<div className={localStyles.parentsBody}>
				<div className={localStyles.parentsSection}>
					{loading ? (
						<div className={localStyles.loadingState}>
							<Icon name='material-hourglass_empty' size={32} />
							<Text>{is_cn ? '加载父级分段中...' : 'Loading parent segments...'}</Text>
						</div>
					) : parentsArray.length > 0 ? (
						<div className={localStyles.parentsContent}>
							<ParentsViewer
								parentsData={parentsArray}
								currentSegment={segmentData}
								selectedSegment={selectedSegment}
								onSegmentSelect={setSelectedSegment}
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
