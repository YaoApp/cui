import React, { useState } from 'react'
import clsx from 'clsx'
import { getLocale } from '@umijs/max'
import type { AgentMessage } from '../../../openapi'
import { Icon } from '@/widgets'
import styles from './index.less'

interface IAgentViewProps {
	message: AgentMessage
	loading?: boolean
}

const subagentConfig: Record<string, { icon: string; label_cn: string; label_en: string }> = {
	a2a: { icon: 'material-assistant', label_cn: 'AI 专家', label_en: 'AI Expert' },
	'general-purpose': { icon: 'material-smart_toy', label_cn: '通用 Agent', label_en: 'Agent' },
	Explore: { icon: 'material-search', label_cn: '代码探索', label_en: 'Explore' },
	Plan: { icon: 'material-assignment', label_cn: '规划分析', label_en: 'Plan' }
}

const defaultConfig = { icon: 'material-smart_toy', label_cn: 'Agent', label_en: 'Agent' }

const AgentView = ({ message, loading }: IAgentViewProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const raw = message.props || ({} as any)
	const props = raw.execute && typeof raw.execute === 'object' ? { ...raw.execute } : raw
	const status = props.status || 'running'
	const isStreaming = !!loading && status === 'running'

	const subType = props.subagent_type || props.input?.subagent_type || ''
	const config = subagentConfig[subType] || defaultConfig
	const typeLabel = is_cn ? config.label_cn : config.label_en

	const description = props.input?.description || props.input?.prompt || props.summary || ''
	const label = description ? `${typeLabel}: ${truncate(description, 60)}` : typeLabel

	const detailText = buildDetailText(props)
	const hasDetail = detailText.length > 0 && !isStreaming

	const [showDetail, setShowDetail] = useState(false)

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<span className={clsx(styles.icon, isStreaming ? styles.iconMuted : styles.iconActive)}>
					<Icon name={config.icon} size={14} />
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

function truncate(s: string, max: number): string {
	s = s.replace(/\n/g, ' ').trim()
	return s.length > max ? s.slice(0, max) + '...' : s
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

export default AgentView
