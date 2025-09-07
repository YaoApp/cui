import React from 'react'
import { InputComponentProps } from '../../types'
import styles from './index.less'

export default function RadioGroup({ schema, value, onChange }: InputComponentProps) {
	const selectedValue = value as string
	const options = schema.enum || []

	const handleChange = (optionValue: string, event?: React.MouseEvent) => {
		if (schema.disabled || schema.readOnly) return
		onChange(optionValue)

		// 点击后移除焦点，避免保留focus边框样式
		if (event) {
			;(event.currentTarget as HTMLElement).blur()
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent, optionValue: string) => {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault()
			handleChange(optionValue)
		}
	}

	const renderOption = (option: any, index: number) => {
		// 处理分组选项
		if ('groupLabel' in option) {
			return (
				<div key={`group-${index}`} className={styles.optionGroup}>
					<div className={styles.groupLabel}>{option.groupLabel}</div>
					{option.options?.map((subOption: any, subIndex: number) =>
						renderSingleOption(subOption, `${index}-${subIndex}`)
					)}
				</div>
			)
		}

		return renderSingleOption(option, index.toString())
	}

	const renderSingleOption = (option: any, key: string) => {
		const optionValue = typeof option === 'string' ? option : option.value
		const optionLabel = typeof option === 'string' ? option : option.label
		const optionDescription = typeof option === 'object' ? option.description : undefined
		const isSelected = selectedValue === optionValue
		const disabled = schema.disabled || schema.readOnly

		return (
			<div
				key={key}
				className={`${styles.option} ${isSelected ? styles.selected : ''} ${
					disabled ? styles.disabled : ''
				}`}
				onClick={(e) => handleChange(optionValue, e)}
				onKeyDown={(e) => handleKeyDown(e, optionValue)}
				tabIndex={disabled ? -1 : 0}
				role='radio'
				aria-checked={isSelected}
				aria-disabled={disabled}
				title={optionDescription || optionLabel}
			>
				<div className={styles.radio}>
					<div className={`${styles.radioInner} ${isSelected ? styles.selected : ''}`}>
						{isSelected && <div className={styles.radioDot} />}
					</div>
				</div>
				<div className={styles.optionContent}>
					<div className={styles.optionLabel}>{optionLabel}</div>
					{optionDescription && <div className={styles.optionDescription}>{optionDescription}</div>}
				</div>
				<input
					type='radio'
					name={`radio-group-${schema.title || 'default'}`}
					value={optionValue}
					checked={isSelected}
					onChange={() => {}} // Handled by div click
					disabled={disabled}
					tabIndex={-1}
				/>
			</div>
		)
	}

	return (
		<div className={styles.radioGroup} role='radiogroup' aria-label={schema.title || schema.description}>
			{options.map(renderOption)}
		</div>
	)
}
