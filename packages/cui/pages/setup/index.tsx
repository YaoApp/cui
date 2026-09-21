import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { history, getLocale } from '@umijs/max'
import { Spin } from 'antd'
import { useGlobal } from '@/context/app'
import { Setting as SettingAPI } from '@/openapi/setting/api'
import { getYaoMetadata } from '@/services/wellknown'
import { getSetupRedirectUrl, refreshSetupStatus } from './redirect'
import SetupLayout from './components/SetupLayout'
import PathCard from './components/PathCard'
import styles from './index.less'

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

const SetupIndex = observer(() => {
	const global = useGlobal()
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const apiLocale = is_cn ? 'zh-cn' : 'en-us'

	const [signupGift, setSignupGift] = useState<number | null>(null)
	const [giftFetched, setGiftFetched] = useState(false)

	// Redirect if already configured
	useEffect(() => {
		if (!global.setup_status) return
		const llmCheck = global.setup_status.checkpoints?.llm_default
		if (llmCheck?.status !== 'fail') {
			refreshSetupStatus().then(() =>
				getSetupRedirectUrl().then((url) => {
					window.location.href = url
				})
			)
		}
	}, [global.setup_status])

	// Fetch signup gift credits
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
			} finally {
				setGiftFetched(true)
			}
		}
		fetchGift()
	}, [apiLocale])

	// Loading state while setup_status is being fetched
	if (!global.setup_status) {
		return (
			<SetupLayout>
				<div className={styles.loadingWrap}>
					<Spin size='large' />
				</div>
			</SetupLayout>
		)
	}

	const metadata = getYaoMetadata()
	const registerUrl = is_cn ? metadata?.tao?.register_cn : metadata?.tao?.register_en

	const taoExtra = (() => {
		if (!registerUrl) return null

		// Before API responds: show plain register link (no gift mention to avoid flash)
		if (!giftFetched) {
			return (
				<a
					href={withSource(registerUrl)}
					target='_blank'
					rel='noopener noreferrer'
					onClick={(e) => e.stopPropagation()}
				>
					{is_cn ? '前往 yaoagents.cn 注册 →' : 'Sign up at yaoagents.com →'}
				</a>
			)
		}

		const linkText =
			signupGift !== null && signupGift > 0
				? is_cn
					? `前往 yaoagents.cn 注册，即送 ${signupGift} 积分 →`
					: `Sign up at yaoagents.com, get ${signupGift} credits free →`
				: is_cn
					? '前往 yaoagents.cn 注册 →'
					: 'Sign up at yaoagents.com →'

		return (
			<a
				href={withSource(registerUrl)}
				target='_blank'
				rel='noopener noreferrer'
				onClick={(e) => e.stopPropagation()}
			>
				{linkText}
			</a>
		)
	})()

	return (
		<SetupLayout>
			<div className={styles.welcomeHeader}>
				<h1 className={styles.welcomeTitle}>
					{is_cn ? '欢迎使用 Yao Agents' : 'Welcome to Yao Agents'}
				</h1>
				<p className={styles.welcomeSubtitle}>
					{is_cn ? '请选择配置方式开始' : 'Choose how to get started'}
				</p>
			</div>

			<PathCard
				icon='material-bolt'
				title={is_cn ? '使用 Tao Service' : 'Use Tao Service'}
				description={
					is_cn
						? '你的 Agent 运行所需的一切服务，一个网关搞定。AI 模型、搜索、抓取、存储，一个 Key，按积分计量计费。'
						: 'One gateway for everything your agents need to run. AI models, search, fetch, storage, one key, metered and billed in Credits.'
				}
				badge={is_cn ? '推荐' : 'Recommended'}
				extra={taoExtra}
				buttonText={is_cn ? '配置 Tao Service →' : 'Configure Tao Service →'}
				onClick={() => history.push('/setup/tao')}
			/>

			<PathCard
				icon='material-build'
				title={is_cn ? '自带 Key (BYOK)' : 'Bring Your Own Key (BYOK)'}
				description={
					is_cn
						? '使用自己的 OpenAI、Anthropic、本地 Ollama 等服务。需要分别配置各项服务。'
						: 'Use your own OpenAI, Anthropic, local Ollama, etc. Configure each service separately.'
				}
				buttonText={is_cn ? '开始配置 →' : 'Start Setup →'}
				onClick={() => history.push('/setup/byok')}
			/>
		</SetupLayout>
	)
})

export default SetupIndex
