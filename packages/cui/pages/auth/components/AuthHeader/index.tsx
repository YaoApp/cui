import React from 'react'
import Settings from '../Settings'
import { getDefaultLogoUrl } from '@/services/wellknown'
import styles from './index.less'

interface AuthHeaderProps {
	logo?: string
	logoLink?: string
	theme?: 'light' | 'dark'
	onThemeChange?: (theme: 'light' | 'dark') => void
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ logo = getDefaultLogoUrl(), logoLink, theme, onThemeChange }) => {
	const logoImg = <img src={logo} alt='Logo' />
	return (
		<>
			{/* App Logo */}
			<div className={styles.logoWrap}>
				<div className={styles.appLogo}>
					{logoLink ? <a href={logoLink}>{logoImg}</a> : logoImg}
				</div>
			</div>

			{/* Settings */}
			{theme && onThemeChange && (
				<div className={styles.settingsWrap}>
					<Settings theme={theme} onThemeChange={onThemeChange} />
				</div>
			)}
		</>
	)
}

export default AuthHeader
