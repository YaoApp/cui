import { useState, useEffect, useMemo, useRef } from 'react'
import { getLocale, useNavigate } from '@umijs/max'
import { message, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { InputPassword } from '@/components/ui/inputs'
import { Setting } from '@/openapi/setting'
import { getYaoMetadata } from '@/services/wellknown'
import type { TaoConfig } from '@/openapi/setting/types'
import type { PropertySchema } from '@/components/ui/inputs/types'
import styles from './index.less'

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

/** Resolve Tao registration URL from well-known metadata, always appending source tracking. */
function getTaoRegisterUrl(is_cn: boolean): string {
	const meta = getYaoMetadata()
	const base = meta?.tao
		? (is_cn ? meta.tao.register_cn : meta.tao.register_en)
		: (is_cn ? 'https://yaoagents.cn/tao' : 'https://yaoagents.com/tao')
	const sep = base.includes('?') ? '&' : '?'
	return `${base}${sep}source=yao-setting`
}

/** Build billing/usage URLs from the register URL. */
function taoBillingUrl(registerUrl: string): string {
	return registerUrl.replace('/tao', '/console/billing')
}
function taoUsageUrl(registerUrl: string): string {
	return registerUrl.replace('/tao', '/console/usage')
}

const CloudService = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const navigate = useNavigate()

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [refreshingBalance, setRefreshingBalance] = useState(false)
	const [data, setData] = useState<TaoConfig | null>(null)
	const [error, setError] = useState<string | null>(null)

	const [apiKey, setApiKey] = useState('')
	const [editingKey, setEditingKey] = useState(false)
	const retryRef = useRef(0)

	const hasKey = Boolean(data?.key)
	const isEditing = editingKey || !hasKey

	const registerUrl = useMemo(() => getTaoRegisterUrl(is_cn), [is_cn])

	useEffect(() => {
		let cancelled = false

		const load = () => {
			const api = getSettingAPI()
			if (!api) {
				if (retryRef.current < 10) {
					retryRef.current++
					setTimeout(load, 300)
				} else {
					if (!cancelled) {
						setError(is_cn ? 'API 客户端初始化失败' : 'API client initialization failed')
						setLoading(false)
					}
				}
				return
			}

			api.GetTaoConfig()
				.then((resp) => {
					if (cancelled) return
					if (resp.error || !resp.data) {
						setError(resp.error?.error_description || 'Failed to load Tao Service config')
						setLoading(false)
						return
					}
					setData(resp.data)
					setApiKey('')
					setLoading(false)
				})
				.catch((err) => {
					if (!cancelled) {
						setError(err?.message || 'Failed to load Tao Service config')
						setLoading(false)
					}
				})
		}

		load()
		return () => { cancelled = true }
	}, [])

	const handleSave = async () => {
		if (isEditing && !apiKey.trim()) {
			message.warning(is_cn ? '请输入 API Key' : 'Please enter API Key')
			return
		}
		const api = getSettingAPI()
		if (!api) return

		setSaving(true)
		try {
			const resp = await api.UpdateTaoConfig({ key: apiKey.trim() }, locale)
			if (resp.error || !resp.data) {
				message.error(resp.error?.error_description || (is_cn ? '保存失败' : 'Save failed'))
				return
			}
			setData(resp.data)
			setApiKey('')
			setEditingKey(false)
			message.success(is_cn ? '保存成功' : 'Saved successfully')
			window.$app?.Event?.emit('setup/recheck')
		} catch (err: any) {
			message.error(err?.message || (is_cn ? '保存失败' : 'Save failed'))
		} finally {
			setSaving(false)
		}
	}

	const handleEditKey = () => {
		setApiKey('')
		setEditingKey(true)
	}

	const handleCancelEdit = () => {
		setApiKey('')
		setEditingKey(false)
	}

	const handleRefreshBalance = async () => {
		const api = getSettingAPI()
		if (!api) return

		setRefreshingBalance(true)
		try {
			const resp = await api.RefreshTaoBalance()
			if (resp.error || !resp.data) {
				message.error(resp.error?.error_description || (is_cn ? '查询余额失败' : 'Failed to refresh balance'))
				return
			}
			if (data) {
				setData({
					...data,
					balance: resp.data.balance,
					balance_available: resp.data.balance_available
				})
			}
		} catch (err: any) {
			message.error(err?.message || (is_cn ? '查询余额失败' : 'Failed to refresh balance'))
		} finally {
			setRefreshingBalance(false)
		}
	}

	const keySchema = useMemo((): PropertySchema => ({
		type: 'string',
		placeholder: is_cn ? '输入您的 Tao Service API Key' : 'Enter your Tao Service API Key'
	}), [is_cn])

	const statusLabel = (status: TaoConfig['status']) => {
		const map = {
			connected: { text: is_cn ? '已连接' : 'Connected', cls: styles.status_connected },
			unconfigured: { text: is_cn ? '未配置' : 'Not configured', cls: styles.status_unconfigured }
		}
		return map[status] || map.unconfigured
	}

	if (error) {
		return (
			<div className={styles.cloudService}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>Tao Service</h2>
						<p>{error}</p>
					</div>
				</div>
			</div>
		)
	}

	if (loading || !data) {
		return (
			<div className={styles.cloudService}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>Tao Service</h2>
						<p>
							{is_cn
								? '配置 Tao Service API 凭证，用于模型和搜索'
								: 'Configure Tao Service API credentials for models and search'}
						</p>
					</div>
				</div>
				<div className={styles.loadingState}>
					<Spin size='small' />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	const status = statusLabel(data.status)

	return (
		<div className={styles.cloudService}>
			{/*
			 * LICENSE NOTICE: This service header and branding is required by the Yao open source license.
			 * Removing or hiding this section requires a commercial license.
			 * See /LICENSE for details.
			 */}
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>Tao Service</h2>
					<p>
						{is_cn
							? '配置 Tao Service API 凭证，用于模型和搜索'
							: 'Configure Tao Service API credentials for models and search'}
					</p>
				</div>
				<span className={`${styles.statusBadge} ${status.cls}`}>{status.text}</span>
			</div>

			{/*
			 * LICENSE NOTICE: This intro card and registration link is required by the Yao open source license.
			 * Removing or hiding this section requires a commercial license.
			 * See /LICENSE for details.
			 */}
			{/* Intro Card */}
			<div className={styles.introCard}>
				<div className={styles.introIcon}>
					<Icon name='material-grain' size={20} />
				</div>
				<div className={styles.introContent}>
					<div className={styles.introTitle}>Tao Service</div>
					<div className={styles.introDesc}>
						{is_cn
							? '你的 Agent 运行所需的一切服务，一个网关搞定。AI 模型、搜索、抓取、存储，一个 Key，按积分计量计费。'
							: 'One gateway for everything your agents need to run. AI models, search, fetch, storage — one key, metered and billed in Credits.'}
					</div>
					<a href={registerUrl} target='_blank' rel='noopener noreferrer' className={styles.introLink}>
						{is_cn ? '没有 Key？前往注册 →' : "Don't have a key? Register now →"}
					</a>
				</div>
			</div>

			{/* Credentials Section */}
			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? '凭证配置' : 'Credentials'}</div>
				</div>

				<div className={styles.card}>
					<div className={styles.formField}>
						<label className={styles.fieldLabel}>API Key</label>
						{!isEditing ? (
							<div className={styles.keyDisplay}>
								<span className={styles.keyText}>{data.key}</span>
								<button type='button' className={styles.keyEditBtn} onClick={handleEditKey}>
									{is_cn ? '修改' : 'Change'}
								</button>
							</div>
						) : (
							<>
								<InputPassword
									schema={keySchema}
									value={apiKey}
									onChange={(val) => setApiKey(String(val))}
								/>
								{hasKey && editingKey && (
									<button type='button' className={styles.keyCancelBtn} onClick={handleCancelEdit}>
										{is_cn ? '取消修改' : 'Cancel'}
									</button>
								)}
							</>
						)}
					</div>

					{isEditing && (
						<div className={styles.actions}>
							<Button type='primary' loading={saving} onClick={handleSave}>
								{is_cn ? '保存' : 'Save'}
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Balance Section */}
			{data.status === 'connected' && (
				<div className={styles.section}>
					<div className={styles.sectionHeader}>
						<div className={styles.sectionTitle}>{is_cn ? '余额' : 'Balance'}</div>
						<button
							type='button'
							className={styles.refreshBtn}
							onClick={handleRefreshBalance}
							disabled={refreshingBalance}
						>
							{refreshingBalance
								? (is_cn ? '查询中...' : 'Refreshing...')
								: (is_cn ? '刷新余额' : 'Refresh Balance')}
						</button>
					</div>

					<div className={styles.card}>
						{data.balance_available ? (
							<>
								<div className={styles.balanceAmount}>
									<span className={styles.balanceValue}>
										{data.balance != null ? data.balance.toLocaleString() : '—'}
									</span>
									<span className={styles.balanceUnit}>credits</span>
								</div>
								{data.balance != null && data.balance <= 0 && (
									<div className={styles.balanceWarning}>
										{is_cn
											? '余额不足时调用付费服务将返回 402 错误'
											: 'Paid service calls will return 402 error when balance is insufficient'}
									</div>
								)}
								<div className={styles.balanceActions}>
									<a
										href={taoUsageUrl(registerUrl)}
										target='_blank'
										rel='noopener noreferrer'
									>
										{is_cn ? '查看用量' : 'View Usage'}
									</a>
									<a
										href={taoBillingUrl(registerUrl)}
										target='_blank'
										rel='noopener noreferrer'
									>
										{is_cn ? '充值' : 'Recharge'}
									</a>
								</div>
							</>
						) : (
							<div className={styles.balanceUnavailable}>
								<span>
									{is_cn ? '余额信息暂不可用' : 'Balance information temporarily unavailable'}
								</span>
								<button
									type='button'
									className={styles.refreshBtn}
									onClick={handleRefreshBalance}
									disabled={refreshingBalance}
								>
									{is_cn ? '重新查询' : 'Retry'}
								</button>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Related Settings */}
			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? '相关配置' : 'Related Settings'}</div>
				</div>

				<div className={styles.card}>
					<div
						className={styles.nextStepItem}
						onClick={() => navigate('/settings/models')}
					>
						<div className={styles.nextStepIcon}>
							<Icon name='material-model_training' size={18} />
						</div>
						<div className={styles.nextStepContent}>
							<div className={styles.nextStepTitle}>
								{is_cn ? '前往模型配置' : 'Go to Model Configuration'}
							</div>
							<div className={styles.nextStepDesc}>
								{is_cn ? '选择默认模型' : 'Choose your default model'}
							</div>
						</div>
						<Icon name='material-chevron_right' size={18} className={styles.nextStepArrow} />
					</div>

					<div
						className={styles.nextStepItem}
						onClick={() => navigate('/settings/search')}
					>
						<div className={styles.nextStepIcon}>
							<Icon name='material-travel_explore' size={18} />
						</div>
						<div className={styles.nextStepContent}>
							<div className={styles.nextStepTitle}>
								{is_cn ? '前往搜索与抓取' : 'Go to Search & Scrape'}
							</div>
							<div className={styles.nextStepDesc}>
								{is_cn ? '选择默认搜索工具' : 'Choose your default search tool'}
							</div>
						</div>
						<Icon name='material-chevron_right' size={18} className={styles.nextStepArrow} />
					</div>
				</div>
			</div>
		</div>
	)
}

export default CloudService
