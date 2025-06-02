import { useMemoizedFn, useLocalStorageState } from 'ahooks'
import { Modal, Button } from 'antd'
import { useState } from 'react'
import { getLocale } from '@umijs/max'
import { Database } from 'phosphor-react'
import Icon from '@/widgets/Icon'
import DataModel from './DataModel'
import KnowledgeBase from './KnowledgeBase'
import styles from './index.less'

export interface SelectedItem {
	value: string
	label: string
	type: 'dataModel' | 'knowledgeBase'
}

export interface ResourcePickerProps {
	visible: boolean
	onClose: () => void
	onConfirm?: (selectedItems: SelectedItem[]) => void
	title?: string
	width?: number | string
}

export interface ResourceChildProps {
	onItemSelect: (item: Omit<SelectedItem, 'type'>) => void
	onItemRemove: (value: string) => void
	selectedItems: SelectedItem[]
}

type TabType = 'dataModel' | 'knowledgeBase'

const ResourcePicker = (props: ResourcePickerProps) => {
	const { visible, onClose, onConfirm, width = 800 } = props

	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const defaultTitle = is_cn ? '添加数据' : 'Add Data'
	const { title = defaultTitle } = props

	// 记住用户上次选择的tab
	const [activeTab, setActiveTab] = useLocalStorageState<TabType>('resource-picker-tab', {
		defaultValue: 'dataModel'
	})

	// 选中项状态管理
	const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])

	const tabs = [
		{
			key: 'dataModel' as TabType,
			label: is_cn ? '数据模型' : 'Data Model',
			icon: 'material-storage'
		},
		{
			key: 'knowledgeBase' as TabType,
			label: is_cn ? '知识库' : 'Knowledge Base',
			icon: 'material-library_books'
		}
	]

	const handleClose = useMemoizedFn(() => {
		setSelectedItems([]) // 清空选中项
		onClose()
	})

	const handleCancel = useMemoizedFn(() => {
		handleClose()
	})

	const handleConfirm = useMemoizedFn(() => {
		onConfirm?.(selectedItems)
		handleClose()
	})

	const handleTabChange = useMemoizedFn((tab: TabType) => {
		setActiveTab(tab)
	})

	// 添加选中项
	const handleItemSelect = useMemoizedFn((item: Omit<SelectedItem, 'type'>) => {
		setSelectedItems((prev) => {
			const exists = prev.find((i) => i.value === item.value)
			if (exists) return prev
			return [...prev, { ...item, type: activeTab }]
		})
	})

	// 移除选中项
	const handleItemRemove = useMemoizedFn((value: string) => {
		setSelectedItems((prev) => prev.filter((item) => item.value !== value))
	})

	const childProps: ResourceChildProps = {
		onItemSelect: handleItemSelect,
		onItemRemove: handleItemRemove,
		selectedItems
	}

	const renderContent = () => {
		switch (activeTab) {
			case 'dataModel':
				return <DataModel {...childProps} />
			case 'knowledgeBase':
				return <KnowledgeBase {...childProps} />
			default:
				return <DataModel {...childProps} />
		}
	}

	const renderSelectedItems = () => {
		if (selectedItems.length === 0) {
			return <span className={styles.emptyText}>{is_cn ? '未选择任何项目' : 'No items selected'}</span>
		}

		const getIconByType = (type: TabType) => {
			return type === 'dataModel' ? 'material-storage' : 'material-library_books'
		}

		return (
			<div className={styles.selectedItems}>
				{selectedItems.map((item, index) => (
					<div key={item.value} className={styles.selectedItem}>
						<Icon name={getIconByType(item.type)} size={12} className={styles.itemIcon} />
						<span className={styles.itemLabel} title={item.label}>
							{item.label}
						</span>
						<Icon
							name='material-close'
							size={12}
							className={styles.removeIcon}
							onClick={() => handleItemRemove(item.value)}
						/>
					</div>
				))}
			</div>
		)
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.titleSection}>
						<Database size={16} weight='bold' />
						<span className={styles.modalTitle}>{title}</span>
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
					<div className={styles.closeButton} onClick={handleClose}>
						<Icon name='material-close' size={16} />
					</div>
				</div>
			}
			open={visible}
			onCancel={handleCancel}
			footer={
				<div className={styles.modalFooter}>
					<div className={styles.footerLeft}>{renderSelectedItems()}</div>
					<div className={styles.footerRight}>
						<Button
							type='primary'
							onClick={handleConfirm}
							disabled={selectedItems.length === 0}
						>
							<span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
								<Icon name='material-check' size={16} />
								{is_cn ? '确定' : 'Confirm'}
							</span>
						</Button>
					</div>
				</div>
			}
			width={width}
			destroyOnClose
			closable={false}
			maskClosable={true}
			className={styles.resourcePickerModal}
		>
			<div className={styles.modalContent}>{renderContent()}</div>
		</Modal>
	)
}

export default window.$app.memo(ResourcePicker)
