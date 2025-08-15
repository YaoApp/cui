import React, { useState } from 'react'
import { Modal, Button } from 'antd'
import { useLocalStorageState } from 'ahooks'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { Segment } from '@/openapi/kb/types'
import styles from './detail.less'

interface SegmentDetailProps {
	visible: boolean
	onClose: () => void
	segmentData: Segment | null
}

type TabType = 'editor' | 'graph' | 'parents' | 'recall' | 'vote' | 'score'

const SegmentDetail: React.FC<SegmentDetailProps> = ({ visible, onClose, segmentData }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 记住用户上次选择的tab
	const [activeTab, setActiveTab] = useLocalStorageState<TabType>('segment-detail-tab', {
		defaultValue: 'editor'
	})

	if (!segmentData) return null

	const tabs = [
		{
			key: 'editor' as TabType,
			label: is_cn ? '内容' : 'Content',
			icon: 'material-edit_note'
		},
		{
			key: 'graph' as TabType,
			label: is_cn ? '图谱' : 'Graph',
			icon: 'material-account_tree'
		},
		{
			key: 'parents' as TabType,
			label: is_cn ? '层级' : 'Hierarchy',
			icon: 'material-device_hub'
		},
		{
			key: 'recall' as TabType,
			label: is_cn ? '召回' : 'Recall',
			icon: 'material-history'
		},
		{
			key: 'vote' as TabType,
			label: is_cn ? '投票' : 'Votes',
			icon: 'material-thumb_up'
		},
		{
			key: 'score' as TabType,
			label: is_cn ? '得分' : 'Score',
			icon: 'material-calculate'
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
				return (
					<div style={{ padding: '20px' }}>
						<h3>Segment Content</h3>
						<div style={{ marginBottom: '16px' }}>
							<strong>ID:</strong> {segmentData.id}
						</div>
						<div style={{ marginBottom: '16px' }}>
							<strong>Text:</strong>
						</div>
						<div
							style={{
								padding: '12px',
								border: '1px solid #d9d9d9',
								borderRadius: '6px',
								whiteSpace: 'pre-wrap',
								backgroundColor: '#fafafa'
							}}
						>
							{segmentData.text}
						</div>
						{segmentData.metadata && (
							<>
								<div style={{ marginTop: '16px', marginBottom: '8px' }}>
									<strong>Metadata:</strong>
								</div>
								<pre
									style={{
										padding: '12px',
										border: '1px solid #d9d9d9',
										borderRadius: '6px',
										backgroundColor: '#fafafa',
										fontSize: '12px'
									}}
								>
									{JSON.stringify(segmentData.metadata, null, 2)}
								</pre>
							</>
						)}
					</div>
				)
			case 'graph':
				return (
					<div style={{ padding: '20px', textAlign: 'center' }}>
						<Icon name='material-account_tree' size={48} />
						<p>Knowledge Graph for segment: {segmentData.id}</p>
						<p style={{ color: '#999' }}>Coming soon...</p>
					</div>
				)
			case 'parents':
				return (
					<div style={{ padding: '20px', textAlign: 'center' }}>
						<Icon name='material-device_hub' size={48} />
						<p>Parent relationships for segment: {segmentData.id}</p>
						<p style={{ color: '#999' }}>Coming soon...</p>
					</div>
				)
			case 'recall':
				return (
					<div style={{ padding: '20px', textAlign: 'center' }}>
						<Icon name='material-history' size={48} />
						<p>Recall history for segment: {segmentData.id}</p>
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
						<Icon name='material-functions' size={48} />
						<p>Score formula for segment: {segmentData.id}</p>
						<p style={{ color: '#999' }}>Coming soon...</p>
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
						<span className={styles.modalTitle}>
							{is_cn ? 'Segment 详情' : 'Segment Details'}
						</span>
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
