import React from 'react'
import { Icon } from '@/widgets'
import styles from './index.less'

interface IErrorProps {
	message: {
		type: 'error'
		props: {
			message: string
			code?: string
			details?: string
		}
	}
}

const Error = ({ message }: IErrorProps) => {
	const { message: errorMsg, code, details } = message.props || {}

	if (!errorMsg && !code && !details) {
		return null
	}

	return (
		<div className={styles.container} style={{ marginBottom: '24px' }}>
			<div className={styles.header}>
				<div className={styles.icon}>
					<Icon name='icon-alert-circle' size={16} />
				</div>
				{code && <span className={styles.code}>[{code}]</span>}
				<span>Error</span>
			</div>
			<div className={styles.message}>{errorMsg || 'An unknown error occurred'}</div>
			{details && <div className={styles.details}>{details}</div>}
		</div>
	)
}

export default Error
