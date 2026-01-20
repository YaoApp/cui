import { useEffect, useCallback } from 'react'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface ModalProps {
	open: boolean
	onClose: () => void
	title?: React.ReactNode
	children: React.ReactNode
	width?: string // CSS width value, e.g. '50vw', '600px'
	maxWidth?: string
	minWidth?: string
}

const Modal: React.FC<ModalProps> = ({
	open,
	onClose,
	title,
	children,
	width = '65vw',
	maxWidth = '720px',
	minWidth = '400px'
}) => {
	// Handle ESC key
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
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

	if (!open) return null

	return (
		<div className={styles.overlay} onClick={onClose}>
			<div
				className={styles.modal}
				style={{ width, maxWidth, minWidth }}
				onClick={(e) => e.stopPropagation()}
			>
				{title && (
					<div className={styles.header}>
						<h3 className={styles.title}>{title}</h3>
						<button className={styles.closeBtn} onClick={onClose}>
							<Icon name='material-close' size={20} />
						</button>
					</div>
				)}
				<div className={styles.body}>{children}</div>
			</div>
		</div>
	)
}

export default Modal
