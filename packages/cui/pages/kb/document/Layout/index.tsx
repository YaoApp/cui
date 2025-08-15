import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface ContentLayoutProps {
	className?: string
	OriginalComponent: React.ComponentType<any>
	ChunksComponent: React.ComponentType<any>
	docid: string
	collectionId: string
	document?: any
}

type ViewMode = 'dual' | 'left' | 'right'

const ContentLayout: React.FC<ContentLayoutProps> = ({
	className,
	OriginalComponent,
	ChunksComponent,
	docid,
	collectionId,
	document
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [viewMode, setViewMode] = useState<ViewMode>('dual')
	const [splitPosition, setSplitPosition] = useState(50) // 百分比
	const [isDragging, setIsDragging] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	// 拖拽处理
	const handleMouseDown = useCallback(() => {
		if (viewMode !== 'dual') return
		setIsDragging(true)
	}, [viewMode])

	// 双击恢复居中
	const handleDoubleClick = useCallback(() => {
		if (viewMode !== 'dual') return
		setSplitPosition(50)
	}, [viewMode])

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging || !containerRef.current || viewMode !== 'dual') return

			const rect = containerRef.current.getBoundingClientRect()
			const x = e.clientX - rect.left
			const percentage = Math.max(20, Math.min(80, (x / rect.width) * 100))
			setSplitPosition(percentage)
		},
		[isDragging, viewMode]
	)

	const handleMouseUp = useCallback(() => {
		setIsDragging(false)
	}, [])

	useEffect(() => {
		if (isDragging) {
			window.document.addEventListener('mousemove', handleMouseMove)
			window.document.addEventListener('mouseup', handleMouseUp)
		}

		return () => {
			window.document.removeEventListener('mousemove', handleMouseMove)
			window.document.removeEventListener('mouseup', handleMouseUp)
		}
	}, [isDragging, handleMouseMove, handleMouseUp])

	// 隐藏左栏
	const hideLeftPanel = () => {
		setViewMode('right')
	}

	// 隐藏右栏
	const hideRightPanel = () => {
		setViewMode('left')
	}

	// 恢复双栏
	const restoreDualPanels = () => {
		setViewMode('dual')
	}

	return (
		<div
			ref={containerRef}
			className={`${styles.contentLayout} ${className || ''} ${isDragging ? styles.dragging : ''}`}
			data-view-mode={viewMode}
		>
			{/* 左栏 */}
			<div
				className={styles.leftPanel}
				style={{
					width: viewMode === 'right' ? '0%' : viewMode === 'left' ? '100%' : `${splitPosition}%`
				}}
			>
				<OriginalComponent
					viewMode={viewMode}
					onHideRightPanel={hideRightPanel}
					onRestoreDualPanels={restoreDualPanels}
					docid={docid}
					collectionId={collectionId}
					document={document}
				/>
			</div>

			{/* 分割线 */}
			{viewMode === 'dual' && (
				<div
					className={`${styles.divider} ${isDragging ? styles.dragging : ''}`}
					style={{ left: `${splitPosition}%` }}
					onMouseDown={handleMouseDown}
					onDoubleClick={handleDoubleClick}
				></div>
			)}

			{/* 右栏 */}
			<div
				className={styles.rightPanel}
				style={{
					width:
						viewMode === 'left'
							? '0%'
							: viewMode === 'right'
							? '100%'
							: `${100 - splitPosition}%`
				}}
			>
				<ChunksComponent
					viewMode={viewMode}
					onHideLeftPanel={hideLeftPanel}
					onRestoreDualPanels={restoreDualPanels}
					docid={docid}
					collectionId={collectionId}
				/>
			</div>
		</div>
	)
}

export default ContentLayout
