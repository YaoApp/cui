import React from 'react'
import { Icon } from '@/widgets'
import styles from './index.less'

interface IErrorProps {
	message: {
		type: 'error'
		props: {
			message?: string | any
			code?: string
			details?: string | any
		}
	}
}

// Helper function to safely convert any value to string
const safeStringify = (value: any): string => {
	if (value === null || value === undefined) {
		return ''
	}
	if (typeof value === 'string') {
		return value
	}
	if (typeof value === 'object') {
		try {
			return JSON.stringify(value, null, 2)
		} catch (e) {
			return String(value)
		}
	}
	return String(value)
}

const Error = ({ message }: IErrorProps) => {
	const { message: errorMsg, code, details } = message.props || {}

	const errorMsgStr = safeStringify(errorMsg)
	const codeStr = typeof code === 'string' ? code : ''
	const detailsStr = safeStringify(details)

	if (!errorMsgStr && !codeStr && !detailsStr) {
		return null
	}

	return (
		<div className={styles.container} style={{ marginBottom: '24px' }}>
			<div className={styles.header}>
				<div className={styles.icon}>
					<Icon name='icon-alert-circle' size={16} />
				</div>
				{codeStr && <span className={styles.code}>[{codeStr}]</span>}
				<span>Error</span>
			</div>
			<div className={styles.message}>{errorMsgStr || 'An unknown error occurred'}</div>
			{detailsStr && <div className={styles.details}>{detailsStr}</div>}
		</div>
	)
}

export default Error
