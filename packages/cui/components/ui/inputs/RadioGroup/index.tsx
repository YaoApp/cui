import React from 'react'
import { InputComponentProps } from '../types'
import styles from './index.less'

export default function RadioGroup({ schema, value, onChange }: InputComponentProps) {
	const selectedValue = value as string
	const options = schema.enum || []

	const handleOptionClick = (optionValue: string) => {
		if (schema.disabled || schema.readOnly) return

		// 如果点击的是已选中的选项且允许清空，则清空选择
		if (schema.allowClear && selectedValue === optionValue) {
			onChange?.('')
		} else {
			onChange?.(optionValue)
		}
	}

	const renderOption = (option: any, index: number) => {
		const optionValue = typeof option === 'string' ? option : option.value
		const optionLabel = typeof option === 'string' ? option : option.label
		const isSelected = selectedValue === optionValue
		const disabled = schema.disabled || schema.readOnly

		return (
			<div
				key={index}
				className={`${styles.radioOption} ${isSelected ? styles.selected : ''} ${
					disabled ? styles.disabled : ''
				}`}
				onClick={() => handleOptionClick(optionValue)}
			>
				<div className={styles.radioCircle}>{isSelected && <div className={styles.radioDot} />}</div>
				<span className={styles.radioLabel}>{optionLabel}</span>
			</div>
		)
	}

	return <div className={styles.radioGroup}>{options.map(renderOption)}</div>
}
