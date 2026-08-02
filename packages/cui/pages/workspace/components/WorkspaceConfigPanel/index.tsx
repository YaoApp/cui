import { useCallback, useEffect, useState } from 'react'
import { getLocale } from '@umijs/max'
import { Modal, message, Tooltip, Input } from 'antd'
import Icon from '@/widgets/Icon'
import { WorkspaceAPI } from '@/openapi/workspace'
import type { GitCredentialEntry, GitSSHKeyEntry } from '@/pages/workspace/types'
import styles from './index.less'

interface WorkspaceConfigPanelProps {
	wsId: string
	onClose?: () => void
}

const tipStyle = { fontSize: 11, padding: '3px 6px', minHeight: 0 }

const WorkspaceConfigPanel = ({ wsId, onClose }: WorkspaceConfigPanelProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const getApi = useCallback((): WorkspaceAPI | null => {
		if (!window.$app?.openapi) return null
		return new WorkspaceAPI(window.$app.openapi)
	}, [])

	// --- Git Config ---
	const [userName, setUserName] = useState('')
	const [userEmail, setUserEmail] = useState('')
	const [configLoading, setConfigLoading] = useState(false)

	const loadGitConfig = useCallback(async () => {
		const api = getApi()
		if (!api) return
		setConfigLoading(true)
		try {
			const res = await api.GitConfigGet(wsId)
			const values = res?.data?.values || {}
			setUserName(values['user.name'] || '')
			setUserEmail(values['user.email'] || '')
		} catch {
			/* ignore */
		} finally {
			setConfigLoading(false)
		}
	}, [wsId, getApi])

	const saveGitConfig = useCallback(async () => {
		const api = getApi()
		if (!api) return
		try {
			await api.GitConfigSet(wsId, 'user.name', userName)
			await api.GitConfigSet(wsId, 'user.email', userEmail)
			message.success(is_cn ? 'Git 配置已保存' : 'Git config saved')
		} catch (e: any) {
			message.error(e?.message || 'Save failed')
		}
	}, [wsId, getApi, userName, userEmail, is_cn])

	// --- Credentials ---
	const [credentials, setCredentials] = useState<GitCredentialEntry[]>([])
	const [showCredForm, setShowCredForm] = useState(false)
	const [credHost, setCredHost] = useState('')
	const [credUsername, setCredUsername] = useState('')
	const [credToken, setCredToken] = useState('')

	const loadCredentials = useCallback(async () => {
		const api = getApi()
		if (!api) return
		try {
			const res = await api.GitCredentialList(wsId)
			setCredentials(res?.data || [])
		} catch {
			/* ignore */
		}
	}, [wsId, getApi])

	const addCredential = useCallback(async () => {
		const api = getApi()
		if (!api || !credHost || !credToken) return
		try {
			await api.GitCredentialSet(wsId, credHost, credToken, credUsername || undefined)
			message.success(is_cn ? '凭证已添加' : 'Credential added')
			setShowCredForm(false)
			setCredHost('')
			setCredUsername('')
			setCredToken('')
			loadCredentials()
		} catch (e: any) {
			message.error(e?.message || 'Add failed')
		}
	}, [wsId, getApi, credHost, credUsername, credToken, loadCredentials, is_cn])

	const deleteCredential = useCallback(
		async (host: string) => {
			const api = getApi()
			if (!api) return
			Modal.confirm({
				title: is_cn ? '删除凭证' : 'Delete Credential',
				content: is_cn ? `确定删除 ${host} 的凭证吗？` : `Delete credential for ${host}?`,
				onOk: async () => {
					try {
						await api.GitCredentialDelete(wsId, host)
						loadCredentials()
					} catch (e: any) {
						message.error(e?.message || 'Delete failed')
					}
				}
			})
		},
		[wsId, getApi, loadCredentials, is_cn]
	)

	// --- SSH Keys ---
	const [sshKeys, setSshKeys] = useState<GitSSHKeyEntry[]>([])
	const [showKeyForm, setShowKeyForm] = useState(false)
	const [keyName, setKeyName] = useState('')
	const [keyPrivate, setKeyPrivate] = useState('')
	const [keyHost, setKeyHost] = useState('')

	const loadSSHKeys = useCallback(async () => {
		const api = getApi()
		if (!api) return
		try {
			const res = await api.GitSSHKeyList(wsId)
			setSshKeys(res?.data || [])
		} catch {
			/* ignore */
		}
	}, [wsId, getApi])

	const importSSHKey = useCallback(async () => {
		const api = getApi()
		if (!api || !keyName || !keyPrivate) return
		try {
			await api.GitSSHKeyImport(wsId, keyName, keyPrivate, { host: keyHost || undefined })
			message.success(is_cn ? 'SSH 密钥已导入' : 'SSH key imported')
			setShowKeyForm(false)
			setKeyName('')
			setKeyPrivate('')
			setKeyHost('')
			loadSSHKeys()
		} catch (e: any) {
			message.error(e?.message || 'Import failed')
		}
	}, [wsId, getApi, keyName, keyPrivate, keyHost, loadSSHKeys, is_cn])

	const deleteSSHKey = useCallback(
		async (name: string) => {
			const api = getApi()
			if (!api) return
			Modal.confirm({
				title: is_cn ? '删除 SSH 密钥' : 'Delete SSH Key',
				content: is_cn ? `确定删除密钥 "${name}" 吗？` : `Delete key "${name}"?`,
				onOk: async () => {
					try {
						await api.GitSSHKeyDelete(wsId, name)
						loadSSHKeys()
					} catch (e: any) {
						message.error(e?.message || 'Delete failed')
					}
				}
			})
		},
		[wsId, getApi, loadSSHKeys, is_cn]
	)

	useEffect(() => {
		loadGitConfig()
		loadCredentials()
		loadSSHKeys()
	}, [loadGitConfig, loadCredentials, loadSSHKeys])

	const copyPublicKey = useCallback(
		(pubKey: string) => {
			navigator.clipboard.writeText(pubKey).then(
				() => message.success(is_cn ? '公钥已复制' : 'Public key copied'),
				() => message.error(is_cn ? '复制失败' : 'Copy failed')
			)
		},
		[is_cn]
	)

	const [activeTab, setActiveTab] = useState<'config' | 'ssh'>('config')

	return (
		<div className={styles.container}>
			<div className={styles.toolbar}>
				<Icon name='material-key' size={13} />
				<span className={styles.title}>{is_cn ? '凭证管理' : 'Credentials'}</span>
				<div className={styles.toolbarActions}>
					{onClose && (
						<Tooltip title={is_cn ? '关闭' : 'Close'} overlayInnerStyle={tipStyle}>
							<div className={styles.actionBtn} onClick={onClose}>
								<Icon name='material-close' size={14} />
							</div>
						</Tooltip>
					)}
				</div>
			</div>
			<div className={styles.tabBar}>
				<div
					className={`${styles.tabItem} ${activeTab === 'config' ? styles.tabActive : ''}`}
					onClick={() => setActiveTab('config')}
				>
					{is_cn ? 'Git 配置' : 'Git Config'}
				</div>
				<div
					className={`${styles.tabItem} ${activeTab === 'ssh' ? styles.tabActive : ''}`}
					onClick={() => setActiveTab('ssh')}
				>
					{is_cn ? 'SSH 密钥' : 'SSH Keys'}
				</div>
			</div>
			<div className={styles.content}>
				{activeTab === 'config' && (
					<div className={styles.tabContent}>
						{configLoading ? (
							<div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
						) : (
							<div className={styles.form}>
								<div className={styles.field}>
									<label>{is_cn ? '用户名' : 'User Name'}</label>
									<Input
										size='small'
										value={userName}
										onChange={(e) => setUserName(e.target.value)}
										placeholder={is_cn ? '提交时使用的名字' : 'Name for commits'}
										className={styles.compactInput}
									/>
								</div>
								<div className={styles.field}>
									<label>{is_cn ? '邮箱' : 'Email'}</label>
									<Input
										size='small'
										value={userEmail}
										onChange={(e) => setUserEmail(e.target.value)}
										placeholder={is_cn ? '提交时使用的邮箱' : 'Email for commits'}
										className={styles.compactInput}
									/>
								</div>
								<div className={styles.formActions}>
									<button className={styles.saveBtn} onClick={saveGitConfig}>
										{is_cn ? '保存' : 'Save'}
									</button>
								</div>
							</div>
						)}

						<div className={styles.sectionDivider} />

						<div className={styles.listHeader}>
							<span>HTTPS Token</span>
							<Tooltip title={is_cn ? '添加凭证' : 'Add Credential'} overlayInnerStyle={tipStyle}>
								<div className={styles.addBtn} onClick={() => setShowCredForm(true)}>
									<Icon name='material-add' size={14} />
								</div>
							</Tooltip>
						</div>
						{credentials.length === 0 && !showCredForm && (
							<div className={styles.emptyList}>{is_cn ? '暂无凭证' : 'No credentials'}</div>
						)}
						{credentials.map((c) => (
							<div key={c.host} className={styles.listItem}>
								<div className={styles.itemInfo}>
									<span className={styles.itemName}>{c.host}</span>
									<span className={styles.itemDetail}>{c.username}</span>
								</div>
								<Tooltip title={is_cn ? '删除' : 'Delete'} overlayInnerStyle={tipStyle}>
									<div className={styles.itemDelete} onClick={() => deleteCredential(c.host)}>
										<Icon name='material-close' size={12} />
									</div>
								</Tooltip>
							</div>
						))}
						{showCredForm && (
							<div className={styles.inlineForm}>
								<Input size='small' placeholder='github.com' value={credHost} onChange={(e) => setCredHost(e.target.value)} className={styles.compactInput} />
								<Input size='small' placeholder={is_cn ? '用户名（可选）' : 'Username (optional)'} value={credUsername} onChange={(e) => setCredUsername(e.target.value)} className={styles.compactInput} />
								<Input.Password size='small' placeholder='Token' value={credToken} onChange={(e) => setCredToken(e.target.value)} className={styles.compactInput} />
								<div className={styles.formActions}>
									<button className={styles.saveBtn} onClick={addCredential} disabled={!credHost || !credToken}>
										{is_cn ? '添加' : 'Add'}
									</button>
									<button className={styles.cancelBtn} onClick={() => setShowCredForm(false)}>
										{is_cn ? '取消' : 'Cancel'}
									</button>
								</div>
							</div>
						)}
					</div>
				)}

				{activeTab === 'ssh' && (
					<div className={styles.tabContent}>
						<div className={styles.listHeader}>
							<span>{is_cn ? '已导入的密钥' : 'Imported Keys'}</span>
							<Tooltip title={is_cn ? '导入密钥' : 'Import Key'} overlayInnerStyle={tipStyle}>
								<div className={styles.addBtn} onClick={() => setShowKeyForm(true)}>
									<Icon name='material-add' size={14} />
								</div>
							</Tooltip>
						</div>
						{sshKeys.length === 0 && !showKeyForm && (
							<div className={styles.emptyList}>{is_cn ? '暂无密钥' : 'No SSH keys'}</div>
						)}
						{sshKeys.map((k) => (
							<div key={k.name} className={styles.listItem}>
								<div className={styles.itemInfo}>
									<span className={styles.itemName}>{k.name}</span>
									<span className={styles.itemDetail}>{k.fingerprint}</span>
								</div>
								<div className={styles.itemActions}>
									<Tooltip title={is_cn ? '复制公钥' : 'Copy Public Key'} overlayInnerStyle={tipStyle}>
										<div className={styles.itemAction} onClick={() => copyPublicKey(k.public_key)}>
											<Icon name='material-content_copy' size={12} />
										</div>
									</Tooltip>
									<Tooltip title={is_cn ? '删除' : 'Delete'} overlayInnerStyle={tipStyle}>
										<div className={styles.itemDelete} onClick={() => deleteSSHKey(k.name)}>
											<Icon name='material-close' size={12} />
										</div>
									</Tooltip>
								</div>
							</div>
						))}
						{showKeyForm && (
							<div className={styles.inlineForm}>
								<Input size='small' placeholder={is_cn ? '密钥名称' : 'Key name'} value={keyName} onChange={(e) => setKeyName(e.target.value)} className={styles.compactInput} />
								<Input.TextArea
									rows={3}
									placeholder={is_cn ? '粘贴私钥内容（PEM 格式）' : 'Paste private key (PEM format)'}
									value={keyPrivate}
									onChange={(e) => setKeyPrivate(e.target.value)}
									className={styles.compactInput}
								/>
								<Input size='small' placeholder={is_cn ? '关联主机（可选，如 github.com）' : 'Host (optional, e.g. github.com)'} value={keyHost} onChange={(e) => setKeyHost(e.target.value)} className={styles.compactInput} />
								<div className={styles.formActions}>
									<button className={styles.saveBtn} onClick={importSSHKey} disabled={!keyName || !keyPrivate}>
										{is_cn ? '导入' : 'Import'}
									</button>
									<button className={styles.cancelBtn} onClick={() => setShowKeyForm(false)}>
										{is_cn ? '取消' : 'Cancel'}
									</button>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

export default WorkspaceConfigPanel
