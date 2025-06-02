import { getLocale } from '@umijs/max'
import { Button } from 'antd'
import Icon from '@/widgets/Icon'
import { ResourceChildProps } from '../index'
import styles from './index.less'

const KnowledgeBase = (props: ResourceChildProps) => {
	const { onItemSelect, selectedItems } = props
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 测试数据
	const handleAddTestItem = () => {
		onItemSelect({
			value: `knowledge_base_${Date.now()}`,
			label: is_cn ? `知识库 ${selectedItems.length + 1}` : `Knowledge Base ${selectedItems.length + 1}`
		})
	}

	return (
		<div className={styles.knowledgeBaseContent}>
			<div className={styles.placeholder}>
				<Icon name='material-library_books' size={48} />
				<h3>{is_cn ? '知识库' : 'Knowledge Base'}</h3>
				<p>
					{is_cn
						? '知识库功能开发中，敬请期待...'
						: 'Knowledge base features in development, coming soon...'}
				</p>
				<Button type='primary' onClick={handleAddTestItem} style={{ marginTop: 16 }}>
					{is_cn ? '添加测试项' : 'Add Test Item'}
				</Button>
			</div>
		</div>
	)
}

export default window.$app.memo(KnowledgeBase)
