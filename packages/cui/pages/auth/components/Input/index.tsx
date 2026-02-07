import React, { forwardRef, useState } from 'react'
import { Icon } from '@/widgets'
import styles from './index.less'

interface AuthInputProps {
	label?: string
	placeholder?: string
	value?: string
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
	onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
	prefix?: string
	suffix?: React.ReactNode
	type?: 'text' | 'email' | 'tel'
	autoComplete?: string
	id?: string
	className?: string
	disabled?: boolean
}

interface AuthPasswordInputProps extends Omit<AuthInputProps, 'type'> {
	type?: 'password'
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>((props, ref) => {
	const {
		label,
		placeholder,
		value,
		onChange,
		onBlur,
		onFocus,
		prefix,
		suffix,
		type = 'text',
		autoComplete,
		id,
		className,
		disabled,
		...rest
	} = props

	const [focused, setFocused] = useState(false)

	const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		setFocused(true)
		onFocus?.(e)
	}

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		setFocused(false)
		onBlur?.(e)
	}

	return (
		<div className={`${styles.inputWrap} ${focused ? styles.focused : ''} ${className || ''}`}>
			<div className={styles.inputContainer}>
				{prefix && (
					<div className={styles.inputPrefix}>
						<Icon name={prefix} />
					</div>
				)}
				<input
					ref={ref}
					id={id}
					type={type}
					value={value}
					onChange={onChange}
					onFocus={handleFocus}
					onBlur={handleBlur}
					placeholder={placeholder}
					autoComplete={autoComplete}
					disabled={disabled}
					className={styles.input}
					{...rest}
				/>
				{suffix && <div className={styles.inputSuffix}>{suffix}</div>}
			</div>
		</div>
	)
})

const AuthPasswordInput = forwardRef<HTMLInputElement, AuthPasswordInputProps>((props, ref) => {
	const [visible, setVisible] = useState(false)
	const [focused, setFocused] = useState(false)

	const {
		label,
		placeholder,
		value,
		onChange,
		onBlur,
		onFocus,
		prefix,
		autoComplete,
		id,
		className,
		disabled,
		...rest
	} = props

	const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		setFocused(true)
		onFocus?.(e)
	}

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		setFocused(false)
		onBlur?.(e)
	}

	const toggleVisible = () => {
		setVisible(!visible)
	}

	return (
		<div className={`${styles.inputWrap} ${focused ? styles.focused : ''} ${className || ''}`}>
			<div className={styles.inputContainer}>
				{prefix && (
					<div className={styles.inputPrefix}>
						<Icon name={prefix} />
					</div>
				)}
				<input
					ref={ref}
					id={id}
					type={visible ? 'text' : 'password'}
					value={value}
					onChange={onChange}
					onFocus={handleFocus}
					onBlur={handleBlur}
					placeholder={placeholder}
					autoComplete={autoComplete}
					disabled={disabled}
					className={styles.input}
					{...rest}
				/>
				<div className={styles.inputSuffix} onClick={toggleVisible}>
					<Icon name={visible ? 'visibility-outline' : 'visibility_off-outline'} />
				</div>
			</div>
		</div>
	)
})

// 给 AuthInput 添加 Password 属性
const AuthInputWithPassword = AuthInput as typeof AuthInput & {
	Password: typeof AuthPasswordInput
}

AuthInputWithPassword.Password = AuthPasswordInput

AuthInputWithPassword.displayName = 'AuthInput'
AuthPasswordInput.displayName = 'AuthInput.Password'

export default AuthInputWithPassword
