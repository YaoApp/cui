import React from 'react'
import { InputComponentProps } from '../types'
import ErrorMessage from '../ErrorMessage'
import styles from './index.less'
import commonStyles from '../common.less'

export default function TextArea({ schema, value, onChange, error, hasError }: InputComponentProps) {
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.value)
	}

	const textAreaClass = `${styles.textArea} ${hasError ? commonStyles.error : ''}`

	return (
		<div className={commonStyles.inputContainer}>
			<textarea
				className={textAreaClass}
				value={typeof value === 'string' ? value : ''}
				onChange={handleChange}
				placeholder={schema.placeholder}
				disabled={schema.disabled}
				readOnly={schema.readOnly}
				minLength={schema.minLength}
				maxLength={schema.maxLength}
				rows={schema.rows || 6}
			/>
			<ErrorMessage message={error} show={hasError} />
		</div>
	)
}
