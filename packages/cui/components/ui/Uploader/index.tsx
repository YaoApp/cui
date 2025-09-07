import React, { useMemo } from 'react'
import { Upload, Button, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import { useGlobal } from '@/context/app'
import styles from './index.less'

import type { UploadProps, RcFile } from 'antd/es/upload'
import type { App } from '@/types'
import type { UploaderProps } from './types'

export type { UploaderProps, UploaderMode } from './types'

const Uploader: React.FC<UploaderProps> = ({
	mode = 'dragger',
	className,
	buttonText,
	buttonIcon = <UploadOutlined />,
	showFormatHint = true,
	customFormatHint,
	...uploadProps
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()

	// 从全局配置获取 KB 配置
	const { kb: kbConfig } = global.app_info || {}

	// 根据 kbConfig features 计算支持的文件类型
	const { acceptTypes, formatHint } = useMemo(() => {
		if (!kbConfig?.features) {
			// 默认支持基础文件类型
			return {
				acceptTypes:
					'.txt,.md,.json,.js,.ts,.html,.css,.py,.java,.cpp,.go,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.yao',
				formatHint: is_cn
					? '支持文本、代码、PDF、Word、Excel、PowerPoint 等格式'
					: 'Support text, code, PDF, Word, Excel, PowerPoint and other formats'
			}
		}

		const features = kbConfig.features as App.KBFeatures
		const supportedTypes: string[] = []
		const supportedNames: string[] = []

		// 基础文本文件
		if (features.PlainText) {
			supportedTypes.push(
				'.txt',
				'.md',
				'.json',
				'.xml',
				'.csv',
				'.log',
				// 代码文件
				'.js',
				'.jsx',
				'.ts',
				'.tsx',
				'.vue',
				'.html',
				'.css',
				'.scss',
				'.less',
				'.py',
				'.java',
				'.cpp',
				'.c',
				'.h',
				'.go',
				'.rs',
				'.php',
				'.rb',
				'.sh',
				'.sql',
				'.yaml',
				'.yml',
				'.toml',
				'.ini',
				'.conf',
				'.env',
				'.yao'
			)
			supportedNames.push(
				is_cn ? '文本文件' : 'Text Files',
				is_cn ? '代码文件' : 'Code Files',
				is_cn ? 'JSON/XML' : 'JSON/XML',
				is_cn ? '配置文件' : 'Config Files'
			)
		}

		// PDF 处理
		if (features.PDFProcessing) {
			supportedTypes.push('.pdf')
			supportedNames.push('PDF')
		}

		// Office 文档
		if (features.OfficeDocuments) {
			supportedTypes.push('.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx')
			supportedNames.push(
				is_cn ? 'Word' : 'Word',
				is_cn ? 'Excel' : 'Excel',
				is_cn ? 'PowerPoint' : 'PowerPoint'
			)
		}

		// 图片（OCR 或图片分析）
		if (features.OCRProcessing || features.ImageAnalysis) {
			supportedTypes.push('.jpg', '.jpeg', '.png', '.bmp', '.gif')
			supportedNames.push(is_cn ? '图片' : 'Images')
		}

		// 音频转录
		if (features.AudioTranscript) {
			supportedTypes.push('.mp3', '.wav', '.m4a', '.aac')
			supportedNames.push(is_cn ? '音频' : 'Audio')
		}

		// 视频处理
		if (features.VideoProcessing) {
			supportedTypes.push('.mp4', '.avi', '.mov', '.wmv')
			supportedNames.push(is_cn ? '视频' : 'Video')
		}

		// 如果没有任何特性支持，使用默认配置
		if (supportedTypes.length === 0) {
			supportedTypes.push('.txt', '.md', '.json', '.js', '.ts', '.html', '.css', '.py', '.pdf')
			supportedNames.push(is_cn ? '文本文件' : 'Text Files', is_cn ? '代码文件' : 'Code Files', 'PDF')
		}

		const hint = is_cn
			? `支持 ${supportedNames.join('、')} 等格式`
			: `Support ${supportedNames.join(', ')} and other formats`

		return {
			acceptTypes: supportedTypes.join(','),
			formatHint: customFormatHint || hint
		}
	}, [kbConfig, is_cn, customFormatHint])

	// 文件上传前的验证
	const handleBeforeUpload = (file: RcFile) => {
		// 检查文件大小（默认限制 100MB）
		const maxSize = 100 * 1024 * 1024 // 100MB
		if (file.size > maxSize) {
			message.error(is_cn ? '文件大小不能超过 100MB' : 'File size cannot exceed 100MB')
			return false
		}

		// 如果有自定义的 beforeUpload，则调用它
		if (uploadProps.beforeUpload) {
			return uploadProps.beforeUpload(file, [file])
		}

		return true
	}

	// 合并 props
	const mergedUploadProps: UploadProps = {
		accept: acceptTypes,
		beforeUpload: handleBeforeUpload,
		...uploadProps
	}

	if (mode === 'button') {
		return (
			<Upload {...mergedUploadProps} className={className}>
				<Button icon={buttonIcon}>{buttonText || (is_cn ? '上传文件' : 'Upload File')}</Button>
				{showFormatHint && <div className={styles.formatHint}>{formatHint}</div>}
			</Upload>
		)
	}

	// dragger 模式
	return (
		<Upload.Dragger {...mergedUploadProps} className={`${styles.uploadArea} ${className || ''}`}>
			<p className='ant-upload-drag-icon'>
				<UploadOutlined />
			</p>
			<p className='ant-upload-text'>
				{is_cn
					? '上传文件 - 点击或拖拽文件到此区域上传'
					: 'Upload File - Click or drag file to this area to upload'}
			</p>
			{showFormatHint && <p className='ant-upload-hint'>{formatHint}</p>}
		</Upload.Dragger>
	)
}

export default Uploader
