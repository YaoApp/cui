import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { getLocale } from '@umijs/max'
import { useGlobal } from '@/context/app'
import ProviderConfigurator, { ProviderConfiguratorRef } from '@/components/ui/Provider'
import styles from '../../index.less'

export interface ProviderConfigsRef {
	validateAllConfigs: () => boolean
}

interface ProviderConfigsProps {
	/** 文档类型 */
	dataType: 'file' | 'url' | 'text'
	/** 配置选项 */
	options: any
	/** 配置变更回调 */
	onOptionsChange: (options: any) => void
	/** 显示模式：simple 只显示选择器，detailed 显示完整配置 */
	mode?: 'simple' | 'detailed'
	/** 自定义样式类名 */
	className?: string
}

const ProviderConfigs = forwardRef<ProviderConfigsRef, ProviderConfigsProps>(
	({ dataType, options, onOptionsChange, mode = 'simple', className }, ref) => {
		const locale = getLocale()
		const is_cn = locale === 'zh-CN'
		const global = useGlobal()
		const { kb: kbConfig } = global.app_info || {}

		// 创建多个ref来管理不同的provider配置
		const converterRef = useRef<ProviderConfiguratorRef>(null)
		const fetcherRef = useRef<ProviderConfiguratorRef>(null)
		const chunkingRef = useRef<ProviderConfiguratorRef>(null)
		const extractionRef = useRef<ProviderConfiguratorRef>(null)

		// 暴露验证方法
		useImperativeHandle(ref, () => ({
			validateAllConfigs: () => {
				const results = []

				// 根据dataType验证相应的配置
				if (dataType === 'file') {
					results.push(converterRef.current?.validateAllFields() || false)
				} else if (dataType === 'url') {
					results.push(fetcherRef.current?.validateAllFields() || false)
				}

				// 所有类型都需要验证chunking
				results.push(chunkingRef.current?.validateAllFields() || false)

				// 如果支持图谱提取，验证extraction
				if (kbConfig?.features?.GraphDatabase) {
					results.push(extractionRef.current?.validateAllFields() || false)
				}

				return results.every((result) => result)
			}
		}))

		// 渲染配置项
		const renderConfigs = () => {
			const configs = []

			// 1. 根据dataType添加相应的处理配置
			if (dataType === 'file') {
				// 文件类型：converter (文档转换)
				configs.push(
					<div key='converter' className={styles.optionsSection}>
						<ProviderConfigurator
							ref={converterRef}
							type='converter'
							mode={mode}
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
			} else if (dataType === 'url') {
				// URL类型：fetcher (抓取方式)
				configs.push(
					<div key='fetcher' className={styles.optionsSection}>
						<ProviderConfigurator
							ref={fetcherRef}
							type='fetcher'
							mode={mode}
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
						mode={mode}
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

			// 3. 如果支持图谱数据库：extraction (图谱提取)
			if (kbConfig?.features?.GraphDatabase) {
				configs.push(
					<div key='extraction' className={styles.optionsSection}>
						<ProviderConfigurator
							ref={extractionRef}
							type='extraction'
							mode={mode}
							value={{
								id: options?.extractionProviderId,
								properties: options?.extractionProperties
							}}
							onChange={(v) =>
								onOptionsChange({
									...options,
									extractionProviderId: v.id,
									extractionProperties: v.properties
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

		return <div className={className || ''}>{renderConfigs()}</div>
	}
)

export default ProviderConfigs
