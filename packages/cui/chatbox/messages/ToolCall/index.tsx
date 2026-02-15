import React from 'react'
import type { ToolCallMessage } from '../../../openapi'
import { Icon } from '@/widgets'
import styles from './index.less'

interface IToolCallProps {
	message: ToolCallMessage
	loading?: boolean
}

// snake_case → Title Case (e.g. "agents_yao_keeper" → "Agents Yao Keeper")
const toTitleCase = (s: string) =>
	s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

// snake_case → PascalCase (e.g. "save_file" → "SaveFile")
const toPascalCase = (s: string) =>
	s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')

const ToolCall = ({ message, loading }: IToolCallProps) => {
	const isStreaming = !!loading

	const rawName = message.props?.name || ''
	const parts = rawName.split('__')
	const serverName = parts.length > 1 ? toTitleCase(parts[0]) : null
	const toolName = parts.length > 1 ? toPascalCase(parts[1]) : rawName || '...'

	const label = serverName ? `${serverName}: ${toolName}` : toolName
	const textClass = isStreaming ? styles.shimmerText : styles.staticText

	return (
		<div className={styles.container}>
			<span className={styles.icon}><Icon name='icon-zap' size={11} /></span>
			<span className={textClass}>{label}</span>
		</div>
	)
}

export default ToolCall
