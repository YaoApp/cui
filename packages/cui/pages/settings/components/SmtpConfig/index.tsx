import { useState, useEffect, useMemo, useCallback } from 'react'
import { getLocale } from '@umijs/max'
import { message, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { Input, InputPassword, Select, RadioGroup } from '@/components/ui/inputs'
import type { PropertySchema } from '@/components/ui/inputs/types'
import { Setting } from '@/openapi/setting'
import type { SmtpPageData, SmtpPreset } from '@/openapi/setting/types'
import styles from './index.less'

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

function toBackendLocale(locale: string): string {
	return locale.toLowerCase()
}

const SmtpConfig = () => {
	const is_cn = getLocale() === 'zh-CN'
	const backendLocale = toBackendLocale(getLocale())

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [sendingTest, setSendingTest] = useState(false)
	const [pageData, setPageData] = useState<SmtpPageData | null>(null)

	const [presetKey, setPresetKey] = useState('custom')
	const [host, setHost] = useState('')
	const [port, setPort] = useState(465)
	const [encryption, setEncryption] = useState<'ssl' | 'tls' | 'none'>('ssl')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [fromName, setFromName] = useState('')
	const [fromEmail, setFromEmail] = useState('')
	const [testEmail, setTestEmail] = useState('')
	const [lastTestResult, setLastTestResult] = useState<{ success: boolean; time: string } | null>(null)

	const [editing, setEditing] = useState(false)

	const configSaved = !!(pageData?.config?.username || pageData?.config?.host)

	const loadData = useCallback(async () => {
		const api = getSettingAPI()
		if (!api) return
		try {
			const resp = await api.GetSmtpConfig(backendLocale)
			if (resp.data) {
				setPageData(resp.data)
				const c = resp.data.config
				setPresetKey(c.preset_key)
				setHost(c.host)
				setPort(c.port)
				setEncryption(c.encryption as any)
				setUsername(c.username)
				setPassword('')
				setFromName(c.from_name)
				setFromEmail(c.from_email)
				setEditing(!c.username && !c.host)
				if (c.last_sent_at) {
					setLastTestResult({ success: true, time: c.last_sent_at })
				}
			} else if (resp.error) {
				message.error(resp.error.error_description || (is_cn ? '加载失败' : 'Load failed'))
			}
		} finally {
			setLoading(false)
		}
	}, [is_cn, backendLocale])

	useEffect(() => {
		loadData()
	}, [loadData])

	const currentPreset = useMemo(
		() => pageData?.presets.find((p) => p.key === presetKey),
		[pageData, presetKey]
	)
	const isCustom = presetKey === 'custom'

	const handlePresetChange = (val: unknown) => {
		const key = String(val || 'custom')
		setPresetKey(key)
		const preset = pageData?.presets.find((p: SmtpPreset) => p.key === key)
		if (preset) {
			setHost(preset.host)
			setPort(preset.port)
			setEncryption(preset.encryption as any)
		}
	}

	const buildConfig = () => ({
		preset_key: presetKey, host, port, encryption,
		username, password, from_name: fromName, from_email: fromEmail
	})

	const handleStartEdit = () => {
		setEditing(true)
		setPassword('')
	}

	const handleCancelEdit = () => {
		if (!pageData) return
		const c = pageData.config
		setPresetKey(c.preset_key)
		setHost(c.host)
		setPort(c.port)
		setEncryption(c.encryption as any)
		setUsername(c.username)
		setPassword('')
		setFromName(c.from_name)
		setFromEmail(c.from_email)
		setEditing(false)
	}

	const handleSave = async () => {
		const api = getSettingAPI()
		if (!api) return

		setSaving(true)
		try {
			const resp = await api.SaveSmtpConfig(buildConfig())
			if (resp.error) {
				message.error(resp.error.error_description || (is_cn ? '保存失败' : 'Save failed'))
				return
			}
			if (resp.data) {
				setPageData((prev) => prev ? { ...prev, config: resp.data! } : prev)
				setPassword('')
				setEditing(false)
			}
			message.success(is_cn ? '保存成功' : 'Saved')
		} finally {
			setSaving(false)
		}
	}

	const handleTestSend = async () => {
		if (!testEmail.trim()) {
			message.warning(is_cn ? '请填写收件邮箱' : 'Please enter recipient email')
			return
		}
		const api = getSettingAPI()
		if (!api) return

		setSendingTest(true)
		try {
			const resp = await api.TestSmtp({ to_email: testEmail })
			if (resp.data?.success) {
				message.success(is_cn ? '测试邮件发送成功' : 'Test email sent successfully')
				setLastTestResult({ success: true, time: new Date().toISOString() })
				await loadData()
			} else {
				const errMsg = resp.data?.message || resp.error?.error_description || (is_cn ? '发送失败' : 'Send failed')
				message.error(errMsg)
				setLastTestResult({ success: false, time: new Date().toISOString() })
			}
		} finally {
			setSendingTest(false)
		}
	}

	const presetSchema = useMemo((): PropertySchema => {
		if (!pageData) return { type: 'string', enum: [] }
		return {
			type: 'string',
			enum: pageData.presets.map((p) => ({ label: p.name, value: p.key }))
		}
	}, [pageData])

	const encryptionSchema = useMemo((): PropertySchema => ({
		type: 'string',
		enum: [
			{ label: 'SSL (465)', value: 'ssl' },
			{ label: 'TLS (587)', value: 'tls' },
			{ label: is_cn ? '无加密' : 'None', value: 'none' }
		]
	}), [is_cn])

	const textSchema = useMemo((): PropertySchema => ({ type: 'string' }), [])
	const pwdSchema = useMemo((): PropertySchema => ({ type: 'string' }), [])

	const statusLabel = () => {
		if (!pageData) return null
		const map: Record<string, { text: string; cls: string }> = {
			connected: { text: is_cn ? '已连接' : 'Connected', cls: styles.status_connected },
			disconnected: { text: is_cn ? '连接失败' : 'Disconnected', cls: styles.status_disconnected },
			unconfigured: { text: is_cn ? '未配置' : 'Not configured', cls: styles.status_unconfigured }
		}
		return map[pageData.config.status]
	}

	const encryptionLabel = (val: string) => {
		const map: Record<string, string> = { ssl: 'SSL (465)', tls: 'TLS (587)', none: is_cn ? '无加密' : 'None' }
		return map[val] || val
	}

	const presetNameByKey = (key: string) => {
		const p = pageData?.presets.find((pr) => pr.key === key)
		return p?.name || key
	}

	const formatTimeDiff = (iso: string) => {
		const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
		if (diff < 1) return is_cn ? '刚刚' : 'just now'
		if (diff < 60) return is_cn ? `${diff} 分钟前` : `${diff}m ago`
		return is_cn ? `${Math.round(diff / 60)} 小时前` : `${Math.round(diff / 60)}h ago`
	}

	if (loading || !pageData) {
		return (
			<div className={styles.smtpConfig}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? '邮箱配置' : 'Email'}</h2>
						<p>{is_cn ? '配置 SMTP 邮件服务，用于发送验证码、通知、邀请等邮件' : 'Configure SMTP for verification, notifications and invitations'}</p>
					</div>
				</div>
				<div className={styles.loadingState}>
					<Spin size='small' />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	const status = statusLabel()

	return (
		<div className={styles.smtpConfig}>
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '邮箱配置' : 'Email'}</h2>
					<p>{is_cn ? '配置 SMTP 邮件服务，用于发送验证码、通知、邀请等邮件' : 'Configure SMTP for verification, notifications and invitations'}</p>
				</div>
				{status && <span className={`${styles.statusBadge} ${status.cls}`}>{status.text}</span>}
			</div>

			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? 'SMTP 配置' : 'SMTP CONFIGURATION'}</div>
				</div>
				<div className={styles.card}>
					{!editing ? (
						<>
							<div className={styles.viewField}>
								<label className={styles.viewLabel}>{is_cn ? '服务商' : 'Provider'}</label>
								<span className={styles.viewValue}>{presetNameByKey(pageData.config.preset_key)}</span>
							</div>

							{currentPreset?.hint && (
								<div className={styles.presetHint}>
									<div className={styles.presetHintContent}>
										<Icon name='material-info' size={14} />
										<span>{is_cn ? currentPreset.hint['zh-CN'] : currentPreset.hint['en-US']}</span>
									</div>
									{currentPreset.url && (
										<a href={currentPreset.url} target='_blank' rel='noopener noreferrer' className={styles.presetHintLink}>
											{is_cn ? '官网' : 'Website'}
											<Icon name='material-open_in_new' size={12} />
										</a>
									)}
								</div>
							)}

							{isCustom && (
								<div className={styles.viewRow}>
									<div className={styles.viewField}>
										<label className={styles.viewLabel}>Host</label>
										<span className={styles.viewValue}>{pageData.config.host}</span>
									</div>
									<div className={styles.viewField}>
										<label className={styles.viewLabel}>Port</label>
										<span className={styles.viewValue}>{pageData.config.port}</span>
									</div>
									<div className={styles.viewField}>
										<label className={styles.viewLabel}>{is_cn ? '加密' : 'Encryption'}</label>
										<span className={styles.viewValue}>{encryptionLabel(pageData.config.encryption)}</span>
									</div>
								</div>
							)}

							<div className={styles.viewField}>
								<label className={styles.viewLabel}>{is_cn ? '用户名' : 'Username'}</label>
								<span className={styles.viewValue}>{pageData.config.username}</span>
							</div>

							<div className={styles.viewField}>
								<label className={styles.viewLabel}>{is_cn ? '密码' : 'Password'}</label>
								<span className={styles.viewValue}>••••••••</span>
							</div>

							<div className={styles.viewField}>
								<label className={styles.viewLabel}>{is_cn ? '发件人名称' : 'Sender Name'}</label>
								<span className={styles.viewValue}>{pageData.config.from_name || '-'}</span>
							</div>

							<div className={styles.viewField}>
								<label className={styles.viewLabel}>{is_cn ? '发件邮箱' : 'Sender Email'}</label>
								<span className={styles.viewValue}>{pageData.config.from_email || '-'}</span>
							</div>

							<div className={styles.actions}>
								<button type='button' className={styles.keyEditBtn} onClick={handleStartEdit}>
									{is_cn ? '修改' : 'Change'}
								</button>
							</div>
						</>
					) : (
						<>
							<div className={styles.formField}>
								<label className={styles.fieldLabel}>
									{is_cn ? '服务商' : 'Provider'}
									<span className={styles.fieldHint}>
										{is_cn ? '选择后自动填入服务器信息，如需自定义请选「自定义」' : 'Auto-fills server info. Choose "Custom" for manual input.'}
									</span>
								</label>
								<Select schema={presetSchema} value={presetKey} onChange={handlePresetChange} />
							</div>

							{currentPreset?.hint && (
								<div className={styles.presetHint}>
									<div className={styles.presetHintContent}>
										<Icon name='material-info' size={14} />
										<span>{is_cn ? currentPreset.hint['zh-CN'] : currentPreset.hint['en-US']}</span>
									</div>
									{currentPreset.url && (
										<a href={currentPreset.url} target='_blank' rel='noopener noreferrer' className={styles.presetHintLink}>
											{is_cn ? '官网' : 'Website'}
											<Icon name='material-open_in_new' size={12} />
										</a>
									)}
								</div>
							)}

							{isCustom && (
								<>
									<div className={styles.formRow}>
										<div className={`${styles.formField} ${styles.formFieldFlex}`}>
											<label className={styles.fieldLabel}>Host</label>
											<Input
												schema={textSchema}
												value={host}
												onChange={(v) => setHost(String(v || ''))}
											/>
										</div>
										<div className={`${styles.formField} ${styles.formFieldSmall}`}>
											<label className={styles.fieldLabel}>Port</label>
											<Input
												schema={textSchema}
												value={String(port)}
												onChange={(v) => setPort(Number(v) || 465)}
											/>
										</div>
									</div>

									<div className={styles.formField}>
										<label className={styles.fieldLabel}>{is_cn ? '加密方式' : 'Encryption'}</label>
										<RadioGroup
											schema={encryptionSchema}
											value={encryption}
											onChange={(v) => setEncryption(String(v) as any)}
										/>
									</div>
								</>
							)}

							<div className={styles.formField}>
								<label className={styles.fieldLabel}>{is_cn ? '用户名' : 'Username'}</label>
								<Input schema={textSchema} value={username} onChange={(v) => setUsername(String(v || ''))} />
							</div>

							<div className={styles.formField}>
								<label className={styles.fieldLabel}>
									{is_cn ? '密码' : 'Password'}
									<span className={styles.fieldHint}>
										{is_cn
											? '请按服务商文档指引填写，通常为授权码或应用专用密码，非登录密码'
											: 'Use the credential from your provider docs — usually an app password or auth code, not your login password'}
									</span>
								</label>
								<InputPassword schema={pwdSchema} value={password} onChange={(v) => setPassword(String(v || ''))} />
							</div>

							<div className={styles.formField}>
								<label className={styles.fieldLabel}>{is_cn ? '发件人名称' : 'Sender Name'}</label>
								<Input schema={textSchema} value={fromName} onChange={(v) => setFromName(String(v || ''))} />
							</div>

							<div className={styles.formField}>
								<label className={styles.fieldLabel}>{is_cn ? '发件邮箱' : 'Sender Email'}</label>
								<Input schema={textSchema} value={fromEmail} onChange={(v) => setFromEmail(String(v || ''))} />
							</div>

							<div className={styles.editActions}>
								<div className={styles.editActionsLeft}>
									{configSaved && (
										<button type='button' className={styles.keyCancelBtn} onClick={handleCancelEdit}>
											{is_cn ? '取消' : 'Cancel'}
										</button>
									)}
								</div>
								<div className={styles.editActionsRight}>
									<Button type='primary' loading={saving} onClick={handleSave} size='small'>
										{is_cn ? '保存' : 'Save'}
									</Button>
								</div>
							</div>
						</>
					)}
				</div>
			</div>

			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? '测试发送' : 'TEST'}</div>
				</div>
				<div className={styles.card}>
					<label className={styles.fieldLabel}>{is_cn ? '收件人' : 'Recipient'}</label>
					<div className={styles.testRow}>
						<div className={styles.testField}>
							<Input schema={textSchema} value={testEmail} onChange={(v) => setTestEmail(String(v || ''))} />
						</div>
						<Button type='default' loading={sendingTest} onClick={handleTestSend} className={styles.testBtn}>
							{is_cn ? '发送测试邮件' : 'Send Test'}
						</Button>
					</div>
					{lastTestResult && (
						<div className={`${styles.testResult} ${lastTestResult.success ? styles.testSuccess : styles.testFail}`}>
							<Icon name={lastTestResult.success ? 'material-check_circle' : 'material-error'} size={14} />
							<span>
								{lastTestResult.success
									? (is_cn ? `成功（${formatTimeDiff(lastTestResult.time)}）` : `Sent (${formatTimeDiff(lastTestResult.time)})`)
									: (is_cn ? `失败（${formatTimeDiff(lastTestResult.time)}）` : `Failed (${formatTimeDiff(lastTestResult.time)})`)
								}
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default SmtpConfig
