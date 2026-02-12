import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import { useState, useEffect } from 'react'
import { useIntl } from '@/hooks'
import { getLocale, setLocale } from '@umijs/max'
import { Icon } from '@/widgets'
import styles from './index.less'

// 浏览器语言检测工具函数 - 与signin页面保持一致
const getBrowserLanguage = (): string => {
	// 获取浏览器首选语言
	const browserLang = navigator.language || navigator.languages?.[0] || 'en'
	return browserLang
}

// 语言标准化函数 - 将浏览器语言映射到应用支持的语言
const normalizeLocale = (locale: string): string => {
	if (locale.startsWith('zh')) {
		return 'zh-CN'
	}
	if (locale.startsWith('en')) {
		return 'en-US'
	}
	return locale
}
interface SettingsProps {
	theme: 'light' | 'dark'
	onThemeChange: (theme: 'light' | 'dark') => void
}

const Settings = ({ theme, onThemeChange }: SettingsProps) => {
	const messages = useIntl()
	const is_dark = theme === 'dark'

	// 使用与signin页面一致的语言获取逻辑，并使用state来确保响应式更新
	const browserLang = getBrowserLanguage()
	const [currentLocale, setCurrentLocale] = useState(() => {
		const rawLocale = getLocale() || browserLang
		const initialLocale = normalizeLocale(rawLocale)
		return initialLocale
	})
	const is_cn = currentLocale === 'zh-CN'

	// 监听locale变化，确保与signin页面同步
	useEffect(() => {
		const rawLocale = getLocale() || browserLang
		const newLocale = normalizeLocale(rawLocale)
		if (newLocale !== currentLocale) {
			setCurrentLocale(newLocale)
		}
	}, [browserLang, currentLocale])

	const handleThemeChange = () => {
		onThemeChange(is_dark ? 'light' : 'dark')
	}

	const handleLanguageChange = (newLocale: string) => {
		// Sync locale cookie for SUI server-side rendering BEFORE umi reloads the page.
		const normalized = newLocale.toLowerCase().replace('_', '-')
		document.cookie = `locale=${normalized};path=/;max-age=31536000`

		setLocale(newLocale)
		// 立即更新本地状态，确保UI同步响应（用户选择的语言直接设置，不需要标准化）
		setCurrentLocale(newLocale)
	}

	const languages = [
		{ key: 'en-US', label: 'EN' },
		{ key: 'zh-CN', label: '中' }
	]

	return (
		<div className={clsx([styles.container, 'flex align_center'])}>
			{/* Language Switcher */}
			<div className={styles.languageSwitcher}>
				{languages.map((lang) => {
					const isActive = currentLocale === lang.key
					return (
						<button
							key={lang.key}
							className={clsx([styles.langBtn, isActive && styles.active])}
							onClick={() => handleLanguageChange(lang.key)}
						>
							{lang.label}
						</button>
					)
				})}
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
