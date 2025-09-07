import React, { useRef } from 'react'
import { InputComponentProps } from '../types'
import ErrorMessage from '../ErrorMessage'
import styles from './index.less'
import commonStyles from '../common.less'

export default function Avatar({ schema, value, onChange, error, hasError }: InputComponentProps) {
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			// Create preview URL
			const reader = new FileReader()
			reader.onload = (event) => {
				const result = event.target?.result as string
				onChange?.(result)
			}
			reader.readAsDataURL(file)
		}
	}

	const handleClick = () => {
		if (!schema.disabled && !schema.readOnly) {
			fileInputRef.current?.click()
		}
	}

	const handleRemove = (e: React.MouseEvent) => {
		e.stopPropagation()
		onChange?.('')
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	// 支持大头像模式（用于Profile页面）
	const isLargeMode = schema.variant === 'large'
	const avatarClass = `${styles.avatar} ${isLargeMode ? styles.large : ''} ${hasError ? commonStyles.error : ''} ${
		schema.disabled ? styles.disabled : ''
	} ${schema.readOnly ? styles.readOnly : ''}`

	// 获取用户名首字母作为占位符
	const getInitials = () => {
		if (schema.userName) {
			return schema.userName.charAt(0).toUpperCase()
		}
		return 'U'
	}

	return (
		<div className={commonStyles.inputContainer}>
			<div className={avatarClass}>
				<input
					ref={fileInputRef}
					type='file'
					accept='image/*'
					onChange={handleFileChange}
					style={{ display: 'none' }}
					disabled={schema.disabled}
				/>

				<div className={styles.avatarDisplay} onClick={handleClick}>
					{value ? (
						<img src={String(value)} alt='Avatar' className={styles.avatarImage} />
					) : (
						<div className={styles.avatarPlaceholder}>
							{isLargeMode ? (
								<span className={styles.avatarInitials}>{getInitials()}</span>
							) : (
								<svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
									<path
										d='M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2'
										stroke='currentColor'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'
									/>
									<circle
										cx='12'
										cy='7'
										r='4'
										stroke='currentColor'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'
									/>
								</svg>
							)}
						</div>
					)}
				</div>

				{!schema.disabled && !schema.readOnly && !isLargeMode && (
					<div className={styles.avatarHint}>{value ? 'Click to change' : 'Click to upload'}</div>
				)}

				{/* 大头像模式下的上传按钮 */}
				{!schema.disabled && !schema.readOnly && isLargeMode && (
					<div className={styles.uploadButton} onClick={handleClick}>
						{schema.placeholder || (value ? 'Change Avatar' : 'Upload Avatar')}
					</div>
				)}
			</div>
			<ErrorMessage message={error} show={hasError} />
		</div>
	)
}
