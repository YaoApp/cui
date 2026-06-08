import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from '@umijs/max'
import { getLocale } from '@umijs/max'
import { DownloadOutlined } from '@ant-design/icons'
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
import FileTree from './components/FileTree'
import viewerStyles from '@/components/view/FileViewer/index.less'
import styles from './index.less'

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

const Preview = () => {
	const { search } = useLocation()
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
	const [showTree, setShowTree] = useState(false)
	const [treeWidth, setTreeWidth] = useState(220)
	const resizingRef = useRef(false)
	const startXRef = useRef(0)
	const startWidthRef = useRef(220)

	const handleResizeStart = useCallback((e: React.MouseEvent) => {
		e.preventDefault()
		resizingRef.current = true
		startXRef.current = e.clientX
		startWidthRef.current = treeWidth

		const onMove = (ev: MouseEvent) => {
			if (!resizingRef.current) return
			const delta = ev.clientX - startXRef.current
			const newWidth = Math.min(Math.max(startWidthRef.current + delta, 140), 480)
			setTreeWidth(newWidth)
		}

		const onUp = () => {
			resizingRef.current = false
			document.removeEventListener('mousemove', onMove)
			document.removeEventListener('mouseup', onUp)
			document.body.style.cursor = ''
			document.body.style.userSelect = ''
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
			window.$app?.Event?.emit('app/replaceRoute', { url, title: newFileName })
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

	if (!ws || !filePath) {
		return (
			<div className={styles.container}>
				<div className={styles.empty}>{is_cn ? '无文件可预览' : 'No file to preview'}</div>
			</div>
		)
	}

	const renderViewer = () => {
		if (loading) {
			return <div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
		}

		if (isHtml) {
			if (tab === 'preview') {
				return (
					<iframe
						src={previewURL}
						className={styles.iframe}
						sandbox='allow-scripts allow-same-origin allow-popups allow-forms'
						title='HTML Preview'
					/>
				)
			}
			return <Text content={sourceContent} fileName={fileName} language='html' />
		}

		switch (fileType) {
			case 'image':
				return <Image src={contentURL} fileName={fileName} />
			case 'video':
				return <Video src={contentURL} fileName={fileName} />
			case 'audio':
				return <Audio src={contentURL} fileName={fileName} />
			case 'pdf':
				return <Pdf src={contentURL} fileName={fileName} />
			case 'docx':
				return <Docx src={contentURL} fileName={fileName} />
			case 'pptx':
				return <Pptx src={contentURL} fileName={fileName} />
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
					onClick={() => setShowTree((v) => !v)}
					title={is_cn ? '文件树' : 'File tree'}
				>
					<Icon name='material-file_copy' size={16} />
				</span>
				<span className={styles.fileName}>{fileName}</span>
				{fileType === 'text' && !isHtml && !isMarkdown && (
					<span className={styles.langBadge}>{ext}</span>
				)}
				<span className={styles.spacer} />
				{(isHtml || isMarkdown) && (
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
				<span
					className={styles.downloadBtn}
					onClick={handleDownload}
					title={is_cn ? '下载' : 'Download'}
				>
					<DownloadOutlined />
				</span>
			</div>
			<div className={styles.body}>
				{showTree && ws && (
					<div className={styles.treePanel} style={{ width: treeWidth, minWidth: treeWidth }}>
						<FileTree
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
