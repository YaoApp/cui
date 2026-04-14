import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Input, InputPassword } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import { brandIcons } from '@/assets/icons/brands'
import WeixinQRModal from './WeixinQRModal'
import hljsCore from 'highlight.js/lib/core'
import hljsBash from 'highlight.js/lib/languages/bash'
import hljsTs from 'highlight.js/lib/languages/typescript'
import hljsPython from 'highlight.js/lib/languages/python'
hljsCore.registerLanguage('bash', hljsBash)
hljsCore.registerLanguage('typescript', hljsTs)
hljsCore.registerLanguage('python', hljsPython)
const hljs = hljsCore
import type { RobotState } from '../../../../../types'
import styles from '../index.less'

type CodeLang = 'curl' | 'typescript' | 'python'

function buildCode(lang: CodeLang, baseURL: string, robotId: string): string {
	const endpoint = `${baseURL}/v1/agent/robots/${robotId}/completions`
	switch (lang) {
		case 'curl':
			return `curl ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $YAO_API_KEY" \\
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'`
		case 'typescript':
			return `import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: '${baseURL}/v1/agent/robots/${robotId}',
  apiKey: process.env.YAO_API_KEY,
})

const stream = await client.chat.completions.create({
  model: 'default',
  messages: [{ role: 'user', content: 'Hello' }],
  stream: true,
})`
		case 'python':
			return `from openai import OpenAI

client = OpenAI(
    base_url="${baseURL}/v1/agent/robots/${robotId}",
    api_key=os.environ["YAO_API_KEY"],
)

stream = client.chat.completions.create(
    model="default",
    messages=[{"role": "user", "content": "Hello"}],
    stream=True,
)`
	}
}

function buildExecuteCode(lang: CodeLang, baseURL: string, robotId: string): string {
	const endpoint = `${baseURL}/v1/agent/robots/${robotId}/execute`
	switch (lang) {
		case 'curl':
			return `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $YAO_API_KEY" \\
  -d '{
    "goals": "Analyze competitors and generate a report",
    "context": { "format": "markdown" },
    "chat_id": "chat-session-id"
  }'`
		case 'typescript':
			return `const res = await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: \`Bearer \${process.env.YAO_API_KEY}\`,
  },
  body: JSON.stringify({
    goals: 'Analyze competitors and generate a report',
    context: { format: 'markdown' },
    chat_id: 'chat-session-id',
  }),
})
const { execution_id, status } = await res.json()`
		case 'python':
			return `import requests, os

resp = requests.post(
    "${endpoint}",
    headers={"Authorization": f"Bearer {os.environ['YAO_API_KEY']}"},
    json={
        "goals": "Analyze competitors and generate a report",
        "context": {"format": "markdown"},
        "chat_id": "chat-session-id",
    },
)
data = resp.json()
execution_id = data["execution_id"]`
	}
	return ''
}

const LANG_LABELS: Record<CodeLang, string> = {
	curl: 'HTTP',
	typescript: 'TypeScript',
	python: 'Python'
}

const HLJS_LANG: Record<CodeLang, string> = {
	curl: 'bash',
	typescript: 'typescript',
	python: 'python'
}

interface ApiAccessGroupProps {
	robot: RobotState
	is_cn: boolean
}

const ApiAccessGroup: React.FC<ApiAccessGroupProps> = ({ robot, is_cn }) => {
	const [lang, setLang] = useState<CodeLang>('curl')
	const [copied, setCopied] = useState(false)
	const [exLang, setExLang] = useState<CodeLang>('curl')
	const [exCopied, setExCopied] = useState(false)
	const [serverURL, setServerURL] = useState<string>(window.location.origin)

	useEffect(() => {
		fetch('/.well-known/yao')
			.then((r) => r.json())
			.then((meta: any) => {
				if (meta?.server_url) setServerURL(meta.server_url)
			})
			.catch(() => {})
	}, [])

	const baseURL = serverURL
	const robotId = robot?.member_id || '<robot_id>'

	const chatCode = buildCode(lang, baseURL, robotId)
	const executeCode = buildExecuteCode(exLang, baseURL, robotId)

	const chatHighlighted = useMemo(() => {
		try { return hljs.highlight(chatCode, { language: HLJS_LANG[lang] }).value } catch { return chatCode }
	}, [chatCode, lang])

	const executeHighlighted = useMemo(() => {
		try { return hljs.highlight(executeCode, { language: HLJS_LANG[exLang] }).value } catch { return executeCode }
	}, [executeCode, exLang])

	const handleCopy = (code: string, setCb: (v: boolean) => void) => {
		navigator.clipboard.writeText(code).then(() => {
			setCb(true)
			setTimeout(() => setCb(false), 1500)
		})
	}

	const CodeBlock = (
		{ code, highlighted, lang, setLang, copied, onCopy }: {
			code: string; highlighted: string; lang: CodeLang
			setLang: (l: CodeLang) => void; copied: boolean; onCopy: () => void
		}
	) => (
		<>
			<div className={styles.apiCodeToolbar}>
				<div className={styles.apiCodeLangs}>
					{(Object.keys(LANG_LABELS) as CodeLang[]).map((l) => (
						<button
							key={l}
							className={`${styles.apiCodeLangBtn} ${lang === l ? styles.apiCodeLangBtnActive : ''}`}
							onClick={() => setLang(l)}
						>
							{LANG_LABELS[l]}
						</button>
					))}
				</div>
				<button className={styles.apiCodeCopyBtn} onClick={onCopy}>
					<Icon name={copied ? 'material-check' : 'material-content_copy'} size={13} />
				</button>
			</div>
			<div className={styles.apiCodeBody}>
				<pre className={`${styles.apiCodePre} api-code-pre`}>
					<code dangerouslySetInnerHTML={{ __html: highlighted }} />
				</pre>
			</div>
		</>
	)

	return (
		<>
			{/* ── Chat Completions ─────────────────────────── */}
			<div className={styles.apiAccessGroup}>
				<div className={styles.apiAccessHeader}>
					<div className={styles.apiAccessTitle}>
						{is_cn ? 'Chat 对话' : 'Chat Completions'}
					</div>
					<div className={styles.apiAccessHint}>
						{is_cn
							? '与 Host Agent 对话，完成目标确认。兼容 OpenAI Chat Completion 协议，支持流式输出'
							: 'Chat with Host Agent for goal clarification and confirmation. OpenAI-compatible, streaming supported'}
					</div>
				</div>
				<CodeBlock
					code={chatCode}
					highlighted={chatHighlighted}
					lang={lang}
					setLang={setLang}
					copied={copied}
					onCopy={() => handleCopy(chatCode, setCopied)}
				/>
				<div className={styles.apiBaseURL}>
					<span className={styles.apiBaseURLLabel}>Endpoint</span>
					<code className={styles.apiBaseURLValue}>
						POST {baseURL}/v1/agent/robots/{robotId}/completions
					</code>
				</div>
			</div>

			{/* ── Execute ──────────────────────────────────── */}
			<div className={styles.apiAccessGroup} style={{ marginTop: 12 }}>
				<div className={styles.apiAccessHeader}>
					<div className={styles.apiAccessTitle}>
						{is_cn ? '直接执行' : 'Execute'}
					</div>
					<div className={styles.apiAccessHint}>
						{is_cn
							? '跳过对话流程，直接以指定目标触发 Robot 执行，Host Agent 确认目标后由 CUI 调用'
							: 'Trigger robot execution directly with confirmed goals, bypassing the chat flow'}
					</div>
				</div>
				<CodeBlock
					code={executeCode}
					highlighted={executeHighlighted}
					lang={exLang}
					setLang={setExLang}
					copied={exCopied}
					onCopy={() => handleCopy(executeCode, setExCopied)}
				/>
				<div className={styles.apiBaseURL}>
					<span className={styles.apiBaseURLLabel}>Endpoint</span>
					<code className={styles.apiBaseURLValue}>
						POST {baseURL}/v1/agent/robots/{robotId}/execute
					</code>
				</div>
			</div>
		</>
	)
}

interface IntegrationPanelProps {
	robot: RobotState
	formData: Record<string, any>
	onChange: (field: string, value: any) => void
	is_cn: boolean
}

// Each platform card: key maps to robot_config.integrations.<key>
interface PlatformConfig {
	key: string
	name_cn: string
	name_en: string
	desc_cn: string
	desc_en: string
	/** Docs path relative to https://yaoagents.com/docs/ */
	docsPath: string
	/** Circle background color */
	iconBg?: string
	/** Icon padding inside the circle, e.g. '6px' — adjust per-logo optical size */
	iconPadding?: string
	fields: FieldDef[]
	/** If true, uses QR code scan login instead of credential fields */
	scanLogin?: boolean
}

interface FieldDef {
	key: string // sub-key under integrations.<platform>.<key>
	label: string
	placeholder_cn: string
	placeholder_en: string
	secret?: boolean // render as password field
	required?: boolean
}

const DOCS_BASE = 'https://yaoagents.com/docs'

const PLATFORMS: PlatformConfig[] = [
	// ── WeChat (always first) ─────────────────────────────────────────────
	{
		key: 'weixin',
		name_cn: '微信',
		name_en: 'WeChat',
		iconBg: '#07C160',
		iconPadding: '5px',
		desc_cn: '通过扫码连接微信，直接在微信中与任务智能体对话',
		desc_en: 'Scan QR code to connect WeChat and chat with the Agent directly',
		docsPath: 'integrations/weixin',
		scanLogin: true,
		fields: []
	},
	// ── Chinese locale platforms ───────────────────────────────────────────
	{
		key: 'dingtalk',
		name_cn: '钉钉',
		name_en: 'DingTalk',
		iconBg: '#0285FC',
		iconPadding: '6px',
		desc_cn: '连接钉钉企业内部机器人，支持群消息和单聊',
		desc_en: 'Connect a DingTalk enterprise bot for group and direct messaging',
		docsPath: 'integrations/dingtalk',
		fields: [
			{
				key: 'client_id',
				label: 'Client ID',
				placeholder_cn: '填写钉钉应用的 Client ID',
				placeholder_en: 'Enter DingTalk Client ID',
				required: true
			},
			{
				key: 'client_secret',
				label: 'Client Secret',
				placeholder_cn: '填写钉钉应用的 Client Secret',
				placeholder_en: 'Enter DingTalk Client Secret',
				secret: true,
				required: true
			}
		]
	},
	{
		key: 'feishu',
		name_cn: '飞书',
		name_en: 'Lark',
		iconBg: '#3370FF',
		iconPadding: '6px',
		desc_cn: '连接飞书，让团队成员可以直接在通讯录搜索并与任务智能体对话',
		desc_en: 'Connect Lark/Feishu so team members can chat with the Agent directly',
		docsPath: 'integrations/feishu',
		fields: [
			{
				key: 'app_id',
				label: 'App ID',
				placeholder_cn: '填写飞书应用的 App ID',
				placeholder_en: 'Enter Lark App ID',
				required: true
			},
			{
				key: 'app_secret',
				label: 'App Secret',
				placeholder_cn: '填写飞书应用的 App Secret',
				placeholder_en: 'Enter Lark App Secret',
				secret: true,
				required: true
			}
		]
	},
	// ── Global platforms ──────────────────────────────────────────────────
	{
		key: 'telegram',
		name_cn: 'Telegram',
		name_en: 'Telegram',
		iconBg: '#229ED9',
		iconPadding: '6px',
		desc_cn: '连接 Telegram Bot，面向全球用户提供服务',
		desc_en: 'Connect a Telegram Bot to serve users globally',
		docsPath: 'integrations/telegram',
		fields: [
			{
				key: 'bot_token',
				label: 'Bot Token',
				placeholder_cn: '从 @BotFather 获取的 Token',
				placeholder_en: 'Token from @BotFather',
				secret: true,
				required: true
			},
			{
				key: 'host',
				label: 'API Host',
				placeholder_cn: '自建 Bot API 地址（可选，默认官方）',
				placeholder_en: 'Custom Bot API server (optional)',
				secret: false,
				required: false
			}
		]
	},
	{
		key: 'discord',
		name_cn: 'Discord',
		name_en: 'Discord',
		iconBg: '#5865F2',
		iconPadding: '7px',
		desc_cn: '连接 Discord Bot，面向社区与海外用户',
		desc_en: 'Connect a Discord Bot for community and global users',
		docsPath: 'integrations/discord',
		fields: [
			{
				key: 'bot_token',
				label: 'Bot Token',
				placeholder_cn: '从 Discord Developer Portal 获取',
				placeholder_en: 'From Discord Developer Portal',
				secret: true,
				required: true
			},
			{
				key: 'app_id',
				label: 'Application ID',
				placeholder_cn: '应用 ID（可选）',
				placeholder_en: 'Application ID (optional)',
				secret: false,
				required: false
			}
		]
	}
]

type VerifyState = 'idle' | 'loading' | 'success' | 'error'

interface VerifyResult {
	valid: boolean
	info?: Record<string, any>
	error?: string
}

/**
 * IntegrationPanel — Connect the Agent to external messaging platforms.
 *
 * Config path: robot_config.integrations.<platform>.<field>
 * Each platform has an `enabled` toggle plus its own credential fields.
 */
const IntegrationPanel: React.FC<IntegrationPanelProps> = ({ robot, formData, onChange, is_cn }) => {
	const [expanded, setExpanded] = useState<Record<string, boolean>>({})
	const [verifying, setVerifying] = useState<Record<string, VerifyState>>({})
	const [verifyResults, setVerifyResults] = useState<Record<string, VerifyResult>>({})
	const [qrModalOpen, setQrModalOpen] = useState(false)

	const toggleExpand = (key: string) => {
		setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
	}

	const fieldKey = (platform: string, field: string) => `integrations.${platform}.${field}`

	const isEnabled = (platform: string) => formData[fieldKey(platform, 'enabled')] === true

	const handleToggle = (platform: string, value: boolean) => {
		onChange(fieldKey(platform, 'enabled'), value)
		if (value) setExpanded((prev) => ({ ...prev, [platform]: true }))
	}

	const credsFilled = (platform: PlatformConfig) =>
		platform.fields.filter((f) => f.required).every((f) => !!formData[fieldKey(platform.key, f.key)])

	const handleVerify = useCallback(
		async (platform: PlatformConfig) => {
			if (verifying[platform.key] === 'loading') return
			setVerifying((prev) => ({ ...prev, [platform.key]: 'loading' }))
			setVerifyResults((prev) => ({ ...prev, [platform.key]: undefined as any }))

			try {
				const { Agent } = await import('@/openapi/agent')
				if (!window.$app?.openapi) throw new Error('OpenAPI not available')
				const agent = new Agent(window.$app.openapi)

				const config: Record<string, any> = {}
				for (const f of platform.fields) {
					const val = formData[fieldKey(platform.key, f.key)]
					if (val) config[f.key] = val
				}

				const resp = await agent.robots.VerifyIntegration(platform.key, config)
				const result: VerifyResult = resp.data ?? { valid: false, error: 'No response' }
				setVerifyResults((prev) => ({ ...prev, [platform.key]: result }))
				setVerifying((prev) => ({
					...prev,
					[platform.key]: result.valid ? 'success' : 'error'
				}))

				setTimeout(() => {
					setVerifying((prev) => ({ ...prev, [platform.key]: 'idle' }))
				}, 5000)
			} catch (err: any) {
				const result: VerifyResult = { valid: false, error: err?.message || 'Request failed' }
				setVerifyResults((prev) => ({ ...prev, [platform.key]: result }))
				setVerifying((prev) => ({ ...prev, [platform.key]: 'error' }))
				setTimeout(() => {
					setVerifying((prev) => ({ ...prev, [platform.key]: 'idle' }))
				}, 5000)
			}
		},
		[verifying, formData]
	)

	// weixin always first; CN: 钉钉、飞书 next; EN: Telegram、Discord next
	const visiblePlatforms = is_cn
		? PLATFORMS
		: [...PLATFORMS].sort((a, b) => {
				const order = ['weixin', 'telegram', 'discord', 'dingtalk', 'feishu']
				return order.indexOf(a.key) - order.indexOf(b.key)
		  })

	return (
		<div className={styles.panelInner}>
			{/* ── Section: Integrations ─────────────────────────── */}
			<div className={styles.panelTitle}>{is_cn ? '平台集成' : 'Integrations'}</div>
			<div className={styles.sectionHint}>
				{is_cn
					? '将任务智能体接入即时通讯平台，用户无需安装任何插件，粘贴凭证即可使用'
					: 'Connect the Agent to messaging platforms — paste credentials and it just works'}
			</div>
			<div className={styles.integrationList}>
				{visiblePlatforms.map((platform) => {
					const enabled = isEnabled(platform.key)
					const open = expanded[platform.key] ?? enabled
					const verifyState = verifying[platform.key] || 'idle'
					const isVerifying = verifyState === 'loading'
					const canVerify = credsFilled(platform)
					const verifyResult = verifyResults[platform.key]
					const docsUrl = `${DOCS_BASE}/${platform.docsPath}`

					return (
						<div
							key={platform.key}
							className={`${styles.integrationCard} ${
								enabled ? styles.integrationCardActive : ''
							}`}
						>
							{/* Card Header */}
							<div
								className={styles.integrationHeader}
								onClick={() => toggleExpand(platform.key)}
							>
								<div className={styles.integrationMeta}>
									<div
										className={styles.integrationIconWrap}
										style={{
											background: platform.iconBg,
											padding: platform.iconPadding ?? '6px'
										}}
									>
										<img
											src={brandIcons[platform.key]}
											alt={platform.key}
											className={styles.integrationIconImg}
										/>
									</div>
									<div className={styles.integrationInfo}>
										<div className={styles.integrationName}>
											{is_cn ? platform.name_cn : platform.name_en}
										</div>
										<div className={styles.integrationDesc}>
											{is_cn ? platform.desc_cn : platform.desc_en}
										</div>
									</div>
								</div>

								<div
									className={styles.integrationHeaderRight}
									onClick={(e) => e.stopPropagation()}
								>
									<button
										className={`${styles.integrationToggle} ${
											enabled ? styles.integrationToggleOn : ''
										}`}
										onClick={() => handleToggle(platform.key, !enabled)}
										title={
											is_cn
												? enabled
													? '已启用'
													: '已停用'
												: enabled
												? 'Enabled'
												: 'Disabled'
										}
									>
										<span className={styles.integrationToggleThumb} />
									</button>
									<div
										className={`${styles.integrationChevron} ${
											open ? styles.integrationChevronOpen : ''
										}`}
									>
										<Icon name='material-expand_more' size={18} />
									</div>
								</div>
							</div>

						{/* Card Body */}
						{open && (
							<div className={styles.integrationBody}>
								{/* Docs link */}
								<div className={styles.integrationDocs}>
									<Icon name='material-menu_book' size={13} />
									<a href={docsUrl} target='_blank' rel='noopener noreferrer'>
										{is_cn ? '查看接入文档' : 'Setup guide'}
									</a>
								</div>

							{platform.scanLogin ? (
								<>
									{/* Scan-login branch (WeChat) */}
									{formData[fieldKey(platform.key, 'bot_token')] ? (
										<div className={styles.integrationConnected}>
											<Icon name='material-check_circle' size={16} />
											<span>
												{is_cn ? '已连接' : 'Connected'}
												{formData[fieldKey(platform.key, 'account_id')]
													? ` (${formData[fieldKey(platform.key, 'account_id')]})`
													: ''}
											</span>
											<button
												className={styles.integrationScanBtn}
												onClick={() => setQrModalOpen(true)}
											>
												<Icon name='material-refresh' size={13} />
												<span>{is_cn ? '重新连接' : 'Reconnect'}</span>
											</button>
										</div>
									) : (
										<div className={styles.integrationScanArea}>
											<button
												className={styles.integrationScanBtn}
												onClick={() => setQrModalOpen(true)}
											>
												<Icon name='material-qr_code_2' size={16} />
												<span>{is_cn ? '扫码连接' : 'Scan to Connect'}</span>
											</button>
											<div className={styles.integrationScanHint}>
												{is_cn
													? '点击后将弹出二维码，使用微信扫描即可完成连接'
													: 'Click to show QR code, then scan with WeChat to connect'}
											</div>
										</div>
									)}
								</>
							) : (
								<>
							{platform.fields.map((field) => {
								const InputComp = field.secret ? InputPassword : Input
								return (
									<div key={field.key} className={styles.formItem}>
										<label className={styles.formLabel}>
											{field.label}
											{field.required && (
												<span className={styles.required}>
													{' '}
													*
												</span>
											)}
										</label>
										<InputComp
											value={
												formData[
													fieldKey(platform.key, field.key)
												] || ''
											}
											onChange={(value: any) =>
												onChange(
													fieldKey(platform.key, field.key),
													value
												)
											}
											schema={{
												type: 'string',
												placeholder: is_cn
													? field.placeholder_cn
													: field.placeholder_en
											}}
										/>
									</div>
								)
							})}

								{/* Footer: verify button + result */}
								<div className={styles.integrationFooter}>
									<button
										className={`${styles.integrationVerifyBtn} ${
											!canVerify || isVerifying
												? styles.integrationVerifyBtnDisabled
												: verifyState === 'success'
												? styles.integrationVerifyBtnSuccess
												: verifyState === 'error'
												? styles.integrationVerifyBtnError
												: ''
										}`}
										disabled={!canVerify || isVerifying}
										onClick={() => handleVerify(platform)}
									>
										{isVerifying ? (
											<>
												<Icon
													name='material-hourglass_empty'
													size={13}
												/>
												<span>
													{is_cn
														? '验证中...'
														: 'Verifying...'}
												</span>
											</>
										) : verifyState === 'success' ? (
											<>
												<Icon
													name='material-check_circle'
													size={13}
												/>
												<span>
													{is_cn ? '验证通过' : 'Connected'}
												</span>
											</>
										) : verifyState === 'error' ? (
											<>
												<Icon
													name='material-error_outline'
													size={13}
												/>
												<span>
													{is_cn ? '验证失败' : 'Failed'}
												</span>
											</>
										) : (
											<>
												<Icon
													name='material-wifi_tethering'
													size={13}
												/>
												<span>
													{is_cn ? '验证连接' : 'Verify'}
												</span>
											</>
										)}
									</button>
									{verifyResult && verifyResult.valid && verifyResult.info && (
										<span className={styles.integrationVerifyInfo}>
											{verifyResult.info.name || verifyResult.info.username || verifyResult.info.app_id || verifyResult.info.client_id || ''}
											{verifyResult.info.username && verifyResult.info.name
												? ` (@${verifyResult.info.username})`
												: ''}
										</span>
									)}
									{verifyResult && !verifyResult.valid && verifyResult.error && (
										<span className={styles.integrationVerifyError}>
											{verifyResult.error.length > 80
												? verifyResult.error.slice(0, 80) + '...'
												: verifyResult.error}
										</span>
									)}
								</div>
								</>
							)}
							</div>
						)}
						</div>
					)
				})}
			</div>

			{/* ── Section: API Access ───────────────────────────── */}
			<div className={styles.panelTitle} style={{ marginTop: 32 }}>
				{is_cn ? 'API 直连' : 'API Access'}
			</div>
			<div className={styles.sectionHint}>
				{is_cn
					? '兼容 OpenAI Chat Completion 协议，可直接对接任何支持 OpenAI 的工具或 SDK'
					: 'OpenAI-compatible — works with any OpenAI-compatible SDK or tool'}
			</div>
			<ApiAccessGroup robot={robot} is_cn={is_cn} />

			{/* WeChat QR Code Modal */}
			<WeixinQRModal
				open={qrModalOpen}
				is_cn={is_cn}
				onClose={() => setQrModalOpen(false)}
				onSuccess={(data) => {
					onChange(fieldKey('weixin', 'bot_token'), data.bot_token)
					onChange(fieldKey('weixin', 'account_id'), data.account_id)
					if (data.base_url) {
						onChange(fieldKey('weixin', 'api_host'), data.base_url)
					}
					onChange(fieldKey('weixin', 'enabled'), true)
					setQrModalOpen(false)
				}}
			/>
		</div>
	)
}

export default IntegrationPanel
