import React, { useState } from 'react'
import { Modal, Button } from 'antd'
import { useLocalStorageState } from 'ahooks'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import ChunkEditor from './Editor'
import KnowledgeGraph from './Graph'
import ParentsView from './Parents'
import styles from './detail.less'

interface ChunkData {
	id: string
	text: string
	weight: number
	recall_count: number
	upvotes: number
	downvotes: number
	text_length: number
	max_length: number
}

interface ChunkDetailProps {
	visible: boolean
	onClose: () => void
	chunkData: ChunkData | null
}

type TabType = 'editor' | 'graph' | 'parents'

const ChunkDetail: React.FC<ChunkDetailProps> = ({ visible, onClose, chunkData }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 记住用户上次选择的tab
	const [activeTab, setActiveTab] = useLocalStorageState<TabType>('chunk-detail-tab', {
		defaultValue: 'editor'
	})

	if (!chunkData) return null

	const tabs = [
		{
			key: 'editor' as TabType,
			label: is_cn ? '内容编辑' : 'Content Editor',
			icon: 'material-edit_note'
		},
		{
			key: 'graph' as TabType,
			label: is_cn ? '知识图谱' : 'Knowledge Graph',
			icon: 'material-account_tree'
		},
		{
			key: 'parents' as TabType,
			label: is_cn ? '上级分段' : 'Parent Chunks',
			icon: 'material-device_hub'
		}
	]

	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab)
	}

	const handleSave = (updatedData: Partial<ChunkData>) => {
		// TODO: 实现保存功能
		console.log('Save chunk data:', updatedData)
	}

	const renderContent = () => {
		switch (activeTab) {
			case 'editor':
				return <ChunkEditor chunkData={chunkData} onSave={handleSave} />
			case 'graph':
				return <KnowledgeGraph chunkId={chunkData.id} />
			case 'parents':
				return <ParentsView chunkId={chunkData.id} />
			default:
				return <ChunkEditor chunkData={chunkData} onSave={handleSave} />
		}
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.titleSection}>
						<Icon name='material-description' size={16} />
						<span className={styles.modalTitle}>{is_cn ? 'Chunk 详情' : 'Chunk Details'}</span>
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

export default ChunkDetail
