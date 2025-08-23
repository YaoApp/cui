import React from 'react'
import Icon from '@/widgets/Icon'
import styles from './index.less'

export interface ActionButtonProps {
	/** 图标名称或React节点 */
	icon?: string | React.ReactNode
	/** 图标大小（仅当icon为string时有效） */
	iconSize?: number
	/** 按钮标题/提示文字 */
	title?: string
	/** 点击事件 */
	onClick?: () => void
	/** 是否禁用 */
	disabled?: boolean
	/** 是否为危险操作 */
	danger?: boolean
	/** 按钮类型 */
	type?: 'default' | 'primary' | 'danger'
	/** 自定义样式类名 */
	className?: string
	/** 自定义样式 */
	style?: React.CSSProperties
}

const ActionButton: React.FC<ActionButtonProps> = ({
	icon,
	iconSize = 14,
	title,
	onClick,
	disabled = false,
	danger = false,
	type = 'default',
	className,
	style
}) => {
	const handleClick = () => {
		if (!disabled && onClick) {
			onClick()
		}
	}

	const buttonClass = [
		styles.actionButton,
		styles[type],
		danger && styles.danger,
		disabled && styles.disabled,
		className
	]
		.filter(Boolean)
		.join(' ')

	const renderIcon = () => {
		if (!icon) return null

		if (typeof icon === 'string') {
			return <Icon name={icon} size={iconSize} />
		}

		return icon
	}

	return (
		<button
			type='button'
			className={buttonClass}
			onClick={handleClick}
			disabled={disabled}
			title={title}
			style={style}
		>
			{renderIcon()}
		</button>
	)
}

export default ActionButton
