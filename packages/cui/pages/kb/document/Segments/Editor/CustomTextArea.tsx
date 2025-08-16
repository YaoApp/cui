import React, { useState, useRef, useEffect } from 'react'
import styles from './CustomTextArea.less'

interface CustomTextAreaProps {
	value: string
	onChange?: (value: string) => void
	placeholder?: string
	readOnly?: boolean
	maxLength?: number
	className?: string
}

const CustomTextArea: React.FC<CustomTextAreaProps> = ({
	value,
	onChange,
	placeholder,
	readOnly = false,
	maxLength,
	className = ''
}) => {
	const [isFocused, setIsFocused] = useState(false)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		if (!readOnly && onChange) {
			onChange(e.target.value)
		}
	}

	const handleFocus = () => {
		setIsFocused(true)
	}

	const handleBlur = () => {
		setIsFocused(false)
	}

	// 自动调整高度以填满容器
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = '100%'
		}
	}, [])

	return (
		<textarea
			ref={textareaRef}
			value={value}
			onChange={handleChange}
			onFocus={handleFocus}
			onBlur={handleBlur}
			placeholder={placeholder}
			readOnly={readOnly}
			maxLength={maxLength}
			className={`${styles.customTextArea} ${isFocused ? styles.focused : ''} ${
				readOnly ? styles.readOnly : ''
			} ${className}`}
		/>
	)
}

export default CustomTextArea
