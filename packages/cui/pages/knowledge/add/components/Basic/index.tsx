import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { Switch } from 'antd'
import { getLocale } from '@umijs/max'
import { useGlobal } from '@/context/app'
import Icon from '@/widgets/Icon'
import FilePreview from './FilePreview'
import TextPreview from './TextPreview'
import UrlPreview from './UrlPreview'
import { AddDocumentData } from '../../index'
import ProviderConfigurator, { ProviderConfiguratorRef } from '../../../components/Provider'
import styles from '../../index.less'

interface BasicTabProps {
	data: AddDocumentData
	options: any
	onOptionsChange: (options: any) => void
	onDataChange?: (data: AddDocumentData) => void
}

export interface BasicTabRef {
	validateProviderConfig: () => boolean
}

const BasicTab = forwardRef<BasicTabRef, BasicTabProps>(({ data, options, onOptionsChange, onDataChange }, ref) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()
	const { kb: kbConfig } = global.app_info || {}

	// 创建多个ref来管理不同的provider配置
	const converterRef = useRef<ProviderConfiguratorRef>(null)
	const fetcherRef = useRef<ProviderConfiguratorRef>(null)
	const chunkingRef = useRef<ProviderConfiguratorRef>(null)
	const extractorRef = useRef<ProviderConfiguratorRef>(null)

	// 暴露给父组件的方法
	useImperativeHandle(ref, () => ({
		validateProviderConfig: () => {
			const results = []

			// 根据data.type验证相应的配置
			if (data.type === 'file') {
				results.push(converterRef.current?.validateAllFields() || false)
			} else if (data.type === 'url') {
				results.push(fetcherRef.current?.validateAllFields() || false)
			}

			// 所有类型都需要验证chunking
			results.push(chunkingRef.current?.validateAllFields() || false)

			// 如果支持图谱提取，验证extractor
			if (kbConfig?.features?.GraphDatabase) {
				results.push(extractorRef.current?.validateAllFields() || false)
			}

			return results.every((result) => result)
		}
	}))

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

	// 渲染文档处理配置
	const renderDocumentProcessingConfig = () => {
		const configs = []

		// 1. 根据data.type添加相应的处理配置
		if (data.type === 'file') {
			// 文件类型：converter (文档预处理)
			configs.push(
				<div key='converter' className={styles.optionsSection}>
					<ProviderConfigurator
						ref={converterRef}
						type='converter'
						value={{
							id: options?.converterProviderId,
							properties: options?.converterProperties
						}}
						onChange={(v) =>
							onOptionsChange({
								...options,
								converterProviderId: v.id,
								converterProperties: v.properties
							})
						}
						labels={{
							name: is_cn ? '文档转换方式' : 'Document Conversion',
							description: is_cn
								? '选择如何将文档转换为纯文本'
								: 'Choose how to convert documents to plain text'
						}}
					/>
				</div>
			)
		} else if (data.type === 'url') {
			// URL类型：fetcher (抓取方式)
			configs.push(
				<div key='fetcher' className={styles.optionsSection}>
					<ProviderConfigurator
						ref={fetcherRef}
						type='fetcher'
						value={{
							id: options?.fetcherProviderId,
							properties: options?.fetcherProperties
						}}
						onChange={(v) =>
							onOptionsChange({
								...options,
								fetcherProviderId: v.id,
								fetcherProperties: v.properties
							})
						}
						labels={{
							name: is_cn ? '内容获取方式' : 'Content Fetching',
							description: is_cn
								? '选择如何从URL获取内容'
								: 'Choose how to fetch content from URL'
						}}
					/>
				</div>
			)
		}

		// 2. 所有类型都需要：chunking (分割配置)
		configs.push(
			<div key='chunking' className={styles.optionsSection}>
				<ProviderConfigurator
					ref={chunkingRef}
					type='chunking'
					value={{
						id: options?.chunkingProviderId,
						properties: options?.chunkingProperties
					}}
					onChange={(v) =>
						onOptionsChange({
							...options,
							chunkingProviderId: v.id,
							chunkingProperties: v.properties
						})
					}
					labels={{
						name: is_cn ? '文档分割方式' : 'Document Splitting',
						description: is_cn
							? '选择如何将长文档分成小段落'
							: 'Choose how to break long documents into smaller sections'
					}}
				/>
			</div>
		)

		// 3. 如果支持图谱数据库：extractor (图谱提取)
		if (kbConfig?.features?.GraphDatabase) {
			configs.push(
				<div key='extractor' className={styles.optionsSection}>
					<ProviderConfigurator
						ref={extractorRef}
						type='extractor'
						value={{
							id: options?.extractorProviderId,
							properties: options?.extractorProperties
						}}
						onChange={(v) =>
							onOptionsChange({
								...options,
								extractorProviderId: v.id,
								extractorProperties: v.properties
							})
						}
						labels={{
							name: is_cn ? '实体关系提取' : 'Entity Relationship Extraction',
							description: is_cn
								? '从文档中提取实体和关系构建知识图谱'
								: 'Extract entities and relationships from documents to build knowledge graph'
						}}
					/>
				</div>
			)
		}

		return configs
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

			{/* 文档处理配置 */}
			<div className={styles.processingSection}>
				<div className={styles.sectionTitle}>
					<Icon name='material-settings' size={14} />
					<span>{is_cn ? '文档处理' : 'Document Processing'}</span>
				</div>
				{renderDocumentProcessingConfig()}
			</div>
		</div>
	)
})

export default BasicTab
