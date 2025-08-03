import { Button, message } from 'antd'
import clsx from 'clsx'
import { useState } from 'react'
import { useIntl } from '@/hooks'
import styles from './index.less'
import type { IPropsEnhancedThirdPartyLogin, ThirdPartyProvider } from '@/pages/login/types'

// 检测 SVG 图标的辅助函数
const isSvgIcon = (logoUrl: string): boolean => {
	return logoUrl.toLowerCase().includes('.svg') || logoUrl.startsWith('data:image/svg+xml')
}

// 将颜色转换为 CSS filter，用于 SVG 图标颜色匹配
const getColorFilter = (textColor: string): string => {
	// 处理常见的颜色值
	const color = textColor.toLowerCase().trim()

	// 白色 - 适用于深色背景
	if (color === '#ffffff' || color === '#fff' || color === 'white') {
		return 'brightness(0) saturate(100%) invert(1)'
	}

	// 黑色 - 适用于浅色背景
	if (color === '#000000' || color === '#000' || color === 'black') {
		return 'brightness(0) saturate(100%) invert(0)'
	}

	// 对于其他颜色，使用通用的转换方法
	// 先将图标变为黑色，然后反转来匹配亮色文字
	// 这适用于大部分场景，特别是单色 SVG 图标
	return 'brightness(0) saturate(100%) invert(1)'
}

const SocialLogin = ({ providers, onProviderClick, loading }: IPropsEnhancedThirdPartyLogin) => {
	const messages = useIntl()
	const [clickedProvider, setClickedProvider] = useState<string | null>(null)

	if (!providers || providers.length === 0) {
		return null
	}

	const handleProviderClick = async (provider: ThirdPartyProvider) => {
		if (loading || clickedProvider) return

		try {
			setClickedProvider(provider.id)
			await onProviderClick(provider)
		} catch (error) {
			message.error(`Failed to authenticate with ${provider.title}`)
		} finally {
			setClickedProvider(null)
		}
	}

	return (
		<div className={styles.container}>
			{/* Divider */}
			<div className={styles.dividerWrap}>
				<div className={styles.dividerLine}></div>
				<span className={styles.dividerText}>{messages.login.third_party.title}</span>
				<div className={styles.dividerLine}></div>
			</div>

			{/* Third-party providers */}
			<div className={styles.providersWrap}>
				{providers.map((provider) => (
					<Button
						key={provider.id}
						className={clsx([
							styles.providerBtn,
							clickedProvider === provider.id && styles.loading
						])}
						size='large'
						shape='round'
						loading={clickedProvider === provider.id}
						disabled={loading}
						onClick={() => handleProviderClick(provider)}
						icon={
							provider.logo &&
							!clickedProvider && (
								<img
									className={styles.providerIcon}
									src={provider.logo}
									alt={provider.title}
									onError={(e) => {
										e.currentTarget.style.display = 'none'
									}}
									style={{
										// 如果是 SVG，使用 filter 来匹配文字颜色
										filter: isSvgIcon(provider.logo)
											? getColorFilter(provider.text_color || '#ffffff')
											: undefined
									}}
								/>
							)
						}
						style={{
							backgroundColor: provider.color || 'var(--color_main)',
							borderColor: provider.color || 'var(--color_main)',
							color: provider.text_color || '#ffffff'
						}}
					>
						<span className={styles.providerName}>{provider.title}</span>
					</Button>
				))}
			</div>
		</div>
	)
}

export default window.$app.memo(SocialLogin)
