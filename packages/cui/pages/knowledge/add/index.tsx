import React, { useState } from 'react'
import { Modal, Button } from 'antd'
import { useLocalStorageState } from 'ahooks'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import BasicTab from './components/Basic'
import AdvancedTab from './components/Advanced'
import styles from './index.less'

export interface AddDocumentData {
	type: 'file' | 'text' | 'url'
	content: any // 根据type不同，content的结构不同
	// file: { file: File, name: string, size: number }
	// text: { content: string }
	// url: { url: string, title?: string }
}

interface AddDocumentModalProps {
	visible: boolean
	onClose: () => void
	onConfirm: (data: AddDocumentData, options: any) => void
	data: AddDocumentData | null
}

type TabType = 'basic' | 'advanced'

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({ visible, onClose, onConfirm, data }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 记住用户上次选择的tab
	const [activeTab, setActiveTab] = useLocalStorageState<TabType>('add-document-tab', {
		defaultValue: 'basic'
	})

	// 存储配置选项
	const [options, setOptions] = useState<any>({
		splitMode: 'auto',
		chunkSize: 1000,
		overlap: 200
		// 更多配置项...
	})

	if (!data) return null

	const tabs = [
		{
			key: 'basic' as TabType,
			label: is_cn ? '快速添加' : 'Quick Add',
			icon: 'material-flash_on'
		},
		{
			key: 'advanced' as TabType,
			label: is_cn ? '详细配置' : 'Detailed Setup',
			icon: 'material-tune'
		}
	]

	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab)
	}

	const handleOptionsChange = (newOptions: any) => {
		setOptions({ ...options, ...newOptions })
	}

	const handleConfirm = () => {
		onConfirm(data, options)
	}

	const renderContent = () => {
		switch (activeTab) {
			case 'basic':
				return <BasicTab data={data} options={options} onOptionsChange={handleOptionsChange} />
			case 'advanced':
				return <AdvancedTab data={data} options={options} onOptionsChange={handleOptionsChange} />
			default:
				return <BasicTab data={data} options={options} onOptionsChange={handleOptionsChange} />
		}
	}

	const getModalTitle = () => {
		const typeLabels = {
			file: is_cn ? '文件' : 'File',
			text: is_cn ? '文本' : 'Text',
			url: is_cn ? 'URL' : 'URL'
		}
		const typeLabel = typeLabels[data.type] || ''
		return is_cn ? `添加${typeLabel}到知识库` : `Add ${typeLabel} to Knowledge Base`
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.titleSection}>
						<Icon name='material-add_circle_outline' size={16} />
						<span className={styles.modalTitle}>{getModalTitle()}</span>
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
			footer={
				<div className={styles.modalFooter}>
					<Button onClick={onClose}>{is_cn ? '取消' : 'Cancel'}</Button>
					<Button type='primary' onClick={handleConfirm}>
						{is_cn ? '确认添加' : 'Add to Collection'}
					</Button>
				</div>
			}
			width='90%'
			style={{
				top: '5vh',
				paddingBottom: 0,
				maxWidth: '1200px'
			}}
			bodyStyle={{
				padding: 0,
				maxHeight: 'calc(100vh - 10vh - 120px)',
				overflow: 'auto'
			}}
			destroyOnClose
			closable={false}
			maskClosable={true}
			className={styles.addDocumentModal}
		>
			<div className={styles.modalContent}>{renderContent()}</div>
		</Modal>
	)
}

export default AddDocumentModal
