import { useState, useEffect, useCallback, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import { message, Modal, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { Input, InputPassword, RadioGroup } from '@/components/ui/inputs'
import type { PropertySchema } from '@/components/ui/inputs/types'
import { Setting } from '@/openapi/setting/api'
import type { McpServerConfig, McpPageData } from '@/openapi/setting/types'
import styles from './index.less'

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

const slugify = (text: string) =>
	text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

interface ServerCardProps {
	server: McpServerConfig
	is_cn: boolean
	onReload: () => void
}

function testMcpConnection(
	api: Setting,
	transport: string,
	url: string,
	token: string,
	timeout: string
): Promise<{ success: boolean; message?: string; latency_ms?: number }> {
	return api.TestMcpServer({ transport, url, authorization_token: token || undefined, timeout: timeout || '30s' }).then((resp) => {
		if (resp.data) return resp.data
		return { success: false, message: resp.error?.error_description || 'Unknown error' }
	})
}

function ServerCard({ server, is_cn, onReload }: ServerCardProps) {
	const hasToken = Boolean(server.authorization_token)

	const [editing, setEditing] = useState(false)
	const [formLabel, setFormLabel] = useState(server.label)
	const [formDesc, setFormDesc] = useState(server.description || '')
	const [formTransport, setFormTransport] = useState<'http' | 'sse'>(server.transport)
	const [formUrl, setFormUrl] = useState(server.url)
	const [formToken, setFormToken] = useState('')
	const [formTimeout, setFormTimeout] = useState(server.timeout || '30s')

	const [saving, setSaving] = useState(false)
	const [testing, setTesting] = useState(false)
	const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null)

	const handleStartEdit = () => {
		setEditing(true)
		setFormLabel(server.label)
		setFormDesc(server.description || '')
		setFormTransport(server.transport)
		setFormUrl(server.url)
		setFormToken('')
		setFormTimeout(server.timeout || '30s')
		setTestResult(null)
	}

	const handleCancelEdit = () => {
		setEditing(false)
		setTestResult(null)
	}

	const handleDelete = () => {
		Modal.confirm({
			title: is_cn ? '确认删除' : 'Confirm Delete',
			content: is_cn
				? `确定要删除「${server.label}」吗？此操作不可撤销。`
				: `Are you sure you want to delete "${server.label}"? This cannot be undone.`,
			okText: is_cn ? '删除' : 'Delete',
			cancelText: is_cn ? '取消' : 'Cancel',
			okType: 'danger',
			onOk: async () => {
				const api = getSettingAPI()
				if (!api) return
				try {
					await api.DeleteMcpServer(server.id)
					onReload()
					message.success(is_cn ? '已删除' : 'Deleted')
				} catch (err: any) {
					message.error(err?.message || (is_cn ? '删除失败' : 'Failed to delete'))
				}
			}
		})
	}

	const canSave = Boolean(formUrl.trim()) && Boolean(formLabel.trim())
	const canTest = Boolean(formUrl.trim())

	const handleSave = async () => {
		const api = getSettingAPI()
		if (!api) return

		setSaving(true)
		try {
			const payload: any = {
				label: formLabel.trim(),
				description: formDesc.trim() || undefined,
				transport: formTransport,
				url: formUrl.trim(),
				timeout: formTimeout.trim() || '30s',
			}
			if (formToken.trim()) {
				payload.authorization_token = formToken.trim()
			}

			const resp = await api.UpdateMcpServer(server.id, payload)
			if (resp.error) {
				message.error(resp.error.error_description || (is_cn ? '保存失败' : 'Failed to save'))
				return
			}
			message.success(is_cn ? '已保存' : 'Saved')
			setEditing(false)
			setTestResult(null)
			onReload()
		} catch (err: any) {
			message.error(err?.message || (is_cn ? '保存失败' : 'Failed to save'))
		} finally {
			setSaving(false)
		}
	}

	const handleTest = async () => {
		const api = getSettingAPI()
		if (!api) return
		setTesting(true)
		setTestResult(null)
		try {
			const result = await testMcpConnection(api, formTransport, formUrl.trim(), formToken.trim(), formTimeout.trim())
			setTestResult(result)
			if (result.success) {
				message.success(is_cn ? `连接成功 (${result.latency_ms}ms)` : `Connected (${result.latency_ms}ms)`)
			} else {
				message.error(result.message || (is_cn ? '连接失败' : 'Connection failed'))
			}
		} catch (err: any) {
			const msg = err?.message || (is_cn ? '测试失败' : 'Test failed')
			setTestResult({ success: false, message: msg })
			message.error(msg)
		} finally {
			setTesting(false)
		}
	}

	const statusMap: Record<string, { text: string; cls: string }> = {
		connected: { text: is_cn ? '已连接' : 'Connected', cls: styles.status_connected },
		disconnected: { text: is_cn ? '连接失败' : 'Disconnected', cls: styles.status_disconnected },
		unconfigured: { text: is_cn ? '未配置' : 'Not configured', cls: styles.status_unconfigured }
	}
	const st = statusMap[server.status] || statusMap.unconfigured

	const textSchema = useMemo((): PropertySchema => ({ type: 'string' }), [])
	const pwdSchema = useMemo((): PropertySchema => ({ type: 'string' }), [])
	const transportSchema = useMemo((): PropertySchema => ({
		type: 'string',
		enum: [
			{ label: 'Streamable HTTP', value: 'http' },
			{ label: 'SSE', value: 'sse' }
		]
	}), [])

	const urlPlaceholder = formTransport === 'sse'
		? 'https://mcp.example.com/sse'
		: 'https://mcp.example.com/mcp'

	return (
		<div className={styles.serverCard}>
			<div className={styles.serverHeader}>
				<div className={styles.serverInfo}>
					<div className={styles.serverTitle}>{server.label}</div>
					<span className={`${styles.serverStatus} ${st.cls}`}>{st.text}</span>
					<span className={styles.transportTag}>{server.transport === 'http' ? 'HTTP' : 'SSE'}</span>
				</div>
				<div className={styles.serverActions}>
					<button className={styles.deleteBtn} onClick={handleDelete} title={is_cn ? '删除' : 'Delete'}>
						<Icon name='material-delete' size={16} />
					</button>
				</div>
			</div>

			{server.description && (
				<div className={styles.serverDesc}>{server.description}</div>
			)}

			{!editing ? (
				<div className={styles.viewBody}>
					<div className={styles.viewField}>
						<label className={styles.viewFieldLabel}>URL</label>
						<div className={styles.viewFieldValue}>{server.url}</div>
					</div>
					{hasToken && (
						<div className={styles.viewField}>
							<label className={styles.viewFieldLabel}>{is_cn ? '认证 Token' : 'Authorization Token'}</label>
							<div className={styles.viewFieldValue}>{server.authorization_token}</div>
						</div>
					)}
					<div className={styles.viewActions}>
						<button type='button' className={styles.editLink} onClick={handleStartEdit}>
							{is_cn ? '修改' : 'Change'}
						</button>
					</div>
				</div>
			) : (
				<div className={styles.editBody}>
					<div className={styles.formField}>
						<label className={styles.fieldLabel}>{is_cn ? '名称' : 'Name'}</label>
						<Input schema={textSchema} value={formLabel} onChange={(v) => setFormLabel(String(v || ''))} />
					</div>

					<div className={styles.formField}>
						<label className={styles.fieldLabel}>
							{is_cn ? '描述' : 'Description'}
							<span className={styles.optionalHint}> ({is_cn ? '可选' : 'optional'})</span>
						</label>
						<Input schema={textSchema} value={formDesc} onChange={(v) => setFormDesc(String(v || ''))} />
					</div>

					<div className={styles.formField}>
						<label className={styles.fieldLabel}>{is_cn ? '传输方式' : 'Transport'}</label>
						<RadioGroup schema={transportSchema} value={formTransport} onChange={(v) => setFormTransport(String(v) as any)} />
					</div>

					<div className={styles.formField}>
						<label className={styles.fieldLabel}>URL</label>
						<Input schema={textSchema} value={formUrl} onChange={(v) => setFormUrl(String(v || ''))} placeholder={urlPlaceholder} />
					</div>

					<div className={styles.formField}>
						<label className={styles.fieldLabel}>
							{is_cn ? '认证 Token' : 'Authorization Token'}
							<span className={styles.optionalHint}> ({is_cn ? '留空保持原值' : 'leave empty to keep current'})</span>
						</label>
						<InputPassword schema={pwdSchema} value={formToken} onChange={(v) => setFormToken(String(v || ''))} />
					</div>

					<div className={styles.formField}>
						<label className={styles.fieldLabel}>
							{is_cn ? '超时' : 'Timeout'}
							<span className={styles.optionalHint}> ({is_cn ? '默认 30s' : 'default 30s'})</span>
						</label>
						<Input schema={textSchema} value={formTimeout} onChange={(v) => setFormTimeout(String(v || ''))} />
					</div>

					{testResult && !testResult.success && (
						<div className={styles.testError}>{testResult.message}</div>
					)}

					<div className={styles.editActions}>
						<div className={styles.editActionsLeft}>
							<button type='button' className={styles.editLink} onClick={handleCancelEdit}>
								{is_cn ? '取消' : 'Cancel'}
							</button>
						</div>
						<div className={styles.editActionsRight}>
							<Button type='default' size='small' loading={testing} disabled={!canTest} onClick={handleTest}>
								{is_cn ? '测试连接' : 'Test'}
							</Button>
							<Button type='primary' size='small' loading={saving} disabled={testing || !canSave} onClick={handleSave}>
								{is_cn ? '保存' : 'Save'}
							</Button>
						</div>
					</div>
				</div>
			)}

			{server.tags && server.tags.length > 0 && (
				<div className={styles.serverTags}>
					{server.tags.map((tag) => (
						<span key={tag} className={styles.tag}>{tag}</span>
					))}
				</div>
			)}
		</div>
	)
}

const MCPServers = () => {
	const is_cn = getLocale() === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [data, setData] = useState<McpPageData | null>(null)

	const [addOpen, setAddOpen] = useState(false)
	const [saving, setSaving] = useState(false)
	const [addTesting, setAddTesting] = useState(false)
	const [addTestResult, setAddTestResult] = useState<{ success: boolean; message?: string } | null>(null)

	const [formLabel, setFormLabel] = useState('')
	const [formName, setFormName] = useState('')
	const [formNameManual, setFormNameManual] = useState(false)
	const [formDesc, setFormDesc] = useState('')
	const [formTransport, setFormTransport] = useState<'http' | 'sse'>('http')
	const [formUrl, setFormUrl] = useState('')
	const [formToken, setFormToken] = useState('')
	const [formTimeout, setFormTimeout] = useState('30s')

	const loadData = useCallback(async () => {
		const api = getSettingAPI()
		if (!api) return
		try {
			const resp = await api.GetMcpServers()
			if (resp.data) setData(resp.data)
		} catch (err: any) {
			message.error(err?.message || (is_cn ? '加载失败' : 'Failed to load'))
		} finally {
			setLoading(false)
		}
	}, [is_cn])

	useEffect(() => {
		loadData()
	}, [loadData])

	const resetForm = () => {
		setFormLabel('')
		setFormName('')
		setFormNameManual(false)
		setFormDesc('')
		setFormTransport('http')
		setFormUrl('')
		setFormToken('')
		setFormTimeout('30s')
		setAddTestResult(null)
	}

	const handleOpenAdd = () => {
		resetForm()
		setAddOpen(true)
	}

	const handleLabelChange = (val: unknown) => {
		const v = String(val || '')
		setFormLabel(v)
		if (!formNameManual) setFormName(slugify(v))
	}

	const handleNameChange = (val: unknown) => {
		setFormName(String(val || ''))
		setFormNameManual(true)
	}

	const handleAddTest = async () => {
		if (!formUrl.trim()) {
			message.warning(is_cn ? '请填写 URL' : 'Please enter URL')
			return
		}
		const api = getSettingAPI()
		if (!api) return
		setAddTesting(true)
		setAddTestResult(null)
		try {
			const result = await testMcpConnection(api, formTransport, formUrl.trim(), formToken.trim(), formTimeout.trim())
			setAddTestResult(result)
			if (result.success) {
				message.success(is_cn ? `连接成功 (${result.latency_ms}ms)` : `Connected (${result.latency_ms}ms)`)
			} else {
				message.error(result.message || (is_cn ? '连接失败' : 'Connection failed'))
			}
		} catch (err: any) {
			const msg = err?.message || (is_cn ? '测试失败' : 'Test failed')
			setAddTestResult({ success: false, message: msg })
			message.error(msg)
		} finally {
			setAddTesting(false)
		}
	}

	const handleCreate = async () => {
		if (!formLabel.trim()) {
			message.warning(is_cn ? '请填写名称' : 'Please enter a name')
			return
		}
		if (!formName.trim()) {
			message.warning(is_cn ? '请填写标识' : 'Please enter an identifier')
			return
		}
		if (!formUrl.trim()) {
			message.warning(is_cn ? '请填写 URL' : 'Please enter URL')
			return
		}

		const api = getSettingAPI()
		if (!api) return

		setSaving(true)
		try {
			const resp = await api.CreateMcpServer({
				name: formName.trim(),
				label: formLabel.trim(),
				description: formDesc.trim() || undefined,
				transport: formTransport,
				url: formUrl.trim(),
				authorization_token: formToken.trim() || undefined,
				timeout: formTimeout.trim() || '30s',
			})
			if (resp.error) {
				message.error(resp.error.error_description || (is_cn ? '添加失败' : 'Failed to add'))
				return
			}
			message.success(is_cn ? '添加成功' : 'Added')
			setAddOpen(false)
			await loadData()
		} catch (err: any) {
			message.error(err?.message || (is_cn ? '添加失败' : 'Failed to add'))
		} finally {
			setSaving(false)
		}
	}

	const textSchema = useMemo((): PropertySchema => ({ type: 'string' }), [])
	const pwdSchema = useMemo((): PropertySchema => ({ type: 'string' }), [])
	const transportSchema = useMemo((): PropertySchema => ({
		type: 'string',
		enum: [
			{ label: 'Streamable HTTP', value: 'http' },
			{ label: 'SSE', value: 'sse' }
		]
	}), [])

	const urlPlaceholder = formTransport === 'sse'
		? 'https://mcp.example.com/sse'
		: 'https://mcp.example.com/mcp'

	if (loading || !data) {
		return (
			<div className={styles.mcpServices}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<h2>{is_cn ? 'MCP 服务' : 'MCP Services'}</h2>
						<p>{is_cn ? '管理外部 MCP 服务器连接，为 AI 助手扩展工具能力' : 'Manage external MCP server connections to extend AI assistant capabilities'}</p>
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
		<div className={styles.mcpServices}>
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? 'MCP 服务' : 'MCP Services'}</h2>
					<p>{is_cn ? '管理外部 MCP 服务器连接，为 AI 助手扩展工具能力' : 'Manage external MCP server connections to extend AI assistant capabilities'}</p>
				</div>
			</div>

			<div className={styles.section}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? '服务列表' : 'Services'}</div>
				</div>

				{data.servers.length > 0 ? (
					<div className={styles.serverList}>
						{data.servers.map((server) => (
							<ServerCard key={server.id} server={server} is_cn={is_cn} onReload={loadData} />
						))}
					</div>
				) : (
					<div className={styles.emptyState}>
						<Icon name='material-hub' size={40} />
						<h3>{is_cn ? '暂无 MCP 服务' : 'No MCP services'}</h3>
						<p>{is_cn ? '添加外部 MCP 服务器，为 AI 助手扩展工具能力' : 'Add external MCP servers to extend AI assistant capabilities'}</p>
					</div>
				)}

				<div className={styles.addBtn} onClick={handleOpenAdd}>
					<Icon name='material-add' size={18} />
					<span>{is_cn ? '添加 MCP 服务' : 'Add MCP Service'}</span>
				</div>
			</div>

			{/* Add Modal */}
			<Modal
				open={addOpen}
				onCancel={() => setAddOpen(false)}
				footer={null}
				closable={false}
				width={560}
				destroyOnClose
				className={styles.serverModal}
			>
				<div className={styles.modalHeader}>
					<span className={styles.modalTitle}>{is_cn ? '添加 MCP 服务' : 'Add MCP Service'}</span>
					<button className={styles.modalClose} onClick={() => setAddOpen(false)}>
						<Icon name='material-close' size={18} />
					</button>
				</div>

				<div className={styles.modalBody}>
					<div className={styles.modalContent}>
						<div className={styles.formField}>
							<label className={styles.fieldLabel}>{is_cn ? '名称' : 'Name'}</label>
							<Input schema={textSchema} value={formLabel} onChange={handleLabelChange} />
						</div>

						<div className={styles.formField}>
							<label className={styles.fieldLabel}>
								{is_cn ? '标识' : 'Identifier'}
								<span className={styles.optionalHint}> ({is_cn ? '英文，用于系统引用' : 'used for system reference'})</span>
							</label>
							<Input schema={textSchema} value={formName} onChange={handleNameChange} />
						</div>

						<div className={styles.formField}>
							<label className={styles.fieldLabel}>
								{is_cn ? '描述' : 'Description'}
								<span className={styles.optionalHint}> ({is_cn ? '可选' : 'optional'})</span>
							</label>
							<Input schema={textSchema} value={formDesc} onChange={(v) => setFormDesc(String(v || ''))} />
						</div>

						<div className={styles.formField}>
							<label className={styles.fieldLabel}>{is_cn ? '传输方式' : 'Transport'}</label>
							<RadioGroup schema={transportSchema} value={formTransport} onChange={(v) => setFormTransport(String(v) as any)} />
						</div>

						<div className={styles.formField}>
							<label className={styles.fieldLabel}>URL</label>
							<Input schema={textSchema} value={formUrl} onChange={(v) => setFormUrl(String(v || ''))} placeholder={urlPlaceholder} />
						</div>

						<div className={styles.formField}>
							<label className={styles.fieldLabel}>
								{is_cn ? '认证 Token' : 'Authorization Token'}
								<span className={styles.optionalHint}> ({is_cn ? '可选' : 'optional'})</span>
							</label>
							<InputPassword schema={pwdSchema} value={formToken} onChange={(v) => setFormToken(String(v || ''))} />
						</div>

						<div className={styles.formField}>
							<label className={styles.fieldLabel}>
								{is_cn ? '超时' : 'Timeout'}
								<span className={styles.optionalHint}> ({is_cn ? '默认 30s' : 'default 30s'})</span>
							</label>
							<Input schema={textSchema} value={formTimeout} onChange={(v) => setFormTimeout(String(v || ''))} />
						</div>
					</div>

					{addTestResult && !addTestResult.success && (
						<div className={styles.testError}>{addTestResult.message}</div>
					)}

					<div className={styles.modalActions}>
						<div className={styles.editActionsLeft}>
							<Button type='default' onClick={() => setAddOpen(false)}>
								{is_cn ? '取消' : 'Cancel'}
							</Button>
						</div>
						<div className={styles.editActionsRight}>
							<Button type='default' loading={addTesting} disabled={!formUrl.trim()} onClick={handleAddTest}>
								{is_cn ? '测试连接' : 'Test'}
							</Button>
							<Button type='primary' loading={saving} disabled={addTesting} onClick={handleCreate}>
								{is_cn ? '添加' : 'Add'}
							</Button>
						</div>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default MCPServers
