import React from 'react'
import clsx from 'clsx'
import { getLocale } from '@umijs/max'
import type { PlanMessage } from '../../../openapi'
import { Icon } from '@/widgets'
import styles from './index.less'

interface IPlanViewProps {
	message: PlanMessage
	loading?: boolean
}

const PlanView = ({ message, loading }: IPlanViewProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const raw = message.props || ({} as any)
	const props = raw.execute && typeof raw.execute === 'object' ? { ...raw.execute } : raw
	const status = props.status || 'running'
	const isStreaming = !!loading && status === 'running'

	const action = props.action || 'enter'
	const isEnter = action === 'enter'
	const iconName = isEnter ? 'material-assignment' : 'material-assignment_turned_in'
	const label = isEnter
		? is_cn
			? '进入计划模式'
			: 'Enter Plan Mode'
		: is_cn
			? '退出计划模式'
			: 'Exit Plan Mode'

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<span className={clsx(styles.icon, isStreaming ? styles.iconMuted : styles.iconActive)}>
					<Icon name={iconName} size={14} />
				</span>
				<span className={isStreaming ? styles.shimmerText : styles.staticText}>{label}</span>
			</div>
		</div>
	)
}

export default PlanView
