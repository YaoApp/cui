import { useCallback, useEffect, useMemo, useState } from 'react'
import { getLocale } from '@umijs/max'
import { Modal, message } from 'antd'
import Icon from '@/widgets/Icon'
import { WorkspaceAPI } from '@/openapi/workspace'
import { useAppRoute, type AppRouteProps } from '@/hooks/useAppRoute'
import type { GitRepo, GitChangedFile, GitStatusResponse } from '@/pages/workspace/types'
import styles from './index.less'

interface RepoStatus {
	repo: GitRepo
	status: GitStatusResponse | null
	loading: boolean
	expanded: boolean
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

const Index = (props: AppRouteProps) => {
	const { search } = useAppRoute(props)
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const params = useMemo(() => new URLSearchParams(search), [search])
	const wsId = params.get('ws') || ''

	const [repoStatuses, setRepoStatuses] = useState<RepoStatus[]>([])
	const [loading, setLoading] = useState(true)
	const [commitMessages, setCommitMessages] = useState<Record<string, string>>({})

	const getApi = useCallback((): WorkspaceAPI | null => {
		if (!window.$app?.openapi) return null
		return new WorkspaceAPI(window.$app.openapi)
	}, [])

	const loadData = useCallback(async () => {
		if (!wsId) return
		const api = getApi()
		if (!api) return
		setLoading(true)
		try {
			const reposRes = await api.GitListRepos(wsId)
			const repos: GitRepo[] = reposRes?.data || reposRes || []
			const statuses: RepoStatus[] = await Promise.all(
				repos.map(async (repo) => {
					if (!repo.has_changes) {
						return { repo, status: null, loading: false, expanded: false }
					}
					try {
						const statusRes = await api.GitStatus(wsId, repo.path)
						const status: GitStatusResponse = statusRes?.data || statusRes
						return { repo, status, loading: false, expanded: true }
					} catch {
						return { repo, status: null, loading: false, expanded: true }
					}
				})
			)
			setRepoStatuses(statuses)
		} catch (e: any) {
			message.error(e?.message || 'Failed to load repos')
		} finally {
			setLoading(false)
		}
	}, [wsId, getApi])

	useEffect(() => {
		loadData()
	}, [loadData])

	const toggleExpand = useCallback((idx: number) => {
		setRepoStatuses((prev) =>
			prev.map((rs, i) => (i === idx ? { ...rs, expanded: !rs.expanded } : rs))
		)
	}, [])

	const stagedFiles = useCallback(
		(status: GitStatusResponse | null): GitChangedFile[] => {
			if (!status) return []
			return status.files.filter(
				(f) => f.index_status && f.index_status.trim() !== '' && f.index_status !== '?'
			)
		},
		[]
	)

	const unstagedFiles = useCallback(
		(status: GitStatusResponse | null): GitChangedFile[] => {
			if (!status) return []
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
				loadData()
			} catch (e: any) {
				message.error(e?.message || 'Stage failed')
			}
		},
		[wsId, getApi, loadData]
	)

	const handleUnstageFile = useCallback(
		async (repoPath: string, filePath: string) => {
			const api = getApi()
			if (!api) return
			try {
				await api.GitReset(wsId, repoPath, [filePath])
				loadData()
			} catch (e: any) {
				message.error(e?.message || 'Unstage failed')
			}
		},
		[wsId, getApi, loadData]
	)

	const handleStageAll = useCallback(
		async (repoPath: string) => {
			const api = getApi()
			if (!api) return
			try {
				await api.GitAdd(wsId, repoPath)
				loadData()
			} catch (e: any) {
				message.error(e?.message || 'Stage all failed')
			}
		},
		[wsId, getApi, loadData]
	)

	const handleUnstageAll = useCallback(
		async (repoPath: string) => {
			const api = getApi()
			if (!api) return
			try {
				await api.GitReset(wsId, repoPath)
				loadData()
			} catch (e: any) {
				message.error(e?.message || 'Unstage all failed')
			}
		},
		[wsId, getApi, loadData]
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
						loadData()
					} catch (e: any) {
						message.error(e?.message || 'Discard failed')
					}
				}
			})
		},
		[wsId, getApi, loadData, is_cn]
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
				loadData()
			} catch (e: any) {
				message.error(e?.message || 'Commit failed')
			}
		},
		[wsId, getApi, commitMessages, loadData, is_cn]
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

	const changedRepos = repoStatuses.filter((rs) => rs.repo.has_changes)

	return (
		<div className={styles.container}>
			<div className={styles.toolbar}>
				<Icon name='icon-git-commit' size={16} />
				<span className={styles.title}>{is_cn ? '文件变更' : 'File Changes'}</span>
				<div className={styles.refreshBtn} onClick={loadData} title={is_cn ? '刷新' : 'Refresh'}>
					<Icon name='material-refresh' size={16} />
				</div>
			</div>

			<div className={styles.content}>
				{loading ? (
					<div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
				) : changedRepos.length === 0 ? (
					<div className={styles.empty}>
						<Icon name='icon-git-commit' size={32} />
						<span>{is_cn ? '没有未提交的变更' : 'No uncommitted changes'}</span>
					</div>
				) : (
					changedRepos.map((rs, idx) => {
						const staged = stagedFiles(rs.status)
						const unstaged = unstagedFiles(rs.status)
						const realIdx = repoStatuses.indexOf(rs)

						return (
							<div key={rs.repo.path} className={styles.repoGroup}>
								<div className={styles.repoHeader} onClick={() => toggleExpand(realIdx)}>
									<Icon
										name={rs.expanded ? 'material-expand_more' : 'material-chevron_right'}
										size={14}
									/>
									<span>{rs.repo.path === '.' ? '/' : rs.repo.path}</span>
									<span className={styles.branch}>{rs.status?.branch || rs.repo.branch}</span>
									<span className={styles.changeCount}>
										{(rs.status?.files?.length || 0)} {is_cn ? '个变更' : 'changes'}
									</span>
								</div>

								{rs.expanded && rs.status && (
									<div className={styles.section}>
										{staged.length > 0 && (
											<>
												<div className={styles.sectionHeader}>
													<span>{is_cn ? '已暂存' : 'Staged Changes'} ({staged.length})</span>
													<div className={styles.sectionActions}>
														<div
															className={styles.actionBtn}
															onClick={() => handleUnstageAll(rs.repo.path)}
															title={is_cn ? '全部取消暂存' : 'Unstage All'}
														>
															−
														</div>
													</div>
												</div>
												{staged.map((f) => (
													<div
														key={`staged-${f.path}`}
														className={styles.fileItem}
														onClick={() => openDiff(rs.repo.path, f.path, true)}
													>
														<span
															className={`${styles.statusBadge} ${statusBadgeClass(f.index_status)}`}
														>
															{displayStatus(f, true)}
														</span>
														<span className={styles.fileName}>{f.path}</span>
														<div className={styles.fileActions}>
															<div
																className={styles.fileActionBtn}
																onClick={(e) => {
																	e.stopPropagation()
																	handleUnstageFile(rs.repo.path, f.path)
																}}
																title={is_cn ? '取消暂存' : 'Unstage'}
															>
																−
															</div>
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
														<div
															className={styles.actionBtn}
															onClick={() => handleStageAll(rs.repo.path)}
															title={is_cn ? '全部暂存' : 'Stage All'}
														>
															+
														</div>
													</div>
												</div>
												{unstaged.map((f) => (
													<div
														key={`unstaged-${f.path}`}
														className={styles.fileItem}
														onClick={() => openDiff(rs.repo.path, f.path, false)}
													>
														<span
															className={`${styles.statusBadge} ${statusBadgeClass(f.worktree_status)}`}
														>
															{displayStatus(f, false)}
														</span>
														<span className={styles.fileName}>{f.path}</span>
														<div className={styles.fileActions}>
															<div
																className={styles.fileActionBtn}
																onClick={(e) => {
																	e.stopPropagation()
																	handleStageFile(rs.repo.path, f.path)
																}}
																title={is_cn ? '暂存' : 'Stage'}
															>
																+
															</div>
															<div
																className={styles.fileActionBtn}
																onClick={(e) => {
																	e.stopPropagation()
																	handleDiscardFile(rs.repo.path, f.path)
																}}
																title={is_cn ? '放弃更改' : 'Discard'}
															>
																×
															</div>
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

export default window.$app.memo(Index)
