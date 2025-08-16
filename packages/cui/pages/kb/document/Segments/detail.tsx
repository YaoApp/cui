import React, { useState } from 'react'
import { Modal, Button } from 'antd'
import { useLocalStorageState } from 'ahooks'
import { getLocale } from '@umijs/max'
import { useGlobal } from '@/context/app'
import Icon from '@/widgets/Icon'
import { Segment } from '@/openapi/kb/types'
import Editor from './Editor'
import GraphView from './Graph'
import styles from './detail.less'

interface SegmentDetailProps {
	visible: boolean
	onClose: () => void
	segmentData: Segment | null
}

type TabType = 'editor' | 'graph' | 'parents' | 'hits' | 'vote' | 'score'

const SegmentDetail: React.FC<SegmentDetailProps> = ({ visible, onClose, segmentData }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()
	const { kb: kbConfig } = global.app_info || {}

	// 记住用户上次选择的tab
	const [activeTab, setActiveTab] = useLocalStorageState<TabType>('segment-detail-tab', {
		defaultValue: 'editor'
	})

	if (!segmentData) return null

	// 判断是否显示图谱卡片：L1级别的切片 且 知识库配置支持图谱
	const shouldShowGraph = () => {
		const isL1Segment = segmentData.metadata?.chunk_details?.depth === 1
		const hasGraphFeature = kbConfig?.features?.GraphDatabase === true
		return isL1Segment && hasGraphFeature
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
		{
			key: 'parents' as TabType,
			label: is_cn ? '层级' : 'Hierarchy',
			icon: 'material-account_tree' // 树形结构，表示层级关系
		},
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
		// TODO: 实现保存功能
		console.log('Save segment data:', updatedData)
	}

	const renderContent = () => {
		switch (activeTab) {
			case 'editor':
				// 适配 Segment 数据到 Editor 组件需要的 ChunkData 格式
				const chunkData = {
					id: segmentData.id,
					text: segmentData.text || '',
					weight: segmentData.weight || 1.0,
					hit_count: segmentData.metadata?.hit_count || 0,
					upvotes: segmentData.vote && segmentData.vote > 0 ? segmentData.vote : 0,
					downvotes: segmentData.vote && segmentData.vote < 0 ? Math.abs(segmentData.vote) : 0,
					text_length: segmentData.text?.length || 0,
					max_length: 8000, // 默认最大长度
					score: segmentData.score || 0, // 添加评分
					metadata: segmentData.metadata // 传递完整的 metadata
				}

				return <Editor chunkData={chunkData} onSave={handleSave} />
			case 'graph':
				return <GraphView segmentData={segmentData} />
			case 'parents':
				return (
					<div style={{ padding: '20px', textAlign: 'center' }}>
						<Icon name='material-device_hub' size={48} />
						<p>Parent relationships for segment: {segmentData.id}</p>
						<p style={{ color: '#999' }}>Coming soon...</p>
					</div>
				)
			case 'hits':
				return (
					<div style={{ padding: '20px', textAlign: 'center' }}>
						<Icon name='material-history' size={48} />
						<p>Hit history for segment: {segmentData.id}</p>
						<p style={{ color: '#999' }}>Coming soon...</p>
					</div>
				)
			case 'vote':
				return (
					<div style={{ padding: '20px', textAlign: 'center' }}>
						<Icon name='material-thumb_up' size={48} />
						<p>Vote details for segment: {segmentData.id}</p>
						<p style={{ color: '#999' }}>Coming soon...</p>
					</div>
				)
			case 'score':
				return (
					<div style={{ padding: '20px', textAlign: 'center' }}>
						<Icon name='material-star' size={48} />
						<p>
							{is_cn
								? `分段评分详情: ${segmentData.id}`
								: `Score details for segment: ${segmentData.id}`}
						</p>
						<p style={{ color: '#999' }}>{is_cn ? '即将推出...' : 'Coming soon...'}</p>
					</div>
				)
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
					<div className={styles.closeButton} onClick={onClose}>
						<Icon name='material-close' size={16} />
					</div>
				</div>
			}
			open={visible}
			onCancel={onClose}
			footer={null}
			width={1200}
			destroyOnClose
			closable={false}
			maskClosable={true}
			className={styles.chunkDetailModal}
		>
			<div className={styles.modalContent}>{renderContent()}</div>
		</Modal>
	)
}

export default SegmentDetail
