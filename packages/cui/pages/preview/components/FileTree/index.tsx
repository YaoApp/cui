import { useState, useEffect, useCallback, useRef } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { WorkspaceAPI } from '@/openapi/workspace'
import { MENTION_DRAG_TYPE, setMentionDragImage, type MentionData } from '@/chatbox/utils/mention'
import type { DirEntry } from '@/pages/workspace/types'
import styles from './index.less'

interface FileTreeProps {
	workspaceId: string
	currentPath: string
	onSelect: (path: string) => void
}

function getAncestorPaths(filePath: string): string[] {
	if (!filePath) return ['/']
	const parts = filePath.split('/').filter(Boolean)
	const ancestors: string[] = ['/']
	for (let i = 0; i < parts.length - 1; i++) {
		ancestors.push('/' + parts.slice(0, i + 1).join('/'))
	}
	return ancestors
}

function sortEntries(entries: DirEntry[]): DirEntry[] {
	return [...entries].sort((a, b) => {
		if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
		return a.name.localeCompare(b.name)
	})
}

function entryPath(parentDir: string, name: string): string {
	return parentDir === '/' ? `/${name}` : `${parentDir}/${name}`
}

function filePathForSelect(dirPath: string, name: string): string {
	const full = entryPath(dirPath, name)
	return full.startsWith('/') ? full.slice(1) : full
}

const FileTree = ({ workspaceId, currentPath, onSelect }: FileTreeProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
	const [dirContents, setDirContents] = useState<Record<string, DirEntry[]>>({})
	const [loadingDirs, setLoadingDirs] = useState<Set<string>>(new Set())
	const [errorDirs, setErrorDirs] = useState<Set<string>>(new Set())
	const initializedRef = useRef(false)
	const currentPathRef = useRef(currentPath)

	const getApi = useCallback((): WorkspaceAPI | null => {
		if (!window.$app?.openapi) return null
		return new WorkspaceAPI(window.$app.openapi)
	}, [])

	const loadDir = useCallback(
		async (dirPath: string): Promise<DirEntry[] | null> => {
			const api = getApi()
			if (!api) return null

			setLoadingDirs((prev) => new Set(prev).add(dirPath))
			setErrorDirs((prev) => {
				const next = new Set(prev)
				next.delete(dirPath)
				return next
			})

			try {
				const resp = await api.ListDir(workspaceId, dirPath)
				if (window.$app.openapi.IsError(resp)) {
					setErrorDirs((prev) => new Set(prev).add(dirPath))
					return null
				}
				const data = window.$app.openapi.GetData(resp) || []
				const visible = data.filter((e: DirEntry) => !e.name.startsWith('.'))
				const sorted = sortEntries(visible)
				setDirContents((prev) => ({ ...prev, [dirPath]: sorted }))
				return sorted
			} catch {
				setErrorDirs((prev) => new Set(prev).add(dirPath))
				return null
			} finally {
				setLoadingDirs((prev) => {
					const next = new Set(prev)
					next.delete(dirPath)
					return next
				})
			}
		},
		[workspaceId, getApi]
	)

	const expandToPath = useCallback(
		async (filePath: string) => {
			const ancestors = getAncestorPaths(filePath)
			const toLoad = ancestors.filter((p) => !dirContents[p])

			if (toLoad.length > 0) {
				await Promise.all(toLoad.map((p) => loadDir(p)))
			}

			setExpandedDirs((prev) => {
				const next = new Set(prev)
				ancestors.forEach((p) => next.add(p))
				return next
			})
		},
		[dirContents, loadDir]
	)

	useEffect(() => {
		if (!workspaceId || initializedRef.current) return
		initializedRef.current = true
		expandToPath(currentPath)
	}, [workspaceId])

	useEffect(() => {
		if (currentPath === currentPathRef.current) return
		currentPathRef.current = currentPath
		expandToPath(currentPath)
	}, [currentPath, expandToPath])

	const toggleDir = useCallback(
		(dirPath: string) => {
			setExpandedDirs((prev) => {
				const next = new Set(prev)
				if (next.has(dirPath)) {
					next.delete(dirPath)
				} else {
					next.add(dirPath)
					if (!dirContents[dirPath]) {
						loadDir(dirPath)
					}
				}
				return next
			})
		},
		[dirContents, loadDir]
	)

	const handleClick = useCallback(
		(entry: DirEntry, parentDir: string) => {
			if (entry.is_dir) {
				toggleDir(entryPath(parentDir, entry.name))
			} else {
				onSelect(filePathForSelect(parentDir, entry.name))
			}
		},
		[toggleDir, onSelect]
	)

	const currentFullPath = currentPath ? '/' + currentPath : ''

	const renderEntries = (dirPath: string, depth: number) => {
		const entries = dirContents[dirPath]
		const isLoading = loadingDirs.has(dirPath)
		const hasError = errorDirs.has(dirPath)

		if (isLoading && !entries) {
			return (
				<div className={styles.loading} style={{ paddingLeft: depth * 16 + 8 }}>
					{is_cn ? '加载中...' : 'Loading...'}
				</div>
			)
		}

		if (hasError && !entries) {
			return (
				<div className={styles.error} style={{ paddingLeft: depth * 16 + 8 }}>
					{is_cn ? '加载失败' : 'Failed'}
				</div>
			)
		}

		if (!entries) return null

		return entries.map((entry) => {
			const fullPath = entryPath(dirPath, entry.name)
			const isExpanded = expandedDirs.has(fullPath)
			const isActive = currentFullPath === fullPath

			return (
				<div key={fullPath}>
					<div
						className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
						style={{ paddingLeft: depth * 16 + 8 }}
						onClick={() => handleClick(entry, dirPath)}
						draggable
						onDragStart={(e) => {
							const filePath = filePathForSelect(dirPath, entry.name)
							const mentionData: MentionData = {
								type: entry.is_dir ? 'directory' : 'file',
								id: `workspace://${workspaceId}/${filePath}`,
								label: entry.name
							}
							e.dataTransfer.setData(MENTION_DRAG_TYPE, JSON.stringify(mentionData))
							e.dataTransfer.effectAllowed = 'copy'
							setMentionDragImage(e, mentionData)
						}}
					>
						{entry.is_dir ? (
							<Icon
								name={isExpanded ? 'material-folder_open' : 'material-folder'}
								size={16}
								className={styles.icon}
							/>
						) : (
							<Icon
								name='material-insert_drive_file'
								size={16}
								className={styles.icon}
							/>
						)}
						<span className={styles.name}>{entry.name}</span>
					</div>
					{entry.is_dir && isExpanded && renderEntries(fullPath, depth + 1)}
				</div>
			)
		})
	}

	return <div className={styles.tree}>{renderEntries('/', 0)}</div>
}

export default FileTree
