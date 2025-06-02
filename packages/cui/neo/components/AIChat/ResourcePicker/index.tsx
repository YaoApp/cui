import { useMemoizedFn, useLocalStorageState } from 'ahooks'
import { Modal } from 'antd'
import { getLocale } from '@umijs/max'
import { Database } from 'phosphor-react'
import Icon from '@/widgets/Icon'
import DataModel from './DataModel'
import KnowledgeBase from './KnowledgeBase'
import styles from './index.less'

export interface ResourcePickerProps {
	visible: boolean
	onClose: () => void
	title?: string
	width?: number | string
}

type TabType = 'dataModel' | 'knowledgeBase'

const ResourcePicker = (props: ResourcePickerProps) => {
	const { visible, onClose, width = 800 } = props

	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const defaultTitle = is_cn ? '添加数据' : 'Add Data'
	const { title = defaultTitle } = props

	// 记住用户上次选择的tab
	const [activeTab, setActiveTab] = useLocalStorageState<TabType>('resource-picker-tab', {
		defaultValue: 'dataModel'
	})

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
		onClose()
	})

	const handleCancel = useMemoizedFn(() => {
		handleClose()
	})

	const handleTabChange = useMemoizedFn((tab: TabType) => {
		setActiveTab(tab)
	})

	const renderContent = () => {
		switch (activeTab) {
			case 'dataModel':
				return <DataModel />
			case 'knowledgeBase':
				return <KnowledgeBase />
			default:
				return <DataModel />
		}
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
			footer={null}
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
