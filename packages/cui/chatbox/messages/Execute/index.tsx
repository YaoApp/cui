import React, { useState } from 'react'
import clsx from 'clsx'
import type { ExecuteMessage } from '../../../openapi'
import { Icon } from '@/widgets'
import styles from './index.less'

interface IExecuteProps {
	message: ExecuteMessage
	loading?: boolean
}

const statusConfig: Record<string, { icon: string; className: string }> = {
	running: { icon: 'icon-play', className: 'statusRunning' },
	completed: { icon: 'icon-check', className: 'statusCompleted' },
	error: { icon: 'icon-x', className: 'statusCompleted' }
}

const Execute = ({ message, loading }: IExecuteProps) => {
	const raw = message.props || ({} as any)
	const props = raw.execute && typeof raw.execute === 'object' ? { ...raw.execute } : raw
	const status = props.status || 'running'
	const isStreaming = !!loading && status === 'running'
	const toolName = props.tool || '...'
	const config = statusConfig[status] || statusConfig.running

	const summary = props.summary || extractSummary(props)
	const label = summary ? `${toolName} ${summary}` : toolName

	const detailText = buildDetailText(props)
	const hasDetail = detailText.length > 0 && !isStreaming

	const [showDetail, setShowDetail] = useState(false)

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<span className={clsx(styles.icon, styles[config.className])}>
					<Icon name={config.icon} size={11} />
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
			{showDetail && hasDetail && (
				<pre className={styles.detail}>{detailText}</pre>
			)}
		</div>
	)
}

function buildDetailText(props: any): string {
	const parts: string[] = []

	const input = formatValue(props.input)
	if (input) parts.push(input)

	const output = formatValue(props.output)
	if (output) parts.push(output)

	return parts.join('\n')
}

function formatValue(v: any): string {
	if (v == null) return ''
	if (typeof v === 'string') return v
	return JSON.stringify(v, null, 2)
}

function extractSummary(props: any): string {
	if (props.input && typeof props.input === 'object') {
		return props.input.command || props.input.file_path || props.input.path || ''
	}

	const raw = props.input_delta
	if (typeof raw === 'string' && raw.length > 0) {
		return extractFromPartialJSON(raw)
	}
	return ''
}

function extractFromPartialJSON(s: string): string {
	for (const key of ['command', 'file_path', 'path', 'url', 'query']) {
		const re = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"?`)
		const m = s.match(re)
		if (m && m[1]) return m[1]
	}
	return ''
}

export default Execute
