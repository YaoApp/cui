import React from 'react'
import { getLocale } from '@umijs/max'
import Icon from '../../../widgets/Icon'
import type { UserMessage } from '../../../openapi'
import styles from './index.less'

export interface QueuedMessage {
	id: string
	message: UserMessage
	type: 'graceful' | 'force'
	timestamp: number
}

export interface IMessageQueueProps {
	queue: QueuedMessage[]
	onCancel: (id: string) => void
	onSendNow: (id: string) => void
	onSendAll: () => void // Force send all queued messages
	className?: string
}

const MessageQueue: React.FC<IMessageQueueProps> = ({ queue, onCancel, onSendNow, onSendAll, className }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	if (queue.length === 0) return null

	const getMessagePreview = (msg: UserMessage): string => {
		if (typeof msg.content === 'string') {
			return msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content
		}
		// For multimodal content
		const textPart = Array.isArray(msg.content) 
			? msg.content.find(p => p.type === 'text')
			: null
		if (textPart && 'text' in textPart) {
			const text = textPart.text || ''
			return text.length > 50 ? text.substring(0, 50) + '...' : text
		}
		return is_cn ? '多模态消息' : 'Multimodal message'
	}

	return (
		<div className={`${styles.container} ${className || ''}`}>
			<div className={styles.header}>
				<div className={styles.headerLeft}>
					<Icon name='material-schedule' size={14} />
					<span className={styles.headerText}>
						{is_cn ? `等待发送 (${queue.length})` : `Queued (${queue.length})`}
					</span>
				</div>
				<button
					className={styles.sendAllBtn}
					onClick={onSendAll}
					title={is_cn ? '立即发送全部' : 'Send all now'}
				>
					<Icon name='material-arrow_upward' size={12} />
					<span>{is_cn ? '立即发送' : 'Send All'}</span>
				</button>
			</div>
			<div className={styles.queueList}>
				{queue.map((item, index) => (
					<div key={item.id} className={styles.queueItem}>
						<div className={styles.itemContent}>
							<span className={styles.itemIndex}>{index + 1}.</span>
							<span className={styles.itemText}>{getMessagePreview(item.message)}</span>
						</div>
						<div className={styles.itemActions}>
							<button
								className={styles.actionBtn}
								onClick={() => onSendNow(item.id)}
								title={is_cn ? '立即发送' : 'Send now'}
							>
								<Icon name='material-arrow_upward' size={14} />
							</button>
							<button
								className={styles.actionBtn}
								onClick={() => onCancel(item.id)}
								title={is_cn ? '取消' : 'Cancel'}
							>
								<Icon name='material-close' size={14} />
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default MessageQueue

