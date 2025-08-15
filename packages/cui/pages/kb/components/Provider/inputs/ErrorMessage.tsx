import React from 'react'
import styles from './common.less'

export interface ErrorMessageProps {
	/** Error message to display */
	message?: string
	/** Whether to show the error message */
	show?: boolean
}

/**
 * Common error message component for all input components
 */
export default function ErrorMessage({ message, show }: ErrorMessageProps) {
	if (!show || !message) {
		return null
	}

	return <div className={styles.errorMessage}>{message}</div>
}
