import React, { useState, useRef, useEffect } from 'react'
import styles from './Tooltip.less'

interface ITooltipProps {
	content: string
	children: React.ReactNode
	placement?: 'top' | 'bottom' | 'left' | 'right'
	disabled?: boolean
}

const Tooltip: React.FC<ITooltipProps> = ({
	content,
	children,
	placement = 'top',
	disabled = false
}) => {
	const [visible, setVisible] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	if (!content || disabled) {
		return <>{children}</>
	}

	return (
		<div
			ref={containerRef}
			className={styles.tooltipContainer}
			onMouseEnter={() => setVisible(true)}
			onMouseLeave={() => setVisible(false)}
		>
			{children}
			{visible && (
				<div className={`${styles.tooltip} ${styles[placement]}`}>
					{content}
				</div>
			)}
		</div>
	)
}

export default Tooltip

