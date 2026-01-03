import { FC, useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'

interface SidebarProps {
	isOpen: boolean
	onClose: () => void
	children?: React.ReactNode
}

const MIN_WIDTH = 320
const MAX_WIDTH = 800
const DEFAULT_WIDTH = 400

const Sidebar: FC<SidebarProps> = ({ isOpen, onClose, children }) => {
	const [width, setWidth] = useState(DEFAULT_WIDTH)
	const sidebarRef = useRef<HTMLDivElement>(null)
	const resizeRef = useRef<HTMLDivElement>(null)
	const isDraggingRef = useRef(false)
	const startXRef = useRef(0)
	const startWidthRef = useRef(0)

	const handleResizeStart = (e: React.MouseEvent) => {
		e.preventDefault()
		isDraggingRef.current = true
		startXRef.current = e.clientX
		startWidthRef.current = width

		// Prevent text selection and interference during drag
		document.body.style.cursor = 'col-resize'
		document.body.style.userSelect = 'none'
		// Add a transparent overlay to prevent iframe/other elements from capturing mouse events
		const overlay = document.createElement('div')
		overlay.id = 'sidebar-resize-overlay'
		overlay.style.cssText =
			'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;cursor:col-resize;'
		document.body.appendChild(overlay)

		const handleMouseMove = (e: MouseEvent) => {
			if (!isDraggingRef.current) return

			const deltaX = e.clientX - startXRef.current
			const newWidth = startWidthRef.current - deltaX

			if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
				setWidth(newWidth)
			}
		}

		const handleMouseUp = () => {
			isDraggingRef.current = false
			// Cleanup: restore cursor and remove overlay
			document.body.style.cursor = ''
			document.body.style.userSelect = ''
			const existingOverlay = document.getElementById('sidebar-resize-overlay')
			if (existingOverlay) {
				existingOverlay.remove()
			}
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseup', handleMouseUp)
		}

		document.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseup', handleMouseUp)
	}

	if (!isOpen) return null

	return (
		<div
			ref={sidebarRef}
			className='chat-sidebar'
			style={{
				width: width
			}}
		>
			<div ref={resizeRef} className='resize-handle' onMouseDown={handleResizeStart} />
			<div className='sidebar-content'>{children}</div>
		</div>
	)
}

export default observer(Sidebar)
