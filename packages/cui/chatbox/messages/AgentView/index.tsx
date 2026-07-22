import React, { useState } from 'react'
import clsx from 'clsx'
import { getLocale } from '@umijs/max'
import type { AgentMessage } from '../../../openapi'
import { Icon } from '@/widgets'
import styles from './index.less'

interface ChildTool {
	message_id: string
	type: string
	props: Record<string, any>
	status?: string
	delta?: boolean
}

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

const childStatusIcon: Record<string, string> = {
	running: 'icon-play',
	completed: 'icon-check',
	error: 'icon-x'
}

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

	const children: ChildTool[] = Array.isArray(props.children) ? props.children : []
	const hasChildren = children.length > 0

	const detailText = buildDetailText(props)
	const hasRawDetail = detailText.length > 0 && !isStreaming
	const canToggle = hasChildren || hasRawDetail

	const [showDetail, setShowDetail] = useState(false)
	const [expandedChildren, setExpandedChildren] = useState<Record<string, boolean>>({})

	// Auto-expand children list while streaming to show real-time progress
	const showChildren = hasChildren && (isStreaming || showDetail)

	const toggleChild = (id: string) => {
		setExpandedChildren((prev) => ({ ...prev, [id]: !prev[id] }))
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<span className={clsx(styles.icon, isStreaming ? styles.iconMuted : styles.iconActive)}>
					<Icon name={config.icon} size={14} />
				</span>
				<span className={isStreaming ? styles.shimmerText : styles.staticText}>{label}</span>
				{hasChildren && (
					<span className={styles.childCount}>
						{children.length}
					</span>
				)}
				{canToggle && !isStreaming && (
					<span
						className={clsx(styles.toggle, showDetail && styles.toggleExpanded)}
						onClick={() => setShowDetail(!showDetail)}
					>
						<Icon name='icon-chevron-right' size={11} />
					</span>
				)}
			</div>
			{showChildren && (
				<div className={styles.childrenList}>
					{children.map((child) => {
						const cp = child.props || {}
						const childStatus = cp.status || child.status || 'running'
						const toolName = cp.tool || '...'
						const summary = cp.summary || extractChildSummary(cp)
						const childLabel = summary ? `${toolName} ${truncate(summary, 50)}` : toolName
						const iconName = childStatusIcon[childStatus] || childStatusIcon.running
						const isChildStreaming = !!loading && childStatus === 'running'
						const childDetail = buildChildDetail(cp)
						const hasChildDetail = childDetail.length > 0 && !isChildStreaming
						const isExpanded = !!expandedChildren[child.message_id]

						return (
							<div key={child.message_id} className={styles.childItem}>
								<div className={styles.childHeader}>
									<span className={styles.childIcon}>
										<Icon name={iconName} size={10} />
									</span>
									<span className={isChildStreaming ? styles.shimmerText : styles.staticText}>
										{childLabel}
									</span>
									{hasChildDetail && (
										<span
											className={clsx(styles.toggle, isExpanded && styles.toggleExpanded)}
											onClick={() => toggleChild(child.message_id)}
										>
											<Icon name='icon-chevron-right' size={10} />
										</span>
									)}
								</div>
								{isExpanded && hasChildDetail && (
									<pre className={styles.childDetail}>{childDetail}</pre>
								)}
							</div>
						)
					})}
				</div>
			)}
			{showDetail && !hasChildren && hasRawDetail && (
				<pre className={styles.detail}>{detailText}</pre>
			)}
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

function extractChildSummary(props: any): string {
	if (props.input && typeof props.input === 'object') {
		return props.input.command || props.input.file_path || props.input.path || ''
	}
	const raw = props.input_delta
	if (typeof raw === 'string' && raw.length > 0) {
		for (const key of ['command', 'file_path', 'path', 'url', 'query']) {
			const re = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"?`)
			const m = raw.match(re)
			if (m && m[1]) return m[1]
		}
	}
	return ''
}

function buildChildDetail(props: any): string {
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
