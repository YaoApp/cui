import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getLocale } from '@umijs/max'
import { MinusOutlined, PlusOutlined } from '@ant-design/icons'

interface ImageProps {
	src?: string
	file?: File
	contentType?: string
	fileName?: string
}

const MIN_SCALE = 0.1
const MAX_SCALE = 10
const ZOOM_FACTOR = 1.15

const ImageComponent: React.FC<ImageProps> = ({ src, file, contentType, fileName }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const fileSource = useMemo(() => {
		if (src) return src
		if (file) return URL.createObjectURL(file)
		return undefined
	}, [src, file])

	const [scale, setScale] = useState(1)
	const [position, setPosition] = useState({ x: 0, y: 0 })
	const [isDragging, setIsDragging] = useState(false)
	const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })
	const [loadError, setLoadError] = useState(false)
	const [fitted, setFitted] = useState(false)

	const containerRef = useRef<HTMLDivElement>(null)
	const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

	const fitToContainer = useCallback(() => {
		if (!containerRef.current || !naturalSize.w || !naturalSize.h) return
		const rect = containerRef.current.getBoundingClientRect()
		const padding = 40
		const availW = rect.width - padding
		const availH = rect.height - padding
		const fitScale = Math.min(availW / naturalSize.w, availH / naturalSize.h, 1)
		setScale(fitScale)
		setPosition({ x: 0, y: 0 })
	}, [naturalSize])

	useEffect(() => {
		if (naturalSize.w && naturalSize.h && !fitted) {
			fitToContainer()
			setFitted(true)
		}
	}, [naturalSize, fitted, fitToContainer])

	const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
		const img = e.currentTarget
		setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
		setLoadError(false)
	}, [])

	const scaleRef = useRef(scale)
	const positionRef = useRef(position)
	scaleRef.current = scale
	positionRef.current = position

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault()
			const rect = container.getBoundingClientRect()
			const mouseX = e.clientX - rect.left
			const mouseY = e.clientY - rect.top

			const centerX = rect.width / 2
			const centerY = rect.height / 2

			const direction = e.deltaY < 0 ? 1 : -1
			const factor = direction > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR
			const curScale = scaleRef.current
			const curPos = positionRef.current
			const newScale = Math.min(Math.max(curScale * factor, MIN_SCALE), MAX_SCALE)

			const ratio = newScale / curScale
			const newX = curPos.x - (mouseX - centerX - curPos.x) * (ratio - 1)
			const newY = curPos.y - (mouseY - centerY - curPos.y) * (ratio - 1)

			setScale(newScale)
			setPosition({ x: newX, y: newY })
		}

		container.addEventListener('wheel', handleWheel, { passive: false })
		return () => container.removeEventListener('wheel', handleWheel)
	}, [])

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (e.button !== 0) return
			e.preventDefault()
			setIsDragging(true)
			dragStartRef.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y }
		},
		[position]
	)

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!isDragging) return
			const dx = e.clientX - dragStartRef.current.x
			const dy = e.clientY - dragStartRef.current.y
			setPosition({ x: dragStartRef.current.posX + dx, y: dragStartRef.current.posY + dy })
		},
		[isDragging]
	)

	const handleMouseUp = useCallback(() => {
		setIsDragging(false)
	}, [])

	useEffect(() => {
		if (!isDragging) return
		const onUp = () => setIsDragging(false)
		window.addEventListener('mouseup', onUp)
		return () => window.removeEventListener('mouseup', onUp)
	}, [isDragging])

	const handleDoubleClick = useCallback(() => {
		fitToContainer()
	}, [fitToContainer])

	const handleZoomIn = useCallback(() => {
		const newScale = Math.min(scale * ZOOM_FACTOR, MAX_SCALE)
		setScale(newScale)
	}, [scale])

	const handleZoomOut = useCallback(() => {
		const newScale = Math.max(scale / ZOOM_FACTOR, MIN_SCALE)
		setScale(newScale)
	}, [scale])

	const handleActualSize = useCallback(() => {
		setScale(1)
		setPosition({ x: 0, y: 0 })
	}, [])

	useEffect(() => {
		setScale(1)
		setPosition({ x: 0, y: 0 })
		setFitted(false)
		setLoadError(false)
	}, [fileSource])

	if (loadError || !fileSource) {
		return (
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#999' }}>
				{is_cn ? '图片加载失败' : 'Failed to load image'}
			</div>
		)
	}

	const scalePercent = Math.round(scale * 100)

	return (
		<div
			ref={containerRef}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onDoubleClick={handleDoubleClick}
			style={{
				width: '100%',
				height: '100%',
				overflow: 'hidden',
				position: 'relative',
				cursor: isDragging ? 'grabbing' : 'grab',
				userSelect: 'none',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center'
			}}
		>
			<img
				src={fileSource}
				alt={fileName || 'Image'}
				onLoad={handleImageLoad}
				onError={() => setLoadError(true)}
				draggable={false}
				style={{
					transformOrigin: 'center center',
					transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
					maxWidth: 'none',
					maxHeight: 'none',
					pointerEvents: 'none',
					transition: isDragging ? 'none' : 'transform 0.1s ease-out'
				}}
			/>

			{/* Control bar */}
			<div
				style={{
					position: 'absolute',
					bottom: 12,
					left: '50%',
					transform: 'translateX(-50%)',
					display: 'flex',
					alignItems: 'center',
					gap: 6,
					background: 'rgba(255, 255, 255, 0.95)',
					backdropFilter: 'blur(8px)',
					border: '1px solid rgba(0, 0, 0, 0.08)',
					borderRadius: 8,
					padding: '6px 10px',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
					opacity: 0.85,
					transition: 'opacity 0.2s ease',
					zIndex: 10,
					pointerEvents: 'auto'
				}}
				onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
				onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
				onMouseDown={(e) => e.stopPropagation()}
				onDoubleClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={handleZoomOut}
					title={is_cn ? '缩小' : 'Zoom out'}
					style={{
						border: 'none',
						background: 'transparent',
						cursor: 'pointer',
						width: 24,
						height: 24,
						borderRadius: 4,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: 14,
						color: '#666',
						transition: 'all 0.15s'
					}}
				>
					<MinusOutlined />
				</button>
				<span
					style={{
						fontSize: 11,
						fontWeight: 500,
						color: '#333',
						minWidth: 40,
						textAlign: 'center',
						userSelect: 'none'
					}}
				>
					{scalePercent}%
				</span>
				<button
					onClick={handleZoomIn}
					title={is_cn ? '放大' : 'Zoom in'}
					style={{
						border: 'none',
						background: 'transparent',
						cursor: 'pointer',
						width: 24,
						height: 24,
						borderRadius: 4,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: 14,
						color: '#666',
						transition: 'all 0.15s'
					}}
				>
					<PlusOutlined />
				</button>
				<span style={{ width: 1, height: 14, background: 'rgba(0,0,0,0.1)', margin: '0 2px' }} />
				<button
					onClick={fitToContainer}
					title={is_cn ? '适应窗口' : 'Fit to window'}
					style={{
						border: 'none',
						background: 'transparent',
						cursor: 'pointer',
						height: 24,
						borderRadius: 4,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: 11,
						fontWeight: 500,
						color: '#666',
						padding: '0 6px',
						transition: 'all 0.15s'
					}}
				>
					{is_cn ? '适应' : 'Fit'}
				</button>
				<button
					onClick={handleActualSize}
					title={is_cn ? '原始大小' : 'Actual size'}
					style={{
						border: 'none',
						background: 'transparent',
						cursor: 'pointer',
						height: 24,
						borderRadius: 4,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: 11,
						fontWeight: 500,
						color: '#666',
						padding: '0 6px',
						transition: 'all 0.15s'
					}}
				>
					1:1
				</button>
			</div>
		</div>
	)
}

export default ImageComponent
