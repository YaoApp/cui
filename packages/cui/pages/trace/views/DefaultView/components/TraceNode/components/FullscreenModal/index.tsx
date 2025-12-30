import { memo } from 'react'
import { Modal } from 'antd'
import Icon from '@/widgets/Icon'
import JsonViewer from '../JsonViewer'
import styles from './index.less'

interface FullscreenModalProps {
	open: boolean
	onClose: () => void
	title: string
	data: any
	type?: 'input' | 'output'
}

const FullscreenModal: React.FC<FullscreenModalProps> = ({ open, onClose, title, data, type = 'output' }) => {
	// 格式化内容
	const renderContent = () => {
		if (!data) {
			return <div className={styles.empty}>No data</div>
		}

		if (typeof data === 'string') {
			// 尝试解析为 JSON
			try {
				const parsed = JSON.parse(data)
				return <JsonViewer data={parsed} />
			} catch {
				return <div className={styles.textContent}>{data}</div>
			}
		}

		return <JsonViewer data={data} />
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.modalTitle}>
						<Icon name={type === 'input' ? 'material-login' : 'material-logout'} size={16} />
						<span>{title}</span>
					</div>
					<div className={styles.closeButton} onClick={onClose}>
						<Icon name='material-close' size={16} />
					</div>
				</div>
			}
			open={open}
			onCancel={onClose}
			footer={null}
			width="80%"
			style={{ maxWidth: 1200 }}
			className={styles.fullscreenModal}
			closable={false}
		>
			<div className={styles.contentContainer}>
				{renderContent()}
			</div>
		</Modal>
	)
}

export default memo(FullscreenModal)
