import { useState, useEffect, useCallback, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import { message, Modal, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { Input, InputPassword, RadioGroup } from '@/components/ui/inputs'
import type { PropertySchema } from '@/components/ui/inputs/types'
import type { McpServerConfig, McpPageData } from '../../types'
import { mockApi } from '../../mockApi'
import styles from './index.less'

const slugify = (text: string) =>
	text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const MCPServers = () => {
	const is_cn = getLocale() === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [data, setData] = useState<McpPageData | null>(null)

	const [modalOpen, setModalOpen] = useState(false)
	const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
	const [editServer, setEditServer] = useState<McpServerConfig | null>(null)
	const [saving, setSaving] = useState(false)

	const [formLabel, setFormLabel] = useState('')
	const [formName, setFormName] = useState('')
	const [formNameManual, setFormNameManual] = useState(false)
	const [formDesc, setFormDesc] = useState('')
	const [formTransport, setFormTransport] = useState<'http' | 'sse'>('http')
	const [formUrl, setFormUrl] = useState('')
	const [formToken, setFormToken] = useState('')
	const [formTimeout, setFormTimeout] = useState('30s')

	useEffect(() => {
		mockApi.getMcpServers().then((res) => {
			setData(res)
			setLoading(false)
		})
	}, [])

	const reload = useCallback(async () => {
		const res = await mockApi.getMcpServers()
		setData(res)
	}, [])

	const resetForm = () => {
		setFormLabel('')
		setFormName('')
		setFormNameManual(false)
		setFormDesc('')
		setFormTransport('http')
		setFormUrl('')
		setFormToken('')
		setFormTimeout('30s')
	}

	const handleOpenAdd = () => {
		setModalMode('add')
		setEditServer(null)
		resetForm()
		setModalOpen(true)
	}

	const handleOpenEdit = (server: McpServerConfig) => {
		setModalMode('edit')
		setEditServer(server)
		setFormLabel(server.label)
		setFormName(server.name)
		setFormNameManual(true)
		setFormDesc(server.description || '')
		setFormTransport(server.transport)
		setFormUrl(server.url)
		setFormToken(server.authorization_token || '')
		setFormTimeout(server.timeout || '30s')
		setModalOpen(true)
	}

	const handleDelete = (server: McpServerConfig) => {
		Modal.confirm({
			title: is_cn ? '确认删除' : 'Confirm Delete',
			content: is_cn
				? `确定要删除「${server.label}」吗？此操作不可撤销。`
				: `Are you sure you want to delete "${server.label}"? This cannot be undone.`,
			okText: is_cn ? '删除' : 'Delete',
			cancelText: is_cn ? '取消' : 'Cancel',
			okType: 'danger',
			onOk: async () => {
				await mockApi.deleteMcpServer(server.id)
				await reload()
				message.success(is_cn ? '已删除' : 'Deleted')
			}
		})
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

	const handleSave = async () => {
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

		setSaving(true)
		try {
			if (modalMode === 'add') {
				await mockApi.addMcpServer({
					name: formName.trim(),
					label: formLabel.trim(),
					description: formDesc.trim() || undefined,
					transport: formTransport,
					url: formUrl.trim(),
					authorization_token: formToken.trim() || undefined,
					timeout: formTimeout.trim() || '30s',
				})
				message.success(is_cn ? '添加成功' : 'Added')
			} else if (editServer) {
				await mockApi.updateMcpServer(editServer.id, {
					name: formName.trim(),
					label: formLabel.trim(),
					description: formDesc.trim() || undefined,
					transport: formTransport,
					url: formUrl.trim(),
					authorization_token: formToken.trim() || undefined,
					timeout: formTimeout.trim() || '30s',
				})
				message.success(is_cn ? '已更新' : 'Updated')
			}
			setModalOpen(false)
			await reload()
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

	const statusLabel = (status: string) => {
		const map: Record<string, { text: string; cls: string }> = {
			connected: { text: is_cn ? '已连接' : 'Connected', cls: styles.status_connected },
			disconnected: { text: is_cn ? '连接失败' : 'Disconnected', cls: styles.status_disconnected },
			unconfigured: { text: is_cn ? '未配置' : 'Not configured', cls: styles.status_unconfigured }
		}
		return map[status] || map.unconfigured
	}

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
						{data.servers.map((server) => {
							const st = statusLabel(server.status)
							return (
								<div key={server.id} className={styles.serverCard}>
									<div className={styles.serverHeader}>
										<div className={styles.serverInfo}>
											<div className={styles.serverTitle}>{server.label}</div>
											<span className={`${styles.serverStatus} ${st.cls}`}>{st.text}</span>
											<span className={styles.transportTag}>{server.transport === 'http' ? 'HTTP' : 'SSE'}</span>
										</div>
										<div className={styles.serverActions}>
											<button className={styles.editBtn} onClick={() => handleOpenEdit(server)} title={is_cn ? '编辑' : 'Edit'}>
												<Icon name='material-edit' size={16} />
											</button>
											<button className={styles.deleteBtn} onClick={() => handleDelete(server)} title={is_cn ? '删除' : 'Delete'}>
												<Icon name='material-delete' size={16} />
											</button>
										</div>
									</div>
									{server.description && (
										<div className={styles.serverDesc}>{server.description}</div>
									)}
									<div className={styles.serverUrl}>{server.url}</div>
									{server.tags && server.tags.length > 0 && (
										<div className={styles.serverTags}>
											{server.tags.map((tag) => (
												<span key={tag} className={styles.tag}>{tag}</span>
											))}
										</div>
									)}
								</div>
							)
						})}
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

			{/* Modal */}
			<Modal
				open={modalOpen}
				onCancel={() => setModalOpen(false)}
				footer={null}
				closable={false}
				width={560}
				destroyOnClose
				className={styles.serverModal}
			>
				<div className={styles.modalHeader}>
					<span className={styles.modalTitle}>
						{modalMode === 'add'
							? (is_cn ? '添加 MCP 服务' : 'Add MCP Service')
							: (is_cn ? `编辑 ${editServer?.label || ''}` : `Edit ${editServer?.label || ''}`)}
					</span>
					<button className={styles.modalClose} onClick={() => setModalOpen(false)}>
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
								<span className={styles.optionalHint}> ({is_cn ? '可选，支持 Bearer Token / API Key / PAT' : 'optional, Bearer Token / API Key / PAT'})</span>
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

					<div className={styles.modalActions}>
						<Button type='default' onClick={() => setModalOpen(false)}>
							{is_cn ? '取消' : 'Cancel'}
						</Button>
						<Button type='primary' loading={saving} onClick={handleSave}>
							{modalMode === 'add' ? (is_cn ? '添加' : 'Add') : (is_cn ? '保存' : 'Save')}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default MCPServers
