import { useMemoizedFn } from 'ahooks'
import { Modal } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from './index.less'

export interface ResourcePickerProps {
	visible: boolean
	onClose: () => void
	title?: string
	width?: number | string
}

const ResourcePicker = (props: ResourcePickerProps) => {
	const { visible, onClose, width = 800 } = props

	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const defaultTitle = is_cn ? '添加数据' : 'Add Data'
	const { title = defaultTitle } = props

	const handleClose = useMemoizedFn(() => {
		onClose()
	})

	const handleCancel = useMemoizedFn(() => {
		handleClose()
	})

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<span className={styles.modalTitle}>{title}</span>
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
			<div className={styles.modalContent}>
				{/* 内容区域先留空，后续可以添加资源选择的具体实现 */}
				<div className={styles.emptyContent}>
					<Icon name='material-database' size={48} />
					<p>
						{is_cn
							? '数据模型、知识库、附件等功能开发中...'
							: 'Data models, knowledge base, attachments features in development...'}
					</p>
				</div>
			</div>
		</Modal>
	)
}

export default window.$app.memo(ResourcePicker)
