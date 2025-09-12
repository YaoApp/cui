import { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { message, Modal } from 'antd'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import { OAuthProvider, SecurityData } from '../../../mockData'
import { Signin, SigninProvider } from '@/openapi'
import styles from './OAuthProviders.less'

interface OAuthProvidersProps {
	data: OAuthProvider[]
	onUpdate: (data: SecurityData) => void
}

const OAuthProviders: React.FC<OAuthProvidersProps> = ({ data, onUpdate }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [connectingProvider, setConnectingProvider] = useState<string | null>(null)
	const [disconnectModal, setDisconnectModal] = useState<{
		visible: boolean
		provider: OAuthProvider | null
	}>({ visible: false, provider: null })
	const [availableProviders, setAvailableProviders] = useState<SigninProvider[]>([])
	const [providersLoading, setProvidersLoading] = useState(false)

	// 获取可用的第三方登录配置
	useEffect(() => {
		const loadAvailableProviders = async () => {
			try {
				if (!window.$app?.openapi) {
					console.error('OpenAPI not initialized')
					return
				}

				setProvidersLoading(true)
				const signin = new Signin(window.$app.openapi)
				const configRes = await signin.GetConfig(locale)

				if (!signin.IsError(configRes) && configRes.data?.third_party?.providers) {
					setAvailableProviders(configRes.data.third_party.providers)
				}
			} catch (error) {
				console.error('Failed to load OAuth providers:', error)
			} finally {
				setProvidersLoading(false)
			}
		}

		loadAvailableProviders()
	}, [locale])

	// 检测 SVG 图标的辅助函数（从登录页面复制）
	const isSvgIcon = (logoUrl: string): boolean => {
		return logoUrl.toLowerCase().includes('.svg') || logoUrl.startsWith('data:image/svg+xml')
	}

	// 将颜色转换为 CSS filter（从登录页面复制）
	const getColorFilter = (textColor: string): string => {
		const color = textColor.toLowerCase().trim()
		if (color === '#ffffff' || color === '#fff' || color === 'white') {
			return 'brightness(0) saturate(100%) invert(1)'
		}
		if (color === '#000000' || color === '#000' || color === 'black') {
			return 'brightness(0) saturate(100%) invert(0)'
		}
		return 'brightness(0) saturate(100%) invert(1)'
	}

	const handleConnect = async (provider: SigninProvider) => {
		try {
			if (!window.$app?.openapi) {
				message.error('API not initialized')
				return
			}

			setConnectingProvider(provider.id)
			const signin = new Signin(window.$app.openapi)
			const authUrl = await signin.GetOAuthAuthorizationUrl(provider.id)

			// 在新窗口中打开OAuth授权页面
			const popup = window.open(authUrl, 'oauth-popup', 'width=600,height=700,scrollbars=yes,resizable=yes')

			// 监听popup关闭，检查是否成功连接
			const checkClosed = setInterval(() => {
				if (popup?.closed) {
					clearInterval(checkClosed)
					setConnectingProvider(null)
					// 这里可以重新获取用户的OAuth连接状态
					message.success(is_cn ? '连接成功' : 'Connected successfully')
				}
			}, 1000)
		} catch (error) {
			console.error(`OAuth error for ${provider.title}:`, error)
			message.error(is_cn ? `连接${provider.title}失败` : `Failed to connect ${provider.title}`)
			setConnectingProvider(null)
		}
	}

	const handleDisconnect = (provider: OAuthProvider) => {
		setDisconnectModal({ visible: true, provider })
	}

	const confirmDisconnect = async () => {
		if (!disconnectModal.provider) return

		try {
			// Mock API call for disconnect
			await new Promise((resolve) => setTimeout(resolve, 1000))

			message.success(
				is_cn
					? `已断开与${disconnectModal.provider.provider_id}的连接`
					: `Disconnected from ${disconnectModal.provider.provider_id}`
			)

			// 更新状态
			// onUpdate 逻辑需要根据实际API调整
		} catch (error) {
			message.error(is_cn ? '断开连接失败' : 'Failed to disconnect')
		} finally {
			setDisconnectModal({ visible: false, provider: null })
		}
	}

	// 检查provider是否已连接
	const isProviderConnected = (providerId: string) => {
		return data.some((item) => item.provider === providerId)
	}

	// 获取已连接的provider信息
	const getConnectedProvider = (providerId: string) => {
		return data.find((item) => item.provider === providerId)
	}

	if (providersLoading) {
		return (
			<div className={styles.oauthProvidersCard}>
				<div className={styles.cardHeader}>
					<div className={styles.cardTitle}>
						<Icon name='material-link' size={16} className={styles.cardIcon} />
						<h3>{is_cn ? '第三方登录' : 'Third-party Login'}</h3>
					</div>
					<div className={styles.cardActions}></div>
				</div>
				<div className={styles.cardContent}>
					<div className={styles.loadingState}>
						<Icon name='material-hourglass_empty' size={32} />
						<span>{is_cn ? '加载中...' : 'Loading...'}</span>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.oauthProvidersCard}>
			<div className={styles.cardHeader}>
				<div className={styles.cardTitle}>
					<Icon name='material-link' size={16} className={styles.cardIcon} />
					<h3>{is_cn ? '第三方登录' : 'Third-party Login'}</h3>
				</div>
				<div className={styles.cardActions}></div>
			</div>
			<div className={styles.cardContent}>
				<div className={styles.providersList}>
					{availableProviders.map((provider) => {
						const isConnected = isProviderConnected(provider.id)
						const connectedInfo = getConnectedProvider(provider.id)

						return (
							<div key={provider.id} className={styles.providerItem}>
								{/* 左侧：LOGO + 品牌名称分开展示 */}
								<div className={styles.providerInfo}>
									{/* LOGO 区域 */}
									<div
										className={styles.providerLogo}
										style={{
											backgroundColor:
												provider.color || 'var(--color_main)',
											color: provider.text_color || '#ffffff'
										}}
									>
										{provider.logo ? (
											<img
												src={provider.logo}
												alt={provider.title}
												style={{
													filter: isSvgIcon(provider.logo)
														? getColorFilter(
																provider.text_color ||
																	'#ffffff'
														  )
														: undefined
												}}
												onError={(e) => {
													e.currentTarget.style.display = 'none'
												}}
											/>
										) : (
											<Icon
												name='material-link'
												size={20}
												style={{
													color: provider.text_color || '#ffffff'
												}}
											/>
										)}
									</div>
									{/* 品牌名称 */}
									<span className={styles.providerName}>{provider.label}</span>
								</div>

								{/* 右侧：状态和操作 */}
								<div className={styles.providerContent}>
									{isConnected && connectedInfo ? (
										<div className={styles.connectedInfo}>
											<Button
												type='default'
												size='small'
												icon={<Icon name='material-close' size={12} />}
												onClick={() =>
													connectedInfo &&
													handleDisconnect(connectedInfo)
												}
											>
												{connectedInfo.email}
											</Button>
										</div>
									) : (
										<div className={styles.notConnectedInfo}>
											<Button
												type='primary'
												size='small'
												loading={connectingProvider === provider.id}
												onClick={() => handleConnect(provider)}
											>
												{is_cn ? '连接' : 'Connect'}
											</Button>
										</div>
									)}
								</div>
							</div>
						)
					})}
				</div>

				{availableProviders.length === 0 && (
					<div className={styles.emptyState}>
						<Icon name='material-link_off' size={48} />
						<p>{is_cn ? '暂无可用的第三方登录' : 'No third-party login providers available'}</p>
					</div>
				)}
			</div>

			{/* 断开连接确认弹窗 */}
			<Modal
				title={is_cn ? '断开连接' : 'Disconnect'}
				open={disconnectModal.visible}
				onOk={confirmDisconnect}
				onCancel={() => setDisconnectModal({ visible: false, provider: null })}
				okText={is_cn ? '确认断开' : 'Disconnect'}
				cancelText={is_cn ? '取消' : 'Cancel'}
				okType='danger'
			>
				<p>
					{is_cn
						? `确定要断开与 ${disconnectModal.provider?.provider_id} 的连接吗？断开后将需要重新授权才能使用该账号登录。`
						: `Are you sure you want to disconnect from ${disconnectModal.provider?.provider_id}? You will need to reauthorize to use this account for login.`}
				</p>
			</Modal>
		</div>
	)
}

export default OAuthProviders
