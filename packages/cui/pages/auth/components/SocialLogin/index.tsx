import { Button, message } from 'antd'
import clsx from 'clsx'
import { useState } from 'react'
import { useIntl } from '@/hooks'
import styles from './index.less'
import type { IPropsEnhancedThirdPartyLogin, ThirdPartyProvider } from '@/pages/login/types'

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
			message.error(`Failed to authenticate with ${provider.name}`)
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
						disabled={loading || !provider.enabled}
						onClick={() => handleProviderClick(provider)}
						icon={
							provider.icon &&
							!clickedProvider && (
								<img
									className={styles.providerIcon}
									src={provider.icon}
									alt={provider.name}
									onError={(e) => {
										e.currentTarget.style.display = 'none'
									}}
								/>
							)
						}
						style={{
							backgroundColor: provider.color || 'transparent',
							borderColor: provider.color || 'var(--color_border)',
							color: provider.textColor || 'var(--color_text)'
						}}
					>
						<span className={styles.providerName}>
							{messages.login.third_party.continue_with} {provider.name}
						</span>
					</Button>
				))}
			</div>
		</div>
	)
}

export default window.$app.memo(SocialLogin)
