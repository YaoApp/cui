import { useEffect, useCallback } from 'react'
import Icon from '@/widgets/Icon'
import { DashboardPageRenderer } from '@/components/PageRenderer'
import styles from './index.less'

interface PageModalProps {
	open: boolean
	onClose: () => void
	url: string
	title: string
	icon?: string
}

const PageModal = ({ open, onClose, url, title, icon }: PageModalProps) => {
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		},
		[onClose]
	)

	useEffect(() => {
		if (open) {
			document.addEventListener('keydown', handleKeyDown)
			document.body.style.overflow = 'hidden'
		}
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.body.style.overflow = ''
		}
	}, [open, handleKeyDown])

	if (!open || !url) return null

	return (
		<div className={styles.overlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.header}>
					<div className={styles.headerLeft}>
						{icon && <Icon name={icon} size={16} className={styles.headerIcon} />}
						<span className={styles.headerTitle}>{title}</span>
					</div>
					<button className={styles.closeBtn} onClick={onClose}>
						<Icon name='material-close' size={18} />
					</button>
				</div>
				<div className={styles.body}>
					<DashboardPageRenderer key={url} url={url} />
				</div>
			</div>
		</div>
	)
}

export default PageModal
