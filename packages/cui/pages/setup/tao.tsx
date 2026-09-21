import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { history, getLocale } from '@umijs/max'
import { Spin } from 'antd'
import { useGlobal } from '@/context/app'
import { Setting as SettingAPI } from '@/openapi/setting/api'
import { getYaoMetadata } from '@/services/wellknown'
import Icon from '@/widgets/Icon'
import { getSetupRedirectUrl, refreshSetupStatus } from './redirect'
import SetupLayout from './components/SetupLayout'
import SandboxModal, { hasPendingSandboxWork } from './components/SandboxModal'
import styles from './index.less'

type PageState = 'idle' | 'verifying' | 'success' | 'error'

/** Map error_type to bilingual user-facing message */
function getErrorMessage(errorType: string | undefined, is_cn: boolean): string {
	switch (errorType) {
		case 'invalid_api_key':
			return is_cn ? 'Key 无效，请检查后重试' : 'Invalid key, please check and try again'
		case 'api_key_expired':
			return is_cn ? 'Key 已过期，请到控制台续期' : 'Key expired, please renew in console'
		case 'api_key_revoked':
			return is_cn ? 'Key 已被吊销，请使用新 Key' : 'Key revoked, please use a new key'
		default:
			return is_cn
				? '无法连接 Tao Service，请稍后重试'
				: 'Cannot connect to Tao Service, please try later'
	}
}

/** Append `source=yao-setup` to a URL, preserving existing query params. */
function withSource(url: string): string {
	try {
		const u = new URL(url)
		u.searchParams.set('source', 'yao-setup')
		return u.toString()
	} catch {
		return url
	}
}

const TaoSetup = observer(() => {
	const global = useGlobal()
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const apiLocale = is_cn ? 'zh-cn' : 'en-us'

	const [state, setState] = useState<PageState>('idle')
	const [key, setKey] = useState('')
	const [showKey, setShowKey] = useState(false)
	const [errorType, setErrorType] = useState<string | undefined>()
	const [signupGift, setSignupGift] = useState<number | null>(null)
	const [showSandboxModal, setShowSandboxModal] = useState(false)

	const metadata = getYaoMetadata()
	const registerUrl = is_cn ? metadata?.tao?.register_cn : metadata?.tao?.register_en

	// Auto-navigate after successful setup once global state refreshes.
	// If sandbox work is pending (Docker detected but not configured), show
	// the SandboxModal first instead of redirecting immediately.
	useEffect(() => {
		if (state === 'success' && global.setup_status?.completed) {
			refreshSetupStatus().then(() => {
				if (hasPendingSandboxWork(global.setup_status)) {
					setShowSandboxModal(true)
				} else {
					getSetupRedirectUrl().then((url) => {
						window.location.href = url
					})
				}
			})
		}
	}, [state, global.setup_status?.completed])

	// Fetch signup gift
	useEffect(() => {
		const fetchGift = async () => {
			try {
				const api = new SettingAPI(window.$app.openapi)
				const res = await api.GetTaoSignupGift(apiLocale)
				if (res?.data && !window.$app.openapi.IsError(res)) {
					setSignupGift(res.data.signup_gift)
				}
			} catch {
				// Non-critical
			}
		}
		fetchGift()
	}, [apiLocale])

	const handleSubmit = async () => {
		if (!key.trim() || state === 'verifying') return
		setState('verifying')
		setErrorType(undefined)

		try {
			const api = new SettingAPI(window.$app.openapi)
			const res = await api.SetupTao(key.trim(), apiLocale)
			if (res?.data && !window.$app.openapi.IsError(res)) {
				const data = res.data
				if (data.success) {
					setState('success')
					window.$app?.Event?.emit('setup/recheck')
					window.$app?.Event?.emit('models/changed')
				} else {
					setErrorType(data.message || undefined)
					setState('error')
				}
			} else {
				const errData = res?.data as any
				setErrorType(errData?.error_type || errData?.message || undefined)
				setState('error')
			}
		} catch {
			setErrorType(undefined)
			setState('error')
		}
	}

	const doRedirect = () => {
		getSetupRedirectUrl().then((url) => {
			window.location.href = url
		})
	}

	// Success state: show loading while waiting for global state refresh
	if (state === 'success') {
		return (
			<SetupLayout>
				<div className={styles.loadingWrap}>
					<Spin size='large' />
					<p className={styles.loadingText}>
						{is_cn ? '配置完成，正在跳转...' : 'Setup complete, redirecting...'}
					</p>
				</div>
				<SandboxModal
					open={showSandboxModal}
					onClose={() => {
						setShowSandboxModal(false)
						doRedirect()
					}}
					onGoSetup={() => {
						setShowSandboxModal(false)
						history.push('/settings/sandbox')
					}}
				/>
			</SetupLayout>
		)
	}

	return (
		<SetupLayout
			showBack
			backLabel={is_cn ? '切换自带 Key' : 'Switch to BYOK'}
			onBack={() => history.push('/setup/byok')}
		>
			<div className={styles.taoCard}>
				<h2 className={styles.taoTitle}>
					{is_cn ? '配置 Tao Service' : 'Configure Tao Service'}
				</h2>
				<p className={styles.taoDesc}>
					{is_cn
						? '你的 Agent 运行所需的一切服务，一个网关搞定。配置后系统将自动为您配好全部服务。'
						: 'One gateway for everything your agents need. The system will automatically configure all services for you.'}
				</p>

				{registerUrl && (
					<div className={styles.taoRegister}>
						{is_cn ? '没有 Key？' : "Don't have a key? "}
						<a href={withSource(registerUrl)} target='_blank' rel='noopener noreferrer'>
							{is_cn ? '前往 yaoagents.cn 注册 →' : 'Sign up at yaoagents.com →'}
						</a>
					</div>
				)}

				{signupGift !== null && signupGift > 0 && (
					<div className={styles.taoCredits}>
						{is_cn
							? `注册即送 ${signupGift} 积分`
							: `Sign up and get ${signupGift} credits free`}
					</div>
				)}

				<div className={styles.taoDivider} />

				<div className={styles.taoKeyLabel}>Tao Service Key</div>
				<div className={styles.taoKeyInput}>
					<div className={styles.taoKeyInputWrap}>
						<input
							type={showKey ? 'text' : 'password'}
							value={key}
							onChange={(e) => setKey(e.target.value)}
							placeholder={
								is_cn
									? '输入您的 Tao Service Key'
									: 'Enter your Tao Service Key'
							}
							disabled={state === 'verifying'}
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleSubmit()
							}}
						/>
						<button
							type='button'
							className={styles.taoKeyToggle}
							onClick={() => setShowKey(!showKey)}
							tabIndex={-1}
						>
							<Icon
								name={
									showKey
										? 'material-visibility_off'
										: 'material-visibility'
								}
								size={18}
							/>
						</button>
					</div>
				</div>

				<div className={styles.taoKeyHelper}>
					{is_cn ? (
						<>
							前往{' '}
							<a href={withSource(registerUrl)} target='_blank' rel='noopener noreferrer'>
								yaoagents.cn
							</a>{' '}
							获取 Key
						</>
					) : (
						<>
							Get your key at{' '}
							<a href={withSource(registerUrl)} target='_blank' rel='noopener noreferrer'>
								yaoagents.com
							</a>
						</>
					)}
				</div>

				{/* Error message */}
				{state === 'error' && (
					<div className={styles.resultError}>
						<Icon name='material-error' size={18} />
						<span>{getErrorMessage(errorType, is_cn)}</span>
					</div>
				)}

				<button
					className={styles.taoSubmitButton}
					type='button'
					onClick={handleSubmit}
					disabled={!key.trim() || state === 'verifying'}
				>
					{state === 'verifying' ? (
						<>
							<Spin size='small' />{' '}
							{is_cn ? '正在验证...' : 'Verifying...'}
						</>
					) : state === 'error' ? (
						is_cn ? '重新验证' : 'Retry'
					) : (
						is_cn ? '验证并配置' : 'Verify and Configure'
					)}
				</button>
			</div>
		</SetupLayout>
	)
})

export default TaoSetup
