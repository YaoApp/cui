import React, { useState, useRef, useEffect, ReactNode } from 'react'
import styles from './index.less'

export interface DropdownMenuItem {
	key: string
	label: string
	icon?: ReactNode
	onClick?: () => void
	disabled?: boolean
}

export interface DropdownProps {
	children: ReactNode
	items: DropdownMenuItem[]
	placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'
	trigger?: 'click' | 'hover'
	className?: string
}

const Dropdown: React.FC<DropdownProps> = ({
	children,
	items,
	placement = 'bottomRight',
	trigger = 'click',
	className = ''
}) => {
	const [visible, setVisible] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const triggerRef = useRef<HTMLDivElement>(null)

	// 处理点击外部关闭
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				triggerRef.current &&
				!triggerRef.current.contains(event.target as Node)
			) {
				setVisible(false)
			}
		}

		if (visible) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => {
				document.removeEventListener('mousedown', handleClickOutside)
			}
		}
	}, [visible])

	// 处理 ESC 键关闭
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setVisible(false)
			}
		}

		if (visible) {
			document.addEventListener('keydown', handleKeyDown)
			return () => {
				document.removeEventListener('keydown', handleKeyDown)
			}
		}
	}, [visible])

	const handleTriggerClick = () => {
		if (trigger === 'click') {
			setVisible(!visible)
		}
	}

	const handleTriggerMouseEnter = () => {
		if (trigger === 'hover') {
			setVisible(true)
		}
	}

	const handleTriggerMouseLeave = () => {
		if (trigger === 'hover') {
			setVisible(false)
		}
	}

	const handleMenuItemClick = (item: DropdownMenuItem) => {
		if (!item.disabled && item.onClick) {
			item.onClick()
		}
		setVisible(false)
	}

	const dropdownClasses = [styles.dropdown, className].filter(Boolean).join(' ')

	const menuClasses = [styles.menu, styles[placement], visible && styles.visible].filter(Boolean).join(' ')

	return (
		<div className={dropdownClasses}>
			<div
				ref={triggerRef}
				className={styles.trigger}
				onClick={handleTriggerClick}
				onMouseEnter={handleTriggerMouseEnter}
				onMouseLeave={handleTriggerMouseLeave}
			>
				{children}
			</div>

			{visible && (
				<div ref={dropdownRef} className={menuClasses}>
					{items.map((item, index) => (
						<div
							key={item.key}
							className={`${styles.menuItem} ${item.disabled ? styles.disabled : ''}`}
							onClick={() => handleMenuItemClick(item)}
						>
							{item.icon && <span className={styles.menuIcon}>{item.icon}</span>}
							<span className={styles.menuLabel}>{item.label}</span>
							{index < items.length - 1 && <div className={styles.divider} />}
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export default Dropdown
