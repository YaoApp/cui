import React, { ReactNode } from 'react'
import localStyles from './index.less'
import Icon from '@/widgets/Icon'

export type ButtonType = 'primary' | 'danger' | 'default'
export type ButtonSize = 'small' | 'medium' | 'large'

export interface ButtonProps {
	children?: ReactNode
	type?: ButtonType
	size?: ButtonSize
	disabled?: boolean
	loading?: boolean
	loadingIcon?: string
	icon?: ReactNode
	className?: string
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
	style?: React.CSSProperties
}

const Button: React.FC<ButtonProps> = ({
	children,
	type = 'default',
	size = 'medium',
	disabled = false,
	loading = false,
	loadingIcon = 'material-refresh',
	icon,
	className = '',
	onClick,
	style
}) => {
	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (disabled || loading) {
			e.preventDefault()
			return
		}
		onClick?.(e)
	}

	const buttonClasses = [
		localStyles.button,
		localStyles[type],
		localStyles[size],
		disabled && localStyles.disabled,
		loading && localStyles.loading,
		className
	]
		.filter(Boolean)
		.join(' ')

	const renderIcon = () => {
		if (loading) {
			return (
				<Icon
					name={loadingIcon}
					size={size === 'small' ? 12 : size === 'large' ? 16 : 14}
					className={localStyles.loadingIcon}
				/>
			)
		}
		return icon
	}

	return (
		<button className={buttonClasses} onClick={handleClick} disabled={disabled || loading} style={style}>
			{renderIcon()}
			{children && <span className={localStyles.text}>{children}</span>}
		</button>
	)
}

export default Button
