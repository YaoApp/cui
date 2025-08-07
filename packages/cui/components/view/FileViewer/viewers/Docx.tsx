import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { FileTextOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import styles from '../index.less'

// 预先导入 docx-preview，避免在组件内部动态导入
let docxPreview: any = null
const loadDocxPreview = async () => {
	if (!docxPreview) {
		docxPreview = await import('docx-preview')
	}
	return docxPreview
}

interface DocxProps {
	src?: string
	file?: File
	contentType?: string
	fileName?: string
}

const DocxComponent: React.FC<DocxProps> = ({ src, file, contentType, fileName }) => {
	// 统一处理文件源
	const fileSource = useMemo(() => {
		if (src) return src
		if (file) return URL.createObjectURL(file)
		return undefined
	}, [src, file])

	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string>('')
	const [docxContent, setDocxContent] = useState<string>('')
	const containerRef = useRef<HTMLDivElement>(null)

	// 1. 页面进入时读取内容，一直显示 loading
	useEffect(() => {
		if (!fileSource) return

		const loadContent = async () => {
			setLoading(true)
			setError('')
			setDocxContent('')

			try {
				// 加载 docx-preview
				const docx = await loadDocxPreview()

				// 获取文件数据
				let arrayBuffer: ArrayBuffer
				if (file) {
					arrayBuffer = await file.arrayBuffer()
				} else if (src) {
					const response = await fetch(src)
					if (!response.ok) {
						throw new Error(`HTTP ${response.status}: ${response.statusText}`)
					}
					arrayBuffer = await response.arrayBuffer()
				} else {
					throw new Error('No file source available')
				}

				// 创建临时容器来渲染内容
				const tempContainer = document.createElement('div')

				await docx.renderAsync(arrayBuffer, tempContainer, undefined, {
					className: 'docx-preview',
					inWrapper: true,
					hideWrapperOnPrint: false,
					ignoreWidth: false,
					ignoreHeight: false,
					ignoreFonts: false,
					breakPages: true,
					ignoreLastRenderedPageBreak: true,
					experimental: false,
					trimXmlDeclaration: true,
					useBase64URL: false,
					renderChanges: false,
					renderHeaders: true,
					renderFooters: true,
					renderFootnotes: true,
					renderEndnotes: true,
					renderComments: false,
					renderAltChunks: true,
					debug: false
				})

				// 内容读完了，保存起来
				setDocxContent(tempContainer.innerHTML)
			} catch (err) {
				console.error('Failed to load DOCX:', err)
				setError(is_cn ? '加载DOCX文件失败' : 'Failed to load DOCX file')
			} finally {
				setLoading(false)
			}
		}

		loadContent()
	}, [fileSource, file, src, is_cn])

	// 内容稳定了，再渲染到真正的容器
	useEffect(() => {
		if (docxContent && containerRef.current) {
			containerRef.current.innerHTML = docxContent
		}
	}, [docxContent])

	if (loading) {
		return <div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
	}

	if (error) {
		return (
			<div className={styles.error}>
				<FileTextOutlined />
				<div>{error}</div>
			</div>
		)
	}

	return (
		<div className={styles.docxContainer}>
			<div
				ref={containerRef}
				className={styles.docxWrapper}
				style={{ minHeight: '100px' }} // 确保容器有最小高度
			/>
		</div>
	)
}

export default DocxComponent
