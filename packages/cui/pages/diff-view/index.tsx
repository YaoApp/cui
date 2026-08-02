import { useCallback, useEffect, useMemo, useState } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import { WorkspaceAPI } from '@/openapi/workspace'
import DiffViewer from '@/components/view/DiffViewer'
import { useAppRoute, type AppRouteProps } from '@/hooks/useAppRoute'
import type { GitFileDiffResponse } from '@/pages/workspace/types'
import styles from './index.less'

const Index = (props: AppRouteProps) => {
	const { search } = useAppRoute(props)
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const params = useMemo(() => new URLSearchParams(search), [search])
	const wsId = params.get('ws') || ''
	const repoPath = params.get('repo') || ''
	const filePath = params.get('file') || ''
	const staged = params.get('staged') === 'true'

	const [diff, setDiff] = useState<GitFileDiffResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [sideBySide, setSideBySide] = useState(true)

	const getApi = useCallback((): WorkspaceAPI | null => {
		if (!window.$app?.openapi) return null
		return new WorkspaceAPI(window.$app.openapi)
	}, [])

	const loadDiff = useCallback(async () => {
		if (!wsId || !repoPath || !filePath) return
		const api = getApi()
		if (!api) return
		setLoading(true)
		setError('')
		try {
			const res = await api.GitFileDiff(wsId, repoPath, filePath, staged)
			const data: GitFileDiffResponse = res?.data || res
			setDiff(data)
		} catch (e: any) {
			setError(e?.message || 'Failed to load diff')
			message.error(e?.message || 'Failed to load diff')
		} finally {
			setLoading(false)
		}
	}, [wsId, repoPath, filePath, staged, getApi])

	useEffect(() => {
		loadDiff()
	}, [loadDiff])

	const fileName = filePath.split('/').pop() || filePath

	return (
		<div className={styles.container}>
			<div className={styles.toolbar}>
				<div className={styles.fileInfo}>
					<span className={styles.fileName}>{fileName}</span>
					<span className={`${styles.statusTag} ${staged ? styles.staged : styles.unstaged}`}>
						{staged ? (is_cn ? '已暂存' : 'Staged') : (is_cn ? '未暂存' : 'Unstaged')}
					</span>
				</div>
				<div className={styles.tabSwitch}>
					<span
						className={`${styles.tabItem} ${sideBySide ? styles.tabItemActive : ''}`}
						onClick={() => setSideBySide(true)}
					>
						{is_cn ? '并排' : 'Side by Side'}
					</span>
					<span
						className={`${styles.tabItem} ${!sideBySide ? styles.tabItemActive : ''}`}
						onClick={() => setSideBySide(false)}
					>
						{is_cn ? '内联' : 'Inline'}
					</span>
				</div>
			</div>

			<div className={styles.editorWrapper}>
				{loading ? (
					<div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
				) : error ? (
					<div className={styles.error}>{error}</div>
				) : diff ? (
					<DiffViewer
						original={diff.original}
						modified={diff.modified}
						language={diff.language}
						sideBySide={sideBySide}
						isBinary={diff.is_binary}
						isNew={diff.is_new}
						isDeleted={diff.is_deleted}
						isTooLarge={diff.is_too_large}
					/>
				) : null}
			</div>
		</div>
	)
}

export default window.$app.memo(Index)
