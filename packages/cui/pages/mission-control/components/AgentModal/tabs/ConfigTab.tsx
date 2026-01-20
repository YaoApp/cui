import React from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { RobotState } from '../../../types'
import styles from '../index.less'

interface ConfigTabProps {
	robot: RobotState
}

const ConfigTab: React.FC<ConfigTabProps> = ({ robot }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	return (
		<div className={styles.tabContent}>
			<div style={{ padding: '20px', textAlign: 'center', color: 'var(--color_text_grey)' }}>
				<Icon name='material-construction' size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
				<div style={{ fontSize: '14px', marginBottom: '8px' }}>
					{is_cn ? '配置 Tab - 开发中' : 'Config Tab - Under Development'}
				</div>
				<div style={{ fontSize: '12px', opacity: 0.7 }}>
					{is_cn 
						? '将展示该代理的配置信息（触发器、资源、交付等）' 
						: 'Will show agent configuration (triggers, resources, delivery, etc.)'}
				</div>
			</div>
		</div>
	)
}

export default ConfigTab
