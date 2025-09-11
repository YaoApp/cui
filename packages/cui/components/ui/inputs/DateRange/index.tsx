import React, { useState, useRef, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import styles from './index.less'

export interface DateRangeValue {
	start: string | null
	end: string | null
}

export interface DateRangeProps {
	value?: DateRangeValue
	onChange?: (value: DateRangeValue) => void
	placeholder?: string
	disabled?: boolean
	presets?: Array<{
		label: string
		value: DateRangeValue
	}>
	format?: string
	size?: 'small' | 'default' | 'large'
	className?: string
	placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight' | 'auto'
}

export default function DateRange({
	value = { start: null, end: null },
	onChange,
	placeholder,
	disabled = false,
	presets = [],
	size = 'default',
	className = '',
	placement = 'auto'
}: DateRangeProps) {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [isOpen, setIsOpen] = useState(false)
	const [isDropup, setIsDropup] = useState(false)
	const [alignRight, setAlignRight] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)

	// 默认占位符
	const defaultPlaceholder = placeholder || (is_cn ? '选择日期范围' : 'Select date range')

	// 默认预设选项
	const defaultPresets = [
		{
			label: 'Last 7 days',
			value: {
				start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
				end: new Date().toISOString().split('T')[0]
			}
		},
		{
			label: 'Last 30 days',
			value: {
				start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
				end: new Date().toISOString().split('T')[0]
			}
		}
	]

	const finalPresets = presets.length > 0 ? presets : defaultPresets

	// 计算下拉框位置
	const calculateDropdownPosition = () => {
		if (!containerRef.current) return { dropup: false, alignRight: false }

		const rect = containerRef.current.getBoundingClientRect()
		const viewportHeight = window.innerHeight
		const viewportWidth = window.innerWidth
		const dropdownHeight = 280
		const dropdownWidth = 320
		const spaceBelow = viewportHeight - rect.bottom
		const spaceAbove = rect.top
		const spaceRight = viewportWidth - rect.left
		const spaceLeft = rect.right

		let dropup = false
		let alignRight = false

		// 根据 placement 属性决定位置
		switch (placement) {
			case 'topLeft':
				dropup = true
				alignRight = false
				break
			case 'topRight':
				dropup = true
				alignRight = true
				break
			case 'bottomLeft':
				dropup = false
				alignRight = false
				break
			case 'bottomRight':
				dropup = false
				alignRight = true
				break
			case 'auto':
			default:
				// 自动计算最佳位置
				dropup = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
				alignRight = spaceRight < dropdownWidth && spaceLeft > spaceRight
				break
		}

		return { dropup, alignRight }
	}

	// 格式化日期显示
	const formatDate = (date: string) => {
		if (!date) return ''
		const d = new Date(date)
		if (is_cn) {
			return d.toLocaleDateString('zh-CN', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})
		}
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	}

	// 获取显示文本
	const getDisplayText = () => {
		if (!value.start && !value.end) return defaultPlaceholder
		if (value.start && value.end) {
			return `${formatDate(value.start)} - ${formatDate(value.end)}`
		}
		if (value.start) return `${formatDate(value.start)} - ${is_cn ? '...' : '...'}`
		return defaultPlaceholder
	}

	// 处理预设选择
	const handlePresetSelect = (preset: { label: string; value: DateRangeValue }) => {
		onChange?.(preset.value)
		setIsOpen(false)
	}

	// 处理自定义日期输入
	const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = { ...value, start: e.target.value }
		onChange?.(newValue)
	}

	const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = { ...value, end: e.target.value }
		onChange?.(newValue)
	}

	// 处理日期输入点击，尝试显示日历
	const handleDateInputInteraction = (
		e: React.FocusEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement>
	) => {
		const target = e.target as HTMLInputElement & {
			showPicker?: () => void
		}
		try {
			target.showPicker?.()
		} catch (error) {
			// 某些浏览器可能不支持showPicker方法，静默处理错误
			console.debug('showPicker not supported or failed:', error)
		}
	}

	// 处理点击外部关闭
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	// 处理打开下拉框
	const handleToggle = () => {
		if (disabled) return

		if (!isOpen) {
			const position = calculateDropdownPosition()
			setIsDropup(position.dropup)
			setAlignRight(position.alignRight)
		}
		setIsOpen(!isOpen)
	}

	return (
		<div
			ref={containerRef}
			className={`${styles.dateRange} ${styles[size]} ${isOpen ? styles.open : ''} ${
				disabled ? styles.disabled : ''
			} ${className}`}
		>
			{/* 触发器 */}
			<div className={styles.trigger} onClick={handleToggle}>
				<div className={styles.content}>
					<span className={value.start || value.end ? styles.value : styles.placeholder}>
						{getDisplayText()}
					</span>
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

			{/* 下拉面板 */}
			{isOpen && (
				<div
					ref={dropdownRef}
					className={`${styles.dropdown} ${isDropup ? styles.dropup : ''} ${
						alignRight ? styles.alignRight : ''
					}`}
				>
					{/* 预设选项 */}
					{finalPresets.length > 0 && (
						<div className={styles.presets}>
							<div className={styles.presetsLabel}>
								{is_cn ? '快速选择' : 'Quick Select'}
							</div>
							{finalPresets.map((preset, index) => (
								<div
									key={index}
									className={styles.presetItem}
									onClick={() => handlePresetSelect(preset)}
								>
									{preset.label}
								</div>
							))}
						</div>
					)}

					{/* 自定义日期选择 */}
					<div className={styles.customRange}>
						<div className={styles.customLabel}>{is_cn ? '自定义范围' : 'Custom Range'}</div>
						<div className={styles.dateInputs}>
							<div className={styles.dateField}>
								<label>{is_cn ? '开始日期' : 'Start Date'}</label>
								<input
									type='date'
									value={value.start || ''}
									onChange={handleStartDateChange}
									className={styles.dateInput}
									onFocus={handleDateInputInteraction}
									onClick={handleDateInputInteraction}
								/>
							</div>
							<div className={styles.dateField}>
								<label>{is_cn ? '结束日期' : 'End Date'}</label>
								<input
									type='date'
									value={value.end || ''}
									onChange={handleEndDateChange}
									className={styles.dateInput}
									min={value.start || undefined}
									onFocus={handleDateInputInteraction}
									onClick={handleDateInputInteraction}
								/>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
