import React, { useState, useRef } from 'react'
import { Modal, Button, Progress, message } from 'antd'
import { useLocalStorageState } from 'ahooks'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import BasicTab, { BasicTabRef } from './components/Basic'
import AdvancedTab, { AdvancedTabRef } from './components/Advanced'
import { KB, FileAPI } from '@/openapi'
import { AddFileRequest, AddTextRequest, AddURLRequest } from '@/openapi/kb/types'
import { useGlobal } from '@/context/app'
import styles from './index.less'

export interface AddDocumentData {
	type: 'file' | 'text' | 'url'
	content: any // 根据type不同，content的结构不同
	// file: { file: File, name: string, size: number }
	// text: { content: string }
	// url: { url: string, title?: string }
}

interface AddDocumentModalProps {
	visible: boolean
	onClose: () => void
	onConfirm: (data: AddDocumentData, options: any, jobId: string) => void
	data: AddDocumentData | null
	collectionName?: string
	collection: any // Collection对象，包含embedding配置
}

type TabType = 'basic' | 'advanced'

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
	visible,
	onClose,
	onConfirm,
	data,
	collectionName,
	collection
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()

	// 记住用户上次选择的tab
	const [activeTab, setActiveTab] = useLocalStorageState<TabType>('add-document-tab', {
		defaultValue: 'basic'
	})

	// 当前编辑的数据（支持文件更换等操作）
	const [currentData, setCurrentData] = useState<AddDocumentData | null>(data)

	// Basic表单数据
	const [basicOptions, setBasicOptions] = useState<any>({
		splitMode: 'auto',
		chunkSize: 1000,
		overlap: 200
		// 更多配置项...
	})

	// Advanced表单数据
	const [advancedOptions, setAdvancedOptions] = useState<any>({})

	// 记录Advanced表单是否有更新
	const [advancedModified, setAdvancedModified] = useState<Set<string>>(new Set())

	// 处理状态
	const [processing, setProcessing] = useState(false)
	const [uploadProgress, setUploadProgress] = useState(0)
	const [currentStep, setCurrentStep] = useState('')

	// Tab refs for validation
	const basicTabRef = useRef<BasicTabRef>(null)
	const advancedTabRef = useRef<AdvancedTabRef>(null)

	// 当传入的 data 变化时，更新 currentData
	React.useEffect(() => {
		setCurrentData(data)
	}, [data])

	// Provider配置处理函数
	const buildProviderConfig = (providerId?: string, properties?: Record<string, any>, providerType?: string) => {
		// 如果没有providerId，返回undefined（表示不传这个字段）
		if (!providerId) {
			return undefined
		}

		if (providerId.includes('|')) {
			const [provider_id, option_id] = providerId.split('|')
			const config: any = {
				provider_id,
				option_id
			}

			// 只有在Advanced面板修改过这个provider类型时才传option
			if (
				providerType &&
				advancedModified.has(providerType) &&
				properties &&
				Object.keys(properties).length > 0
			) {
				config.option = properties
			}

			return config
		}

		// 没有|分隔符，说明配置不完整，应该抛出错误
		throw new Error(`Provider configuration incomplete: ${providerId} missing option_id`)
	}

	// Embedding配置处理函数（特殊处理，embedding跟Collection绑定）
	const buildEmbeddingConfig = (collection: any, userProperties?: Record<string, any>) => {
		// 从metadata中读取embedding配置（分开存储）
		const embeddingProvider = (collection.metadata.__embedding_provider as string) || 'default'
		const embeddingOption = (collection.metadata.__embedding_option as string) || ''

		const config: any = {
			provider_id: embeddingProvider
		}

		// 如果有embedding_option，添加option_id
		if (embeddingOption) {
			config.option_id = embeddingOption
		}

		// embedding跟Collection绑定，只有用户在Advanced面板修改过才传option
		if (advancedModified.has('embedding') && userProperties && Object.keys(userProperties).length > 0) {
			config.option = userProperties
		}

		return config
	}

	// 如果没有数据，直接返回空
	if (!data) return null

	const tabs = [
		{
			key: 'basic' as TabType,
			label: is_cn ? '快速添加' : 'Quick Add',
			icon: 'material-flash_on'
		},
		{
			key: 'advanced' as TabType,
			label: is_cn ? '详细配置' : 'Detailed Setup',
			icon: 'material-tune'
		}
	]

	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab)
	}

	// 处理Basic表单数据变更
	const handleBasicOptionsChange = (newOptions: any) => {
		setBasicOptions((prev: any) => ({ ...prev, ...newOptions }))
	}

	// 处理Advanced表单数据变更
	const handleAdvancedOptionsChange = (newOptions: any) => {
		setAdvancedOptions((prev: any) => ({ ...prev, ...newOptions }))

		// 记录哪些字段被修改了
		const modifiedFields = new Set(advancedModified)
		Object.keys(newOptions).forEach((key) => {
			if (key.endsWith('ProviderId') || key.endsWith('Properties')) {
				const providerType = key.replace(/ProviderId|Properties/, '')
				modifiedFields.add(providerType)
			}
		})
		setAdvancedModified(modifiedFields)
	}

	// 获取最终使用的配置（优先使用Advanced，如果没修改则使用Basic）
	const getFinalOptions = () => {
		const finalOptions = { ...basicOptions }

		// 对于每个provider类型，如果Advanced有修改，使用Advanced的数据
		advancedModified.forEach((providerType) => {
			const providerIdKey = `${providerType}ProviderId`
			const propertiesKey = `${providerType}Properties`

			if (advancedOptions[providerIdKey] !== undefined) {
				finalOptions[providerIdKey] = advancedOptions[providerIdKey]
			}
			if (advancedOptions[propertiesKey] !== undefined) {
				finalOptions[propertiesKey] = advancedOptions[propertiesKey]
			}
		})

		return finalOptions
	}

	const handleDataChange = (newData: AddDocumentData) => {
		setCurrentData(newData)
	}

	const handleConfirm = async () => {
		// 如果正在处理中，直接返回
		if (processing) {
			return
		}

		// 根据当前tab验证 Provider 配置
		let isProviderValid = false
		if (activeTab === 'basic') {
			isProviderValid = basicTabRef.current?.validateProviderConfig() || false
		} else if (activeTab === 'advanced') {
			isProviderValid = advancedTabRef.current?.validateProviderConfig() || false
		}

		if (!isProviderValid) {
			message.error(
				is_cn
					? 'Provider 配置验证失败，请检查必填项'
					: 'Provider configuration validation failed, please check required fields'
			)
			return
		}

		if (!currentData) {
			return
		}

		try {
			setProcessing(true)
			setUploadProgress(0)

			// 初始化API
			const { kb: kbConfig } = global.app_info || {}
			if (!window.$app?.openapi) {
				throw new Error('OpenAPI not available')
			}

			const kb = new KB(window.$app.openapi)
			const defaultUploader = kbConfig?.uploader || '__yao.attachment'
			const fileapi = new FileAPI(window.$app.openapi, defaultUploader)

			let jobId = ''

			// 获取最终配置
			const finalOptions = getFinalOptions()

			// 根据文档类型处理
			if (currentData.type === 'file') {
				jobId = await handleFileUpload(
					kb,
					fileapi,
					currentData,
					collection,
					finalOptions,
					defaultUploader
				)
			} else if (currentData.type === 'text') {
				jobId = await handleTextUpload(kb, currentData, collection, finalOptions)
			} else if (currentData.type === 'url') {
				jobId = await handleURLUpload(kb, currentData, collection, finalOptions)
			}

			// 成功后调用onConfirm回调
			onConfirm(currentData, finalOptions, jobId)
		} catch (error) {
			console.error('Document processing failed:', error)
			const errorMsg =
				error instanceof Error ? error.message : is_cn ? '文档处理失败' : 'Document processing failed'
			message.error(errorMsg)
		} finally {
			setProcessing(false)
			setCurrentStep('')

			// 延迟重置uploadProgress，让CSS动画完整执行（1.8s）
			setTimeout(() => {
				setUploadProgress(0)
			}, 2000)
		}
	}

	// 处理文件上传
	const handleFileUpload = async (
		kb: KB,
		fileapi: FileAPI,
		data: AddDocumentData,
		collection: any,
		options: any,
		uploader: string
	): Promise<string> => {
		const file = data.content.file as File

		setCurrentStep(is_cn ? '正在上传文件...' : 'Uploading file...')

		// 1. 上传文件
		const uploadResponse = await fileapi.Upload(
			file,
			{
				uploaderID: uploader,
				originalFilename: file.name
			},
			(progress) => {
				setUploadProgress(progress.percentage)
			}
		)

		if (window.$app.openapi.IsError(uploadResponse)) {
			throw new Error(uploadResponse.error?.error_description || 'File upload failed')
		}

		const fileId = uploadResponse.data?.file_id
		if (!fileId) {
			throw new Error('File ID not returned from upload')
		}

		setCurrentStep(is_cn ? '正在处理文档...' : 'Processing document...')
		setUploadProgress(100)

		// 2. 构建请求参数
		const finalOptions = getFinalOptions()

		const request: AddFileRequest = {
			collection_id: collection.id,
			file_id: fileId,
			uploader: uploader,
			locale: locale === 'zh-CN' ? 'zh' : 'en',
			chunking: buildProviderConfig(
				finalOptions.chunkingProviderId,
				finalOptions.chunkingProperties,
				'chunking'
			)!,
			embedding: buildEmbeddingConfig(collection, finalOptions.embeddingProperties),
			doc_id: '',
			metadata: {
				name: uploadResponse.data?.filename || file.name,
				size: uploadResponse.data?.bytes || file.size,
				type: uploadResponse.data?.content_type || file.type,
				original_name: file.name,
				uploaded_at: uploadResponse.data?.created_at
					? new Date(uploadResponse.data.created_at * 1000).toISOString()
					: new Date().toISOString(),
				file_path: uploadResponse.data?.path,
				user_path: uploadResponse.data?.user_path,
				uploader_file_id: fileId
			}
		}

		// 添加可选的provider配置（遵从表单数据，有什么传什么）
		const converterConfig = buildProviderConfig(
			finalOptions.converterProviderId,
			finalOptions.converterProperties,
			'converter'
		)
		if (converterConfig) {
			request.converter = converterConfig
		}

		const extractionConfig = buildProviderConfig(
			finalOptions.extractorProviderId,
			finalOptions.extractorProperties,
			'extractor'
		)
		if (extractionConfig) {
			request.extraction = extractionConfig
		}

		// 3. 调用异步添加接口
		const addResponse = await kb.AddFileAsync(collection.id, request)

		if (window.$app.openapi.IsError(addResponse)) {
			throw new Error(addResponse.error?.error_description || 'Failed to add file to collection')
		}

		return addResponse.data?.job_id || ''
	}

	// 处理文本上传
	const handleTextUpload = async (
		kb: KB,
		data: AddDocumentData,
		collection: any,
		options: any
	): Promise<string> => {
		setCurrentStep(is_cn ? '正在处理文本...' : 'Processing text...')
		setUploadProgress(50)

		const finalOptions = getFinalOptions()

		const request: AddTextRequest = {
			collection_id: collection.id,
			text: data.content.content,
			locale: locale === 'zh-CN' ? 'zh' : 'en',
			chunking: buildProviderConfig(
				finalOptions.chunkingProviderId,
				finalOptions.chunkingProperties,
				'chunking'
			)!,
			embedding: buildEmbeddingConfig(collection, finalOptions.embeddingProperties),
			doc_id: '',
			metadata: {
				type: 'text',
				length: data.content.content.length,
				created_at: new Date().toISOString()
			}
		}

		// 添加可选的provider配置（遵从表单数据，有什么传什么）
		const extractionConfig = buildProviderConfig(
			finalOptions.extractorProviderId,
			finalOptions.extractorProperties,
			'extractor'
		)
		if (extractionConfig) {
			request.extraction = extractionConfig
		}

		setUploadProgress(100)

		const addResponse = await kb.AddTextAsync(collection.id, request)

		if (window.$app.openapi.IsError(addResponse)) {
			throw new Error(addResponse.error?.error_description || 'Failed to add text to collection')
		}

		return addResponse.data?.job_id || ''
	}

	// 处理URL上传
	const handleURLUpload = async (kb: KB, data: AddDocumentData, collection: any, options: any): Promise<string> => {
		setCurrentStep(is_cn ? '正在抓取URL内容...' : 'Fetching URL content...')
		setUploadProgress(50)

		const finalOptions = getFinalOptions()

		const request: AddURLRequest = {
			collection_id: collection.id,
			url: data.content.url,
			locale: locale === 'zh-CN' ? 'zh' : 'en',
			chunking: buildProviderConfig(
				finalOptions.chunkingProviderId,
				finalOptions.chunkingProperties,
				'chunking'
			)!,
			embedding: buildEmbeddingConfig(collection, finalOptions.embeddingProperties),
			doc_id: '',
			metadata: {
				source_url: data.content.url,
				title: data.content.title,
				fetched_at: new Date().toISOString()
			}
		}

		// 添加可选的provider配置（遵从表单数据，有什么传什么）
		const fetcherConfig = buildProviderConfig(
			finalOptions.fetcherProviderId,
			finalOptions.fetcherProperties,
			'fetcher'
		)
		if (fetcherConfig) {
			request.fetcher = fetcherConfig
		}

		const extractionConfig = buildProviderConfig(
			finalOptions.extractorProviderId,
			finalOptions.extractorProperties,
			'extractor'
		)
		if (extractionConfig) {
			request.extraction = extractionConfig
		}

		setUploadProgress(100)

		const addResponse = await kb.AddURLAsync(collection.id, request)

		if (window.$app.openapi.IsError(addResponse)) {
			throw new Error(addResponse.error?.error_description || 'Failed to add URL to collection')
		}

		return addResponse.data?.job_id || ''
	}

	const renderContent = () => {
		// 如果currentData为null，显示加载状态
		if (!currentData) {
			return <div>Loading...</div>
		}

		switch (activeTab) {
			case 'basic':
				return (
					<BasicTab
						ref={basicTabRef}
						data={currentData}
						options={basicOptions}
						onOptionsChange={handleBasicOptionsChange}
						onDataChange={handleDataChange}
						processing={processing}
						uploadProgress={uploadProgress}
					/>
				)
			case 'advanced':
				return (
					<AdvancedTab
						ref={advancedTabRef}
						data={currentData}
						options={advancedOptions}
						onOptionsChange={handleAdvancedOptionsChange}
					/>
				)
			default:
				return (
					<BasicTab
						ref={basicTabRef}
						data={currentData}
						options={basicOptions}
						onOptionsChange={handleBasicOptionsChange}
						onDataChange={handleDataChange}
						processing={processing}
						uploadProgress={uploadProgress}
					/>
				)
		}
	}

	const getModalTitle = () => {
		if (!currentData) return ''

		const typeLabels = {
			file: is_cn ? '文件' : 'File',
			text: is_cn ? '文本' : 'Text',
			url: is_cn ? 'URL' : 'URL'
		}
		const typeLabel = typeLabels[currentData.type] || ''
		if (collectionName) {
			return is_cn ? `添加${typeLabel}到「${collectionName}」` : `Add ${typeLabel} to "${collectionName}"`
		}
		return is_cn ? `添加${typeLabel}到知识库` : `Add ${typeLabel} to Knowledge Base`
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.titleSection}>
						<Icon name='material-add_circle_outline' size={16} />
						<span className={styles.modalTitle}>{getModalTitle()}</span>
					</div>
					<div className={styles.tabs}>
						{tabs.map((tab) => (
							<div
								key={tab.key}
								className={`${styles.tabItem} ${
									activeTab === tab.key ? styles.tabItemActive : ''
								}`}
								onClick={() => handleTabChange(tab.key)}
							>
								<Icon name={tab.icon} size={12} />
								<span>{tab.label}</span>
							</div>
						))}
					</div>
					<div
						className={`${styles.closeButton} ${processing ? styles.disabled : ''}`}
						onClick={processing ? undefined : onClose}
					>
						<Icon name='material-close' size={16} />
					</div>
				</div>
			}
			open={visible}
			onCancel={processing ? undefined : onClose}
			footer={
				<div className={styles.modalFooter}>
					<div className={styles.footerButtons}>
						<Button onClick={onClose} disabled={processing}>
							{is_cn ? '取消' : 'Cancel'}
						</Button>
						<Button
							type='primary'
							onClick={handleConfirm}
							loading={processing}
							disabled={processing}
						>
							{processing
								? is_cn
									? '处理中...'
									: 'Processing...'
								: is_cn
								? '确认添加'
								: 'Add to Collection'}
						</Button>
					</div>
				</div>
			}
			width='90%'
			style={{
				top: '5vh',
				paddingBottom: 0,
				maxWidth: '1200px'
			}}
			bodyStyle={{
				padding: 0,
				maxHeight: 'calc(100vh - 10vh - 120px)',
				overflow: 'auto'
			}}
			destroyOnClose
			closable={false}
			maskClosable={true}
			className={styles.addDocumentModal}
		>
			<div className={styles.modalContent}>{renderContent()}</div>
		</Modal>
	)
}

export default AddDocumentModal
