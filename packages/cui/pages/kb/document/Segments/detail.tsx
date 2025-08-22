import React, { useState, useEffect } from 'react'
import { Modal, Button, Spin, message } from 'antd'
import { getLocale } from '@umijs/max'
import { useGlobal } from '@/context/app'
import Icon from '@/widgets/Icon'
import { Segment, CollectionInfo } from '@/openapi/kb/types'
import { KB } from '@/openapi'
import Editor from './Editor'
import GraphView from './Graph'
import ParentsView from './Parents'
import HitsView from './Hits'
import ScoreView from './Score'
import VoteView from './Vote'
import styles from './detail.less'

interface SegmentDetailProps {
	visible: boolean
	onClose: () => void
	segmentId: string | null
	collectionInfo: CollectionInfo
	docID: string
	onDataUpdated?: () => void // 数据更新回调，用于刷新列表
}

type TabType = 'editor' | 'graph' | 'parents' | 'hits' | 'vote' | 'score'

const SegmentDetail: React.FC<SegmentDetailProps> = ({
	visible,
	onClose,
	segmentId,
	collectionInfo,
	docID,
	onDataUpdated
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()
	const { kb: kbConfig } = global.app_info || {}

	// 状态管理
	const [loading, setLoading] = useState(false)
	const [segmentData, setSegmentData] = useState<Segment | null>(null)
	const [activeTab, setActiveTab] = useState<TabType>('editor')
	const [isSaving, setIsSaving] = useState(false)

	// 加载segment数据
	const loadSegmentData = async () => {
		if (!segmentId || !docID) return

		setLoading(true)
		try {
			if (window.$app?.openapi) {
				const kb = new KB(window.$app.openapi)
				const response = await kb.GetSegment(docID, segmentId)

				if (!window.$app.openapi.IsError(response) && response.data) {
					setSegmentData(response.data.segment)
				} else {
					message.error(is_cn ? '获取分段详情失败' : 'Failed to load segment details')
				}
			}
		} catch (error) {
			console.error('Error loading segment data:', error)
			message.error(is_cn ? '获取分段详情失败' : 'Failed to load segment details')
		} finally {
			setLoading(false)
		}
	}

	// 弹窗打开时加载数据并重置tab
	useEffect(() => {
		if (visible && segmentId) {
			setActiveTab('editor')
			loadSegmentData()
		}
	}, [visible, segmentId, docID])

	// 弹窗关闭时清理数据
	useEffect(() => {
		if (!visible) {
			setSegmentData(null)
		}
	}, [visible])

	if (!segmentId) return null

	// 判断是否显示图谱卡片：L1级别的切片 且 知识库配置支持图谱
	const shouldShowGraph = () => {
		if (!segmentData) return false
		const isL1Segment = segmentData.metadata?.chunk_details?.depth === 1
		const hasGraphFeature = kbConfig?.features?.GraphDatabase === true
		return isL1Segment && hasGraphFeature
	}

	// 判断是否显示层级卡片：Level > 1 的分段
	const shouldShowParents = () => {
		if (!segmentData) return false
		const depth = segmentData.metadata?.chunk_details?.depth
		return depth !== undefined && depth > 1
	}

	const tabs = [
		{
			key: 'editor' as TabType,
			label: is_cn ? '内容' : 'Content',
			icon: 'material-edit_note'
		},
		// 只有满足条件时才显示图谱卡片
		...(shouldShowGraph()
			? [
					{
						key: 'graph' as TabType,
						label: is_cn ? '图谱' : 'Graph',
						icon: 'material-hub' // 网络中心节点，更好地表达图谱概念
					}
			  ]
			: []),
		// 只有 Level > 1 时才显示层级卡片
		...(shouldShowParents()
			? [
					{
						key: 'parents' as TabType,
						label: is_cn ? '层级' : 'Hierarchy',
						icon: 'material-account_tree' // 树形结构，表示层级关系
					}
			  ]
			: []),
		{
			key: 'hits' as TabType,
			label: is_cn ? '命中' : 'Hits',
			icon: 'material-target' // 目标/靶心，更好地表达"命中"概念
		},
		{
			key: 'vote' as TabType,
			label: is_cn ? '投票' : 'Votes',
			icon: 'material-thumb_up'
		},
		{
			key: 'score' as TabType,
			label: is_cn ? '评分' : 'Score',
			icon: 'material-star' // 星级评分，更好地表达"评分"概念
		}
	]

	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab)
	}

	const handleSave = (updatedData: Partial<Segment>) => {
		// 更新本地 segment 数据
		if (segmentData) {
			setSegmentData({
				...segmentData,
				...updatedData
			})
		}
		// 触发列表数据刷新
		if (onDataUpdated) {
			onDataUpdated()
		}
		console.log('Segment data updated:', updatedData)
	}

	const renderContent = () => {
		// 加载状态
		if (loading) {
			return (
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						height: '400px'
					}}
				>
					<Spin size='large' tip={is_cn ? '加载中...' : 'Loading...'} />
				</div>
			)
		}

		// 数据未加载或加载失败
		if (!segmentData) {
			return (
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						height: '400px'
					}}
				>
					<div style={{ textAlign: 'center' }}>
						<Icon
							name='material-error_outline'
							size={48}
							style={{ color: '#ccc', marginBottom: '16px' }}
						/>
						<div style={{ color: '#999' }}>
							{is_cn ? '分段数据加载失败' : 'Failed to load segment data'}
						</div>
					</div>
				</div>
			)
		}

		switch (activeTab) {
			case 'editor':
				// 适配 Segment 数据到 Editor 组件需要的 ChunkData 格式
				const chunkData = {
					id: segmentData.id,
					text: segmentData.text || '',
					weight: segmentData.weight || 0,
					hit_count: segmentData.metadata?.hit_count || 0,
					upvotes: segmentData.vote && segmentData.vote > 0 ? segmentData.vote : 0,
					downvotes: segmentData.vote && segmentData.vote < 0 ? Math.abs(segmentData.vote) : 0,
					text_length: segmentData.text?.length || 0,
					max_length: 2000, // 默认最大长度
					score: segmentData.score || 0, // 添加评分
					metadata: segmentData.metadata // 传递完整的 metadata
				}

				return (
					<Editor
						chunkData={chunkData}
						collectionInfo={collectionInfo}
						docID={docID}
						onSave={handleSave}
						onSavingStateChange={setIsSaving}
						onDelete={() => {
							// 删除成功后关闭弹窗并刷新列表
							onClose()
							if (onDataUpdated) {
								onDataUpdated()
							}
						}}
					/>
				)
			case 'graph':
				return <GraphView segmentData={segmentData} />
			case 'parents':
				return <ParentsView segmentData={segmentData} />
			case 'hits':
				return <HitsView segmentData={segmentData} />
			case 'vote':
				return <VoteView segmentData={segmentData} />
			case 'score':
				return <ScoreView segmentData={segmentData} />
			default:
				return (
					<div style={{ padding: '20px' }}>
						<h3>Segment Content</h3>
						<p>{segmentData.text}</p>
					</div>
				)
		}
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.titleSection}>
						<Icon name='material-description' size={16} />
						<span className={styles.modalTitle}>{is_cn ? '分段详情' : 'Segment Details'}</span>
					</div>
					<div className={styles.tabs}>
						{tabs.map((tab) => (
							<div
								key={tab.key}
								className={`${styles.tabItem} ${
									activeTab === tab.key ? styles.tabItemActive : ''
								}`}
								onClick={() => handleTabChange(tab.key)}
							>
								<Icon name={tab.icon} size={12} />
								<span>{tab.label}</span>
							</div>
						))}
					</div>
					<div
						className={styles.closeButton}
						onClick={isSaving ? undefined : onClose}
						style={{
							cursor: isSaving ? 'not-allowed' : 'pointer',
							opacity: isSaving ? 0.5 : 1
						}}
					>
						<Icon name='material-close' size={16} />
					</div>
				</div>
			}
			open={visible}
			onCancel={isSaving ? undefined : onClose}
			footer={null}
			width={1200}
			destroyOnClose
			closable={false}
			maskClosable={!isSaving}
			className={styles.chunkDetailModal}
		>
			<div className={styles.modalContent}>{renderContent()}</div>
		</Modal>
	)
}

export default SegmentDetail
