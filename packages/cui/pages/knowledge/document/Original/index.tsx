import React, { useState, useEffect } from 'react'
import { Button, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { mockOriginalData } from '../mockData'
import styles from '../Layout/index.less'

interface OriginalProps {
	viewMode: 'dual' | 'left' | 'right'
	onHideRightPanel: () => void
	onRestoreDualPanels: () => void
	docid: string
	collectionId: string
}

const Original: React.FC<OriginalProps> = ({
	viewMode,
	onHideRightPanel,
	onRestoreDualPanels,
	docid,
	collectionId
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [data, setData] = useState<any[]>([])

	// 根据文档ID加载数据
	useEffect(() => {
		// 这里可以根据 docid 和 collectionId 实际加载数据
		// 目前使用 mockData 模拟
		setData(mockOriginalData)
	}, [docid, collectionId])

	const generateContent = () => {
		return data.map((item: any, index: number) => (
			<div key={index} className={styles.placeholderItem}>
				{is_cn ? '原始文档' : 'Original Document'} -{' '}
				{item.title || `${is_cn ? '内容项' : 'Content Item'} ${index + 1}`}
			</div>
		))
	}

	return (
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
							onClick={onHideRightPanel}
							className={styles.headerButton}
						/>
					</Tooltip>
				) : viewMode === 'left' ? (
					<Tooltip title={is_cn ? '恢复双栏显示' : 'Restore Dual Panels'}>
						<Button
							type='text'
							size='small'
							icon={<Icon name='material-vertical_split' size={14} />}
							onClick={onRestoreDualPanels}
							className={styles.headerButton}
						/>
					</Tooltip>
				) : null}
			</div>
			<div className={styles.scrollableContent}>{generateContent()}</div>
		</div>
	)
}

export default Original
