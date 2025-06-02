import { getLocale } from '@umijs/max'
import { Button } from 'antd'
import Icon from '@/widgets/Icon'
import { ResourceChildProps } from '../index'
import styles from './index.less'

const DataModel = (props: ResourceChildProps) => {
	const { onItemSelect, selectedItems } = props
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 测试数据
	const handleAddTestItem = () => {
		onItemSelect({
			value: `data_model_${Date.now()}`,
			label: is_cn ? `数据模型 ${selectedItems.length + 1}` : `Data Model ${selectedItems.length + 1}`
		})
	}

	return (
		<div className={styles.dataModelContent}>
			<div className={styles.placeholder}>
				<Icon name='material-database' size={48} />
				<h3>{is_cn ? '数据模型' : 'Data Model'}</h3>
				<p>
					{is_cn
						? '数据模型功能开发中，敬请期待...'
						: 'Data model features in development, coming soon...'}
				</p>
				<Button type='primary' onClick={handleAddTestItem} style={{ marginTop: 16 }}>
					{is_cn ? '添加测试项' : 'Add Test Item'}
				</Button>
			</div>
		</div>
	)
}

export default window.$app.memo(DataModel)
