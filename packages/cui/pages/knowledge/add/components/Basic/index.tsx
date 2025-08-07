import React from 'react'
import { Select, InputNumber, Switch } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import FilePreview from './FilePreview'
import TextPreview from './TextPreview'
import UrlPreview from './UrlPreview'
import { AddDocumentData } from '../../index'
import styles from '../../index.less'

interface BasicTabProps {
	data: AddDocumentData
	options: any
	onOptionsChange: (options: any) => void
}

const BasicTab: React.FC<BasicTabProps> = ({ data, options, onOptionsChange }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const splitModeOptions = [
		{
			value: 'auto',
			label: is_cn ? '自动分割' : 'Auto Split',
			description: is_cn ? '根据文档结构自动分割' : 'Auto split based on document structure'
		},
		{
			value: 'fixed',
			label: is_cn ? '固定长度' : 'Fixed Length',
			description: is_cn ? '按固定字符数分割' : 'Split by fixed character count'
		},
		{
			value: 'semantic',
			label: is_cn ? '语义分割' : 'Semantic Split',
			description: is_cn ? '基于语义边界分割' : 'Split based on semantic boundaries'
		}
	]

	const renderPreview = () => {
		switch (data.type) {
			case 'file':
				return <FilePreview data={data.content} />
			case 'text':
				return <TextPreview data={data.content} />
			case 'url':
				return <UrlPreview data={data.content} />
			default:
				return null
		}
	}

	const handleSplitModeChange = (value: string) => {
		onOptionsChange({ splitMode: value })
	}

	const handleChunkSizeChange = (value: number | null) => {
		onOptionsChange({ chunkSize: value })
	}

	const handleOverlapChange = (value: number | null) => {
		onOptionsChange({ overlap: value })
	}

	const handleAutoIndexChange = (checked: boolean) => {
		onOptionsChange({ autoIndex: checked })
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

				<div className={styles.optionItem}>
					<div className={styles.optionLabel}>
						<div className={styles.label}>{is_cn ? '分割方式' : 'Split Mode'}</div>
						<div className={styles.description}>
							{is_cn ? '选择文档分割的方式' : 'Choose how to split the document'}
						</div>
					</div>
					<div className={styles.optionControl}>
						<Select
							value={options.splitMode}
							onChange={handleSplitModeChange}
							style={{ width: 200 }}
							options={splitModeOptions.map((option) => ({
								value: option.value,
								label: option.label
							}))}
						/>
					</div>
				</div>

				{options.splitMode === 'fixed' && (
					<div className={styles.optionItem}>
						<div className={styles.optionLabel}>
							<div className={styles.label}>{is_cn ? '分块大小' : 'Chunk Size'}</div>
							<div className={styles.description}>
								{is_cn ? '每个文本块的字符数' : 'Number of characters per text chunk'}
							</div>
						</div>
						<div className={styles.optionControl}>
							<InputNumber
								value={options.chunkSize}
								onChange={handleChunkSizeChange}
								min={100}
								max={4000}
								step={100}
								style={{ width: 120 }}
							/>
						</div>
					</div>
				)}

				{options.splitMode === 'fixed' && (
					<div className={styles.optionItem}>
						<div className={styles.optionLabel}>
							<div className={styles.label}>{is_cn ? '重叠长度' : 'Overlap Length'}</div>
							<div className={styles.description}>
								{is_cn
									? '相邻文本块的重叠字符数'
									: 'Number of overlapping characters between adjacent chunks'}
							</div>
						</div>
						<div className={styles.optionControl}>
							<InputNumber
								value={options.overlap}
								onChange={handleOverlapChange}
								min={0}
								max={500}
								step={50}
								style={{ width: 120 }}
							/>
						</div>
					</div>
				)}

				<div className={styles.optionItem}>
					<div className={styles.optionLabel}>
						<div className={styles.label}>{is_cn ? '自动索引' : 'Auto Index'}</div>
						<div className={styles.description}>
							{is_cn
								? '添加后自动创建向量索引'
								: 'Automatically create vector index after adding'}
						</div>
					</div>
					<div className={styles.optionControl}>
						<Switch checked={options.autoIndex !== false} onChange={handleAutoIndexChange} />
					</div>
				</div>
			</div>
		</div>
	)
}

export default BasicTab
