import React from 'react'
import clsx from 'clsx'
import type { Message } from '../../../../openapi'
import styles from './index.less'

interface IUserMessageProps {
	message: Message
	isLast?: boolean
}

const UserMessage = ({ message, isLast }: IUserMessageProps) => {
	return (
		<div className={clsx(styles.userRow)} style={{ marginBottom: '16px' }}>
			<div className={styles.messageBubble}>
				{/* User name is usually not shown for self in chat interfaces, but kept for consistency if needed */}
				{/* <div className={styles.senderName}>User</div> */}
				<div className={styles.messageContent}>{message.props?.content || ''}</div>
			</div>
		</div>
	)
}

export default UserMessage
