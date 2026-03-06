import { useState, useEffect, useCallback } from 'react'
import { Popconfirm, message, Upload, Input } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { mockApi } from '../../mockData'
import type { Workspace, DirEntry } from '../../types'
import styles from './index.less'

interface WorkspaceDetailProps {
	workspace: Workspace
	onBack: () => void
	onDelete: () => void
	onRefresh: () => void
}

const formatSize = (bytes: number): string => {
	if (bytes === 0) return '—'
	const units = ['B', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(1024))
	return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

const getFileIcon = (entry: DirEntry): string => {
	if (entry.is_dir) return 'material-folder'
	const ext = entry.name.split('.').pop()?.toLowerCase() || ''
	const iconMap: Record<string, string> = {
		ts: 'material-code',
		tsx: 'material-code',
		js: 'material-javascript',
		json: 'material-data_object',
		md: 'material-description',
		yaml: 'material-settings',
		yml: 'material-settings',
		sh: 'material-terminal',
		csv: 'material-table_chart',
		bin: 'material-memory',
		py: 'material-code',
		go: 'material-code'
	}
	return iconMap[ext] || 'material-insert_drive_file'
}

const WorkspaceDetail = ({ workspace, onBack, onDelete, onRefresh }: WorkspaceDetailProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [currentPath, setCurrentPath] = useState('/')
	const [entries, setEntries] = useState<DirEntry[]>([])
	const [loading, setLoading] = useState(false)
	const [editingName, setEditingName] = useState(false)
	const [newName, setNewName] = useState(workspace.name)

	const loadDir = useCallback(async (path: string) => {
		try {
			setLoading(true)
			const data = await mockApi.listDir(workspace.id, path)
			const sorted = [...data].sort((a, b) => {
				if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
				return a.name.localeCompare(b.name)
			})
			setEntries(sorted)
		} catch {
			message.error(is_cn ? '加载目录失败' : 'Failed to load directory')
		} finally {
			setLoading(false)
		}
	}, [workspace.id, is_cn])

	useEffect(() => {
		loadDir(currentPath)
	}, [currentPath, loadDir])

	const navigateTo = (entry: DirEntry) => {
		if (!entry.is_dir) return
		const next = currentPath === '/' ? `/${entry.name}` : `${currentPath}/${entry.name}`
		setCurrentPath(next)
	}

	const navigateUp = () => {
		if (currentPath === '/') return
		const parts = currentPath.split('/').filter(Boolean)
		parts.pop()
		setCurrentPath(parts.length === 0 ? '/' : '/' + parts.join('/'))
	}

	const breadcrumbs = currentPath.split('/').filter(Boolean)

	const handleUpload = async (file: File) => {
		const hide = message.loading(is_cn ? '上传中...' : 'Uploading...', 0)
		try {
			await mockApi.uploadFile(workspace.id, `${currentPath}/${file.name}`, file)
			message.success(is_cn ? '上传成功' : 'Upload successful')
			loadDir(currentPath)
		} catch {
			message.error(is_cn ? '上传失败' : 'Upload failed')
		} finally {
			hide()
		}
		return false
	}

	const handleDeleteFile = async (entry: DirEntry) => {
		try {
			const fullPath = currentPath === '/' ? `/${entry.name}` : `${currentPath}/${entry.name}`
			await mockApi.deleteFile(workspace.id, fullPath)
			message.success(is_cn ? '删除成功' : 'Deleted successfully')
			loadDir(currentPath)
		} catch {
			message.error(is_cn ? '删除失败' : 'Delete failed')
		}
	}

	const handleRename = async () => {
		if (!newName.trim() || newName === workspace.name) {
			setEditingName(false)
			return
		}
		try {
			await mockApi.updateWorkspace(workspace.id, { name: newName.trim() })
			message.success(is_cn ? '已更新' : 'Updated')
			setEditingName(false)
			onRefresh()
		} catch {
			message.error(is_cn ? '更新失败' : 'Update failed')
		}
	}

	const labelEntries = Object.entries(workspace.labels)

	return (
		<div className={styles.wrapper}>
			<div className={styles.detailHeader}>
				<div className={styles.headerLeft}>
					<div className={styles.backBtn} onClick={onBack}>
						<Icon name='material-arrow_back' size={16} />
					</div>
					<div className={styles.wsIcon}>
						<Icon name='material-deployed_code' size={24} />
					</div>
					<div className={styles.wsInfo}>
						{editingName ? (
							<Input
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								onPressEnter={handleRename}
								onBlur={handleRename}
								autoFocus
								className={styles.nameInput}
							/>
						) : (
							<h2 className={styles.wsName} onClick={() => setEditingName(true)}>
								{workspace.name}
								<Icon name='material-edit' size={14} className={styles.editIcon} />
							</h2>
						)}
						<span className={styles.wsId}>{workspace.id}</span>
					</div>
				</div>
				<div className={styles.headerRight}>
					<Popconfirm
						title={
							is_cn
								? '确定要删除这个工作空间吗？此操作不可恢复！'
								: 'Delete this workspace? This action cannot be undone!'
						}
						onConfirm={onDelete}
						okText={is_cn ? '确认' : 'Confirm'}
						cancelText={is_cn ? '取消' : 'Cancel'}
					>
						<Button
							type='danger'
							size='small'
							icon={<Icon name='material-delete' size={12} />}
						>
							{is_cn ? '删除' : 'Delete'}
						</Button>
					</Popconfirm>
				</div>
			</div>

			<div className={styles.infoCards}>
				<div className={styles.infoCard}>
					<div className={styles.infoLabel}>{is_cn ? '节点' : 'Node'}</div>
					<div className={styles.infoValue}>
						<Icon name='material-dns' size={14} />
						<span>{workspace.node}</span>
					</div>
				</div>
				<div className={styles.infoCard}>
					<div className={styles.infoLabel}>{is_cn ? '所有者' : 'Owner'}</div>
					<div className={styles.infoValue}>
						<Icon name='material-person' size={14} />
						<span>{workspace.owner}</span>
					</div>
				</div>
				<div className={styles.infoCard}>
					<div className={styles.infoLabel}>{is_cn ? '创建时间' : 'Created'}</div>
					<div className={styles.infoValue}>
						<span>{new Date(workspace.created_at).toLocaleDateString()}</span>
					</div>
				</div>
				<div className={styles.infoCard}>
					<div className={styles.infoLabel}>{is_cn ? '更新时间' : 'Updated'}</div>
					<div className={styles.infoValue}>
						<span>{new Date(workspace.updated_at).toLocaleDateString()}</span>
					</div>
				</div>
			</div>

			{labelEntries.length > 0 && (
				<div className={styles.labelsSection}>
					<div className={styles.sectionTitle}>{is_cn ? '标签' : 'Labels'}</div>
					<div className={styles.labelList}>
						{labelEntries.map(([k, v]) => (
							<span key={k} className={styles.labelChip}>
								<span className={styles.labelKey}>{k}</span>
								<span className={styles.labelVal}>{v}</span>
							</span>
						))}
					</div>
				</div>
			)}

			<div className={styles.fileSection}>
				<div className={styles.fileSectionHeader}>
					<div className={styles.sectionTitle}>{is_cn ? '文件管理' : 'File Manager'}</div>
					<Upload
						beforeUpload={handleUpload}
						showUploadList={false}
						multiple
					>
						<Button
							size='small'
							icon={<Icon name='material-upload' size={12} />}
						>
							{is_cn ? '上传文件' : 'Upload'}
						</Button>
					</Upload>
				</div>

				<div className={styles.breadcrumb}>
					<span
						className={`${styles.crumb} ${currentPath === '/' ? styles.crumbActive : ''}`}
						onClick={() => setCurrentPath('/')}
					>
						<Icon name='material-home' size={14} />
					</span>
					{breadcrumbs.map((part, i) => (
						<span key={i} className={styles.crumbGroup}>
							<span className={styles.crumbSep}>/</span>
							<span
								className={`${styles.crumb} ${i === breadcrumbs.length - 1 ? styles.crumbActive : ''}`}
								onClick={() => {
									const path = '/' + breadcrumbs.slice(0, i + 1).join('/')
									setCurrentPath(path)
								}}
							>
								{part}
							</span>
						</span>
					))}
					{currentPath !== '/' && (
						<span className={styles.crumbUp} onClick={navigateUp}>
							<Icon name='material-arrow_upward' size={14} />
						</span>
					)}
				</div>

				<div className={styles.fileList}>
					{loading ? (
						<div className={styles.fileLoading}>
							<span>{is_cn ? '加载中...' : 'Loading...'}</span>
						</div>
					) : entries.length === 0 ? (
						<div className={styles.fileEmpty}>
							<Icon name='material-folder_off' size={40} />
							<span>{is_cn ? '空目录' : 'Empty directory'}</span>
						</div>
					) : (
						entries.map((entry) => (
							<div
								key={entry.name}
								className={`${styles.fileRow} ${entry.is_dir ? styles.fileRowDir : ''}`}
								onClick={() => navigateTo(entry)}
							>
								<div className={styles.fileIcon}>
									<Icon name={getFileIcon(entry)} size={18} />
								</div>
								<div className={styles.fileName}>{entry.name}</div>
								<div className={styles.fileSize}>
									{entry.is_dir ? '—' : formatSize(entry.size)}
								</div>
								<Popconfirm
									title={
										is_cn
											? `确定删除 ${entry.name}？`
											: `Delete ${entry.name}?`
									}
									onConfirm={(e) => {
										e?.stopPropagation()
										handleDeleteFile(entry)
									}}
									onCancel={(e) => e?.stopPropagation()}
									okText={is_cn ? '确认' : 'Confirm'}
									cancelText={is_cn ? '取消' : 'Cancel'}
								>
									<div
										className={styles.fileDelete}
										onClick={(e) => e.stopPropagation()}
									>
										<Icon name='material-delete' size={14} />
									</div>
								</Popconfirm>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	)
}

export default WorkspaceDetail
