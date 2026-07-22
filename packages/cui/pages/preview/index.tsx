import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getLocale } from '@umijs/max'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import Icon from '@/widgets/Icon'
import { WorkspaceAPI } from '@/openapi/workspace'
import Image from '@/components/view/FileViewer/viewers/Image'
import Video from '@/components/view/FileViewer/viewers/Video'
import Audio from '@/components/view/FileViewer/viewers/Audio'
import Text from '@/components/view/FileViewer/viewers/Text'
import Pdf from '@/components/view/FileViewer/viewers/Pdf'
import Docx from '@/components/view/FileViewer/viewers/Docx'
import Pptx from '@/components/view/FileViewer/viewers/Pptx'
import Unsupported from '@/components/view/FileViewer/viewers/Unsupported'
import { MENTION_DRAG_TYPE, setMentionDragImage, type MentionData } from '@/chatbox/utils/mention'
import type { DirEntry } from '@/pages/workspace/types'
import FileTree, { type FileTreeHandle } from './components/FileTree'
import viewerStyles from '@/components/view/FileViewer/index.less'
import styles from './index.less'
import { useAppRoute, type AppRouteProps } from '@/hooks/useAppRoute'

const imageExts = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff', 'ico'])
const videoExts = new Set(['mp4', 'avi', 'mov', 'mkv', 'flv', 'webm', 'wmv'])
const audioExts = new Set(['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'])
const docExts = new Set(['pdf', 'docx', 'pptx'])
const textExts = new Set([
	'txt',
	'md',
	'mdx',
	'log',
	'ini',
	'cfg',
	'csv',
	'json',
	'jsonc',
	'yaml',
	'yml',
	'xml',
	'py',
	'js',
	'mjs',
	'ts',
	'jsx',
	'tsx',
	'java',
	'cpp',
	'go',
	'sh',
	'css',
	'sql',
	'php',
	'rb',
	'rs',
	'c',
	'h',
	'yao',
	'less',
	'scss',
	'toml',
	'env',
	'html',
	'htm'
])

const languageMap: Record<string, string> = {
	js: 'javascript',
	mjs: 'javascript',
	jsx: 'javascript',
	ts: 'typescript',
	tsx: 'typescript',
	py: 'python',
	java: 'java',
	cpp: 'cpp',
	c: 'c',
	go: 'go',
	rs: 'rust',
	php: 'php',
	rb: 'ruby',
	sh: 'bash',
	sql: 'sql',
	css: 'css',
	scss: 'scss',
	less: 'less',
	html: 'html',
	htm: 'html',
	xml: 'xml',
	json: 'json',
	jsonc: 'json',
	yao: 'json',
	yaml: 'yaml',
	yml: 'yaml',
	md: 'markdown',
	mdx: 'markdown',
	txt: 'text',
	log: 'text'
}

type FileType = 'image' | 'video' | 'audio' | 'pdf' | 'docx' | 'pptx' | 'text' | 'unsupported'

function getFileType(ext: string): FileType {
	if (imageExts.has(ext)) return 'image'
	if (videoExts.has(ext)) return 'video'
	if (audioExts.has(ext)) return 'audio'
	if (ext === 'pdf') return 'pdf'
	if (ext === 'docx') return 'docx'
	if (ext === 'pptx') return 'pptx'
	if (textExts.has(ext)) return 'text'
	return 'unsupported'
}

const Preview = (props: AppRouteProps) => {
	const { search } = useAppRoute(props)
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const params = useMemo(() => new URLSearchParams(search), [search])
	const ws = params.get('ws') || ''
	const filePath = params.get('path') || ''
	const fileName = filePath.split('/').pop() || filePath
	const ext = fileName.split('.').pop()?.toLowerCase() || ''
	const isHtml = ext === 'html' || ext === 'htm'
	const isMarkdown = ext === 'md' || ext === 'mdx' || ext === 'markdown'
	const fileType = getFileType(ext)
	const language = languageMap[ext] || 'text'

	const [tab, setTab] = useState<'preview' | 'source'>('preview')
	const [textContent, setTextContent] = useState<string | undefined>(undefined)
	const [sourceContent, setSourceContent] = useState<string | undefined>(undefined)
	const [loading, setLoading] = useState(false)
	const [showTree, setShowTree] = useState(() => {
		try { return localStorage.getItem('preview_show_tree') === '1' } catch { return false }
	})
	const [treeWidth, setTreeWidth] = useState(() => {
		try { return parseInt(localStorage.getItem('preview_tree_width') || '220', 10) || 220 } catch { return 220 }
	})
	const [dirEntries, setDirEntries] = useState<DirEntry[] | null>(null)
	const [dirLoading, setDirLoading] = useState(false)
	const [iframeKey, setIframeKey] = useState(0)
	const [contentVersion, setContentVersion] = useState(0)
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const fileTreeRef = useRef<FileTreeHandle>(null)
	const resizingRef = useRef(false)
	const startXRef = useRef(0)
	const startWidthRef = useRef(220)

	const handleResizeStart = useCallback((e: React.MouseEvent) => {
		e.preventDefault()
		resizingRef.current = true
		startXRef.current = e.clientX
		startWidthRef.current = treeWidth
		let lastWidth = treeWidth

		const onMove = (ev: MouseEvent) => {
			if (!resizingRef.current) return
			const delta = ev.clientX - startXRef.current
			const newWidth = Math.min(Math.max(startWidthRef.current + delta, 140), 480)
			lastWidth = newWidth
			setTreeWidth(newWidth)
		}

		const onUp = () => {
			resizingRef.current = false
			document.removeEventListener('mousemove', onMove)
			document.removeEventListener('mouseup', onUp)
			document.body.style.cursor = ''
			document.body.style.userSelect = ''
			try { localStorage.setItem('preview_tree_width', String(lastWidth)) } catch {}
		}

		document.body.style.cursor = 'col-resize'
		document.body.style.userSelect = 'none'
		document.addEventListener('mousemove', onMove)
		document.addEventListener('mouseup', onUp)
	}, [treeWidth])

	const getApi = useCallback((): WorkspaceAPI | null => {
		if (!window.$app?.openapi) return null
		return new WorkspaceAPI(window.$app.openapi)
	}, [])

	const contentURL = useMemo(() => {
		const api = getApi()
		if (!api || !ws || !filePath) return ''
		return api.ContentURL(ws, filePath)
	}, [ws, filePath, getApi])

	const previewURL = useMemo(() => {
		if (!isHtml || !ws || !filePath) return ''
		const base = (window.$app?.openapi as any)?.config?.baseURL ?? '/v1'
		const normalized = filePath.startsWith('/') ? filePath.slice(1) : filePath
		return `${base}/workspace/${encodeURIComponent(ws)}/preview/${normalized}`
	}, [ws, filePath, isHtml])

	const pathHint = filePath.endsWith('/')

	useEffect(() => {
		if (!ws || !filePath) {
			setDirEntries(null)
			return
		}
		if (!pathHint && fileType !== 'unsupported') {
			setDirEntries(null)
			return
		}
		setDirLoading(true)
		const api = getApi()
		if (!api) { setDirLoading(false); return }
		const dirPath = '/' + filePath.replace(/\/$/, '')
		api.ListDir(ws, dirPath || '/')
			.then((resp) => {
				if (window.$app.openapi.IsError(resp)) {
					setDirEntries(null)
				} else {
					const data = resp.data || []
					const sorted = [...data].sort((a: DirEntry, b: DirEntry) => {
						if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
						return a.name.localeCompare(b.name)
					})
					setDirEntries(sorted)
				}
			})
			.catch(() => setDirEntries(null))
			.finally(() => setDirLoading(false))
	}, [ws, filePath, fileType, pathHint, getApi])

	useEffect(() => {
		if (!ws || !filePath) return
		if (isHtml) return
		if (fileType !== 'text') return

		const api = getApi()
		if (!api) return

		setLoading(true)
		api.ReadFile(ws, filePath)
			.then((resp) => {
				if (window.$app.openapi.IsError(resp)) {
					setTextContent(is_cn ? '加载文件失败' : 'Failed to load file')
				} else {
					const text =
						typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data, null, 2)
					setTextContent(text)
				}
			})
			.catch(() => {
				setTextContent(is_cn ? '加载文件失败' : 'Failed to load file')
			})
			.finally(() => {
				setLoading(false)
			})
	}, [ws, filePath, fileType, isHtml, is_cn, getApi])

	useEffect(() => {
		if (!isHtml || tab !== 'source' || sourceContent !== undefined) return

		const api = getApi()
		if (!api) return

		setLoading(true)
		api.ReadFile(ws, filePath)
			.then((resp) => {
				if (window.$app.openapi.IsError(resp)) {
					setSourceContent(is_cn ? '加载文件失败' : 'Failed to load file')
				} else {
					const text =
						typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data, null, 2)
					setSourceContent(text)
				}
			})
			.catch(() => {
				setSourceContent(is_cn ? '加载文件失败' : 'Failed to load file')
			})
			.finally(() => {
				setLoading(false)
			})
	}, [ws, filePath, isHtml, tab, sourceContent, is_cn, getApi])

	useEffect(() => {
		setTab('preview')
		setSourceContent(undefined)
	}, [filePath])

	const handleFileSelect = useCallback(
		(newPath: string) => {
			if (newPath === filePath) return
			const newFileName = newPath.split('/').pop() || newPath
			const url = `/preview?ws=${encodeURIComponent(ws)}&path=${encodeURIComponent(newPath)}`
			window.$app.Navigate(url, { title: newFileName, replace: true })
		},
		[ws, filePath]
	)

	const handleDownload = async () => {
		if (!contentURL) return
		try {
			const resp = await fetch(contentURL, { credentials: 'include' })
			if (!resp.ok) return
			const blob = await resp.blob()
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = fileName
			a.style.display = 'none'
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
		} catch {
			// silent fail
		}
	}

	const reloadDirEntries = useCallback(() => {
		if (!ws || !filePath) return
		const api = getApi()
		if (!api) return
		setDirLoading(true)
		const dirPath = '/' + filePath.replace(/\/$/, '')
		api.ListDir(ws, dirPath || '/')
			.then((resp) => {
				if (window.$app.openapi.IsError(resp)) {
					setDirEntries(null)
				} else {
					const data = resp.data || []
					const sorted = [...data].sort((a: DirEntry, b: DirEntry) => {
						if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
						return a.name.localeCompare(b.name)
					})
					setDirEntries(sorted)
				}
			})
			.catch(() => setDirEntries(null))
			.finally(() => setDirLoading(false))
	}, [ws, filePath, getApi])

	const reloadTextContent = useCallback(() => {
		const api = getApi()
		if (!api) return
		setLoading(true)
		api.ReadFile(ws, filePath)
			.then((resp) => {
				if (!window.$app.openapi.IsError(resp)) {
					const text =
						typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data, null, 2)
					setTextContent(text)
				}
			})
			.finally(() => setLoading(false))
	}, [ws, filePath, getApi])

	const handleRefresh = useCallback(() => {
		fileTreeRef.current?.refresh()

		if (dirEntries !== null) {
			reloadDirEntries()
			return
		}

		if (isHtml) {
			setIframeKey((k) => k + 1)
		} else if (isMarkdown || fileType === 'text') {
			reloadTextContent()
		} else if (fileType === 'image' || fileType === 'video' || fileType === 'audio') {
			setContentVersion((v) => v + 1)
		} else if (fileType === 'pdf' || fileType === 'docx' || fileType === 'pptx') {
			setIframeKey((k) => k + 1)
		}
	}, [isHtml, isMarkdown, fileType, dirEntries, reloadDirEntries, reloadTextContent])

	const handleIframeLoad = useCallback(() => {
		try {
			const doc = iframeRef.current?.contentDocument
			if (!doc) return
			const style = doc.createElement('style')
			style.textContent = `
				::-webkit-scrollbar { width: 6px; height: 6px; }
				::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
				::-webkit-scrollbar-track { background: transparent; }
			`
			doc.head?.appendChild(style)
		} catch {
			// cross-origin or sandbox restriction
		}
	}, [])

	useEffect(() => {
		const handler = () => handleRefresh()
		window.$app?.Event?.on('app/refreshTab', handler)
		return () => { window.$app?.Event?.off('app/refreshTab', handler) }
	}, [handleRefresh])

	if (!ws || !filePath) {
		return (
			<div className={styles.container}>
				<div className={styles.empty}>{is_cn ? '无文件可预览' : 'No file to preview'}</div>
			</div>
		)
	}

	const getDirEntryIcon = (entry: DirEntry): string => {
		if (entry.is_dir) return 'material-folder'
		const e = entry.name.split('.').pop()?.toLowerCase() || ''
		const map: Record<string, string> = {
			ts: 'material-code', tsx: 'material-code', js: 'material-javascript',
			json: 'material-data_object', md: 'material-description',
			yaml: 'material-settings', yml: 'material-settings',
			py: 'material-code', go: 'material-code', sh: 'material-terminal',
			csv: 'material-table_chart', html: 'material-web', htm: 'material-web'
		}
		return map[e] || 'material-insert_drive_file'
	}

	const formatSize = (bytes: number): string => {
		if (bytes === 0) return '\u2014'
		const units = ['B', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(1024))
		return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
	}

	const dirBasePath = filePath.endsWith('/') ? filePath : filePath + '/'

	const renderViewer = () => {
		if (dirLoading) {
			return <div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
		}

		if (dirEntries !== null) {
			if (dirEntries.length === 0) {
				return (
					<div className={styles.dirEmpty}>
						<Icon name='material-folder_off' size={40} />
						<span>{is_cn ? '空目录' : 'Empty directory'}</span>
					</div>
				)
			}
			return (
				<div className={styles.dirList}>
					{dirEntries.map((entry) => (
						<div
							key={entry.name}
							className={`${styles.dirRow} ${entry.is_dir ? styles.dirRowDir : ''}`}
							onClick={() => {
								if (entry.is_dir) {
									handleFileSelect(dirBasePath + entry.name + '/')
								} else {
									handleFileSelect(dirBasePath + entry.name)
								}
							}}
							draggable
							onDragStart={(e) => {
								const entryPath = dirBasePath + entry.name
								const mentionData: MentionData = {
									type: entry.is_dir ? 'directory' : 'file',
									id: `workspace://${ws}/${entryPath}`,
									label: entry.name
								}
								e.dataTransfer.setData(MENTION_DRAG_TYPE, JSON.stringify(mentionData))
								e.dataTransfer.effectAllowed = 'copy'
								setMentionDragImage(e, mentionData)
							}}
						>
							<div className={styles.dirIcon}>
								<Icon name={getDirEntryIcon(entry)} size={18} />
							</div>
							<div className={styles.dirName}>{entry.name}</div>
							<div className={styles.dirTime}>
								{entry.mod_time
									? new Date(entry.mod_time).toLocaleString(
											is_cn ? 'zh-CN' : 'en-US',
											{ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
									  )
									: '\u2014'}
							</div>
							<div className={styles.dirSize}>
								{entry.is_dir ? '\u2014' : formatSize(entry.size)}
							</div>
						</div>
					))}
				</div>
			)
		}

		if (loading) {
			return <div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
		}

		if (isHtml) {
			if (tab === 'preview') {
				return (
					<iframe
						ref={iframeRef}
						key={iframeKey}
						src={previewURL}
						className={styles.iframe}
						sandbox='allow-scripts allow-same-origin allow-popups allow-forms'
						title='HTML Preview'
						onLoad={handleIframeLoad}
					/>
				)
			}
			return <Text content={sourceContent} fileName={fileName} language='html' />
		}

		const versionedURL = contentVersion > 0
			? `${contentURL}${contentURL.includes('?') ? '&' : '?'}_v=${contentVersion}`
			: contentURL

		switch (fileType) {
			case 'image':
				return <Image src={versionedURL} fileName={fileName} />
			case 'video':
				return <Video src={versionedURL} fileName={fileName} />
			case 'audio':
				return <Audio src={versionedURL} fileName={fileName} />
			case 'pdf':
				return <Pdf key={iframeKey} src={contentURL} fileName={fileName} />
			case 'docx':
				return <Docx key={iframeKey} src={contentURL} fileName={fileName} />
			case 'pptx':
				return <Pptx key={iframeKey} src={contentURL} fileName={fileName} />
			case 'text':
				return (
					<Text
						content={textContent}
						fileName={fileName}
						language={language}
						markdownPreview={isMarkdown && tab === 'preview'}
					/>
				)
			default:
				return <Unsupported src={contentURL} fileName={fileName} />
		}
	}

	return (
		<div className={styles.container}>
			<div className={styles.toolbar}>
				<span
					className={`${styles.toggleBtn} ${showTree ? styles.toggleBtnActive : ''}`}
					onClick={() => setShowTree((v) => {
						const next = !v
						try { localStorage.setItem('preview_show_tree', next ? '1' : '0') } catch {}
						return next
					})}
					title={is_cn ? '文件树' : 'File tree'}
				>
					<Icon name={showTree ? 'material-left_panel_close' : 'material-left_panel_open'} size={16} />
				</span>
				<span
					className={styles.fileName}
					draggable
					onDragStart={(e) => {
						const mentionData: MentionData = {
							type: dirEntries !== null ? 'directory' : 'file',
							id: `workspace://${ws}/${filePath}`,
							label: dirEntries !== null ? filePath : fileName
						}
						e.dataTransfer.setData(MENTION_DRAG_TYPE, JSON.stringify(mentionData))
						e.dataTransfer.effectAllowed = 'copy'
						setMentionDragImage(e, mentionData)
					}}
				>
					{dirEntries !== null ? filePath : fileName}
				</span>
				{dirEntries === null && fileType === 'text' && !isHtml && !isMarkdown && (
					<span className={styles.langBadge}>{ext}</span>
				)}
				<span className={styles.spacer} />
				{dirEntries === null && (isHtml || isMarkdown) && (
					<div className={styles.tabSwitch}>
						<span
							className={`${styles.tabItem} ${
								tab === 'preview' ? styles.tabItemActive : ''
							}`}
							onClick={() => setTab('preview')}
						>
							Preview
						</span>
						<span
							className={`${styles.tabItem} ${
								tab === 'source' ? styles.tabItemActive : ''
							}`}
							onClick={() => setTab('source')}
						>
							Source
						</span>
					</div>
				)}
			{tab === 'preview' && (
				<span
					className={styles.downloadBtn}
					onClick={handleRefresh}
					title={is_cn ? '刷新' : 'Refresh'}
				>
					<ReloadOutlined />
				</span>
			)}
				{dirEntries === null && (
					<span
						className={styles.downloadBtn}
						onClick={handleDownload}
						title={is_cn ? '下载' : 'Download'}
					>
						<DownloadOutlined />
					</span>
				)}
			</div>
			<div className={styles.body}>
				{showTree && ws && (
					<div className={styles.treePanel} style={{ width: treeWidth, minWidth: treeWidth }}>
						<FileTree
							ref={fileTreeRef}
							workspaceId={ws}
							currentPath={filePath}
							onSelect={handleFileSelect}
						/>
						<div
							className={styles.resizeHandle}
							onMouseDown={handleResizeStart}
						/>
					</div>
				)}
				<div className={`${styles.content} ${viewerStyles._local}`}>
					{renderViewer()}
				</div>
			</div>
		</div>
	)
}

export default window.$app.memo(Preview)
