import React from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { RobotState } from '../../../types'
import styles from '../index.less'

interface ActiveTabProps {
	robot: RobotState
}

const ActiveTab: React.FC<ActiveTabProps> = ({ robot }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Placeholder - TODO: implement execution cards
	if (robot.running === 0) {
		return (
			<div className={styles.emptyState}>
				<Icon name='material-hourglass_empty' size={48} className={styles.emptyIcon} />
				<span className={styles.emptyText}>
					{is_cn ? '当前没有进行中的任务' : 'No active executions'}
				</span>
				<span className={styles.emptyHint}>
					{is_cn ? '可以手动触发新任务或等待定时执行' : 'Trigger a new task or wait for scheduled run'}
				</span>
			</div>
		)
	}

	return (
		<div className={styles.tabContent}>
			<div style={{ padding: '20px', textAlign: 'center', color: 'var(--color_text_grey)' }}>
				<Icon name='material-construction' size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
				<div style={{ fontSize: '14px', marginBottom: '8px' }}>
					{is_cn ? '进行中 Tab - 开发中' : 'Active Tab - Under Development'}
				</div>
				<div style={{ fontSize: '12px', opacity: 0.7 }}>
					{is_cn 
						? `当前有 ${robot.running} 个任务正在执行` 
						: `${robot.running} execution(s) running`}
				</div>
			</div>
		</div>
	)
}

export default ActiveTab
