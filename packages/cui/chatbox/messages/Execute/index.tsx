import React, { useState } from 'react'
import clsx from 'clsx'
import { getLocale } from '@umijs/max'
import type { ExecuteMessage } from '../../../openapi'
import { Icon } from '@/widgets'
import { resolveToolLabel } from './toolLabels'
import DiffView from './DiffView'
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
	const is_cn = getLocale() === 'zh-CN'
	const toolLabel = resolveToolLabel(props.tool || '', is_cn)
	const config = statusConfig[status] || statusConfig.running

	const filePatches = props.file_patches as any[] | undefined
	const description = props.input?.description
	const baseSummary = description || props.summary || extractSummary(props)
	const summary = appendDiffStats(baseSummary, filePatches) || diffSummary(filePatches) || baseSummary
	const label = summary ? `${toolLabel} ${summary}` : toolLabel

	const detailText = buildDetailText(props)
	const hasDetail = (detailText.length > 0 || (filePatches?.length ?? 0) > 0) && !isStreaming

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
				filePatches && filePatches.length > 0
					? <DiffView patches={filePatches} />
					: <pre className={styles.detail}>{detailText}</pre>
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
		return props.input.description || props.input.command || props.input.file_path || props.input.path || ''
	}

	const raw = props.input_delta
	if (typeof raw === 'string' && raw.length > 0) {
		return extractFromPartialJSON(raw)
	}
	return ''
}

function appendDiffStats(summary: string, patches?: any[]): string {
	if (!summary || !patches || patches.length === 0) return ''
	let totalAdds = 0
	let totalDels = 0
	for (const fp of patches) {
		totalAdds += fp.additions || 0
		totalDels += fp.deletions || 0
	}
	if (totalAdds === 0 && totalDels === 0) return ''
	const stats: string[] = []
	if (totalAdds > 0) stats.push(`+${totalAdds}`)
	if (totalDels > 0) stats.push(`-${totalDels}`)
	return `${summary} (${stats.join(' ')})`
}

function diffSummary(patches?: any[]): string {
	if (!patches || patches.length === 0) return ''
	const fp = patches[0]
	const name = (fp.path || '').split(/[/\\]/).pop() || fp.path || ''
	const parts: string[] = [name]
	const stats: string[] = []
	if (fp.additions > 0) stats.push(`+${fp.additions}`)
	if (fp.deletions > 0) stats.push(`-${fp.deletions}`)
	if (stats.length > 0) parts.push(`(${stats.join(' ')})`)
	if (patches.length > 1) parts.push(`+${patches.length - 1} files`)
	return parts.join(' ')
}

function extractFromPartialJSON(s: string): string {
	for (const key of ['description', 'command', 'file_path', 'path', 'url', 'query']) {
		const re = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"?`)
		const m = s.match(re)
		if (m && m[1]) return m[1]
	}
	return ''
}

export default Execute
