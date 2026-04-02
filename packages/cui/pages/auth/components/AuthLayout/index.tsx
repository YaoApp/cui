import React from 'react'
import AuthHeader from '../AuthHeader'
import styles from './index.less'

interface AuthLayoutProps {
	children: React.ReactNode
	logo?: string
	logoLink?: string
	theme?: 'light' | 'dark'
	onThemeChange?: (theme: 'light' | 'dark') => void
	className?: string
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, logo, logoLink, theme, onThemeChange, className = '' }) => {
	return (
		<div className={`${styles.container} ${className}`}>
			{/* Auth Header - Logo and Settings */}
			<AuthHeader logo={logo} logoLink={logoLink} theme={theme} onThemeChange={onThemeChange} />

			{/* Content */}
			<div className={styles.content}>{children}</div>
		</div>
	)
}

export default AuthLayout
