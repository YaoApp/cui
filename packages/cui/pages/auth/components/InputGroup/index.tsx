import React from 'react'
import styles from './index.less'

interface InputGroupProps {
	children: React.ReactNode
	className?: string
}

const InputGroup: React.FC<InputGroupProps> = ({ children, className = '' }) => {
	return <div className={`${styles.inputGroup} ${className}`}>{children}</div>
}

export default InputGroup
