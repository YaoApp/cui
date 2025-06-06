import type { Component } from '@/types'
import type { ImageProps } from 'antd'
import { GetPreviewURL } from '@/components/edit/Upload/request/storages/utils'
import { getToken } from '@/knife'
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import styles from './index.less'

interface IProps extends Component.PropsViewComponent, ImageProps {
	previewURL?: string
	useAppRoot?: boolean
	api?: string | { api: string; params: string }
}

const Index = (props: IProps) => {
	const { __value, onSave, api, useAppRoot, previewURL, style, ...rest_props } = props

	const [url, setUrl] = useState<string>()

	const token = getToken()
	useMemo(() => {
		if (!api) return
		const url = GetPreviewURL({
			response: { path: __value || '' },
			previewURL,
			useAppRoot,
			token,
			api
		})
		setUrl(url)
	}, [api, previewURL, useAppRoot])

	if (!__value || (Array.isArray(__value) && __value.length == 0)) return <span>-</span>

	// 获取文件扩展名
	const getFileExtension = (path: string) => {
		const lastDot = path.lastIndexOf('.')
		return lastDot > 0 ? path.substring(lastDot + 1).toLowerCase() : ''
	}

	const fileExtension = getFileExtension(__value)
	const fileName = __value.split('/').pop() || __value

	// 模拟长文档内容
	const generateLongContent = () => {
		const paragraphs = [
			'这是文档的第一段内容。本文档用于演示文件查看器的滚动功能。当内容超过容器高度时，会自动显示滚动条。',
			'第二段：在实际使用中，这里会显示真实的文档内容，比如PDF渲染结果、图片预览、文本内容等。FileViewer组件需要支持多种文件格式的预览。',
			'第三段：支持的文件类型包括但不限于：PDF文档、Office文档（Word、Excel、PowerPoint）、图片文件（JPG、PNG、GIF等）、文本文件、代码文件等。',
			'第四段：对于PDF文件，会使用PDF.js进行渲染；对于图片文件，直接使用img标签显示；对于Office文档，可能需要转换为PDF或使用在线预览服务。',
			'第五段：文档预览功能还应该支持缩放、旋转、全屏等操作。用户可以通过工具栏来控制文档的显示方式。',
			'第六段：为了提升用户体验，预览组件还应该支持键盘快捷键，比如Ctrl+滚轮缩放、方向键翻页等。',
			'第七段：在移动端设备上，还需要支持触摸手势，比如双指缩放、滑动翻页等操作。',
			'第八段：安全性也是重要考虑因素，预览功能不应该暴露原始文件路径，并且需要进行访问权限验证。',
			'第九段：性能优化方面，大文件应该支持分页加载或懒加载，避免一次性加载整个文档导致页面卡顿。',
			'第十段：错误处理也很重要，当文件无法预览时，应该显示友好的错误提示，并提供替代方案如下载文件。'
		]

		return paragraphs.map((paragraph, index) => (
			<div key={index} className={styles.paragraph}>
				<h4>段落 {index + 1}</h4>
				<p>{paragraph}</p>
				{index < paragraphs.length - 1 && <hr />}
			</div>
		))
	}

	const props_image: ImageProps = {
		preview: false,
		height: '100%',
		style: { objectFit: 'cover', ...(style || {}) },
		...rest_props
	}

	return (
		<div className={clsx([styles._local, styles.debug, 'xgen-file-viewer'])}>
			<div className={styles.content}>
				<div className={styles.fileInfo}>
					<div>
						<strong>文件路径:</strong> {__value}
					</div>
					<div>
						<strong>文件名:</strong> {fileName}
					</div>
					<div>
						<strong>文件类型:</strong> {fileExtension}
					</div>
					{previewURL && (
						<div>
							<strong>预览URL:</strong> {previewURL}
						</div>
					)}
					{url && (
						<div>
							<strong>生成URL:</strong> {url}
						</div>
					)}
					{api && (
						<div>
							<strong>API:</strong> {JSON.stringify(api)}
						</div>
					)}
				</div>

				<div className={styles.separator}></div>

				<div className={styles.documentContent}>
					<h3>文档正文内容预览</h3>
					{generateLongContent()}

					<div className={styles.footer}>
						<p
							style={{
								textAlign: 'center',
								color: '#999',
								fontSize: '12px',
								marginTop: '40px'
							}}
						>
							--- 文档结束 ---
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}

export default window.$app.memo(Index)
