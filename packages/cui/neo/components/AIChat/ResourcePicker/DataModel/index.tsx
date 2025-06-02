import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from './index.less'

const DataModel = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

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
			</div>
		</div>
	)
}

export default window.$app.memo(DataModel)
