import React from 'react'
import { InputComponentProps } from '../types'
import styles from './index.less'

export default function Switch({ schema, value, onChange }: InputComponentProps) {
	const checked = Boolean(value)
	const disabled = schema.disabled || schema.readOnly

	const handleChange = () => {
		if (disabled) return
		onChange(!checked)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault()
			handleChange()
		}
	}

	return (
		<div
			className={`${styles.switch} ${checked ? styles.checked : ''}`}
			onClick={handleChange}
			onKeyDown={handleKeyDown}
			tabIndex={disabled ? -1 : 0}
			role='switch'
			aria-checked={checked}
			aria-disabled={disabled}
			aria-label={schema.title || schema.description}
			title={schema.title || schema.description}
		>
			<div className={styles.switchThumb} />
			<input
				type='checkbox'
				checked={checked}
				onChange={() => {}} // Handled by div click
				disabled={disabled}
				tabIndex={-1}
			/>
		</div>
	)
}
