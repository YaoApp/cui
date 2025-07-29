import React, { useState, useRef, useEffect } from 'react'
import { Icon } from '@/widgets'
import styles from './index.less'

interface CountryCode {
	code: string
	name: string
	flag: string
	dialCode: string
}

interface CountryCodeSelectProps {
	value: string
	onChange: (value: string) => void
}

const COUNTRY_CODES: CountryCode[] = [
	{ code: 'CN', name: '中国', flag: '🇨🇳', dialCode: '+86' },
	{ code: 'US', name: '美国', flag: '🇺🇸', dialCode: '+1' },
	{ code: 'HK', name: '中国香港', flag: '🇭🇰', dialCode: '+852' },
	{ code: 'SG', name: '新加坡', flag: '🇸🇬', dialCode: '+65' },
	{ code: 'JP', name: '日本', flag: '🇯🇵', dialCode: '+81' },
	{ code: 'KR', name: '韩国', flag: '🇰🇷', dialCode: '+82' },
	{ code: 'GB', name: '英国', flag: '🇬🇧', dialCode: '+44' },
	{ code: 'AU', name: '澳大利亚', flag: '🇦🇺', dialCode: '+61' },
	{ code: 'CA', name: '加拿大', flag: '🇨🇦', dialCode: '+1' },
	{ code: 'DE', name: '德国', flag: '🇩🇪', dialCode: '+49' },
	{ code: 'FR', name: '法国', flag: '🇫🇷', dialCode: '+33' }
]

const CountryCodeSelect: React.FC<CountryCodeSelectProps> = ({ value, onChange }) => {
	const [isOpen, setIsOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const dropdownRef = useRef<HTMLDivElement>(null)

	const selectedCountry = COUNTRY_CODES.find((country) => country.dialCode === value) || COUNTRY_CODES[0]

	const filteredCountries = COUNTRY_CODES.filter(
		(country) =>
			country.name.toLowerCase().includes(searchTerm.toLowerCase()) || country.dialCode.includes(searchTerm)
	)

	// 点击外部关闭下拉框
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false)
				setSearchTerm('')
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const handleSelect = (country: CountryCode) => {
		onChange(country.dialCode)
		setIsOpen(false)
		setSearchTerm('')
	}

	return (
		<div className={styles.countryCodeSelect} ref={dropdownRef}>
			<button type='button' className={styles.trigger} onClick={() => setIsOpen(!isOpen)}>
				<span className={styles.flag}>{selectedCountry.flag}</span>
				<span className={styles.dialCode}>{selectedCountry.dialCode}</span>
				<Icon
					name={isOpen ? 'material-expand_less' : 'material-expand_more'}
					size={16}
					className={styles.chevron}
				/>
			</button>

			{isOpen && (
				<div className={styles.dropdown}>
					<div className={styles.searchBox}>
						<Icon name='material-search' size={14} className={styles.searchIcon} />
						<input
							type='text'
							placeholder='搜索国家或地区'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className={styles.searchInput}
						/>
					</div>

					<div className={styles.countryList}>
						{filteredCountries.map((country) => (
							<button
								key={country.code}
								type='button'
								className={`${styles.countryItem} ${
									country.dialCode === value ? styles.selected : ''
								}`}
								onClick={() => handleSelect(country)}
							>
								<span className={styles.flag}>{country.flag}</span>
								<span className={styles.countryName}>{country.name}</span>
								<span className={styles.dialCode}>{country.dialCode}</span>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

export default CountryCodeSelect
