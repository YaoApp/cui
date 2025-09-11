import React, { useState, useRef, useEffect } from 'react'
import { EnumOption, OptionGroup, PropertySchema, PropertyValue, InputComponentProps } from '../types'
import styles from './index.less'

interface GroupedOption {
	label: string
	value: string
	description?: string
}

export default function Select({ value, onChange, schema, size = 'medium' }: InputComponentProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [highlightedIndex, setHighlightedIndex] = useState(-1)
	const [isDropup, setIsDropup] = useState(false)
	const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
	const [searchTerm, setSearchTerm] = useState('')
	const selectRef = useRef<HTMLDivElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const searchInputRef = useRef<HTMLInputElement>(null)

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

	// 搜索过滤选项
	const filteredFlatOptions =
		schema.searchable && searchTerm
			? flatOptions.filter(
					(option) =>
						option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
						option.value.toLowerCase().includes(searchTerm.toLowerCase())
			  )
			: flatOptions

	// 重新构建过滤后的分组选项
	const filteredProcessedOptions =
		schema.searchable && searchTerm
			? (processedOptions
					.map((item) => {
						if ('groupLabel' in item) {
							const filteredGroupOptions = item.options.filter(
								(option) =>
									option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
									option.value.toLowerCase().includes(searchTerm.toLowerCase())
							)
							return filteredGroupOptions.length > 0
								? { ...item, options: filteredGroupOptions }
								: null
						} else {
							return item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
								item.value.toLowerCase().includes(searchTerm.toLowerCase())
								? item
								: null
						}
					})
					.filter(Boolean) as (GroupedOption | OptionGroup)[])
			: processedOptions

	// 找到当前选中的选项
	const selectedOption = flatOptions.find((opt) => opt.value === value) || null

	// 找到最近的滚动容器
	const findScrollContainer = (element: HTMLElement): HTMLElement => {
		let parent = element.parentElement
		while (parent) {
			const style = window.getComputedStyle(parent)
			if (
				style.overflow === 'auto' ||
				style.overflow === 'scroll' ||
				style.overflowY === 'auto' ||
				style.overflowY === 'scroll'
			) {
				return parent
			}
			parent = parent.parentElement
		}
		return document.documentElement
	}

	// 检测下拉框应该向上还是向下弹出，并计算位置
	const calculateDropdownPosition = () => {
		if (!selectRef.current) return { shouldDropup: false, position: { top: 0, left: 0, width: 0 } }

		const selectRect = selectRef.current.getBoundingClientRect()
		const scrollContainer = findScrollContainer(selectRef.current)
		const containerRect = scrollContainer.getBoundingClientRect()

		const dropdownHeight = 240 // 与 CSS 中的 max-height 保持一致
		const buffer = 20 // 添加一些缓冲区

		// 计算相对于滚动容器的可用空间
		const spaceBelow = containerRect.bottom - selectRect.bottom - buffer
		const spaceAbove = selectRect.top - containerRect.top - buffer

		// 确定是否向上弹出
		const shouldDropup = spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight

		// 计算下拉框的位置
		const position = {
			left: selectRect.left,
			width: selectRect.width,
			top: shouldDropup
				? selectRect.top - 4 // 向上弹出时，在选择框上方
				: selectRect.bottom + 4 // 向下弹出时，在选择框下方
		}

		return { shouldDropup, position }
	}

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
		onChange?.(option.value)
		setIsOpen(false)
		setHighlightedIndex(-1)
		setIsDropup(false)
		setSearchTerm('')
	}

	// 打开下拉框
	const openDropdown = () => {
		// 在显示下拉框之前先计算位置，避免布局闪烁
		const { shouldDropup, position } = calculateDropdownPosition()
		setIsDropup(shouldDropup)
		setDropdownPosition(position)
		setIsOpen(true)
	}

	// 处理键盘事件
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
				e.preventDefault()
				openDropdown()
				setHighlightedIndex(0)
			}
			return
		}

		switch (e.key) {
			case 'Escape':
				setIsOpen(false)
				setHighlightedIndex(-1)
				setIsDropup(false)
				break
			case 'ArrowDown':
				e.preventDefault()
				setHighlightedIndex((prev) => (prev < filteredFlatOptions.length - 1 ? prev + 1 : 0))
				break
			case 'ArrowUp':
				e.preventDefault()
				setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredFlatOptions.length - 1))
				break
			case 'Enter':
				e.preventDefault()
				if (highlightedIndex >= 0 && filteredFlatOptions[highlightedIndex]) {
					handleSelect(filteredFlatOptions[highlightedIndex])
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
				setIsDropup(false)
				setSearchTerm('')
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	// 聚焦搜索输入框
	useEffect(() => {
		if (isOpen && schema.searchable && searchInputRef.current) {
			setTimeout(() => {
				searchInputRef.current?.focus()
			}, 100)
		}
	}, [isOpen, schema.searchable])

	// 监听窗口大小变化和滚动，重新检测位置
	useEffect(() => {
		if (!isOpen) return

		const handleReposition = () => {
			const { shouldDropup, position } = calculateDropdownPosition()
			setIsDropup(shouldDropup)
			setDropdownPosition(position)
		}

		window.addEventListener('resize', handleReposition)
		window.addEventListener('scroll', handleReposition, true)

		return () => {
			window.removeEventListener('resize', handleReposition)
			window.removeEventListener('scroll', handleReposition, true)
		}
	}, [isOpen])

	// 如果没有选中值且有默认选项，设置默认值
	useEffect(() => {
		if (!selectedOption && flatOptions.length > 0) {
			const defaultOpt = getDefaultOption()
			if (defaultOpt) {
				onChange?.(defaultOpt.value)
			}
		}
	}, [flatOptions.length, onChange])

	return (
		<div
			ref={selectRef}
			className={`${styles.select} ${styles[size]} ${isOpen ? styles.open : ''}`}
			onKeyDown={handleKeyDown}
			tabIndex={0}
		>
			{/* 选择框主体 */}
			<div className={styles.selectTrigger} onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}>
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
				<div
					ref={dropdownRef}
					className={`${styles.dropdown} ${isDropup ? styles.dropup : ''}`}
					style={{
						top: isDropup ? dropdownPosition.top - 240 : dropdownPosition.top, // 向上时减去下拉框高度
						left: dropdownPosition.left,
						width: dropdownPosition.width
					}}
				>
					{/* 搜索输入框 */}
					{schema.searchable && (
						<div className={styles.searchContainer}>
							<input
								ref={searchInputRef}
								type='text'
								className={styles.searchInput}
								placeholder='搜索...'
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value)
									setHighlightedIndex(0)
								}}
								onKeyDown={(e) => {
									if (
										e.key === 'ArrowDown' ||
										e.key === 'ArrowUp' ||
										e.key === 'Enter'
									) {
										e.preventDefault()
										handleKeyDown(e)
									}
								}}
								onClick={(e) => e.stopPropagation()}
							/>
						</div>
					)}

					{filteredProcessedOptions.map((item, index) => {
						if ('groupLabel' in item) {
							// 渲染分组
							return (
								<div key={`group-${index}`} className={styles.optionGroup}>
									<div className={styles.groupLabel}>{item.groupLabel}</div>
									{item.options.map((option, optIndex) => {
										const flatIndex = filteredFlatOptions.findIndex(
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
							const flatIndex = filteredFlatOptions.findIndex(
								(opt) => opt.value === item.value
							)
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
