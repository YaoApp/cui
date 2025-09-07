import React from 'react'
import { InputComponentProps } from '../types'
import ErrorMessage from '../ErrorMessage'
import styles from './index.less'
import commonStyles from '../common.less'

export default function Input({ schema, value, onChange, error, hasError }: InputComponentProps) {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value)
	}

	const inputClass = `${styles.input} ${hasError ? commonStyles.error : ''}`

	return (
		<div className={commonStyles.inputContainer}>
			<input
				className={inputClass}
				type='text'
				value={String(value || '')}
				onChange={handleChange}
				placeholder={schema.placeholder}
				disabled={schema.disabled}
				readOnly={schema.readOnly}
				minLength={schema.minLength}
				maxLength={schema.maxLength}
				pattern={schema.pattern}
			/>
			<ErrorMessage message={error} show={hasError} />
		</div>
	)
}
