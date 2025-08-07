import type { Component } from '@/types'
import { GetPreviewURL } from '@/components/edit/Upload/request/storages/utils'
import { getToken } from '@/knife'
import { useMemo, useState } from 'react'
import { Button } from 'antd'
import { FullscreenOutlined, FullscreenExitOutlined, DownloadOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import clsx from 'clsx'
import styles from './index.less'

// Import viewers
import Image from './viewers/Image'
import Video from './viewers/Video'
import Audio from './viewers/Audio'
import Text from './viewers/Text'
import Pdf from './viewers/Pdf'
import Unsupported from './viewers/Unsupported'

interface IProps extends Component.PropsViewComponent {
	previewURL?: string
	useAppRoot?: boolean
	api?: string | { api: string; params: string }
	showMaximize?: boolean
	src?: string
	file?: File
	contentType?: string
	style?: React.CSSProperties
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
		contentType,
		...rest_props
	} = props

	const [url, setUrl] = useState<string>()
	const [maximized, setMaximized] = useState(false)

	const token = getToken()

	// Generate preview URL if API is provided
	useMemo(() => {
		if (!api) return
		const generatedUrl = GetPreviewURL({
			response: { path: __value || '' },
			previewURL,
			useAppRoot,
			token,
			api
		})
		setUrl(generatedUrl)
	}, [api, previewURL, useAppRoot, __value, token])

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
		if (contentType) {
			if (contentType.startsWith('image/')) return 'image'
			if (contentType.startsWith('video/')) return 'video'
			if (contentType.startsWith('audio/')) return 'audio'
			if (contentType.startsWith('text/')) return 'text'
			if (contentType === 'application/pdf') return 'pdf'
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

		// Text extensions
		const textExts = [
			'txt',
			'md',
			'log',
			'ini',
			'cfg',
			'csv',
			'json',
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
			yaml: 'yaml',
			yml: 'yaml',
			md: 'markdown',
			txt: 'text',
			log: 'text',
			yao: 'yaml'
		}
		return extensionMap[extension] || 'text'
	}

	// 渲染对应的查看器
	const renderViewer = () => {
		if (!fileSource && !file) {
			return <div className={styles.loading}>Loading...</div>
		}

		// 统一的props传递给所有viewer组件
		const viewerProps = {
			src: fileSource,
			file,
			contentType,
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
					{fileType === 'text' && (
						<span className={styles.languageTag}>{getLanguage(fileName)}</span>
					)}
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
