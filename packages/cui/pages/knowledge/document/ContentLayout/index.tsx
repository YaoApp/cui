import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface ContentLayoutProps {
	className?: string
}

type ViewMode = 'dual' | 'left' | 'right'

const ContentLayout: React.FC<ContentLayoutProps> = ({ className }) => {
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
			document.addEventListener('mousemove', handleMouseMove)
			document.addEventListener('mouseup', handleMouseUp)
		}

		return () => {
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseup', handleMouseUp)
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

	// 生成占位内容
	const generatePlaceholderContent = (title: string) => {
		const items = []
		for (let i = 1; i <= 50; i++) {
			items.push(
				<div key={i} className={styles.placeholderItem}>
					{title} - {is_cn ? '内容项' : 'Content Item'} {i}
				</div>
			)
		}
		return items
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
				<div className={styles.panelContent}>
					<div className={styles.panelHeader}>
						<div className={styles.headerTitle}>
							<Icon name='material-description' size={14} />
							<h3>{is_cn ? '原始文档' : 'Original Document'}</h3>
						</div>
						{viewMode === 'dual' ? (
							<Tooltip title={is_cn ? '最大化原始文档' : 'Maximize Original Document'}>
								<Button
									type='text'
									size='small'
									icon={<Icon name='material-fullscreen' size={14} />}
									onClick={hideRightPanel}
									className={styles.headerButton}
								/>
							</Tooltip>
						) : viewMode === 'left' ? (
							<Tooltip title={is_cn ? '恢复双栏显示' : 'Restore Dual Panels'}>
								<Button
									type='text'
									size='small'
									icon={<Icon name='material-vertical_split' size={14} />}
									onClick={restoreDualPanels}
									className={styles.headerButton}
								/>
							</Tooltip>
						) : null}
					</div>
					<div className={styles.scrollableContent}>
						{generatePlaceholderContent(is_cn ? '原始文档' : 'Original Document')}
					</div>
				</div>
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
				<div className={styles.panelContent}>
					<div className={styles.panelHeader}>
						<div className={styles.headerTitle}>
							<Icon name='material-list' size={14} />
							<h3>{is_cn ? '内容分段' : 'Content Segments'}</h3>
						</div>
						{viewMode === 'dual' ? (
							<Tooltip title={is_cn ? '最大化内容分段' : 'Maximize Content Segments'}>
								<Button
									type='text'
									size='small'
									icon={<Icon name='material-fullscreen' size={14} />}
									onClick={hideLeftPanel}
									className={styles.headerButton}
								/>
							</Tooltip>
						) : viewMode === 'right' ? (
							<Tooltip title={is_cn ? '恢复双栏显示' : 'Restore Dual Panels'}>
								<Button
									type='text'
									size='small'
									icon={<Icon name='material-vertical_split' size={14} />}
									onClick={restoreDualPanels}
									className={styles.headerButton}
								/>
							</Tooltip>
						) : null}
					</div>
					<div className={styles.scrollableContent}>
						{generatePlaceholderContent(is_cn ? '内容分段' : 'Content Segments')}
					</div>
				</div>
			</div>
		</div>
	)
}

export default ContentLayout
