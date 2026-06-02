import { useState, useEffect, useRef } from 'react'
import { message, Modal } from 'antd'
import { getLocale } from '@umijs/max'
import { Setting } from '@/openapi/setting'
import type { APIKeyResponse, APIKeyCreateResponse } from '@/openapi/setting/types'
import { Button } from '@/components/ui'
import { Input, Select } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import styles from './index.less'

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

const ApiKeys = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [apiKeys, setApiKeys] = useState<APIKeyResponse[]>([])
	const [creating, setCreating] = useState(false)
	const [visibleKeys, setVisibleKeys] = useState<Map<string, string>>(new Map())

	const [createOpen, setCreateOpen] = useState(false)
	const [newKeyName, setNewKeyName] = useState('')
	const [newKeyExpiry, setNewKeyExpiry] = useState('never')
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
					setLoading(false)
				}
				return
			}

			api.GetApiKeys().then((res) => {
				if (cancelled) return
				if (res.error) {
					message.error(res.error.error_description || (is_cn ? '加载 API 密钥失败' : 'Failed to load API keys'))
					return
				}
				if (res.data) {
					setApiKeys(res.data)
				}
			}).catch((err) => {
				if (cancelled) return
				console.error('Failed to load API keys:', err)
				message.error(is_cn ? '加载 API 密钥失败' : 'Failed to load API keys')
			}).finally(() => {
				if (!cancelled) setLoading(false)
			})
		}

		load()
		return () => { cancelled = true }
	}, [])

	const handleCreate = async () => {
		const api = getSettingAPI()
		if (!api) return

		try {
			setCreating(true)
			const payload: { name: string; expires_at?: string } = {
				name: newKeyName || (is_cn ? '未命名密钥' : 'Unnamed Key')
			}
			if (newKeyExpiry !== 'never') {
				const now = new Date()
				const days = parseInt(newKeyExpiry, 10)
				const exp = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
				payload.expires_at = exp.toISOString()
			}
			const res = await api.CreateApiKey(payload)
			if (res.error) {
				message.error(res.error.error_description || (is_cn ? '创建失败' : 'Create failed'))
				return
			}
			if (res.data) {
				const created = res.data as APIKeyCreateResponse
				setApiKeys((prev) => [
					...prev,
					{
						id: created.id,
						name: created.name,
						key_prefix: created.key_prefix,
						status: created.status,
						expires_at: created.expires_at,
						created_at: created.created_at
					}
				])
				setVisibleKeys((prev) => new Map(prev).set(created.id, created.key))
				setNewKeyName('')
				setNewKeyExpiry('never')
				setCreateOpen(false)
				message.success(is_cn ? '创建成功，请立即复制密钥' : 'Created successfully, please copy the key now')
			}
		} catch (error: any) {
			const msg = error?.message || error?.error_description || (is_cn ? '创建失败' : 'Create failed')
			message.error(msg)
		} finally {
			setCreating(false)
		}
	}

	const handleDelete = async (id: string) => {
		const api = getSettingAPI()
		if (!api) return

		try {
			const res = await api.DeleteApiKey(id)
			if (res.error) {
				message.error(res.error.error_description || (is_cn ? '删除失败' : 'Delete failed'))
				return
			}
			setApiKeys((prev) => prev.filter((key) => key.id !== id))
			setVisibleKeys((prev) => {
				const next = new Map(prev)
				next.delete(id)
				return next
			})
			message.success(is_cn ? '删除成功' : 'Deleted successfully')
		} catch (error: any) {
			const msg = error?.message || error?.error_description || (is_cn ? '删除失败' : 'Delete failed')
			message.error(msg)
		}
	}

	const handleRegenerate = async (id: string) => {
		const api = getSettingAPI()
		if (!api) return

		try {
			const res = await api.RegenerateApiKey(id)
			if (res.error) {
				message.error(res.error.error_description || (is_cn ? '重新生成失败' : 'Regenerate failed'))
				return
			}
			if (res.data) {
				const regenerated = res.data as APIKeyCreateResponse
				setApiKeys((prev) =>
					prev.map((k) =>
						k.id === id
							? {
									id: regenerated.id,
									name: regenerated.name,
									key_prefix: regenerated.key_prefix,
									status: regenerated.status,
									expires_at: regenerated.expires_at,
									created_at: regenerated.created_at
							  }
							: k
					)
				)
				setVisibleKeys((prev) => new Map(prev).set(id, regenerated.key))
				message.success(is_cn ? '重新生成成功，请立即复制新密钥' : 'Regenerated successfully, please copy the new key now')
			}
		} catch (error: any) {
			const msg = error?.message || error?.error_description || (is_cn ? '重新生成失败' : 'Regenerate failed')
			message.error(msg)
		}
	}

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text).then(() => {
			message.success(is_cn ? '已复制到剪贴板' : 'Copied to clipboard')
		})
	}

	const formatDate = (dateStr?: string) => {
		if (!dateStr) return is_cn ? '从未' : 'Never'
		return new Date(dateStr).toLocaleDateString(is_cn ? 'zh-CN' : 'en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		})
	}

	if (loading) {
		return (
			<div className={styles.apiKeys}>
				<div className={styles.emptyState}>
					<Icon name='material-hourglass_empty' size={32} />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.apiKeys}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? 'API 密钥' : 'API Keys'}</h2>
					<p>{is_cn ? '创建和管理 API 密钥以集成我们的服务' : 'Create and manage API keys to integrate with our services'}</p>
				</div>
			</div>

			{/* Card */}
			<div className={styles.card}>
				<div className={styles.cardHeader}>
					<div>
						<div className={styles.cardTitle}>{is_cn ? '密钥管理' : 'Key Management'}</div>
						<div className={styles.cardDesc}>
							{is_cn
								? '使用 API 密钥通过 HTTP 请求访问服务接口'
								: 'Use API keys to access services via HTTP requests'}
						</div>
					</div>
					<Button size='small' type='primary' onClick={() => setCreateOpen(true)}>
						{is_cn ? '+ 创建' : '+ Create'}
					</Button>
				</div>

				{apiKeys.length === 0 ? (
					<div className={styles.emptyState}>
						<Icon name='material-key' size={32} />
						<span>{is_cn ? '暂无 API 密钥' : 'No API Keys'}</span>
					</div>
				) : (
					<table className={styles.keysTable}>
						<colgroup>
							<col style={{ width: '18%' }} />
							<col style={{ width: '42%' }} />
							<col style={{ width: '18%' }} />
							<col style={{ width: '22%' }} />
						</colgroup>
						<thead>
							<tr>
								<th>{is_cn ? '名称' : 'Name'}</th>
								<th>{is_cn ? '密钥' : 'Key'}</th>
								<th>{is_cn ? '最后使用' : 'Last Used'}</th>
								<th style={{ textAlign: 'right' }}>{is_cn ? '操作' : 'Actions'}</th>
							</tr>
						</thead>
						<tbody>
							{apiKeys.map((apiKey) => {
								const fullKey = visibleKeys.get(apiKey.id)
								return (
									<tr key={apiKey.id}>
										<td className={styles.nameCell}>{apiKey.name}</td>
										<td>
											<div className={styles.keyCell}>
												<span className={styles.keyValue}>
													{fullKey || `${apiKey.key_prefix}...`}
												</span>
												{fullKey && (
													<Button
														size='small'
														type='default'
														onClick={() => copyToClipboard(fullKey)}
													>
														<Icon name='material-content_copy' size={13} />
													</Button>
												)}
											</div>
										</td>
										<td className={styles.dateCell}>{formatDate(apiKey.last_used)}</td>
										<td>
											<div className={styles.actionsCell}>
												<Button
													size='small'
													type='default'
													onClick={() => {
														Modal.confirm({
															title: is_cn ? '确认重新生成' : 'Confirm Regenerate',
															content: is_cn
																? '重新生成后旧密钥将立即失效，此操作不可撤销。'
																: 'The old key will be immediately invalidated.',
															okText: is_cn ? '重新生成' : 'Regenerate',
															cancelText: is_cn ? '取消' : 'Cancel',
															onOk: () => handleRegenerate(apiKey.id)
														})
													}}
												>
													<Icon name='material-refresh' size={14} />
												</Button>
												<Button
													size='small'
													type='default'
													onClick={() => {
														Modal.confirm({
															title: is_cn ? '确认删除' : 'Confirm Delete',
															content: is_cn
																? '确定要删除这个 API 密钥吗？此操作不可撤销。'
																: 'Are you sure? This cannot be undone.',
															okText: is_cn ? '删除' : 'Delete',
															cancelText: is_cn ? '取消' : 'Cancel',
															okType: 'danger',
															onOk: () => handleDelete(apiKey.id)
														})
													}}
												>
													<Icon name='material-delete' size={14} />
												</Button>
											</div>
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				)}

				<div className={styles.footer}>
					<div className={styles.footerNote}>
						<Icon name='material-lock' size={13} />
						<span>{is_cn ? '密钥仅在创建时展示一次，请及时复制保存' : 'Keys are only shown once at creation, please copy immediately'}</span>
					</div>
					<a href='https://yaoagents.com/docs' target='_blank' rel='noreferrer' className={styles.docLink}>
						<Icon name='material-open_in_new' size={13} />
						{is_cn ? 'API 文档' : 'API Docs'}
					</a>
				</div>
			</div>

			{/* Create Modal */}
			<Modal
				title={is_cn ? '创建 API 密钥' : 'Create API Key'}
				open={createOpen}
				onCancel={() => { setCreateOpen(false); setNewKeyName(''); setNewKeyExpiry('never') }}
				footer={null}
				destroyOnClose
			>
				<div className={styles.modalBody}>
					<div className={styles.formField}>
						<label className={styles.formLabel}>
							{is_cn ? '密钥名称' : 'Key Name'}
							<span className={styles.formHint}>{is_cn ? '用于标识该密钥的用途' : 'To identify this key'}</span>
						</label>
						<Input
							schema={{
								type: 'string',
								placeholder: is_cn ? '如：生产环境、测试环境' : 'e.g. Production, Testing'
							}}
							value={newKeyName}
							onChange={(v) => setNewKeyName(v as string)}
						/>
					</div>
					<div className={styles.formField}>
						<label className={styles.formLabel}>
							{is_cn ? '有效期' : 'Expiration'}
						</label>
						<Select
							schema={{
								type: 'string',
								enum: [
									{ label: is_cn ? '永不过期' : 'Never expires', value: 'never' },
									{ label: is_cn ? '7 天' : '7 days', value: '7' },
									{ label: is_cn ? '30 天' : '30 days', value: '30' },
									{ label: is_cn ? '60 天' : '60 days', value: '60' },
									{ label: is_cn ? '90 天' : '90 days', value: '90' },
									{ label: is_cn ? '180 天' : '180 days', value: '180' },
									{ label: is_cn ? '1 年' : '1 year', value: '365' }
								]
							}}
							value={newKeyExpiry}
							onChange={(v) => setNewKeyExpiry(v as string)}
						/>
					</div>
					<div className={styles.modalActions}>
						<Button onClick={() => { setCreateOpen(false); setNewKeyName(''); setNewKeyExpiry('never') }}>
							{is_cn ? '取消' : 'Cancel'}
						</Button>
						<Button type='primary' loading={creating} onClick={handleCreate}>
							{is_cn ? '创建' : 'Create'}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default ApiKeys
