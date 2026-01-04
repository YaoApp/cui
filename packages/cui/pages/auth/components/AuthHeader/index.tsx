import React from 'react'
import Settings from '../Settings'
import { getDefaultLogoUrl } from '@/services/wellknown'
import styles from './index.less'

interface AuthHeaderProps {
	logo?: string
	theme?: 'light' | 'dark'
	onThemeChange?: (theme: 'light' | 'dark') => void
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ logo = getDefaultLogoUrl(), theme, onThemeChange }) => {
	return (
		<>
			{/* App Logo */}
			<div className={styles.logoWrap}>
				<div className={styles.appLogo}>
					<img src={logo} alt='Logo' />
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
