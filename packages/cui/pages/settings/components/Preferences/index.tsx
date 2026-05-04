import { useState, useEffect, useRef, useCallback } from 'react'
import { getLocale, setLocale } from '@umijs/max'
import { message } from 'antd'
import { useGlobal } from '@/context/app'
import { local } from '@yaoapp/storex'
import type { ProviderSchema } from '@/components/ui/Provider/types'
import { Setting } from '@/components/ui'
import { SettingRef } from '@/components/ui/Setting/types'
import { Setting as SettingAPI } from '@/openapi/setting/api'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface PreferencesFormData {
	language: string
	theme: string
	email_notification: boolean
	show_setup_banner: boolean
}

const getPreferenceSchema = (isCN: boolean): ProviderSchema => ({
	id: 'preferences',
	title: isCN ? '偏好设置' : 'Preferences',
	description: isCN ? '管理您的个人偏好和界面设置' : 'Manage your personal preferences and interface settings',
	properties: {
		language: {
			type: 'string',
			title: isCN ? '语言' : 'Language',
			description: isCN ? '选择界面显示语言' : 'Select your preferred language for the interface',
			component: 'Select',
			enum: [
				{
					label: isCN ? '跟随浏览器' : 'Follow Browser',
					value: 'auto',
					description: isCN ? '使用浏览器语言偏好' : 'Use browser language preference'
				},
				{ label: '中文', value: 'zh-CN', description: '简体中文' },
				{ label: 'English', value: 'en-US', description: 'English (United States)' }
			],
			default: 'auto',
			required: true,
			order: 1
		},
		theme: {
			type: 'string',
			title: isCN ? '主题' : 'Theme',
			description: isCN ? '选择您喜欢的颜色主题' : 'Choose your preferred color theme',
			component: 'RadioGroup',
			enum: [
				{ label: isCN ? '浅色' : 'Light', value: 'light' },
				{ label: isCN ? '深色' : 'Dark', value: 'dark' }
			],
			default: 'light',
			required: true,
			order: 2
		},
		email_notification: {
			type: 'boolean',
			title: isCN ? '邮件通知' : 'Email Notifications',
			description: isCN ? '接收重要更新和通知的邮件' : 'Receive emails about important updates and notifications',
			component: 'Switch',
			default: true,
			order: 3
		},
		show_setup_banner: {
			type: 'boolean',
			title: isCN ? '配置检查提示' : 'Setup Check Banner',
			description: isCN
				? '在聊天页面顶部显示系统配置完整性检查横幅'
				: 'Show system configuration check banner at the top of the chat page',
			component: 'Switch',
			default: true,
			order: 4
		}
	}
})

const Preferences = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()

	const [loading, setLoading] = useState(true)
	const [schema] = useState<ProviderSchema>(getPreferenceSchema(is_cn))
	const [data, setData] = useState<PreferencesFormData | null>(null)
	const prevDataRef = useRef<PreferencesFormData | null>(null)
	const settingRef = useRef<SettingRef>(null)

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true)
				const currentLocale = getLocale() || 'auto'
				const currentTheme = global.theme || 'light'
				let emailNotification = true

				let showSetupBanner = true
				try {
					if (window.$app?.openapi) {
						const api = new SettingAPI(window.$app.openapi)
						const res = await api.GetPreference()
						if (res?.data) {
							emailNotification = res.data.email_notification ?? true
							showSetupBanner = !(res.data.banner_dismissed ?? false)
						}
					}
				} catch {}

				const initial: PreferencesFormData = {
					language: currentLocale,
					theme: currentTheme,
					email_notification: emailNotification,
					show_setup_banner: showSetupBanner
				}
				setData(initial)
				prevDataRef.current = initial
			} catch (error) {
				console.error('Failed to load preferences:', error)
				message.error(is_cn ? '加载偏好设置失败' : 'Failed to load preferences')
			} finally {
				setLoading(false)
			}
		}

		loadData()
	}, [is_cn])

	const applyChange = useCallback(
		async (prev: PreferencesFormData, next: PreferencesFormData) => {
			try {
				if (next.language !== prev.language) {
					if (next.language !== 'auto') {
						const normalized = next.language.toLowerCase().replace('_', '-')
						document.cookie = `locale=${normalized};path=/;max-age=31536000`
						await window.$app?.Event?.emit('app/getUserMenu', next.language)
						setLocale(next.language, false)
					}
				}

				if (next.theme !== prev.theme) {
					global.setTheme(next.theme as 'light' | 'dark')
				}

				const apiFieldsChanged =
					next.email_notification !== prev.email_notification ||
					next.show_setup_banner !== prev.show_setup_banner
				if (apiFieldsChanged && window.$app?.openapi) {
					const api = new SettingAPI(window.$app.openapi)
					await api.UpdatePreference({
						email_notification: next.email_notification,
						banner_dismissed: !next.show_setup_banner
					})

					if (next.show_setup_banner !== prev.show_setup_banner) {
						if (global.setup_status) {
							global.setup_status = { ...global.setup_status, banner_dismissed: !next.show_setup_banner }
							local.setup_status = global.setup_status
						}
						window.$app?.Event?.emit('setup/recheck')
					}
				}
			} catch (error) {
				console.error('Failed to save preference:', error)
			}
		},
		[global]
	)

	const handleSettingChange = useCallback(
		(values: PreferencesFormData) => {
			const prev = prevDataRef.current
			setData(values)
			prevDataRef.current = values
			if (prev) applyChange(prev, values)
		},
		[applyChange]
	)

	if (loading) {
		return (
			<div className={styles.preferences}>
				<div className={styles.loadingState}>
					<Icon name='material-hourglass_empty' size={32} className={styles.loadingIcon} />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	if (!data) {
		return (
			<div className={styles.preferences}>
				<div className={styles.errorState}>
					<Icon name='material-error' size={32} className={styles.errorIcon} />
					<span>{is_cn ? '加载失败' : 'Failed to load'}</span>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.preferences}>
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '偏好设置' : 'Preferences'}</h2>
					<p>
						{is_cn
							? '管理您的个人偏好和界面设置'
							: 'Manage your personal preferences and interface settings'}
					</p>
				</div>
			</div>

			<div className={styles.panel}>
				<div className={styles.panelContent}>
					<Setting
						ref={settingRef}
						schema={schema}
						value={data}
						onChange={handleSettingChange}
						className={styles.setting}
					/>
				</div>
			</div>
		</div>
	)
}

export default Preferences
