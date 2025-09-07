import React, { useEffect, useState, useRef } from 'react'
import { KB } from '@/openapi'
import { getLocale } from '@umijs/max'
import { Provider, ProviderSchemaSummary } from '../types'
import styles from './index.less'

// Utility function to group providers by category (reused from main component)
interface GroupedProvider {
	id: string
	title: string
	description: string
	group?: string
	providerId?: string // Original provider ID
	optionValue?: string // Option value if this represents an option
	properties?: any // Option properties
	options?: Array<{ label: string; value: string; description: string }>
}

interface ProviderGroup {
	groupLabel: string
	providers: GroupedProvider[]
}

function groupProviders(
	summaries: ProviderSchemaSummary[],
	providers: Provider[] = []
): ProviderGroup[] | GroupedProvider[] {
	// Create a map for quick provider lookup
	const providerMap = new Map<string, Provider>()
	providers.forEach((p) => providerMap.set(p.id, p))

	// Create groups based on provider configurations
	const groups = new Map<string, GroupedProvider[]>()

	summaries.forEach((summary) => {
		const provider = providerMap.get(summary.id)
		const groupName = summary.title || summary.id // Use summary title as group name

		if (provider?.options && Array.isArray(provider.options)) {
			// Each option becomes a separate provider choice
			const optionProviders: GroupedProvider[] = provider.options.map((opt: any) => ({
				id: `${summary.id}|${opt.value}`, // Unique ID combining provider ID and option value using | separator
				title: opt.label,
				description: opt.description,
				group: groupName,
				// Store the original provider ID and option value for later use
				providerId: summary.id,
				optionValue: opt.value,
				properties: opt.properties || {}
			}))

			groups.set(groupName, optionProviders)
		} else {
			// Fallback for providers without options
			const singleProvider: GroupedProvider = {
				id: summary.id,
				title: summary.title || summary.id,
				description: summary.description || '',
				group: groupName,
				providerId: summary.id
			}

			if (!groups.has(groupName)) {
				groups.set(groupName, [])
			}
			groups.get(groupName)!.push(singleProvider)
		}
	})

	// If only one group, return flat array
	if (groups.size <= 1) {
		const allProviders = Array.from(groups.values()).flat()
		return allProviders
	}

	// Return grouped array
	return Array.from(groups.entries()).map(([groupLabel, providers]) => ({
		groupLabel,
		providers
	}))
}

// Helper function to check if a value represents true
function isTrue(value: any): boolean {
	return value === true || value === 1 || value === '1' || value === 'true'
}

// Find the default selection based on provider and option defaults
function findDefaultSelection(grouped: ProviderGroup[] | GroupedProvider[], providers: Provider[]): string | null {
	const providerMap = new Map<string, Provider>()
	providers.forEach((p) => providerMap.set(p.id, p))

	// First, look for a provider with default=true
	const defaultProvider = providers.find((p) => isTrue(p.default))

	if (defaultProvider) {
		// If provider has default=true, check if it has options with defaults
		if (defaultProvider.options && Array.isArray(defaultProvider.options)) {
			const defaultOption = defaultProvider.options.find((opt: any) => isTrue(opt.default))
			if (defaultOption) {
				return `${defaultProvider.id}|${defaultOption.value}`
			}
			// If no default option, use first option
			if (defaultProvider.options.length > 0) {
				return `${defaultProvider.id}|${defaultProvider.options[0].value}`
			}
		}
		// If provider has no options, just return provider id
		return defaultProvider.id
	}

	// If no provider has default=true, look for any option with default=true
	for (const provider of providers) {
		if (provider.options && Array.isArray(provider.options)) {
			const defaultOption = provider.options.find((opt: any) => isTrue(opt.default))
			if (defaultOption) {
				return `${provider.id}|${defaultOption.value}`
			}
		}
	}

	// Fallback to first available option
	if ('groupLabel' in grouped[0]) {
		// Grouped format - select first option from first group
		const firstGroup = grouped[0] as ProviderGroup
		if (firstGroup.providers.length > 0) {
			return firstGroup.providers[0].id
		}
	} else {
		// Flat format - select first provider
		const flatProviders = grouped as GroupedProvider[]
		if (flatProviders.length > 0) {
			return flatProviders[0].id
		}
	}

	return null
}

export interface ProviderSelectProps {
	// Provider type (e.g., 'chunking')
	type?: string
	// Current selected value
	value?: string
	// Change callback
	onChange?: (value: string) => void
	// Placeholder text
	placeholder?: string
	// Optional className for outer container
	className?: string
	// Disabled state
	disabled?: boolean
}

const ProviderSelect: React.FC<ProviderSelectProps> = ({
	type = 'chunking',
	value,
	onChange,
	placeholder,
	className,
	disabled = false
}) => {
	const [summaries, setSummaries] = useState<ProviderSchemaSummary[]>([])
	const [providers, setProviders] = useState<Provider[]>([])
	const [groupedProviders, setGroupedProviders] = useState<ProviderGroup[] | GroupedProvider[]>([])
	const [isOpen, setIsOpen] = useState(false)
	const [highlightedIndex, setHighlightedIndex] = useState(-1)
	const [isDropup, setIsDropup] = useState(false)
	const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
	const [loading, setLoading] = useState(false)
	const selectRef = useRef<HTMLDivElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)

	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Fetch providers on mount or type change
	useEffect(() => {
		// Check if openapi is ready
		if (!window.$app?.openapi) {
			console.warn('window.$app.openapi is not ready yet')
			return
		}

		const kb = new KB(window.$app.openapi)
		let ignore = false
		setLoading(true)

		// Get providers using real API
		kb.GetProviders({ providerType: type, locale })
			.then((response) => {
				if (ignore || !response.data) return

				// Store full provider data
				setProviders(response.data)

				// Convert providers to summaries format
				const list = response.data.map((provider) => ({
					id: provider.id,
					title: provider.label,
					description: provider.description
				}))

				setSummaries(list)

				// Create grouped providers
				const grouped = groupProviders(list, response.data)
				setGroupedProviders(grouped)

				// Set default selection if no value is provided
				if (!value && grouped.length > 0) {
					const defaultSelection = findDefaultSelection(grouped, response.data)
					if (defaultSelection && onChange) {
						onChange(defaultSelection)
					}
				}
			})
			.catch((error) => {
				if (!ignore) {
					console.error('Failed to fetch providers:', error)
				}
			})
			.finally(() => !ignore && setLoading(false))

		return () => {
			ignore = true
		}
	}, [type, locale])

	// Get flat options for easier access
	const flatOptions: GroupedProvider[] = React.useMemo(() => {
		const options: GroupedProvider[] = []
		if (Array.isArray(groupedProviders)) {
			groupedProviders.forEach((item) => {
				if ('groupLabel' in item) {
					options.push(...item.providers)
				} else {
					options.push(item)
				}
			})
		}
		return options
	}, [groupedProviders])

	// Find selected option
	const selectedOption = flatOptions.find((opt) => opt.id === value) || null

	// Find the nearest scroll container
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

	// Calculate dropdown position
	const calculateDropdownPosition = () => {
		if (!selectRef.current) return { shouldDropup: false, position: { top: 0, left: 0, width: 0 } }

		const selectRect = selectRef.current.getBoundingClientRect()
		const scrollContainer = findScrollContainer(selectRef.current)
		const containerRect = scrollContainer.getBoundingClientRect()

		const dropdownHeight = 240 // Match CSS max-height
		const buffer = 20

		// Calculate available space relative to scroll container
		const spaceBelow = containerRect.bottom - selectRect.bottom - buffer
		const spaceAbove = selectRect.top - containerRect.top - buffer

		// Determine if should drop up
		const shouldDropup = spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight

		// Calculate dropdown position
		const position = {
			left: selectRect.left,
			width: selectRect.width,
			top: shouldDropup
				? selectRect.top - 4 // Drop up: above select box
				: selectRect.bottom + 4 // Drop down: below select box
		}

		return { shouldDropup, position }
	}

	// Handle option selection
	const handleSelect = (option: GroupedProvider) => {
		onChange?.(option.id)
		setIsOpen(false)
		setHighlightedIndex(-1)
		setIsDropup(false)
	}

	// Open dropdown
	const openDropdown = () => {
		if (disabled || loading) return

		// Calculate position before showing dropdown to avoid layout flash
		const { shouldDropup, position } = calculateDropdownPosition()
		setIsDropup(shouldDropup)
		setDropdownPosition(position)
		setIsOpen(true)
	}

	// Handle keyboard events
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (disabled) return

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

	// Handle click outside to close
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
				setIsOpen(false)
				setHighlightedIndex(-1)
				setIsDropup(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	// Listen for window resize and scroll to reposition dropdown
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

	const displayPlaceholder = placeholder || (is_cn ? '请选择提供商' : 'Select a provider')

	return (
		<div
			ref={selectRef}
			className={`${styles.select} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''} ${
				className || ''
			}`}
			onKeyDown={handleKeyDown}
			tabIndex={disabled ? -1 : 0}
		>
			{/* Select trigger */}
			<div className={styles.selectTrigger} onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}>
				<div className={styles.selectedContent}>
					{loading ? (
						<span className={styles.placeholder}>{is_cn ? '加载中...' : 'Loading...'}</span>
					) : selectedOption ? (
						<>
							<span className={styles.selectedLabel}>{selectedOption.title}</span>
							{selectedOption.description && (
								<span className={styles.selectedDescription}>
									{selectedOption.description}
								</span>
							)}
						</>
					) : (
						<span className={styles.placeholder}>{displayPlaceholder}</span>
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

			{/* Dropdown options */}
			{isOpen && !loading && (
				<div
					ref={dropdownRef}
					className={`${styles.dropdown} ${isDropup ? styles.dropup : ''}`}
					style={{
						top: isDropup ? dropdownPosition.top - 240 : dropdownPosition.top, // Subtract dropdown height when dropping up
						left: dropdownPosition.left,
						width: dropdownPosition.width
					}}
				>
					{groupedProviders.length === 0 ? (
						<div className={styles.emptyState}>
							{is_cn ? '暂无可用提供商' : 'No providers available'}
						</div>
					) : (
						groupedProviders.map((item, index) => {
							if ('groupLabel' in item) {
								// Render group
								return (
									<div key={`group-${index}`} className={styles.optionGroup}>
										<div className={styles.groupLabel}>{item.groupLabel}</div>
										{item.providers.map((option) => {
											const flatIndex = flatOptions.findIndex(
												(opt) => opt.id === option.id
											)
											const isHighlighted = flatIndex === highlightedIndex
											const isSelected = option.id === value

											return (
												<div
													key={option.id}
													className={`${styles.option} ${
														isHighlighted
															? styles.highlighted
															: ''
													} ${isSelected ? styles.selected : ''}`}
													onClick={() => handleSelect(option)}
													onMouseEnter={() =>
														setHighlightedIndex(flatIndex)
													}
												>
													<div className={styles.optionContent}>
														<span
															className={styles.optionLabel}
														>
															{option.title}
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
								// Render flat option
								const flatIndex = flatOptions.findIndex((opt) => opt.id === item.id)
								const isHighlighted = flatIndex === highlightedIndex
								const isSelected = item.id === value

								return (
									<div
										key={item.id}
										className={`${styles.option} ${
											isHighlighted ? styles.highlighted : ''
										} ${isSelected ? styles.selected : ''}`}
										onClick={() => handleSelect(item)}
										onMouseEnter={() => setHighlightedIndex(flatIndex)}
									>
										<div className={styles.optionContent}>
											<span className={styles.optionLabel}>
												{item.title}
											</span>
											{item.description && (
												<span className={styles.optionDescription}>
													{item.description}
												</span>
											)}
										</div>
									</div>
								)
							}
						})
					)}
				</div>
			)}
		</div>
	)
}

export default ProviderSelect
