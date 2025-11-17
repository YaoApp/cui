import { memo, useState, useEffect, useRef } from 'react'
import { Modal } from 'antd'
import Icon from '@/widgets/Icon'
import styles from './index.less'
import { MemoryType } from '../../../types'

interface MemoryCardData {
	id: string
	type: MemoryType
	title: string
	content: string
	count?: number
	items?: string[] // 用于悬停卡片显示的多条摘要
}

interface MemoryCardProps {
	data: MemoryCardData
	onClick?: () => void
	isUpdating?: boolean // 标记是否正在更新
}

const getTypeIcon = (type: MemoryType): string => {
	const iconMap: Record<MemoryType, string> = {
		context: 'material-description',
		intent: 'material-psychology',
		knowledge: 'material-lightbulb',
		history: 'material-history',
		custom: 'material-extension'
	}
	return iconMap[type] || 'material-memory'
}

const getTypeLabel = (type: MemoryType, is_cn: boolean): string => {
	const labelMap: Record<MemoryType, { cn: string; en: string }> = {
		context: { cn: '上下文', en: 'Context' },
		intent: { cn: '意图', en: 'Intent' },
		knowledge: { cn: '知识', en: 'Knowledge' },
		history: { cn: '历史', en: 'History' },
		custom: { cn: '自定义', en: 'Custom' }
	}
	return is_cn ? labelMap[type].cn : labelMap[type].en
}

const getTypeColor = (type: MemoryType): string => {
	const colorMap: Record<MemoryType, string> = {
		context: '#3371fc',
		intent: '#9c27b0',
		knowledge: '#ff9800',
		history: '#4caf50',
		custom: '#607d8b'
	}
	return colorMap[type] || '#757575'
}

const MemoryCard: React.FC<MemoryCardProps> = ({ data, onClick, isUpdating = false }) => {
	const is_cn = true // 暂时硬编码，稍后从父组件传入
	const [isHovered, setIsHovered] = useState(false)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [countChanged, setCountChanged] = useState(false)
	const prevCountRef = useRef(data.count)

	// 检测 count 变化，触发动画
	useEffect(() => {
		if (prevCountRef.current !== undefined && data.count !== prevCountRef.current) {
			setCountChanged(true)
			const timer = setTimeout(() => setCountChanged(false), 400)
			return () => clearTimeout(timer)
		}
		prevCountRef.current = data.count
	}, [data.count])

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		setIsModalOpen(true)
		onClick?.()
	}

	// 生成摘要预览（截断到指定字符）
	const getSummary = (text: string, maxLength: number = 40) => {
		if (text.length <= maxLength) return text
		return text.slice(0, maxLength) + '...'
	}

	return (
		<>
			<div 
				className={`${styles.memoryCardWrapper} ${isUpdating ? styles.updating : ''}`}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<div className={styles.memoryCard} onClick={handleClick}>
					<Icon name={getTypeIcon(data.type)} size={14} style={{ color: getTypeColor(data.type) }} />
					<span className={styles.typeLabel}>{getTypeLabel(data.type, is_cn)}</span>
					{data.count !== undefined && data.count > 0 && (
						<span className={`${styles.count} ${countChanged ? styles.changed : ''}`}>
							{data.count}
						</span>
					)}
				</div>

				{/* 悬停卡片 */}
				{isHovered && (
					<div className={styles.hoverCard}>
						<div className={styles.hoverCardHeader}>
							<Icon name={getTypeIcon(data.type)} size={12} style={{ color: getTypeColor(data.type) }} />
							<span className={styles.hoverCardTitle}>{data.title}</span>
						</div>
						<div className={styles.hoverCardContent}>
							{/* 显示摘要片段 */}
							{data.items && data.items.length > 0 ? (
								data.items.map((item, index) => (
									<div key={index} className={styles.summaryItem}>
										{getSummary(item, 40)}
									</div>
								))
							) : (
								<div className={styles.summaryItem}>
									{getSummary(data.content, 40)}
								</div>
							)}
						</div>
						<div className={styles.hoverCardFooter} onClick={handleClick}>
							查看详情
						</div>
					</div>
				)}
			</div>

			{/* 详情模态窗 */}
			<Modal
				title={
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<Icon name={getTypeIcon(data.type)} size={16} style={{ color: getTypeColor(data.type) }} />
						<span>{getTypeLabel(data.type, is_cn)}</span>
					</div>
				}
				open={isModalOpen}
				onCancel={() => setIsModalOpen(false)}
				footer={null}
				width={600}
			>
				<div style={{ padding: '16px 0' }}>
					<div style={{ marginBottom: '16px' }}>
						<div style={{ fontSize: '12px', color: 'var(--color_text_grey)', marginBottom: '8px' }}>标题</div>
						<div style={{ fontSize: '14px', color: 'var(--color_text)', padding: '12px', background: 'var(--color_bg)', borderRadius: '6px', border: '1px solid var(--color_border)' }}>
							{data.title}
						</div>
					</div>
					<div style={{ marginBottom: '16px' }}>
						<div style={{ fontSize: '12px', color: 'var(--color_text_grey)', marginBottom: '8px' }}>内容</div>
						<div style={{ fontSize: '14px', color: 'var(--color_text)', lineHeight: '1.6', padding: '12px', background: 'var(--color_bg)', borderRadius: '6px', border: '1px solid var(--color_border)' }}>
							{data.content}
						</div>
					</div>
					{data.count !== undefined && data.count > 0 && (
						<div>
							<div style={{ fontSize: '12px', color: 'var(--color_text_grey)', marginBottom: '8px' }}>项目数量</div>
							<div style={{ fontSize: '14px', color: 'var(--color_text)', padding: '12px', background: 'var(--color_bg)', borderRadius: '6px', border: '1px solid var(--color_border)' }}>
								{data.count} 项
							</div>
						</div>
					)}
				</div>
			</Modal>
		</>
	)
}

export default memo(MemoryCard)

