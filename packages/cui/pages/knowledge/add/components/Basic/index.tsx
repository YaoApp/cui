import React from 'react'
import { Switch } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import FilePreview from './FilePreview'
import TextPreview from './TextPreview'
import UrlPreview from './UrlPreview'
import { AddDocumentData } from '../../index'
import ProviderConfigurator from '../../../components/Provider'
import styles from '../../index.less'

interface BasicTabProps {
	data: AddDocumentData
	options: any
	onOptionsChange: (options: any) => void
	onDataChange?: (data: AddDocumentData) => void
}

const BasicTab: React.FC<BasicTabProps> = ({ data, options, onOptionsChange, onDataChange }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const renderPreview = () => {
		switch (data.type) {
			case 'file':
				return <FilePreview data={data.content} onFileChange={handleFileChange} />
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
				<div className={styles.previewContent}>{renderPreview()}</div>
			</div>

			{/* 分割选项配置 */}
			<div className={styles.optionsSection}>
				<div className={styles.sectionTitle}>
					<Icon name='material-content_cut' size={14} />
					<span>{is_cn ? '分割配置' : 'Split Configuration'}</span>
				</div>

				<ProviderConfigurator
					type='chunkings'
					value={{
						id: options?.chunkingProviderId,
						properties: options?.chunkingProperties
					}}
					onChange={(v) =>
						onOptionsChange({
							chunkingProviderId: v.id,
							chunkingProperties: v.properties
						})
					}
				/>
			</div>
		</div>
	)
}

export default BasicTab
