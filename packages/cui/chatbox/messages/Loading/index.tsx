import React from 'react'
import type { LoadingMessage } from '../../../openapi'
import styles from './index.less'

interface ILoadingProps {
	message: LoadingMessage
}

const Loading = ({ message }: ILoadingProps) => {
	const { props } = message
	const { done, status, message: text } = props || {}

	// Check completion status
	const isComplete = done === true || status === 'complete' || status === 'success' || status === 'fail'

	if (isComplete) {
		return null
	}

	return (
		<div className={styles.container}>
			{text && <span className={styles.loadingText}>{text}</span>}
		</div>
	)
}

export default Loading
