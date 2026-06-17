import { useCallback, type ReactNode } from 'react'
import clsx from 'clsx'
import styles from './index.less'

interface DetailPanelProps {
	open: boolean
	width: number
	onWidthChange: (width: number) => void
	isAnimating?: boolean
	minWidth?: number
	children: ReactNode
	className?: string
}

const MENU_WIDTH = 64

const DetailPanel = ({ open, width, onWidthChange, isAnimating, minWidth = 360, children, className }: DetailPanelProps) => {
	const maxWidth = typeof window !== 'undefined' ? window.innerWidth - MENU_WIDTH : 1200

	const handleResizeStart = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault()

			const startX = e.clientX
			const startWidth = width

			document.body.style.cursor = 'col-resize'
			document.body.style.userSelect = 'none'

			const overlay = document.createElement('div')
			overlay.id = 'detail-panel-resize-overlay'
			overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;cursor:col-resize;'
			document.body.appendChild(overlay)

			const onMouseMove = (ev: MouseEvent) => {
				const delta = startX - ev.clientX
				const next = Math.min(Math.max(startWidth + delta, minWidth), maxWidth)
				onWidthChange(next)
			}

			const onMouseUp = () => {
				document.body.style.cursor = ''
				document.body.style.userSelect = ''
				document.getElementById('detail-panel-resize-overlay')?.remove()
				document.removeEventListener('mousemove', onMouseMove)
				document.removeEventListener('mouseup', onMouseUp)
			}

			document.addEventListener('mousemove', onMouseMove)
			document.addEventListener('mouseup', onMouseUp)
		},
		[width, minWidth, maxWidth, onWidthChange]
	)

	const clampedWidth = Math.min(width, maxWidth)

	return (
		<div
			className={clsx(styles.panel, open && styles.open, isAnimating && styles.animating, className)}
			style={{ width: clampedWidth }}
		>
			<div className={styles.resizeHandle} onMouseDown={handleResizeStart}>
				<div className={styles.resizeBar} />
			</div>
			{children}
		</div>
	)
}

export default window.$app.memo(DetailPanel)
