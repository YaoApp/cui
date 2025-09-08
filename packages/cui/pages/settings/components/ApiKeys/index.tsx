import { useState, useEffect } from 'react'
import { Form, message, Modal } from 'antd'
import { getLocale, useNavigate } from '@umijs/max'
import { mockApi, ApiKey } from '../../mockData'
import { DataTable, Button } from '@/components/ui'
import { Input } from '@/components/ui/inputs'
import { TableColumn, TableAction } from '@/components/ui/DataTable/types'
import Icon from '@/widgets/Icon'
import styles from './index.less'

const ApiKeys = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const navigate = useNavigate()
	const [form] = Form.useForm()

	// 2FA 相关状态
	const [has2FA, setHas2FA] = useState(false)
	const [checking2FA, setChecking2FA] = useState(true)

	const [loading, setLoading] = useState(true)
	const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
	const [modalVisible, setModalVisible] = useState(false)
	const [creating, setCreating] = useState(false)
	const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
	const [newKeyName, setNewKeyName] = useState('')

	// 检查 2FA 状态
	useEffect(() => {
		const check2FAStatus = async () => {
			try {
				setChecking2FA(true)
				// Mock 2FA 检查 - 后续对接真实 API
				await new Promise((resolve) => setTimeout(resolve, 500))
				setHas2FA(false) // 默认为 false，用于演示
			} catch (error) {
				console.error('Failed to check 2FA status:', error)
			} finally {
				setChecking2FA(false)
			}
		}

		check2FAStatus()
	}, [])

	// 加载 API Keys（仅在有 2FA 时）
	useEffect(() => {
		if (!has2FA) return

		const loadApiKeys = async () => {
			try {
				setLoading(true)
				const data = await mockApi.getApiKeys()
				setApiKeys(data)
			} catch (error) {
				console.error('Failed to load API keys:', error)
				message.error(is_cn ? '加载API密钥失败' : 'Failed to load API keys')
			} finally {
				setLoading(false)
			}
		}

		loadApiKeys()
	}, [has2FA, is_cn])

	const handleCreate = async (values: { name: string }) => {
		try {
			setCreating(true)
			// Mock create
			await new Promise((resolve) => setTimeout(resolve, 1000))
			const newKey: ApiKey = {
				id: Date.now().toString(),
				name: values.name,
				key: 'sk-' + Math.random().toString(36).substring(2, 34),
				created_at: new Date().toISOString(),
				status: 'active'
			}
			setApiKeys((prev) => [...prev, newKey])
			setModalVisible(false)
			form.resetFields()
			message.success(is_cn ? '创建成功' : 'Created successfully')
		} catch (error) {
			message.error(is_cn ? '创建失败' : 'Create failed')
		} finally {
			setCreating(false)
		}
	}

	const handleDelete = async (id: string) => {
		try {
			// Mock delete
			await new Promise((resolve) => setTimeout(resolve, 500))
			setApiKeys((prev) => prev.filter((key) => key.id !== id))
			message.success(is_cn ? '删除成功' : 'Deleted successfully')
		} catch (error) {
			message.error(is_cn ? '删除失败' : 'Delete failed')
		}
	}

	const toggleKeyVisibility = (id: string) => {
		setVisibleKeys((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(id)) {
				newSet.delete(id)
			} else {
				newSet.add(id)
			}
			return newSet
		})
	}

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text).then(() => {
			message.success(is_cn ? '已复制到剪贴板' : 'Copied to clipboard')
		})
	}

	const maskKey = (key: string) => {
		return key.substring(0, 7) + '...' + key.substring(key.length - 4)
	}

	// 临时的 2FA 切换功能（开发用）
	const toggle2FA = () => {
		setHas2FA(!has2FA)
	}

	// 跳转到安全设置页面
	const goToSecurity = () => {
		navigate('/settings/security')
	}

	// 快速创建 API Key
	const handleQuickCreate = async () => {
		try {
			setCreating(true)
			// Mock create
			await new Promise((resolve) => setTimeout(resolve, 1000))
			const newKey: ApiKey = {
				id: Date.now().toString(),
				name: newKeyName || (is_cn ? '未命名密钥' : 'Unnamed Key'),
				key: 'sk-' + Math.random().toString(36).substring(2, 34),
				created_at: new Date().toISOString(),
				status: 'active'
			}
			setApiKeys((prev) => [...prev, newKey])
			setNewKeyName('')
			message.success(is_cn ? '创建成功' : 'Created successfully')
		} catch (error) {
			message.error(is_cn ? '创建失败' : 'Create failed')
		} finally {
			setCreating(false)
		}
	}

	// 渲染 API Key 卡片
	const renderApiKeyCard = (apiKey: ApiKey) => (
		<div key={apiKey.id} className={styles.keyCard}>
			<div className={styles.keyHeader}>
				<div className={styles.keyName}>{apiKey.name}</div>
				<div className={styles.keyActions}>
					<Button
						type='default'
						size='small'
						icon={<Icon name='material-delete' size={14} />}
						onClick={() => {
							Modal.confirm({
								title: is_cn ? '确认删除' : 'Confirm Delete',
								content: is_cn
									? '确定要删除这个API密钥吗？此操作不可撤销。'
									: 'Are you sure to delete this API key? This action cannot be undone.',
								okText: is_cn ? '删除' : 'Delete',
								cancelText: is_cn ? '取消' : 'Cancel',
								okType: 'danger',
								onOk: () => handleDelete(apiKey.id)
							})
						}}
					/>
				</div>
			</div>
			<div className={styles.keyBody}>
				<div className={styles.keyValue}>
					<code className={styles.keyText}>
						{visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
					</code>
					<div className={styles.keyButtonGroup}>
						<Button
							type='default'
							size='small'
							icon={
								<Icon
									name={
										visibleKeys.has(apiKey.id)
											? 'material-visibility_off'
											: 'material-visibility'
									}
									size={14}
								/>
							}
							onClick={() => toggleKeyVisibility(apiKey.id)}
						/>
						<Button
							type='default'
							size='small'
							icon={<Icon name='material-content_copy' size={14} />}
							onClick={() => copyToClipboard(apiKey.key)}
						/>
					</div>
				</div>
				<div className={styles.keyMeta}>
					<span className={styles.keyLastUsed}>
						{is_cn ? '最后使用：' : 'Last used: '}
						{apiKey.last_used_at
							? new Date(apiKey.last_used_at).toLocaleDateString()
							: is_cn
							? '从未'
							: 'Never'}
					</span>
				</div>
			</div>
		</div>
	)

	// 定义表格列
	const columns: TableColumn<ApiKey>[] = [
		{
			key: 'name',
			title: is_cn ? '名称' : 'Name',
			dataIndex: 'name',
			width: 150,
			ellipsis: true
		},
		{
			key: 'key',
			title: is_cn ? 'API密钥' : 'API Key',
			dataIndex: 'key',
			flex: 2,
			minWidth: 300,
			render: (key: string, record: ApiKey) => (
				<div className={styles.keyCell}>
					<code className={styles.keyText}>{visibleKeys.has(record.id) ? key : maskKey(key)}</code>
					<div className={styles.keyActions}>
						<Button
							type='default'
							size='small'
							icon={
								<Icon
									name={
										visibleKeys.has(record.id)
											? 'material-visibility_off'
											: 'material-visibility'
									}
									size={14}
								/>
							}
							onClick={() => toggleKeyVisibility(record.id)}
						/>
						<Button
							type='default'
							size='small'
							icon={<Icon name='material-content_copy' size={14} />}
							onClick={() => copyToClipboard(key)}
						/>
					</div>
				</div>
			)
		},
		{
			key: 'status',
			title: is_cn ? '状态' : 'Status',
			dataIndex: 'status',
			width: 80,
			render: (status: string) => (
				<div className={styles.statusTag} data-status={status}>
					<Icon
						name={status === 'active' ? 'material-check_circle' : 'material-cancel'}
						size={12}
						className={styles.statusIcon}
					/>
					<span className={styles.statusText}>
						{status === 'active' ? (is_cn ? '活跃' : 'Active') : is_cn ? '禁用' : 'Disabled'}
					</span>
				</div>
			)
		},
		{
			key: 'created_at',
			title: is_cn ? '创建时间' : 'Created',
			dataIndex: 'created_at',
			width: 120,
			render: (date: string) => (
				<span className={styles.dateText}>
					{new Date(date).toLocaleDateString(is_cn ? 'zh-CN' : 'en-US')}
				</span>
			)
		},
		{
			key: 'last_used_at',
			title: is_cn ? '最后使用' : 'Last Used',
			dataIndex: 'last_used_at',
			width: 120,
			render: (date?: string) => (
				<span className={styles.dateText}>
					{date ? new Date(date).toLocaleDateString(is_cn ? 'zh-CN' : 'en-US') : '-'}
				</span>
			)
		}
	]

	// 定义表格操作
	const actions: TableAction<ApiKey>[] = [
		{
			key: 'delete',
			label: is_cn ? '删除' : 'Delete',
			icon: <Icon name='material-delete' size={14} />,
			type: 'default',
			onClick: (record) => {
				Modal.confirm({
					title: is_cn ? '确认删除' : 'Confirm Delete',
					content: is_cn
						? '确定要删除这个API密钥吗？此操作不可撤销。'
						: 'Are you sure to delete this API key? This action cannot be undone.',
					okText: is_cn ? '删除' : 'Delete',
					cancelText: is_cn ? '取消' : 'Cancel',
					okType: 'danger',
					onOk: () => handleDelete(record.id)
				})
			}
		}
	]

	// 渲染 2FA 未启用的提示页面（完全模仿 Profile 的结构）
	const render2FAPrompt = () => (
		<div className={styles.promptPanel}>
			<div className={styles.promptContainer}>
				<div className={styles.promptContent}>
					<div className={styles.promptIcon}>
						<Icon name='material-security' size={48} />
					</div>
					<h3 className={styles.promptTitle}>
						{is_cn ? '需要启用两步验证' : 'Two-Factor Authentication Required'}
					</h3>
					<p className={styles.promptDescription}>
						{is_cn
							? '为了保护您的账户安全，您需要先启用两步验证才能管理API密钥。'
							: 'To protect your account security, you need to enable two-factor authentication before managing API keys.'}
					</p>
					<div className={styles.promptActions}>
						<Button
							type='primary'
							icon={<Icon name='material-shield' size={14} />}
							onClick={goToSecurity}
						>
							{is_cn ? '前往安全设置' : 'Go to Security Settings'}
						</Button>
						{/* 临时开发按钮 */}
						<Button
							type='default'
							onClick={toggle2FA}
							style={{ marginTop: '8px', opacity: 0.6 }}
						>
							{is_cn ? '[临时] 切换2FA状态' : '[Temp] Toggle 2FA Status'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)

	// 渲染 API Keys 列表页面
	const renderApiKeysList = () => (
		<>
			{/* API Management Section */}
			<div className={styles.managementSection}>
				<div className={styles.sectionHeader}>
					<div className={styles.sectionInfo}>
						<h2>{is_cn ? 'API 管理' : 'API Management'}</h2>
						<p>
							{is_cn
								? '创建和管理 API 密钥以集成我们的服务'
								: 'Create and manage API keys to integrate with our services'}
						</p>
					</div>
					<div className={styles.sectionActions}>
						<a href='#' className={styles.docLink}>
							<Icon name='material-open_in_new' size={14} />
							{is_cn ? '查看 API 文档' : 'View API Documentation'}
						</a>
						{/* 临时开发按钮 */}
						<Button
							type='default'
							onClick={toggle2FA}
							style={{ opacity: 0.6, fontSize: '11px' }}
						>
							{is_cn ? '[临时] 切换2FA' : '[Temp] Toggle 2FA'}
						</Button>
					</div>
				</div>
			</div>

			{/* API Keys Management Panel */}
			<div className={styles.keysPanel}>
				{/* Create New Key Section */}
				<div className={styles.createSection}>
					<div className={styles.createInputGroup}>
						<Input
							schema={{
								type: 'string',
								placeholder: is_cn
									? '输入密钥名称（可选）'
									: 'Enter key name (optional)'
							}}
							value={newKeyName}
							onChange={(value) => setNewKeyName(String(value || ''))}
							error=''
							hasError={false}
						/>
						<Button
							type='primary'
							icon={<Icon name='material-add' size={14} />}
							onClick={handleQuickCreate}
							loading={creating}
						>
							{is_cn ? '创建新密钥' : 'Create New Key'}
						</Button>
					</div>
				</div>

				{/* API Keys List */}
				<div className={styles.keysSection}>
					{loading ? (
						<div className={styles.loadingState}>
							<Icon
								name='material-hourglass_empty'
								size={32}
								className={styles.loadingIcon}
							/>
							<span>{is_cn ? '加载中...' : 'Loading...'}</span>
						</div>
					) : apiKeys.length === 0 ? (
						<div className={styles.emptyState}>
							<Icon name='material-key' size={48} className={styles.emptyIcon} />
							<div className={styles.emptyTitle}>
								{is_cn ? '暂无API密钥' : 'No API Keys'}
							</div>
							<div className={styles.emptyDescription}>
								{is_cn
									? '创建您的第一个API密钥来开始使用我们的服务'
									: 'Create your first API key to start using our services'}
							</div>
						</div>
					) : (
						apiKeys.map((apiKey) => renderApiKeyCard(apiKey))
					)}
				</div>
			</div>
		</>
	)

	// 主渲染逻辑
	if (checking2FA) {
		return (
			<div className={styles.apiKeys}>
				<div className={styles.loadingState}>
					<Icon name='material-hourglass_empty' size={32} className={styles.loadingIcon} />
					<span>{is_cn ? '检查安全设置...' : 'Checking security settings...'}</span>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.apiKeys}>
			{has2FA ? renderApiKeysList() : render2FAPrompt()}

			{/* 创建 API Key 弹窗 */}
			<Modal
				title={
					<div className={styles.modalHeader}>
						<div className={styles.titleSection}>
							<Icon name='material-key' size={16} className={styles.titleIcon} />
							<span className={styles.modalTitle}>
								{is_cn ? '创建API密钥' : 'Create API Key'}
							</span>
						</div>
						<div
							className={styles.closeButton}
							onClick={() => {
								setModalVisible(false)
								form.resetFields()
							}}
						>
							<Icon name='material-close' size={16} className={styles.closeIcon} />
						</div>
					</div>
				}
				open={modalVisible}
				onCancel={() => {
					setModalVisible(false)
					form.resetFields()
				}}
				footer={null}
				width={480}
				className={styles.createModal}
				destroyOnClose
				closable={false}
			>
				<div className={styles.modalContent}>
					<Form form={form} layout='vertical' onFinish={handleCreate}>
						<Form.Item
							name='name'
							label={is_cn ? '密钥名称' : 'Key Name'}
							rules={[
								{
									required: true,
									message: is_cn ? '请输入密钥名称' : 'Please enter key name'
								}
							]}
						>
							<Input
								schema={{
									type: 'string',
									placeholder: is_cn ? '请输入密钥名称' : 'Enter key name'
								}}
								error=''
								hasError={false}
							/>
						</Form.Item>

						<div className={styles.modalActions}>
							<Button
								onClick={() => {
									setModalVisible(false)
									form.resetFields()
								}}
								disabled={creating}
							>
								{is_cn ? '取消' : 'Cancel'}
							</Button>
							<button type='submit' className={styles.submitButton} disabled={creating}>
								{creating && (
									<Icon
										name='material-refresh'
										size={12}
										className={styles.buttonLoadingIcon}
									/>
								)}
								{is_cn ? '创建' : 'Create'}
							</button>
						</div>
					</Form>
				</div>
			</Modal>
		</div>
	)
}

export default ApiKeys
