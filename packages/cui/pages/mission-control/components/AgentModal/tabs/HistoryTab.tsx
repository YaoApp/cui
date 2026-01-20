import React from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { RobotState } from '../../../types'
import styles from '../index.less'

interface HistoryTabProps {
	robot: RobotState
}

const HistoryTab: React.FC<HistoryTabProps> = ({ robot }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	return (
		<div className={styles.tabContent}>
			<div style={{ padding: '20px', textAlign: 'center', color: 'var(--color_text_grey)' }}>
				<Icon name='material-construction' size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
				<div style={{ fontSize: '14px', marginBottom: '8px' }}>
					{is_cn ? '历史 Tab - 开发中' : 'History Tab - Under Development'}
				</div>
				<div style={{ fontSize: '12px', opacity: 0.7 }}>
					{is_cn 
						? '将展示该代理的历史执行记录' 
						: 'Will show execution history for this agent'}
				</div>
			</div>
		</div>
	)
}

export default HistoryTab
