import Icon from '@/widgets/Icon'
import styles from '../index.less'

interface PathCardProps {
	icon: string
	title: string
	description: string
	badge?: string
	extra?: React.ReactNode
	buttonText: string
	onClick: () => void
}

const PathCard = ({ icon, title, description, badge, extra, buttonText, onClick }: PathCardProps) => {
	return (
		<div className={styles.pathCard} onClick={onClick}>
			<div className={styles.pathCardHeader}>
				<div className={styles.pathCardIcon}>
					<Icon name={icon} size={20} />
				</div>
				<span className={styles.pathCardTitle}>
					{title}
					{badge && <span className={styles.pathCardBadge}>{badge}</span>}
				</span>
			</div>
			<div className={styles.pathCardDesc}>{description}</div>
			{extra && <div className={styles.pathCardExtra}>{extra}</div>}
			<div className={styles.pathCardAction}>
				<button className={styles.pathCardButton} type='button'>
					{buttonText}
				</button>
			</div>
		</div>
	)
}

export default PathCard
