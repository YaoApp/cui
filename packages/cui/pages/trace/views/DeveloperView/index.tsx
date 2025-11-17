import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface DeveloperViewProps {
	traceId: string
	onSwitchMode: () => void
}

const DeveloperView: React.FC<DeveloperViewProps> = ({ traceId, onSwitchMode }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<div className={styles.titleSection}>
					<Icon name="material-code" size={20} />
					<h1 className={styles.title}>{is_cn ? '开发者模式' : 'Developer Mode'}</h1>
					<span className={styles.traceId}>ID: {traceId}</span>
				</div>
				<div className={styles.actions}>
					<div className={styles.modeToggle} onClick={onSwitchMode}>
						<Icon name="material-visibility" size={16} />
						<span>{is_cn ? '默认模式' : 'Default Mode'}</span>
						<Icon name="material-arrow_forward" size={16} />
					</div>
				</div>
			</div>
			<div className={styles.content}>
				<div className={styles.placeholder}>
					<Icon name="material-construction" size={64} />
					<p>{is_cn ? '开发者模式开发中...' : 'Developer mode under construction...'}</p>
				</div>
			</div>
		</div>
	)
}

export default DeveloperView

