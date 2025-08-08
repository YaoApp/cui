import React, { useState, useRef, useEffect } from 'react'
import { EnumOption, OptionGroup, PropertySchema, PropertyValue, InputComponentProps } from '../../types'
import styles from './index.less'

interface GroupedOption {
	label: string
	value: string
	description?: string
}

export default function Select({ value, onChange, schema }: InputComponentProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [highlightedIndex, setHighlightedIndex] = useState(-1)
	const selectRef = useRef<HTMLDivElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)

	// 从 schema.enum 获取选项数据
	const options = schema.enum || []

	// 处理选项数据，支持分组和非分组
	const processedOptions: (GroupedOption | OptionGroup)[] = options.map((option) => {
		// 检查是否是分组选项
		if ('groupLabel' in option && 'options' in option) {
			return option as OptionGroup
		}
		// 普通选项
		return option as GroupedOption
	})

	// 获取所有可选择的选项（扁平化）
	const flatOptions: GroupedOption[] = []
	processedOptions.forEach((item) => {
		if ('groupLabel' in item) {
			flatOptions.push(...item.options)
		} else {
			flatOptions.push(item)
		}
	})

	// 找到当前选中的选项
	const selectedOption = flatOptions.find((opt) => opt.value === value) || null

	// 获取默认选项
	const getDefaultOption = (): GroupedOption | null => {
		// 从 schema.default 获取默认值
		if (schema.default !== undefined) {
			const defaultOpt = flatOptions.find((opt) => opt.value === schema.default)
			if (defaultOpt) return defaultOpt
		}
		// 如果没有找到，返回第一个选项
		return flatOptions.length > 0 ? flatOptions[0] : null
	}

	// 处理选项选择
	const handleSelect = (option: GroupedOption) => {
		onChange(option.value)
		setIsOpen(false)
		setHighlightedIndex(-1)
	}

	// 处理键盘事件
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
				e.preventDefault()
				setIsOpen(true)
				setHighlightedIndex(0)
			}
			return
		}

		switch (e.key) {
			case 'Escape':
				setIsOpen(false)
				setHighlightedIndex(-1)
				break
			case 'ArrowDown':
				e.preventDefault()
				setHighlightedIndex((prev) => (prev < flatOptions.length - 1 ? prev + 1 : 0))
				break
			case 'ArrowUp':
				e.preventDefault()
				setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : flatOptions.length - 1))
				break
			case 'Enter':
				e.preventDefault()
				if (highlightedIndex >= 0 && flatOptions[highlightedIndex]) {
					handleSelect(flatOptions[highlightedIndex])
				}
				break
		}
	}

	// 处理点击外部关闭
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
				setIsOpen(false)
				setHighlightedIndex(-1)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	// 如果没有选中值且有默认选项，设置默认值
	useEffect(() => {
		if (!selectedOption && flatOptions.length > 0) {
			const defaultOpt = getDefaultOption()
			if (defaultOpt) {
				onChange(defaultOpt.value)
			}
		}
	}, [flatOptions.length])

	return (
		<div
			ref={selectRef}
			className={`${styles.select} ${isOpen ? styles.open : ''}`}
			onKeyDown={handleKeyDown}
			tabIndex={0}
		>
			{/* 选择框主体 */}
			<div className={styles.selectTrigger} onClick={() => setIsOpen(!isOpen)}>
				<div className={styles.selectedContent}>
					{selectedOption ? (
						<>
							<span className={styles.selectedLabel}>{selectedOption.label}</span>
							{selectedOption.description && (
								<span className={styles.selectedDescription}>
									{selectedOption.description}
								</span>
							)}
						</>
					) : (
						<span className={styles.placeholder}>Select an option...</span>
					)}
				</div>
				<div className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}>
					<svg width='12' height='8' viewBox='0 0 12 8' fill='none'>
						<path
							d='M1 1.5L6 6.5L11 1.5'
							stroke='currentColor'
							strokeWidth='1.5'
							strokeLinecap='round'
							strokeLinejoin='round'
						/>
					</svg>
				</div>
			</div>

			{/* 下拉选项 */}
			{isOpen && (
				<div ref={dropdownRef} className={styles.dropdown}>
					{processedOptions.map((item, index) => {
						if ('groupLabel' in item) {
							// 渲染分组
							return (
								<div key={`group-${index}`} className={styles.optionGroup}>
									<div className={styles.groupLabel}>{item.groupLabel}</div>
									{item.options.map((option, optIndex) => {
										const flatIndex = flatOptions.findIndex(
											(opt) => opt.value === option.value
										)
										const isHighlighted = flatIndex === highlightedIndex
										const isSelected = option.value === value

										return (
											<div
												key={option.value}
												className={`${styles.option} ${
													isHighlighted ? styles.highlighted : ''
												} ${isSelected ? styles.selected : ''}`}
												onClick={() => handleSelect(option)}
												onMouseEnter={() =>
													setHighlightedIndex(flatIndex)
												}
											>
												<div className={styles.optionContent}>
													<span className={styles.optionLabel}>
														{option.label}
													</span>
													{option.description && (
														<span
															className={
																styles.optionDescription
															}
														>
															{option.description}
														</span>
													)}
												</div>
											</div>
										)
									})}
								</div>
							)
						} else {
							// 渲染普通选项
							const flatIndex = flatOptions.findIndex((opt) => opt.value === item.value)
							const isHighlighted = flatIndex === highlightedIndex
							const isSelected = item.value === value

							return (
								<div
									key={item.value}
									className={`${styles.option} ${
										isHighlighted ? styles.highlighted : ''
									} ${isSelected ? styles.selected : ''}`}
									onClick={() => handleSelect(item)}
									onMouseEnter={() => setHighlightedIndex(flatIndex)}
								>
									<div className={styles.optionContent}>
										<span className={styles.optionLabel}>{item.label}</span>
										{item.description && (
											<span className={styles.optionDescription}>
												{item.description}
											</span>
										)}
									</div>
								</div>
							)
						}
					})}
				</div>
			)}
		</div>
	)
}
