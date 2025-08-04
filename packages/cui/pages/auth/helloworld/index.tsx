import React from 'react'
import { getLocale } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { useIntl } from '@/hooks'
import AuthLayout from '../components/AuthLayout'
import styles from './index.less'

// 浏览器语言检测工具函数
const getBrowserLanguage = (): string => {
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

const HelloWorld = () => {
	const messages = useIntl()
	const global = useGlobal()

	// 使用浏览器语言作为默认语言，fallback到当前locale
	const browserLang = getBrowserLanguage()
	const rawLocale = getLocale() || browserLang
	const currentLocale = normalizeLocale(rawLocale)
	const isZh = currentLocale.startsWith('zh')

	// 多语言文本
	const texts = {
		title: isZh ? '你好，世界！' : 'Hello, World!',
		description: isZh ? 'Hello World 测试页面运行正常' : 'Hello World test page is running normally',
		welcome: isZh ? '欢迎' : 'Welcome',
		notLoggedIn: isZh ? '未登录用户' : 'Not logged in',
		currentTime: isZh ? '当前时间' : 'Current Time',
		apiStatus: isZh ? 'API 状态' : 'API Status',
		working: isZh ? '正常' : 'Working'
	}

	const { userInfo } = global
	const hasUser = userInfo && userInfo.name

	return (
		<AuthLayout
			logo={global.app_info?.logo || '/api/__yao/app/icons/app.png'}
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			<div className={styles.container}>
				<div className={styles.helloworldContainer}>
					<div className={styles.helloworldCard}>
						{/* Title Section */}
						<div className={styles.titleSection}>
							<h1 className={styles.appTitle}>{texts.title}</h1>
							<p className={styles.appSubtitle}>{texts.description}</p>
						</div>

						{/* User Info Section */}
						{hasUser ? (
							<div className={styles.userSection}>
								<div className={styles.userInfo}>
									<div className={styles.avatar}>
										{userInfo.picture ? (
											<img src={userInfo.picture} alt='User Avatar' />
										) : (
											<div className={styles.avatarDefault}>
												{(userInfo.name || 'U').charAt(0).toUpperCase()}
											</div>
										)}
									</div>
									<div className={styles.userDetails}>
										<h3 className={styles.userName}>
											{texts.welcome}, {userInfo.name || 'User'}
										</h3>
										{userInfo.email && (
											<p className={styles.userEmail}>{userInfo.email}</p>
										)}
									</div>
								</div>
							</div>
						) : (
							<div className={styles.userSection}>
								<div className={styles.userInfo}>
									<div className={styles.avatar}>
										<div className={styles.avatarDefault}>U</div>
									</div>
									<div className={styles.userDetails}>
										<h3 className={styles.userName}>{texts.notLoggedIn}</h3>
									</div>
								</div>
							</div>
						)}

						{/* Info Section */}
						<div className={styles.infoSection}>
							<div className={styles.infoItem}>
								<span className={styles.infoLabel}>{texts.currentTime}:</span>
								<span className={styles.infoValue}>{new Date().toLocaleString()}</span>
							</div>
							<div className={styles.infoItem}>
								<span className={styles.infoLabel}>{texts.apiStatus}:</span>
								<span className={styles.infoValueSuccess}>{texts.working}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</AuthLayout>
	)
}

export default observer(HelloWorld)
