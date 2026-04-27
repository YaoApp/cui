import { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { message, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { useGlobal } from '@/context/app'
import { getDefaultLogoUrl } from '@/services/wellknown'
import type { SystemInfoData } from '../../types'
import { mockApi } from '../../mockApi'
import styles from './index.less'

const SystemInfo = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()
	const [loading, setLoading] = useState(true)
	const [checking, setChecking] = useState(false)
	const [data, setData] = useState<SystemInfoData | null>(null)
	const [techExpanded, setTechExpanded] = useState(false)

	useEffect(() => {
		mockApi.getSystemInfo().then((res) => {
			setData(res)
			setLoading(false)
		})
	}, [])

	const handleCheckUpdate = async () => {
		setChecking(true)
		try {
			const result = await mockApi.checkUpdate()
			if (result.has_update) {
				message.info(
					is_cn
						? `发现新版本 ${result.latest_version}，请前往官网下载`
						: `New version ${result.latest_version} available, please download from website`
				)
			} else {
				message.success(is_cn ? '已是最新版本' : 'Already up to date')
			}
		} finally {
			setChecking(false)
		}
	}

	const deploymentLabel = (type: SystemInfoData['deployment']) => {
		const map = {
			community: is_cn ? '社区版' : 'Community',
			enterprise: is_cn ? '企业版' : 'Enterprise',
			cloud: 'Cloud'
		}
		return map[type]
	}

	const envLabel = (env: SystemInfoData['environment']) => {
		return env === 'production'
			? is_cn ? '正式环境' : 'Production'
			: is_cn ? '测试环境' : 'Development'
	}

	if (loading || !data) {
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
								{deploymentLabel(data.deployment)}
							</span>
						</div>
						<div className={styles.appDesc}>{data.app.description}</div>
					</div>
				</div>

				{data.deployment === 'community' && (
					<div className={styles.ctaBanner}>
						<div className={styles.ctaContent}>
							<div className={styles.ctaTitle}>
								{is_cn ? '升级到企业版' : 'Upgrade to Enterprise'}
							</div>
							<div className={styles.ctaDesc}>
								{is_cn
									? '解锁多租户、SSO、审计、SLA 支持等高级功能'
									: 'Unlock multi-tenancy, SSO, audit, SLA support and more'}
							</div>
						</div>
						<a
							href='https://yaoagents.com/enterprise'
							target='_blank'
							rel='noopener noreferrer'
							className={styles.ctaLink}
						>
							{is_cn ? '了解更多 →' : 'Learn more →'}
						</a>
					</div>
				)}
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
									{envLabel(data.environment)}
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
