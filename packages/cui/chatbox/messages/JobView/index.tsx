import React, { useState } from 'react'
import clsx from 'clsx'
import { getLocale } from '@umijs/max'
import type { JobMessage } from '../../../openapi'
import { Icon } from '@/widgets'
import styles from './index.less'

interface IJobViewProps {
	message: JobMessage
	loading?: boolean
}

const actionLabels: Record<string, { cn: string; en: string }> = {
	create: { cn: 'Job: 创建', en: 'Job: Create' },
	get: { cn: 'Job: 状态', en: 'Job: Status' },
	list: { cn: 'Job: 列表', en: 'Job: List' },
	output: { cn: 'Job: 输出', en: 'Job: Output' },
	stop: { cn: 'Job: 停止', en: 'Job: Stop' },
	update: { cn: 'Job: 更新', en: 'Job: Update' }
}

const defaultLabel = { cn: 'Job', en: 'Job' }

const JobView = ({ message, loading }: IJobViewProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const raw = message.props || ({} as any)
	const props = raw.execute && typeof raw.execute === 'object' ? { ...raw.execute } : raw
	const status = props.status || 'running'
	const isStreaming = !!loading && status === 'running'

	const action = props.action || ''
	const labels = actionLabels[action] || defaultLabel
	const label = is_cn ? labels.cn : labels.en

	const detailText = buildDetailText(props)
	const hasDetail = detailText.length > 0 && !isStreaming

	const [showDetail, setShowDetail] = useState(false)

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<span className={clsx(styles.icon, isStreaming ? styles.iconMuted : styles.iconActive)}>
					<Icon name='material-work' size={14} />
				</span>
				<span className={isStreaming ? styles.shimmerText : styles.staticText}>{label}</span>
				{hasDetail && (
					<span
						className={clsx(styles.toggle, showDetail && styles.toggleExpanded)}
						onClick={() => setShowDetail(!showDetail)}
					>
						<Icon name='icon-chevron-right' size={11} />
					</span>
				)}
			</div>
			{showDetail && hasDetail && <pre className={styles.detail}>{detailText}</pre>}
		</div>
	)
}

function buildDetailText(props: any): string {
	const parts: string[] = []
	if (props.input) {
		const v = typeof props.input === 'string' ? props.input : JSON.stringify(props.input, null, 2)
		if (v) parts.push(v)
	}
	if (props.output) {
		const v = typeof props.output === 'string' ? props.output : JSON.stringify(props.output, null, 2)
		if (v) parts.push(v)
	}
	return parts.join('\n')
}

export default JobView
