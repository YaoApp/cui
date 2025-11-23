import { Modal } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { Item } from './types'

interface DataModelDetailModalProps {
	visible: boolean
	onClose: () => void
	model?: Item | null
}

const DataModelDetailModal = (props: DataModelDetailModalProps) => {
	const { visible, onClose, model } = props
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	if (!model) return null

	return (
		<Modal
			title={
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<Icon name={model.icon || 'material-table_chart'} size={16} />
					<span>{model.name}</span>
					<span style={{ color: 'var(--color_text_grey)', fontSize: '12px' }}>
						{is_cn ? '数据模型详情' : 'Data Model Details'}
					</span>
				</div>
			}
			open={visible}
			onCancel={onClose}
			footer={null}
			width={800}
			destroyOnClose
		>
			<div style={{ textAlign: 'center', padding: '40px', color: 'var(--color_text_grey)' }}>
				<Icon name='material-construction' size={48} />
				<h3 style={{ margin: '16px 0 8px 0', color: 'var(--color_text)' }}>
					{is_cn ? '功能开发中' : 'Feature in Development'}
				</h3>
				<p style={{ margin: 0 }}>
					{is_cn
						? '数据模型详情页面正在开发中，敬请期待...'
						: 'Data model detail view is under development, coming soon...'}
				</p>
			</div>
		</Modal>
	)
}

export default DataModelDetailModal
