import React, { useState } from 'react'
import { Typography } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { Segment } from '@/openapi/kb/types'
import localStyles from './index.less'

const { Text, Title, Paragraph } = Typography

interface ParentsViewerProps {
	parentsData: Segment[]
	currentSegment: Segment
	selectedSegment: Segment
	onSegmentSelect: (segment: Segment) => void
}

const ParentsViewer: React.FC<ParentsViewerProps> = ({
	parentsData,
	currentSegment,
	selectedSegment,
	onSegmentSelect
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 构建层级菜单数据
	const buildMenuData = () => {
		// 合并父级分段和当前分段，按 depth 排序
		const allSegments = [...parentsData, currentSegment].sort((a, b) => {
			const depthA = a.metadata?.chunk_details?.depth || 0
			const depthB = b.metadata?.chunk_details?.depth || 0
			return depthA - depthB
		})

		return allSegments
	}

	const menuData = buildMenuData()

	const handleMenuItemClick = (segment: Segment) => {
		onSegmentSelect(segment)
	}

	const formatDate = (dateString?: string) => {
		if (!dateString) return ''
		const date = new Date(dateString)
		return date.toLocaleString(is_cn ? 'zh-CN' : 'en-US')
	}

	const getPositionInfo = (segment: Segment) => {
		const metadata = segment.metadata
		if (!metadata?.chunk_details) return ''

		const { source_page, source_line_start, source_line_end } = metadata.chunk_details
		const parts = []

		if (source_page !== undefined) {
			parts.push(`${is_cn ? '页' : 'Page'}: ${source_page}`)
		}

		if (source_line_start !== undefined && source_line_end !== undefined) {
			parts.push(`${is_cn ? '行' : 'Lines'}: ${source_line_start}-${source_line_end}`)
		}

		return parts.join(', ')
	}

	return (
		<div className={localStyles.parentsViewer}>
			{/* 左侧层级菜单 */}
			<div className={localStyles.menuSection}>
				<div className={localStyles.menuSectionHeader}>
					<Icon name='material-account_tree' size={16} />
					<Text strong>{is_cn ? '上下文层级' : 'Context Hierarchy'}</Text>
					<span className={localStyles.count}>({parentsData.length})</span>
				</div>
				<div className={localStyles.menuContainer}>
					{menuData.map((segment) => {
						const depth = segment.metadata?.chunk_details?.depth || 0
						const segmentIndex = segment.metadata?.chunk_details?.index || 0
						const isCurrentSegment = segment.id === currentSegment.id
						const isSelected = selectedSegment?.id === segment.id

						return (
							<div
								key={segment.id}
								className={`${localStyles.menuItem} ${
									isSelected ? localStyles.selected : ''
								}`}
								style={{
									paddingLeft: `${(depth - 1) * 20 + 16}px`,
									paddingRight: '16px'
								}}
								onClick={() => handleMenuItemClick(segment)}
							>
								<div className={localStyles.menuItemContent}>
									{isCurrentSegment && (
										<Icon
											name='material-radio_button_checked'
											size={10}
											className={localStyles.currentIndicator}
										/>
									)}
									<span className={localStyles.levelIndex}>
										L{depth}.{segmentIndex + 1}
									</span>
									<span className={localStyles.textContent} title={segment.text}>
										{segment.text}
									</span>
								</div>
							</div>
						)
					})}
				</div>
			</div>

			{/* 右侧内容展示 */}
			<div className={localStyles.contentSection}>
				{selectedSegment ? (
					<div className={localStyles.segmentCard}>
						{/* 分段内容 */}
						<div className={localStyles.segmentContent}>
							<Paragraph className={localStyles.segmentText}>
								{selectedSegment.text}
							</Paragraph>
						</div>

						{/* 分段元信息 */}
						<div className={localStyles.segmentFooter}>
							<div className={localStyles.metaRow}>
								<Text type='secondary' className={localStyles.metaLabel}>
									{is_cn ? '位置' : 'Position'}:
								</Text>
								<Text className={localStyles.metaValue}>
									{getPositionInfo(selectedSegment) || (is_cn ? '未知' : 'Unknown')}
								</Text>
							</div>
							<div className={localStyles.metaRow}>
								<Text type='secondary' className={localStyles.metaLabel}>
									{is_cn ? '命中次数' : 'Hit Count'}:
								</Text>
								<Text className={localStyles.metaValue}>
									{selectedSegment.metadata?.hit_count || 0}
								</Text>
							</div>
							<div className={localStyles.metaRow}>
								<Text type='secondary' className={localStyles.metaLabel}>
									{is_cn ? '创建时间' : 'Created'}:
								</Text>
								<Text className={localStyles.metaValue}>
									{formatDate(selectedSegment.created_at)}
								</Text>
							</div>
							<div className={localStyles.metaRow}>
								<Text type='secondary' className={localStyles.metaLabel}>
									{is_cn ? '更新时间' : 'Updated'}:
								</Text>
								<Text className={localStyles.metaValue}>
									{formatDate(selectedSegment.updated_at)}
								</Text>
							</div>
						</div>
					</div>
				) : (
					<div className={localStyles.emptyState}>
						<Icon name='material-description' size={48} />
						<Text>{is_cn ? '请选择一个父级分段' : 'Please select a parent segment'}</Text>
					</div>
				)}
			</div>
		</div>
	)
}

export default ParentsViewer
