import { useParams } from '@umijs/max'
import { getLocale } from '@umijs/max'
import { Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { history } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from './index.less'

const KnowledgeDetail = () => {
	const params = useParams<{ id: string }>()
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const handleBack = () => {
		history.push('/knowledge')
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<Button
					type='text'
					icon={<ArrowLeftOutlined />}
					onClick={handleBack}
					className={styles.backBtn}
				>
					{is_cn ? '返回' : 'Back'}
				</Button>
				<h1 className={styles.title}>{is_cn ? '知识库详情' : 'Knowledge Base Detail'}</h1>
			</div>

			<div className={styles.content}>
				<div className={styles.placeholder}>
					<Icon name='material-construction' size={64} />
					<div className={styles.placeholderTitle}>
						{is_cn ? '功能开发中' : 'Under Development'}
					</div>
					<div className={styles.placeholderDescription}>
						{is_cn
							? `知识库 ${params.id} 的详情页面正在开发中，敬请期待...`
							: `Knowledge base ${params.id} detail page is under development...`}
					</div>
					<Button type='primary' onClick={handleBack}>
						{is_cn ? '返回知识库列表' : 'Back to Knowledge Base List'}
					</Button>
				</div>
			</div>
		</div>
	)
}

export default KnowledgeDetail
