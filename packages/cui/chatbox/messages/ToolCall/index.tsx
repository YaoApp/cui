import React, { useState } from 'react'
import { getLocale } from '@umijs/max'
import clsx from 'clsx'
import type { ToolCallMessage } from '../../../openapi'
import { Icon } from '@/widgets'
import styles from './index.less'

interface IToolCallProps {
	message: ToolCallMessage
}

const ToolCall = ({ message }: IToolCallProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [isCollapsed, setIsCollapsed] = useState(true)

	const rawName = message.props?.name || 'Unknown'
	const parts = rawName.split('__')
	const serverName = parts.length > 1 ? parts[0] : null
	const toolName = parts.length > 1 ? parts[1] : rawName

	const args = message.props?.arguments || ''
	// const id = message.props?.id // ID might be useful for debugging but not needed in basic UI

	// Try to pretty print JSON
	let formattedArgs = args
	try {
		if (args) {
			const parsed = JSON.parse(args)
			formattedArgs = JSON.stringify(parsed, null, 2)
		}
	} catch (e) {
		// ignore error, use raw string
	}

	const toggle = () => {
		setIsCollapsed(!isCollapsed)
	}

	return (
		<div className={styles.container}>
			<div className={styles.header} onClick={toggle}>
				<div className={clsx(styles.icon, !isCollapsed && styles.expanded)}>
					<Icon name='icon-chevron-right' size={14} />
				</div>
				<div className={styles.title}>
					<span>{is_cn ? '调用工具' : 'Calling Tool'}</span>
					<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
						{serverName && (
							<>
								<span className={styles.server}>{serverName}</span>
								<span className={styles.server}>/</span>
							</>
						)}
						<span className={styles.name}>{toolName}</span>
					</div>
				</div>
			</div>
			{!isCollapsed && <div className={styles.content}>{formattedArgs}</div>}
		</div>
	)
}

export default ToolCall
