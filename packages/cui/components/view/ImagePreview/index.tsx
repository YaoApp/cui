import { useEffect } from 'react'
import { createPortal } from 'react-dom'

import ImageViewer from '@/components/view/FileViewer/viewers/Image'

import styles from './index.less'

interface IProps {
	src: string
	fileName?: string
	onClose: () => void
}

const ImagePreview = (props: IProps) => {
	const { src, fileName, onClose } = props

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}

		document.addEventListener('keydown', onKeyDown)
		const prevOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'

		return () => {
			document.removeEventListener('keydown', onKeyDown)
			document.body.style.overflow = prevOverflow
		}
	}, [onClose])

	const handleOpenNewTab = () => {
		window.open(src, '_blank', 'noopener,noreferrer')
	}

	return createPortal(
		<div
			className={styles.overlay}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div className={styles.toolbar}>
				<div className={styles.file_info}>
					<i className='Icon material'>image</i>
					<span>{fileName || 'image'}</span>
				</div>
				<span style={{ flex: 1 }} />
				<div className={styles.actions}>
					<span className={styles.btn} title='Open in new tab' onClick={handleOpenNewTab}>
						<i className='Icon material'>open_in_new</i>
					</span>
					<span className={styles.btn} title='Close' onClick={onClose}>
						<i className='Icon material'>close</i>
					</span>
				</div>
			</div>
			<div className={styles.body}>
				<ImageViewer src={src} fileName={fileName} />
			</div>
		</div>,
		document.body
	)
}

export default ImagePreview
