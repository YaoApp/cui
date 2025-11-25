import React from 'react'
import clsx from 'clsx'
import Tooltip from './Tooltip'
import styles from './ToolButton.less'

interface IToolButtonProps {
	tooltip?: string
	onClick?: () => void
	disabled?: boolean
	active?: boolean
	className?: string
	children: React.ReactNode // 支持传入任何图标组件
}

const ToolButton: React.FC<IToolButtonProps> = ({
	tooltip,
	onClick,
	disabled = false,
	active = false,
	className,
	children
}) => {
	const button = (
		<button
			className={clsx(styles.toolButton, className, {
				[styles.disabled]: disabled,
				[styles.active]: active
			})}
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</button>
	)

	if (tooltip) {
		return <Tooltip content={tooltip}>{button}</Tooltip>
	}

	return button
}

export default ToolButton

