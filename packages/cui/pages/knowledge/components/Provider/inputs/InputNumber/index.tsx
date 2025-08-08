import React from 'react'
import { InputComponentProps } from '../../types'
import ErrorMessage from '../ErrorMessage'
import styles from './index.less'
import commonStyles from '../common.less'

export default function InputNumber({ schema, value, onChange, error, hasError }: InputComponentProps) {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value
		if (val === '') {
			onChange('')
		} else {
			const numValue = schema.type === 'integer' ? parseInt(val, 10) : parseFloat(val)
			if (!isNaN(numValue)) {
				onChange(numValue)
			}
		}
	}

	const handleBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value
		if (val === '') return

		let numValue = schema.type === 'integer' ? parseInt(val, 10) : parseFloat(val)

		// Apply min/max constraints
		if (schema.minimum !== undefined && numValue < schema.minimum) {
			numValue = schema.minimum
		}
		if (schema.maximum !== undefined && numValue > schema.maximum) {
			numValue = schema.maximum
		}

		if (!isNaN(numValue)) {
			onChange(numValue)
		}
	}

	const numValue = typeof value === 'number' ? value : ''
	const inputClass = `${styles.inputNumber} ${hasError ? commonStyles.error : ''}`

	return (
		<div className={commonStyles.inputContainer}>
			<input
				className={inputClass}
				type='number'
				value={numValue}
				onChange={handleChange}
				onBlur={handleBlur}
				placeholder={schema.placeholder}
				disabled={schema.disabled}
				readOnly={schema.readOnly}
				min={schema.minimum}
				max={schema.maximum}
				step={schema.type === 'integer' ? 1 : 'any'}
			/>
			<ErrorMessage message={error} show={hasError} />
		</div>
	)
}
