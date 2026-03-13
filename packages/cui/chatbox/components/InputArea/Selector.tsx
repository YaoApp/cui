import React, { useState, useRef, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '../../../widgets/Icon'
import Tooltip from './Tooltip'
import styles from './Selector.less'

interface ISelectorOption {
	label: string
	value: string
	icon?: string
}

interface ISelectorProps {
	value: string
	options: ISelectorOption[]
	onChange: (value: string) => void
	variant?: 'tag' | 'normal'
	tooltip?: string
	disabled?: boolean
	placeholder?: string
	placeholderIcon?: string
	clearable?: boolean
	searchable?: boolean
	dropdownWidth?: number | 'auto'
	dropdownMaxWidth?: number
	dropdownMinWidth?: number
	dropdownAlign?: 'left' | 'right'
	hideLabel?: boolean
}

const Selector: React.FC<ISelectorProps> = ({
	value,
	options,
	onChange,
	variant = 'normal',
	tooltip,
	disabled,
	placeholder,
	placeholderIcon,
	clearable = false,
	searchable = false,
	dropdownWidth = 'auto',
	dropdownMaxWidth = 320,
	dropdownMinWidth = 180,
	dropdownAlign: propAlign,
	hideLabel = false
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	
	const [isOpen, setIsOpen] = useState(false)
	const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
	const [searchQuery, setSearchQuery] = useState('')
	const dropdownAlign = propAlign || 'left'
	const containerRef = useRef<HTMLDivElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const searchInputRef = useRef<HTMLInputElement>(null)

	const currentOption = options.find((opt) => opt.value === value)
	const isPlaceholder = !currentOption && !!placeholder
	const displayLabel = currentOption?.label || placeholder || value
	const displayIcon = currentOption?.icon || (isPlaceholder ? placeholderIcon : undefined)

	// Filter options based on search query
	const filteredOptions = searchQuery
		? options.filter((option) =>
				option.label.toLowerCase().includes(searchQuery.toLowerCase())
		  )
		: options

	// Calculate dropdown style
	const dropdownStyle: React.CSSProperties = {
		width: dropdownWidth === 'auto' ? 'max-content' : `${dropdownWidth}px`,
		maxWidth: `${dropdownMaxWidth}px`,
		minWidth: `${dropdownMinWidth}px`
	}

	// Close dropdown when clicking outside
	useEffect(() => {
		if (!isOpen) return

		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node) &&
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [isOpen])

	// Close dropdown when pressing Escape
	useEffect(() => {
		if (!isOpen) return

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setIsOpen(false)
			}
		}

		document.addEventListener('keydown', handleEscape)
		return () => document.removeEventListener('keydown', handleEscape)
	}, [isOpen])

	const handleToggle = () => {
		if (!disabled) {
			const willOpen = !isOpen
			setIsOpen(willOpen)
			
			// Reset search when opening
			if (willOpen) {
				setSearchQuery('')
				
				// Calculate vertical position when opening
				if (containerRef.current) {
					const rect = containerRef.current.getBoundingClientRect()
					const viewportHeight = window.innerHeight
					const spaceBelow = viewportHeight - rect.bottom
					const spaceAbove = rect.top
					const dropdownHeight = 280
					
					if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
						setDropdownPosition('top')
					} else {
						setDropdownPosition('bottom')
					}
				}
				
				// Auto-focus search input if searchable
				if (searchable) {
					setTimeout(() => searchInputRef.current?.focus(), 100)
				}
			}
		}
	}

	const handleSelect = (optionValue: string) => {
		if (!disabled) {
			if (clearable && optionValue === value) {
				onChange('')
			} else {
				onChange(optionValue)
			}
			setIsOpen(false)
		}
	}

	const selectorButton = (
		<button
			className={`${styles.selectorButton} ${styles[variant]} ${disabled ? styles.disabled : ''} ${
				isOpen ? styles.open : ''
			} ${hideLabel ? styles.iconOnly : ''} ${isPlaceholder ? styles.placeholder : ''}`}
			onClick={handleToggle}
			disabled={disabled}
		>
			{displayIcon && (
				<Icon name={displayIcon} size={13} className={styles.selectorIcon} />
			)}
			{!hideLabel && <span className={styles.selectorLabel}>{displayLabel}</span>}
			<Icon name='material-expand_more' size={14} className={styles.arrow} />
		</button>
	)

	return (
		<div className={`${styles.selectorContainer} ${isOpen ? styles.selectorOpen : ''}`} ref={containerRef}>
			{/* Selector Button with Tooltip */}
			{tooltip && !isOpen ? (
				<Tooltip content={tooltip} disabled={disabled}>{selectorButton}</Tooltip>
			) : (
				selectorButton
			)}

			{/* Dropdown Menu */}
			{isOpen && (
				<div 
					className={`${styles.dropdown} ${
						dropdownPosition === 'top' ? styles.dropdownTop : styles.dropdownBottom
					} ${dropdownAlign === 'right' ? styles.dropdownRight : styles.dropdownLeft}`} 
					ref={dropdownRef}
					style={dropdownStyle}
				>
					{/* Search Input */}
					{searchable && (
						<div className={styles.searchBox}>
							<Icon name='material-search' size={16} className={styles.searchIcon} />
							<input
								ref={searchInputRef}
								type='text'
								className={styles.searchInput}
								placeholder={is_cn ? '搜索模型...' : 'Search models...'}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onClick={(e) => e.stopPropagation()}
								onKeyDown={(e) => {
									if (e.key === 'Escape') {
										setSearchQuery('')
									}
								}}
							/>
							{searchQuery && (
								<Icon 
									name='material-close' 
									size={14} 
									className={styles.clearIcon}
									onClick={(e) => {
										e.stopPropagation()
										setSearchQuery('')
										searchInputRef.current?.focus()
									}}
								/>
							)}
						</div>
					)}
					
					{/* Options List */}
					<div className={styles.optionsList}>
						{filteredOptions.length > 0 ? (
							filteredOptions.map((option) => (
								<div
									key={option.value}
									className={`${styles.menuItem} ${
										option.value === value ? styles.selected : ''
									}`}
									onClick={() => handleSelect(option.value)}
								>
									{option.icon && (
										<Icon name={option.icon} size={14} className={styles.menuIcon} />
									)}
									<span className={styles.menuLabel}>{option.label}</span>
									{option.value === value && (
										<Icon
											name={clearable ? 'material-close' : 'material-check'}
											size={14}
											className={styles.checkIcon}
										/>
									)}
								</div>
							))
						) : (
							<div className={styles.emptyState}>
								{is_cn ? '未找到匹配项' : 'No matches found'}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

export default Selector

