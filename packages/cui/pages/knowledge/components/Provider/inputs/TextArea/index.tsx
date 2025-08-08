import React from 'react'
import { InputComponentProps } from '../../types'
import styles from './index.less'

export default function TextArea({ schema, value, onChange }: InputComponentProps) {
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.value)
	}

	return (
		<textarea
			className={styles.textArea}
			value={typeof value === 'string' ? value : ''}
			onChange={handleChange}
			placeholder={schema.placeholder}
			disabled={schema.disabled}
			readOnly={schema.readOnly}
			minLength={schema.minLength}
			maxLength={schema.maxLength}
			rows={6}
		/>
	)
}
