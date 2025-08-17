import React, { useState, useEffect } from 'react'
import { Spin, Typography } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'

import { Segment } from '@/openapi/kb/types'
import styles from '../detail.less'
import localStyles from './index.less'

const { Text } = Typography

interface VoteData {
	positiveVotes: number
	negativeVotes: number
	totalVotes: number
}

interface VoteViewProps {
	segmentData: Segment
}

const VoteView: React.FC<VoteViewProps> = ({ segmentData }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [voteData, setVoteData] = useState<VoteData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		loadVoteData()
	}, [segmentData.id])

	const loadVoteData = async () => {
		try {
			setLoading(true)
			// 模拟API请求延时
			await new Promise((resolve) => setTimeout(resolve, 100))

			// 模拟投票数据
			const mockData: VoteData = {
				positiveVotes: 127,
				negativeVotes: 23,
				totalVotes: 150
			}

			setVoteData(mockData)
		} catch (error) {
			console.error('Failed to load vote data:', error)
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
						{is_cn ? '好评' : 'Positive'}{' '}
						<span className={localStyles.metaNumber} style={{ color: 'var(--color_success)' }}>
							{voteData?.positiveVotes || 0}
						</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '差评' : 'Negative'}{' '}
						<span className={localStyles.metaNumber} style={{ color: 'var(--color_error)' }}>
							{voteData?.negativeVotes || 0}
						</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '总计' : 'Total'}{' '}
						<span className={localStyles.metaNumber}>{voteData?.totalVotes || 0}</span>
					</span>
				</div>
			</div>

			{/* Body - 内容区域暂时留空 */}
			<div className={localStyles.voteBody}>
				<div className={localStyles.voteSection}>
					{loading ? (
						<div className={localStyles.loadingState}>
							<Icon name='material-hourglass_empty' size={32} />
							<Text>{is_cn ? '加载投票数据中...' : 'Loading vote data...'}</Text>
						</div>
					) : !voteData ? (
						<div className={localStyles.emptyState}>
							<Icon name='material-thumb_up' size={48} />
							<Text type='secondary'>
								{is_cn ? '暂无投票数据' : 'No vote data available'}
							</Text>
						</div>
					) : (
						<div className={localStyles.contentPlaceholder}>
							<Text type='secondary'>
								{is_cn
									? '投票详情内容待实现...'
									: 'Vote details content coming soon...'}
							</Text>
						</div>
					)}
				</div>
			</div>

			{/* Footer - 暂时留空 */}
			<div className={localStyles.voteFooter}>{/* 后续可添加操作按钮或其他信息 */}</div>
		</div>
	)
}

export default VoteView
