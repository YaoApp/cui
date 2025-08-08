import React from 'react'
import { InputComponentProps } from '../../types'
import styles from './index.less'

export default function Input({ schema, value, onChange }: InputComponentProps) {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value)
	}

	return (
		<input
			className={styles.input}
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
	)
}
