import React from 'react'
import { InputComponentProps } from '../types'
import styles from './index.less'

export default function CheckboxGroup({ schema, value, onChange }: InputComponentProps) {
	const selectedValues = Array.isArray(value) ? value : []
	const options = schema.enum || []

	const handleChange = (optionValue: string, checked: boolean, event?: React.MouseEvent) => {
		if (schema.disabled || schema.readOnly) return

		let newValues: string[]
		if (checked) {
			newValues = [...selectedValues, optionValue]
		} else {
			newValues = selectedValues.filter((v) => v !== optionValue)
		}
		onChange(newValues)

		// 点击后移除焦点，避免保留focus边框样式
		if (event) {
			;(event.currentTarget as HTMLElement).blur()
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent, optionValue: string) => {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault()
			const isChecked = selectedValues.includes(optionValue)
			handleChange(optionValue, !isChecked)
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
		const isChecked = selectedValues.includes(optionValue)
		const disabled = schema.disabled || schema.readOnly

		return (
			<div
				key={key}
				className={`${styles.option} ${isChecked ? styles.checked : ''} ${
					disabled ? styles.disabled : ''
				}`}
				onClick={(e) => handleChange(optionValue, !isChecked, e)}
				onKeyDown={(e) => handleKeyDown(e, optionValue)}
				tabIndex={disabled ? -1 : 0}
				role='checkbox'
				aria-checked={isChecked}
				aria-disabled={disabled}
				title={optionDescription || optionLabel}
			>
				<div className={styles.checkbox}>
					<div className={`${styles.checkboxInner} ${isChecked ? styles.checked : ''}`}>
						{isChecked && (
							<svg className={styles.checkIcon} viewBox='0 0 16 16' fill='currentColor'>
								<path d='M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z' />
							</svg>
						)}
					</div>
				</div>
				<div className={styles.optionContent}>
					<div className={styles.optionLabel}>{optionLabel}</div>
					{optionDescription && <div className={styles.optionDescription}>{optionDescription}</div>}
				</div>
				<input
					type='checkbox'
					checked={isChecked}
					onChange={() => {}} // Handled by div click
					disabled={disabled}
					tabIndex={-1}
				/>
			</div>
		)
	}

	return <div className={styles.checkboxGroup}>{options.map(renderOption)}</div>
}
