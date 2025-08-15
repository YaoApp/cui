import type { Component } from '@/types'
import { GetPreviewURL } from '@/components/edit/Upload/request/storages/utils'
import { getToken } from '@/knife'
import { useEffect, useMemo, useState } from 'react'
import { Button } from 'antd'
import { FullscreenOutlined, FullscreenExitOutlined, DownloadOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import clsx from 'clsx'
import styles from './index.less'
import { FileAPI } from '@/openapi'

// Import viewers
import Image from './viewers/Image'
import Video from './viewers/Video'
import Audio from './viewers/Audio'
import Text from './viewers/Text'
import Pdf from './viewers/Pdf'
import Docx from './viewers/Docx'
import Pptx from './viewers/Pptx'

import Unsupported from './viewers/Unsupported'

interface IProps extends Component.PropsViewComponent {
	previewURL?: string
	useAppRoot?: boolean
	api?: string | { api: string; params: string }
	showMaximize?: boolean
	src?: string
	file?: File
	content?: string // 新增：直接传递文本内容
	contentType?: string
	style?: React.CSSProperties
	// 新增支持通过 file ID 和 uploader 加载文件
	fileID?: string
	uploader?: string
}

const Index = (props: IProps) => {
	const {
		__value,
		onSave,
		api,
		useAppRoot,
		previewURL,
		style,
		showMaximize = true,
		src,
		file,
		content,
		contentType,
		fileID,
		uploader,
		...rest_props
	} = props

	const [url, setUrl] = useState<string>()
	const [maximized, setMaximized] = useState(false)
	const [fileMetadata, setFileMetadata] = useState<any>()
	const [loading, setLoading] = useState(false)

	const token = getToken()

	// Load file by ID if fileID is provided
	useEffect(() => {
		if (!fileID) return

		const loadFileById = async () => {
			setLoading(true)
			try {
				const fileApi = new FileAPI(window.$app.openapi)

				// 获取文件元数据
				const metadataResponse = await fileApi.Retrieve(fileID, uploader)
				if (window.$app.openapi.IsError(metadataResponse)) {
					console.error('Failed to load file metadata:', metadataResponse.error)
					return
				}
				setFileMetadata(metadataResponse.data)

				// 下载文件内容
				const downloadResponse = await fileApi.Download(fileID, uploader)
				if (window.$app.openapi.IsError(downloadResponse)) {
					console.error('Failed to download file:', downloadResponse.error)
					return
				}

				// 创建 blob URL
				if (downloadResponse.data) {
					const blobUrl = URL.createObjectURL(downloadResponse.data)
					setUrl(blobUrl)
				}
			} catch (error) {
				console.error('Failed to load file by ID:', error)
			} finally {
				setLoading(false)
			}
		}

		loadFileById()

		// 清理 blob URL
		return () => {
			if (url && url.startsWith('blob:')) {
				URL.revokeObjectURL(url)
			}
		}
	}, [fileID, uploader])

	// Generate preview URL if API is provided
	useMemo(() => {
		if (!api || fileID) return // 如果有 fileID，优先使用 fileID 加载
		const generatedUrl = GetPreviewURL({
			response: { path: __value || '' },
			previewURL,
			useAppRoot,
			token,
			api
		})
		setUrl(generatedUrl)
	}, [api, previewURL, useAppRoot, __value, token, fileID])

	// Get file source (priority: src > url > file > __value)
	const getFileSource = (): string | undefined => {
		if (src) return src
		if (url) return url
		if (file) return URL.createObjectURL(file)
		if (__value && typeof __value === 'string') return __value
		return undefined
	}

	// Get file name
	const getFileName = (): string => {
		if (file?.name) return file.name
		if (fileMetadata?.original_filename) return fileMetadata.original_filename
		if (fileMetadata?.name) return fileMetadata.name
		if (__value && typeof __value === 'string') {
			return __value.split('/').pop() || __value
		}
		if (src) {
			return src.split('/').pop() || src
		}
		return 'unknown'
	}

	// Get file extension
	const getFileExtension = (fileName: string): string => {
		const lastDot = fileName.lastIndexOf('.')
		return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : ''
	}

	// Get file type from extension or contentType
	const getFileType = (): string => {
		const actualContentType = contentType || fileMetadata?.content_type
		if (actualContentType) {
			if (actualContentType.startsWith('image/')) return 'image'
			if (actualContentType.startsWith('video/')) return 'video'
			if (actualContentType.startsWith('audio/')) return 'audio'

			// Specific text types first, before generic text/
			if (actualContentType === 'text/markdown') return 'text'
			if (actualContentType === 'text/html') return 'text'
			if (actualContentType === 'text/css') return 'text'
			if (actualContentType === 'text/javascript') return 'text'
			if (actualContentType === 'application/json') return 'text'
			if (actualContentType === 'application/xml') return 'text'
			if (actualContentType === 'text/xml') return 'text'

			// Generic text types
			if (actualContentType.startsWith('text/')) return 'text'

			// Document types
			if (actualContentType === 'application/pdf') return 'pdf'
			if (actualContentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
				return 'docx'
			if (actualContentType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
				return 'pptx'
		}

		const fileName = getFileName()
		const extension = getFileExtension(fileName)

		// Image extensions
		const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff', 'ico']
		if (imageExts.includes(extension)) return 'image'

		// Video extensions
		const videoExts = ['mp4', 'avi', 'mov', 'mkv', 'flv', 'webm', 'wmv']
		if (videoExts.includes(extension)) return 'video'

		// Audio extensions
		const audioExts = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma']
		if (audioExts.includes(extension)) return 'audio'

		// PDF extensions
		if (extension === 'pdf') return 'pdf'

		// Office document extensions
		if (extension === 'docx') return 'docx'
		if (extension === 'pptx') return 'pptx'

		// Text extensions
		const textExts = [
			'txt',
			'md',
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
			'ts',
			'jsx',
			'tsx',
			'java',
			'cpp',
			'go',
			'sh',
			'html',
			'css',
			'yao',
			'sql',
			'php',
			'rb',
			'rs',
			'c',
			'h'
		]
		if (textExts.includes(extension)) return 'text'

		return 'unsupported'
	}

	const fileSource = getFileSource()
	const fileName = getFileName()
	const fileType = getFileType()

	// Handle maximize state
	const handleMaximize = () => {
		setMaximized(!maximized)
	}

	// When maximized, handle Escape to exit maximize and prevent modal close
	useEffect(() => {
		if (!maximized) return

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' || event.code === 'Escape') {
				event.preventDefault()
				event.stopPropagation()
				setMaximized(false)
			}
		}

		window.addEventListener('keydown', handleKeyDown, true)
		return () => {
			window.removeEventListener('keydown', handleKeyDown, true)
		}
	}, [maximized])

	// Return loading state
	if (loading) {
		return (
			<div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
				{getLocale() === 'zh-CN' ? '加载中...' : 'Loading...'}
			</div>
		)
	}

	// Return empty state if no file
	if (!fileSource && !file) {
		return (
			<div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
				{getLocale() === 'zh-CN' ? '暂无文件内容' : 'No file content'}
			</div>
		)
	}

	// Get language for text files
	const getLanguage = (fileName: string): string => {
		// First check MIME type for language detection
		const actualContentType = contentType || fileMetadata?.content_type
		if (actualContentType) {
			if (actualContentType === 'text/markdown') return 'markdown'
			if (actualContentType === 'text/html') return 'html'
			if (actualContentType === 'text/css') return 'css'
			if (actualContentType === 'text/javascript' || actualContentType === 'application/javascript')
				return 'javascript'
			if (actualContentType === 'application/json') return 'json'
			if (actualContentType === 'application/xml' || actualContentType === 'text/xml') return 'xml'
			if (actualContentType === 'text/x-python') return 'python'
		}

		// Fallback to extension-based detection
		const extension = getFileExtension(fileName)
		const extensionMap: Record<string, string> = {
			js: 'javascript',
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
			sass: 'sass',
			less: 'less',
			html: 'html',
			xml: 'xml',
			json: 'json',
			jsonc: 'jsonc',
			yao: 'yao',
			yaml: 'yaml',
			yml: 'yaml',
			md: 'markdown',
			markdown: 'markdown',
			txt: 'text',
			log: 'text'
		}
		return extensionMap[extension] || 'text'
	}

	// 渲染对应的查看器
	const renderViewer = () => {
		if (!fileSource && !file && !content) {
			return <div className={styles.loading}>Loading...</div>
		}

		// 统一的props传递给所有viewer组件
		const viewerProps = {
			src: fileSource,
			file,
			content,
			contentType: contentType || fileMetadata?.content_type,
			fileName
		}

		switch (fileType) {
			case 'image':
				return <Image {...viewerProps} />
			case 'video':
				return <Video {...viewerProps} />
			case 'audio':
				return <Audio {...viewerProps} />
			case 'text':
				return <Text {...viewerProps} language={getLanguage(fileName)} />
			case 'pdf':
				return <Pdf {...viewerProps} />
			case 'docx':
				return <Docx {...viewerProps} />
			case 'pptx':
				return <Pptx {...viewerProps} />
			default:
				return <Unsupported {...viewerProps} />
		}
	}

	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	return (
		<div className={clsx([styles._local, 'xgen-file-viewer', { [styles.maximized]: maximized }])} style={style}>
			{/* 统一的工具栏 - 根据条件显示 */}
			{showMaximize && fileType !== 'unsupported' && (
				<div className={styles.toolbar}>
					{/* 显示语言/扩展名标签，保持统一风格 */}
					<span className={styles.languageTag}>
						{fileType === 'text'
							? getLanguage(fileName)
							: getFileExtension(fileName) || fileType}
					</span>
					{/* 统一的下载按钮 - 所有文件类型都支持 */}
					{fileSource && fileName && (
						<Button
							type='text'
							size='small'
							icon={<DownloadOutlined />}
							onClick={() => {
								const link = document.createElement('a')
								link.href = fileSource
								link.download = fileName
								document.body.appendChild(link)
								link.click()
								document.body.removeChild(link)
							}}
							title={is_cn ? '下载文件' : 'Download File'}
						/>
					)}
					<Button
						type='text'
						size='small'
						icon={maximized ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
						onClick={handleMaximize}
						title={
							maximized
								? is_cn
									? '退出全屏'
									: 'Exit Fullscreen'
								: is_cn
								? '全屏查看'
								: 'Fullscreen'
						}
					/>
				</div>
			)}

			{/* 统一的内容区域 */}
			<div className={styles.content}>{renderViewer()}</div>
		</div>
	)
}

export default window.$app.memo(Index)
