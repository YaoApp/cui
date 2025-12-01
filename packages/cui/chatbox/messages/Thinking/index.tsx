import React, { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import clsx from 'clsx'
import type { ThinkingMessage } from '../../../openapi'
import { Icon } from '@/widgets'
import styles from './index.less'

interface IThinkingProps {
	message: ThinkingMessage
	loading?: boolean
}

const Thinking = ({ message, loading }: IThinkingProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Default to collapsed if not loading (history), expanded if loading (streaming)
	const [isCollapsed, setIsCollapsed] = useState(!loading)
	const content = message.props?.content || ''

	// Auto-collapse when loading finishes
	useEffect(() => {
		if (loading) {
			setIsCollapsed(false)
		} else if (loading === false) {
			setIsCollapsed(true)
		}
	}, [loading])

	const toggle = () => {
		setIsCollapsed(!isCollapsed)
	}

	if (!content) return null

	return (
		<div className={styles.container}>
			<div className={styles.header} onClick={toggle}>
				<div className={clsx(styles.icon, !isCollapsed && styles.expanded)}>
					<Icon name='icon-chevron-right' size={14} />
				</div>
				<span className={styles.title}>{is_cn ? '思考过程' : 'Thinking Process'}</span>
			</div>
			{!isCollapsed && <div className={styles.content}>{content}</div>}
		</div>
	)
}

export default Thinking
