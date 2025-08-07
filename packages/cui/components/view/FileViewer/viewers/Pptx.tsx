import React, { useState, useEffect, useMemo, useRef } from 'react'
import { FileTextOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import styles from '../pptx/styles.less'
import PptxParser from '../pptx/parser'
import { PptxDocument } from '../pptx/types'

interface PptxProps {
	src?: string
	file?: File
	contentType?: string
	fileName?: string
}

const PptxComponent: React.FC<PptxProps> = ({ src, file, contentType, fileName }) => {
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
	const [pptxDocument, setPptxDocument] = useState<PptxDocument | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	// 解析 PPTX 文件
	useEffect(() => {
		if (!fileSource) return

		const parsePptx = async () => {
			setLoading(true)
			setError('')
			setPptxDocument(null)

			try {
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

				// 使用我们自己的解析器
				const parser = new PptxParser({
					extractImages: false,
					preserveFormatting: true,
					convertToHtml: true
				})

				const document = await parser.parse(arrayBuffer)
				setPptxDocument(document)
			} catch (err) {
				console.error('Failed to parse PPTX:', err)
				setError(is_cn ? '解析PPTX文件失败' : 'Failed to parse PPTX file')
			} finally {
				setLoading(false)
			}
		}

		parsePptx()
	}, [fileSource, file, src, is_cn])

	// 渲染所有幻灯片
	useEffect(() => {
		if (pptxDocument && containerRef.current) {
			const html = PptxParser.toHtml(pptxDocument)
			containerRef.current.innerHTML = html
		}
	}, [pptxDocument])

	if (loading) {
		return <div className={styles['pptx-loading']}>{is_cn ? '解析中...' : 'Parsing...'}</div>
	}

	if (error) {
		return (
			<div className={styles['pptx-error']}>
				<FileTextOutlined />
				<div>{error}</div>
			</div>
		)
	}

	if (!pptxDocument || pptxDocument.slides.length === 0) {
		return (
			<div className={styles['pptx-error']}>
				<FileTextOutlined />
				<div>{is_cn ? '未找到幻灯片内容' : 'No slides found'}</div>
			</div>
		)
	}

	return (
		<div className={styles['pptx-container']}>
			{/* 所有幻灯片内容 */}
			<div ref={containerRef} className={styles['pptx-wrapper']} />
		</div>
	)
}

export default PptxComponent
