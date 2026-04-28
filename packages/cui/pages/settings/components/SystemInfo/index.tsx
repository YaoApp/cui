import { useState, useEffect, useRef } from 'react'
import { getLocale } from '@umijs/max'
import { message, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { useGlobal } from '@/context/app'
import { getDefaultLogoUrl } from '@/services/wellknown'
import { Setting } from '@/openapi/setting'
import type { SystemInfoData } from '../../types'
import styles from './index.less'

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

const SystemInfo = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()
	const [loading, setLoading] = useState(true)
	const [checking, setChecking] = useState(false)
	const [data, setData] = useState<SystemInfoData | null>(null)
	const [techExpanded, setTechExpanded] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const retryRef = useRef(0)

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
						setError(is_cn ? 'OpenAPI 未就绪' : 'OpenAPI not ready')
						setLoading(false)
					}
				}
				return
			}

			const apiLocale = locale === 'zh-CN' ? 'zh-cn' : 'en-us'
			api.GetSystemInfo(apiLocale)
				.then((res) => {
					if (cancelled) return
					if (res.data) {
						setData(res.data)
					} else {
						setError(res.error?.error_description || 'Failed to load system info')
					}
					setLoading(false)
				})
				.catch((err) => {
					if (cancelled) return
					setError(err?.message || 'Network error')
					setLoading(false)
				})
		}

		load()
		return () => { cancelled = true }
	}, [])

	const handleCheckUpdate = async () => {
		const api = getSettingAPI()
		if (!api) return
		setChecking(true)
		try {
			const res = await api.CheckUpdate()
			const result = res.data
			if (result?.has_update) {
				const url = 'https://yaoagents.com/?source=yao-upgrade'
				message.info(
					<span>
						{is_cn
							? `发现新版本 ${result.latest_version}，`
							: `New version ${result.latest_version} available, `}
						<a href={url} target='_blank' rel='noopener noreferrer'>
							{is_cn ? '前往下载' : 'Download'}
						</a>
					</span>
				)
			} else {
				message.success(is_cn ? '已是最新版本' : 'Already up to date')
			}
		} catch {
			message.error(is_cn ? '检查更新失败' : 'Failed to check for updates')
		} finally {
			setChecking(false)
		}
	}

	

	if (loading) {
		return (
			<div className={styles.systemInfo}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '系统信息' : 'System Info'}</h2>
						<p>{is_cn ? '查看应用版本、运行环境和系统状态' : 'View app version, runtime environment and system status'}</p>
					</div>
				</div>
				<div className={styles.loadingState}>
					<Spin size='small' />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	if (error || !data) {
		return (
			<div className={styles.systemInfo}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '系统信息' : 'System Info'}</h2>
						<p>{is_cn ? '查看应用版本、运行环境和系统状态' : 'View app version, runtime environment and system status'}</p>
					</div>
				</div>
				<div className={styles.loadingState}>
					<span>{error || (is_cn ? '加载失败' : 'Failed to load')}</span>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.systemInfo}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '系统信息' : 'System Info'}</h2>
					<p>{is_cn ? '查看应用版本、运行环境和系统状态' : 'View app version, runtime environment and system status'}</p>
				</div>
			</div>

			{/* App Info Card */}
			<div className={styles.card}>
				<div className={styles.appCard}>
					<div className={styles.appLogo}>
						<img
							src={global.app_info?.logo || getDefaultLogoUrl()}
							alt={data.app.name}
							onError={(e) => { e.currentTarget.style.display = 'none' }}
						/>
					</div>
					<div className={styles.appInfo}>
						<div className={styles.appNameRow}>
							<h3>{data.app.name}</h3>
							<span className={styles.appVersion}>v{data.app.version}</span>
							<span className={`${styles.badge} ${styles[`badge_${data.deployment}`]}`}>
								{data.deployment_label || data.deployment}
							</span>
						</div>
						<div className={styles.appDesc}>{data.app.description}</div>
					</div>
				</div>

				{data.promotions?.map((promo) => (
					<div key={promo.id} className={styles.ctaBanner}>
						<div className={styles.ctaContent}>
							<div className={styles.ctaTitle}>{promo.title}</div>
							<div className={styles.ctaDesc}>{promo.desc}</div>
						</div>
						<a
							href={promo.link}
							target='_blank'
							rel='noopener noreferrer'
							className={styles.ctaLink}
						>
							{promo.label}
						</a>
					</div>
				))}
			</div>

			{/* Version Section */}
			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? '版本' : 'Version'}</div>
					<Button
						type='default'
						size='small'
						loading={checking}
						onClick={handleCheckUpdate}
					>
						{is_cn ? '检查更新' : 'Check for Updates'}
					</Button>
				</div>
				<div className={styles.card}>
					<div className={styles.fieldRow}>
						<div className={styles.fieldIcon}>
							<Icon name='material-dns' size={16} />
						</div>
						<div className={styles.fieldContent}>
							<div className={styles.fieldLabel}>Yao Engine</div>
							<div className={styles.fieldValue}>
								v{data.server.version}
								<span className={styles.fieldMeta}>
									Built: {data.server.build_date} · Commit: {data.server.commit}
								</span>
							</div>
						</div>
					</div>
					<div className={styles.fieldRow}>
						<div className={styles.fieldIcon}>
							<Icon name='material-web' size={16} />
						</div>
						<div className={styles.fieldContent}>
							<div className={styles.fieldLabel}>CUI (Chat UI Framework)</div>
							<div className={styles.fieldValue}>
								v{data.client.version}
								<span className={styles.fieldMeta}>
									Built: {data.client.build_date} · Commit: {data.client.commit}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Environment Section */}
			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? '运行环境' : 'Environment'}</div>
				</div>
				<div className={styles.card}>
					<div className={styles.fieldRow}>
						<div className={styles.fieldIcon}>
							<Icon name='material-settings_suggest' size={16} />
						</div>
						<div className={styles.fieldContent}>
							<div className={styles.fieldLabel}>{is_cn ? '环境' : 'Environment'}</div>
							<div className={styles.fieldValue}>
								<span className={`${styles.badge} ${styles[`badge_${data.environment}`]}`}>
									{data.environment_label || data.environment}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Technical Details Section (Collapsible) */}
			<div className={styles.section}>
				<div
					className={styles.collapsibleHeader}
					onClick={() => setTechExpanded(!techExpanded)}
				>
					<Icon
						name={techExpanded ? 'material-expand_more' : 'material-chevron_right'}
						size={18}
					/>
					<span className={styles.sectionTitle}>
						{is_cn ? '运行信息' : 'Runtime Info'}
					</span>
				</div>
				{techExpanded && (
					<div className={styles.card}>
						<div className={styles.fieldRow}>
							<div className={styles.fieldIcon}>
								<Icon name='material-language' size={16} />
							</div>
							<div className={styles.fieldContent}>
								<div className={styles.fieldLabel}>{is_cn ? '监听地址' : 'Listen Address'}</div>
								<div className={styles.fieldValue}>
									<code>{data.technical.listen}</code>
								</div>
							</div>
						</div>
						<div className={styles.fieldRow}>
							<div className={styles.fieldIcon}>
								<Icon name='material-storage' size={16} />
							</div>
							<div className={styles.fieldContent}>
								<div className={styles.fieldLabel}>{is_cn ? '数据库' : 'Database'}</div>
								<div className={styles.fieldValue}>
									<code>{data.technical.db_driver}</code>
								</div>
							</div>
						</div>
						<div className={`${styles.fieldRow} ${styles.fieldRowLast}`}>
							<div className={styles.fieldIcon}>
								<Icon name='material-memory' size={16} />
							</div>
							<div className={styles.fieldContent}>
								<div className={styles.fieldLabel}>Session {is_cn ? '存储' : 'Store'}</div>
								<div className={styles.fieldValue}>
									<code>{data.technical.session_store}</code>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* License Key (Enterprise only) */}
			{data.deployment === 'enterprise' && data.license_key && (
				<div className={styles.section}>
					<div className={styles.sectionHeader}>
						<div className={styles.sectionTitle}>License</div>
					</div>
					<div className={styles.card}>
						<div className={styles.fieldRow}>
							<div className={styles.fieldIcon}>
								<Icon name='material-vpn_key' size={16} />
							</div>
							<div className={styles.fieldContent}>
								<div className={styles.fieldLabel}>License Key</div>
								<div className={styles.fieldValue}>
									<code>{data.license_key}</code>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default SystemInfo
