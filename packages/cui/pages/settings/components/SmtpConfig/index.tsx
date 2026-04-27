import { useState, useEffect, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import { message, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { Input, InputPassword, Select, RadioGroup } from '@/components/ui/inputs'
import type { PropertySchema } from '@/components/ui/inputs/types'
import type { SmtpPageData, SmtpPreset } from '../../types'
import { mockApi } from '../../mockApi'
import styles from './index.less'

const SmtpConfig = () => {
	const is_cn = getLocale() === 'zh-CN'

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

	useEffect(() => {
		mockApi.getSmtpConfig().then((res) => {
			setPageData(res)
			const c = res.config
			setPresetKey(c.preset_key)
			setHost(c.host)
			setPort(c.port)
			setEncryption(c.encryption)
			setUsername(c.username)
			setPassword(c.password)
			setFromName(c.from_name)
			setFromEmail(c.from_email)
			if (c.last_sent_at) {
				setLastTestResult({ success: true, time: c.last_sent_at })
			}
			setLoading(false)
		})
	}, [])

	const currentPreset = useMemo(
		() => pageData?.presets.find((p) => p.key === presetKey),
		[pageData, presetKey]
	)
	const isCustom = presetKey === 'custom'
	const serverFieldsDisabled = !isCustom

	const handlePresetChange = (val: unknown) => {
		const key = String(val || 'custom')
		setPresetKey(key)
		const preset = pageData?.presets.find((p: SmtpPreset) => p.key === key)
		if (preset) {
			setHost(preset.host)
			setPort(preset.port)
			setEncryption(preset.encryption)
		}
	}

	const buildConfig = () => ({
		preset_key: presetKey, host, port, encryption,
		username, password, from_name: fromName, from_email: fromEmail
	})

	const handleSave = async () => {
		setSaving(true)
		try {
			const result = await mockApi.saveSmtpConfig(buildConfig())
			setPageData((prev) => prev ? { ...prev, config: result } : prev)
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
		setSendingTest(true)
		try {
			const result = await mockApi.testSmtp(testEmail)
			if (result.success) {
				message.success(is_cn ? '测试邮件发送成功，配置已自动保存' : 'Test email sent, config saved')
				const saved = await mockApi.saveSmtpConfig(buildConfig())
				setPageData((prev) => prev ? { ...prev, config: saved } : prev)
				setLastTestResult({ success: true, time: new Date().toISOString() })
			} else {
				message.error(result.message)
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
	const readonlySchema = useMemo((): PropertySchema => ({ type: 'string', readOnly: true }), [])

	const statusLabel = () => {
		if (!pageData) return null
		const map: Record<string, { text: string; cls: string }> = {
			connected: { text: is_cn ? '已连接' : 'Connected', cls: styles.status_connected },
			disconnected: { text: is_cn ? '连接失败' : 'Disconnected', cls: styles.status_disconnected },
			unconfigured: { text: is_cn ? '未配置' : 'Not configured', cls: styles.status_unconfigured }
		}
		return map[pageData.config.status]
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

					<div className={styles.formRow}>
						<div className={`${styles.formField} ${styles.formFieldFlex}`}>
							<label className={styles.fieldLabel}>Host</label>
							<Input
								schema={serverFieldsDisabled ? readonlySchema : textSchema}
								value={host}
								onChange={(v) => setHost(String(v || ''))}
							/>
						</div>
						<div className={`${styles.formField} ${styles.formFieldSmall}`}>
							<label className={styles.fieldLabel}>Port</label>
							<Input
								schema={serverFieldsDisabled ? readonlySchema : textSchema}
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

					<div className={styles.formField}>
						<label className={styles.fieldLabel}>{is_cn ? '用户名' : 'Username'}</label>
						<Input schema={textSchema} value={username} onChange={(v) => setUsername(String(v || ''))} />
					</div>

					<div className={styles.formField}>
						<label className={styles.fieldLabel}>{is_cn ? '密码' : 'Password'}</label>
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

					<div className={styles.actions}>
						<Button type='primary' loading={saving} onClick={handleSave}>
							{is_cn ? '保存' : 'Save'}
						</Button>
					</div>
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
									? (is_cn ? `成功（${formatTimeDiff(lastTestResult.time)}）· 配置已自动保存` : `Sent (${formatTimeDiff(lastTestResult.time)}) · Auto-saved`)
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
