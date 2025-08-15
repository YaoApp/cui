import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { Switch } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import FilePreview from './FilePreview'
import TextPreview from './TextPreview'
import UrlPreview from './UrlPreview'
import { AddDocumentData } from '../../index'
import ProviderConfigs, { ProviderConfigsRef } from '../ProviderConfigs'
import styles from '../../index.less'

interface BasicTabProps {
	data: AddDocumentData
	options: any
	onOptionsChange: (options: any) => void
	onDataChange?: (data: AddDocumentData) => void
	processing?: boolean
	uploadProgress?: number
}

export interface BasicTabRef {
	validateProviderConfig: () => boolean
}

const BasicTab = forwardRef<BasicTabRef, BasicTabProps>(
	({ data, options, onOptionsChange, onDataChange, processing = false, uploadProgress = 0 }, ref) => {
		const locale = getLocale()
		const is_cn = locale === 'zh-CN'

		// 文档处理配置ref
		const providerConfigsRef = useRef<ProviderConfigsRef>(null)

		// 暴露给父组件的方法
		useImperativeHandle(ref, () => ({
			validateProviderConfig: () => {
				return providerConfigsRef.current?.validateAllConfigs() || false
			}
		}))

		const renderPreview = () => {
			switch (data.type) {
				case 'file':
					return (
						<FilePreview
							data={data.content}
							onFileChange={handleFileChange}
							processing={processing}
							uploadProgress={uploadProgress}
						/>
					)
				case 'text':
					return <TextPreview data={data.content} />
				case 'url':
					return <UrlPreview data={data.content} />
				default:
					return null
			}
		}

		const handleAutoIndexChange = (checked: boolean) => {
			onOptionsChange({ autoIndex: checked })
		}

		// 处理文件更换
		const handleFileChange = (file: File) => {
			if (onDataChange && data.type === 'file') {
				const newData: AddDocumentData = {
					...data,
					content: {
						file,
						name: file.name,
						size: file.size
					}
				}
				onDataChange(newData)
			}
		}

		return (
			<div className={styles.basicTab}>
				{/* 内容预览区域 */}
				<div className={styles.previewSection}>
					<div className={styles.sectionTitle}>
						<Icon name='material-preview' size={14} />
						<span>{is_cn ? '内容预览' : 'Content Preview'}</span>
					</div>
					<div className={styles.previewContent}>
						{(processing || uploadProgress === 100) && data.type === 'file' && (
							<div
								className={styles.progressSection}
								data-status={
									uploadProgress === 100 && !processing ? 'success' : 'active'
								}
								style={
									{
										'--progress-width': `${uploadProgress}%`
									} as React.CSSProperties
								}
							/>
						)}
						{renderPreview()}
					</div>
				</div>

				{/* 文档处理配置 */}
				<div className={styles.processingSection}>
					<div className={styles.sectionTitle}>
						<Icon name='material-settings' size={14} />
						<span>{is_cn ? '文档处理' : 'Document Processing'}</span>
					</div>
					<ProviderConfigs
						ref={providerConfigsRef}
						dataType={data.type}
						options={options}
						onOptionsChange={onOptionsChange}
						mode='simple'
					/>
				</div>
			</div>
		)
	}
)

export default BasicTab
