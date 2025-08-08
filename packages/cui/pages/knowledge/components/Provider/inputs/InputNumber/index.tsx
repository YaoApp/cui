import React from 'react'
import { InputComponentProps } from '../../types'
import styles from './index.less'

export default function InputNumber({ schema, value, onChange }: InputComponentProps) {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value
		if (val === '') {
			onChange(undefined)
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

	return (
		<input
			className={styles.inputNumber}
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
	)
}
