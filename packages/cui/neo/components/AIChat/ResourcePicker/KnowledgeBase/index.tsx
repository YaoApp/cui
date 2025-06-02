import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from './index.less'

const KnowledgeBase = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

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
			</div>
		</div>
	)
}

export default window.$app.memo(KnowledgeBase)
