import React, { useEffect, useState } from 'react'
import { getLocale } from '@umijs/max'
import { observer } from 'mobx-react-lite'
import { useGlobal } from '@/context/app'
import { useIntl } from '@/hooks'
import AuthLayout from '../components/AuthLayout'
import styles from './index.less'
import { HelloWorld as HelloWorldAPI } from '@/openapi'
import JsonHighlight from './JsonHighlight'
import { getDefaultLogoUrl } from '@/services/wellknown'

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
	const [ready, setReady] = useState(false)
	const [apitests, setApiTests] = useState<any[]>([])
	const [isAuthenticated, setIsAuthenticated] = useState(true)
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
		working: isZh ? '正常' : 'Working',
		unauthenticated: isZh ? '未登录' : 'Unauthenticated',
		apiTests: isZh ? 'API 测试结果' : 'API Test Results',
		method: isZh ? '方法' : 'Method',
		path: isZh ? '路径' : 'Path',
		response: isZh ? '响应' : 'Response'
	}

	const { userInfo } = global
	const hasUser = userInfo && userInfo.name

	// Get Account Info
	useEffect(() => {
		if (!window.$app?.openapi) {
			return
		}
		setReady(true)

		// Get Response
		const getResponse = async () => {
			const hello = new HelloWorldAPI(window.$app.openapi)
			Promise.all([hello.Public(), hello.Protected(), hello.PostPublic(), hello.PostProtected()]).then(
				([publicRes, protectedRes, postPublicRes, postProtectedRes]) => {
					// Check if protected endpoints return 401 (Unauthorized)
					const hasUnauthorizedError =
						protectedRes.status === 401 || postProtectedRes.status === 401
					setIsAuthenticated(!hasUnauthorizedError)

					setApiTests([
						{
							method: 'GET',
							path: '/helloworld/public',
							response: publicRes
						},
						{
							method: 'GET',
							path: '/helloworld/protected',
							response: protectedRes
						},
						{
							method: 'POST',
							path: '/helloworld/public',
							response: postPublicRes
						},
						{
							method: 'POST',
							path: '/helloworld/protected',
							response: postProtectedRes
						}
					])
				}
			)
		}
		getResponse()
	}, [window.$app.openapi])

	return (
		<AuthLayout
			logo={global.app_info?.logo || getDefaultLogoUrl()}
			theme={global.theme}
			onThemeChange={(theme: 'light' | 'dark') => global.setTheme(theme)}
		>
			{ready ? (
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
													{(userInfo.name || 'U')
														.charAt(0)
														.toUpperCase()}
												</div>
											)}
										</div>
										<div className={styles.userDetails}>
											<h3 className={styles.userName}>
												{texts.welcome}, {userInfo.name || 'User'}
											</h3>
											{userInfo.email && (
												<p className={styles.userEmail}>
													{userInfo.email}
												</p>
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
											<h3 className={styles.userName}>
												{texts.notLoggedIn}
											</h3>
										</div>
									</div>
								</div>
							)}

							{/* Info Section */}
							<div className={styles.infoSection}>
								<div className={styles.infoItem}>
									<span className={styles.infoLabel}>{texts.currentTime}:</span>
									<span className={styles.infoValue}>
										{new Date().toLocaleString()}
									</span>
								</div>
								<div className={styles.infoItem}>
									<span className={styles.infoLabel}>{texts.apiStatus}:</span>
									<span
										className={
											isAuthenticated
												? styles.infoValueSuccess
												: styles.infoValueError
										}
									>
										{isAuthenticated ? texts.working : texts.unauthenticated}
									</span>
								</div>
							</div>

							{/* API Tests Section */}
							{apitests.length > 0 && (
								<div className={styles.apiTestsSection}>
									<h3 className={styles.sectionTitle}>{texts.apiTests}</h3>
									<div className={styles.apiTestsContainer}>
										{apitests.map((test, index) => (
											<div key={index} className={styles.apiTestItem}>
												<div className={styles.apiTestHeader}>
													<span
														className={styles.apiMethod}
														data-method={test.method}
													>
														{test.method}
													</span>
													<span className={styles.apiPath}>
														{test.path}
													</span>
												</div>
												<div className={styles.apiTestResponse}>
													<div className={styles.responseLabel}>
														{texts.response}:
													</div>
													<JsonHighlight
														data={test.response}
														className={styles.responseContent}
													/>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			) : (
				<div>Loading...</div>
			)}
		</AuthLayout>
	)
}

export default observer(HelloWorld)
