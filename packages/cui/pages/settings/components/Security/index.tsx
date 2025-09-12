import { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import { ContactInfo, OAuthProviders, TwoFactorAuth } from './components'
import { mockApi, SecurityData } from '../../mockData'
import styles from './index.less'

const Security = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [securityData, setSecurityData] = useState<SecurityData | null>(null)

	useEffect(() => {
		const loadSecurityData = async () => {
			try {
				setLoading(true)
				const data = await mockApi.getSecurityData()
				setSecurityData(data)
			} catch (error) {
				console.error('Failed to load security data:', error)
				message.error(is_cn ? '加载安全信息失败' : 'Failed to load security data')
			} finally {
				setLoading(false)
			}
		}

		loadSecurityData()
	}, [is_cn])

	if (loading) {
		return (
			<div className={styles.security}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '账号安全' : 'Account Security'}</h2>
						<p>
							{is_cn
								? '管理您的登录信息、验证方式和安全设置'
								: 'Manage your login information, authentication methods and security settings'}
						</p>
					</div>
				</div>
				<div className={styles.contentStack}>
					<div className={styles.loadingState}>
						<Icon name='material-hourglass_empty' size={32} className={styles.loadingIcon} />
						<span>{is_cn ? '加载中...' : 'Loading...'}</span>
					</div>
				</div>
			</div>
		)
	}

	if (!securityData) {
		return (
			<div className={styles.security}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '账号安全' : 'Account Security'}</h2>
						<p>
							{is_cn
								? '管理您的登录信息、验证方式和安全设置'
								: 'Manage your login information, authentication methods and security settings'}
						</p>
					</div>
				</div>
				<div className={styles.contentStack}>
					<div className={styles.errorState}>
						<Icon name='material-error' size={32} className={styles.errorIcon} />
						<span>{is_cn ? '加载失败' : 'Failed to load'}</span>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.security}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '账号安全' : 'Account Security'}</h2>
					<p>
						{is_cn
							? '管理您的登录信息、验证方式和安全设置'
							: 'Manage your login information, authentication methods and security settings'}
					</p>
				</div>
				<div className={styles.headerActions}>{/* 预留位置，可以放置操作按钮 */}</div>
			</div>

			{/* Content Stack */}
			<div className={styles.contentStack}>
				{/* Contact Information Section */}
				<ContactInfo data={securityData.contact} onUpdate={setSecurityData} />

				{/* OAuth Providers Section */}
				<OAuthProviders data={securityData.oauthProviders} onUpdate={setSecurityData} />

				{/* Two-Factor Authentication Section */}
				<TwoFactorAuth data={securityData.twoFactor} onUpdate={setSecurityData} />
			</div>
		</div>
	)
}

export default Security
