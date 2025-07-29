import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import { useIntl } from '@/hooks'
import { getLocale, setLocale } from '@umijs/max'
import { Icon } from '@/widgets'
import styles from './index.less'
interface SettingsProps {
	theme: 'light' | 'dark'
	onThemeChange: (theme: 'light' | 'dark') => void
}

const Settings = ({ theme, onThemeChange }: SettingsProps) => {
	const messages = useIntl()
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const is_dark = theme === 'dark'

	const handleThemeChange = () => {
		onThemeChange(is_dark ? 'light' : 'dark')
	}

	const handleLanguageChange = (newLocale: string) => {
		setLocale(newLocale)
	}

	const languages = [
		{ key: 'zh-CN', label: '中' },
		{ key: 'en-US', label: 'EN' }
	]

	return (
		<div className={clsx([styles.container, 'flex align_center'])}>
			{/* Language Switcher */}
			<div className={styles.languageSwitcher}>
				{languages.map((lang) => (
					<button
						key={lang.key}
						className={clsx([styles.langBtn, locale === lang.key && styles.active])}
						onClick={() => handleLanguageChange(lang.key)}
					>
						{lang.label}
					</button>
				))}
			</div>

			{/* Theme Switcher */}
			<div className={styles.themeSwitcher}>
				<button
					className={clsx([
						styles.themeToggleBtn,
						'flex justify_center align_center cursor_point',
						is_dark && styles.dark
					])}
					onClick={handleThemeChange}
					title={is_dark ? messages.login.theme.light : messages.login.theme.dark}
				>
					<Icon name={is_dark ? 'light_mode-filled' : 'dark_mode-filled'} size={16} />
				</button>
			</div>
		</div>
	)
}

export default window.$app.memo(Settings)
