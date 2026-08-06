import { useCallback, useEffect, useState } from 'react'
import { getLocale } from '@umijs/max'
import { Modal, message, Tooltip } from 'antd'
import Icon from '@/widgets/Icon'
import { WorkspaceAPI } from '@/openapi/workspace'
import type { GitRepo, GitChangedFile, GitStatusResponse } from '@/pages/workspace/types'
import styles from './index.less'

interface RepoStatus {
	repo: GitRepo
	status: GitStatusResponse | null
	loading: boolean
	expanded: boolean
	syncing?: 'sync' | null
}

interface GitChangesPanelProps {
	wsId: string
	onClose?: () => void
}

function statusBadgeClass(code: string): string {
	switch (code) {
		case 'M':
			return styles.modified
		case 'A':
			return styles.added
		case 'D':
			return styles.deleted
		case 'R':
		case 'C':
			return styles.renamed
		case '?':
			return styles.untracked
		default:
			return ''
	}
}

function displayStatus(file: GitChangedFile, staged: boolean): string {
	const code = staged ? file.index_status : file.worktree_status
	return code?.trim() || '?'
}

const tipStyle = { fontSize: 11, padding: '3px 6px', minHeight: 0 }

const GitChangesPanel = ({ wsId, onClose }: GitChangesPanelProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [repoStatuses, setRepoStatuses] = useState<RepoStatus[]>([])
	const [loading, setLoading] = useState(true)
	const [commitMessages, setCommitMessages] = useState<Record<string, string>>({})

	const getApi = useCallback((): WorkspaceAPI | null => {
		if (!window.$app?.openapi) return null
		return new WorkspaceAPI(window.$app.openapi)
	}, [])

	const refreshRepoStatus = useCallback(
		async (repoPath: string) => {
			const api = getApi()
			if (!api) return
			setRepoStatuses((prev) =>
				prev.map((rs) => (rs.repo.path === repoPath ? { ...rs, loading: true } : rs))
			)
			try {
				const statusRes = await api.GitStatus(wsId, repoPath)
				const status: GitStatusResponse = statusRes?.data || statusRes
				setRepoStatuses((prev) =>
					prev.map((rs) => (rs.repo.path === repoPath ? { ...rs, status, loading: false } : rs))
				)
			} catch {
				setRepoStatuses((prev) =>
					prev.map((rs) => (rs.repo.path === repoPath ? { ...rs, loading: false } : rs))
				)
			}
		},
		[wsId, getApi]
	)

	const loadData = useCallback(
		async (refresh?: boolean) => {
			if (!wsId) return
			const api = getApi()
			if (!api) return
			setLoading(true)
			try {
				const reposRes = await api.GitListRepos(wsId, refresh)
				const raw = reposRes?.data ?? reposRes
				const repos: GitRepo[] = Array.isArray(raw) ? raw : []
				setRepoStatuses(
					repos.map((repo) => ({
						repo,
						status: null,
						loading: false,
						expanded: repo.has_changes,
						syncing: null
					}))
				)
				repos.filter((r) => r.has_changes).forEach((r) => refreshRepoStatus(r.path))
			} catch {
			} finally {
				setLoading(false)
			}
		},
		[wsId, getApi, refreshRepoStatus]
	)

	const refreshAllStatuses = useCallback(() => {
		repoStatuses.forEach((rs) => refreshRepoStatus(rs.repo.path))
	}, [repoStatuses, refreshRepoStatus])

	useEffect(() => {
		loadData()
	}, [loadData])

	const toggleExpand = useCallback(
		(idx: number) => {
			let repoPath = ''
			let needLoad = false
			setRepoStatuses((prev) => {
				const rs = prev[idx]
				const willExpand = !rs.expanded
				if (willExpand && !rs.status && !rs.loading) {
					needLoad = true
					repoPath = rs.repo.path
				}
				return prev.map((r, i) => (i === idx ? { ...r, expanded: willExpand } : r))
			})
			if (needLoad && repoPath) {
				refreshRepoStatus(repoPath)
			}
		},
		[refreshRepoStatus]
	)

	const stagedFiles = useCallback(
		(status: GitStatusResponse | null): GitChangedFile[] => {
			if (!status?.files) return []
			return status.files.filter(
				(f) => f.index_status && f.index_status.trim() !== '' && f.index_status !== '?'
			)
		},
		[]
	)

	const unstagedFiles = useCallback(
		(status: GitStatusResponse | null): GitChangedFile[] => {
			if (!status?.files) return []
			return status.files.filter(
				(f) => f.worktree_status && f.worktree_status.trim() !== '' && f.worktree_status !== ' '
			)
		},
		[]
	)

	const handleStageFile = useCallback(
		async (repoPath: string, filePath: string) => {
			const api = getApi()
			if (!api) return
			try {
				await api.GitAdd(wsId, repoPath, [filePath])
				refreshRepoStatus(repoPath)
			} catch (e: any) {
				message.error(e?.message || 'Stage failed')
			}
		},
		[wsId, getApi, refreshRepoStatus]
	)

	const handleUnstageFile = useCallback(
		async (repoPath: string, filePath: string) => {
			const api = getApi()
			if (!api) return
			try {
				await api.GitReset(wsId, repoPath, [filePath])
				refreshRepoStatus(repoPath)
			} catch (e: any) {
				message.error(e?.message || 'Unstage failed')
			}
		},
		[wsId, getApi, refreshRepoStatus]
	)

	const handleStageAll = useCallback(
		async (repoPath: string) => {
			const api = getApi()
			if (!api) return
			try {
				await api.GitAdd(wsId, repoPath)
				refreshRepoStatus(repoPath)
			} catch (e: any) {
				message.error(e?.message || 'Stage all failed')
			}
		},
		[wsId, getApi, refreshRepoStatus]
	)

	const handleUnstageAll = useCallback(
		async (repoPath: string) => {
			const api = getApi()
			if (!api) return
			try {
				await api.GitReset(wsId, repoPath)
				refreshRepoStatus(repoPath)
			} catch (e: any) {
				message.error(e?.message || 'Unstage all failed')
			}
		},
		[wsId, getApi, refreshRepoStatus]
	)

	const handleDiscardFile = useCallback(
		async (repoPath: string, filePath: string) => {
			const api = getApi()
			if (!api) return
			Modal.confirm({
				title: is_cn ? '确认放弃更改' : 'Discard Changes',
				content: is_cn
					? `确定要放弃 ${filePath} 的所有未暂存更改吗？`
					: `Are you sure you want to discard all unstaged changes in ${filePath}?`,
				onOk: async () => {
					try {
						await api.GitDiscardChanges(wsId, repoPath, [filePath])
						refreshRepoStatus(repoPath)
					} catch (e: any) {
						message.error(e?.message || 'Discard failed')
					}
				}
			})
		},
		[wsId, getApi, refreshRepoStatus, is_cn]
	)

	const handleCommit = useCallback(
		async (repoPath: string) => {
			const api = getApi()
			if (!api) return
			const msg = commitMessages[repoPath]?.trim()
			if (!msg) {
				message.warning(is_cn ? '请输入提交信息' : 'Please enter a commit message')
				return
			}
			try {
				await api.GitCommit(wsId, repoPath, msg)
				setCommitMessages((prev) => ({ ...prev, [repoPath]: '' }))
				message.success(is_cn ? '提交成功' : 'Committed successfully')
				refreshRepoStatus(repoPath)
			} catch (e: any) {
				message.error(e?.message || 'Commit failed')
			}
		},
		[wsId, getApi, commitMessages, refreshRepoStatus, is_cn]
	)

	const setSyncing = useCallback((repoPath: string, syncing: 'fetch' | 'pull' | 'push' | null) => {
		setRepoStatuses((prev) =>
			prev.map((rs) => (rs.repo.path === repoPath ? { ...rs, syncing } : rs))
		)
	}, [])

	const handleSync = useCallback(
		async (repoPath: string) => {
			const api = getApi()
			if (!api) return
			setSyncing(repoPath, 'sync')
			try {
				const res = await api.GitSync(wsId, repoPath)
				const r = res?.data
				if (r?.has_conflicts) {
					message.warning(is_cn ? '同步完成，但存在合并冲突' : 'Synced with merge conflicts')
				} else {
					const parts: string[] = []
					if (r?.pulled) parts.push(is_cn ? '已拉取' : 'pulled')
					if (r?.pushed) parts.push(is_cn ? '已推送' : 'pushed')
					message.success(parts.length > 0
						? (is_cn ? '同步完成：' : 'Synced: ') + parts.join(', ')
						: (is_cn ? '已是最新' : 'Already up to date'))
				}
				refreshRepoStatus(repoPath)
			} catch (e: any) {
				message.error(e?.message || (is_cn ? '同步失败' : 'Sync failed'))
			} finally {
				setSyncing(repoPath, null)
			}
		},
		[wsId, getApi, refreshRepoStatus, setSyncing, is_cn]
	)

	const openDiff = useCallback(
		(repoPath: string, filePath: string, staged: boolean) => {
			window.$app?.Event?.emit('app/openSidebar', {
				url: `/diff-view?ws=${wsId}&repo=${encodeURIComponent(repoPath)}&file=${encodeURIComponent(filePath)}&staged=${staged}`,
				title: filePath.split('/').pop() || filePath,
				icon: 'icon-git-commit'
			})
		},
		[wsId]
	)

	return (
		<div className={styles.container}>
			<div className={styles.toolbar}>
				<Icon name='icon-git-commit' size={14} />
				<span className={styles.title}>{is_cn ? '文件变更' : 'File Changes'}</span>
				<div className={styles.toolbarActions}>
					<Tooltip title={is_cn ? '刷新状态' : 'Refresh'} overlayInnerStyle={tipStyle}>
						<div className={styles.actionBtn} onClick={refreshAllStatuses}>
							<Icon name='material-refresh' size={14} />
						</div>
					</Tooltip>
					<Tooltip title={is_cn ? '扫描仓库' : 'Scan Repos'} overlayInnerStyle={tipStyle}>
						<div className={styles.actionBtn} onClick={() => loadData(true)}>
							<Icon name='material-manage_search' size={14} />
						</div>
					</Tooltip>
					{onClose && (
						<Tooltip title={is_cn ? '关闭' : 'Close'} overlayInnerStyle={tipStyle}>
							<div className={styles.actionBtn} onClick={onClose}>
								<Icon name='material-close' size={14} />
							</div>
						</Tooltip>
					)}
				</div>
			</div>

			<div className={styles.content}>
				{loading ? (
					<div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
				) : repoStatuses.length === 0 ? (
					<div className={styles.empty}>
						<Icon name='icon-git-commit' size={28} />
						<span>{is_cn ? '没有 Git 仓库' : 'No Git repositories'}</span>
					</div>
				) : (
					repoStatuses.map((rs, realIdx) => {
						const staged = stagedFiles(rs.status)
						const unstaged = unstagedFiles(rs.status)
						const ahead = rs.status?.ahead ?? rs.repo.ahead ?? 0
						const behind = rs.status?.behind ?? rs.repo.behind ?? 0
						const hasUpstream = rs.status?.has_upstream ?? rs.repo.has_upstream ?? false
						const hasRemote = !!(rs.status?.remote_url || rs.repo.remote_url)

						return (
							<div key={rs.repo.path} className={styles.repoGroup}>
								<div className={styles.repoHeader} onClick={() => toggleExpand(realIdx)}>
									<Icon
										name={rs.expanded ? 'material-expand_more' : 'material-chevron_right'}
										size={14}
									/>
									<span className={styles.repoName}>{rs.repo.path === '.' ? '/' : rs.repo.path}</span>
									{rs.repo.has_changes && (
										<span className={styles.changeCount}>
											{rs.status ? (rs.status.files?.length || 0) : '●'}
										</span>
									)}
									<span className={styles.branch}>{rs.status?.branch || rs.repo.branch}</span>
									{hasUpstream && (ahead > 0 || behind > 0) && (
										<span className={styles.syncIndicator}>
											{ahead > 0 && <span className={styles.ahead}>↑{ahead}</span>}
											{behind > 0 && <span className={styles.behind}>↓{behind}</span>}
										</span>
									)}
								{hasRemote && (
									<div className={styles.syncActions}>
										<Tooltip title={is_cn ? '同步' : 'Sync'} overlayInnerStyle={tipStyle}>
											<div
												className={`${styles.syncBtn} ${rs.syncing === 'sync' ? styles.syncLoading : ''}`}
												onClick={(e) => { e.stopPropagation(); handleSync(rs.repo.path) }}
											>
												<Icon name='material-sync' size={12} />
											</div>
										</Tooltip>
									</div>
								)}
								</div>

								{rs.expanded && (
									<div className={styles.section}>
									{rs.loading ? (
										<div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
									) : rs.status ? (
									<>
										{staged.length > 0 && (
											<>
												<div className={styles.sectionHeader}>
													<span>{is_cn ? '已暂存' : 'Staged'} ({staged.length})</span>
													<div className={styles.sectionActions}>
														<Tooltip title={is_cn ? '全部取消暂存' : 'Unstage All'} overlayInnerStyle={tipStyle}>
															<div
																className={styles.sectionActionBtn}
																onClick={() => handleUnstageAll(rs.repo.path)}
															>
																−
															</div>
														</Tooltip>
													</div>
												</div>
												{staged.map((f) => (
													<div
														key={`staged-${f.path}`}
														className={styles.fileItem}
														onClick={() => openDiff(rs.repo.path, f.path, true)}
													>
														<span className={`${styles.statusBadge} ${statusBadgeClass(f.index_status)}`}>
															{displayStatus(f, true)}
														</span>
														<span className={styles.fileName}>{f.path}</span>
														<div className={styles.fileActions}>
															<Tooltip title={is_cn ? '取消暂存' : 'Unstage'} overlayInnerStyle={tipStyle}>
																<div
																	className={styles.fileActionBtn}
																	onClick={(e) => {
																		e.stopPropagation()
																		handleUnstageFile(rs.repo.path, f.path)
																	}}
																>
																	−
																</div>
															</Tooltip>
														</div>
													</div>
												))}
											</>
										)}

										{unstaged.length > 0 && (
											<>
												<div className={styles.sectionHeader}>
													<span>{is_cn ? '未暂存' : 'Changes'} ({unstaged.length})</span>
													<div className={styles.sectionActions}>
														<Tooltip title={is_cn ? '全部暂存' : 'Stage All'} overlayInnerStyle={tipStyle}>
															<div
																className={styles.sectionActionBtn}
																onClick={() => handleStageAll(rs.repo.path)}
															>
																+
															</div>
														</Tooltip>
													</div>
												</div>
												{unstaged.map((f) => (
													<div
														key={`unstaged-${f.path}`}
														className={styles.fileItem}
														onClick={() => openDiff(rs.repo.path, f.path, false)}
													>
														<span className={`${styles.statusBadge} ${statusBadgeClass(f.worktree_status)}`}>
															{displayStatus(f, false)}
														</span>
														<span className={styles.fileName}>{f.path}</span>
														<div className={styles.fileActions}>
															<Tooltip title={is_cn ? '暂存' : 'Stage'} overlayInnerStyle={tipStyle}>
																<div
																	className={styles.fileActionBtn}
																	onClick={(e) => {
																		e.stopPropagation()
																		handleStageFile(rs.repo.path, f.path)
																	}}
																>
																	+
																</div>
															</Tooltip>
															<Tooltip title={is_cn ? '放弃更改' : 'Discard'} overlayInnerStyle={tipStyle}>
																<div
																	className={styles.fileActionBtn}
																	onClick={(e) => {
																		e.stopPropagation()
																		handleDiscardFile(rs.repo.path, f.path)
																	}}
																>
																	×
																</div>
															</Tooltip>
														</div>
													</div>
												))}
											</>
										)}

										{staged.length > 0 && (
											<div className={styles.commitArea}>
												<textarea
													className={styles.commitInput}
													rows={2}
													placeholder={is_cn ? '提交信息...' : 'Commit message...'}
													value={commitMessages[rs.repo.path] || ''}
													onChange={(e) =>
														setCommitMessages((prev) => ({
															...prev,
															[rs.repo.path]: e.target.value
														}))
													}
													onKeyDown={(e) => {
														if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
															handleCommit(rs.repo.path)
														}
													}}
												/>
												<div className={styles.commitActions}>
													<button
														className={styles.commitBtn}
														onClick={() => handleCommit(rs.repo.path)}
														disabled={!commitMessages[rs.repo.path]?.trim()}
													>
														{is_cn ? '提交' : 'Commit'}
													</button>
												</div>
											</div>
										)}
									</>
									) : null}
									</div>
								)}
							</div>
						)
					})
				)}
			</div>
		</div>
	)
}

export default GitChangesPanel
