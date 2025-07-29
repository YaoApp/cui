import { Button as AntButton, ButtonProps } from 'antd'
import clsx from 'clsx'
import { forwardRef } from 'react'
import styles from './index.less'

interface AuthButtonProps extends ButtonProps {
	variant?: 'primary' | 'social'
	fullWidth?: boolean
}

const AuthButton = forwardRef<any, AuthButtonProps>(
	({ variant = 'primary', fullWidth = false, className, children, ...props }, ref) => {
		return (
			<AntButton
				ref={ref}
				className={clsx([
					styles.baseButton,
					styles[`variant_${variant}`],
					fullWidth && styles.fullWidth,
					className
				])}
				size='large'
				{...props}
			>
				{children}
			</AntButton>
		)
	}
)

AuthButton.displayName = 'AuthButton'

export default AuthButton
